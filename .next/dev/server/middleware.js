"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "proxy";
exports.ids = ["proxy"];
exports.modules = {

/***/ "(middleware)/./node_modules/next/dist/build/webpack/loaders/next-middleware-loader.js?absolutePagePath=%2FUsers%2Ffragoso%2FDocuments%2Fcollab-finance%2Fcollab-finance%2Fgerador-etiquetas-cd%2Fsrc%2Fproxy.ts&page=%2Fproxy&rootDir=%2FUsers%2Ffragoso%2FDocuments%2Fcollab-finance%2Fcollab-finance%2Fgerador-etiquetas-cd&matchers=&preferredRegion=&middlewareConfig=e30%3D!":
/*!****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-middleware-loader.js?absolutePagePath=%2FUsers%2Ffragoso%2FDocuments%2Fcollab-finance%2Fcollab-finance%2Fgerador-etiquetas-cd%2Fsrc%2Fproxy.ts&page=%2Fproxy&rootDir=%2FUsers%2Ffragoso%2FDocuments%2Fcollab-finance%2Fcollab-finance%2Fgerador-etiquetas-cd&matchers=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__),\n/* harmony export */   handler: () => (/* binding */ handler)\n/* harmony export */ });\n/* harmony import */ var next_dist_build_adapter_setup_node_env_external__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/build/adapter/setup-node-env.external */ \"next/dist/build/adapter/setup-node-env.external\");\n/* harmony import */ var next_dist_build_adapter_setup_node_env_external__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_build_adapter_setup_node_env_external__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_web_globals__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/web/globals */ \"(middleware)/./node_modules/next/dist/server/web/globals.js\");\n/* harmony import */ var next_dist_server_web_globals__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_web_globals__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var next_dist_server_web_adapter__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/web/adapter */ \"(middleware)/./node_modules/next/dist/server/web/adapter.js\");\n/* harmony import */ var next_dist_server_web_adapter__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_web_adapter__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var next_dist_server_lib_incremental_cache__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! next/dist/server/lib/incremental-cache */ \"(middleware)/./node_modules/next/dist/server/lib/incremental-cache/index.js\");\n/* harmony import */ var next_dist_server_lib_incremental_cache__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_incremental_cache__WEBPACK_IMPORTED_MODULE_3__);\n/* harmony import */ var _src_proxy_ts__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./src/proxy.ts */ \"(middleware)/./src/proxy.ts\");\n/* harmony import */ var next_dist_client_components_is_next_router_error__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! next/dist/client/components/is-next-router-error */ \"(middleware)/./node_modules/next/dist/client/components/is-next-router-error.js\");\n/* harmony import */ var next_dist_client_components_is_next_router_error__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(next_dist_client_components_is_next_router_error__WEBPACK_IMPORTED_MODULE_5__);\n/* harmony import */ var next_dist_server_web_utils__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! next/dist/server/web/utils */ \"(middleware)/./node_modules/next/dist/server/web/utils.js\");\n/* harmony import */ var next_dist_server_web_utils__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_web_utils__WEBPACK_IMPORTED_MODULE_6__);\n\n\n\n\nconst incrementalCacheHandler = null\n// Import the userland code.\n;\n\n\n\nconst mod = {\n    ..._src_proxy_ts__WEBPACK_IMPORTED_MODULE_4__\n};\nconst page = \"/proxy\";\nconst isProxy = page === '/proxy' || page === '/src/proxy';\nconst handlerUserland = (isProxy ? mod.proxy : mod.middleware) || mod.default;\nclass ProxyMissingExportError extends Error {\n    constructor(message){\n        super(message);\n        // Stack isn't useful here, remove it considering it spams logs during development.\n        this.stack = '';\n    }\n}\n// TODO: This spams logs during development. Find a better way to handle this.\n// Removing this will spam \"fn is not a function\" logs which is worse.\nif (typeof handlerUserland !== 'function') {\n    throw new ProxyMissingExportError(`The ${isProxy ? 'Proxy' : 'Middleware'} file \"${page}\" must export a function named \\`${isProxy ? 'proxy' : 'middleware'}\\` or a default function.`);\n}\n// Proxy will only sent out the FetchEvent to next server,\n// so load instrumentation module here and track the error inside proxy module.\nfunction errorHandledHandler(fn) {\n    return async (...args)=>{\n        try {\n            return await fn(...args);\n        } catch (err) {\n            // In development, error the navigation API usage in runtime,\n            // since it's not allowed to be used in proxy as it's outside of react component tree.\n            if (true) {\n                if ((0,next_dist_client_components_is_next_router_error__WEBPACK_IMPORTED_MODULE_5__.isNextRouterError)(err)) {\n                    err.message = `Next.js navigation API is not allowed to be used in ${isProxy ? 'Proxy' : 'Middleware'}.`;\n                    throw err;\n                }\n            }\n            const req = args[0];\n            const url = new URL(req.url);\n            const resource = url.pathname + url.search;\n            await (0,next_dist_server_web_globals__WEBPACK_IMPORTED_MODULE_1__.edgeInstrumentationOnRequestError)(err, {\n                path: resource,\n                method: req.method,\n                headers: Object.fromEntries(req.headers.entries())\n            }, {\n                routerKind: 'Pages Router',\n                routePath: '/proxy',\n                routeType: 'proxy',\n                revalidateReason: undefined\n            });\n            throw err;\n        }\n    };\n}\nconst internalHandler = async (opts)=>{\n    let emitInstrumentationSpans;\n    let requestStartTime;\n    if (true) {\n        var _opts_request_requestMeta, _opts_request_requestMeta1;\n        // This mirrors what `RouteModule#prepare` does for routes\n        // edge runtime handles loading instrumentation at the edge adapter level\n        requestStartTime = performance.timeOrigin + performance.now();\n        const { join, relative } = __webpack_require__(/*! node:path */ \"node:path\");\n        const { ensureInstrumentationRegisteredWithDeferredSpans } = __webpack_require__(/*! next/dist/server/lib/router-utils/instrumentation-globals.external */ \"next/dist/server/lib/router-utils/instrumentation-globals.external\");\n        const absoluteProjectDir = join(/* turbopackIgnore: true */ process.cwd(), ((_opts_request_requestMeta = opts.request.requestMeta) == null ? void 0 : _opts_request_requestMeta.relativeProjectDir) || '');\n        const absoluteDistDir = (_opts_request_requestMeta1 = opts.request.requestMeta) == null ? void 0 : _opts_request_requestMeta1.distDir;\n        const distDir = absoluteDistDir ? relative(absoluteProjectDir, absoluteDistDir) : '.next';\n        // When this request registers `instrumentation.ts`, the adapter emits its\n        // lifecycle spans inside the middleware span.\n        emitInstrumentationSpans = await ensureInstrumentationRegisteredWithDeferredSpans(absoluteProjectDir, distDir);\n    }\n    try {\n        return await (0,next_dist_server_web_adapter__WEBPACK_IMPORTED_MODULE_2__.adapter)({\n            ...opts,\n            IncrementalCache: next_dist_server_lib_incremental_cache__WEBPACK_IMPORTED_MODULE_3__.IncrementalCache,\n            incrementalCacheHandler,\n            page,\n            handler: errorHandledHandler(handlerUserland),\n            emitInstrumentationSpans,\n            requestStartTime\n        });\n    } catch (err) {\n        // The adapter can throw before it runs the middleware and emits the\n        // lifecycle spans (e.g. when the configured cache handler throws). Later\n        // requests won't emit them, so emit them here instead (a no-op if they were\n        // emitted). Tracing must not replace the adapter's error.\n        try {\n            emitInstrumentationSpans == null ? void 0 : emitInstrumentationSpans();\n        } catch  {}\n        throw err;\n    }\n};\nasync function handler(request, ctx) {\n    const result = await internalHandler({\n        request: {\n            url: request.url,\n            method: request.method,\n            headers: (0,next_dist_server_web_utils__WEBPACK_IMPORTED_MODULE_6__.toNodeOutgoingHttpHeaders)(request.headers),\n            nextConfig: {\n                basePath: \"\",\n                i18n: \"\",\n                trailingSlash: Boolean(false),\n                experimental: {\n                    cacheLife: {\"default\":{\"stale\":300,\"revalidate\":900,\"expire\":4294967294},\"seconds\":{\"stale\":30,\"revalidate\":1,\"expire\":60},\"minutes\":{\"stale\":300,\"revalidate\":60,\"expire\":3600},\"hours\":{\"stale\":300,\"revalidate\":3600,\"expire\":86400},\"days\":{\"stale\":300,\"revalidate\":86400,\"expire\":604800},\"weeks\":{\"stale\":300,\"revalidate\":604800,\"expire\":2592000},\"max\":{\"stale\":300,\"revalidate\":2592000,\"expire\":31536000}},\n                    authInterrupts: Boolean(false),\n                    clientParamParsingOrigins: []\n                }\n            },\n            page: {\n                name: page\n            },\n            body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body ?? undefined : undefined,\n            waitUntil: ctx.waitUntil,\n            requestMeta: ctx.requestMeta,\n            signal: ctx.signal || new AbortController().signal\n        }\n    });\n    ctx.waitUntil == null ? void 0 : ctx.waitUntil.call(ctx, result.waitUntil);\n    return result.response;\n}\n// backwards compat for non-adapter setups\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (internalHandler);\n\n//# sourceMappingURL=middleware.js.map\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKG1pZGRsZXdhcmUpLy4vbm9kZV9tb2R1bGVzL25leHQvZGlzdC9idWlsZC93ZWJwYWNrL2xvYWRlcnMvbmV4dC1taWRkbGV3YXJlLWxvYWRlci5qcz9hYnNvbHV0ZVBhZ2VQYXRoPSUyRlVzZXJzJTJGZnJhZ29zbyUyRkRvY3VtZW50cyUyRmNvbGxhYi1maW5hbmNlJTJGY29sbGFiLWZpbmFuY2UlMkZnZXJhZG9yLWV0aXF1ZXRhcy1jZCUyRnNyYyUyRnByb3h5LnRzJnBhZ2U9JTJGcHJveHkmcm9vdERpcj0lMkZVc2VycyUyRmZyYWdvc28lMkZEb2N1bWVudHMlMkZjb2xsYWItZmluYW5jZSUyRmNvbGxhYi1maW5hbmNlJTJGZ2VyYWRvci1ldGlxdWV0YXMtY2QmbWF0Y2hlcnM9JnByZWZlcnJlZFJlZ2lvbj0mbWlkZGxld2FyZUNvbmZpZz1lMzAlM0QhIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUF5RDtBQUNuQjtBQUNpQjtBQUNtQjtBQUMxRTtBQUNBO0FBQ0EsQ0FBdUM7QUFDMEM7QUFDSTtBQUNkO0FBQ3ZFO0FBQ0EsT0FBTywwQ0FBSTtBQUNYO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2Q0FBNkMsa0NBQWtDLFFBQVEsS0FBSyxtQ0FBbUMsaUNBQWlDO0FBQ2hLO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQSxnQkFBZ0IsSUFBcUM7QUFDckQsb0JBQW9CLG1HQUFpQjtBQUNyQyx5RkFBeUYsaUNBQWlDO0FBQzFIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQiwrRkFBaUM7QUFDbkQ7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUSxJQUFtQztBQUMzQztBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQixpQkFBaUIsRUFBRSxtQkFBTyxDQUFDLDRCQUFXO0FBQ3RELGdCQUFnQixtREFBbUQsRUFBRSxtQkFBTyxDQUFDLDhJQUFvRTtBQUNqSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCLHFFQUFPO0FBQzVCO0FBQ0EsNEJBQTRCO0FBQzVCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1QsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCLHFGQUF5QjtBQUM5QztBQUNBLDBCQUEwQixFQUE0QjtBQUN0RCxzQkFBc0IsRUFBOEI7QUFDcEQsdUNBQXVDLEtBQWlDO0FBQ3hFO0FBQ0EsK0JBQStCLDJZQUE2QjtBQUM1RCw0Q0FBNEMsS0FBK0M7QUFDM0YsK0NBQStDLEVBQStDO0FBQzlGO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlFQUFlLGVBQWUsRUFBQzs7QUFFL0IiLCJzb3VyY2VzIjpbIiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgXCJuZXh0L2Rpc3QvYnVpbGQvYWRhcHRlci9zZXR1cC1ub2RlLWVudi5leHRlcm5hbFwiO1xuaW1wb3J0IFwibmV4dC9kaXN0L3NlcnZlci93ZWIvZ2xvYmFsc1wiO1xuaW1wb3J0IHsgYWRhcHRlciB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3dlYi9hZGFwdGVyXCI7XG5pbXBvcnQgeyBJbmNyZW1lbnRhbENhY2hlIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvbGliL2luY3JlbWVudGFsLWNhY2hlXCI7XG5jb25zdCBpbmNyZW1lbnRhbENhY2hlSGFuZGxlciA9IG51bGxcbi8vIEltcG9ydCB0aGUgdXNlcmxhbmQgY29kZS5cbmltcG9ydCAqIGFzIF9tb2QgZnJvbSBcIi4vc3JjL3Byb3h5LnRzXCI7XG5pbXBvcnQgeyBlZGdlSW5zdHJ1bWVudGF0aW9uT25SZXF1ZXN0RXJyb3IgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci93ZWIvZ2xvYmFsc1wiO1xuaW1wb3J0IHsgaXNOZXh0Um91dGVyRXJyb3IgfSBmcm9tIFwibmV4dC9kaXN0L2NsaWVudC9jb21wb25lbnRzL2lzLW5leHQtcm91dGVyLWVycm9yXCI7XG5pbXBvcnQgeyB0b05vZGVPdXRnb2luZ0h0dHBIZWFkZXJzIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvd2ViL3V0aWxzXCI7XG5jb25zdCBtb2QgPSB7XG4gICAgLi4uX21vZFxufTtcbmNvbnN0IHBhZ2UgPSBcIi9wcm94eVwiO1xuY29uc3QgaXNQcm94eSA9IHBhZ2UgPT09ICcvcHJveHknIHx8IHBhZ2UgPT09ICcvc3JjL3Byb3h5JztcbmNvbnN0IGhhbmRsZXJVc2VybGFuZCA9IChpc1Byb3h5ID8gbW9kLnByb3h5IDogbW9kLm1pZGRsZXdhcmUpIHx8IG1vZC5kZWZhdWx0O1xuY2xhc3MgUHJveHlNaXNzaW5nRXhwb3J0RXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gICAgY29uc3RydWN0b3IobWVzc2FnZSl7XG4gICAgICAgIHN1cGVyKG1lc3NhZ2UpO1xuICAgICAgICAvLyBTdGFjayBpc24ndCB1c2VmdWwgaGVyZSwgcmVtb3ZlIGl0IGNvbnNpZGVyaW5nIGl0IHNwYW1zIGxvZ3MgZHVyaW5nIGRldmVsb3BtZW50LlxuICAgICAgICB0aGlzLnN0YWNrID0gJyc7XG4gICAgfVxufVxuLy8gVE9ETzogVGhpcyBzcGFtcyBsb2dzIGR1cmluZyBkZXZlbG9wbWVudC4gRmluZCBhIGJldHRlciB3YXkgdG8gaGFuZGxlIHRoaXMuXG4vLyBSZW1vdmluZyB0aGlzIHdpbGwgc3BhbSBcImZuIGlzIG5vdCBhIGZ1bmN0aW9uXCIgbG9ncyB3aGljaCBpcyB3b3JzZS5cbmlmICh0eXBlb2YgaGFuZGxlclVzZXJsYW5kICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFByb3h5TWlzc2luZ0V4cG9ydEVycm9yKGBUaGUgJHtpc1Byb3h5ID8gJ1Byb3h5JyA6ICdNaWRkbGV3YXJlJ30gZmlsZSBcIiR7cGFnZX1cIiBtdXN0IGV4cG9ydCBhIGZ1bmN0aW9uIG5hbWVkIFxcYCR7aXNQcm94eSA/ICdwcm94eScgOiAnbWlkZGxld2FyZSd9XFxgIG9yIGEgZGVmYXVsdCBmdW5jdGlvbi5gKTtcbn1cbi8vIFByb3h5IHdpbGwgb25seSBzZW50IG91dCB0aGUgRmV0Y2hFdmVudCB0byBuZXh0IHNlcnZlcixcbi8vIHNvIGxvYWQgaW5zdHJ1bWVudGF0aW9uIG1vZHVsZSBoZXJlIGFuZCB0cmFjayB0aGUgZXJyb3IgaW5zaWRlIHByb3h5IG1vZHVsZS5cbmZ1bmN0aW9uIGVycm9ySGFuZGxlZEhhbmRsZXIoZm4pIHtcbiAgICByZXR1cm4gYXN5bmMgKC4uLmFyZ3MpPT57XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgZm4oLi4uYXJncyk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgLy8gSW4gZGV2ZWxvcG1lbnQsIGVycm9yIHRoZSBuYXZpZ2F0aW9uIEFQSSB1c2FnZSBpbiBydW50aW1lLFxuICAgICAgICAgICAgLy8gc2luY2UgaXQncyBub3QgYWxsb3dlZCB0byBiZSB1c2VkIGluIHByb3h5IGFzIGl0J3Mgb3V0c2lkZSBvZiByZWFjdCBjb21wb25lbnQgdHJlZS5cbiAgICAgICAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzTmV4dFJvdXRlckVycm9yKGVycikpIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyLm1lc3NhZ2UgPSBgTmV4dC5qcyBuYXZpZ2F0aW9uIEFQSSBpcyBub3QgYWxsb3dlZCB0byBiZSB1c2VkIGluICR7aXNQcm94eSA/ICdQcm94eScgOiAnTWlkZGxld2FyZSd9LmA7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCByZXEgPSBhcmdzWzBdO1xuICAgICAgICAgICAgY29uc3QgdXJsID0gbmV3IFVSTChyZXEudXJsKTtcbiAgICAgICAgICAgIGNvbnN0IHJlc291cmNlID0gdXJsLnBhdGhuYW1lICsgdXJsLnNlYXJjaDtcbiAgICAgICAgICAgIGF3YWl0IGVkZ2VJbnN0cnVtZW50YXRpb25PblJlcXVlc3RFcnJvcihlcnIsIHtcbiAgICAgICAgICAgICAgICBwYXRoOiByZXNvdXJjZSxcbiAgICAgICAgICAgICAgICBtZXRob2Q6IHJlcS5tZXRob2QsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogT2JqZWN0LmZyb21FbnRyaWVzKHJlcS5oZWFkZXJzLmVudHJpZXMoKSlcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICByb3V0ZXJLaW5kOiAnUGFnZXMgUm91dGVyJyxcbiAgICAgICAgICAgICAgICByb3V0ZVBhdGg6ICcvcHJveHknLFxuICAgICAgICAgICAgICAgIHJvdXRlVHlwZTogJ3Byb3h5JyxcbiAgICAgICAgICAgICAgICByZXZhbGlkYXRlUmVhc29uOiB1bmRlZmluZWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICB9XG4gICAgfTtcbn1cbmNvbnN0IGludGVybmFsSGFuZGxlciA9IGFzeW5jIChvcHRzKT0+e1xuICAgIGxldCBlbWl0SW5zdHJ1bWVudGF0aW9uU3BhbnM7XG4gICAgbGV0IHJlcXVlc3RTdGFydFRpbWU7XG4gICAgaWYgKHByb2Nlc3MuZW52Lk5FWFRfUlVOVElNRSAhPT0gJ2VkZ2UnKSB7XG4gICAgICAgIHZhciBfb3B0c19yZXF1ZXN0X3JlcXVlc3RNZXRhLCBfb3B0c19yZXF1ZXN0X3JlcXVlc3RNZXRhMTtcbiAgICAgICAgLy8gVGhpcyBtaXJyb3JzIHdoYXQgYFJvdXRlTW9kdWxlI3ByZXBhcmVgIGRvZXMgZm9yIHJvdXRlc1xuICAgICAgICAvLyBlZGdlIHJ1bnRpbWUgaGFuZGxlcyBsb2FkaW5nIGluc3RydW1lbnRhdGlvbiBhdCB0aGUgZWRnZSBhZGFwdGVyIGxldmVsXG4gICAgICAgIHJlcXVlc3RTdGFydFRpbWUgPSBwZXJmb3JtYW5jZS50aW1lT3JpZ2luICsgcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgICAgIGNvbnN0IHsgam9pbiwgcmVsYXRpdmUgfSA9IHJlcXVpcmUoJ25vZGU6cGF0aCcpO1xuICAgICAgICBjb25zdCB7IGVuc3VyZUluc3RydW1lbnRhdGlvblJlZ2lzdGVyZWRXaXRoRGVmZXJyZWRTcGFucyB9ID0gcmVxdWlyZShcIm5leHQvZGlzdC9zZXJ2ZXIvbGliL3JvdXRlci11dGlscy9pbnN0cnVtZW50YXRpb24tZ2xvYmFscy5leHRlcm5hbFwiKTtcbiAgICAgICAgY29uc3QgYWJzb2x1dGVQcm9qZWN0RGlyID0gam9pbigvKiB0dXJib3BhY2tJZ25vcmU6IHRydWUgKi8gcHJvY2Vzcy5jd2QoKSwgKChfb3B0c19yZXF1ZXN0X3JlcXVlc3RNZXRhID0gb3B0cy5yZXF1ZXN0LnJlcXVlc3RNZXRhKSA9PSBudWxsID8gdm9pZCAwIDogX29wdHNfcmVxdWVzdF9yZXF1ZXN0TWV0YS5yZWxhdGl2ZVByb2plY3REaXIpIHx8ICcnKTtcbiAgICAgICAgY29uc3QgYWJzb2x1dGVEaXN0RGlyID0gKF9vcHRzX3JlcXVlc3RfcmVxdWVzdE1ldGExID0gb3B0cy5yZXF1ZXN0LnJlcXVlc3RNZXRhKSA9PSBudWxsID8gdm9pZCAwIDogX29wdHNfcmVxdWVzdF9yZXF1ZXN0TWV0YTEuZGlzdERpcjtcbiAgICAgICAgY29uc3QgZGlzdERpciA9IGFic29sdXRlRGlzdERpciA/IHJlbGF0aXZlKGFic29sdXRlUHJvamVjdERpciwgYWJzb2x1dGVEaXN0RGlyKSA6ICcubmV4dCc7XG4gICAgICAgIC8vIFdoZW4gdGhpcyByZXF1ZXN0IHJlZ2lzdGVycyBgaW5zdHJ1bWVudGF0aW9uLnRzYCwgdGhlIGFkYXB0ZXIgZW1pdHMgaXRzXG4gICAgICAgIC8vIGxpZmVjeWNsZSBzcGFucyBpbnNpZGUgdGhlIG1pZGRsZXdhcmUgc3Bhbi5cbiAgICAgICAgZW1pdEluc3RydW1lbnRhdGlvblNwYW5zID0gYXdhaXQgZW5zdXJlSW5zdHJ1bWVudGF0aW9uUmVnaXN0ZXJlZFdpdGhEZWZlcnJlZFNwYW5zKGFic29sdXRlUHJvamVjdERpciwgZGlzdERpcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBhd2FpdCBhZGFwdGVyKHtcbiAgICAgICAgICAgIC4uLm9wdHMsXG4gICAgICAgICAgICBJbmNyZW1lbnRhbENhY2hlLFxuICAgICAgICAgICAgaW5jcmVtZW50YWxDYWNoZUhhbmRsZXIsXG4gICAgICAgICAgICBwYWdlLFxuICAgICAgICAgICAgaGFuZGxlcjogZXJyb3JIYW5kbGVkSGFuZGxlcihoYW5kbGVyVXNlcmxhbmQpLFxuICAgICAgICAgICAgZW1pdEluc3RydW1lbnRhdGlvblNwYW5zLFxuICAgICAgICAgICAgcmVxdWVzdFN0YXJ0VGltZVxuICAgICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgLy8gVGhlIGFkYXB0ZXIgY2FuIHRocm93IGJlZm9yZSBpdCBydW5zIHRoZSBtaWRkbGV3YXJlIGFuZCBlbWl0cyB0aGVcbiAgICAgICAgLy8gbGlmZWN5Y2xlIHNwYW5zIChlLmcuIHdoZW4gdGhlIGNvbmZpZ3VyZWQgY2FjaGUgaGFuZGxlciB0aHJvd3MpLiBMYXRlclxuICAgICAgICAvLyByZXF1ZXN0cyB3b24ndCBlbWl0IHRoZW0sIHNvIGVtaXQgdGhlbSBoZXJlIGluc3RlYWQgKGEgbm8tb3AgaWYgdGhleSB3ZXJlXG4gICAgICAgIC8vIGVtaXR0ZWQpLiBUcmFjaW5nIG11c3Qgbm90IHJlcGxhY2UgdGhlIGFkYXB0ZXIncyBlcnJvci5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGVtaXRJbnN0cnVtZW50YXRpb25TcGFucyA9PSBudWxsID8gdm9pZCAwIDogZW1pdEluc3RydW1lbnRhdGlvblNwYW5zKCk7XG4gICAgICAgIH0gY2F0Y2ggIHt9XG4gICAgICAgIHRocm93IGVycjtcbiAgICB9XG59O1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIocmVxdWVzdCwgY3R4KSB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgaW50ZXJuYWxIYW5kbGVyKHtcbiAgICAgICAgcmVxdWVzdDoge1xuICAgICAgICAgICAgdXJsOiByZXF1ZXN0LnVybCxcbiAgICAgICAgICAgIG1ldGhvZDogcmVxdWVzdC5tZXRob2QsXG4gICAgICAgICAgICBoZWFkZXJzOiB0b05vZGVPdXRnb2luZ0h0dHBIZWFkZXJzKHJlcXVlc3QuaGVhZGVycyksXG4gICAgICAgICAgICBuZXh0Q29uZmlnOiB7XG4gICAgICAgICAgICAgICAgYmFzZVBhdGg6IHByb2Nlc3MuZW52Ll9fTkVYVF9CQVNFX1BBVEgsXG4gICAgICAgICAgICAgICAgaTE4bjogcHJvY2Vzcy5lbnYuX19ORVhUX0kxOE5fQ09ORklHLFxuICAgICAgICAgICAgICAgIHRyYWlsaW5nU2xhc2g6IEJvb2xlYW4ocHJvY2Vzcy5lbnYuX19ORVhUX1RSQUlMSU5HX1NMQVNIKSxcbiAgICAgICAgICAgICAgICBleHBlcmltZW50YWw6IHtcbiAgICAgICAgICAgICAgICAgICAgY2FjaGVMaWZlOiBwcm9jZXNzLmVudi5fX05FWFRfQ0FDSEVfTElGRSxcbiAgICAgICAgICAgICAgICAgICAgYXV0aEludGVycnVwdHM6IEJvb2xlYW4ocHJvY2Vzcy5lbnYuX19ORVhUX0VYUEVSSU1FTlRBTF9BVVRIX0lOVEVSUlVQVFMpLFxuICAgICAgICAgICAgICAgICAgICBjbGllbnRQYXJhbVBhcnNpbmdPcmlnaW5zOiBwcm9jZXNzLmVudi5fX05FWFRfQ0xJRU5UX1BBUkFNX1BBUlNJTkdfT1JJR0lOU1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwYWdlOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogcGFnZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJvZHk6IHJlcXVlc3QubWV0aG9kICE9PSAnR0VUJyAmJiByZXF1ZXN0Lm1ldGhvZCAhPT0gJ0hFQUQnID8gcmVxdWVzdC5ib2R5ID8/IHVuZGVmaW5lZCA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHdhaXRVbnRpbDogY3R4LndhaXRVbnRpbCxcbiAgICAgICAgICAgIHJlcXVlc3RNZXRhOiBjdHgucmVxdWVzdE1ldGEsXG4gICAgICAgICAgICBzaWduYWw6IGN0eC5zaWduYWwgfHwgbmV3IEFib3J0Q29udHJvbGxlcigpLnNpZ25hbFxuICAgICAgICB9XG4gICAgfSk7XG4gICAgY3R4LndhaXRVbnRpbCA9PSBudWxsID8gdm9pZCAwIDogY3R4LndhaXRVbnRpbC5jYWxsKGN0eCwgcmVzdWx0LndhaXRVbnRpbCk7XG4gICAgcmV0dXJuIHJlc3VsdC5yZXNwb25zZTtcbn1cbi8vIGJhY2t3YXJkcyBjb21wYXQgZm9yIG5vbi1hZGFwdGVyIHNldHVwc1xuZXhwb3J0IGRlZmF1bHQgaW50ZXJuYWxIYW5kbGVyO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1taWRkbGV3YXJlLmpzLm1hcFxuIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(middleware)/./node_modules/next/dist/build/webpack/loaders/next-middleware-loader.js?absolutePagePath=%2FUsers%2Ffragoso%2FDocuments%2Fcollab-finance%2Fcollab-finance%2Fgerador-etiquetas-cd%2Fsrc%2Fproxy.ts&page=%2Fproxy&rootDir=%2FUsers%2Ffragoso%2FDocuments%2Fcollab-finance%2Fcollab-finance%2Fgerador-etiquetas-cd&matchers=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(middleware)/./src/proxy.ts":
/*!**********************!*\
  !*** ./src/proxy.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   proxy: () => (/* binding */ proxy)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(middleware)/./node_modules/next/dist/api/server.js\");\n\nfunction proxy(request) {\n    return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.next();\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKG1pZGRsZXdhcmUpLy4vc3JjL3Byb3h5LnRzIiwibWFwcGluZ3MiOiI7Ozs7O0FBQTJDO0FBR3BDLFNBQVNDLE1BQU1DLE9BQW9CO0lBQ3hDLE9BQU9GLHFEQUFZQSxDQUFDRyxJQUFJO0FBQzFCIiwic291cmNlcyI6WyIvVXNlcnMvZnJhZ29zby9Eb2N1bWVudHMvY29sbGFiLWZpbmFuY2UvY29sbGFiLWZpbmFuY2UvZ2VyYWRvci1ldGlxdWV0YXMtY2Qvc3JjL3Byb3h5LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5leHRSZXNwb25zZSB9IGZyb20gXCJuZXh0L3NlcnZlclwiO1xuaW1wb3J0IHR5cGUgeyBOZXh0UmVxdWVzdCB9IGZyb20gXCJuZXh0L3NlcnZlclwiO1xuXG5leHBvcnQgZnVuY3Rpb24gcHJveHkocmVxdWVzdDogTmV4dFJlcXVlc3QpIHtcbiAgcmV0dXJuIE5leHRSZXNwb25zZS5uZXh0KCk7XG59XG4iXSwibmFtZXMiOlsiTmV4dFJlc3BvbnNlIiwicHJveHkiLCJyZXF1ZXN0IiwibmV4dCJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(middleware)/./src/proxy.ts\n");

