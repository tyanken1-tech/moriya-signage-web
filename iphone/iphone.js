(() => {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const timetable = window.TX_MORIYA_AKIHABARA_TIMETABLE;
  const arrivals = window.MORIYA_TRAIN_STOPS;
  const garbage = window.MORIYA_GARBAGE_CALENDAR;
  const storageKey = "moriya-iphone-display-v1";
  const theme = window.MORIYA_DISPLAY_THEME;
  const defaults = { offset: 10, red: 15, orange: 19, blur: 23, opacity: 87, dayPhoto: "sunny-komorebi-color.webp", nightPhoto: "night-clear-milkyway.webp", autoDayNight: true, dayStart: "06:00", nightStart: "18:00" };
  const photos = theme.groups.flatMap(([, , items]) => items);
  const legacyPhotos = { sunny: "sunny-komorebi-color.webp", forest: "sunny-komorebi-5.webp", rain: "rain-window-3.webp", night: "night-clear-milkyway.webp", cloud: "cloudy-forest-1.webp", dusk: "sunny-komorebi-2.webp", custom: "custom" };
  const holidayKeys = new Set([
    "2026-01-01", "2026-01-12", "2026-02-11", "2026-02-23", "2026-03-20", "2026-04-29", "2026-05-03", "2026-05-04", "2026-05-05", "2026-05-06", "2026-07-20", "2026-08-11", "2026-09-21", "2026-09-22", "2026-09-23", "2026-10-12", "2026-11-03", "2026-11-23",
    "2027-01-01", "2027-01-11", "2027-02-11", "2027-02-23", "2027-03-21", "2027-03-22", "2027-04-29", "2027-05-03", "2027-05-04", "2027-05-05", "2027-07-19", "2027-08-11", "2027-09-20", "2027-09-23", "2027-10-11", "2027-11-03", "2027-11-23",
    "2028-01-01", "2028-01-10", "2028-02-11", "2028-02-23", "2028-03-20", "2028-04-29", "2028-05-03", "2028-05-04", "2028-05-05", "2028-07-17", "2028-08-11", "2028-09-18", "2028-09-22", "2028-10-09", "2028-11-03", "2028-11-23",
  ]);
  const params = new URLSearchParams(location.search);
  const debugStart = params.has("qaTime") ? new Date(params.get("qaTime")) : null;
  const debugAt = debugStart && !Number.isNaN(debugStart.getTime()) ? [debugStart.getTime(), Date.now()] : null;
  const clockParts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const weekdayJa = new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", weekday: "short" });
  const serviceNames = { local: "普通", semiRapid: "区快", rapid: "快速" };
  let settings = loadSettings();
  let photoPeriod = "day";
  let activeBackground = "";
  const closeTimers = new Map();
  let lastMinute = "";
  let viewportFrame = 0;

  // Safari standalone can retain a stale 100dvh after returning from the app switcher.
  // Measure the visible area only on viewport changes, not in the clock loop.
  function fitViewport() {
    cancelAnimationFrame(viewportFrame);
    viewportFrame = requestAnimationFrame(() => {
      const standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
      const editing = document.activeElement?.matches("input:not([type=range]):not([type=checkbox]), textarea");
      const viewport = window.MORIYA_MOBILE_VIEWPORT({
        innerHeight: window.innerHeight, clientHeight: document.documentElement.clientHeight,
        visualHeight: window.visualViewport?.height, screenHeight: window.screen.height,
        standalone, keyboard: editing && window.visualViewport?.height < window.innerHeight * .8,
      });
      if (viewport.content > 0) document.documentElement.style.setProperty("--app-height", `${Math.round(viewport.content)}px`);
      if (viewport.surface > 0) document.documentElement.style.setProperty("--surface-height", `${Math.round(viewport.surface)}px`);
    });
  }
  fitViewport();
  window.addEventListener("resize", fitViewport, { passive: true });
  window.addEventListener("pageshow", fitViewport);
  window.visualViewport?.addEventListener("resize", fitViewport, { passive: true });
  window.addEventListener("orientationchange", fitViewport, { passive: true });

  function now() { return debugAt ? new Date(debugAt[0] + Date.now() - debugAt[1]) : new Date(); }
  function parts(date) { return Object.fromEntries(clockParts.formatToParts(date).map((part) => [part.type, part.value])); }
  function dateKey(part) { return `${part.year}-${part.month}-${part.day}`; }
  function currentDayType(date, part) { return part.weekday === "Sat" || part.weekday === "Sun" || holidayKeys.has(dateKey(part)) ? "weekend" : "weekday"; }
  function loadSettings() {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || "{}");
      const loaded = { ...defaults, ...stored };
      if (!stored.dayPhoto && stored.photo) loaded.dayPhoto = legacyPhotos[stored.photo] || defaults.dayPhoto;
      loaded.blur = Math.min(64, Math.max(0, Number(loaded.blur) || 0));
      loaded.opacity = Math.min(100, Math.max(80, Number(loaded.opacity) || 87));
      for (const key of ["dayStart", "nightStart"]) if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(loaded[key])) loaded[key] = defaults[key];
      for (const key of ["dayPhoto", "nightPhoto"]) if (loaded[key] !== "custom" && !photos.some(([id]) => id === loaded[key])) loaded[key] = defaults[key];
      return loaded;
    }
    catch { return { ...defaults }; }
  }
  function saveSettings() { try { localStorage.setItem(storageKey, JSON.stringify(settings)); } catch { /* Private browsing may disable storage. */ } }
  function safe(value) { return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]); }
  function shortGarbage(value) { return String(value).replace("プラスチック製容器包装", "プラ容器").replace("不燃ごみ（プラスチック類）", "不燃（プラ類）").replace("不燃ごみ（金属類・割れ物）", "不燃（金属・割れ物）"); }
  function dateLabel(key) {
    const [year, month, day] = key.split("-").map(Number);
    const week = "日月火水木金土"[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
    return `${month}/${day}(${week})`;
  }
  function upcomingGarbage(limit) {
    const current = now(); const part = parts(current); const key = dateKey(part);
    return Object.entries(garbage?.entries || {}).filter(([day]) => day > key || (day === key && Number(part.hour) < 12)).sort(([a], [b]) => a.localeCompare(b)).slice(0, limit);
  }
  function renderTrains(date, part) {
    const dayType = currentDayType(date, part);
    const nowMinutes = Number(part.hour) * 60 + Number(part.minute);
    const list = (timetable?.[dayType] || []).filter((train) => train.hour * 60 + train.minute >= nowMinutes + Number(settings.offset)).slice(0, 24);
    $("#dayKind").textContent = dayType === "weekday" ? "平日" : "土休日";
    $("#alertCaption").textContent = `${settings.red}分以内は赤表示`;
    $("#trainList").innerHTML = list.length ? list.map((train) => {
      const wait = train.hour * 60 + train.minute - nowMinutes;
      const alert = wait <= settings.red ? "alert-red" : wait <= settings.orange ? "alert-orange" : "";
      const note = [train.startsHere ? "当駅始発" : "", train.destination !== "秋葉原" ? `${train.destination}行` : ""].filter(Boolean).join(" · ");
      return `<li><button class="train-row ${safe(train.kind)} ${alert}" type="button" data-train-time="${safe(train.time)}" aria-label="${safe(train.time)}発 ${safe(serviceNames[train.kind] || train.kind)}の停車駅を見る"><span class="service-bar" aria-hidden="true"></span><span class="service"><strong>${safe(serviceNames[train.kind] || train.kind)}</strong>${note ? `<small>${safe(note)}</small>` : ""}</span><time class="departure">${safe(train.time)}</time><span class="wait"><strong>${wait}</strong>分後</span></button></li>`;
    }).join("") : `<li class="empty">${timetable ? "本日の運転は終了しました" : "時刻表を読み込めませんでした"}</li>`;
  }
  function renderGarbagePreview() {
    const items = upcomingGarbage(2);
    $("#garbagePreviewList").innerHTML = items.length ? items.map(([key, types]) => `<span class="garbage-line"><time>${safe(dateLabel(key))}</time><span>${safe(types.map(shortGarbage).join(" ・ "))}</span></span>`).join("") : `<span>収集予定を確認できません</span>`;
  }
  function tick(force = false) {
    const date = now(); const part = parts(date); const minute = `${dateKey(part)} ${part.hour}:${part.minute}`;
    if (force || lastMinute !== minute) { lastMinute = minute; renderTrains(date, part); renderGarbagePreview(); applyBackground(part); $("#currentDate").textContent = `${Number(part.month)}/${Number(part.day)} ${weekdayJa.format(date)}`; }
  }
  function openOverlay({ eyebrow, title, subtitle, content, note }) {
    clearTimeout(closeTimers.get("#overlay"));
    $("#detailEyebrow").textContent = eyebrow;
    $("#detailTitle").textContent = title;
    $("#detailSubtitle").textContent = subtitle || "";
    $("#detailContent").innerHTML = content;
    $("#detailNote").textContent = note || "";
    $("#overlay").hidden = false;
    requestAnimationFrame(() => $("#overlay").classList.add("is-open"));
    $("#detailClose").focus();
  }
  function closeOverlay(selector) {
    const overlay = $(selector);
    if (overlay.hidden) return;
    overlay.classList.remove("is-open");
    clearTimeout(closeTimers.get(selector));
    closeTimers.set(selector, setTimeout(() => { overlay.hidden = true; }, 390));
  }
  function openTrain(time) {
    const date = now(); const dayType = currentDayType(date, parts(date));
    const train = (timetable?.[dayType] || []).find((item) => item.time === time);
    if (!train) return;
    const record = arrivals?.[dayType]?.[time];
    $("#trainDetailTitle").innerHTML = `<time>${safe(time)}</time><span class="train-detail-unit">発</span><span class="train-detail-service">${safe(serviceNames[train.kind] || train.kind)}</span>`;
    const departureMinutes = Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
    const rows = [["守谷", time, "発", 0], ...(record?.stops || []).map(([station, stopTime, kind]) => {
      let minutes = Number(stopTime.slice(0, 2)) * 60 + Number(stopTime.slice(3)) - departureMinutes;
      if (minutes < 0) minutes += 1440;
      return [station, stopTime, kind, minutes];
    })];
    $("#trainDetailList").innerHTML = record?.stops?.length ? rows.map(([station, stopTime, kind, minutes]) => `<li class="${["北千住", "秋葉原"].includes(station) ? "is-key-station" : ""}"><span>${safe(station)}</span><time>${safe(stopTime)}</time><small>${minutes ? `${minutes}分 · ` : ""}${safe(kind)}</small></li>`).join("") : `<li>公式の停車時刻を確認中です</li>`;
    $("#trainDetailList").scrollTop = 0;
    $(".train-panel").classList.add("is-detail");
  }
  function closeTrain() { $(".train-panel").classList.remove("is-detail"); }
  function openGarbage() {
    const items = upcomingGarbage(28);
    openOverlay({ eyebrow: "CLEAN CALENDAR", title: "ごみ収集予定", subtitle: "守谷市の今後の収集", content: `<ol class="garbage-full-list">${items.map(([key, types]) => `<li><time>${safe(dateLabel(key))}</time><span>${safe(types.map(shortGarbage).join(" ・ "))}</span></li>`).join("") || `<li>今後の収集予定を確認できません</li>`}</ol>`, note: `${garbage?.fiscalYear || ""}年度版の守谷市クリーンカレンダーに基づきます。` });
  }
  function applyBackground(part) {
    const minute = Number(part.hour) * 60 + Number(part.minute);
    const isDay = theme.isDayTime(minute, settings.dayStart, settings.nightStart);
    const period = settings.autoDayNight && !isDay ? "night" : "day";
    const photo = settings[`${period}Photo`];
    const custom = photo === "custom" ? localStorage.getItem(`${storageKey}-photo-${period}`) || localStorage.getItem(`${storageKey}-photo`) : "";
    const file = (photo === "custom" ? defaults[`${period}Photo`] : photo).replace(/\.webp$/, "-rich.webp");
    const url = custom || new URL(`../assets/backgrounds/${file}`, location.href).href;
    if (url !== activeBackground) { activeBackground = url; document.documentElement.style.setProperty("--scene-image", `url("${url}")`); }
  }
  function renderPhotoChoices() {
    $("#backgroundChoices").innerHTML = theme.groups.map(([, label, items], index) => `<details ${index === 0 ? "open" : ""}><summary>${safe(label)}</summary><div class="photo-grid">${items.map(([id, title]) => `<button class="background-choice" type="button" data-photo="${safe(id)}" aria-label="${safe(title)}" aria-pressed="false"><img src="../assets/backgrounds/${safe(id.replace(/\.webp$/, "-rich.webp"))}" alt="" loading="lazy"><span>${safe(title)}</span></button>`).join("")}</div></details>`).join("");
  }
  function updatePhotoSelection() {
    const selected = settings[`${photoPeriod}Photo`];
    document.querySelectorAll("[data-photo]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.photo === selected)));
    document.querySelectorAll("[data-photo-period]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.photoPeriod === photoPeriod)));
    $("#selectedPhoto").textContent = `${photoPeriod === "day" ? "昼" : "夜"}：${selected === "custom" ? "端末内の写真" : photos.find(([id]) => id === selected)?.[1] || "未選択"}`;
  }
  function applySettings() {
    document.documentElement.style.setProperty("--rich-blur", `${settings.blur}px`);
    theme.applyTransparency(settings.opacity);
    for (const [key, inputId, displayId, unit] of [["offset", "offsetMinutes", "offsetValue", "分"], ["red", "redMinutes", "redValue", "分"], ["orange", "orangeMinutes", "orangeValue", "分"], ["blur", "blurAmount", "blurValue", "px"], ["opacity", "glassOpacity", "opacityValue", "%"]]) {
      $(`#${inputId}`).value = settings[key]; $(`#${displayId}`).textContent = `${settings[key]}${unit}`;
    }
    $("#autoDayNight").checked = settings.autoDayNight;
    $("#dayStart").value = settings.dayStart;
    $("#nightStart").value = settings.nightStart;
    updatePhotoSelection();
    tick(true);
  }
  function setupSettings() {
    $("#settingsOpen").addEventListener("click", () => { clearTimeout(closeTimers.get("#settingsOverlay")); $("#settingsOverlay").hidden = false; requestAnimationFrame(() => $("#settingsOverlay").classList.add("is-open")); });
    $("#settingsClose").addEventListener("click", () => closeOverlay("#settingsOverlay"));
    $("[data-close-settings]").addEventListener("click", () => closeOverlay("#settingsOverlay"));
    for (const [id, key] of [["offsetMinutes", "offset"], ["redMinutes", "red"], ["orangeMinutes", "orange"], ["blurAmount", "blur"], ["glassOpacity", "opacity"]]) {
      $(`#${id}`).addEventListener("input", (event) => { settings[key] = Number(event.target.value); saveSettings(); applySettings(); });
    }
    $("#backgroundChoices").addEventListener("click", (event) => { const button = event.target.closest("[data-photo]"); if (!button) return; settings[`${photoPeriod}Photo`] = button.dataset.photo; saveSettings(); applySettings(); });
    $(".photo-periods").addEventListener("click", (event) => { const button = event.target.closest("[data-photo-period]"); if (!button) return; photoPeriod = button.dataset.photoPeriod; updatePhotoSelection(); });
    $("#autoDayNight").addEventListener("change", (event) => { settings.autoDayNight = event.target.checked; saveSettings(); applySettings(); });
    for (const key of ["dayStart", "nightStart"]) $(`#${key}`).addEventListener("change", (event) => { if (!event.target.value) return; settings[key] = event.target.value; saveSettings(); applySettings(); });
    $("#customBackground").addEventListener("change", (event) => {
      const file = event.target.files?.[0]; if (!file) return;
      const image = new Image(); const url = URL.createObjectURL(file); const targetPeriod = photoPeriod;
      image.onload = () => {
        const canvas = document.createElement("canvas"); const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
        canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        try { localStorage.setItem(`${storageKey}-photo-${targetPeriod}`, canvas.toDataURL("image/jpeg", .8)); settings[`${targetPeriod}Photo`] = "custom"; saveSettings(); applySettings(); }
        catch { $(".settings-note").textContent = "画像を保存できませんでした。容量の小さい画像を選んでください。"; }
        URL.revokeObjectURL(url);
      };
      image.onerror = () => { URL.revokeObjectURL(url); $(".settings-note").textContent = "画像を開けませんでした。"; };
      image.src = url;
    });
  }
  $("#trainList").addEventListener("click", (event) => { const row = event.target.closest("[data-train-time]"); if (row) openTrain(row.dataset.trainTime); });
  $("#trainBack").addEventListener("click", closeTrain);
  let trainSwipe = null;
  $(".train-panel").addEventListener("touchstart", (event) => { if ($(".train-panel").classList.contains("is-detail")) trainSwipe = [event.touches[0].clientX, event.touches[0].clientY]; }, { passive: true });
  $(".train-panel").addEventListener("touchend", (event) => { if (!trainSwipe) return; const dx = event.changedTouches[0].clientX - trainSwipe[0]; const dy = event.changedTouches[0].clientY - trainSwipe[1]; if (dx > 55 && Math.abs(dx) > Math.abs(dy) * 1.3) closeTrain(); trainSwipe = null; }, { passive: true });
  $("#garbagePreview").addEventListener("click", openGarbage);
  $("#detailClose").addEventListener("click", () => closeOverlay("#overlay"));
  $("[data-close-overlay]").addEventListener("click", () => closeOverlay("#overlay"));
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") { closeOverlay("#overlay"); closeOverlay("#settingsOverlay"); } });
  renderPhotoChoices(); setupSettings(); applySettings(); setInterval(() => tick(), 10_000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { fitViewport(); tick(true); } });
})();
