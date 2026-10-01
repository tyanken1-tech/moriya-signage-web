(() => {
  "use strict";

  const stage = document.querySelector("#localVideoStage");
  const video = stage?.querySelector("#localBackgroundVideo");
  const shell = document.querySelector("#viewportShell");
  if (!stage || !video || !shell) return;

  const DB_NAME = "moriya-signage-media";
  const STORE_NAME = "media";
  const VIDEO_KEY = "background-video";
  let objectUrl = "";
  let metadata = null;
  let requested = false;
  let playable = true;
  let decoderReleaseTimer = 0;

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.addEventListener("upgradeneeded", () => {
        if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
      });
      request.addEventListener("success", () => resolve(request.result));
      request.addEventListener("error", () => reject(request.error));
    });
  }

  async function readRecord() {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).get(VIDEO_KEY);
      request.addEventListener("success", () => resolve(request.result || null));
      request.addEventListener("error", () => reject(request.error));
      transaction.addEventListener("complete", () => database.close());
    });
  }

  async function writeRecord(record) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(record, VIDEO_KEY);
      transaction.addEventListener("complete", () => {
        database.close();
        resolve();
      });
      transaction.addEventListener("error", () => reject(transaction.error));
      transaction.addEventListener("abort", () => reject(transaction.error));
    });
  }

  async function deleteRecord() {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).delete(VIDEO_KEY);
      transaction.addEventListener("complete", () => {
        database.close();
        resolve();
      });
      transaction.addEventListener("error", () => reject(transaction.error));
    });
  }

  function revokeObjectUrl() {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = "";
  }

  function applyRecord(record) {
    window.clearTimeout(decoderReleaseTimer);
    video.pause();
    video.removeAttribute("src");
    video.load();
    revokeObjectUrl();
    metadata = record?.blob ? {
      name: record.name || "選択した動画",
      type: record.type || record.blob.type || "",
      size: Number(record.size || record.blob.size || 0),
      savedAt: Number(record.savedAt || 0),
      playable: true,
    } : null;
    playable = true;
    if (record?.blob) {
      objectUrl = URL.createObjectURL(record.blob);
      video.src = objectUrl;
      video.load();
    }
    syncPlayback();
    document.dispatchEvent(new CustomEvent("moriya-local-video-change", { detail: metadata }));
  }

  function settingsAreOpen() {
    const dialog = document.querySelector("#settingsDialog");
    return Boolean(dialog && !dialog.hidden);
  }

  function canPlayNow() {
    return requested && Boolean(objectUrl) && !document.hidden && !settingsAreOpen();
  }

  async function syncPlayback() {
    const enabled = canPlayNow();
    stage.classList.toggle("is-enabled", enabled);
    shell.classList.toggle("local-video-enabled", enabled);
    if (!enabled) {
      video.pause();
      stage.dataset.running = "false";
      window.clearTimeout(decoderReleaseTimer);
      decoderReleaseTimer = window.setTimeout(() => {
        if (canPlayNow() || !video.getAttribute("src")) return;
        video.removeAttribute("src");
        video.load();
      }, 15000);
      return false;
    }
    if (!video.paused && stage.dataset.running === "true") return true;
    window.clearTimeout(decoderReleaseTimer);
    if (!video.getAttribute("src") && objectUrl) {
      video.src = objectUrl;
      video.load();
    }
    try {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.loop = true;
      await video.play();
      stage.dataset.running = "true";
      return true;
    } catch {
      stage.dataset.running = "false";
      return false;
    }
  }

  async function setFile(file) {
    const looksLikeVideo = String(file?.type || "").startsWith("video/")
      || /\.(mp4|m4v|webm|mov|mkv|avi)$/i.test(String(file?.name || ""));
    if (!(file instanceof Blob) || !looksLikeVideo) {
      throw new Error("動画ファイルを選択してください。");
    }
    const estimate = await navigator.storage?.estimate?.().catch(() => null);
    if (estimate?.quota && estimate?.usage != null && file.size > estimate.quota - estimate.usage) {
      throw new Error("端末の保存領域が不足しています。短い動画か小さい動画を選んでください。");
    }
    const record = {
      blob: file,
      name: file.name || "選択した動画",
      type: file.type,
      size: file.size,
      savedAt: Date.now(),
    };
    await writeRecord(record);
    applyRecord(record);
    return metadata;
  }

  async function clear() {
    requested = false;
    await deleteRecord();
    applyRecord(null);
  }

  function update(options = {}) {
    requested = Boolean(options.enabled);
    void syncPlayback();
    return requested && Boolean(objectUrl);
  }

  document.addEventListener("visibilitychange", () => void syncPlayback());
  document.addEventListener("moriya-settings-visibility", () => void syncPlayback());
  video.addEventListener("ended", () => {
    if (!canPlayNow()) return;
    video.currentTime = 0;
    void video.play();
  });
  video.addEventListener("error", () => {
    playable = false;
    if (metadata) metadata = { ...metadata, playable: false };
    stage.dataset.running = "false";
    stage.classList.remove("is-enabled");
    shell.classList.remove("local-video-enabled");
    document.dispatchEvent(new CustomEvent("moriya-local-video-change", { detail: metadata }));
  });
  window.addEventListener("pagehide", () => {
    window.clearTimeout(decoderReleaseTimer);
    revokeObjectUrl();
  }, { once: true });

  window.MoriyaLocalVideo = {
    setFile,
    clear,
    update,
    refresh: syncPlayback,
    hasVideo: () => Boolean(objectUrl) && playable,
    getMetadata: () => metadata,
    getBackupRecord: readRecord,
    restoreBackupRecord: async (record) => {
      if (record === null) {
        await clear();
      } else {
        if (!(record.blob instanceof Blob)) throw new Error("バックアップ動画を読み取れませんでした。");
        await writeRecord(record);
        applyRecord(record);
      }
    },
  };

  stage.dataset.running = "false";
  readRecord().then(applyRecord).catch(() => {
    metadata = null;
    document.dispatchEvent(new CustomEvent("moriya-local-video-change", { detail: null }));
  });
})();
