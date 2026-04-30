Content-Disposition: form-data; name="line-redirect-modified.js"

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// line-redirect-modified.js
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
function parseUserAgent(ua) {
  const result = {
    os: null,
    os_version: null,
    device_model: null,
    device_brand: null,
    browser: null,
    browser_version: null,
    source_app: null
  };
  if (!ua) return result;
  if (ua.includes("FBAN")) {
    result.source_app = "Facebook App";
  } else if (ua.includes("Instagram")) {
    result.source_app = "Instagram";
  } else if (ua.includes("Line")) {
    result.source_app = "LINE App";
  } else {
    result.source_app = "Browser";
  }
  if (ua.includes("iPhone")) {
    result.os = "iOS";
    result.device_model = "iPhone";
    result.device_brand = "Apple";
    const iosMatch = ua.match(/OS (\d+)_(\d+)/);
    if (iosMatch) {
      result.os_version = `${iosMatch[1]}.${iosMatch[2]}`;
    }
  } else if (ua.includes("iPad")) {
    result.os = "iOS";
    result.device_model = "iPad";
    result.device_brand = "Apple";
    const iosMatch = ua.match(/OS (\d+)_(\d+)/);
    if (iosMatch) {
      result.os_version = `${iosMatch[1]}.${iosMatch[2]}`;
    }
  } else if (ua.includes("Android")) {
    result.os = "Android";
    const androidMatch = ua.match(/Android ([\d.]+)/);
    if (androidMatch) {
      result.os_version = androidMatch[1];