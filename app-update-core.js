(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MoriyaUpdateCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  function parseVersion(value) {
    const match = /^(\d+)\.(\d+)(?:\.(\d+))?$/.exec(String(value));
    if (!match) throw new Error("バージョン番号の形式が不正です。");
    const parts = match.slice(1).map((part) => Number(part || 0));
    if (parts.some((part) => !Number.isSafeInteger(part))) throw new Error("バージョン番号が大きすぎます。");
    return parts;
  }
  function compareVersion(left, right) {
    const a = parseVersion(left), b = parseVersion(right);
    for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1;
    return 0;
  }
  function httpsUrl(value) {
    const url = new URL(String(value));
    if (url.protocol !== "https:" || url.username || url.password || !url.hostname) throw new Error("更新先にはHTTPSのURLが必要です。");
    return url.href;
  }
  function validateManifest(value) {
    if (!value || value.schemaVersion !== 1) throw new Error("更新情報の形式が不正です。");
    parseVersion(value.version);
    if (!Number.isSafeInteger(value.versionCode) || value.versionCode < 1) throw new Error("更新情報の内部番号が不正です。");
    return { ...value, releasePageUrl: httpsUrl(value.releasePageUrl) };
  }
  function isNewer(manifest, installed) {
    // Android uses the monotonic internal code, never a lexicographic version comparison.
    if (Number.isSafeInteger(installed.versionCode)) return manifest.versionCode > installed.versionCode;
    return compareVersion(manifest.version, installed.version) > 0;
  }
  return { parseVersion, compareVersion, httpsUrl, validateManifest, isNewer };
});
