(() => {
  "use strict";
  const native = window.Capacitor?.Plugins?.MoriyaLanSync;
  const section = document.querySelector("#lanSyncSettings");
  if (!native || !section) return;
  section.hidden = false;

  const $ = (selector) => section.querySelector(selector);
  const status = $("#lanSyncStatus");
  const localAddress = $("#lanSyncLocalAddress");
  const hostField = $("#lanSyncHost");
  const portField = $("#lanSyncPort");
  const codeField = $("#lanSyncCode");
  const qrPanel = $("#lanSyncQrPanel");
  const scannerPanel = $("#lanSyncScanner");
  const video = $("#lanSyncCamera");
  const discovered = $("#lanSyncDiscovered");
  const peersNode = $("#lanSyncPeers");
  const modeField = $("#lanSyncMode");
  const modeKey = "moriyaSmartSyncMode";
  modeField.value = ["manual", "auto", "off"].includes(localStorage.getItem(modeKey)) ? localStorage.getItem(modeKey) : "manual";
  const keys = ["homeInfoMode", "natureRemo", "switchBot", "smartLife"];
  const revisionKey = "moriyaSmartSyncRevision";
  let deviceId = "";
  let revision = { counter: 0, id: "" };
  let previousConfig = JSON.stringify(config());
  let peers = [];
  let started = false;
  let suppressLocal = false;
  let retryTimer = 0;
  let dirty = false;
  let cameraStream = null;
  let scanTimer = 0;
  let pendingConflict = null;
  let nativeMessageListener = null;
  let nativePairedListener = null;

  function config() {
    return Object.fromEntries(keys.map((key) => [key, structuredClone(settings[key])]));
  }

  function message(text) { status.textContent = text; }

  function versionCompare(a, b) {
    const left = Number(a?.counter) || 0;
    const right = Number(b?.counter) || 0;
    return left === right ? String(a?.id || "").localeCompare(String(b?.id || "")) : left - right;
  }

  function revisionFromStorage() {
    try {
      const saved = JSON.parse(localStorage.getItem(revisionKey) || "null");
      if (saved && Number.isInteger(saved.counter) && saved.counter >= 0) return { counter: saved.counter, id: saved.id || deviceId };
    } catch {}
    const hasCredentials = Boolean(settings.natureRemo?.token || settings.switchBot?.token || settings.smartLife?.accessId);
    return { counter: hasCredentials ? 1 : 0, id: deviceId };
  }

  function saveRevision() {
    localStorage.setItem(revisionKey, JSON.stringify(revision));
  }

  function ownSchedules() {
    return window.MoriyaSmartHome?.getOwnPending?.() || [];
  }

  function snapshot() {
    return { revision, config: config(), schedules: ownSchedules(), settingsSyncMode: modeField.value };
  }

  async function updateNativeSnapshot() {
    if (started) await native.setSnapshot({ snapshot: JSON.stringify(snapshot()) });
  }

  async function publish(type, peerId = "") {
    if (!started || document.hidden) { dirty = true; return null; }
    await updateNativeSnapshot();
    const result = await native.push({ message: JSON.stringify({ type, snapshot: snapshot() }), peerId });
    const failed = result?.failed || [];
    dirty = failed.length > 0;
    if (dirty && !retryTimer) retryTimer = window.setTimeout(async () => {
      retryTimer = 0;
      if (dirty && !document.hidden) {
        try { await pullAndReconcile(); await publish("snapshot"); } catch {}
      }
    }, 30000);
    return result;
  }

  function configHasCredentials(value) {
    return Boolean(value?.natureRemo?.token || value?.switchBot?.token || value?.smartLife?.accessId);
  }

  async function acceptSettings(remote, force = false) {
    if (!remote?.config || !remote?.revision) return;
    const remoteText = JSON.stringify(remote.config);
    if (remoteText === previousConfig) {
      if (versionCompare(remote.revision, revision) > 0) {
        revision = remote.revision;
        saveRevision();
        await updateNativeSnapshot();
      }
      return;
    }
    const compare = versionCompare(remote.revision, revision);
    if (compare < 0 && !force) { dirty = true; return; }
    if (!force && Number(remote.revision.counter) === Number(revision.counter)
        && configHasCredentials(config()) && configHasCredentials(remote.config)) {
      pendingConflict = remote;
      message("両端末に異なる設定があります。取り込むか、こちらの設定を送るか選んでください。");
      renderConflict();
      return;
    }
    if (!force && compare === 0 && configHasCredentials(config()) && !configHasCredentials(remote.config)) {
      dirty = true;
      return;
    }
    suppressLocal = true;
    try {
      settings.homeInfoMode = ["none", "market", "remo", "hybrid"].includes(remote.config.homeInfoMode) ? remote.config.homeInfoMode : settings.homeInfoMode;
      settings.natureRemo = normalizeNatureRemoSettings(remote.config.natureRemo);
      settings.switchBot = normalizeSwitchBotSettings(remote.config.switchBot);
      settings.smartLife = normalizeSmartLifeSettings(remote.config.smartLife);
      revision = { counter: Math.max(revision.counter, Number(remote.revision.counter) || 0), id: String(remote.revision.id || "") };
      saveRevision();
      saveSettings();
      previousConfig = JSON.stringify(config());
      applySettingsToUi();
      document.dispatchEvent(new Event("moriya-smart-home-actions-change"));
      window.MoriyaNewUi?.renderNatureRemo?.({ enabled: ["remo", "hybrid"].includes(settings.homeInfoMode), actions: settings.natureRemo.actions });
      void window.MoriyaNatureRemo?.refresh?.();
      await updateNativeSnapshot();
      message("スマートホーム設定を同期しました。");
    } finally { suppressLocal = false; }
  }

  function reconcileSchedules(ownerId, remote) {
    if (!ownerId || ownerId === deviceId) return;
    window.MoriyaSmartHome?.receivePeerSchedules?.(ownerId, remote?.schedules || []);
  }

  async function pullAndReconcile() {
    if (!started || document.hidden) return;
    const response = await native.pull();
    for (const item of response?.snapshots || []) {
      if (modeField.value === "auto" && item.snapshot?.settingsSyncMode === "auto") await acceptSettings(item.snapshot);
      reconcileSchedules(item.peerId, item.snapshot);
    }
    await updateNativeSnapshot();
  }

  async function onPeerMessage(event) {
    const peerId = event?.peerId;
    const incoming = event?.message;
    if (!peerId || !incoming) return;
    if (incoming.type === "cancelRequest") {
      window.MoriyaSmartHome?.cancelLocalScheduleFromPeer?.(incoming.id);
      return;
    }
    if (!incoming.snapshot) return;
    if (incoming.type === "settingsForce" && modeField.value !== "off") await acceptSettings(incoming.snapshot, true);
    else if (modeField.value === "auto" && incoming.snapshot.settingsSyncMode === "auto" && (incoming.type === "settings" || incoming.type === "snapshot")) await acceptSettings(incoming.snapshot);
    reconcileSchedules(peerId, incoming.snapshot);
    if (modeField.value === "auto" && dirty && (incoming.type === "settings" || incoming.type === "snapshot")) await publish("snapshot", peerId);
  }

  async function cancelRemote(ownerId, id) {
    if (!started || document.hidden) return false;
    try {
      const result = await native.push({ peerId: ownerId, message: JSON.stringify({ type: "cancelRequest", id }) });
      if (!(result?.succeeded || []).includes(ownerId)) return false;
      window.MoriyaSmartHome?.removePeerSchedule?.(ownerId, id);
      return true;
    } catch { return false; }
  }

  function renderPeers() {
    peersNode.replaceChildren();
    if (!peers.length) {
      peersNode.textContent = "まだペアリングされていません。";
      return;
    }
    for (const peer of peers) {
      const row = document.createElement("div");
      row.className = "lan-sync-peer";
      const label = document.createElement("span");
      label.textContent = `${peer.name || "守谷サイネージ"} — ${peer.host}`;
      const pullButton = document.createElement("button");
      pullButton.type = "button";
      pullButton.textContent = "この端末を相手に合わせる";
      pullButton.disabled = modeField.value === "off";
      pullButton.addEventListener("click", async () => {
        if (!window.confirm("この端末のスマートホーム設定を、相手の設定で上書きしますか？")) return;
        try {
          const response = await native.pull({ peerId: peer.id });
          const item = (response?.snapshots || []).find((entry) => entry.peerId === peer.id);
          if (!item) throw new Error("相手に接続できません。両端末でアプリを開いてください。");
          if (item.snapshot?.settingsSyncMode === "off") throw new Error("相手側で「設定は同期しない」が選ばれています。");
          await acceptSettings(item.snapshot, true);
          reconcileSchedules(peer.id, item.snapshot);
          message(`${peer.name} の設定をこの端末に取り込みました。`);
        } catch (error) { message(error?.message || "設定を取り込めませんでした。"); }
      });
      const pushButton = document.createElement("button");
      pushButton.type = "button";
      pushButton.textContent = "相手をこの端末に合わせる";
      pushButton.disabled = modeField.value === "off";
      pushButton.addEventListener("click", async () => {
        if (!window.confirm("相手のスマートホーム設定を、この端末の設定で上書きしますか？")) return;
        try {
          const result = await publish("settingsForce", peer.id);
          if (!(result?.succeeded || []).includes(peer.id)) throw new Error("相手に接続できません。両端末でアプリを開いてください。");
          message(`${peer.name} へ設定を送信しました。相手が「設定は同期しない」の場合は反映されません。`);
        } catch (error) { message(error?.message || "設定を送信できませんでした。"); }
      });
      const forget = document.createElement("button");
      forget.type = "button";
      forget.textContent = "連携解除";
      forget.addEventListener("click", async () => {
        if (!window.confirm("この端末からペアリングを解除しますか？相手側にも設定が残るため、必要なら相手側でも解除してください。")) return;
        await native.forget({ peerId: peer.id });
        peers = peers.filter((entry) => entry.id !== peer.id);
        window.MoriyaSmartHome?.receivePeerSchedules?.(peer.id, []);
        renderPeers();
      });
      row.append(label, pullButton, pushButton, forget);
      peersNode.append(row);
    }
  }

  function renderConflict() {
    peersNode.querySelector(".lan-sync-conflict")?.remove();
    if (!pendingConflict) return;
    const row = document.createElement("div");
    row.className = "lan-sync-conflict";
    const pull = document.createElement("button");
    pull.type = "button"; pull.textContent = "相手の設定を取り込む";
    pull.addEventListener("click", async () => {
      const incoming = pendingConflict;
      pendingConflict = null;
      incoming.revision = { counter: Math.max(revision.counter, Number(incoming.revision.counter) || 0) + 1, id: deviceId };
      await acceptSettings(incoming, true);
      await publish("settings");
      row.remove();
    });
    const push = document.createElement("button");
    push.type = "button"; push.textContent = "この端末の設定を送る";
    push.addEventListener("click", async () => {
      pendingConflict = null;
      revision = { counter: revision.counter + 1, id: deviceId };
      saveRevision(); row.remove();
      await publish("settings");
    });
    row.append(pull, push);
    peersNode.prepend(row);
  }

  async function start() {
    if (started || document.hidden) return;
    try {
      const info = await native.start();
      deviceId = info.id;
      peers = info.peers || [];
      revision = revision.id ? revision : revisionFromStorage();
      started = true;
      window.MoriyaLanSync.deviceId = deviceId;
      renderPeers();
      nativeMessageListener = await native.addListener("message", onPeerMessage);
      nativePairedListener = await native.addListener("paired", async (peer) => {
        if (!peers.some((item) => item.id === peer.id)) peers.push(peer);
        renderPeers();
        await publish("snapshot", peer.id);
      });
      await updateNativeSnapshot();
      const addresses = [];
      if (info.wifiHost) addresses.push(`Wi-Fi: ${info.wifiHost}:${info.port}`);
      if (info.vpnHost && info.vpnHost !== info.wifiHost) addresses.push(`Tailscale/VPN: ${info.vpnHost}:${info.port}`);
      if (!addresses.length && info.host) addresses.push(`接続先: ${info.host}:${info.port}`);
      localAddress.textContent = addresses.length ? `この端末のアドレス — ${addresses.join(" / ")}` : `この端末のIPアドレスを自動取得できません。Androidのネットワーク設定で確認してください。ポート: ${info.port}`;
      message(`${info.name} — ペアリングの準備ができました。`);
      if (peers.length) {
        await pullAndReconcile();
        if (dirty) await publish("snapshot");
      }
    } catch (error) { message(error?.message || "LAN同期を開始できませんでした。"); }
  }

  async function stop() {
    stopScan();
    if (!started) return;
    started = false;
    await nativeMessageListener?.remove?.();
    nativeMessageListener = null;
    await nativePairedListener?.remove?.();
    nativePairedListener = null;
    await native.stop().catch(() => {});
  }

  function parsePairing(value) {
    const url = new URL(String(value || "").trim());
    if (url.protocol !== "moriya-sync:" || url.hostname !== "pair") throw new Error("守谷サイネージのQRコードではありません。");
    const code = url.searchParams.get("code") || "";
    if (!/^\d{4}$/.test(code)) throw new Error("古い形式のQRです。両端末を1.0のAPKに更新し、QRを再表示してください。");
    return { host: url.searchParams.get("host") || "", port: Number(url.searchParams.get("port")), code, secret: url.searchParams.get("secret") || "", fingerprint: url.searchParams.get("fingerprint") || "" };
  }

  async function pair(host, port, code, qrAuth = {}) {
    message("ペアリング中です…");
    const result = await native.pair({ host, port: Number(port), code: String(code).trim(), secret: qrAuth.secret || "", fingerprint: qrAuth.fingerprint || "" });
    if (!peers.some((item) => item.id === result.peer.id)) peers.push(result.peer);
    renderPeers();
    qrPanel.hidden = true;
    message(`${result.peer.name} とペアリングしました。`);
    await pullAndReconcile();
    await publish("schedules", result.peer.id);
  }

  function stopScan() {
    window.clearTimeout(scanTimer);
    scanTimer = 0;
    cameraStream?.getTracks().forEach((track) => track.stop());
    cameraStream = null;
    video.srcObject = null;
    scannerPanel.hidden = true;
  }

  async function scanQr() {
    if (!navigator.mediaDevices?.getUserMedia) {
      message("この端末ではカメラ読み取りを利用できません。機器検索とコード入力を使ってください。");
      return;
    }
    try {
      if (typeof window.jsQR !== "function") {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "./assets/vendor/jsQR.js";
          script.onload = resolve;
          script.onerror = reject;
          document.head.append(script);
        });
      }
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      video.srcObject = cameraStream;
      scannerPanel.hidden = false;
      await video.play();
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { willReadFrequently: true });
      const scan = async () => {
        if (!cameraStream) return;
        if (video.videoWidth > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0);
          const image = context.getImageData(0, 0, canvas.width, canvas.height);
          const found = window.jsQR(image.data, canvas.width, canvas.height, { inversionAttempts: "dontInvert" });
          if (found) {
            try {
              const pairing = parsePairing(found.data);
              stopScan();
              hostField.value = pairing.host;
              portField.value = pairing.port;
              codeField.value = pairing.code;
              await pair(pairing.host, pairing.port, pairing.code, pairing);
            } catch (error) { message(error?.message || "QRコードを読み取れませんでした。"); }
            return;
          }
        }
        scanTimer = window.setTimeout(scan, 180);
      };
      scan();
    } catch { stopScan(); message("カメラを利用できません。権限を確認するか、機器検索を使ってください。"); }
  }

  $("#lanSyncShowQr").addEventListener("click", async () => {
    try {
      const result = await native.createPairing();
      const qrImage = $("#lanSyncQrImage");
      qrImage.hidden = !result.qr;
      if (result.qr) qrImage.src = result.qr;
      else qrImage.removeAttribute("src");
      $("#lanSyncQrCode").textContent = result.code;
      $("#lanSyncQrAddress").textContent = result.host ? `この端末の接続先: ${result.host}:${result.port}` : `この端末のポート: ${result.port}`;
      $("#lanSyncQrWarning").textContent = result.warning || "";
      qrPanel.hidden = false;
      message(result.warning || "1台目にコードを表示しました。2台目でQRを読み取るか、このコードを入力してください。");
    } catch (error) { message(error?.message || "QRを作成できませんでした。"); }
  });
  $("#lanSyncScanQr").addEventListener("click", scanQr);
  $("#lanSyncStopScan").addEventListener("click", stopScan);
  $("#lanSyncDiscover").addEventListener("click", async () => {
    message("同じWi-Fiの機器を探しています…");
    discovered.replaceChildren();
    try {
      const result = await native.discover();
      const devices = (result?.devices || []).filter((item) => item.host && item.port);
      if (!devices.length) { message("機器が見つかりません。両端末でアプリを開き、同じWi-Fiか確認してください。検索できなくても、1台目のIP・ポート・コードを入力して接続できます。"); return; }
      for (const item of devices) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = `${item.name}（${item.host}）を選ぶ`;
        button.addEventListener("click", () => {
          hostField.value = item.host; portField.value = item.port;
          codeField.focus();
          message("1台目で「この端末のQR・コードを表示」を押し、そこに表示されたコードをここへ入力してください。");
        });
        discovered.append(button);
      }
      message(`${devices.length}台見つかりました。接続先を選んでください。`);
    } catch (error) { message(error?.message || "機器を探せませんでした。"); }
  });
  $("#lanSyncPair").addEventListener("click", async () => {
    try { await pair(hostField.value.trim(), portField.value, codeField.value); }
    catch (error) { message(error?.message || "ペアリングできませんでした。"); }
  });
  $("#lanSyncRefresh").addEventListener("click", async () => {
    try { await pullAndReconcile(); await publish(modeField.value === "auto" ? "snapshot" : "schedules"); message("接続と予約操作の同期を確認しました。"); }
    catch (error) { message(error?.message || "相手の端末に接続できませんでした。"); }
  });

  document.addEventListener("moriya-settings-saved", () => {
    if (suppressLocal) return;
    const current = JSON.stringify(config());
    if (current === previousConfig) return;
    previousConfig = current;
    revision = { counter: revision.counter + 1, id: deviceId };
    saveRevision();
    if (modeField.value === "auto") void publish("settings").catch(() => { dirty = true; message("相手に届いていません。次に接続したとき再試行します。"); });
  });
  modeField.addEventListener("change", () => {
    localStorage.setItem(modeKey, modeField.value);
    pendingConflict = null;
    renderPeers();
    message(modeField.value === "off" ? "設定の同期を停止しました。予約操作の共有は続けます。" : modeField.value === "auto" ? "変更時の自動同期を有効にしました。" : "同期方向を端末ごとに手動で選べます。");
    if (modeField.value === "auto") void pullAndReconcile().then(() => publish("snapshot")).catch(() => { dirty = true; });
  });
  document.addEventListener("moriya-smart-schedules-change", (event) => {
    if (!["create", "cancel", "complete"].includes(event.detail?.kind)) return;
    void publish("schedules").catch(() => { dirty = true; });
  });
  document.addEventListener("moriya-settings-visibility", () => {
    if (document.querySelector("#settingsDialog")?.hidden) stopScan();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { void stop(); return; }
    void start();
  });
  window.MoriyaLanSync = { deviceId, cancelRemote };
  void start();
})();
