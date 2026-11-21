#define WIN32_LEAN_AND_MEAN
#define NOMINMAX
#include <windows.h>
#include <dwmapi.h>
#include <objidl.h>
#include <wrl.h>
#include <string>
#include <algorithm>
#include "WebView2.h"
#include "WebView2EnvironmentOptions.h"

using Microsoft::WRL::Callback;
using Microsoft::WRL::ComPtr;
static constexpr wchar_t kHome[] = L"https://cyber-encryption.invalid/";
static HWND g_window = nullptr;
static ComPtr<ICoreWebView2Environment> g_environment;
static ComPtr<ICoreWebView2Controller> g_controller;
static ComPtr<ICoreWebView2> g_webview;

static std::string LoadEmbedded(UINT id) {
    HRSRC res = FindResourceW(nullptr, MAKEINTRESOURCEW(id), RT_RCDATA);
    if (!res) return {};
    HGLOBAL data = LoadResource(nullptr, res);
    if (!data) return {};
    auto p = static_cast<const char*>(LockResource(data));
    return p ? std::string(p, SizeofResource(nullptr, res)) : std::string();
}
static ComPtr<IStream> StreamFrom(const std::string& s) {
    ComPtr<IStream> stream;
    HGLOBAL buffer = GlobalAlloc(GMEM_MOVEABLE, s.size() ? s.size() : 1);
    if (!buffer) return stream;
    void* ptr = GlobalLock(buffer);
    if (!ptr) { GlobalFree(buffer); return stream; }
    if (!s.empty()) memcpy(ptr, s.data(), s.size());
    GlobalUnlock(buffer);
    if (FAILED(CreateStreamOnHGlobal(buffer, TRUE, &stream))) GlobalFree(buffer);
    return stream;
}
static std::wstring ExecutableFolder() {
    wchar_t path[MAX_PATH] = {};
    GetModuleFileNameW(nullptr, path, MAX_PATH);
    std::wstring full(path);
    auto cut = full.find_last_of(L"\\/");
    return cut == std::wstring::npos ? L"." : full.substr(0, cut);
}
static void ShowFailure(const wchar_t* message) {
    MessageBoxW(g_window, message, L"Cyber Encryption", MB_OK | MB_ICONERROR);
}
static void ResizeWebView() {
    if (!g_controller || !g_window) return;
    RECT bounds = {};
    GetClientRect(g_window, &bounds);
    g_controller->put_Bounds(bounds);
}
static LRESULT CALLBACK WindowProc(HWND hwnd, UINT message, WPARAM wp, LPARAM lp) {
    switch (message) {
    case WM_NCCALCSIZE:
        if (wp) return 0; // Native borderless chrome; preserve Windows resize behavior below.
        break;
    case WM_NCHITTEST: {
        if (IsZoomed(hwnd)) return HTCLIENT;
        POINT p{ GET_X_LPARAM(lp), GET_Y_LPARAM(lp) };
        RECT r{}; GetWindowRect(hwnd, &r);
        const int edge = 8;
        bool left = p.x < r.left + edge, right = p.x >= r.right - edge;
        bool top = p.y < r.top + edge, bottom = p.y >= r.bottom - edge;
        if (top && left) return HTTOPLEFT;
        if (top && right) return HTTOPRIGHT;
        if (bottom && left) return HTBOTTOMLEFT;
        if (bottom && right) return HTBOTTOMRIGHT;
        if (left) return HTLEFT;
        if (right) return HTRIGHT;
        if (top) return HTTOP;
        if (bottom) return HTBOTTOM;
        return HTCLIENT;
    }
    case WM_GETMINMAXINFO: {
        auto info = reinterpret_cast<MINMAXINFO*>(lp);
        HMONITOR monitor = MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST);
        MONITORINFO m{ sizeof(MONITORINFO) };
        if (GetMonitorInfoW(monitor, &m)) {
            info->ptMaxPosition.x = m.rcWork.left - m.rcMonitor.left;
            info->ptMaxPosition.y = m.rcWork.top - m.rcMonitor.top;
            info->ptMaxSize.x = m.rcWork.right - m.rcWork.left;
            info->ptMaxSize.y = m.rcWork.bottom - m.rcWork.top;
        }
        info->ptMinTrackSize.x = 760;
        info->ptMinTrackSize.y = 540;
        return 0;
    }
    case WM_SIZE: ResizeWebView(); return 0;
    case WM_DPICHANGED: {
        auto rect = reinterpret_cast<const RECT*>(lp);
        SetWindowPos(hwnd, nullptr, rect->left, rect->top,
            rect->right - rect->left, rect->bottom - rect->top,
            SWP_NOZORDER | SWP_NOACTIVATE);
        return 0;
    }
    case WM_DESTROY:
        g_webview.Reset();
        g_controller.Reset();
        g_environment.Reset();
        PostQuitMessage(0);
        return 0;
    }
    return DefWindowProcW(hwnd, message, wp, lp);
}

