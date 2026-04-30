// node_modules/hono/dist/compose.js
var compose = (middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err2) {
          if (err2 instanceof Error && onError) {
            context.error = err2;
            res = await onError(err2, context);
            isError = true;
          } else {
            throw err2;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
  };
};

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/body.js
var parseBody = async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
};
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
var handleParsingAllValues = (form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
};
var handleParsingNestedValues = (form, key, value) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
};

// node_modules/hono/dist/utils/url.js
var splitPath = (path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
};
var splitRoutingPath = (routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
};
var extractGroupsFromPath = (path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
};
var replaceGroupMarks = (paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
};
var patternCache = {};
var getPattern = (label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
};
var tryDecode = (str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
};
var tryDecodeURI = (str) => tryDecode(str, decodeURI);
var getPath = (request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
};
var getPathNoStrict = (request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
};
var mergePath = (base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
};
var checkOptionalParameter = (path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
};
var _decodeURI = (value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
};
var _getQueryParam = (url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key) => {
  return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var tryDecodeURIComponent = (str) => tryDecode(str, decodeURIComponent_);
var HonoRequest = class {
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  };
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = (value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
};
var resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
};

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = (contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
};
var createResponseInstance = (body, init) => new Response(body, init);
var Context = class {
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = (layout) => this.#layout = layout;
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = () => this.#layout;
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = (name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  };
  status = (status) => {
    this.#status = status;
  };
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, { status, headers: responseHeaders });
  }
  newResponse = (...args) => this.#newResponse(...args);
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = (text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  };
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = (object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  };
  html = (html, arg, headers) => {
    const res = (html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers));
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  };
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = (location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  };
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = () => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  };
};

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = (c) => {
  return c.text("404 Not Found", 404);
};
var errorHandler = (err2, c) => {
  if ("getResponse" in err2) {
    const res = err2.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err2);
  return c.text("Internal Server Error", 500);
};
var Hono = class _Hono {
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res;
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = (handler) => {
    this.errorHandler = handler;
    return this;
  };
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = (handler) => {
    this.#notFoundHandler = handler;
    return this;
  };
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = (request) => request;
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    };
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { basePath: this._basePath, path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err2, c) {
    if (err2 instanceof Error) {
      return this.errorHandler(err2, c);
    }
    throw err2;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err2) {
        return this.#handleError(err2, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err2) => this.#handleError(err2, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err2) {
        return this.#handleError(err2, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  };
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
};

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = ((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  });
  this.match = match2;
  return match2(method, path);
}

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var Node = class _Node {
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
var RegExpRouter = class {
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router6 = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router6.add(...routes[i2]);
        }
        res = router6.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router6.match.bind(router6);
      this.#routers = [router6];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var hasChildren = (children) => {
  for (const _ in children) {
    return true;
  }
  return false;
};
var Node2 = class _Node2 {
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              this.#pushHandlerSets(handlerSets, astNode, method, node.#params);
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          if (matcher instanceof RegExp) {
            if (partOffsets === null) {
              partOffsets = new Array(len);
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.substring(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (hasChildren(child.#children)) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// node_modules/hono/dist/middleware/cors/index.js
var cors = (options) => {
  const defaults = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: []
  };
  const opts = {
    ...defaults,
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        if (opts.credentials) {
          return (origin) => origin || null;
        }
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*" || opts.credentials) {
        set("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*" || opts.credentials) {
      c.header("Vary", "Origin", { append: true });
    }
  };
};

// node_modules/fflate/esm/index.mjs
import { createRequire } from "module";
var require2 = createRequire("/");
var Worker;
try {
  Worker = require2("worker_threads").Worker;
} catch (e) {
}
var u8 = Uint8Array;
var u16 = Uint16Array;
var i32 = Int32Array;
var fleb = new u8([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  2,
  2,
  2,
  2,
  3,
  3,
  3,
  3,
  4,
  4,
  4,
  4,
  5,
  5,
  5,
  5,
  0,
  /* unused */
  0,
  0,
  /* impossible */
  0
]);
var fdeb = new u8([
  0,
  0,
  0,
  0,
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  10,
  10,
  11,
  11,
  12,
  12,
  13,
  13,
  /* unused */
  0,
  0
]);
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
var freb = function(eb, start) {
  var b = new u16(31);
  for (var i = 0; i < 31; ++i) {
    b[i] = start += 1 << eb[i - 1];
  }
  var r = new i32(b[30]);
  for (var i = 1; i < 30; ++i) {
    for (var j = b[i]; j < b[i + 1]; ++j) {
      r[j] = j - b[i] << 5 | i;
    }
  }
  return { b, r };
};
var _a = freb(fleb, 2);
var fl = _a.b;
var revfl = _a.r;
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0);
var fd = _b.b;
var revfd = _b.r;
var rev = new u16(32768);
for (i = 0; i < 32768; ++i) {
  x = (i & 43690) >> 1 | (i & 21845) << 1;
  x = (x & 52428) >> 2 | (x & 13107) << 2;
  x = (x & 61680) >> 4 | (x & 3855) << 4;
  rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
}
var x;
var i;
var hMap = (function(cd, mb, r) {
  var s = cd.length;
  var i = 0;
  var l = new u16(mb);
  for (; i < s; ++i) {
    if (cd[i])
      ++l[cd[i] - 1];
  }
  var le = new u16(mb);
  for (i = 1; i < mb; ++i) {
    le[i] = le[i - 1] + l[i - 1] << 1;
  }
  var co;
  if (r) {
    co = new u16(1 << mb);
    var rvb = 15 - mb;
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        var sv = i << 4 | cd[i];
        var r_1 = mb - cd[i];
        var v = le[cd[i] - 1]++ << r_1;
        for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
          co[rev[v] >> rvb] = sv;
        }
      }
    }
  } else {
    co = new u16(s);
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        co[i] = rev[le[cd[i] - 1]++] >> 15 - cd[i];
      }
    }
  }
  return co;
});
var flt = new u8(288);
for (i = 0; i < 144; ++i)
  flt[i] = 8;
var i;
for (i = 144; i < 256; ++i)
  flt[i] = 9;
var i;
for (i = 256; i < 280; ++i)
  flt[i] = 7;
var i;
for (i = 280; i < 288; ++i)
  flt[i] = 8;
var i;
var fdt = new u8(32);
for (i = 0; i < 32; ++i)
  fdt[i] = 5;
var i;
var flrm = /* @__PURE__ */ hMap(flt, 9, 1);
var fdrm = /* @__PURE__ */ hMap(fdt, 5, 1);
var max = function(a) {
  var m = a[0];
  for (var i = 1; i < a.length; ++i) {
    if (a[i] > m)
      m = a[i];
  }
  return m;
};
var bits = function(d, p, m) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8) >> (p & 7) & m;
};
var bits16 = function(d, p) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8 | d[o + 2] << 16) >> (p & 7);
};
var shft = function(p) {
  return (p + 7) / 8 | 0;
};
var slc = function(v, s, e) {
  if (s == null || s < 0)
    s = 0;
  if (e == null || e > v.length)
    e = v.length;
  return new u8(v.subarray(s, e));
};
var ec = [
  "unexpected EOF",
  "invalid block type",
  "invalid length/literal",
  "invalid distance",
  "stream finished",
  "no stream handler",
  ,
  "no callback",
  "invalid UTF-8 data",
  "extra field too long",
  "date not in range 1980-2099",
  "filename too long",
  "stream finishing",
  "invalid zip data"
  // determined by unknown compression method
];
var err = function(ind, msg, nt) {
  var e = new Error(msg || ec[ind]);
  e.code = ind;
  if (Error.captureStackTrace)
    Error.captureStackTrace(e, err);
  if (!nt)
    throw e;
  return e;
};
var inflt = function(dat, st, buf, dict) {
  var sl = dat.length, dl = dict ? dict.length : 0;
  if (!sl || st.f && !st.l)
    return buf || new u8(0);
  var noBuf = !buf;
  var resize = noBuf || st.i != 2;
  var noSt = st.i;
  if (noBuf)
    buf = new u8(sl * 3);
  var cbuf = function(l2) {
    var bl = buf.length;
    if (l2 > bl) {
      var nbuf = new u8(Math.max(bl * 2, l2));
      nbuf.set(buf);
      buf = nbuf;
    }
  };
  var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
  var tbts = sl * 8;
  do {
    if (!lm) {
      final = bits(dat, pos, 1);
      var type = bits(dat, pos + 1, 3);
      pos += 3;
      if (!type) {
        var s = shft(pos) + 4, l = dat[s - 4] | dat[s - 3] << 8, t = s + l;
        if (t > sl) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + l);
        buf.set(dat.subarray(s, t), bt);
        st.b = bt += l, st.p = pos = t * 8, st.f = final;
        continue;
      } else if (type == 1)
        lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
      else if (type == 2) {
        var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
        var tl = hLit + bits(dat, pos + 5, 31) + 1;
        pos += 14;
        var ldt = new u8(tl);
        var clt = new u8(19);
        for (var i = 0; i < hcLen; ++i) {
          clt[clim[i]] = bits(dat, pos + i * 3, 7);
        }
        pos += hcLen * 3;
        var clb = max(clt), clbmsk = (1 << clb) - 1;
        var clm = hMap(clt, clb, 1);
        for (var i = 0; i < tl; ) {
          var r = clm[bits(dat, pos, clbmsk)];
          pos += r & 15;
          var s = r >> 4;
          if (s < 16) {
            ldt[i++] = s;
          } else {
            var c = 0, n = 0;
            if (s == 16)
              n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i - 1];
            else if (s == 17)
              n = 3 + bits(dat, pos, 7), pos += 3;
            else if (s == 18)
              n = 11 + bits(dat, pos, 127), pos += 7;
            while (n--)
              ldt[i++] = c;
          }
        }
        var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
        lbt = max(lt);
        dbt = max(dt);
        lm = hMap(lt, lbt, 1);
        dm = hMap(dt, dbt, 1);
      } else
        err(1);
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
    }
    if (resize)
      cbuf(bt + 131072);
    var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
    var lpos = pos;
    for (; ; lpos = pos) {
      var c = lm[bits16(dat, pos) & lms], sym = c >> 4;
      pos += c & 15;
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
      if (!c)
        err(2);
      if (sym < 256)
        buf[bt++] = sym;
      else if (sym == 256) {
        lpos = pos, lm = null;
        break;
      } else {
        var add = sym - 254;
        if (sym > 264) {
          var i = sym - 257, b = fleb[i];
          add = bits(dat, pos, (1 << b) - 1) + fl[i];
          pos += b;
        }
        var d = dm[bits16(dat, pos) & dms], dsym = d >> 4;
        if (!d)
          err(3);
        pos += d & 15;
        var dt = fd[dsym];
        if (dsym > 3) {
          var b = fdeb[dsym];
          dt += bits16(dat, pos) & (1 << b) - 1, pos += b;
        }
        if (pos > tbts) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + 131072);
        var end = bt + add;
        if (bt < dt) {
          var shift = dl - dt, dend = Math.min(dt, end);
          if (shift + bt < 0)
            err(3);
          for (; bt < dend; ++bt)
            buf[bt] = dict[shift + bt];
        }
        for (; bt < end; ++bt)
          buf[bt] = buf[bt - dt];
      }
    }
    st.l = lm, st.p = lpos, st.b = bt, st.f = final;
    if (lm)
      final = 1, st.m = lbt, st.d = dm, st.n = dbt;
  } while (!final);
  return bt != buf.length && noBuf ? slc(buf, 0, bt) : buf.subarray(0, bt);
};
var et = /* @__PURE__ */ new u8(0);
var b2 = function(d, b) {
  return d[b] | d[b + 1] << 8;
};
var b4 = function(d, b) {
  return (d[b] | d[b + 1] << 8 | d[b + 2] << 16 | d[b + 3] << 24) >>> 0;
};
var b8 = function(d, b) {
  return b4(d, b) + b4(d, b + 4) * 4294967296;
};
function inflateSync(data, opts) {
  return inflt(data, { i: 2 }, opts && opts.out, opts && opts.dictionary);
}
var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
var tds = 0;
try {
  td.decode(et, { stream: true });
  tds = 1;
} catch (e) {
}
var dutf8 = function(d) {
  for (var r = "", i = 0; ; ) {
    var c = d[i++];
    var eb = (c > 127) + (c > 223) + (c > 239);
    if (i + eb > d.length)
      return { s: r, r: slc(d, i - 1) };
    if (!eb)
      r += String.fromCharCode(c);
    else if (eb == 3) {
      c = ((c & 15) << 18 | (d[i++] & 63) << 12 | (d[i++] & 63) << 6 | d[i++] & 63) - 65536, r += String.fromCharCode(55296 | c >> 10, 56320 | c & 1023);
    } else if (eb & 1)
      r += String.fromCharCode((c & 31) << 6 | d[i++] & 63);
    else
      r += String.fromCharCode((c & 15) << 12 | (d[i++] & 63) << 6 | d[i++] & 63);
  }
};
function strFromU8(dat, latin1) {
  if (latin1) {
    var r = "";
    for (var i = 0; i < dat.length; i += 16384)
      r += String.fromCharCode.apply(null, dat.subarray(i, i + 16384));
    return r;
  } else if (td) {
    return td.decode(dat);
  } else {
    var _a2 = dutf8(dat), s = _a2.s, r = _a2.r;
    if (r.length)
      err(8);
    return s;
  }
}
var slzh = function(d, b) {
  return b + 30 + b2(d, b + 26) + b2(d, b + 28);
};
var zh = function(d, b, z) {
  var fnl = b2(d, b + 28), fn = strFromU8(d.subarray(b + 46, b + 46 + fnl), !(b2(d, b + 8) & 2048)), es = b + 46 + fnl, bs = b4(d, b + 20);
  var _a2 = z && bs == 4294967295 ? z64e(d, es) : [bs, b4(d, b + 24), b4(d, b + 42)], sc = _a2[0], su = _a2[1], off = _a2[2];
  return [b2(d, b + 10), sc, su, fn, es + b2(d, b + 30) + b2(d, b + 32), off];
};
var z64e = function(d, b) {
  for (; b2(d, b) != 1; b += 4 + b2(d, b + 2))
    ;
  return [b8(d, b + 12), b8(d, b + 4), b8(d, b + 20)];
};
function unzipSync(data, opts) {
  var files = {};
  var e = data.length - 22;
  for (; b4(data, e) != 101010256; --e) {
    if (!e || data.length - e > 65558)
      err(13);
  }
  ;
  var c = b2(data, e + 8);
  if (!c)
    return {};
  var o = b4(data, e + 16);
  var z = o == 4294967295 || c == 65535;
  if (z) {
    var ze = b4(data, e - 12);
    z = b4(data, ze) == 101075792;
    if (z) {
      c = b4(data, ze + 32);
      o = b4(data, ze + 48);
    }
  }
  var fltr = opts && opts.filter;
  for (var i = 0; i < c; ++i) {
    var _a2 = zh(data, o, z), c_2 = _a2[0], sc = _a2[1], su = _a2[2], fn = _a2[3], no = _a2[4], off = _a2[5], b = slzh(data, off);
    o = no;
    if (!fltr || fltr({
      name: fn,
      size: sc,
      originalSize: su,
      compression: c_2
    })) {
      if (!c_2)
        files[fn] = slc(data, b, b + sc);
      else if (c_2 == 8)
        files[fn] = inflateSync(data.subarray(b, b + sc), { out: new u8(su) });
      else
        err(14, "unknown compression type " + c_2);
    }
  }
  return files;
}

