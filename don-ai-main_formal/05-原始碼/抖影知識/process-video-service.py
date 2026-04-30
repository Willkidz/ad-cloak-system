#!/usr/bin/env python3
import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Dict, List
from urllib.parse import urlparse

CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

import process_video as pv  # noqa: E402

SERVICE_HOST = os.environ.get("PROCESS_SERVICE_HOST", "0.0.0.0")
SERVICE_PORT = int(os.environ.get("PROCESS_SERVICE_PORT", "8787"))
SERVICE_TOKEN = os.environ.get("PROCESS_SERVICE_TOKEN", "")

config = pv.build_config()
logger = pv.setup_logger(config.log_dir)
processor = pv.VideoProcessor(config, logger)


class JsonHandler(BaseHTTPRequestHandler):
    server_version = "douyin-knowledge-service/1.0"

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/health":
            self.respond_json(200, {"status": "ok", "service": "douyin-knowledge", "port": SERVICE_PORT})
            return
        self.respond_json(404, {"status": "error", "message": "Not Found"})

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path != "/process":
            self.respond_json(404, {"status": "error", "message": "Not Found"})
            return

        if SERVICE_TOKEN:
            auth_header = self.headers.get("Authorization", "")
            expected = f"Bearer {SERVICE_TOKEN}"
            if auth_header != expected:
                self.respond_json(401, {"status": "error", "message": "Unauthorized"})
                return

        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0
        raw = self.rfile.read(length) if length > 0 else b"{}"
        try:
            payload = json.loads(raw.decode("utf-8")) if raw else {}
        except json.JSONDecodeError:
            self.respond_json(400, {"status": "error", "message": "Invalid JSON body"})
            return

        try:
            urls = collect_urls_from_payload(payload)
            logger.info("HTTP service accepted %s URL(s)", len(urls))
            result = processor.process_many(urls)
            http_status = 200 if result.get("failure_count", 0) == 0 else 207
            self.respond_json(http_status, result)
        except Exception as exc:
            logger.exception("HTTP service processing failed: %s", exc)
            self.respond_json(500, {"status": "error", "message": str(exc)})

    def log_message(self, format: str, *args: Any) -> None:
        logger.info("HTTP access | %s - %s", self.address_string(), format % args)

    def respond_json(self, status_code: int, payload: Dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def collect_urls_from_payload(payload: Dict[str, Any]) -> List[str]:
    urls: List[str] = []
    single = payload.get("url")
    many = payload.get("urls")
    if isinstance(single, str) and single.strip():
        urls.append(single.strip())
    if isinstance(many, list):
        for item in many:
            if isinstance(item, str) and item.strip():
                urls.append(item.strip())
    if not urls:
        raise pv.ProcessingError("Request body must contain 'url' or 'urls'.")
    cleaned: List[str] = []
    seen = set()
    for url in urls:
        normalized = pv.normalize_url(url)
        if normalized not in seen:
            seen.add(normalized)
            cleaned.append(normalized)
    return cleaned


def main() -> None:
    logger.info("Starting HTTP service on %s:%s", SERVICE_HOST, SERVICE_PORT)
    server = ThreadingHTTPServer((SERVICE_HOST, SERVICE_PORT), JsonHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("HTTP service interrupted, shutting down")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
