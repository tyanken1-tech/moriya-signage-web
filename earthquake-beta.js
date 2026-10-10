(() => {
  "use strict";
  // This small loader is the only earthquake code evaluated with the beta off.
  // Its storage is independent of all existing signage settings.
  const key = "moriyaEarthquakeBetaSettings";
  const toggle = document.querySelector("#earthquakeBetaEnabled");
  const status = document.querySelector("#earthquakeBetaStatus");
  if (!toggle || !status) return;
  let config;
  try { config = JSON.parse(localStorage.getItem(key) || "{}"); } catch { config = {}; }
  config = config && typeof config === "object" ? config : {};
  let generation = 0;
  let loading = null;
  let instance = null;
  let style = null;
  function save() { localStorage.setItem(key, JSON.stringify(config)); }
  function script(src) {
    return new Promise((resolve, reject) => {
      const node = document.createElement("script");
      node.src = src;
      node.onload = resolve;
      node.onerror = () => { node.remove(); reject(new Error("地震機能を読み込めませんでした")); };
      document.body.append(node);
    });
  }
  async function activate() {
    const token = ++generation;
    if (config.enabled !== true) {
      instance?.destroy();
      instance = null;
      style?.remove();
      style = null;
      status.textContent = "オフ。地震情報の通信・描画は停止しています。設定はこの端末に即時保存します。";
      return;
    }
    status.textContent = "地震情報を準備しています…";
    try {
      if (!loading) loading = (async () => {
        if (!window.MoriyaEarthquakeCore) await script("./earthquake-core.js?v=20261010-3");
        if (!window.MoriyaEarthquakeRuntime) await script("./earthquake-runtime.js?v=20261010-3");
      })().catch((error) => { loading = null; throw error; });
      await loading;
      if (token !== generation || config.enabled !== true) return;
      style = document.createElement("link");
      style.rel = "stylesheet";
      style.href = "./earthquake-beta.css?v=20261010-3";
      document.head.append(style);
      const mounted = await window.MoriyaEarthquakeRuntime.mount(config, (next) => { config = next; save(); }, () => token === generation && config.enabled === true);
      if (token !== generation || config.enabled !== true) { mounted?.destroy(); return; }
      instance = mounted;
      document.dispatchEvent(new Event('moriya-settings-visibility'));
      status.textContent = "オン。ホームで上スワイプすると地震画面を開けます。各設定は即時保存されます。";
    } catch (error) {
      if (token !== generation) return;
      instance?.destroy(); instance = null;
      style?.remove(); style = null;
      config.enabled = false;
      toggle.checked = false;
      document.dispatchEvent(new Event('moriya-settings-visibility'));
      save();
      status.textContent = `${error.message}。再度オンにすると再試行します。`;
    }
  }
  toggle.checked = config.enabled === true;
  toggle.addEventListener("change", () => { config.enabled = toggle.checked; save(); void activate(); });
  if (config.enabled === true) void activate();
})();