static void SendResponse(ICoreWebView2WebResourceRequestedEventArgs* args,
    const std::string& body, const wchar_t* contentType, int status = 200) {
    ComPtr<IStream> stream = StreamFrom(body);
    if (!stream || !g_environment) return;
    std::wstring headers = L"Content-Type: ";
    headers += contentType;
    headers += L"\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\n";
    if (contentType[0] == L't') { // HTML only: no remote network, plugins, or framing.
        headers += L"Content-Security-Policy: default-src 'none'; "
            L"script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; "
            L"img-src 'self' data: blob:; connect-src 'none'; "
            L"object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'\r\n";
    }
    ComPtr<ICoreWebView2WebResourceResponse> response;
    if (SUCCEEDED(g_environment->CreateWebResourceResponse(stream.Get(), status,
            status == 200 ? L"OK" : L"Forbidden", headers.c_str(), &response)))
        args->put_Response(response.Get());
}

static void ConfigureBrowser(HWND hwnd, ICoreWebView2* browser) {
    g_webview = browser;
    ComPtr<ICoreWebView2Settings> settings;
    if (SUCCEEDED(browser->get_Settings(&settings))) {
        settings->put_AreDefaultContextMenusEnabled(FALSE);
        settings->put_AreDevToolsEnabled(FALSE);
        settings->put_IsStatusBarEnabled(FALSE);
    }

    EventRegistrationToken token{};
    browser->AddWebResourceRequestedFilter(L"*", COREWEBVIEW2_WEB_RESOURCE_CONTEXT_ALL);
    browser->add_WebResourceRequested(
        Callback<ICoreWebView2WebResourceRequestedEventHandler>(
            [](ICoreWebView2*, ICoreWebView2WebResourceRequestedEventArgs* args) -> HRESULT {
                ComPtr<ICoreWebView2WebResourceRequest> request;
                if (FAILED(args->get_Request(&request))) return S_OK;
                LPWSTR raw = nullptr;
                if (FAILED(request->get_Uri(&raw))) return S_OK;
                std::wstring uri(raw);
                CoTaskMemFree(raw);
                std::wstring base(kHome);
                if (uri == base || uri == base + L"index.html") {
                    std::string html = LoadEmbedded(101);
                    auto at = html.rfind("</body>");
                    if (at != std::string::npos) html.insert(at, "<script src=\"/ui.js\"></script>");
                    SendResponse(args, html, L"text/html; charset=utf-8");
                } else if (uri == base + L"ui.js") {
                    SendResponse(args, LoadEmbedded(102), L"application/javascript; charset=utf-8");
                } else if (uri.compare(0, 5, L"blob:") == 0 ||
                           uri.compare(0, 5, L"data:") == 0) {
                    // Built-in browser APIs handle local, in-memory exports.
                } else {
                    SendResponse(args, "Network access is disabled.", L"text/plain; charset=utf-8", 403);
                }
                return S_OK;
            }).Get(), &token);

    browser->add_NavigationStarting(
        Callback<ICoreWebView2NavigationStartingEventHandler>(
            [](ICoreWebView2*, ICoreWebView2NavigationStartingEventArgs* args) -> HRESULT {
                LPWSTR raw = nullptr;
                if (SUCCEEDED(args->get_Uri(&raw))) {
                    std::wstring uri(raw);
                    CoTaskMemFree(raw);
                    if (uri != kHome && uri != std::wstring(kHome) + L"index.html")
                        args->put_Cancel(TRUE);
                }
                return S_OK;
            }).Get(), &token);

    browser->add_NewWindowRequested(
        Callback<ICoreWebView2NewWindowRequestedEventHandler>(
            [](ICoreWebView2*, ICoreWebView2NewWindowRequestedEventArgs* args) -> HRESULT {
                args->put_Handled(TRUE);
                return S_OK;
            }).Get(), &token);

    browser->add_PermissionRequested(
        Callback<ICoreWebView2PermissionRequestedEventHandler>(
            [](ICoreWebView2*, ICoreWebView2PermissionRequestedEventArgs* args) -> HRESULT {
                COREWEBVIEW2_PERMISSION_KIND kind{};
                if (SUCCEEDED(args->get_PermissionKind(&kind)) &&
                    kind == COREWEBVIEW2_PERMISSION_KIND_CLIPBOARD_READ)
                    args->put_State(COREWEBVIEW2_PERMISSION_STATE_ALLOW);
                else args->put_State(COREWEBVIEW2_PERMISSION_STATE_DENY);
                return S_OK;
            }).Get(), &token);

    browser->add_WebMessageReceived(
        Callback<ICoreWebView2WebMessageReceivedEventHandler>(
            [hwnd](ICoreWebView2*, ICoreWebView2WebMessageReceivedEventArgs* args) -> HRESULT {
                LPWSTR source = nullptr, value = nullptr;
                if (FAILED(args->get_Source(&source))) return S_OK;
                bool trusted = (wcscmp(source, kHome) == 0 ||
                    wcscmp(source, (std::wstring(kHome) + L"index.html").c_str()) == 0);
                CoTaskMemFree(source);
                if (!trusted || FAILED(args->TryGetWebMessageAsString(&value))) return S_OK;
                std::wstring command(value);
                CoTaskMemFree(value);
                if (command == L"minimize") ShowWindow(hwnd, SW_MINIMIZE);
                else if (command == L"maximize") ShowWindow(hwnd, IsZoomed(hwnd) ? SW_RESTORE : SW_MAXIMIZE);
                else if (command == L"close") PostMessageW(hwnd, WM_CLOSE, 0, 0);
                else if (command == L"drag") {
                    ReleaseCapture();
                    SendMessageW(hwnd, WM_NCLBUTTONDOWN, HTCAPTION, 0);
                }
                return S_OK;
            }).Get(), &token);
    browser->Navigate(kHome);
}