// src/routes/domains.ts
var domainsRouter = new Hono2();
var getCFHeaders = (c) => ({
  "Authorization": `Bearer ${c.env.CF_API_TOKEN}`,
  "Content-Type": "application/json"
});
domainsRouter.get("/", async (c) => {
  const db = c.env.DB;
  const { results } = await db.prepare(`
    SELECT d.*,
           c.id   AS campaign_id,
           c.name AS campaign_name,
           c.title AS campaign_title
    FROM domains d
    LEFT JOIN campaigns c ON c.link = d.domain
    ORDER BY d.created_at DESC
  `).all();
  return c.json({ success: true, data: { domains: results } });
});
domainsRouter.post("/zones", async (c) => {
  const { domain } = await c.req.json();
  if (!domain) return c.json({ success: false, error: "\u57DF\u540D\u4E0D\u80FD\u70BA\u7A7A" }, 400);
  const CF_HEADERS = getCFHeaders(c);
  const CF_ACCOUNT_ID = c.env.CLOUDFLARE_ACCOUNT_ID;
  let zoneId;
  let nameServers = [];
  let status = "pending";
  const createZone = await fetch("https://api.cloudflare.com/client/v4/zones", {
    method: "POST",
    headers: CF_HEADERS,
    body: JSON.stringify({ name: domain, account: { id: CF_ACCOUNT_ID } })
  });
  const zoneData = await createZone.json();
  if (zoneData.success) {
    zoneId = zoneData.result.id;
    nameServers = zoneData.result.name_servers || [];
    status = zoneData.result.status;
  } else {
    const existing = await fetch(
      `https://api.cloudflare.com/client/v4/zones?name=${domain}&account.id=${CF_ACCOUNT_ID}`,
      { headers: CF_HEADERS }
    );
    const existData = await existing.json();
    if (!existData.result?.[0]) {
      return c.json({ success: false, error: zoneData.errors?.[0]?.message || "\u57DF\u540D\u89E3\u6790\u5931\u6557" }, 400);
    }
    zoneId = existData.result[0].id;
    nameServers = existData.result[0].name_servers || [];
    status = existData.result[0].status;
  }
  await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
    method: "POST",
    headers: CF_HEADERS,
    body: JSON.stringify({ type: "A", name: "@", content: "5.104.83.138", proxied: true })
  });
  await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
    method: "POST",
    headers: CF_HEADERS,
    body: JSON.stringify({ type: "AAAA", name: "@", content: "100::", proxied: true })
  });
  await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/workers/routes`, {
    method: "POST",
    headers: CF_HEADERS,
    body: JSON.stringify({ pattern: `${domain}/*`, script: "shadow-cloak" })
  });
  await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/workers/routes`, {
    method: "POST",
    headers: CF_HEADERS,
    body: JSON.stringify({ pattern: `www.${domain}/*`, script: "shadow-cloak" })
  });
  const db = c.env.DB;
  const ns_string = nameServers.join(",");
  await db.prepare(
    "INSERT OR REPLACE INTO domains (domain, zone_id, status, note) VALUES (?, ?, ?, ?)"
  ).bind(domain, zoneId, status, ns_string).run();
  return c.json({ success: true, data: { zoneId, domain, nameServers, status } });
});
domainsRouter.post("/zones/:zoneId/check", async (c) => {
  const { zoneId } = c.req.param();
  const CF_HEADERS = getCFHeaders(c);
  const r = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}`, { headers: CF_HEADERS });
  const data = await r.json();
  if (!data.success) return c.json({ success: false, error: "\u67E5\u8A62\u5931\u6557" }, 400);
  const status = data.result.status;
  const nameServers = data.result.name_servers || [];
  const ns_string = nameServers.join(",");
  const db = c.env.DB;
  await db.prepare(
    "UPDATE domains SET status = ?, note = ?, updated_at = CURRENT_TIMESTAMP WHERE zone_id = ?"
  ).bind(status, ns_string, zoneId).run();
  return c.json({ success: true, data: { status, nameServers } });
});
domainsRouter.delete("/:id", async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  await db.prepare("DELETE FROM domains WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});
var domains_default = domainsRouter;

// src/routes/shortlinks.ts
var shortlinksRouter = new Hono2();
function randomCode(length) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
shortlinksRouter.get("/", async (c) => {
  const db = c.env.DB;
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "20");
  const offset = (page - 1) * limit;
  const total = await db.prepare("SELECT COUNT(*) as total FROM short_links").first();
  const items = await db.prepare("SELECT * FROM short_links ORDER BY id DESC LIMIT ? OFFSET ?").bind(limit, offset).all();
  return c.json({ success: true, data: { items: items.results, total: total?.total || 0, page, limit } });
});
shortlinksRouter.post("/", async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const { name, domain, code, codeLength, targetLinks, status } = body;
  if (!name || !domain) return c.json({ success: false, error: "\u540D\u7A31\u548C\u57DF\u540D\u70BA\u5FC5\u586B" }, 400);
  const finalCode = code || randomCode(codeLength || 4);
  const existing = await db.prepare("SELECT id FROM short_links WHERE domain=? AND code=?").bind(domain, finalCode).first();
  if (existing) return c.json({ success: false, error: "\u77ED\u78BC\u5DF2\u88AB\u4F7F\u7528" }, 400);
  await db.prepare("INSERT INTO short_links (name, domain, code, target_links, status) VALUES (?, ?, ?, ?, ?)").bind(
    name,
    domain,
    finalCode,
    JSON.stringify(targetLinks || []),
    status || "active"
  ).run();
  return c.json({ success: true, data: { shortUrl: `https://${domain}/${finalCode}` } });
});
shortlinksRouter.put("/:id", async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const body = await c.req.json();
  const { name, domain, code, targetLinks, status } = body;
  await db.prepare("UPDATE short_links SET name=?, domain=?, code=?, target_links=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(
    name,
    domain,
    code,
    JSON.stringify(targetLinks || []),
    status,
    id
  ).run();
  return c.json({ success: true });
});
shortlinksRouter.delete("/:id", async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  await db.prepare("DELETE FROM short_links WHERE id=?").bind(id).run();
  return c.json({ success: true });
});
shortlinksRouter.get("/:id/logs", async (c) => {
  return c.json({ success: true, data: { items: [], total: 0 } });
});
var shortlinks_default = shortlinksRouter;

// src/routes/line-config.ts
var router = new Hono2();
function normalizeLineConfigPayload(source) {
  return {
    tag: String(source.tag ?? "").trim(),
    line: String(source.line ?? "").trim(),
    name: String(source.name ?? "").trim(),
    who: String(source.who ?? "").trim(),
    msg: String(source.msg ?? "").trim(),
    destination: String(source.destination ?? "").trim(),
    routing_strategy: String(source.routing_strategy ?? "random").trim() || "random",
    liff_id: String(source.liff_id ?? "").trim(),
    channel_id: String(source.channel_id ?? "").trim(),
    channel_token: String(source.channel_token ?? "").trim(),
    group_name: String(source.group_name ?? "").trim()
  };
}
router.get("/", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM line_config ORDER BY tag ASC").all();
  return c.json({ success: true, data: results });
});
router.get("/:id", async (c) => {
  const id = c.req.param("id");
  const result = await c.env.DB.prepare("SELECT * FROM line_config WHERE id = ?").bind(id).first();
  if (!result) return c.json({ success: false, error: "Config not found" }, 404);
  return c.json({ success: true, data: result });
});
router.post("/", async (c) => {
  const body = await c.req.json();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const payload = normalizeLineConfigPayload(body);
  const result = await c.env.DB.prepare(
    `INSERT INTO line_config (
      tag, line, name, who, msg, destination,
      routing_strategy, liff_id, channel_id, channel_token,
      group_name, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    payload.tag,
    payload.line,
    payload.name,
    payload.who,
    payload.msg,
    payload.destination,
    payload.routing_strategy,
    payload.liff_id,
    payload.channel_id,
    payload.channel_token,
    payload.group_name,
    now,
    now
  ).run();
  return c.json({ success: true, data: { id: result.meta.last_row_id } });
});
router.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const existing = await c.env.DB.prepare("SELECT * FROM line_config WHERE id = ?").bind(id).first();
  if (!existing) return c.json({ success: false, error: "Config not found" }, 404);
  const payload = normalizeLineConfigPayload({ ...existing, ...body });
  await c.env.DB.prepare(
    `UPDATE line_config SET
      tag = ?,
      line = ?,
      name = ?,
      who = ?,
      msg = ?,
      destination = ?,
      routing_strategy = ?,
      liff_id = ?,
      channel_id = ?,
      channel_token = ?,
      group_name = ?,
      updatedAt = ?
    WHERE id = ?`
  ).bind(
    payload.tag,
    payload.line,
    payload.name,
    payload.who,
    payload.msg,
    payload.destination,
    payload.routing_strategy,
    payload.liff_id,
    payload.channel_id,
    payload.channel_token,
    payload.group_name,
    now,
    id
  ).run();
  return c.json({ success: true });
});
router.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM line_config WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});
var line_config_default = router;

// src/routes/groups.ts
var router2 = new Hono2();
function normalizePrefixes(input) {
  if (Array.isArray(input)) {
    return input.map((item) => String(item || "").trim().toUpperCase()).filter(Boolean);
  }
  if (typeof input === "string") {
    const raw2 = input.trim();
    if (!raw2) return [];
    try {
      const parsed = JSON.parse(raw2);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item || "").trim().toUpperCase()).filter(Boolean);
      }
    } catch {
      return raw2.split(",").map((item) => item.trim().toUpperCase()).filter(Boolean);
    }
  }
  return [];
}
function deriveAdPrefixes(params) {
  const fromExplicit = normalizePrefixes(params.explicit);
  if (fromExplicit.length > 0) return fromExplicit;
  const fromStored = normalizePrefixes(params.stored);
  if (fromStored.length > 0) return fromStored;
  const fromTags = normalizePrefixes(params.tags || "");
  if (fromTags.length > 0) return fromTags;
  const fromCode = normalizePrefixes(params.code || "");
  if (fromCode.length > 0) return fromCode;
  return [];
}
function normalizeGroupRecord(record) {
  return {
    ...record,
    code: record.code || "",
    tags: record.tags || "",
    ad_prefixes: deriveAdPrefixes({
      stored: record.ad_prefixes,
      tags: record.tags,
      code: record.code
    }),
    description: record.description || ""
  };
}
function buildLineConfigUpdateStatement(db, groupName, oa, now) {
  return db.prepare(
    `UPDATE line_config SET 
      group_name = ?,
      tag = ?,
      line = ?,
      name = ?,
      who = ?,
      msg = ?,
      destination = ?,
      routing_strategy = ?,
      liff_id = ?,
      channel_id = ?,
      channel_token = ?,
      updatedAt = ?
    WHERE id = ?`
  ).bind(
    groupName,
    String(oa.tag || "").trim(),
    String(oa.line || "").trim(),
    String(oa.name || "").trim(),
    String(oa.who || "").trim(),
    String(oa.msg || "").trim(),
    String(oa.destination || "").trim(),
    String(oa.routing_strategy || "random").trim() || "random",
    String(oa.liff_id || "").trim(),
    String(oa.channel_id || "").trim(),
    String(oa.channel_token || "").trim(),
    now,
    oa.id
  );
}
async function syncCampaignGroupName(db, oldName, newName, now) {
  if (!oldName) return;
  if (newName) {
    await db.prepare(
      "UPDATE campaigns SET group_name = ?, updated_at = ? WHERE group_name = ?"
    ).bind(newName, now, oldName).run();
    return;
  }
  await db.prepare(
    "UPDATE campaigns SET group_name = ?, updated_at = ? WHERE group_name = ?"
  ).bind("", now, oldName).run();
}
router2.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM line_groups ORDER BY name ASC"
  ).all();
  return c.json({ success: true, data: (results || []).map(normalizeGroupRecord) });
});
router2.post("/", async (c) => {
  const body = await c.req.json();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const groupName = String(body.name || "").trim();
  const code = String(body.code || "").trim().toUpperCase();
  const tags = String(body.tags || "").trim();
  const oaUpdates = Array.isArray(body.oa_updates) ? body.oa_updates : [];
  const description = String(body.description || "").trim();
  const adPrefixes = deriveAdPrefixes({ explicit: body.ad_prefixes, tags, code });
  const result = await c.env.DB.prepare(
    `INSERT INTO line_groups (name, code, tags, ad_prefixes, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    groupName,
    code,
    tags,
    JSON.stringify(adPrefixes),
    description,
    now,
    now
  ).run();
  if (oaUpdates.length > 0 && groupName) {
    const statements = oaUpdates.map(
      (oa) => buildLineConfigUpdateStatement(c.env.DB, groupName, oa, now)
    );
    await c.env.DB.batch(statements);
  }
  return c.json({ success: true, data: { id: result.meta.last_row_id } });
});
router2.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const groupName = String(body.name || "").trim();
  const code = String(body.code || "").trim().toUpperCase();
  const tags = String(body.tags || "").trim();
  const oaUpdates = Array.isArray(body.oa_updates) ? body.oa_updates : [];
  const oldGroup = await c.env.DB.prepare(
    "SELECT name, code, ad_prefixes, description FROM line_groups WHERE id = ?"
  ).bind(id).first();
  const adPrefixes = deriveAdPrefixes({
    explicit: body.ad_prefixes,
    stored: oldGroup?.ad_prefixes,
    tags,
    code: code || oldGroup?.code
  });
  const description = body.description !== void 0 ? String(body.description || "").trim() : String(oldGroup?.description || "").trim();
  await c.env.DB.prepare(
    `UPDATE line_groups SET name = ?, code = ?, tags = ?, ad_prefixes = ?, description = ?, updatedAt = ? WHERE id = ?`
  ).bind(
    groupName,
    code,
    tags,
    JSON.stringify(adPrefixes),
    description,
    now,
    id
  ).run();
  if (groupName) {
    if (oldGroup && oldGroup.name) {
      await c.env.DB.prepare(
        `UPDATE line_config SET group_name = '', updatedAt = ? WHERE group_name = ?`
      ).bind(now, oldGroup.name).run();
      if (oldGroup.name !== groupName) {
        await syncCampaignGroupName(c.env.DB, oldGroup.name, groupName, now);
      }
    }
    if (oaUpdates.length > 0) {
      const statements = oaUpdates.map(
        (oa) => buildLineConfigUpdateStatement(c.env.DB, groupName, oa, now)
      );
      await c.env.DB.batch(statements);
    }
  }
  return c.json({ success: true });
});
router2.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const group = await c.env.DB.prepare(
    "SELECT name FROM line_groups WHERE id = ?"
  ).bind(id).first();
  if (group && group.name) {
    await c.env.DB.prepare(
      `UPDATE line_config SET group_name = '', updatedAt = ? WHERE group_name = ?`
    ).bind(now, group.name).run();
    await syncCampaignGroupName(c.env.DB, group.name, "", now);
  }
  await c.env.DB.prepare("DELETE FROM line_groups WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});
var groups_default = router2;

// src/routes/pixel-groups.ts
var router3 = new Hono2();
router3.get("/", async (c) => {
  const { tag, search } = c.req.query();
  const db = c.env.DB;
  let sql = "SELECT * FROM pixel_groups";
  const params = [];
  const conditions = [];
  if (search) {
    conditions.push("(bm_name LIKE ? OR bm_id LIKE ? OR bc_pixel_id LIKE ? OR note LIKE ?)");
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }
  sql += " ORDER BY id ASC";
  const { results: groups } = await db.prepare(sql).bind(...params).all();
  if (groups && groups.length > 0) {
    const groupIds = groups.map((g) => g.id);
    const placeholders = groupIds.map(() => "?").join(",");
    let adSql = `SELECT * FROM pixel_group_ads WHERE group_id IN (${placeholders})`;
    const adParams = [...groupIds];
    if (tag) {
      adSql += " AND tag = ?";
      adParams.push(tag);
    }
    adSql += " ORDER BY tag ASC, created_at ASC";
    const { results: allAds } = await db.prepare(adSql).bind(...adParams).all();
    const adsMap = {};
    for (const ad of allAds || []) {
      if (!adsMap[ad.group_id]) adsMap[ad.group_id] = [];
      adsMap[ad.group_id].push(ad);
    }
    const data = groups.map((g) => ({
      ...g,
      ad_pixels: adsMap[g.id] || []
    }));
    return c.json({ success: true, data });
  }
  return c.json({ success: true, data: [] });
});
router3.get("/:id", async (c) => {
  const id = c.req.param("id");
  const db = c.env.DB;
  const group = await db.prepare("SELECT * FROM pixel_groups WHERE id = ?").bind(id).first();
  if (!group) return c.json({ success: false, error: "Pixel group not found" }, 404);
  const { results: adPixels } = await db.prepare(
    "SELECT * FROM pixel_group_ads WHERE group_id = ? ORDER BY tag ASC, created_at ASC"
  ).bind(id).all();
  return c.json({
    success: true,
    data: {
      ...group,
      ad_pixels: adPixels || []
    }
  });
});
router3.get("/by-tag/:tag", async (c) => {
  const tag = c.req.param("tag");
  const db = c.env.DB;
  const { results: ads } = await db.prepare(
    `SELECT a.*, g.bm_name, g.capi_token, g.bc_pixel_id, g.bc_pixel_name
     FROM pixel_group_ads a
     JOIN pixel_groups g ON a.group_id = g.id
     WHERE a.tag = ?
     ORDER BY g.id ASC`
  ).bind(tag).all();
  return c.json({ success: true, data: ads || [] });
});
router3.post("/", async (c) => {
  const body = await c.req.json();
  const db = c.env.DB;
  if (!body.capi_token) {
    return c.json({ success: false, error: "CAPI Token \u70BA\u5FC5\u586B" }, 400);
  }
  const result = await db.prepare(
    `INSERT INTO pixel_groups (bm_id, bm_name, capi_token, bc_pixel_id, bc_pixel_name, note)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(
    body.bm_id || null,
    body.bm_name || null,
    body.capi_token,
    body.bc_pixel_id || null,
    body.bc_pixel_name || null,
    body.note || null
  ).run();
  const groupId = result.meta.last_row_id;
  const adPixels = body.ad_pixels || [];
  for (const ad of adPixels) {
    if (ad.tag && ad.pixel_id) {
      await db.prepare(
        "INSERT INTO pixel_group_ads (group_id, tag, pixel_id, pixel_name) VALUES (?, ?, ?, ?)"
      ).bind(groupId, ad.tag, ad.pixel_id, ad.pixel_name || null).run();
    }
  }
  return c.json({ success: true, data: { id: groupId } });
});
router3.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const db = c.env.DB;
  const existing = await db.prepare("SELECT id FROM pixel_groups WHERE id = ?").bind(id).first();
  if (!existing) return c.json({ success: false, error: "Pixel group not found" }, 404);
  await db.prepare(
    `UPDATE pixel_groups SET
      bm_id = ?, bm_name = ?, capi_token = ?, bc_pixel_id = ?, bc_pixel_name = ?, note = ?
     WHERE id = ?`
  ).bind(
    body.bm_id || null,
    body.bm_name || null,
    body.capi_token || "",
    body.bc_pixel_id || null,
    body.bc_pixel_name || null,
    body.note || null,
    id
  ).run();
  if (body.ad_pixels !== void 0) {
    await db.prepare("DELETE FROM pixel_group_ads WHERE group_id = ?").bind(id).run();
    const adPixels = body.ad_pixels || [];
    for (const ad of adPixels) {
      if (ad.tag && ad.pixel_id) {
        await db.prepare(
          "INSERT INTO pixel_group_ads (group_id, tag, pixel_id, pixel_name) VALUES (?, ?, ?, ?)"
        ).bind(id, ad.tag, ad.pixel_id, ad.pixel_name || null).run();
      }
    }
  }
  return c.json({ success: true });
});
router3.patch("/:id/status", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const db = c.env.DB;
  const status = body.status;
  if (!status || !["active", "disabled"].includes(status)) {
    return c.json({ success: false, error: "status \u5FC5\u9808\u662F active \u6216 disabled" }, 400);
  }
  const existing = await db.prepare("SELECT id FROM pixel_groups WHERE id = ?").bind(id).first();
  if (!existing) return c.json({ success: false, error: "Pixel group not found" }, 404);
  await db.prepare("UPDATE pixel_groups SET status = ? WHERE id = ?").bind(status, id).run();
  return c.json({ success: true, data: { id: Number(id), status } });
});
router3.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const db = c.env.DB;
  const existing = await db.prepare("SELECT id FROM pixel_groups WHERE id = ?").bind(id).first();
  if (!existing) return c.json({ success: false, error: "Pixel group not found" }, 404);
  await db.prepare("DELETE FROM pixel_group_ads WHERE group_id = ?").bind(id).run();
  await db.prepare("DELETE FROM pixel_groups WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});
var pixel_groups_default = router3;

// src/routes/dashboard.ts
var router4 = new Hono2();
function getNowUTC8() {
  return new Date(Date.now() + 8 * 60 * 60 * 1e3);
}
function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}
function fmtDateLine(d) {
  return fmtDate(d).replace(/-/g, "");
}
function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function buildTagPrefixMap(lineGroups) {
  const map = {};
  for (const group of lineGroups) {
    if (!group.tags || !group.code) continue;
    const prefixes = group.tags.split(",").map((t) => t.trim().toUpperCase());
    for (const prefix of prefixes) {
      if (prefix) map[prefix] = group.code;
    }
  }
  return map;
}
function convertAdCode(rawCode, tagPrefixMap) {
  const match2 = rawCode.match(/^([A-Za-z]+)(\d+)$/);
  if (!match2) return null;
  const prefix = match2[1].toUpperCase();
  const numStr = match2[2];
  const groupCode = tagPrefixMap[prefix];
  if (!groupCode) return null;
  return `${groupCode}-${String(parseInt(numStr, 10)).padStart(2, "0")}`;
}
async function fetchLineFollowers(channelToken, dateStr) {
  const resp = await fetch(
    `https://api.line.me/v2/bot/insight/followers?date=${dateStr}`,
    { headers: { Authorization: `Bearer ${channelToken}` } }
  );
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`LINE API ${resp.status}: ${text}`);
  }
  return resp.json();
}
async function ensureOaDailyStatsTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS oa_daily_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tag TEXT NOT NULL,
      date TEXT NOT NULL,
      new_followers INTEGER DEFAULT 0,
      cumulative_followers INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(tag, date)
    )
  `).run().catch(() => {
  });
}
router4.get("/stats", async (c) => {
  const db = c.env.DB;
  try {
    const campaignCountResult = await db.prepare("SELECT COUNT(*) as total FROM campaigns").first();
    const activeCountResult = await db.prepare("SELECT COUNT(*) as total FROM campaigns WHERE status = 'active'").first();
    const timeSummaryQuery = `
      SELECT 
        SUM(CASE WHEN date(timestamp) = date('now') THEN 1 ELSE 0 END) as today_visits,
        SUM(CASE WHEN date(timestamp) = date('now') AND verdict != 'safe' THEN 1 ELSE 0 END) as today_blocked,
        SUM(CASE WHEN date(timestamp) = date('now', '-1 day') THEN 1 ELSE 0 END) as yesterday_visits,
        SUM(CASE WHEN date(timestamp) = date('now', '-1 day') AND verdict != 'safe' THEN 1 ELSE 0 END) as yesterday_blocked,
        SUM(CASE WHEN date(timestamp) >= date('now', '-2 days') THEN 1 ELSE 0 END) as three_days_visits,
        SUM(CASE WHEN date(timestamp) >= date('now', '-2 days') AND verdict != 'safe' THEN 1 ELSE 0 END) as three_days_blocked,
        SUM(CASE WHEN date(timestamp) >= date('now', '-6 days') THEN 1 ELSE 0 END) as seven_days_visits,
        SUM(CASE WHEN date(timestamp) >= date('now', '-6 days') AND verdict != 'safe' THEN 1 ELSE 0 END) as seven_days_blocked
      FROM cloak_logs
    `;
    const timeSummaryResult = await db.prepare(timeSummaryQuery).first();
    const trendResults = await db.prepare(`
      SELECT 
        date(timestamp) as date,
        COUNT(*) as count,
        SUM(CASE WHEN verdict != 'safe' THEN 1 ELSE 0 END) as blocked
      FROM cloak_logs
      WHERE timestamp >= date('now', '-6 days')
      GROUP BY date(timestamp)
      ORDER BY date ASC
    `).all();
    const groupStatsResults = await db.prepare(`
      SELECT 
        c.group_name,
        COUNT(DISTINCT c.id) as campaign_count,
        SUM(CASE WHEN date(l.timestamp) = date('now') AND l.verdict = 'safe' THEN 1 ELSE 0 END) as today_visits,
        SUM(CASE WHEN date(l.timestamp) = date('now') AND l.verdict != 'safe' THEN 1 ELSE 0 END) as today_blocked,
        SUM(CASE WHEN date(l.timestamp) = date('now', '-1 day') AND l.verdict = 'safe' THEN 1 ELSE 0 END) as yesterday_visits,
        SUM(CASE WHEN date(l.timestamp) = date('now', '-1 day') AND l.verdict != 'safe' THEN 1 ELSE 0 END) as yesterday_blocked,
        SUM(CASE WHEN date(l.timestamp) >= date('now', '-2 days') AND l.verdict = 'safe' THEN 1 ELSE 0 END) as three_days_visits,
        SUM(CASE WHEN date(l.timestamp) >= date('now', '-2 days') AND l.verdict != 'safe' THEN 1 ELSE 0 END) as three_days_blocked,
        SUM(CASE WHEN date(l.timestamp) >= date('now', '-6 days') AND l.verdict = 'safe' THEN 1 ELSE 0 END) as seven_days_visits,
        SUM(CASE WHEN date(l.timestamp) >= date('now', '-6 days') AND l.verdict != 'safe' THEN 1 ELSE 0 END) as seven_days_blocked
      FROM campaigns c
      LEFT JOIN cloak_logs l ON c.id = l.campaign_id
      GROUP BY c.group_name
    `).all();
    const campaignRankingResults = await db.prepare(`
      SELECT 
        c.id, c.name, c.group_name, c.status,
        SUM(CASE WHEN date(l.timestamp) = date('now') AND l.verdict = 'safe' THEN 1 ELSE 0 END) as today_visits,
        SUM(CASE WHEN date(l.timestamp) = date('now') AND l.verdict != 'safe' THEN 1 ELSE 0 END) as today_blocked,
        SUM(CASE WHEN date(l.timestamp) = date('now', '-1 day') AND l.verdict = 'safe' THEN 1 ELSE 0 END) as yesterday_visits,
        SUM(CASE WHEN date(l.timestamp) >= date('now', '-2 days') AND l.verdict = 'safe' THEN 1 ELSE 0 END) as three_days_visits,
        SUM(CASE WHEN date(l.timestamp) >= date('now', '-6 days') AND l.verdict = 'safe' THEN 1 ELSE 0 END) as seven_days_visits
      FROM campaigns c
      LEFT JOIN cloak_logs l ON c.id = l.campaign_id
      GROUP BY c.id
      ORDER BY today_visits DESC
      LIMIT 50
    `).all();
    let clickMap = /* @__PURE__ */ new Map();
    try {
      const clickStatsResults = await db.prepare(`
        SELECT 
          campaign_id,
          COUNT(*) as clicks,
          SUM(CASE WHEN matched = 1 THEN 1 ELSE 0 END) as attributed
        FROM clicks
        GROUP BY campaign_id
      `).all();
      (clickStatsResults.results || []).forEach((r) => {
        clickMap.set(r.campaign_id, { clicks: r.clicks, attributed: r.attributed });
      });
    } catch (e) {
      console.warn("Clicks table stats failed, skipping clicks data");
    }
    const groupStats = (groupStatsResults.results || []).map((g) => ({
      ...g,
      group_name: g.group_name || "\u672A\u5206\u7D44",
      group_prefix: g.group_name || "",
      clicks: 0,
      attributed: 0
    }));
    const campaignRanking = (campaignRankingResults.results || []).map((c2) => {
      const clicks = clickMap.get(c2.id);
      return {
        ...c2,
        group_name: c2.group_name || "\u672A\u5206\u7D44",
        clicks: clicks?.clicks || 0,
        attributed: clicks?.attributed || 0
      };
    });
    return c.json({
      success: true,
      data: {
        campaignCount: campaignCountResult?.total || 0,
        activeCount: activeCountResult?.total || 0,
        timeSummary: {
          today: { visits: timeSummaryResult?.today_visits || 0, blocked: timeSummaryResult?.today_blocked || 0 },
          yesterday: { visits: timeSummaryResult?.yesterday_visits || 0, blocked: timeSummaryResult?.yesterday_blocked || 0 },
          three_days: { visits: timeSummaryResult?.three_days_visits || 0, blocked: timeSummaryResult?.three_days_blocked || 0 },
          seven_days: { visits: timeSummaryResult?.seven_days_visits || 0, blocked: timeSummaryResult?.seven_days_blocked || 0 }
        },
        trend: trendResults.results || [],
        campaignRanking,
        groupStats
      }
    });
  } catch (err2) {
    console.error("Dashboard stats error:", err2);
    return c.json({ success: false, error: err2.message }, 500);
  }
});
router4.post("/sync-line-stats", async (c) => {
  const db = c.env.DB;
  try {
    await ensureOaDailyStatsTable(db);
    let body = {};
    try {
      body = await c.req.json();
    } catch {
    }
    const nowUTC8 = getNowUTC8();
    const dateParam = body.date || fmtDate(addDays(nowUTC8, -1));
    const requestDate = /* @__PURE__ */ new Date(dateParam + "T00:00:00Z");
    const prevDate = addDays(requestDate, -1);
    const lineDateStr = fmtDateLine(requestDate);
    const linePrevDateStr = fmtDateLine(prevDate);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const { results: oaList } = await db.prepare(
      `SELECT id, tag, name, channel_token, group_name 
       FROM line_config 
       WHERE channel_token IS NOT NULL AND channel_token != '' 
       ORDER BY group_name, tag ASC`
    ).all();
    if (!oaList || oaList.length === 0) {
      return c.json({ success: true, message: "No OAs with channel_token found", synced: 0 });
    }
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    for (const oa of oaList) {
      const oaTag = (oa.tag || "").trim();
      if (!oaTag) continue;
      try {
        const [todayData, prevData] = await Promise.all([
          fetchLineFollowers(oa.channel_token, lineDateStr),
          fetchLineFollowers(oa.channel_token, linePrevDateStr)
        ]);
        if (todayData.status === "ready" && prevData.status === "ready" && todayData.followers !== null && prevData.followers !== null) {
          const newFollowers = todayData.followers - prevData.followers;
          await db.prepare(`
            INSERT INTO oa_daily_stats (tag, date, new_followers, cumulative_followers, created_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(tag, date) DO UPDATE SET
              new_followers = excluded.new_followers,
              cumulative_followers = excluded.cumulative_followers,
              created_at = excluded.created_at
          `).bind(oaTag, dateParam, newFollowers, todayData.followers, now).run();
          results.push({ tag: oaTag, name: oa.name, status: "ok", new_followers: newFollowers, cumulative: todayData.followers });
          successCount++;
        } else {
          const status = todayData.status === "unready" || prevData.status === "unready" ? "unready" : "unavailable";
          results.push({ tag: oaTag, name: oa.name, status, detail: `today=${todayData.status}, prev=${prevData.status}` });
          errorCount++;
        }
      } catch (err2) {
        results.push({ tag: oaTag, name: oa.name, status: "error", detail: err2.message });
        errorCount++;
      }
    }
    return c.json({
      success: true,
      data: {
        date: dateParam,
        total: oaList.length,
        synced: successCount,
        errors: errorCount,
        details: results
      }
    });
  } catch (err2) {
    console.error("Sync LINE stats error:", err2);
    return c.json({ success: false, error: err2.message }, 500);
  }
});
router4.get("/oa-comparison", async (c) => {
  const db = c.env.DB;
  try {
    await ensureOaDailyStatsTable(db);
    const nowUTC8 = getNowUTC8();
    const todayStr = fmtDate(nowUTC8);
    const yesterdayStr = fmtDate(addDays(nowUTC8, -1));
    const completeDates = [];
    for (let i = 7; i >= 1; i--) {
      completeDates.push(fmtDate(addDays(nowUTC8, -i)));
    }
    const dates = [...completeDates, todayStr];
    const { results: oaList } = await db.prepare(
      `SELECT id, tag, name, group_name 
       FROM line_config 
       WHERE channel_token IS NOT NULL AND channel_token != '' 
       ORDER BY group_name, tag ASC`
    ).all();
    if (!oaList || oaList.length === 0) {
      return c.json({ success: true, data: { dates, groups: [] } });
    }
    const tagToGroup = {};
    for (const oa of oaList) {
      tagToGroup[(oa.tag || "").toLowerCase()] = oa.group_name || "\u672A\u5206\u7D44";
    }
    const groupNames = [...new Set(Object.values(tagToGroup))];
    const { results: lineStats } = await db.prepare(
      `SELECT LOWER(tag) as tag, date, new_followers FROM oa_daily_stats WHERE date >= ? AND date <= ?`
    ).bind(completeDates[0], yesterdayStr).all();
    const lineMap = {};
    for (const row of lineStats || []) {
      const tag = (row.tag || "").toLowerCase();
      if (!lineMap[tag]) lineMap[tag] = {};
      lineMap[tag][row.date] = row.new_followers ?? 0;
    }
    const { results: attrRows } = await db.prepare(`
      SELECT LOWER(ad_code) as ad_code, date(timestamp) as d, COUNT(*) as cnt
      FROM clicks
      WHERE matched = 1 AND ad_code IS NOT NULL AND ad_code != ''
        AND date(timestamp) >= ? AND date(timestamp) <= ?
      GROUP BY LOWER(ad_code), date(timestamp)
    `).bind(completeDates[0], todayStr).all();
    const adCodeToTag = (adCode) => {
      const lower = adCode.toLowerCase();
      if (tagToGroup[lower]) return lower;
      const prefixMatch = lower.match(/^([a-z]+)\d/);
      if (prefixMatch) {
        const prefix = prefixMatch[1];
        if (tagToGroup[prefix]) return prefix;
      }
      return null;
    };
    const attrMap = {};
    for (const row of attrRows || []) {
      const tag = adCodeToTag(row.ad_code || "");
      if (!tag) continue;
      if (!attrMap[tag]) attrMap[tag] = {};
      attrMap[tag][row.d] = (attrMap[tag][row.d] || 0) + (row.cnt || 0);
    }
    const groupData = {};
    for (const gn of groupNames) {
      groupData[gn] = {};
      for (const d of dates) {
        groupData[gn][d] = { attributed: 0, line_new: null };
      }
    }
    for (const oa of oaList) {
      const tag = (oa.tag || "").toLowerCase();
      const gn = oa.group_name || "\u672A\u5206\u7D44";
      for (const d of dates) {
        const cell = groupData[gn][d];
        cell.attributed += attrMap[tag]?.[d] || 0;
        if (lineMap[tag]?.[d] !== void 0) {
          if (cell.line_new === null) cell.line_new = 0;
          cell.line_new += lineMap[tag][d];
        }
      }
    }
    const groups = groupNames.map((gn) => {
      const daily = {};
      let totalAttr = 0;
      let totalLine = null;
      for (const d of dates) {
        const cell = groupData[gn][d];
        daily[d] = cell;
        if (completeDates.includes(d)) {
          totalAttr += cell.attributed;
          if (cell.line_new !== null) {
            if (totalLine === null) totalLine = 0;
            totalLine += cell.line_new;
          }
        }
      }
      const coverage = totalLine !== null && totalLine > 0 ? Math.round(totalAttr / totalLine * 1e4) / 100 : null;
      return {
        group_name: gn,
        daily,
        total_attributed: totalAttr,
        total_line_new: totalLine,
        coverage
      };
    });
    return c.json({
      success: true,
      data: {
        dates,
        complete_dates: completeDates,
        // 前 7 天（有完整 LINE 數據）
        today: todayStr,
        groups
      }
    });
  } catch (err2) {
    console.error("OA comparison error:", err2);
    return c.json({ success: false, error: err2.message }, 500);
  }
});
router4.get("/ad-ranking", async (c) => {
  const db = c.env.DB;
  try {
    const nowUTC8 = getNowUTC8();
    const dateParam = c.req.query("date") || fmtDate(addDays(nowUTC8, -1));
    const groupFilter = c.req.query("group") || "";
    const { results: lineGroupsList } = await db.prepare(
      `SELECT name, code, tags FROM line_groups WHERE code IS NOT NULL AND code != ''`
    ).all();
    const tagPrefixMap = buildTagPrefixMap(lineGroupsList);
    const tagPrefixToGroupName = {};
    for (const group of lineGroupsList || []) {
      if (!group.tags || !group.name) continue;
      const prefixes = group.tags.split(",").map((t) => t.trim().toUpperCase());
      for (const prefix of prefixes) {
        if (prefix) tagPrefixToGroupName[prefix] = group.name;
      }
    }
    const clicksResult = await db.prepare(`
      SELECT ad_code,
             COUNT(*) as clicks,
             SUM(CASE WHEN matched = 1 THEN 1 ELSE 0 END) as adds
      FROM clicks
      WHERE ad_code IS NOT NULL AND ad_code != '' AND date(timestamp) = ?
      GROUP BY ad_code
    `).bind(dateParam).all();
    const adMap = {};
    for (const row of clicksResult.results || []) {
      const rawCode = row.ad_code;
      const converted = convertAdCode(rawCode, tagPrefixMap);
      if (!converted) continue;
      const match2 = rawCode.match(/^([A-Za-z]+)/);
      const prefix = match2 ? match2[1].toUpperCase() : "";
      const groupName = tagPrefixToGroupName[prefix] || "\u672A\u5206\u7D44";
      if (groupFilter && groupName !== groupFilter) continue;
      if (!adMap[converted]) {
        adMap[converted] = { ad_code: converted, raw_codes: [], group_name: groupName, clicks: 0, adds: 0, attr_rate: 0 };
      }
      adMap[converted].clicks += row.clicks || 0;
      adMap[converted].adds += row.adds || 0;
      if (!adMap[converted].raw_codes.includes(rawCode)) {
        adMap[converted].raw_codes.push(rawCode);
      }
    }
    const ads = Object.values(adMap).map((ad) => ({
      ...ad,
      attr_rate: ad.clicks > 0 ? Math.round(ad.adds / ad.clicks * 1e4) / 100 : 0
    }));
    ads.sort((a, b) => b.attr_rate - a.attr_rate);
    const groupedAds = {};
    for (const ad of ads) {
      const gn = ad.group_name;
      if (!groupedAds[gn]) groupedAds[gn] = [];
      groupedAds[gn].push(ad);
    }
    return c.json({ success: true, data: { date: dateParam, ads, groupedAds } });
  } catch (err2) {
    console.error("Ad ranking error:", err2);
    return c.json({ success: false, error: err2.message }, 500);
  }
});
var dashboard_default = router4;

