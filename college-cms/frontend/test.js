const React = __vite__cjsImport0_react;const ReactDOM = __vite__cjsImport1_reactDom_client;const _jsxDEV = __vite__cjsImport6_react_jsxDevRuntime["jsxDEV"];import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=d6056522";
import __vite__cjsImport1_reactDom_client from "/node_modules/.vite/deps/react-dom_client.js?v=d6056522";
import { QueryClientProvider } from "/node_modules/.vite/deps/@tanstack_react-query.js?v=d6056522";
import { queryClient } from "/src/lib/queryClient.ts";
import App from "/src/App.tsx";
import "/src/index.css";
var _jsxFileName = "/Users/hrishiquemunshi/Desktop/CRM/college-cms/frontend/src/main.tsx";
import __vite__cjsImport6_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=d6056522";
console.log("[DEBUG] main.tsx: Script execution started");
window.addEventListener("error", (e) => console.error("[DEBUG] GLOBAL ERROR:", e.error));
window.addEventListener("unhandledrejection", (e) => console.error("[DEBUG] UNHANDLED PROMISE:", e.reason));
let rootElement;
try {
	rootElement = document.getElementById("root");
	console.log("[DEBUG] main.tsx: Found root element:", !!rootElement);
} catch (e) {
	console.error("[DEBUG] main.tsx: Failed to get root element:", e);
}
if (rootElement) {
	try {
		console.log("[DEBUG] main.tsx: Attempting to call ReactDOM.createRoot");
		const root = ReactDOM.createRoot(rootElement);
		console.log("[DEBUG] main.tsx: createRoot succeeded, calling render()");
		root.render(/* @__PURE__ */ _jsxDEV(React.StrictMode, { children: /* @__PURE__ */ _jsxDEV(QueryClientProvider, {
			client: queryClient,
			children: /* @__PURE__ */ _jsxDEV(App, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 29,
				columnNumber: 11
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 28,
			columnNumber: 9
		}, this) }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 27,
			columnNumber: 7
		}, this));
		console.log("[DEBUG] main.tsx: render() call completed (sync)");
	} catch (err) {
		console.error("[DEBUG] main.tsx: React Render crashed synchronously:", err);
	}
} else {
	console.error("[DEBUG] root element missing from strictly typed DOM!");
}