static bool StartWebView(HWND hwnd) {
    LPWSTR runtimeVersion = nullptr;
    HRESULT hr = GetAvailableCoreWebView2BrowserVersionString(nullptr, &runtimeVersion);
    if (runtimeVersion) CoTaskMemFree(runtimeVersion);
    if (FAILED(hr)) {
        ShowFailure(L"Microsoft Edge WebView2 Runtime is missing.\n"
            L"Windows 11 normally includes it. Install the official Microsoft WebView2 "
            L"Evergreen Runtime once (an offline installer is available), then reopen this app.\n\n"
            L"The app itself does not require internet.");
        return false;
    }
    auto options = Microsoft::WRL::Make<CoreWebView2EnvironmentOptions>();
    std::wstring flags = L"--disable-background-networking --disable-component-update "
        L"--disable-features=msEdgeSidebarV2";
    wchar_t testFlag[8] = {};
    if (GetEnvironmentVariableW(L"CYBER_UI_TEST", testFlag, 8) > 0)
        flags += L" --remote-debugging-port=9223";
    options->put_AdditionalBrowserArguments(flags.c_str());

    // A writable folder beside the EXE keeps the browser profile portable.
    std::wstring profile = ExecutableFolder() + L"\\CyberEncryptionData";
    if (!CreateDirectoryW(profile.c_str(), nullptr) &&
        GetLastError() != ERROR_ALREADY_EXISTS) {
        ShowFailure(L"Cannot create a portable data folder beside the EXE.\n"
            L"Move the EXE to a writable folder or USB drive.");
        return false;
    }
    hr = CreateCoreWebView2EnvironmentWithOptions(nullptr, profile.c_str(), options.Get(),
        Callback<ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler>(
            [hwnd](HRESULT result, ICoreWebView2Environment* environment) -> HRESULT {
                if (FAILED(result) || !environment) {
                    ShowFailure(L"WebView2 could not initialize. Check the WebView2 Runtime "
                        L"and write permissions beside the EXE.");
                    return S_OK;
                }
                g_environment = environment;
                environment->CreateCoreWebView2Controller(hwnd,
                    Callback<ICoreWebView2CreateCoreWebView2ControllerCompletedHandler>(
                        [hwnd](HRESULT done, ICoreWebView2Controller* controller) -> HRESULT {
                            if (FAILED(done) || !controller) {
                                ShowFailure(L"Could not create the desktop WebView2 window.");
                                return S_OK;
                            }
                            g_controller = controller;
                            controller->put_IsVisible(TRUE);
                            ResizeWebView();
                            ComPtr<ICoreWebView2> browser;
                            if (SUCCEEDED(controller->get_CoreWebView2(&browser)))
                                ConfigureBrowser(hwnd, browser.Get());
                            return S_OK;
                        }).Get());
                return S_OK;
            }).Get());
    if (FAILED(hr)) {
        ShowFailure(L"Could not start WebView2.");
        return false;
    }
    return true;
}

