#!/usr/bin/env python3
import argparse
import json
import logging
import os
import re
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence

import requests

APIFY_ACTOR_ID = "apple_yang~douyin-transcripts-scraper"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
REQUEST_TIMEOUT = 120
TRANSCRIPT_FALLBACK_LIMIT = 20000


class ProcessingError(Exception):
    pass


@dataclass
class AppConfig:
    apify_api_token: str
    openrouter_api_key: str
    openrouter_model: str
    cf_account_id: str
    cf_api_token: str
    cf_d1_database_id: str
    project_root: Path
    log_dir: Path
    env_path: Path


@dataclass
class VideoProcessResult:
    input_url: str
    aweme_id: Optional[str]
    status: str
    message: str
    inserted_video: bool = False
    transcript_saved: bool = False
    summary_saved: bool = False
    content_score: Optional[int] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "input_url": self.input_url,
            "aweme_id": self.aweme_id,
            "status": self.status,
            "message": self.message,
            "inserted_video": self.inserted_video,
            "transcript_saved": self.transcript_saved,
            "summary_saved": self.summary_saved,
            "content_score": self.content_score,
        }


class D1Client:
    def __init__(self, config: AppConfig, logger: logging.Logger) -> None:
        self.config = config
        self.logger = logger
        self.url = (
            f"https://api.cloudflare.com/client/v4/accounts/{config.cf_account_id}"
            f"/d1/database/{config.cf_d1_database_id}/query"
        )
        self.session = requests.Session()
        self.session.headers.update(
            {
                "Authorization": f"Bearer {config.cf_api_token}",
                "Content-Type": "application/json",
            }
        )

    def execute(self, sql: str, params: Optional[Sequence[Any]] = None) -> List[Dict[str, Any]]:
        payload: Dict[str, Any] = {"sql": sql}
        if params is not None:
            payload["params"] = list(params)
        self.logger.debug("Executing D1 SQL", extra={"sql": sql, "params": payload.get("params")})
        response = self.session.post(self.url, json=payload, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        body = response.json()
        if not body.get("success"):
            raise ProcessingError(f"D1 API failed: {json.dumps(body, ensure_ascii=False)}")
        result = body.get("result") or []
        if not result:
            return []
        first = result[0]
        if not first.get("success", True):
            raise ProcessingError(f"D1 SQL failed: {json.dumps(body, ensure_ascii=False)}")
        return first.get("results", []) or []

    def scalar(self, sql: str, params: Optional[Sequence[Any]] = None, field: str = "value") -> Any:
        rows = self.execute(sql, params)
        if not rows:
            return None
        row = rows[0]
        if field in row:
            return row[field]
        if len(row) == 1:
            return next(iter(row.values()))
        return row


class ApifyClient:
    def __init__(self, config: AppConfig, logger: logging.Logger) -> None:
        self.config = config
        self.logger = logger
        self.session = requests.Session()

    def fetch_transcript(self, video_url: str) -> Dict[str, Any]:
        endpoint = (
            f"https://api.apify.com/v2/acts/{APIFY_ACTOR_ID}"
            f"/run-sync-get-dataset-items?token={self.config.apify_api_token}"
        )
        payload = {"videoUrl": video_url}
        self.logger.info("Calling Apify actor for video", extra={"video_url": video_url})
        response = self.session.post(endpoint, json=payload, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        data = response.json()
        if isinstance(data, dict) and data.get("data"):
            data = data["data"]
        if not isinstance(data, list) or not data:
            raise ProcessingError(f"Apify returned empty output for URL: {video_url}")
        item = data[0]
        if not isinstance(item, dict):
            raise ProcessingError(f"Apify returned unexpected item format: {type(item)}")
        err_msg = item.get("errMsg") or item.get("error")
        if err_msg:
            raise ProcessingError(f"Apify actor error: {err_msg}")
        return item


class OpenRouterClient:
    def __init__(self, config: AppConfig, logger: logging.Logger) -> None:
        self.config = config
        self.logger = logger
        self.session = requests.Session()
        self.session.headers.update(
            {
                "Authorization": f"Bearer {config.openrouter_api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://douyin-knowledge.local",
                "X-Title": "douyin-knowledge",
            }
        )

    def summarize(self, title: str, author: str, transcript: str) -> Dict[str, Any]:
        safe_transcript = (transcript or "").strip()
        if not safe_transcript:
            raise ProcessingError("Transcript is empty, cannot generate summary.")
        if len(safe_transcript) > TRANSCRIPT_FALLBACK_LIMIT:
            safe_transcript = safe_transcript[:TRANSCRIPT_FALLBACK_LIMIT]

        prompt = f"""你是一個專業的影片內容摘要助手。請用繁體中文輸出。

請為以下抖音影片逐字稿生成結構化摘要：

1. 一句話摘要（30字以內）
2. 核心重點（3-5個要點，每個要點一句話）
3. 分類標籤（3-5個標籤）
4. 內容評分（1-10分，根據資訊密度和實用性）

影片標題：{title or '未提供'}
作者：{author or '未提供'}
逐字稿：{safe_transcript}

請嚴格只輸出 JSON，格式如下：
{{
  "one_sentence_summary": "30字以內的摘要",
  "key_points": ["要點1", "要點2", "要點3"],
  "tags": ["標籤1", "標籤2", "標籤3"],
  "content_score": 8
}}"""
        payload = {
            "model": self.config.openrouter_model,
            "temperature": 0.2,
            "messages": [
                {
                    "role": "system",
                    "content": "你是專業的繁體中文摘要助手。你必須只輸出合法 JSON，不要加入 Markdown、說明文字或程式碼區塊。",
                },
                {"role": "user", "content": prompt},
            ],
        }
        self.logger.info("Calling OpenRouter for summary generation")
        response = self.session.post(OPENROUTER_URL, json=payload, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        body = response.json()
        try:
            content = body["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise ProcessingError(f"OpenRouter response format invalid: {json.dumps(body, ensure_ascii=False)}") from exc
        parsed = parse_json_payload(content)
        if not isinstance(parsed.get("key_points"), list):
            parsed["key_points"] = []
        if not isinstance(parsed.get("tags"), list):
            parsed["tags"] = []
        parsed["content_score"] = clamp_score(parsed.get("content_score"))
        return parsed


class VideoProcessor:
    def __init__(self, config: AppConfig, logger: logging.Logger) -> None:
        self.config = config
        self.logger = logger
        self.d1 = D1Client(config, logger)
        self.apify = ApifyClient(config, logger)
        self.openrouter = OpenRouterClient(config, logger)

    def process_many(self, urls: Sequence[str]) -> Dict[str, Any]:
        started_at = utc_now_iso()
        results: List[Dict[str, Any]] = []
        success_count = 0
        failure_count = 0

        for url in urls:
            result = self.process_one(url)
            results.append(result.to_dict())
            if result.status == "success":
                success_count += 1
            else:
                failure_count += 1

        return {
            "started_at": started_at,
            "finished_at": utc_now_iso(),
            "total": len(urls),
            "success_count": success_count,
            "failure_count": failure_count,
            "results": results,
        }

    def process_one(self, input_url: str) -> VideoProcessResult:
        aweme_id: Optional[str] = None
        try:
            normalized_url = normalize_url(input_url)
            aweme_id = extract_aweme_id(normalized_url)
            apify_data = self.apify.fetch_transcript(normalized_url)
            merged_url = apify_data.get("url") or normalized_url
            aweme_id = aweme_id or extract_aweme_id(merged_url)
            if not aweme_id:
                raise ProcessingError("Unable to determine aweme_id from URL or actor output.")

            video_record = build_video_record(aweme_id, normalized_url, apify_data)
            transcript_text = build_transcript_text(apify_data)
            if not transcript_text:
                raise ProcessingError("Apify output does not contain transcript text.")

            summary = self.openrouter.summarize(
                title=video_record["title"] or "",
                author=video_record["author"] or "",
                transcript=transcript_text,
            )

            already_exists = self.video_exists(aweme_id)
            self.upsert_video(video_record)
            self.replace_transcript(aweme_id, transcript_text, apify_data)
            self.replace_summary(aweme_id, summary)
            self.insert_search_log(normalized_url, 0 if already_exists else 1)

            self.logger.info(
                "Video processed successfully",
                extra={"input_url": normalized_url, "aweme_id": aweme_id},
            )
            return VideoProcessResult(
                input_url=normalized_url,
                aweme_id=aweme_id,
                status="success",
                message="Video processed and stored in D1 successfully.",
                inserted_video=not already_exists,
                transcript_saved=True,
                summary_saved=True,
                content_score=summary.get("content_score"),
            )
        except requests.HTTPError as exc:
            body = ""
            if exc.response is not None:
                try:
                    body = exc.response.text[:1000]
                except Exception:
                    body = ""
            message = f"HTTP error: {exc}. {body}".strip()
            self.logger.exception("HTTP request failed during video processing")
            self.insert_failed_search_log(input_url)
            return VideoProcessResult(input_url=input_url, aweme_id=aweme_id, status="failed", message=message)
        except Exception as exc:
            self.logger.exception("Video processing failed")
            self.insert_failed_search_log(input_url)
            return VideoProcessResult(input_url=input_url, aweme_id=aweme_id, status="failed", message=str(exc))

    def video_exists(self, aweme_id: str) -> bool:
        sql = "SELECT COUNT(*) AS value FROM videos WHERE aweme_id = ?"
        count = self.d1.scalar(sql, [aweme_id], field="value")
        return int(count or 0) > 0

    def upsert_video(self, video: Dict[str, Any]) -> None:
        sql = (
            "INSERT INTO videos (aweme_id, title, author, author_id, url, cover_url, duration, play_count, like_count, comment_count, share_count, collect_count, publish_time, search_keyword, category, status) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) "
            "ON CONFLICT(aweme_id) DO UPDATE SET "
            "title = excluded.title, "
            "author = excluded.author, "
            "author_id = excluded.author_id, "
            "url = excluded.url, "
            "cover_url = excluded.cover_url, "
            "duration = excluded.duration, "
            "play_count = excluded.play_count, "
            "like_count = excluded.like_count, "
            "comment_count = excluded.comment_count, "
            "share_count = excluded.share_count, "
            "collect_count = excluded.collect_count, "
            "publish_time = excluded.publish_time, "
            "search_keyword = excluded.search_keyword, "
            "category = excluded.category, "
            "status = excluded.status, "
            "updated_at = CURRENT_TIMESTAMP"
        )
        params = [
            video["aweme_id"],
            video["title"],
            video["author"],
            video["author_id"],
            video["url"],
            video["cover_url"],
            video["duration"],
            video["play_count"],
            video["like_count"],
            video["comment_count"],
            video["share_count"],
            video["collect_count"],
            video["publish_time"],
            video.get("search_keyword"),
            video.get("category"),
            video["status"],
        ]
        self.d1.execute(sql, params)

    def replace_transcript(self, aweme_id: str, transcript_text: str, apify_data: Dict[str, Any]) -> None:
        self.d1.execute("DELETE FROM transcripts WHERE aweme_id = ?", [aweme_id])
        sql = (
            "INSERT INTO transcripts (aweme_id, transcript_text, language, whisper_model, duration_seconds) "
            "VALUES (?, ?, ?, ?, ?)"
        )
        params = [
            aweme_id,
            transcript_text,
            apify_data.get("language") or "zh",
            "apify-transcripts",
            to_float(apify_data.get("duration")),
        ]
        self.d1.execute(sql, params)

    def replace_summary(self, aweme_id: str, summary: Dict[str, Any]) -> None:
        self.d1.execute("DELETE FROM summaries WHERE aweme_id = ?", [aweme_id])
        sql = (
            "INSERT INTO summaries (aweme_id, summary_text, key_points, tags, gpt_model) "
            "VALUES (?, ?, ?, ?, ?)"
        )
        params = [
            aweme_id,
            summary.get("one_sentence_summary") or "",
            json.dumps(summary.get("key_points") or [], ensure_ascii=False),
            json.dumps(summary.get("tags") or [], ensure_ascii=False),
            self.config.openrouter_model,
        ]
        self.d1.execute(sql, params)

    def insert_search_log(self, video_url: str, new_videos: int) -> None:
        sql = (
            "INSERT INTO search_logs (keyword, video_url, api_source, result_count, new_videos) "
            "VALUES (?, ?, ?, ?, ?)"
        )
        self.d1.execute(sql, [None, video_url, "apify", 1, new_videos])

    def insert_failed_search_log(self, video_url: str) -> None:
        try:
            sql = (
                "INSERT INTO search_logs (keyword, video_url, api_source, result_count, new_videos) "
                "VALUES (?, ?, ?, ?, ?)"
            )
            self.d1.execute(sql, [None, video_url, "apify", 0, 0])
        except Exception:
            self.logger.exception("Failed to record failed search log")


def load_env_file(env_path: Path) -> Dict[str, str]:
    values: Dict[str, str] = {}
    if not env_path.exists():
        return values
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def build_config() -> AppConfig:
    project_root = Path(__file__).resolve().parent.parent
    env_path = project_root / ".env"
    log_dir = project_root / "logs"
    env_values = load_env_file(env_path)
    for key, value in env_values.items():
        os.environ.setdefault(key, value)

    def require(name: str) -> str:
        value = os.environ.get(name, "").strip()
        if not value:
            raise ProcessingError(f"Missing required environment variable: {name}")
        return value

    return AppConfig(
        apify_api_token=require("APIFY_API_TOKEN"),
        openrouter_api_key=require("OPENROUTER_API_KEY"),
        openrouter_model=require("OPENROUTER_MODEL"),
        cf_account_id=require("CF_ACCOUNT_ID"),
        cf_api_token=require("CF_API_TOKEN"),
        cf_d1_database_id=require("CF_D1_DATABASE_ID"),
        project_root=project_root,
        log_dir=log_dir,
        env_path=env_path,
    )


def setup_logger(log_dir: Path) -> logging.Logger:
    log_dir.mkdir(parents=True, exist_ok=True)
    logger = logging.getLogger("douyin_knowledge")
    logger.setLevel(logging.INFO)
    logger.handlers.clear()

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    log_file = log_dir / f"process-video-{datetime.now().strftime('%Y%m%d')}.log"

    file_handler = logging.FileHandler(log_file, encoding="utf-8")
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.INFO)

    stream_handler = logging.StreamHandler(sys.stdout)
    stream_handler.setFormatter(formatter)
    stream_handler.setLevel(logging.INFO)

    logger.addHandler(file_handler)
    logger.addHandler(stream_handler)
    logger.propagate = False
    return logger


def normalize_url(url: str) -> str:
    value = (url or "").strip()
    if not value:
        raise ProcessingError("Received empty Douyin URL.")
    return value


def extract_aweme_id(url: Optional[str]) -> Optional[str]:
    if not url:
        return None
    patterns = [
        r"/video/(\d+)",
        r"aweme_id=(\d+)",
        r"modal_id=(\d+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def build_transcript_text(apify_data: Dict[str, Any]) -> str:
    text = (apify_data.get("text") or "").strip()
    if text:
        return text
    segments = apify_data.get("segments") or []
    if not isinstance(segments, list):
        return ""
    pieces: List[str] = []
    for segment in segments:
        if not isinstance(segment, dict):
            continue
        segment_text = (segment.get("text") or "").strip()
        if segment_text:
            pieces.append(segment_text)
    return "\n".join(pieces).strip()


def build_video_record(aweme_id: str, input_url: str, apify_data: Dict[str, Any]) -> Dict[str, Any]:
    publish_time = parse_publish_time(apify_data.get("createTime") or apify_data.get("publishTime"))
    return {
        "aweme_id": aweme_id,
        "title": (apify_data.get("title") or apify_data.get("desc") or "").strip() or None,
        "author": (apify_data.get("nickname") or apify_data.get("author") or "").strip() or None,
        "author_id": first_non_empty(
            apify_data.get("authorId"),
            apify_data.get("author_id"),
            apify_data.get("uid"),
            apify_data.get("secUid"),
        ),
        "url": (apify_data.get("url") or input_url).strip(),
        "cover_url": first_non_empty(
            apify_data.get("coverUrl"),
            apify_data.get("cover"),
            apify_data.get("dynamicCover"),
            apify_data.get("originCover"),
            apify_data.get("avatarUri"),
        ),
        "duration": to_int_round(apify_data.get("duration")),
        "play_count": to_int(apify_data.get("playCount")),
        "like_count": to_int(apify_data.get("diggCount") or apify_data.get("likeCount")),
        "comment_count": to_int(apify_data.get("commentCount")),
        "share_count": to_int(apify_data.get("shareCount")),
        "collect_count": to_int(apify_data.get("collectCount")),
        "publish_time": publish_time,
        "search_keyword": None,
        "category": None,
        "status": "completed",
    }


def parse_publish_time(value: Any) -> Optional[str]:
    if value in (None, ""):
        return None
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(float(value), tz=timezone.utc).isoformat()
    text = str(value).strip()
    if text.isdigit():
        return datetime.fromtimestamp(float(text), tz=timezone.utc).isoformat()
    return text


def first_non_empty(*values: Any) -> Optional[str]:
    for value in values:
        if value is None:
            continue
        text = str(value).strip()
        if text:
            return text
    return None


def to_int(value: Any) -> Optional[int]:
    if value in (None, ""):
        return None
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def to_int_round(value: Any) -> Optional[int]:
    if value in (None, ""):
        return None
    try:
        return int(round(float(value)))
    except (TypeError, ValueError):
        return None


def to_float(value: Any) -> Optional[float]:
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def clamp_score(value: Any) -> Optional[int]:
    numeric = to_int(value)
    if numeric is None:
        return None
    return max(1, min(10, numeric))


def parse_json_payload(content: str) -> Dict[str, Any]:
    text = (content or "").strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z0-9_-]*\n", "", text)
        text = re.sub(r"\n```$", "", text)
    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass

    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        snippet = text[start : end + 1]
        try:
            parsed = json.loads(snippet)
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError as exc:
            raise ProcessingError(f"OpenRouter returned non-JSON content: {content}") from exc
    raise ProcessingError(f"OpenRouter returned non-JSON content: {content}")


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Process Douyin video URLs into transcript summaries and store them in D1.")
    parser.add_argument("--url", help="Single Douyin video URL")
    parser.add_argument("--urls", nargs="+", help="Multiple Douyin video URLs")
    parser.add_argument("--urls-file", help="Text file containing one Douyin URL per line")
    return parser.parse_args()


def collect_urls(args: argparse.Namespace) -> List[str]:
    urls: List[str] = []
    if args.url:
        urls.append(args.url)
    if args.urls:
        urls.extend(args.urls)
    if args.urls_file:
        path = Path(args.urls_file)
        if not path.exists():
            raise ProcessingError(f"URLs file not found: {path}")
        for line in path.read_text(encoding="utf-8").splitlines():
            cleaned = line.strip()
            if cleaned:
                urls.append(cleaned)
    deduplicated: List[str] = []
    seen = set()
    for url in urls:
        normalized = normalize_url(url)
        if normalized not in seen:
            seen.add(normalized)
            deduplicated.append(normalized)
    if not deduplicated:
        raise ProcessingError("No Douyin URLs were provided. Use --url, --urls, or --urls-file.")
    return deduplicated


def main() -> int:
    args = parse_args()
    bootstrap_logger = logging.getLogger("douyin_bootstrap")
    bootstrap_logger.addHandler(logging.StreamHandler(sys.stdout))
    bootstrap_logger.setLevel(logging.INFO)

    try:
        config = build_config()
        logger = setup_logger(config.log_dir)
        urls = collect_urls(args)
        logger.info("Starting Douyin video processing job")
        logger.info("Loaded environment file from %s", config.env_path)
        logger.info("Processing %s URL(s)", len(urls))

        processor = VideoProcessor(config, logger)
        result = processor.process_many(urls)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0 if result["success_count"] > 0 else 1
    except Exception as exc:
        bootstrap_logger.exception("Fatal error during job bootstrap: %s", exc)
        error_payload = {
            "started_at": utc_now_iso(),
            "finished_at": utc_now_iso(),
            "total": 0,
            "success_count": 0,
            "failure_count": 1,
            "results": [
                {
                    "input_url": args.url if hasattr(args, "url") else None,
                    "aweme_id": None,
                    "status": "failed",
                    "message": str(exc),
                    "inserted_video": False,
                    "transcript_saved": False,
                    "summary_saved": False,
                    "content_score": None,
                }
            ],
        }
        print(json.dumps(error_payload, ensure_ascii=False, indent=2))
        return 1


if __name__ == "__main__":
    sys.exit(main())