//# sourceMappingURL=data:application/json;base64,eyJtYXBwaW5ncyI6IkFBQUEsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sY0FBYztBQUNyQixTQUFTLDJCQUEyQjtBQUNwQyxTQUFTLG1CQUFtQjtBQUM1QixPQUFPLFNBQVM7QUFDaEIsT0FBTzs7O0FBRVAsUUFBUSxJQUFJLDZDQUE2QztBQUN6RCxPQUFPLGlCQUFpQixVQUFVLE1BQU0sUUFBUSxNQUFNLHlCQUF5QixFQUFFLE1BQU0sQ0FBQztBQUN4RixPQUFPLGlCQUFpQix1QkFBdUIsTUFBTSxRQUFRLE1BQU0sOEJBQThCLEVBQUUsT0FBTyxDQUFDO0FBRTNHLElBQUk7QUFDSixJQUFJO0FBQ0YsZUFBYyxTQUFTLGVBQWUsT0FBTztBQUM3QyxTQUFRLElBQUkseUNBQXlDLENBQUMsQ0FBQyxZQUFZO1NBQzVELEdBQUc7QUFDVixTQUFRLE1BQU0saURBQWlELEVBQUU7O0FBR25FLElBQUksYUFBYTtBQUNmLEtBQUk7QUFDRixVQUFRLElBQUksMkRBQTJEO0VBQ3ZFLE1BQU0sT0FBTyxTQUFTLFdBQVcsWUFBWTtBQUM3QyxVQUFRLElBQUksMkRBQTJEO0FBRXZFLE9BQUssT0FDSCx3QkFBQyxNQUFNLFlBQVAsWUFDRSx3QkFBQyxxQkFBRDtHQUFxQixRQUFRO2FBQzNCLHdCQUFDLEtBQUQsRUFBTzs7Ozs7R0FDYTs7OztZQUNMOzs7O1dBQ3BCO0FBQ0QsVUFBUSxJQUFJLG1EQUFtRDtVQUN4RCxLQUFLO0FBQ1osVUFBUSxNQUFNLHlEQUF5RCxJQUFJOztPQUV4RTtBQUNMLFNBQVEsTUFBTSx3REFBd0QiLCJuYW1lcyI6W10sInNvdXJjZXMiOlsibWFpbi50c3giXSwidmVyc2lvbiI6Mywic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IFJlYWN0RE9NIGZyb20gJ3JlYWN0LWRvbS9jbGllbnQnXG5pbXBvcnQgeyBRdWVyeUNsaWVudFByb3ZpZGVyIH0gZnJvbSAnQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5J1xuaW1wb3J0IHsgcXVlcnlDbGllbnQgfSBmcm9tICcuL2xpYi9xdWVyeUNsaWVudCdcbmltcG9ydCBBcHAgZnJvbSAnLi9BcHAudHN4J1xuaW1wb3J0ICcuL2luZGV4LmNzcydcblxuY29uc29sZS5sb2coXCJbREVCVUddIG1haW4udHN4OiBTY3JpcHQgZXhlY3V0aW9uIHN0YXJ0ZWRcIik7XG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCAoZSkgPT4gY29uc29sZS5lcnJvcihcIltERUJVR10gR0xPQkFMIEVSUk9SOlwiLCBlLmVycm9yKSk7XG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndW5oYW5kbGVkcmVqZWN0aW9uJywgKGUpID0+IGNvbnNvbGUuZXJyb3IoXCJbREVCVUddIFVOSEFORExFRCBQUk9NSVNFOlwiLCBlLnJlYXNvbikpO1xuXG5sZXQgcm9vdEVsZW1lbnQ7XG50cnkge1xuICByb290RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb290Jyk7XG4gIGNvbnNvbGUubG9nKFwiW0RFQlVHXSBtYWluLnRzeDogRm91bmQgcm9vdCBlbGVtZW50OlwiLCAhIXJvb3RFbGVtZW50KTtcbn0gY2F0Y2ggKGUpIHtcbiAgY29uc29sZS5lcnJvcihcIltERUJVR10gbWFpbi50c3g6IEZhaWxlZCB0byBnZXQgcm9vdCBlbGVtZW50OlwiLCBlKTtcbn1cblxuaWYgKHJvb3RFbGVtZW50KSB7XG4gIHRyeSB7XG4gICAgY29uc29sZS5sb2coXCJbREVCVUddIG1haW4udHN4OiBBdHRlbXB0aW5nIHRvIGNhbGwgUmVhY3RET00uY3JlYXRlUm9vdFwiKTtcbiAgICBjb25zdCByb290ID0gUmVhY3RET00uY3JlYXRlUm9vdChyb290RWxlbWVudCk7XG4gICAgY29uc29sZS5sb2coXCJbREVCVUddIG1haW4udHN4OiBjcmVhdGVSb290IHN1Y2NlZWRlZCwgY2FsbGluZyByZW5kZXIoKVwiKTtcbiAgICBcbiAgICByb290LnJlbmRlcihcbiAgICAgIDxSZWFjdC5TdHJpY3RNb2RlPlxuICAgICAgICA8UXVlcnlDbGllbnRQcm92aWRlciBjbGllbnQ9e3F1ZXJ5Q2xpZW50fT5cbiAgICAgICAgICA8QXBwIC8+XG4gICAgICAgIDwvUXVlcnlDbGllbnRQcm92aWRlcj5cbiAgICAgIDwvUmVhY3QuU3RyaWN0TW9kZT5cbiAgICApO1xuICAgIGNvbnNvbGUubG9nKFwiW0RFQlVHXSBtYWluLnRzeDogcmVuZGVyKCkgY2FsbCBjb21wbGV0ZWQgKHN5bmMpXCIpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiW0RFQlVHXSBtYWluLnRzeDogUmVhY3QgUmVuZGVyIGNyYXNoZWQgc3luY2hyb25vdXNseTpcIiwgZXJyKTtcbiAgfVxufSBlbHNlIHtcbiAgY29uc29sZS5lcnJvcihcIltERUJVR10gcm9vdCBlbGVtZW50IG1pc3NpbmcgZnJvbSBzdHJpY3RseSB0eXBlZCBET00hXCIpO1xufVxuIl19