// src/routes/group-config.ts
var router5 = new Hono2();
function normalizePrefixes2(input) {
  if (Array.isArray(input)) {
    return input.map((item) => String(item || "").trim().toUpperCase()).filter(Boolean);
  }
  if (typeof input === "string") {
    const raw2 = input.trim();
    if (!raw2) return [];
    try {
      const parsed = JSON.parse(raw2);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item || "").trim().toUpperCase()).filter(Boolean);
      }
    } catch {
      return raw2.split(",").map((item) => item.trim().toUpperCase()).filter(Boolean);
    }
  }
  return [];
}
function deriveAdPrefixes2(record) {
  const explicit = normalizePrefixes2(record?.ad_prefixes);
  if (explicit.length > 0) return explicit;
  const fromTags = normalizePrefixes2(record?.tags || "");
  if (fromTags.length > 0) return fromTags;
  const fromCode = normalizePrefixes2(record?.code || "");
  if (fromCode.length > 0) return fromCode;
  return [];
}
function toCompatRecord(record) {
  return {
    id: record.id,
    group_name: record.name || "",
    group_prefix: record.code || "",
    ad_prefixes: deriveAdPrefixes2(record),
    description: record.description || "",
    created_at: record.createdAt || null,
    updated_at: record.updatedAt || null
  };
}
async function syncGroupName(db, oldName, newName, now) {
  if (!oldName) return;
  await db.prepare(
    "UPDATE line_config SET group_name = ?, updatedAt = ? WHERE group_name = ?"
  ).bind(newName, now, oldName).run();
  await db.prepare(
    "UPDATE campaigns SET group_name = ?, updated_at = ? WHERE group_name = ?"
  ).bind(newName, now, oldName).run();
}
router5.get("/", async (c) => {
  try {
    const { results } = await c.env.DB.prepare("SELECT * FROM line_groups ORDER BY name ASC").all();
    return c.json({ success: true, data: (results || []).map(toCompatRecord) });
  } catch (err2) {
    return c.json({ success: false, error: err2.message }, 500);
  }
});
router5.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const groupName = String(body.group_name || "").trim();
    const groupPrefix = String(body.group_prefix || "").trim().toUpperCase();
    const description = String(body.description || "").trim();
    const adPrefixes = normalizePrefixes2(body.ad_prefixes);
    const result = await c.env.DB.prepare(
      "INSERT INTO line_groups (name, code, tags, ad_prefixes, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      groupName,
      groupPrefix,
      "",
      JSON.stringify(adPrefixes.length > 0 ? adPrefixes : groupPrefix ? [groupPrefix] : []),
      description,
      now,
      now
    ).run();
    return c.json({ success: true, data: { id: result.meta.last_row_id } });
  } catch (err2) {
    return c.json({ success: false, error: err2.message }, 500);
  }
});
router5.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const oldRow = await c.env.DB.prepare("SELECT * FROM line_groups WHERE id = ?").bind(id).first();
    const groupName = String(body.group_name || oldRow?.name || "").trim();
    const groupPrefix = String(body.group_prefix || oldRow?.code || "").trim().toUpperCase();
    const description = body.description !== void 0 ? String(body.description || "").trim() : String(oldRow?.description || "").trim();
    const adPrefixes = normalizePrefixes2(body.ad_prefixes);
    const finalPrefixes = adPrefixes.length > 0 ? adPrefixes : deriveAdPrefixes2(oldRow);
    await c.env.DB.prepare(
      "UPDATE line_groups SET name = ?, code = ?, ad_prefixes = ?, description = ?, updatedAt = ? WHERE id = ?"
    ).bind(
      groupName,
      groupPrefix,
      JSON.stringify(finalPrefixes),
      description,
      now,
      id
    ).run();
    if (oldRow?.name && oldRow.name !== groupName) {
      await syncGroupName(c.env.DB, oldRow.name, groupName, now);
    }
    return c.json({ success: true });
  } catch (err2) {
    return c.json({ success: false, error: err2.message }, 500);
  }
});
router5.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const row = await c.env.DB.prepare("SELECT * FROM line_groups WHERE id = ?").bind(id).first();
    if (row?.name) {
      await syncGroupName(c.env.DB, row.name, "", now);
    }
    await c.env.DB.prepare("DELETE FROM line_groups WHERE id = ?").bind(id).run();
    return c.json({ success: true });
  } catch (err2) {
    return c.json({ success: false, error: err2.message }, 500);
  }
});
var group_config_default = router5;