int WINAPI wWinMain(HINSTANCE instance, HINSTANCE, PWSTR, int nCmdShow) {
    SetProcessDpiAwarenessContext(DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2);
    if (FAILED(CoInitializeEx(nullptr, COINIT_APARTMENTTHREADED))) return 1;
    WNDCLASSEXW wc{ sizeof(wc) };
    wc.hInstance = instance;
    wc.lpfnWndProc = WindowProc;
    wc.lpszClassName = L"CyberEncryptionPortableNative";
    wc.hCursor = LoadCursorW(nullptr, IDC_ARROW);
    wc.hIcon = LoadIconW(instance, MAKEINTRESOURCEW(1));
    wc.hIconSm = wc.hIcon;
    wc.hbrBackground = CreateSolidBrush(RGB(13, 12, 32));
    if (!RegisterClassExW(&wc)) { CoUninitialize(); return 1; }
    g_window = CreateWindowExW(WS_EX_APPWINDOW, wc.lpszClassName,
        L"Cyber Encryption", WS_OVERLAPPEDWINDOW | WS_CLIPCHILDREN,
        CW_USEDEFAULT, CW_USEDEFAULT, 1160, 850,
        nullptr, nullptr, instance, nullptr);
    if (!g_window) { CoUninitialize(); return 1; }
    const BOOL dark = TRUE;
    DwmSetWindowAttribute(g_window, DWMWA_USE_IMMERSIVE_DARK_MODE, &dark, sizeof(dark));
    const DWM_WINDOW_CORNER_PREFERENCE corners = DWMWCP_ROUND;
    DwmSetWindowAttribute(g_window, DWMWA_WINDOW_CORNER_PREFERENCE, &corners, sizeof(corners));
    ShowWindow(g_window, nCmdShow == SW_HIDE ? SW_SHOWNORMAL : nCmdShow);
    UpdateWindow(g_window);
    if (!StartWebView(g_window)) {
        DestroyWindow(g_window);
        CoUninitialize();
        return 1;
    }
    MSG msg;
    while (GetMessageW(&msg, nullptr, 0, 0) > 0) {
        TranslateMessage(&msg);
        DispatchMessageW(&msg);
    }
    CoUninitialize();
    return static_cast<int>(msg.wParam);
}
