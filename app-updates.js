(() => {
  "use strict";
  const plugin = window.Capacitor?.Plugins?.MoriyaSignage;
  const core = window.MoriyaUpdateCore;
  if (!window.Capacitor?.isNativePlatform?.() || !plugin || !core) return;
  const $ = (id) => document.getElementById(id);
  const source = $("appUpdateManifestUrl"), status = $("appUpdateStatus");
  const checkButton = $("checkAppUpdate"), downloadButton = $("downloadAppUpdate");
  const sourceKey = "moriyaUpdateManifestUrl";
  let installed = null, latest = null, busy = false;
  let lastCheck = 0;
  async function check(automatic = false) {
    if (busy || !installed || document.hidden) return;
    if (!source.value.trim()) { if (!automatic) status.textContent = "GitHubの準備後、更新情報URLを設定してください。"; return; }
    busy = true; checkButton.disabled = true; latest = null; downloadButton.hidden = true;
    status.textContent = "最新バージョンを確認しています…";
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const url = new URL(core.httpsUrl(source.value.trim()));
      url.searchParams.set("_check", String(Date.now()));
      const response = await fetch(url.href, { cache: "no-store", credentials: "omit", signal: controller.signal });
      if (!response.ok) throw new Error(response.status === 404 ? "更新情報がまだ公開されていません。URLとGitHubの設定を確認してください。" : `更新確認に失敗しました（HTTP ${response.status}）。`);
      const text = await response.text();
      if (text.length > 65536) throw new Error("更新情報が大きすぎます。");
      const manifest = core.validateManifest(JSON.parse(text));
      lastCheck = Date.now();
      if (core.isNewer(manifest, installed)) {
        latest = manifest;
        downloadButton.hidden = false;
        status.textContent = `新しいバージョン ${manifest.displayVersion || manifest.version} があります。ブラウザでAPKをダウンロードできます。`;
      } else status.textContent = "現在のアプリは最新です。";
    } catch (error) {
      status.textContent = error.name === "AbortError" ? "更新確認がタイムアウトしました。ネットワークを確認して再試行してください。" : error instanceof SyntaxError ? "更新情報を読み取れませんでした。latest.jsonのURLを確認してください。" : error.message || "更新を確認できませんでした。";
    } finally { clearTimeout(timer); busy = false; checkButton.disabled = false; }
  }
  checkButton.addEventListener("click", () => void check());
  $("saveAppUpdateSource").addEventListener("click", () => {
    try {
      const value = source.value.trim();
      localStorage.setItem(sourceKey, value ? core.httpsUrl(value) : "");
      latest = null; downloadButton.hidden = true;
      status.textContent = value ? "更新情報URLを保存しました。" : "更新確認の接続設定を解除しました。";
      if (value) void check();
    } catch (error) { status.textContent = error.message; }
  });
  downloadButton.addEventListener("click", async () => {
    if (!latest) return;
    try { await plugin.openUpdatePage({ url: latest.releasePageUrl }); }
    catch { status.textContent = "ブラウザを開けませんでした。ネットワークとブラウザを確認してください。"; }
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && Date.now() - lastCheck > 6 * 60 * 60 * 1000) void check(true);
  });
  setInterval(() => { if (!document.hidden) void check(true); }, 6 * 60 * 60 * 1000);
  async function init() {
    try {
      installed = await plugin.getAppInfo();
      $("appCurrentVersion").textContent = `${installed.version}（内部番号 ${installed.versionCode}）`;
      let config = {};
      try { config = await (await fetch("./release-config.json")).json(); } catch {}
      source.value = localStorage.getItem(sourceKey) ?? config.updateManifestUrl ?? "";
      status.textContent = source.value ? "更新を確認できます。" : "GitHubの準備後、更新情報URLを設定してください。";
      void check(true);
    } catch { $("appCurrentVersion").textContent = "確認できません"; status.textContent = "バージョン確認に対応したAPKへの更新が必要です。"; }
  }
  void init();
})();
