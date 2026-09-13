using System.Diagnostics;
using System.Net.Http;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace WorkJournalDesktop;

public class MainForm : Form
{
    private const string AppUrl = "http://localhost:5080";

    private readonly WebView2 _webView = new() { Dock = DockStyle.Fill };
    private readonly Label _statusLabel = new()
    {
        Dock = DockStyle.Fill,
        TextAlign = ContentAlignment.MiddleCenter,
        Font = new Font("Microsoft JhengHei", 12),
        Text = "正在啟動工作週誌...",
    };
    private Process? _apiProcess;

    public MainForm()
    {
        Text = "工作週誌";
        Width = 1280;
        Height = 860;
        MinimumSize = new Size(760, 560);
        StartPosition = FormStartPosition.CenterScreen;
        try { Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); }
        catch { /* fall back to the default WinForms icon if extraction fails */ }

        // Pin the WebView2 profile to a fixed folder name rather than the default (which is
        // derived from the exe's own filename) so the cache survives us renaming the exe.
        _webView.CreationProperties = new CoreWebView2CreationProperties
        {
            UserDataFolder = Path.Combine(AppContext.BaseDirectory, "UserData"),
        };

        Controls.Add(_webView);
        Controls.Add(_statusLabel);
        _webView.Visible = false;

        Load += OnLoad;
        FormClosing += OnFormClosing;
    }

    private async void OnLoad(object? sender, EventArgs e)
    {
        StartApiProcess();
        var ready = await WaitForApiAsync(TimeSpan.FromSeconds(20));
        if (!ready)
        {
            _statusLabel.Text = "無法啟動後端伺服器，請確認網路連線或洽系統管理員。";
            return;
        }

        await _webView.EnsureCoreWebView2Async();
        _webView.CoreWebView2.Navigate(AppUrl);
        _webView.CoreWebView2.NavigationCompleted += (_, _) =>
        {
            _statusLabel.Visible = false;
            _webView.Visible = true;
        };
    }

    // The API's own browser auto-launch (Program.cs in WorkJournalApi) is suppressed via
    // this env var so we don't end up with both a system browser tab and this window open.
    private void StartApiProcess()
    {
        var exeDir = AppContext.BaseDirectory;
        var apiExePath = Path.Combine(exeDir, "WorkJournalApi.exe");
        if (!File.Exists(apiExePath)) return;

        var psi = new ProcessStartInfo(apiExePath)
        {
            WorkingDirectory = exeDir,
            UseShellExecute = false,
            CreateNoWindow = true,
        };
        psi.EnvironmentVariables["WORKJOURNAL_NO_AUTOLAUNCH"] = "1";
        _apiProcess = Process.Start(psi);
    }

    private static async Task<bool> WaitForApiAsync(TimeSpan timeout)
    {
        using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(2) };
        var deadline = DateTime.UtcNow + timeout;
        while (DateTime.UtcNow < deadline)
        {
            try
            {
                var res = await http.GetAsync(AppUrl + "/api/departments");
                if (res.IsSuccessStatusCode) return true;
            }
            catch { /* API not ready yet — keep polling */ }
            await Task.Delay(400);
        }
        return false;
    }

    private void OnFormClosing(object? sender, FormClosingEventArgs e)
    {
        if (_apiProcess is { HasExited: false })
        {
            try { _apiProcess.Kill(entireProcessTree: true); }
            catch { /* already exiting — ignore */ }
        }
    }
}