// src/index.ts
var app = new Hono2();
app.use("/api/*", cors());
app.onError((err2, c) => {
  console.error(`${err2}`);
  return c.json({ success: false, error: err2.message }, 500);
});
app.get("/health", (c) => c.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() }));
app.route("/api/v1/domains", domains_default);
app.route("/api/v1/shortlinks", shortlinks_default);
app.route("/api/v1/line-config", line_config_default);
app.route("/api/v1/line-groups", groups_default);
app.route("/api/v1/group-config", group_config_default);
app.route("/api/v1/pixel-groups", pixel_groups_default);
app.route("/api/v1/dashboard", dashboard_default);
app.get("/api/v1/groups", async (c) => {
  try {
    const { results: lineGroups } = await c.env.DB.prepare(
      "SELECT id, name, code, tags FROM line_groups ORDER BY name ASC"
    ).all();
    const { results: configGroups } = await c.env.DB.prepare(
      "SELECT DISTINCT group_name FROM line_config WHERE group_name IS NOT NULL AND group_name != '' ORDER BY group_name"
    ).all();
    const groupMap = /* @__PURE__ */ new Map();
    for (const g of lineGroups) {
      groupMap.set(g.name, {
        prefix: g.code || g.name,
        name: g.name,
        label: g.name
      });
    }
    for (const g of configGroups) {
      if (!groupMap.has(g.group_name)) {
        groupMap.set(g.group_name, {
          prefix: g.group_name,
          name: g.group_name,
          label: g.group_name
        });
      }
    }
    const groups = Array.from(groupMap.values());
    return c.json({ success: true, data: groups });
  } catch (err2) {
    return c.json({ success: false, error: err2.message }, 500);
  }
});
app.get("/api/v1/liff-options", async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT id, tag, name, liff_id, channel_id AS line_oa_id, group_name FROM line_config WHERE liff_id IS NOT NULL AND liff_id != '' ORDER BY group_name, tag ASC`
    ).all();
    const options = results.map((r) => ({
      id: String(r.id),
      tag: r.tag || "",
      name: r.name || "",
      label: r.tag ? `${r.tag} - ${r.name || ""}` : r.name || "",
      theme: "",
      liff_id: r.liff_id || "",
      line_oa_id: r.line_oa_id || "",
      group_name: r.group_name || ""
    }));
    return c.json({ success: true, data: options });
  } catch (err2) {
    return c.json({ success: false, error: err2.message }, 500);
  }
});
app.get("/api/v1/campaigns", async (c) => {
  const { search, page = "1", limit = "20" } = c.req.query();
  const offset = (parseInt(page) - 1) * parseInt(limit);
  let query = "SELECT * FROM campaigns";
  let countQuery = "SELECT COUNT(*) as total FROM campaigns";
  const params = [];
  if (search) {
    query += " WHERE name LIKE ?";
    countQuery += " WHERE name LIKE ?";
    params.push(`%${search}%`);
  }
  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(parseInt(limit), offset);
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  const totalResult = await c.env.DB.prepare(countQuery).bind(...search ? [`%${search}%`] : []).first();
  const items = results.map((row) => ({
    ...row,
    customer_links: JSON.parse(row.customer_links || "[]"),
    short_codes: JSON.parse(row.short_codes || "[]"),
    allowed_devices: JSON.parse(row.allowed_devices || "[]"),
    blacklist_rules: JSON.parse(row.blacklist_rules || "[]"),
    line_links: JSON.parse(row.line_links || "[]"),
    whatsapp_links: JSON.parse(row.whatsapp_links || "[]"),
    other_links: JSON.parse(row.other_links || "[]"),
    ad_pixels: JSON.parse(row.ad_pixels || "[]"),
    bc_pixels: JSON.parse(row.bc_pixels || "[]")
  }));
  return c.json({
    success: true,
    data: {
      items,
      total: totalResult?.total || 0,
      page: parseInt(page),
      limit: parseInt(limit)
    }
  });
});
app.get("/api/v1/campaigns/stats", async (c) => {
  const db = c.env.DB;
  try {
    const since = c.req.query("since") || null;
    const sinceClauseUL = since ? " AND ul.created_at >= ?" : "";
    const sinceClauseCK = since ? " AND ck.timestamp >= ?" : "";
    const campaignsResult = await db.prepare(`
      SELECT id, ad_code, approved_at FROM campaigns
    `).all();
    const campaigns = campaignsResult.results || [];
    const adCodeToCampaignId = {};
    const campaignIdToAdCode = {};
    for (const camp of campaigns) {
      if (camp.ad_code && camp.ad_code !== "") {
        adCodeToCampaignId[camp.ad_code] = camp.id;
      }
      campaignIdToAdCode[camp.id] = camp.ad_code || "";
    }
    const impressionsByCampaignIdStmt = db.prepare(`
      SELECT ul.campaign_id, COUNT(*) as cnt
      FROM unified_logs ul
      JOIN campaigns c ON c.id = ul.campaign_id
      WHERE ul.event_type = 'money_page_served'
        AND ul.campaign_id IS NOT NULL AND ul.campaign_id != ''
        ${sinceClauseUL ? "AND ul.created_at >= ?" : ""}
        AND (c.approved_at IS NULL OR ul.created_at >= c.approved_at)
      GROUP BY ul.campaign_id
    `);
    const impressionsByCampaignId = since ? await impressionsByCampaignIdStmt.bind(since).all() : await impressionsByCampaignIdStmt.all();
    const clicksByCampaignIdStmt = db.prepare(`
      SELECT ul.campaign_id, COUNT(*) as cnt
      FROM unified_logs ul
      JOIN campaigns c ON c.id = ul.campaign_id
      WHERE ul.event_type = 'money_page_button'
        AND ul.campaign_id IS NOT NULL AND ul.campaign_id != ''
        ${sinceClauseUL ? "AND ul.created_at >= ?" : ""}
        AND (c.approved_at IS NULL OR ul.created_at >= c.approved_at)
      GROUP BY ul.campaign_id
    `);
    const clicksByCampaignId = since ? await clicksByCampaignIdStmt.bind(since).all() : await clicksByCampaignIdStmt.all();
    const lineGroupsResult = await db.prepare(`
      SELECT code, tags FROM line_groups WHERE code IS NOT NULL AND code != ''
    `).all();
    const lineGroups = lineGroupsResult.results || [];
    const tagPrefixToGroupCode = {};
    for (const group of lineGroups) {
      if (!group.tags || group.tags.trim() === "") continue;
      const prefixes = group.tags.split(",").map((t) => t.trim().toUpperCase());
      for (const prefix of prefixes) {
        if (prefix) {
          tagPrefixToGroupCode[prefix] = group.code;
        }
      }
    }
    const rawClicksStmt = db.prepare(`
      SELECT ck.ad_code, COUNT(*) as cnt
      FROM clicks ck
      WHERE ck.matched = 1
        AND ck.ad_code IS NOT NULL AND ck.ad_code != ''
        ${sinceClauseCK ? "AND ck.timestamp >= ?" : ""}
      GROUP BY ck.ad_code
    `);
    const rawClicks = since ? await rawClicksStmt.bind(since).all() : await rawClicksStmt.all();
    const attributedByCampaignAdCode = {};
    for (const row of rawClicks.results || []) {
      const adCode = row.ad_code;
      const match2 = adCode.match(/^([A-Za-z]+)(\d+)$/);
      if (!match2) continue;
      const prefix = match2[1].toUpperCase();
      const numStr = match2[2];
      const groupCode = tagPrefixToGroupCode[prefix];
      if (!groupCode) continue;
      const numPadded = String(parseInt(numStr, 10)).padStart(2, "0");
      const derivedAdCode = `${groupCode}-${numPadded}`;
      attributedByCampaignAdCode[derivedAdCode] = (attributedByCampaignAdCode[derivedAdCode] || 0) + (row.cnt || 0);
    }
    const statsMap = {};
    for (const camp of campaigns) {
      statsMap[camp.id] = { impressions: 0, clicks: 0, attributed: 0 };
    }
    for (const row of impressionsByCampaignId.results || []) {
      if (statsMap[row.campaign_id] !== void 0) {
        statsMap[row.campaign_id].impressions = row.cnt || 0;
      }
    }
    for (const row of clicksByCampaignId.results || []) {
      if (statsMap[row.campaign_id] !== void 0) {
        statsMap[row.campaign_id].clicks = row.cnt || 0;
      }
    }
    for (const [derivedAdCode, cnt] of Object.entries(attributedByCampaignAdCode)) {
      const cid = adCodeToCampaignId[derivedAdCode];
      if (cid && statsMap[cid] !== void 0) {
        statsMap[cid].attributed = (statsMap[cid].attributed || 0) + cnt;
      }
    }
    const result = {};
    for (const [campaignId, stats] of Object.entries(statsMap)) {
      if (stats.impressions > 0 || stats.clicks > 0 || stats.attributed > 0) {
        result[campaignId] = {
          ad_code: campaignIdToAdCode[campaignId] || "",
          impressions: stats.impressions,
          clicks: stats.clicks,
          attributed: stats.attributed,
          ctr: stats.impressions > 0 ? Math.round(stats.clicks / stats.impressions * 1e4) / 1e4 : 0,
          cvr: stats.impressions > 0 ? Math.round(stats.attributed / stats.impressions * 1e4) / 1e4 : 0
        };
      }
    }
    return c.json({ success: true, data: result });
  } catch (err2) {
    console.error("Campaign stats error:", err2);
    return c.json({ success: false, error: err2.message || "Failed to fetch stats" }, 500);
  }
});
app.get("/api/v1/campaigns/:id", async (c) => {
  const id = c.req.param("id");
  const result = await c.env.DB.prepare("SELECT * FROM campaigns WHERE id = ?").bind(id).first();
  if (!result) {
    return c.json({ success: false, error: "Campaign not found" }, 404);
  }
  const campaign = {
    ...result,
    customer_links: JSON.parse(result.customer_links || "[]"),
    short_codes: JSON.parse(result.short_codes || "[]"),
    allowed_devices: JSON.parse(result.allowed_devices || "[]"),
    blacklist_rules: JSON.parse(result.blacklist_rules || "[]"),
    line_links: JSON.parse(result.line_links || "[]"),
    whatsapp_links: JSON.parse(result.whatsapp_links || "[]"),
    other_links: JSON.parse(result.other_links || "[]"),
    ad_pixels: JSON.parse(result.ad_pixels || "[]"),
    bc_pixels: JSON.parse(result.bc_pixels || "[]")
  };
  return c.json({ success: true, data: campaign });
});
app.post("/api/v1/campaigns", async (c) => {
  const body = await c.req.json();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const id = crypto.randomUUID();
  const strategy = body.routing_strategy || body.link_strategy || "random";
  const countryVal = body.country || body.cloak_country || "";
  const result = await c.env.DB.prepare(
    `INSERT INTO campaigns (
      id, name, theme, status, safe_page_id, money_page_id,
      customer_links, short_codes, routing_strategy, link_strategy,
      allowed_devices, require_residential, residential_only,
      pixel_tk, pixel_fb, pixel_ga, pixel_google_ad, pixel_google_conv,
      cloak_lang, cloak_os, cloak_os_version, cloak_country, country,
      cloak_region, cloak_traffic_source,
      safe_page_type, safe_page_action, safe_page_content,
      blacklist_rules, require_fbclid, back_redirect_url, exit_popup_text,
      title, link, template_id,
      line_links, whatsapp_links, other_links,
      allow_desktop, allow_mobile,
      ad_pixels, bc_pixels,
      ad_code, group_name, ip_pinning, tag,
      liff_id, line_oa_id, liff_links,
      details_id, details_url, cloak_province,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    body.name || "",
    body.theme || "",
    body.status || "active",
    body.safe_page_id || "",
    body.money_page_id || "",
    JSON.stringify(body.customer_links || []),
    JSON.stringify(body.short_codes || []),
    strategy,
    strategy,
    JSON.stringify(body.allowed_devices || []),
    body.require_residential ? 1 : 0,
    body.residential_only ? 1 : 0,
    body.pixel_tk || "",
    body.pixel_fb || "",
    body.pixel_ga || "",
    body.pixel_google_ad || "",
    body.pixel_google_conv || "",
    body.cloak_lang || body.cloak_language || "",
    body.cloak_os || "",
    body.cloak_os_version || "",
    countryVal,
    countryVal,
    body.cloak_region || "",
    body.cloak_traffic_source || "",
    body.safe_page_type || "",
    body.safe_page_action || "",
    body.safe_page_content || "",
    JSON.stringify(body.blacklist_rules || []),
    body.require_fbclid ? 1 : 0,
    body.back_redirect_url || "",
    body.exit_popup_text || "",
    body.title || "",
    body.link || "",
    body.template_id || "",
    JSON.stringify(body.line_links || []),
    JSON.stringify(body.whatsapp_links || []),
    JSON.stringify(body.other_links || []),
    body.allow_desktop !== void 0 ? body.allow_desktop ? 1 : 0 : 1,
    body.allow_mobile !== void 0 ? body.allow_mobile ? 1 : 0 : 1,
    JSON.stringify(body.ad_pixels || []),
    JSON.stringify(body.bc_pixels || []),
    body.ad_code || "",
    body.group_name || "",
    body.ip_pinning ? 1 : 0,
    body.tag || null,
    body.liff_id || "",
    body.line_oa_id || "",
    JSON.stringify(body.liff_links || []),
    body.details_id || "",
    body.details_url || "",
    body.cloak_province || "",
    now,
    now
  ).run();
  const newLink = body.link || "";
  if (newLink && c.env.CLOAKER_CONFIG) {
    c.executionCtx.waitUntil(
      c.env.CLOAKER_CONFIG.delete(`cfg:${newLink}`).catch(() => {
      })
    );
  }
  return c.json({ success: true, data: { id } });
});
app.put("/api/v1/campaigns/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const existing = await c.env.DB.prepare("SELECT * FROM campaigns WHERE id = ?").bind(id).first();
  if (!existing) {
    return c.json({ success: false, error: "Campaign not found" }, 404);
  }
  const m = (key, fallback = "") => body[key] !== void 0 ? body[key] : existing[key] ?? fallback;
  const mJSON = (key) => body[key] !== void 0 ? JSON.stringify(body[key]) : existing[key] ?? "[]";
  const mBool = (key, def = 0) => body[key] !== void 0 ? body[key] ? 1 : 0 : existing[key] ?? def;
  const strategy = body.routing_strategy !== void 0 || body.link_strategy !== void 0 ? body.routing_strategy || body.link_strategy || "random" : existing.routing_strategy || "random";
  const countryVal = body.country !== void 0 || body.cloak_country !== void 0 ? body.country || body.cloak_country || "" : existing.country || "";
  await c.env.DB.prepare(
    `UPDATE campaigns SET 
      name = ?, theme = ?, status = ?, safe_page_id = ?, money_page_id = ?,
      customer_links = ?, short_codes = ?, routing_strategy = ?, link_strategy = ?,
      allowed_devices = ?, require_residential = ?, residential_only = ?,
      pixel_tk = ?, pixel_fb = ?, pixel_ga = ?, pixel_google_ad = ?, pixel_google_conv = ?,
      cloak_lang = ?, cloak_os = ?, cloak_os_version = ?, cloak_country = ?, country = ?,
      cloak_region = ?, cloak_traffic_source = ?,
      safe_page_type = ?, safe_page_action = ?, safe_page_content = ?,
      blacklist_rules = ?, require_fbclid = ?, back_redirect_url = ?, exit_popup_text = ?,
      title = ?, link = ?, template_id = ?,
      line_links = ?, whatsapp_links = ?, other_links = ?,
      allow_desktop = ?, allow_mobile = ?,
      ad_pixels = ?, bc_pixels = ?,
      ad_code = ?, group_name = ?, ip_pinning = ?, tag = ?,
      liff_id = ?, line_oa_id = ?, liff_links = ?,
      details_id = ?, details_url = ?, cloak_province = ?,
      updated_at = ?
    WHERE id = ?`
  ).bind(
    m("name"),
    m("theme"),
    m("status", "active"),
    m("safe_page_id"),
    m("money_page_id"),
    mJSON("customer_links"),
    mJSON("short_codes"),
    strategy,
    strategy,
    mJSON("allowed_devices"),
    mBool("require_residential"),
    mBool("residential_only"),
    m("pixel_tk"),
    m("pixel_fb"),
    m("pixel_ga"),
    m("pixel_google_ad"),
    m("pixel_google_conv"),
    body.cloak_lang !== void 0 ? body.cloak_lang : body.cloak_language !== void 0 ? body.cloak_language : existing.cloak_lang ?? "",
    m("cloak_os"),
    m("cloak_os_version"),
    countryVal,
    countryVal,
    m("cloak_region"),
    m("cloak_traffic_source"),
    m("safe_page_type"),
    m("safe_page_action"),
    m("safe_page_content"),
    mJSON("blacklist_rules"),
    mBool("require_fbclid"),
    m("back_redirect_url"),
    m("exit_popup_text"),
    m("title"),
    m("link"),
    m("template_id"),
    mJSON("line_links"),
    mJSON("whatsapp_links"),
    mJSON("other_links"),
    mBool("allow_desktop", 1),
    mBool("allow_mobile", 1),
    mJSON("ad_pixels"),
    mJSON("bc_pixels"),
    m("ad_code"),
    m("group_name"),
    mBool("ip_pinning"),
    m("tag", null),
    m("liff_id"),
    m("line_oa_id"),
    mJSON("liff_links"),
    m("details_id"),
    m("details_url"),
    m("cloak_province"),
    now,
    id
  ).run();
  if (c.env.CLOAKER_CONFIG) {
    const oldLink = existing.link || "";
    const newLink = body.link !== void 0 ? body.link || "" : oldLink;
    const kvDeletes = [];
    if (oldLink) kvDeletes.push(c.env.CLOAKER_CONFIG.delete(`cfg:${oldLink}`).catch(() => {
    }));
    if (newLink && newLink !== oldLink) kvDeletes.push(c.env.CLOAKER_CONFIG.delete(`cfg:${newLink}`).catch(() => {
    }));
    if (kvDeletes.length > 0) c.executionCtx.waitUntil(Promise.all(kvDeletes));
  }
  return c.json({ success: true });
});
app.delete("/api/v1/campaigns/:id", async (c) => {
  const id = c.req.param("id");
  const toDelete = await c.env.DB.prepare("SELECT link FROM campaigns WHERE id = ?").bind(id).first();
  await c.env.DB.prepare("DELETE FROM campaigns WHERE id = ?").bind(id).run();
  const deletedLink = toDelete ? toDelete.link || "" : "";
  if (deletedLink && c.env.CLOAKER_CONFIG) {
    c.executionCtx.waitUntil(
      c.env.CLOAKER_CONFIG.delete(`cfg:${deletedLink}`).catch(() => {
      })
    );
  }
  return c.json({ success: true });
});
app.get("/api/v1/logs", async (c) => {
  const db = c.env.DB;
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "20");
  const verdict = c.req.query("verdict");
  const search = c.req.query("search");
  const offset = (page - 1) * limit;
  let conditions = [];
  let params = [];
  if (verdict) {
    conditions.push("verdict = ?");
    params.push(verdict);
  }
  if (search) {
    conditions.push("(ip LIKE ? OR domain LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  const where = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
  const countResult = await db.prepare(
    `SELECT COUNT(*) as total FROM cloak_logs ${where}`
  ).bind(...params).first();
  const items = await db.prepare(
    `SELECT * FROM cloak_logs ${where} ORDER BY id DESC LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all();
  return c.json({
    success: true,
    data: {
      items: items.results,
      total: countResult?.total || 0,
      page,
      limit
    }
  });
});
app.get("/api/v1/visit-logs", async (c) => {
  const db = c.env.DB;
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "20");
  const offset = (page - 1) * limit;
  const tab = c.req.query("tab") || "all";
  const search = c.req.query("search");
  const campaignId = c.req.query("campaign_id");
  const campaignIds = c.req.query("campaign_ids");
  const startDate = c.req.query("start_date");
  const endDate = c.req.query("end_date");
  let conditions = [];
  let params = [];
  if (tab === "safe_page") {
    conditions.push(`(verdict = 'blocked' OR event_type IN ('bot_blocked','country_blocked','verified_bot','cloak_block','rate_limited','ip_reputation','safe_page_served'))`);
  } else if (tab === "money_page") {
    conditions.push(`(verdict = 'allowed' OR event_type IN ('money_page_served','redirect_to_link','jwt_passed','jwt_expired_reissue'))`);
  } else if (tab === "money_page_button") {
    conditions.push(`event_type IN ('money_page_button','fp_check','interaction_detect','cta_click')`);
  } else if (tab === "safe_page_button") {
    conditions.push(`event_type IN ('safe_page_button','form_submit')`);
  }
  if (search) {
    conditions.push("(ip LIKE ? OR domain LIKE ? OR visitor_id LIKE ? OR ad_code LIKE ?)");
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (campaignId && campaignId !== "all") {
    conditions.push("campaign_id = ?");
    params.push(campaignId);
  } else if (campaignIds) {
    const ids = campaignIds.split(",").map((id) => id.trim()).filter(Boolean);
    if (ids.length > 0) {
      conditions.push(`campaign_id IN (${ids.map(() => "?").join(",")})`);
      params.push(...ids);
    }
  }
  if (startDate) {
    conditions.push("created_at >= ?");
    params.push(startDate);
  }
  if (endDate) {
    conditions.push("created_at <= ?");
    params.push(endDate + "T23:59:59.999Z");
  }
  const where = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
  const countResult = await db.prepare(
    `SELECT COUNT(*) as total FROM unified_logs ${where}`
  ).bind(...params).first();
  const items = await db.prepare(
    `SELECT id, request_id, visitor_id, session_id, event_type, verdict, reason,
            decision_layer, result, ip, ua, country, language, referer, domain,
            tag, ad_code, fbclid, pixel_id, campaign_id, event_data,
            processing_time_ms, created_at, asn
     FROM unified_logs ${where} ORDER BY id DESC LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all();
  return c.json({
    success: true,
    data: {
      items: items.results,
      total: countResult?.total || 0,
      page,
      limit
    }
  });
});
app.get("/api/v1/clicks", async (c) => {
  const db = c.env.DB;
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "20");
  const matched = c.req.query("matched");
  const source = c.req.query("source");
  const tag = c.req.query("tag");
  const search = c.req.query("search");
  const startDate = c.req.query("start_date");
  const endDate = c.req.query("end_date");
  const offset = (page - 1) * limit;
  let conditions = [];
  let params = [];
  if (matched && matched !== "all") {
    conditions.push("matched = ?");
    params.push(parseInt(matched));
  }
  if (source) {
    conditions.push("source = ?");
    params.push(source);
  }
  if (tag) {
    conditions.push("tag = ?");
    params.push(tag);
  }
  if (startDate) {
    conditions.push("timestamp >= ?");
    params.push(startDate);
  }
  if (endDate) {
    conditions.push("timestamp <= ?");
    params.push(endDate);
  }
  if (search) {
    conditions.push("(visitor_id LIKE ? OR fbclid LIKE ? OR tag LIKE ? OR destination LIKE ?)");
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  const where = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
  const countResult = await db.prepare(
    `SELECT COUNT(*) as total FROM clicks ${where}`
  ).bind(...params).first();
  const items = await db.prepare(
    `SELECT * FROM clicks ${where} ORDER BY timestamp DESC LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all();
  return c.json({
    success: true,
    data: {
      items: items.results,
      total: countResult?.total || 0,
      page,
      limit
    }
  });
});
function optimizeHtml(html) {
  html = html.replace(/<!--(?!\[if)(?!\[endif)[\s\S]*?-->/g, "");
  html = html.replace(/<script[^>]*chrome-extension[^>]*>[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<script[^>]*beacon\.min\.js[^>]*>[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<script[^>]*gtm\.js[^>]*>[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<script[^>]*wp-emoji[^>]*>[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<script[^>]*>[\s\S]*?_wpemojiSettings[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<style[^>]*id=["']wp-emoji[^"'>]*["'][^>]*>[\s\S]*?<\/style>/gi, "");
  html = html.replace(/<script[^>]*type=["']application\/json["'][^>]*>[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<link[^>]*type=["']application\/(rss|atom)\+xml["'][^>]*>/gi, "");
  html = html.replace(/<link[^>]*href=["'][^"']*\/feed\/["'][^>]*>/gi, "");
  html = html.replace(/<link[^>]*href=["'][^"']*\/comments\/feed\/["'][^>]*>/gi, "");
  html = html.replace(/<link[^>]*wlwmanifest[^>]*>/gi, "");
  html = html.replace(/<link[^>]*EditURI[^>]*>/gi, "");
  html = html.replace(/<link[^>]*rel=["']shortlink["'][^>]*>/gi, "");
  html = html.replace(/<link[^>]*rel=["']pingback["'][^>]*>/gi, "");
  const fontFaceBlocks = html.match(/@font-face\s*\{[^}]*fonts\.gstatic\.com[^}]*\}/g) || [];
  if (fontFaceBlocks.length > 5) {
    const toRemove = fontFaceBlocks.slice(5);
    for (const block of toRemove) {
      html = html.replace(block, "");
    }
  }
  let imgCount = 0;
  const FIRST_SCREEN_COUNT = 3;
  html = html.replace(
    /(<img[^>]*?)\ssrc=(["'])([^"']+)\2/gi,
    (_match, pre, q, src) => {
      imgCount++;
      if (src.startsWith("data:") || src.toLowerCase().endsWith(".svg") || src.includes("/cdn-cgi/image/")) {
        if (imgCount > FIRST_SCREEN_COUNT && !pre.includes("loading=")) {
          return `${pre} loading="lazy" src=${q}${src}${q}`;
        }
        return _match;
      }
      const cfUrl = `/cdn-cgi/image/format=auto,quality=80/${src}`;
      if (imgCount > FIRST_SCREEN_COUNT && !pre.includes("loading=")) {
        return `${pre} loading="lazy" src=${q}${cfUrl}${q}`;
      }
      return `${pre} src=${q}${cfUrl}${q}`;
    }
  );
  html = html.replace(
    /url\(['"]?([^'"\)\s]+)['"]?\)/g,
    (full, url) => {
      if (url.startsWith("data:") || url.toLowerCase().endsWith(".svg")) return full;
      if (url.includes("/cdn-cgi/image/")) return full;
      if (/fonts\.gstatic\.com|\.(woff2?|ttf|eot)$/i.test(url)) return full;
      if (/\.(jpe?g|png|gif|webp|bmp)(\?|$)/i.test(url)) {
        return `url('/cdn-cgi/image/format=auto,quality=80/${url}')`;
      }
      return full;
    }
  );
  const allUrls = html.match(/https?:\/\/([^\/\s"']+)/g) || [];
  const preconnectDomains = /* @__PURE__ */ new Set();
  for (const u of allUrls) {
    try {
      const domain = new URL(u).hostname;
      if (/cdx\.lativ|cdnjs\.cloudflare|connect\.facebook/.test(domain)) {
        preconnectDomains.add(domain);
      }
    } catch {
    }
  }
  if (allUrls.some((u) => u.includes("fonts.googleapis.com"))) {
    preconnectDomains.add("fonts.googleapis.com");
    preconnectDomains.add("fonts.gstatic.com");
  }
  html = html.replace(/<link[^>]*rel=["'](?:preconnect|dns-prefetch)["'][^>]*>\s*/gi, "");
  if (preconnectDomains.size > 0) {
    let tags = "";
    for (const domain of Array.from(preconnectDomains).sort()) {
      tags += `<link rel="preconnect" href="https://${domain}" crossorigin>
`;
      tags += `<link rel="dns-prefetch" href="https://${domain}">
`;
    }
    const headMatch = html.match(/<head[^>]*>/i);
    if (headMatch) {
      html = html.replace(headMatch[0], headMatch[0] + "\n" + tags);
    }
  }
  html = html.replace(/\n\s*\n\s*\n/g, "\n\n");
  html = html.replace(/\n[ \t]+/g, "\n");
  html = html.replace(/[ \t]+\n/g, "\n");
  html = html.replace(/<style[^>]*>\s*<\/style>/gi, "");
  html = html.replace(/<script[^>]*>\s*<\/script>/gi, "");
  return html;
}
function makeToAbsolute(baseUrl) {
  return (href) => {
    if (!href || href.startsWith("data:") || href.startsWith("javascript:") || href.startsWith("#") || href.startsWith("blob:") || href.startsWith("mailto:") || href.startsWith("tel:")) return null;
    try {
      if (href.startsWith("//")) return "https:" + href;
      if (href.startsWith("http://") || href.startsWith("https://")) return href;
      if (href.startsWith("/")) return baseUrl.origin + href;
      return new URL(href, baseUrl.href).href;
    } catch {
      return null;
    }
  };
}
function rewriteAllPaths(html, toAbsolute) {
  html = html.replace(/(<(?:img|source)[^>]+?)\s(src)=(["'])([^"']+)/gi, (_match, pre, attr, q, val) => {
    const abs = toAbsolute(val);
    return abs ? `${pre} ${attr}=${q}${abs}${q}` : _match;
  });
  html = html.replace(/(<(?:img|source)[^>]+?)\ssrcset=(["'])([^"']+)/gi, (_match, pre, q, val) => {
    const rewritten = val.replace(/([^\s,][^\s,]*?)(\s+\d+(?:\.\d+)?[wx])?(?=\s*,|\s*$)/g, (part, url, descriptor = "") => {
      const trimmed = url.trim();
      if (!trimmed) return part;
      const abs = toAbsolute(trimmed);
      return abs ? abs + descriptor : part;
    });
    return `${pre} srcset=${q}${rewritten}${q}`;
  });
  const lazyAttrs = ["data-src", "data-lazy-src", "data-original", "data-lazy", "data-bg", "data-background", "data-url", "data-image", "data-echo", "data-lazyload"];
  for (const attr of lazyAttrs) {
    const escapedAttr = attr.replace(/-/g, "-");
    const re = new RegExp(`(${escapedAttr})=(["'])([^"']+)\\2`, "gi");
    html = html.replace(re, (_match, a, q, val) => {
      const abs = toAbsolute(val);
      return abs ? `${a}=${q}${abs}${q}` : _match;
    });
  }
  html = html.replace(/(<link[^>]+?)\shref=(["'])([^"']+)/gi, (_match, pre, q, val) => {
    const abs = toAbsolute(val);
    return abs ? `${pre} href=${q}${abs}${q}` : _match;
  });
  html = html.replace(/(<script[^>]+?)\ssrc=(["'])([^"']+)/gi, (_match, pre, q, val) => {
    const abs = toAbsolute(val);
    return abs ? `${pre} src=${q}${abs}${q}` : _match;
  });
  html = html.replace(/(<(?:video|audio)[^>]+?)\s(src|poster)=(["'])([^"']+)/gi, (_match, pre, attr, q, val) => {
    const abs = toAbsolute(val);
    return abs ? `${pre} ${attr}=${q}${abs}${q}` : _match;
  });
  html = html.replace(/style=(["'])[^"']*url\([^)]+\)[^"']*/gi, (match2) => {
    return match2.replace(/url\(['"]?([^'")\s]+)['"]?\)/g, (urlMatch, p1) => {
      const abs = toAbsolute(p1);
      return abs ? `url('${abs}')` : urlMatch;
    });
  });
  return html;
}
app.post("/api/v1/templates/crawl", async (c) => {
  const { url } = await c.req.json();
  if (!url) return c.json({ success: false, error: "URL \u4E0D\u80FD\u70BA\u7A7A" }, 400);
  const MAX_RESOURCES = 150;
  const MAX_IMAGE_SIZE = 500 * 1024;
  let stats = { total: 0, success: 0, failed: 0 };
  try {
    const baseUrl = new URL(url);
    const htmlRes = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
    });
    if (!htmlRes.ok) return c.json({ success: false, error: `\u7121\u6CD5\u6293\u53D6\u9801\u9762\uFF1AHTTP ${htmlRes.status}` }, 400);
    let html = await htmlRes.text();
    const toAbsolute = makeToAbsolute(baseUrl);
    html = rewriteAllPaths(html, toAbsolute);
    const resources = [];
    const cssMatches = [
      ...html.matchAll(/<link[^>]+rel=(["'])stylesheet[^>]*href=(["'])([^"']+)[^>]*>/gi),
      ...html.matchAll(/<link[^>]+href=(["'])([^"']+)[^>]*rel=(["'])stylesheet[^>]*>/gi)
    ];
    for (const m of cssMatches) {
      const href = m[3] || m[2];
      if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
        resources.push({ type: "css", original: href, absolute: href });
      }
    }
    const imgMatches = [...html.matchAll(/<img[^>]+src=(["'])([^"']+)[^>]*/gi)];
    for (const m of imgMatches) {
      const src = m[2];
      if (src && (src.startsWith("http://") || src.startsWith("https://"))) {
        resources.push({ type: "img", original: src, absolute: src });
      }
    }
    stats.total = resources.length;
    const processedResources = resources.slice(0, MAX_RESOURCES);
    for (const res of processedResources) {
      try {
        const r = await fetch(res.absolute, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
          signal: AbortSignal.timeout(8e3)
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        if (res.type === "css") {
          let cssContent = await r.text();
          const cssBaseUrl = new URL(res.absolute);
          const cssToAbsolute = makeToAbsolute(cssBaseUrl);
          cssContent = cssContent.replace(/url\(['"]?([^'")\s]+)['"]?\)/g, (match2, p1) => {
            const abs = cssToAbsolute(p1);
            return abs ? `url('${abs}')` : match2;
          });
          const escapedHref = res.original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          html = html.replace(
            new RegExp(`<link[^>]*href=(["'])${escapedHref}\\1[^>]*>`, "i"),
            `<style>${cssContent}</style>`
          );
          stats.success++;
        } else if (res.type === "img") {
          const buf = await r.arrayBuffer();
          if (buf.byteLength <= MAX_IMAGE_SIZE) {
            const contentType = r.headers.get("content-type") || "image/jpeg";
            const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
            const escapedSrc = res.original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            html = html.replace(
              new RegExp(`src=(["'])${escapedSrc}\\1`, "gi"),
              `src="data:${contentType};base64,${base64}"`
            );
            stats.success++;
          } else {
            stats.success++;
          }
        }
      } catch {
        stats.failed++;
      }
    }
    html = optimizeHtml(html);
    const htmlSize = new TextEncoder().encode(html).length;
    return c.json({
      success: true,
      data: {
        html,
        stats: {
          total: stats.total,
          success: stats.success,
          failed: stats.failed,
          htmlSize
        }
      }
    });
  } catch (e) {
    return c.json({ success: false, error: e.message || "\u63A1\u96C6\u5931\u6557" }, 500);
  }
});
app.post("/api/v1/templates/scrape", async (c) => {
  const body = await c.req.json();
  const { url, name, country, type, status } = body;
  if (!url || !name) {
    return c.json({ success: false, error: "URL \u548C\u540D\u7A31\u4E0D\u80FD\u70BA\u7A7A" }, 400);
  }
  try {
    const baseUrl = new URL(url);
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
    });
    if (!response.ok) {
      return c.json({ success: false, error: `\u7121\u6CD5\u6293\u53D6\u9801\u9762\uFF1AHTTP ${response.status}` }, 400);
    }
    let html = await response.text();
    const toAbsolute = makeToAbsolute(baseUrl);
    html = rewriteAllPaths(html, toAbsolute);
    const cssMatches = [
      ...html.matchAll(/<link[^>]+rel=(["'])stylesheet[^>]*href=(["'])([^"']+)[^>]*>/gi),
      ...html.matchAll(/<link[^>]+href=(["'])([^"']+)[^>]*rel=(["'])stylesheet[^>]*>/gi)
    ];
    const cssResources = [];
    for (const m of cssMatches) {
      const href = m[3] || m[2];
      if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
        cssResources.push({ original: href });
      }
    }
    for (const res of cssResources.slice(0, 30)) {
      try {
        const r = await fetch(res.original, {
          headers: { "User-Agent": "Mozilla/5.0" },
          signal: AbortSignal.timeout(5e3)
        });
        if (!r.ok) continue;
        let cssContent = await r.text();
        const cssBaseUrl = new URL(res.original);
        const cssToAbsolute = makeToAbsolute(cssBaseUrl);
        cssContent = cssContent.replace(/url\(['"]?([^'")\s]+)['"]?\)/g, (match2, p1) => {
          const abs = cssToAbsolute(p1);
          return abs ? `url('${abs}')` : match2;
        });
        const escapedHref = res.original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        html = html.replace(
          new RegExp(`<link[^>]*href=(["'])${escapedHref}\\1[^>]*>`, "i"),
          `<style>${cssContent}</style>`
        );
      } catch {
      }
    }
    html = optimizeHtml(html);
    const id = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await c.env.DB.prepare(
      `INSERT INTO templates (id, type, country, name, identifier, status, content, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      type || "safe_page",
      country || "TW",
      name,
      `TPL-${Date.now()}`,
      status || "active",
      html,
      now,
      now
    ).run();
    const result = await c.env.DB.prepare(
      "SELECT * FROM templates WHERE id = ?"
    ).bind(id).first();
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, error: error.message || "\u63A1\u96C6\u5931\u6557" }, 500);
  }
});
app.get("/api/v1/templates", async (c) => {
  const { search, type, page = "1", limit = "20" } = c.req.query();
  const offset = (parseInt(page) - 1) * parseInt(limit);
  let query = "SELECT * FROM templates";
  let countQuery = "SELECT COUNT(*) as total FROM templates";
  const params = [];
  const whereConditions = [];
  if (search) {
    whereConditions.push("name LIKE ?");
    params.push(`%${search}%`);
  }
  if (type) {
    whereConditions.push("type = ?");
    params.push(type);
  }
  if (whereConditions.length > 0) {
    query += " WHERE " + whereConditions.join(" AND ");
    countQuery += " WHERE " + whereConditions.join(" AND ");
  }
  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(parseInt(limit), offset);
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  const countParams = whereConditions.length > 0 ? params.slice(0, params.length - 2) : [];
  const totalResult = await c.env.DB.prepare(countQuery).bind(...countParams).first();
  return c.json({
    success: true,
    data: {
      items: results,
      total: totalResult?.total || 0,
      page: parseInt(page),
      limit: parseInt(limit)
    }
  });
});
app.post("/api/v1/templates/upload-zip", async (c) => {
  try {
    let resolveZipAsset2 = function(relativePath) {
      const candidates = [
        htmlBasePath + relativePath,
        relativePath,
        relativePath.replace(/^\.?\//, "")
      ];
      for (const candidate of candidates) {
        const normalizedCandidate = candidate.toLowerCase();
        if (decompressed[candidate]) {
          const ext = "." + candidate.split(".").pop()?.toLowerCase();
          const mime = mimeMap[ext];
          if (!mime) return null;
          const bytes = decompressed[candidate];
          if (bytes.length > 500 * 1024) return null;
          if (mime === "text/css" || mime === "application/javascript") {
            return null;
          }
          let binary = "";
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          return `data:${mime};base64,${btoa(binary)}`;
        }
        if (fileIndex[normalizedCandidate] && decompressed[fileIndex[normalizedCandidate]]) {
          const actualPath = fileIndex[normalizedCandidate];
          const ext = "." + actualPath.split(".").pop()?.toLowerCase();
          const mime = mimeMap[ext];
          if (!mime) return null;
          const bytes = decompressed[actualPath];
          if (bytes.length > 500 * 1024) return null;
          if (mime === "text/css" || mime === "application/javascript") {
            return null;
          }
          let binary = "";
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          return `data:${mime};base64,${btoa(binary)}`;
        }
      }
      return null;
    };
    var resolveZipAsset = resolveZipAsset2;
    const formData = await c.req.formData();
    const file = formData.get("file");
    const name = formData.get("name") || "ZIP \u4E0A\u50B3";
    const type = formData.get("type") || "money_page";
    const country = formData.get("country") || "TW";
    const status = formData.get("status") || "active";
    if (!file) {
      return c.json({ success: false, error: "\u8ACB\u4E0A\u50B3 ZIP \u6A94\u6848" }, 400);
    }
    if (file.size > 10 * 1024 * 1024) {
      return c.json({ success: false, error: "ZIP \u6A94\u6848\u4E0D\u80FD\u8D85\u904E 10MB" }, 400);
    }
    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    const decompressed = unzipSync(uint8);
    const fileIndex = {};
    for (const filePath of Object.keys(decompressed)) {
      const normalized = filePath.replace(/^[^/]+\//, "").toLowerCase();
      fileIndex[normalized] = filePath;
    }
    let htmlContent = "";
    let htmlBasePath = "";
    for (const [filePath, data] of Object.entries(decompressed)) {
      const fileName = filePath.split("/").pop()?.toLowerCase();
      if (fileName === "index.html" || fileName === "index.htm") {
        htmlContent = new TextDecoder().decode(data);
        const parts = filePath.split("/");
        parts.pop();
        htmlBasePath = parts.length > 0 ? parts.join("/") + "/" : "";
        break;
      }
    }
    if (!htmlContent) {
      return c.json({ success: false, error: "ZIP \u4E2D\u627E\u4E0D\u5230 index.html" }, 400);
    }
    const mimeMap = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
      ".webp": "image/webp",
      ".ico": "image/x-icon",
      ".bmp": "image/bmp",
      ".css": "text/css",
      ".js": "application/javascript",
      ".woff": "font/woff",
      ".woff2": "font/woff2",
      ".ttf": "font/ttf",
      ".eot": "application/vnd.ms-fontobject"
    };
    htmlContent = htmlContent.replace(
      /(<img[^>]+?)\ssrc=(["'])([^"']+)\2/gi,
      (match2, pre, q, src) => {
        if (src.startsWith("data:") || src.startsWith("http://") || src.startsWith("https://")) return match2;
        const dataUri = resolveZipAsset2(src);
        return dataUri ? `${pre} src=${q}${dataUri}${q}` : match2;
      }
    );
    htmlContent = htmlContent.replace(
      /url\(['"]?([^'")\s]+)['"]?\)/g,
      (match2, src) => {
        if (src.startsWith("data:") || src.startsWith("http://") || src.startsWith("https://")) return match2;
        const dataUri = resolveZipAsset2(src);
        return dataUri ? `url('${dataUri}')` : match2;
      }
    );
    htmlContent = htmlContent.replace(
      /<link[^>]+href=(["'])([^"']+\.css)\1[^>]*>/gi,
      (match2, q, href) => {
        if (href.startsWith("http://") || href.startsWith("https://")) return match2;
        const candidates = [htmlBasePath + href, href, href.replace(/^\.?\//, "")];
        for (const candidate of candidates) {
          if (decompressed[candidate]) {
            let cssContent = new TextDecoder().decode(decompressed[candidate]);
            cssContent = cssContent.replace(
              /url\(['"]?([^'")\s]+)['"]?\)/g,
              (m, cssSrc) => {
                if (cssSrc.startsWith("data:") || cssSrc.startsWith("http://") || cssSrc.startsWith("https://")) return m;
                const cssDirParts = candidate.split("/");
                cssDirParts.pop();
                const cssDir = cssDirParts.length > 0 ? cssDirParts.join("/") + "/" : "";
                const resolvedPath = cssDir + cssSrc;
                const dataUri = resolveZipAsset2(resolvedPath);
                return dataUri ? `url('${dataUri}')` : m;
              }
            );
            return `<style>/* ${href} */
${cssContent}</style>`;
          }
          const normalizedCandidate = candidate.toLowerCase();
          if (fileIndex[normalizedCandidate] && decompressed[fileIndex[normalizedCandidate]]) {
            let cssContent = new TextDecoder().decode(decompressed[fileIndex[normalizedCandidate]]);
            return `<style>/* ${href} */
${cssContent}</style>`;
          }
        }
        return match2;
      }
    );
    htmlContent = htmlContent.replace(
      /<script[^>]+src=(["'])([^"']+\.js)\1[^>]*><\/script>/gi,
      (match2, q, src) => {
        if (src.startsWith("http://") || src.startsWith("https://")) return match2;
        const candidates = [htmlBasePath + src, src, src.replace(/^\.?\//, "")];
        for (const candidate of candidates) {
          if (decompressed[candidate]) {
            const jsContent = new TextDecoder().decode(decompressed[candidate]);
            return `<script>/* ${src} */
${jsContent}</script>`;
          }
          const normalizedCandidate = candidate.toLowerCase();
          if (fileIndex[normalizedCandidate] && decompressed[fileIndex[normalizedCandidate]]) {
            const jsContent = new TextDecoder().decode(decompressed[fileIndex[normalizedCandidate]]);
            return `<script>/* ${src} */
${jsContent}</script>`;
          }
        }
        return match2;
      }
    );
    const id = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await c.env.DB.prepare(
      `INSERT INTO templates (id, type, country, name, identifier, status, content, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, type, country, name, `ZIP-${Date.now()}`, status, htmlContent, now, now).run();
    const result = await c.env.DB.prepare("SELECT * FROM templates WHERE id = ?").bind(id).first();
    return c.json({ success: true, data: result });
  } catch (e) {
    return c.json({ success: false, error: e.message || "ZIP \u4E0A\u50B3\u5931\u6557" }, 500);
  }
});
app.get("/api/v1/templates/system", async (c) => {
  const systemThemes = [
    {
      id: "sys-line",
      name: "LINE \u4E3B\u984C\u63A8\u5EE3\u9801",
      type: "money_page",
      country: "TW",
      description: "LINE \u7DBA\u8272\u80CC\u666F\uFF0C\u5F15\u5C0E\u7528\u6236\u958B\u555F LINE \u52A0\u5165\u597D\u53CB",
      thumbnail: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iIzA2Qzc1NSIvPjx0ZXh0IHg9IjEwMCIgeT0iNjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1zaXplPSIxNiI+TElORSDkuLvpoYw8L3RleHQ+PC9zdmc+",
      identifier: "sys-line"
    },
    {
      id: "sys-bf",
      name: "BF \u4F4E\u8ABF\u63A8\u5EE3\u9801",
      type: "money_page",
      country: "TW",
      description: "\u91D1\u8272\u6DF1\u8272\u8CEA\u611F\uFF0C\u9069\u5408\u6D3B\u52D5\u63A8\u5EE3\u4F7F\u7528",
      thumbnail: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iIzFhMWEyZSIvPjx0ZXh0IHg9IjEwMCIgeT0iNjAiIGZpbGw9IiNmZmQ3MDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LXNpemU9IjE2Ij5CRiDmtLvli5U8L3RleHQ+PC9zdmc+",
      identifier: "sys-bf"
    },
    {
      id: "sys-skyai",
      name: "SKY AI \u5929\u76C8\u79D1\u6280",
      type: "money_page",
      country: "TW",
      description: "\u6DF1\u8272\u79D1\u6280\u98A8\uFF0C\u9069\u5408\u79D1\u6280\u985E\u63A8\u5EE3",
      thumbnail: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iIzBhMGUyNyIvPjx0ZXh0IHg9IjEwMCIgeT0iNjAiIGZpbGw9IiMwMGU1ZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LXNpemU9IjE2Ij5TS1kgQUk8L3RleHQ+PC9zdmc+",
      identifier: "sys-skyai"
    }
  ];
  return c.json({ success: true, data: systemThemes });
});
app.post("/api/v1/templates/batch-delete", async (c) => {
  try {
    const { ids } = await c.req.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return c.json({ success: false, error: "\u8ACB\u63D0\u4F9B\u8981\u522A\u9664\u7684 ID \u9663\u5217" }, 400);
    }
    if (ids.length > 100) {
      return c.json({ success: false, error: "\u55AE\u6B21\u6700\u591A\u522A\u9664 100 \u7B46" }, 400);
    }
    const stmts = ids.map(
      (id) => c.env.DB.prepare("DELETE FROM templates WHERE id = ?").bind(id)
    );
    await c.env.DB.batch(stmts);
    return c.json({ success: true, data: { deleted: ids.length } });
  } catch (e) {
    return c.json({ success: false, error: e.message || "\u6279\u91CF\u522A\u9664\u5931\u6557" }, 500);
  }
});
app.get("/api/v1/templates/:id", async (c) => {
  const id = c.req.param("id");
  const result = await c.env.DB.prepare("SELECT * FROM templates WHERE id = ?").bind(id).first();
  if (!result) {
    return c.json({ success: false, error: "Template not found" }, 404);
  }
  return c.json({ success: true, data: result });
});
app.post("/api/v1/templates", async (c) => {
  const body = await c.req.json();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT INTO templates (id, type, country, name, identifier, status, content, thumbnail, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    body.type || "safe_page",
    body.country || "TW",
    body.name || "",
    body.identifier || `TPL-${Date.now()}`,
    body.status || "active",
    body.content || body.html_content || "",
    body.thumbnail || null,
    now,
    now
  ).run();
  const result = await c.env.DB.prepare("SELECT * FROM templates WHERE id = ?").bind(id).first();
  return c.json({ success: true, data: result });
});
app.put("/api/v1/templates/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const existing = await c.env.DB.prepare("SELECT * FROM templates WHERE id = ?").bind(id).first();
  if (!existing) {
    return c.json({ success: false, error: "Template not found" }, 404);
  }
  const m = (key, fallback = "") => body[key] !== void 0 ? body[key] : existing[key] ?? fallback;
  await c.env.DB.prepare(
    `UPDATE templates SET type = ?, country = ?, name = ?, identifier = ?, status = ?, content = ?, thumbnail = ?, updated_at = ?
     WHERE id = ?`
  ).bind(
    m("type", "safe_page"),
    m("country", "TW"),
    m("name"),
    m("identifier"),
    m("status", "active"),
    body.content !== void 0 ? body.content : body.html_content !== void 0 ? body.html_content : existing.content || "",
    m("thumbnail", null),
    now,
    id
  ).run();
  const result = await c.env.DB.prepare("SELECT * FROM templates WHERE id = ?").bind(id).first();
  return c.json({ success: true, data: result });
});
app.get("/api/v1/templates/:id/preview", async (c) => {
  const id = c.req.param("id");
  const result = await c.env.DB.prepare("SELECT * FROM templates WHERE id = ?").bind(id).first();
  if (!result) {
    return c.html("<h1>Template not found</h1>", 404);
  }
  const content = result.content || "";
  return c.html(content);
});
app.put("/api/v1/templates/:id/toggle", async (c) => {
  const id = c.req.param("id");
  const existing = await c.env.DB.prepare("SELECT * FROM templates WHERE id = ?").bind(id).first();
  if (!existing) {
    return c.json({ success: false, error: "Template not found" }, 404);
  }
  const newStatus = existing.status === "active" ? "inactive" : "active";
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await c.env.DB.prepare("UPDATE templates SET status = ?, updated_at = ? WHERE id = ?").bind(newStatus, now, id).run();
  return c.json({ success: true, data: { status: newStatus } });
});
app.delete("/api/v1/templates/:id", async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM templates WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});
app.get("/api/v1/pixels", async (c) => {
  const { type } = c.req.query();
  let sql = "SELECT * FROM pixels_library";
  const params = [];
  if (type) {
    sql += " WHERE type = ?";
    params.push(type);
  }
  sql += " ORDER BY created_at DESC";
  const { results } = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ success: true, data: results });
});
app.get("/api/v1/pixels/:id", async (c) => {
  const id = c.req.param("id");
  const result = await c.env.DB.prepare("SELECT * FROM pixels_library WHERE id = ?").bind(id).first();
  if (!result) return c.json({ success: false, error: "Pixel not found" }, 404);
  return c.json({ success: true, data: result });
});
app.post("/api/v1/pixels", async (c) => {
  const body = await c.req.json();
  const id = crypto.randomUUID();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await c.env.DB.prepare(
    "INSERT INTO pixels_library (id, name, pixel_id, token, type, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    id,
    body.name || "",
    body.pixel_id || "",
    body.token || "",
    body.type || "AD",
    body.note || "",
    now
  ).run();
  return c.json({ success: true, data: { id } });
});
app.put("/api/v1/pixels/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  await c.env.DB.prepare(
    "UPDATE pixels_library SET name = ?, pixel_id = ?, token = ?, type = ?, note = ? WHERE id = ?"
  ).bind(
    body.name || "",
    body.pixel_id || "",
    body.token || "",
    body.type || "AD",
    body.note || "",
    id
  ).run();
  return c.json({ success: true });
});
app.delete("/api/v1/pixels/:id", async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM pixels_library WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});
app.get("/api/v1/media/list", async (c) => {
  try {
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_key TEXT NOT NULL UNIQUE,
        filename TEXT NOT NULL,
        content_type TEXT DEFAULT '',
        size_bytes INTEGER DEFAULT 0,
        r2_bucket TEXT DEFAULT 'cloak-assets',
        category TEXT DEFAULT 'general',
        campaign_id TEXT DEFAULT '',
        template_id INTEGER DEFAULT 0,
        tags TEXT DEFAULT '[]',
        uploaded_by TEXT DEFAULT 'system',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {
    });
    const category = c.req.query("category") || "";
    let query = "SELECT * FROM assets WHERE 1=1";
    const params = [];
    if (category) {
      query += " AND category = ?";
      params.push(category);
    }
    query += " ORDER BY created_at DESC LIMIT 200";
    const stmt = params.length > 0 ? c.env.DB.prepare(query).bind(...params) : c.env.DB.prepare(query);
    const result = await stmt.all();
    const assets = (result.results || []).map((a) => ({
      ...a,
      url: `https://admin-api.bexnua.store/api/v1/media/file/${encodeURIComponent(a.asset_key)}`,
      public_url: `https://admin-api.bexnua.store/api/v1/media/file/${encodeURIComponent(a.asset_key)}`
    }));
    return c.json({ success: true, assets });
  } catch (e) {
    console.error("media list error:", e);
    return c.json({ success: false, error: e.message || "Failed to list assets" }, 500);
  }
});
app.post("/api/v1/media/upload", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file");
    const category = String(formData.get("category") || "general");
    if (!file || typeof file === "string") {
      return c.json({ success: false, error: "file is required" }, 400);
    }
    const filename = file.name || "unnamed";
    const safeFilename = String(filename).replace(/[^a-zA-Z0-9._-]+/g, "-");
    const assetKey = `${category}/${Date.now()}-${safeFilename}`;
    if (c.env.R2_ASSETS) {
      await c.env.R2_ASSETS.put(assetKey, file.stream(), {
        httpMetadata: { contentType: file.type || "application/octet-stream" }
      });
    }
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_key TEXT NOT NULL UNIQUE,
        filename TEXT NOT NULL,
        content_type TEXT DEFAULT '',
        size_bytes INTEGER DEFAULT 0,
        r2_bucket TEXT DEFAULT 'cloak-assets',
        category TEXT DEFAULT 'general',
        campaign_id TEXT DEFAULT '',
        template_id INTEGER DEFAULT 0,
        tags TEXT DEFAULT '[]',
        uploaded_by TEXT DEFAULT 'system',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {
    });
    await c.env.DB.prepare(
      "INSERT INTO assets (asset_key, filename, content_type, size_bytes, category) VALUES (?,?,?,?,?)"
    ).bind(assetKey, filename, file.type || "", file.size || 0, category).run();
    return c.json({
      success: true,
      asset_key: assetKey,
      url: `https://admin-api.bexnua.store/api/v1/media/file/${encodeURIComponent(assetKey)}`
    });
  } catch (e) {
    console.error("media upload error:", e);
    return c.json({ success: false, error: e.message || "Upload failed" }, 500);
  }
});
app.get("/api/v1/media/file/:key{.+}", async (c) => {
  try {
    const key = decodeURIComponent(c.req.param("key"));
    if (!c.env.R2_ASSETS) {
      return c.text("R2 not configured", 500);
    }
    const object = await c.env.R2_ASSETS.get(key);
    if (!object) {
      return c.text("Not found", 404);
    }
    const headers = new Headers();
    headers.set("Content-Type", object.httpMetadata?.contentType || "application/octet-stream");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("Access-Control-Allow-Origin", "*");
    return new Response(object.body, { headers });
  } catch (e) {
    console.error("media file error:", e);
    return c.text("Error: " + (e.message || ""), 500);
  }
});
app.delete("/api/v1/media/:key{.+}", async (c) => {
  try {
    const key = decodeURIComponent(c.req.param("key"));
    if (c.env.R2_ASSETS) {
      await c.env.R2_ASSETS.delete(key).catch(() => {
      });
    }
    await c.env.DB.prepare("DELETE FROM assets WHERE asset_key = ?").bind(key).run();
    return c.json({ success: true });
  } catch (e) {
    console.error("media delete error:", e);
    return c.json({ success: false, error: e.message || "Delete failed" }, 500);
  }
});
app.post("/api/v1/details", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const content = body.content || "";
  const campaign_id = body.campaign_id || "";
  const title = body.title || "\u8A73\u60C5\u9801\u9762";
  if (!content) {
    return c.json({ success: false, error: "content is required" }, 400);
  }
  const id = Math.random().toString(36).substring(2, 10);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await c.env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS details_pages (
      id TEXT PRIMARY KEY,
      campaign_id TEXT,
      title TEXT,
      content TEXT NOT NULL,
      created_at TEXT,
      updated_at TEXT
    )
  `).run().catch(() => {
  });
  await c.env.DB.prepare(
    "INSERT INTO details_pages (id, campaign_id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(id, campaign_id, title, content, now, now).run();
  const detailsUrl = `https://admin-api.bexnua.store/details/${id}`;
  return c.json({ success: true, data: { id, url: detailsUrl } });
});
app.put("/api/v1/details/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const content = body.content || "";
  const title = body.title || "";
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await c.env.DB.prepare(
    "UPDATE details_pages SET content = ?, title = ?, updated_at = ? WHERE id = ?"
  ).bind(content, title, now, id).run();
  const detailsUrl = `https://admin-api.bexnua.store/details/${id}`;
  return c.json({ success: true, data: { id, url: detailsUrl } });
});
app.get("/details/:id", async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS details_pages (
      id TEXT PRIMARY KEY,
      campaign_id TEXT,
      title TEXT,
      content TEXT NOT NULL,
      created_at TEXT,
      updated_at TEXT
    )
  `).run().catch(() => {
  });
  const row = await c.env.DB.prepare(
    "SELECT * FROM details_pages WHERE id = ?"
  ).bind(id).first();
  if (!row) {
    return c.html(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>\u9801\u9762\u4E0D\u5B58\u5728</title></head><body style="font-family:sans-serif;text-align:center;padding:60px"><h2>404 - \u9801\u9762\u4E0D\u5B58\u5728</h2><p>\u6B64\u8A73\u60C5\u9801\u9762\u4E0D\u5B58\u5728\u6216\u5DF2\u88AB\u522A\u9664\u3002</p></body></html>`, 404);
  }
  const pageHtml = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${row.title || "\u8A73\u60C5\u9801\u9762"}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Microsoft JhengHei', 'PingFang TC', sans-serif;
      font-size: 16px;
      line-height: 1.6;
      color: #333;
      background: #fff;
      min-height: 100vh;
    }
    .content-wrapper {
      max-width: 800px;
      margin: 0 auto;
      padding: 24px 16px 80px;
    }
    img { max-width: 100%; height: auto; }
    a { color: #2563eb; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #e5e7eb; padding: 8px 12px; }
    th { background: #f9fafb; }
    blockquote { border-left: 4px solid #e5e7eb; padding-left: 16px; color: #6b7280; }
    pre { background: #f9fafb; padding: 12px; border-radius: 4px; overflow-x: auto; }
    code { background: #f3f4f6; padding: 2px 4px; border-radius: 3px; font-size: 0.9em; }
    h1,h2,h3,h4,h5,h6 { margin: 16px 0 8px; line-height: 1.3; }
    p { margin: 8px 0; }
    ul, ol { padding-left: 24px; margin: 8px 0; }
  </style>
</head>
<body>
  <div class="content-wrapper">
    ${row.content}
  </div>
</body>
</html>`;
  return c.html(pageHtml);
});
var index_default = app;
export {
  index_default as default
};
