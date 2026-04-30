// src/index.ts
var src_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }
    let id = null;
    const previewMatch = path.match(/^\/preview\/([\w-]+)$/);
    const directMatch = path.match(/^\/([\w-]+)$/);
    if (previewMatch) {
      id = previewMatch[1];
    } else if (directMatch) {
      id = directMatch[1];
    }
    if (path === "/" || path === "") {
      return new Response(
        `<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="utf-8"><title>\u7D20\u6750\u9810\u89BD\u670D\u52D9</title>
<style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8f9fa;color:#333;}
.box{text-align:center;padding:2rem;}.box h1{font-size:1.5rem;margin-bottom:0.5rem;}.box p{color:#666;}</style>
</head>
<body><div class="box"><h1>\u6597\u7BF7\u7D20\u6750\u9810\u89BD\u670D\u52D9</h1><p>\u8ACB\u4F7F\u7528 /{id} \u9810\u89BD\u6307\u5B9A\u7D20\u6750</p></div></body>
</html>`,
        { headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }
    if (!id) {
      return new Response(
        `<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="utf-8"><title>404 - \u627E\u4E0D\u5230\u9801\u9762</title>
<style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8f9fa;color:#333;}
.box{text-align:center;padding:2rem;}.box h1{font-size:3rem;margin-bottom:0.5rem;color:#dc3545;}.box p{color:#666;}</style>
</head>
<body><div class="box"><h1>404</h1><p>\u627E\u4E0D\u5230\u9801\u9762\uFF0C\u8ACB\u78BA\u8A8D URL \u683C\u5F0F\u70BA /{\u7D20\u6750ID}</p></div></body>
</html>`,
        { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }
    try {
      const result = await env.DB.prepare(
        "SELECT id, name, type, content FROM templates WHERE id = ?"
      ).bind(id).first();
      if (!result) {
        return new Response(
          `<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="utf-8"><title>404 - \u7D20\u6750\u4E0D\u5B58\u5728</title>
<style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8f9fa;color:#333;}
.box{text-align:center;padding:2rem;}.box h1{font-size:3rem;margin-bottom:0.5rem;color:#dc3545;}.box p{color:#666;}</style>
</head>
<body><div class="box"><h1>404</h1><p>\u7D20\u6750 ID ${id} \u4E0D\u5B58\u5728</p></div></body>
</html>`,
          { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
      }
      const templateType = result.type;
      const templateName = result.name || "";
      const content = result.content;
      if (templateType === "money_page") {
        try {
          const response = await fetch("https://money-page.laoqin1689.workers.dev/");
          return new Response(response.body, {
            status: response.status,
            headers: {
              ...Object.fromEntries(response.headers),
              "X-Template-Id": id,
              "X-Template-Name": encodeURIComponent(templateName)
            }
          });
        } catch (err) {
          return new Response(
            `<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="utf-8"><title>500 - \u7121\u6CD5\u8F09\u5165\u63A8\u5EE3\u9801</title>
<style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8f9fa;color:#333;}
.box{text-align:center;padding:2rem;}.box h1{font-size:3rem;margin-bottom:0.5rem;color:#dc3545;}.box p{color:#666;}</style>
</head>
<body><div class="box"><h1>500</h1><p>\u7121\u6CD5\u8F09\u5165\u63A8\u5EE3\u9801\uFF1A${err.message}</p></div></body>
</html>`,
            { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
          );
        }
      }
      if (templateType === "safe_page") {
        try {
          const response = await fetch("https://safe-page.laoqin1689.workers.dev/");
          return new Response(response.body, {
            status: response.status,
            headers: {
              ...Object.fromEntries(response.headers),
              "X-Template-Id": id,
              "X-Template-Name": encodeURIComponent(templateName)
            }
          });
        } catch (err) {
          return new Response(
            `<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="utf-8"><title>500 - \u7121\u6CD5\u8F09\u5165\u5B89\u5168\u9801</title>
<style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8f9fa;color:#333;}
.box{text-align:center;padding:2rem;}.box h1{font-size:3rem;margin-bottom:0.5rem;color:#dc3545;}.box p{color:#666;}</style>
</head>
<body><div class="box"><h1>500</h1><p>\u7121\u6CD5\u8F09\u5165\u5B89\u5168\u9801\uFF1A${err.message}</p></div></body>
</html>`,
            { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
          );
        }
      }
      if (!content) {
        return new Response(
          `<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="utf-8"><title>\u7121\u9810\u89BD\u5167\u5BB9</title>
<style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8f9fa;color:#333;}
.box{text-align:center;padding:2rem;}.box h1{font-size:1.5rem;margin-bottom:0.5rem;}.box p{color:#666;}</style>
</head>
<body><div class="box"><h1>\u6B64\u7D20\u6750\u7121\u9810\u89BD\u5167\u5BB9</h1><p>\u7D20\u6750\u300C${templateName}\u300D\u5C1A\u672A\u8A2D\u5B9A HTML \u5167\u5BB9</p></div></body>
</html>`,
          { headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
      }
      return new Response(content, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "X-Template-Id": id,
          "X-Template-Name": encodeURIComponent(templateName)
        }
      });
    } catch (err) {
      return new Response(
        `<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="utf-8"><title>500 - \u4F3A\u670D\u5668\u932F\u8AA4</title>
<style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8f9fa;color:#333;}
.box{text-align:center;padding:2rem;}.box h1{font-size:3rem;margin-bottom:0.5rem;color:#dc3545;}.box p{color:#666;}</style>
</head>
<body><div class="box"><h1>500</h1><p>\u4F3A\u670D\u5668\u932F\u8AA4\uFF1A${err.message}</p></div></body>
</html>`,
        { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }
  }
};
export {
  src_default as default
};
//# sourceMappingURL=index.js.map