/***/ }),

/***/ "../app-render/action-async-storage.external":
/*!*******************************************************************************!*\
  !*** external "next/dist/server/app-render/action-async-storage.external.js" ***!
  \*******************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/server/app-render/action-async-storage.external.js");

/***/ }),

/***/ "../app-render/after-task-async-storage.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/app-render/after-task-async-storage.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "./memory-cache.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/lib/incremental-cache/memory-cache.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/server/lib/incremental-cache/memory-cache.external.js");

/***/ }),

/***/ "./runtime-reacts.external":
/*!**************************************************************!*\
  !*** external "next/dist/server/runtime-reacts.external.js" ***!
  \**************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/server/runtime-reacts.external.js");

/***/ }),

/***/ "./shared-cache-controls.external":
/*!*******************************************************************************************!*\
  !*** external "next/dist/server/lib/incremental-cache/shared-cache-controls.external.js" ***!
  \*******************************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/server/lib/incremental-cache/shared-cache-controls.external.js");

/***/ }),

/***/ "./tags-manifest.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/lib/incremental-cache/tags-manifest.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/server/lib/incremental-cache/tags-manifest.external.js");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ "next/dist/build/adapter/setup-node-env.external":
/*!******************************************************************!*\
  !*** external "next/dist/build/adapter/setup-node-env.external" ***!
  \******************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/build/adapter/setup-node-env.external");

/***/ }),

/***/ "next/dist/server/lib/router-utils/instrumentation-globals.external":
/*!*************************************************************************************!*\
  !*** external "next/dist/server/lib/router-utils/instrumentation-globals.external" ***!
  \*************************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/server/lib/router-utils/instrumentation-globals.external");

/***/ }),

/***/ "node:async_hooks":
/*!***********************************!*\
  !*** external "node:async_hooks" ***!
  \***********************************/
/***/ ((module) => {

module.exports = require("node:async_hooks");

/***/ }),

/***/ "node:path":
/*!****************************!*\
  !*** external "node:path" ***!
  \****************************/
/***/ ((module) => {

module.exports = require("node:path");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("path");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("./webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@swc"], () => (__webpack_exec__("(middleware)/./node_modules/next/dist/build/webpack/loaders/next-middleware-loader.js?absolutePagePath=%2FUsers%2Ffragoso%2FDocuments%2Fcollab-finance%2Fcollab-finance%2Fgerador-etiquetas-cd%2Fsrc%2Fproxy.ts&page=%2Fproxy&rootDir=%2FUsers%2Ffragoso%2FDocuments%2Fcollab-finance%2Fcollab-finance%2Fgerador-etiquetas-cd&matchers=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();