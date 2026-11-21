param([Parameter(Mandatory=$true)][int]$AppProcessId)
$ErrorActionPreference = 'Stop'

# Inspect the real running Win32 HWND, not just its HTML content.
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
[StructLayout(LayoutKind.Sequential)]
public struct NativeRect {
    public int Left;
    public int Top;
    public int Right;
    public int Bottom;
}
public static class NativeFrame {
    [DllImport("user32.dll", EntryPoint = "GetWindowLongW", SetLastError = true)]
    public static extern int GetWindowLong(IntPtr hwnd, int index);
    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool GetWindowRect(IntPtr hwnd, out NativeRect rect);
}
'@

$process = Get-Process -Id $AppProcessId
$process.Refresh()
if ($process.MainWindowHandle -eq [IntPtr]::Zero) {
    throw "Native application has no main window"
}
$style = [NativeFrame]::GetWindowLong($process.MainWindowHandle, -16)
if (($style -band 0x00C00000) -ne 0) {
    throw "Duplicate Windows system caption remains (WS_CAPTION set)"
}
if (($style -band 0x00040000) -eq 0) {
    throw "Resizing frame is missing (WS_THICKFRAME)"
}
$rect = [NativeRect]::new()
if (-not [NativeFrame]::GetWindowRect($process.MainWindowHandle, [ref]$rect)) {
    throw "Unable to read the native window rectangle"
}
$width = $rect.Right - $rect.Left
$height = $rect.Bottom - $rect.Top
if ($width -gt 1050 -or $height -gt 790 -or $width -lt 820 -or $height -lt 580) {
    throw "Unexpected default window size: $($width)x$($height) (expected near 960x700)"
}
Write-Output "PASS: one titlebar, native resize frame, compact startup window $($width)x$($height)"
