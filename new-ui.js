(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const nodes = {
    signage: $("#newSignage"),
    classicSignage: $(".classic-signage"),
    pages: [...document.querySelectorAll(".new-page")],
    settingsButton: $("#newSettingsButton"),
    startupVeil: $("#startupVeil"),
    startupTime: $("#startupTime"),
    weatherIcon: $("#newWeatherIcon"),
    weatherLocation: $("#newWeatherLocation"),
    weatherSummary: $("#newWeatherSummary"),
    temperature: $("#newTemperature"),
    dailyMax: $("#newDailyMax"),
    dailyMin: $("#newDailyMin"),
    rain: $("#newPrecipProbability"),
    forecastPreview: $("#newForecastPreview"),
    marketWidget: $("#newMarketWidget"),
    marketItems: $("#newMarketItems"),
    remoWidget: $("#newRemoWidget"),
    remoTemperature: $("#newRemoTemperature"),
    remoUpdated: $("#newRemoUpdated"),
    remoActions: $("#newRemoActions"),
    hybridMarket: $("#newHybridMarket"),
    garbageWidget: $("#newGarbageWidget"),
    garbagePreview: $("#newGarbagePreview"),
    garbageSheet: $("#newGarbageScheduleSheet"),
    garbageClose: $("#newGarbageClose"),
    garbageScheduleList: $("#newGarbageScheduleList"),
    garbageCoverage: $("#newGarbageCoverage"),
    sheetDismiss: $("#newSheetDismissLayer"),
    remoExpand: $("#newRemoExpand"),
    smartSheet: $("#newSmartSheet"),
    smartList: $("#newSmartSheetList"),
    smartScheduleList: $("#newSmartScheduleList"),
    smartReservations: $("#newSmartReservations"),
    smartReservationsBack: $("#newSmartReservationsBack"),
    smartReservationsRefresh: $("#newSmartReservationsRefresh"),
    smartReservationsStatus: $("#newSmartReservationsStatus"),
    smartReservationsRows: $("#newSmartReservationsRows"),
    smartSort: $("#newSmartSort"),
    smartAdd: $("#newSmartAdd"),
    smartClose: $("#newSmartClose"),
    smartEditor: $("#newSmartEditor"),
    smartEditorTitle: $("#newSmartEditorTitle"),
    smartLabel: $("#newSmartLabel"),
    smartAction: $("#newSmartAction"),
    smartIcon: $("#newSmartIcon"),
    smartBadge: $("#newSmartBadge"),
    smartCancel: $("#newSmartCancel"),
    smartSave: $("#newSmartSave"),
    smartEditorStatus: $("#newSmartEditorStatus"),
    timerDismiss: $("#newTimerDismissLayer"),
    timerSheet: $("#newTimerSheet"),
    timerTitle: $("#newTimerTitle"),
    timerPresets: $("#newTimerPresets"),
    timerCustomMinutes: $("#newTimerCustomMinutes"),
    timerCustomSet: $("#newTimerCustomSet"),
    timerPending: $("#newTimerPending"),
    timerClose: $("#newTimerClose"),
    smartToast: $("#newSmartToast"),
    homeSmartError: $("#newHomeSmartError"),
    detailIcon: $("#newWeatherDetailIcon"),
    detailLocation: $("#newWeatherDetailLocation"),
    detailSummary: $("#newWeatherDetailSummary"),
    detailTemp: $("#newWeatherDetailTemp"),
    detailDaily: $("#newWeatherDetailDaily"),
    detailRain: $("#newWeatherDetailRain"),
    updated: $("#newWeatherUpdated"),
    hourly: $("#newHourlyForecast"),
    daily: $("#newDailyForecast"),
    trains: $("#newTrains"),
    trainBoard: $(".new-train-board"),
    trainDetailTitle: $("#newTrainDetailTitle"),
    trainDetailStops: $("#newTrainDetailStops"),
    trainDetailClose: $("#newTrainDetailClose"),
    trainDayType: $("#newTrainDayType"),
    todayEvents: $("#newTodayEvents"),
    tomorrowEvents: $("#newTomorrowEvents"),
    eventCalendarColumn: $("#newEventCalendarColumn"),
    monthCalendar: $("#newMonthCalendar"),
    homeAgenda: $("#newHomeAgenda"),
    homeAgendaList: $("#newHomeAgendaList"),
    commuteAgenda: $("#newCommuteAgenda"),
    commuteAgendaText: $("#newCommuteAgendaText"),
    pinButtons: [...document.querySelectorAll("[data-pin-view]")],
    clockHour: $("#newClockHour"),
    clockMinute: $("#newClockMinute"),
    seconds: $("#newSeconds"),
    date: $("#newDate"),
    weekday: $("#newWeekday"),
    commuteTime: $("#newCommuteTime"),
    commuteDate: $("#newCommuteDate"),
    weatherTime: $("#newWeatherTime"),
    weatherDate: $("#newWeatherDate"),
    commuteSeconds: $("#newCommuteSeconds"),
    weatherSeconds: $("#newWeatherSeconds"),
    motionGlassLayer: $("#newMotionGlassLayer"),
  };

  if (!nodes.signage) return;

  const preview = new URLSearchParams(location.search);
  const qaWeather = preview.get("qaWeather");
  const qaTrain = preview.get("qaTrain") === "alerts";
  const qaLongEvent = preview.get("longEvent") === "1";
  const qaCalendar = preview.get("qaCalendar") === "events";
  const qaInfo = preview.get("qaInfo") === "1";
  const inactivityDelay = Math.max(500, Number(preview.get("qaIdleMs")) || 60000);
  let activePage = "home";
  let latestWeather = null;
  let pageTransitionTimer = 0;
  let inactivityTimer = 0;
  let isTransitioning = false;
  let isPinned = false;
  let suppressClickUntil = 0;
  let dragState = null;
  let dragRenderRaf = 0;
  let motionGlassReleaseRaf = 0;
  let motionGlassImageToken = 0;
  const motionGlassImageCache = new Map();
  let liveGlassGeometry = [];
  const liveGlassProxies = new Map();
  let calendarTransitionTimer = 0;
  let backgroundRotationTimer = 0;
  let backgroundRotationContext = "";
  let backgroundRotationIndex = 0;
  let backgroundRotationItemCount = 1;
  let latestMarketPayload = null;
  let garbageSheetOpen = false;
  let smartSheetOpen = false;
  let smartSortMode = false;
  let smartEditIndex = -1;
  let smartEditorChoices = [];
  let timerTarget = null;
  let timerCloseTimer = 0;
  let smartToastTimer = 0;
  let homeSmartErrorTimer = 0;
  let timerDrag = null;
  let longPress = null;
  let suppressActionClickUntil = 0;
  let outsideDismissUntil = 0;
  let smartTileDrag = null;
  let trainScrollResetTimer = 0;
  let lastBackgroundWeatherCode = 3;
  let lastVideoScheduleMinute = "";
  let lastGarbageDateKey = `${tokyoDateKey(now())}:${Number(tokyoParts(now()).hour) >= 12 ? "pm" : "am"}`;
  const initialCalendarParts = tokyoParts(now());
  let calendarViewYear = Math.max(2026, Math.min(2028, Number(initialCalendarParts.year)));
  let calendarViewMonth = Number(initialCalendarParts.year) < 2026
    ? 1
    : Number(initialCalendarParts.year) > 2028
      ? 12
      : Number(initialCalendarParts.month);
  const PAGE_SIDE = { commute: -1, home: 0, weather: 1 };
  const TRANSITION_CLASSES = [
    "enter-from-right", "enter-from-left", "exit-to-left", "exit-to-right",
    "light-fade-out", "light-fade-in", "light-fade-entering",
  ];

  function animationMode() {
    return settings.display.animationMode || (settings.display.reduceMotion ? "off" : "light");
  }

  function windowOnlyBlurEnabled() {
    return Boolean(settings.display.windowOnlyBlur);
  }

  function shortGarbageLabel(value) {
    return String(value || "")
      .replace("プラスチック製容器包装", "プラ容器")
      .replace("不燃ごみ（プラスチック類）", "不燃（プラ類）")
      .replace("不燃ごみ（金属類・割れ物）", "不燃（金属・割れ物）");
  }

  function upcomingGarbageEntries(limit = 20) {
    const current = now();
    const todayKey = tokyoDateKey(current);
    const currentHour = Number(tokyoParts(current).hour);
    return Object.entries(window.MORIYA_GARBAGE_CALENDAR?.entries || {})
      .filter(([dateKey]) => dateKey > todayKey || (dateKey === todayKey && currentHour < 12))
      .sort(([left], [right]) => left.localeCompare(right))
      .slice(0, limit)
      .map(([dateKey, items]) => ({ dateKey, items }));
  }

  function scheduleIsHidden() {
    return Boolean(settings.display.hideSchedule);
  }

  function safe(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
    })[char]);
  }

  function weatherIconName(code, isNight = false) {
    if (code === 0) return isNight ? "clear_night" : "sunny";
    if (code === 1 || code === 2) return isNight ? "partly_cloudy_night" : "partly_cloudy_day";
    if (code === 3) return "cloud";
    if (code === 45 || code === 48) return "foggy";
    if (code >= 71 && code <= 77) return "weather_snowy";
    if (code >= 95) return "thunderstorm";
    if ((code >= 51 && code <= 69) || (code >= 80 && code <= 82)) return "rainy";
    return "cloud";
  }

  function qaWeatherCode(value) {
    return ({ sunny: 0, cloudy: 3, rain: 61, storm: 95, night: 0 })[value] ?? null;
  }

  function isNightNow() {
    if (qaWeather === "night") return true;
    const forcedHour = Number(preview.get("qaHour"));
    const hour = Number.isFinite(forcedHour) && preview.has("qaHour") ? forcedHour : Number(tokyoParts(now()).hour);
    return hour >= 17 || hour < 5;
  }

  function setPhotoBackground(container, backgroundValue, layerClass = "signage-background") {
    if (!container) return;
    const layers = [...container.children].filter((child) => child.classList.contains(layerClass));
    if (layers.length < 2) return;
    const currentIndex = Number(container.dataset.backgroundLayer || 0);
    const current = layers[currentIndex];
    if (container.dataset.backgroundValue === backgroundValue) return;
    if (!container.dataset.backgroundReady || animationMode() === "off") {
      current.style.backgroundImage = backgroundValue;
      current.classList.add("is-active");
      layers[1 - currentIndex].classList.remove("is-active");
      container.dataset.backgroundReady = "true";
      container.dataset.backgroundValue = backgroundValue;
      return;
    }
    const nextIndex = 1 - currentIndex;
    const next = layers[nextIndex];
    next.style.backgroundImage = backgroundValue;
    next.classList.add("is-active");
    current.classList.remove("is-active");
    container.dataset.backgroundLayer = String(nextIndex);
    container.dataset.backgroundValue = backgroundValue;
  }

  function setMotionGlassBackground(shell, backgroundValue, customSource = "") {
    if (!shell) return;
    const requestToken = ++motionGlassImageToken;
    shell.style.setProperty("--motion-glass-bg", backgroundValue);
    if (!customSource) return;

    const blur = Math.max(0, Math.min(20, Math.round((Number(settings.display.richBlur) || 0) * 0.31)));
    const cacheKey = `${customSource.length}:${customSource.slice(-48)}:${blur}`;
    const cached = motionGlassImageCache.get(cacheKey);
    if (cached) {
      shell.style.setProperty("--motion-glass-bg", cached);
      return;
    }

    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      if (requestToken !== motionGlassImageToken) return;
      const canvas = document.createElement("canvas");
      canvas.width = 384;
      canvas.height = 240;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) return;
      const margin = blur * 2;
      const scale = Math.max((canvas.width + margin * 2) / image.naturalWidth, (canvas.height + margin * 2) / image.naturalHeight);
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      context.filter = blur ? `blur(${blur}px) saturate(1.06)` : "none";
      context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
      context.filter = "none";
      const value = `url("${canvas.toDataURL("image/jpeg", 0.68)}")`;
      motionGlassImageCache.set(cacheKey, value);
      while (motionGlassImageCache.size > 6) motionGlassImageCache.delete(motionGlassImageCache.keys().next().value);
      if (requestToken === motionGlassImageToken) shell.style.setProperty("--motion-glass-bg", value);
    };
    image.src = customSource;
  }

  function normalizeBackgroundList(value, fallback) {
    const values = Array.isArray(value) ? value : (typeof value === "string" && value ? [value] : []);
    const unique = [...new Set(values.filter((item) => typeof item === "string" && item))];
    return unique.length ? unique : [...fallback];
  }

  function slideshowIntervalMs() {
    const qaInterval = Number(preview.get("qaBackgroundMs"));
    if (Number.isFinite(qaInterval) && qaInterval >= 500) return qaInterval;
    const seconds = Math.max(30, Math.min(600, Number(settings.backgroundSlideshowSeconds) || 120));
    return seconds * 1000;
  }

  function settingsAreOpen() {
    const dialog = document.querySelector("#settingsDialog");
    return Boolean(dialog && !dialog.hidden);
  }

  function localVideoIsQuietNow(date) {
    const schedule = settings.videoQuietHours || {};
    const dayKey = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tokyo", weekday: "short" })
      .format(date).toLowerCase();
    const parts = tokyoParts(date);
    const currentMinutes = Number(parts.hour) * 60 + Number(parts.minute);
    const toMinutes = (value) => {
      const match = /^(\d{2}):(\d{2})$/.exec(String(value || ""));
      return match ? Number(match[1]) * 60 + Number(match[2]) : NaN;
    };
    return (Array.isArray(schedule[dayKey]) ? schedule[dayKey] : []).some((range) => {
      const start = toMinutes(range?.start);
      const end = toMinutes(range?.end);
      if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
      if (start === end) return true;
      return start < end
        ? currentMinutes >= start && currentMinutes < end
        : currentMinutes >= start || currentMinutes < end;
    });
  }

  function scheduleBackgroundRotation(itemCount) {
    window.clearInterval(backgroundRotationTimer);
    backgroundRotationTimer = 0;
    if (itemCount < 2 || document.hidden || settingsAreOpen()) return;
    backgroundRotationTimer = window.setInterval(() => {
      if (document.hidden || settingsAreOpen()) return;
      applyNewBackground(lastBackgroundWeatherCode, { advance: true });
    }, slideshowIntervalMs());
  }

  function applyNewBackground(code, options = {}) {
    lastBackgroundWeatherCode = Number(code ?? 3);
    const night = isNightNow();
    const rainy = (code >= 51 && code <= 69) || (code >= 80 && code <= 82) || code >= 95;
    const sunny = code === 0 || code === 1;
    const themes = settings.backgroundThemes || {};
    const themeKey = night
      ? (rainy ? "nightRain" : sunny ? "nightClear" : "nightCloudy")
      : (rainy ? "rain" : sunny ? "sunny" : "cloudy");
    const fallbacks = {
      sunny: ["sunny-komorebi-color.webp"], cloudy: ["cloudy-forest-1.webp"], rain: ["rain-window-2.webp"],
      nightClear: ["night-clear-milkyway.webp"], nightCloudy: ["night-cloudy-1.webp"], nightRain: ["night-rain-1.webp"],
    };
    const localVideoRequested = Boolean(settings.display.localVideoBeta);
    const localVideoPaused = localVideoRequested && localVideoIsQuietNow(now());
    const localVideoEnabled = localVideoRequested
      && !localVideoPaused
      && Boolean(window.MoriyaLocalVideo?.hasVideo?.());
    const shell = document.querySelector("#viewportShell");
    if (shell) shell.dataset.localVideoPaused = String(localVideoPaused);
    if (localVideoEnabled) {
      const contextKey = "local-video";
      if (contextKey !== backgroundRotationContext) {
        backgroundRotationContext = contextKey;
        backgroundRotationIndex = 0;
      }
      backgroundRotationItemCount = 1;
      scheduleBackgroundRotation(1);
      setPhotoBackground(shell, "none", "viewport-background");
      shell?.style.setProperty("--ambient-bg", "linear-gradient(#101719, #020607)");
      const videoFallback = normalizeBackgroundList(themes[themeKey], fallbacks[themeKey])[0];
      setMotionGlassBackground(shell, `url("./assets/backgrounds/${videoFallback}")`);
      window.MoriyaLocalVideo?.update({ enabled: true });
      return;
    }
    window.MoriyaLocalVideo?.update({ enabled: false });
    const customImages = (Array.isArray(settings.backgroundImages) ? settings.backgroundImages : [])
      .filter((item) => typeof item === "string" && item.startsWith("data:image/"))
      .slice(0, 5);
    const isCustom = customImages.length > 0;
    const items = isCustom ? customImages : normalizeBackgroundList(themes[themeKey], fallbacks[themeKey]);
    backgroundRotationItemCount = items.length;
    const itemSignature = isCustom
      ? items.map((item) => `${item.length}:${item.slice(-24)}`).join("|")
      : items.join("|");
    const contextKey = `${isCustom ? "custom" : themeKey}|${itemSignature}|${windowOnlyBlurEnabled()}|${localVideoRequested}|${localVideoPaused}`;
    if (contextKey !== backgroundRotationContext) {
      backgroundRotationContext = contextKey;
      backgroundRotationIndex = 0;
      scheduleBackgroundRotation(items.length);
    } else if (options.advance && items.length > 1) {
      backgroundRotationIndex = (backgroundRotationIndex + 1) % items.length;
    }
    const asset = items[backgroundRotationIndex % items.length];
    const useRichPhoto = windowOnlyBlurEnabled();
    const photoAsset = !isCustom && useRichPhoto ? asset.replace(/\.webp$/i, "-rich.webp") : asset;
    const backgroundValue = isCustom
      ? `url("${photoAsset}")`
      : `url("./assets/backgrounds/${photoAsset}")`;
    setPhotoBackground(shell, backgroundValue, "viewport-background");
    shell?.style.setProperty("--ambient-bg", backgroundValue);
    const motionGlassValue = isCustom
      ? backgroundValue
      : `url("./assets/backgrounds/${asset}")`;
    setMotionGlassBackground(shell, motionGlassValue, isCustom ? photoAsset : "");
  }

  function normalizeWeather(payload) {
    const forcedCode = qaWeatherCode(qaWeather);
    if (forcedCode == null) return payload;
    const copy = { ...payload, code: forcedCode };
    copy.hoursAll = (payload.hoursAll || payload.hours || []).map((item) => ({ ...item, code: forcedCode, rain: forcedCode >= 50 ? 82 : 8 }));
    copy.hours = copy.hoursAll.slice(0, 4);
    copy.daysAll = (payload.daysAll || [payload.today, ...(payload.days || [])].filter(Boolean)).map((item) => ({ ...item, code: forcedCode, rain: forcedCode >= 50 ? 82 : 8 }));
    copy.today = copy.daysAll[0] || payload.today;
    copy.days = copy.daysAll.slice(1, 5);
    return copy;
  }

  function temperatureNumberRect(element) {
    const textNode = element?.firstChild;
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return null;
    const text = textNode.textContent || "";
    const numberLength = text.endsWith("°") ? text.length - 1 : text.length;
    if (numberLength < 1) return null;
    const range = document.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, numberLength);
    const rect = range.getBoundingClientRect();
    range.detach?.();
    return rect;
  }

  function syncDailyTemperatureRule() {
    const container = document.querySelector("#newDailyTemps");
    if (!container || !container.offsetWidth) return;
    const containerRect = container.getBoundingClientRect();
    const scale = containerRect.width / container.offsetWidth || 1;
    const candidates = [temperatureNumberRect(nodes.dailyMax), temperatureNumberRect(nodes.dailyMin)].filter(Boolean);
    if (!candidates.length) return;
    const widest = candidates.reduce((current, candidate) => candidate.width > current.width ? candidate : current);
    container.style.setProperty("--daily-rule-width", `${(widest.width / scale).toFixed(2)}px`);
    container.style.setProperty("--daily-rule-left", `${((widest.left - containerRect.left) / scale).toFixed(2)}px`);
  }

  function renderNewWeather(rawPayload) {
    const payload = normalizeWeather(rawPayload || {});
    latestWeather = payload;
    const code = Number(payload.code ?? 3);
    const summary = (WEATHER_CODES[code] || ["天気"])[0];
    const night = isNightNow();
    const icon = weatherIconName(code, night);
    const hours = payload.hoursAll || payload.hours || [];
    const allDays = payload.daysAll || [payload.today, ...(payload.days || [])].filter(Boolean);
    const today = payload.today || allDays.find((item) => tokyoDateKey(item.date) === tokyoDateKey(now())) || allDays[0] || {};
    const currentTemp = payload.temp ?? "--";
    const dayMax = `${today.max ?? "--"}°`;
    const dayMin = `${today.min ?? "--"}°`;
    const dayTemps = `${today.max ?? "--"}/${today.min ?? "--"}°`;
    const dayRain = `${today.rain ?? "--"}%`;

    nodes.weatherIcon.textContent = icon;
    nodes.weatherLocation.textContent = settings.weather.name;
    nodes.weatherSummary.textContent = summary;
    nodes.temperature.textContent = `${currentTemp}°`;
    nodes.dailyMax.textContent = dayMax;
    nodes.dailyMin.textContent = dayMin;
    requestAnimationFrame(syncDailyTemperatureRule);
    nodes.rain.textContent = dayRain;
    nodes.detailIcon.textContent = icon;
    nodes.detailLocation.textContent = settings.weather.name;
    nodes.detailSummary.textContent = summary;
    nodes.detailTemp.textContent = `${currentTemp}°`;
    nodes.detailDaily.textContent = dayTemps;
    nodes.detailRain.textContent = dayRain;
    nodes.updated.textContent = `${formatTime(now())} 更新`;
    applyNewBackground(code);

    const previewItems = settings.display.forecastMode === "daily"
      ? (payload.days || allDays.slice(1)).slice(0, 3).map((item, index) => ({
          label: index === 0 ? "明日" : new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric", weekday: "short" }).format(item.date).replace("曜", ""),
          code: item.code,
          temp: `${item.max}/${item.min}`,
          rain: item.rain ?? 0,
        }))
      : hours.slice(0, 3).map((item) => ({
          label: formatTime(item.time, { hour: "numeric", minute: undefined }),
          code: item.code,
          temp: `${item.temp}`,
          rain: item.rain ?? 0,
        }));
    renderForecastPreview(previewItems, night);
    renderHourly(hours.slice(0, 8));
    renderDaily(allDays.slice(0, 7));
  }

  function renderForecastPreview(items, night) {
    const fallback = Array.from({ length: 3 }, (_, index) => ({ label: `${index + 1}時間後`, code: 3, temp: "--", rain: "--" }));
    nodes.forecastPreview.innerHTML = (items.length ? items : fallback).map((item) => `
      <div class="new-forecast-card">
        <span class="new-forecast-label">${safe(item.label)}</span>
        <span class="material-symbols-outlined" aria-hidden="true">${weatherIconName(Number(item.code), night)}</span>
        <span class="new-forecast-temp new-number">${safe(item.temp)}</span>
        <span class="new-forecast-rain">${safe(item.rain)}%</span>
      </div>
    `).join("");
  }

  function renderHourly(items) {
    const fallback = Array.from({ length: 8 }, (_, index) => ({ time: new Date(now().getTime() + index * 3600000), code: 3, temp: "--", rain: "--" }));
    nodes.hourly.innerHTML = (items.length ? items : fallback).map((item) => `
      <div class="new-hourly-item">
        <span class="new-hourly-time">${safe(formatTime(item.time, { hour: "numeric", minute: undefined }))}</span>
        <span class="material-symbols-outlined" aria-hidden="true">${weatherIconName(Number(item.code), Number(tokyoParts(item.time).hour) >= 17 || Number(tokyoParts(item.time).hour) < 5)}</span>
        <span class="new-hourly-temp new-number" aria-label="${safe(item.temp)}度">${safe(item.temp)}</span>
        <span class="new-hourly-rain">${safe(item.rain ?? 0)}%</span>
      </div>
    `).join("");
  }

  function renderDaily(items) {
    const fallback = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now().getTime() + index * 86400000);
      return { date, code: 3, max: "--", min: "--", rain: "--" };
    });
    nodes.daily.innerHTML = (items.length ? items : fallback).map((item, index) => `
      <div class="new-daily-item">
        <span class="new-daily-date">${index === 0 ? "今日" : safe(new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric", weekday: "short" }).format(item.date).replace("曜", ""))}</span>
        <span class="material-symbols-outlined" aria-hidden="true">${weatherIconName(Number(item.code), false)}</span>
        <span class="new-daily-temp new-number" aria-label="最高${safe(item.max)}度、最低${safe(item.min)}度">${safe(item.max)}/${safe(item.min)}</span>
        <span class="new-daily-rain">${safe(item.rain ?? 0)}%</span>
      </div>
    `).join("");
  }

  function renderMarket(payload = latestMarketPayload) {
    // Opt-in visual QA data; never saved or used for API/control requests.
    if (qaInfo) payload = { enabled: ['market', 'hybrid'].includes(settings.homeInfoMode), fetchedAt: Date.now(), items: (settings.market?.items || []).map((item, index) => ({ ...item, price: [157.10, 7707.2, 52438.12][index], changePercent: [-0.06, 0.47, 1.23][index], marketTime: Date.now() })) };
    latestMarketPayload = payload || latestMarketPayload;
    if (!nodes.marketWidget || !nodes.marketItems) return;
    const hybrid = settings.homeInfoMode === "hybrid";
    const enabled = (payload?.enabled ?? Boolean(settings.market?.enabled)) && !hybrid;
    nodes.marketWidget.hidden = !enabled;
    renderHybridMarket();
    if (!enabled) return;
    const items = Array.isArray(payload?.items) ? payload.items.slice(0, 3) : settings.market?.items || [];
    nodes.marketItems.querySelectorAll('.new-market-label').forEach((label) => stopNewEventScroll(label, label.querySelector('b')));
    nodes.marketItems.innerHTML = items.map((item) => {
      const price = Number(item.price);
      const change = Number(item.changePercent);
      const hasPrice = item.price !== null && item.price !== undefined && item.price !== '' && Number.isFinite(price);
      const fractionDigits = item.symbol === "JPY=X" ? 2 : price >= 1000 ? 1 : 2;
      const priceLabel = hasPrice
        ? new Intl.NumberFormat("ja-JP", { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }).format(price)
        : "--";
      const changeLabel = Number.isFinite(change) ? `${change >= 0 ? "+" : ""}${change.toFixed(2)}%` : "更新待ち";
      const asOfValue = Number(item.marketTime || item.fetchedAt || payload?.fetchedAt || 0);
      const asOfLabel = asOfValue
        ? `${new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(asOfValue))} 時点`
        : "取得時刻待ち";
      const tone = Number.isFinite(change) ? (change > 0 ? "is-up" : change < 0 ? "is-down" : "is-flat") : "is-flat";
      return `<div class="new-market-item ${tone}"><span class="new-market-label"><b>${safe(item.label || item.symbol)}</b></span><strong class="new-number">${safe(priceLabel)}</strong><small><span>前日比 </span><b class="new-number">${safe(changeLabel)}</b></small><time class="new-market-asof new-number">${safe(asOfLabel)}</time></div>`;
    }).join("");
    nodes.marketWidget.classList.toggle("is-stale", Boolean(payload?.stale));
    updateMarketLabels(nodes.marketItems);
  }

  function renderHybridMarket() {
    if (!nodes.hybridMarket) return;
    const hybrid = settings.homeInfoMode === "hybrid";
    nodes.hybridMarket.hidden = !hybrid;
    if (!hybrid) return;
    nodes.hybridMarket.querySelectorAll('.new-market-label').forEach((label) => stopNewEventScroll(label, label.querySelector('b')));
    const items = (latestMarketPayload?.items || settings.market?.items || []).slice(0, 2);
    nodes.hybridMarket.innerHTML = items.map((item) => {
    const price = Number(item.price);
    const change = Number(item.changePercent);
    const hasPrice = item.price !== null && item.price !== undefined && item.price !== '' && Number.isFinite(price);
    const fractionDigits = item.symbol === "JPY=X" ? 2 : price >= 1000 ? 1 : 2;
    const priceLabel = hasPrice ? new Intl.NumberFormat("ja-JP", { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }).format(price) : "—";
    const changeLabel = Number.isFinite(change) ? `${change >= 0 ? "+" : ""}${change.toFixed(2)}%` : "更新待ち";
    const asOf = Number(item.marketTime || item.fetchedAt || latestMarketPayload?.fetchedAt || 0);
    const asOfLabel = asOf ? new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(asOf)) + ' 時点' : '取得時刻待ち';
    const tone = Number.isFinite(change) ? change > 0 ? 'is-up' : change < 0 ? 'is-down' : 'is-flat' : 'is-flat';
    return `<div class="new-market-item ${tone}"><span class="new-market-label"><b>${safe(item.label || item.symbol || '相場')}</b></span><strong class="new-number">${safe(priceLabel)}</strong><small class="new-number">${safe(changeLabel)}</small><time class="new-market-asof new-number">${safe(asOfLabel)}</time></div>`;
    }).join('');
    updateMarketLabels(nodes.hybridMarket);
  }

  function updateMarketLabels(root) {
    requestAnimationFrame(() => {
      if (!root || root.hidden) return;
      root.querySelectorAll('.new-market-item > strong').forEach((price) => {
        price.style.removeProperty('font-size');
        let size = parseFloat(getComputedStyle(price).fontSize);
        while (price.scrollWidth > price.clientWidth + 1 && size > 24) {
          price.style.fontSize = `${--size}px`;
        }
      });
      root.querySelectorAll('.new-market-label').forEach((label) => {
        const text = label.querySelector('b');
        stopNewEventScroll(label, text);
        const distance = Math.ceil(text.scrollWidth - label.clientWidth);
        if (distance > 3 && !settings.display.reduceMotion) startNewEventScroll(label, text, distance);
      });
    });
  }

  function formatRemoUpdated(value) {
    const date = value ? new Date(value) : null;
    return date && Number.isFinite(date.getTime())
      ? `${new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date)} 更新`
      : "更新待ち";
  }

  function natureActionGraphic(kind) {
    if (window.MoriyaIconGraphic) return window.MoriyaIconGraphic(kind);
    const common = 'viewBox="0 0 32 32" aria-hidden="true" focusable="false"';
    if (kind === "timer") return `<svg ${common}><circle cx="16" cy="18" r="10"/><path d="M12 3h8M16 3v5M16 12v6l4 3"/></svg>`;
    if (kind === "light") return `<svg ${common}><path d="M10.5 21.4h11M12.6 25h6.8M16 3.5a9 9 0 0 0-5.4 16.2c1.3 1 1.9 2.2 1.9 3.3h7c0-1.1.6-2.3 1.9-3.3A9 9 0 0 0 16 3.5Z"/></svg>`;
    if (kind === "tv") return `<svg ${common}><rect x="4.5" y="7" width="23" height="16" rx="1.5"/><path d="m11 3 5 4 5-4M12 27h8"/></svg>`;
    if (kind === "ac") return `<svg ${common}><rect x="3" y="5" width="26" height="13" rx="2"/><path d="M4 13h24M8 16h16M23 9h2"/></svg>`;
    if (kind === "fan") return `<svg ${common}><circle cx="16" cy="12" r="9"/><circle cx="16" cy="12" r="1.8"/><path d="M16 5v5M23 12h-5M16 19v-5M9 12h5M16 21v7M10 28h12"/></svg>`;
    if (kind === "fanOscillate") return `<svg ${common}><circle cx="16" cy="10" r="7"/><circle cx="16" cy="10" r="1.4"/><path d="M16 8V5M18 10h3M16 12v3M14 10h-3M16 17v10M11 29h10M3 20h8M3 20l3-3M3 20l3 3M29 20h-8M29 20l-3-3M29 20l-3 3"/></svg>`;
    if (kind === "nhk") return `<svg ${common}><path d="M2 23V9l7 14V9M12 9v14M19 9v14M12 16h7M22 9v14M29 9l-7 7 7 7"/></svg>`;
    if (kind === "curtain") return `<svg ${common}><path d="M5 5h22M7 6v21M25 6v21M7 7c6 4 6 12 0 19M25 7c-6 4-6 12 0 19M16 6v21"/></svg>`;
    if (kind === "music") return `<svg ${common}><path d="M13 24V8l13-3v15M13 13l13-3"/><ellipse cx="9.5" cy="24" rx="3.5" ry="2.5"/><ellipse cx="22.5" cy="20" rx="3.5" ry="2.5"/></svg>`;
    if (kind === "scene") return `<svg ${common}><path d="m16 3 2.2 7.2L25 13l-6.8 2.8L16 23l-2.2-7.2L7 13l6.8-2.8L16 3ZM25 21l.9 2.9L29 25l-3.1 1.1L25 29l-.9-2.9L21 25l3.1-1.1L25 21Z"/></svg>`;
    return `<svg ${common}><path d="M16 3v12M9.2 7.7a11 11 0 1 0 13.6 0"/></svg>`;
  }

  function renderNatureRemo(payload = window.__moriyaNatureRemoPayload) {
    if (qaInfo) payload = { enabled: ['remo', 'hybrid'].includes(settings.homeInfoMode), temperature: 26.5, updatedAt: Date.now(), actions: [{ label: '間接照明', icon: 'ambientLight', configured: false }] };
    if (!nodes.remoWidget || !nodes.remoTemperature || !nodes.remoActions) return;
    const hybrid = settings.homeInfoMode === "hybrid";
    const enabled = payload?.enabled ?? ["remo", "hybrid"].includes(settings.homeInfoMode);
    nodes.remoWidget.hidden = !enabled;
    nodes.remoWidget.classList.toggle("is-hybrid", hybrid);
    if (nodes.marketWidget && enabled) nodes.marketWidget.hidden = true;
    renderHybridMarket();
    if (!enabled) return;
    const temperature = payload?.temperature === null || payload?.temperature === undefined || payload?.temperature === ""
      ? Number.NaN
      : Number(payload.temperature);
    const unavailable = !Number.isFinite(temperature) && Boolean(payload?.error);
    nodes.remoTemperature.textContent = Number.isFinite(temperature) ? temperature.toFixed(1) : "—";
    requestAnimationFrame(() => {
      const value = nodes.remoTemperature;
      if (!value) return;
      value.style.removeProperty("font-size");
      const initialSize = Number.parseFloat(getComputedStyle(value).fontSize) || 48;
      let size = initialSize;
      while (value.scrollWidth > value.clientWidth + 1 && size > 30) {
        size -= 1;
        value.style.fontSize = `${size}px`;
      }
    });
    nodes.remoUpdated.textContent = unavailable ? "接続を確認" : formatRemoUpdated(payload?.updatedAt);
    nodes.remoUpdated.title = payload?.error || "";
    nodes.remoWidget.classList.toggle("is-unavailable", unavailable);
    nodes.remoWidget.classList.toggle("is-stale", Boolean(payload?.stale));
    const actionCount = hybrid ? 1 : Math.max(1, Math.min(4, Number(settings.natureRemo?.actionCount || 3)));
    const actions = (Array.isArray(payload?.actions) ? payload.actions.slice(0, actionCount) : []).map((item) => {
      if (Object.prototype.hasOwnProperty.call(item || {}, "configured")) return item;
      const kind = item?.action?.kind;
      return { ...item, configured: Boolean(item?.action), icon: kind === "light" ? "light" : kind === "tv" ? "tv" : kind === "aircon" ? "ac" : "power" };
    });
    nodes.remoActions.style.setProperty("--remo-action-count", String(actionCount));
    nodes.remoActions.innerHTML = Array.from({ length: actionCount }, (_, index) => {
      const action = actions[index] || { label: `操作${index + 1}`, icon: "power", configured: false };
      const kind = action.icon || "power";
      return `<button type="button" data-nature-action="${index}" data-configured="${action.configured ? "true" : "false"}" ${action.configured ? "" : "disabled"} aria-label="${safe(action.label)}"><span class="new-remo-action-icon">${natureActionGraphic(kind)}${action.badge && action.badge !== "none" ? `<span class="new-home-icon-badge">${natureActionGraphic(action.badge)}</span>` : ""}</span><span class="new-home-action-label"><b>${safe(action.label)}</b></span><small>${action.configured ? "操作" : unavailable ? "未接続" : "未設定"}</small></button>`;
    }).join("");
    requestAnimationFrame(() => {
      window.MoriyaCenterIcons?.(nodes.remoActions);
      nodes.remoActions?.querySelectorAll(".new-home-action-label").forEach((viewport) => {
        const label = viewport.querySelector("b");
        const overflow = Math.ceil(label.scrollWidth - viewport.clientWidth);
        if (overflow > 3 && animationMode() !== "off") {
          viewport.style.setProperty("--smart-label-shift", `${overflow + 5}px`);
          viewport.style.setProperty("--smart-label-time", `${Math.max(7, overflow / 16 + 5)}s`);
          viewport.classList.add("is-overflowing");
        }
      });
    });
    syncScheduledButtons();
    syncPowerIndicators();
  }

  function renderGarbage() {
    if (!nodes.garbagePreview || !nodes.garbageScheduleList) return;
    if (nodes.garbageWidget) nodes.garbageWidget.hidden = settings.garbage?.homeEnabled === false;
    const upcoming = upcomingGarbageEntries(20);
    nodes.garbagePreview.innerHTML = upcoming.length ? upcoming.slice(0, 2).map(({ dateKey, items }, index) => {
      const date = dateFromKey(dateKey);
      const dateLabel = new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric", weekday: "short" }).format(date).replace("曜日", "");
      return `<span class="new-garbage-preview-row"><time class="new-number">${safe(dateLabel)}</time><strong>${safe(items.map(shortGarbageLabel).join("・"))}</strong></span>`;
    }).join("") : '<span class="new-garbage-empty">公開済み期間の予定は終了しました</span>';

    nodes.garbageScheduleList.innerHTML = upcoming.length ? upcoming.map(({ dateKey, items }) => {
      const date = dateFromKey(dateKey);
      const weekday = new Intl.DateTimeFormat("ja-JP", { weekday: "short" }).format(date).replace("曜", "");
      const [, month, day] = dateKey.split("-").map(Number);
      const monthDay = `${month}/${day}`;
      return `<article class="new-garbage-schedule-row"><time class="new-number"><strong>${safe(monthDay)}</strong><span>${safe(weekday)}</span></time><div>${items.map((item) => `<span>${safe(shortGarbageLabel(item))}</span>`).join("")}</div></article>`;
    }).join("") : '<p class="new-garbage-empty">公開済み期間の予定は終了しました。</p>';
    const calendar = window.MORIYA_GARBAGE_CALENDAR;
    nodes.garbageCoverage.textContent = calendar
      ? `${calendar.source}　掲載期間 ${calendar.validFrom.replaceAll("-", "/")}–${calendar.validThrough.replaceAll("-", "/")}`
      : "ごみカレンダーを読み込めませんでした";
  }

  function openGarbageSchedule() {
    if (!nodes.garbageSheet || garbageSheetOpen) return;
    closeSmartSheet();
    renderGarbage();
    garbageSheetOpen = true;
    syncSheetDismiss();
    nodes.garbageSheet.hidden = false;
    nodes.garbageSheet.classList.toggle("is-window-expansion", animationMode() === "rich" && windowOnlyBlurEnabled());
    requestAnimationFrame(() => requestAnimationFrame(() => nodes.garbageSheet.classList.add("is-open")));
    resetInactivityTimer();
  }

  function closeGarbageSchedule() {
    if (!nodes.garbageSheet || !garbageSheetOpen) return;
    garbageSheetOpen = false;
    syncSheetDismiss();
    const expandsToHome = animationMode() === "rich" && windowOnlyBlurEnabled() && activePage === "home";
    if (!expandsToHome) nodes.garbageSheet.classList.remove("is-window-expansion");
    nodes.garbageSheet.classList.remove("is-open");
    const duration = animationMode() === "off" ? 0 : expandsToHome ? 540 : 220;
    window.setTimeout(() => {
      if (garbageSheetOpen) return;
      nodes.garbageSheet.hidden = true;
      nodes.garbageSheet.classList.remove("is-window-expansion");
    }, duration);
  }

  function renderSmartSheet() {
    if (!nodes.smartList) return;
    const actions = window.MoriyaSmartHome?.getActions?.() || [];
    nodes.smartSort?.classList.toggle("is-active", smartSortMode);
    nodes.smartSort?.setAttribute("aria-pressed", String(smartSortMode));
    nodes.smartList.classList.toggle("is-editing", smartSortMode);
    const guides = smartSortMode ? Array.from({ length: 36 }, (_, slot) => `<span class="new-smart-slot-guide" data-smart-slot="${slot}" style="grid-column:${slot % 9 + 1};grid-row:${Math.floor(slot / 9) + 1}" aria-hidden="true"></span>`).join("") : "";
    nodes.smartList.innerHTML = actions.length ? guides + actions.map((item, index) => ({ item, index })).sort((a, b) => a.item.slot - b.item.slot).map(({ item, index }) => `
      <div class="new-smart-tile ${smartSortMode ? "is-editing" : ""} ${window.MoriyaSmartHome.pendingFor("panel", index).length ? "is-scheduled" : ""} ${window.MoriyaSmartHome.getPowerState(item.action) === true ? "is-powered-on" : ""}" data-smart-index="${index}" data-smart-slot="${item.slot}" style="grid-column:${item.slot % 9 + 1};grid-row:${Math.floor(item.slot / 9) + 1}" role="button" tabindex="0" aria-label="${safe(item.label)}${smartSortMode ? "を編集または移動" : "を操作。長押しで予約"}">
        <span class="new-smart-icon-ring"><span class="new-remo-action-icon">${natureActionGraphic(item.icon === "auto" ? (item.action?.kind === "light" ? "light" : item.action?.kind === "tv" ? "tv" : item.action?.kind === "aircon" ? "ac" : item.action?.kind === "scene" ? "scene" : "power") : item.icon)}</span>${item.badge && item.badge !== "none" ? `<span class="new-smart-icon-badge">${natureActionGraphic(item.badge)}</span>` : ""}</span>
        <span class="new-smart-label-viewport"><b class="new-smart-label-text">${safe(item.label)}</b></span>
        ${smartSortMode ? `<button class="new-smart-tile-delete" type="button" data-smart-delete aria-label="${safe(item.label)}を削除"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6 18 18M18 6 6 18"/></svg></button>` : ""}
      </div>`).join("") : '<p class="new-smart-sheet-empty">操作ボタンはまだありません。右上の＋から追加できます。</p>';
    requestAnimationFrame(() => {
      window.MoriyaCenterIcons?.(nodes.smartList);
      nodes.smartList?.querySelectorAll(".new-smart-label-viewport").forEach((viewport) => {
        const label = viewport.querySelector(".new-smart-label-text");
        const overflow = Math.ceil(label.scrollWidth - viewport.clientWidth);
        if (overflow > 3 && animationMode() !== "off") {
          viewport.style.setProperty("--smart-label-shift", `${overflow + 5}px`);
          viewport.style.setProperty("--smart-label-time", `${Math.max(7, overflow / 16 + 5)}s`);
          viewport.classList.add("is-overflowing");
        }
      });
    });
  }

  function syncSheetDismiss() {
    if (nodes.sheetDismiss) nodes.sheetDismiss.hidden = !(garbageSheetOpen || smartSheetOpen);
  }

  function showSmartToast(message) {
    if (!nodes.smartToast || !message) return;
    clearTimeout(smartToastTimer);
    nodes.smartToast.textContent = String(message).slice(0, 100);
    nodes.smartToast.hidden = false;
    requestAnimationFrame(() => nodes.smartToast.classList.add("is-visible"));
    smartToastTimer = window.setTimeout(() => {
      nodes.smartToast.classList.remove("is-visible");
      window.setTimeout(() => { nodes.smartToast.hidden = true; }, 200);
    }, 4300);
  }

  function showHomeSmartError(message) {
    if (!nodes.homeSmartError) return;
    clearTimeout(homeSmartErrorTimer);
    nodes.homeSmartError.textContent = String(message || "家電を操作できませんでした。").slice(0, 120);
    nodes.homeSmartError.hidden = false;
    homeSmartErrorTimer = window.setTimeout(() => { nodes.homeSmartError.hidden = true; }, 7000);
  }

  function syncScheduledButtons() {
    nodes.remoActions?.querySelectorAll("[data-nature-action]").forEach((button) => {
      button.classList.toggle("is-scheduled", Boolean(window.MoriyaSmartHome?.pendingFor?.("home", Number(button.dataset.natureAction)).length));
    });
    nodes.smartList?.querySelectorAll("[data-smart-index]").forEach((tile) => {
      tile.classList.toggle("is-scheduled", Boolean(window.MoriyaSmartHome?.pendingFor?.("panel", Number(tile.dataset.smartIndex)).length));
    });
  }

  function syncPowerIndicators() {
    nodes.remoActions?.querySelectorAll("[data-nature-action]").forEach((button) => {
      const item = settings.natureRemo?.actions[Number(button.dataset.natureAction)];
      button.classList.toggle("is-powered-on", window.MoriyaSmartHome?.getPowerState?.(item?.action) === true);
    });
    nodes.smartList?.querySelectorAll("[data-smart-index]").forEach((tile) => {
      const item = window.MoriyaSmartHome?.getActions?.()[Number(tile.dataset.smartIndex)];
      tile.classList.toggle("is-powered-on", window.MoriyaSmartHome?.getPowerState?.(item?.action) === true);
    });
  }

  function renderSmartReservations() {
    if (!nodes.smartReservationsRows) return;
    const pending = window.MoriyaSmartHome?.getAllPending?.() || [];
    const date = new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric", timeZone: "Asia/Tokyo" });
    const time = new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Tokyo" });
    nodes.smartReservationsRows.innerHTML = pending.length ? pending.map(entry => `
      <div class="new-smart-reservation-row">
        <span class="new-reservation-icon">${natureActionGraphic(entry.icon === "auto" ? "power" : entry.icon)}</span>
        <span class="new-reservation-time"><b>${safe(time.format(entry.dueAt))}</b><small>${safe(date.format(entry.dueAt))}</small></span>
        <span class="new-reservation-label"><b>${safe(entry.label)}</b><small>${safe(entry.own ? "この端末" : entry.ownerName || "別端末")}</small></span>
        <button type="button" data-cancel-schedule="${safe(entry.id)}" aria-label="${safe(entry.label)}の予約を取り消す">取り消す</button>
      </div>`).join("") : '<p class="new-smart-reservations-empty">予約はありません</p>';
    const sync = window.MoriyaGithubSync;
    nodes.smartReservationsRefresh.disabled = !sync?.enabled?.();
    nodes.smartReservationsStatus.textContent = sync?.enabled?.()
      ? sync.scheduleError ? `同期待ち · ${sync.scheduleError}` : sync.lastScheduleSync ? `全端末の予約 · ${time.format(sync.lastScheduleSync)} 同期` : "GitHubから予約を取得します"
      : "この端末の予約 · GitHub接続で他端末の予約も共有できます";
    requestAnimationFrame(() => window.MoriyaCenterIcons?.(nodes.smartReservations));
  }

  function showSmartReservations(show) {
    nodes.smartSheet.classList.toggle("is-showing-reservations", show);
    nodes.smartReservations.hidden = !show;
    nodes.smartSort.hidden = nodes.smartAdd.hidden = show;
    nodes.smartScheduleList.classList.toggle("is-active", show);
    nodes.smartScheduleList.setAttribute("aria-pressed", String(show));
    if (show) {
      closeTimerSheet();
      smartSortMode = false;
      nodes.smartEditor.hidden = true;
      renderSmartReservations();
      if (window.MoriyaGithubSync?.enabled?.()) void window.MoriyaGithubSync.refresh();
    }
  }

  async function cancelListedSchedule(id) {
    const entry = window.MoriyaSmartHome?.getAllPending?.().find(item => item.id === id);
    if (!entry) return;
    if (await window.MoriyaSmartHome.cancelSchedule(id)) {
      showSmartToast(entry.own ? "予約を取り消しました。" : "取消を受け付けました。相手の端末の次回通信時に反映します。");
    } else showSmartToast("相手の端末に接続できず、予約を取り消せませんでした。");
    renderSmartReservations();
    if (timerTarget) renderTimerSheet();
  }

  function renderTimerSheet() {
    if (!timerTarget) return;
    const { source, index } = timerTarget;
    const item = source === "panel" ? window.MoriyaSmartHome?.getActions?.()[index] : settings.natureRemo?.actions[index];
    if (!item?.action) { closeTimerSheet(); return; }
    nodes.timerTitle.textContent = `${item.label}を予約`;
    const pending = window.MoriyaSmartHome.pendingFor(source, index);
    nodes.timerPending.innerHTML = pending.length
      ? `<h3>予約中</h3>${pending.map((entry) => `<div class="new-timer-pending-row"><span>${safe(new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false }).format(entry.dueAt))} に実行${entry.ownerId && entry.ownerId !== "local" && entry.ownerId !== window.MoriyaLanSync?.deviceId && entry.ownerId !== window.MoriyaGithubSync?.deviceId ? " · " + safe(entry.ownerName || "別端末") : ""}</span><button type="button" data-cancel-schedule="${safe(entry.id)}">取り消す</button></div>`).join("")}`
      : "";
    syncScheduledButtons();
  }

  function openTimerSheet(source, index) {
    const item = source === "panel" ? window.MoriyaSmartHome?.getActions?.()[index] : settings.natureRemo?.actions[index];
    if (!item?.action) { showSmartToast("先に家電の操作を設定してください。"); return; }
    timerTarget = { source, index };
    clearTimeout(timerCloseTimer);
    nodes.timerPresets.innerHTML = [[5, "5分後"], [10, "10分後"], [30, "30分後"], [60, "1時間後"], [120, "2時間後"]]
      .map(([minutes, label]) => `<button type="button" data-timer-minutes="${minutes}">${label}</button>`).join("");
    nodes.timerCustomMinutes.value = "";
    renderTimerSheet();
    nodes.timerDismiss.hidden = false;
    nodes.timerSheet.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => nodes.timerSheet.classList.add("is-open")));
    resetInactivityTimer();
  }

  function closeTimerSheet(fromDrag = false) {
    if (!nodes.timerSheet || nodes.timerSheet.hidden) return;
    timerTarget = null;
    timerDrag = null;
    if (fromDrag && animationMode() === "rich") {
      nodes.timerSheet.style.transition = "none";
      void nodes.timerSheet.offsetHeight;
      nodes.timerSheet.style.removeProperty("transition");
      nodes.timerSheet.style.removeProperty("transform");
      nodes.timerSheet.style.removeProperty("opacity");
    } else {
      nodes.timerSheet.style.removeProperty("transition");
      nodes.timerSheet.style.removeProperty("transform");
      nodes.timerSheet.style.removeProperty("opacity");
    }
    nodes.timerSheet.classList.remove("is-open");
    nodes.timerDismiss.hidden = true;
    timerCloseTimer = window.setTimeout(() => { if (!timerTarget) nodes.timerSheet.hidden = true; }, animationMode() === "off" ? 0 : 400);
  }

  function scheduleTimer(minutes) {
    if (!timerTarget) return;
    const result = window.MoriyaSmartHome.schedule(timerTarget.source, timerTarget.index, minutes);
    if (!result) { showSmartToast("1〜720分の範囲で指定してください。"); return; }
    renderTimerSheet();
    showSmartToast(`${minutes}分後の操作を予約しました。`);
  }

  function installActionLongPress(container, selector, source) {
    if (!container) return;
    container.addEventListener("pointerdown", (event) => {
      const target = event.target.closest(selector);
      if (!target || target.disabled || (source === "panel" && smartSortMode) || event.target.closest("[data-smart-delete]")) return;
      const index = Number(source === "panel" ? target.dataset.smartIndex : target.dataset.natureAction);
      longPress = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, timer: 0 };
      longPress.timer = window.setTimeout(() => {
        suppressActionClickUntil = performance.now() + 750;
        openTimerSheet(source, index);
        longPress = null;
      }, 540);
    });
    container.addEventListener("pointermove", (event) => {
      if (!longPress || event.pointerId !== longPress.pointerId) return;
      if (Math.hypot(event.clientX - longPress.startX, event.clientY - longPress.startY) > 11) {
        clearTimeout(longPress.timer);
        longPress = null;
      }
    });
    const clear = () => { if (longPress) clearTimeout(longPress.timer); longPress = null; };
    container.addEventListener("pointerup", clear);
    container.addEventListener("pointercancel", clear);
    window.addEventListener("pointerup", clear);
    window.addEventListener("pointercancel", clear);
    container.addEventListener("contextmenu", (event) => {
      const target = event.target.closest(selector);
      if (!target || target.disabled || (source === "panel" && smartSortMode)) return;
      event.preventDefault();
      openTimerSheet(source, Number(source === "panel" ? target.dataset.smartIndex : target.dataset.natureAction));
    });
  }

  function setupSmartTileReorder() {
    if (!nodes.smartList) return;
    nodes.smartList.addEventListener("pointerdown", (event) => {
      if (!smartSortMode || event.target.closest("[data-smart-delete]")) return;
      const tile = event.target.closest("[data-smart-index]");
      if (!tile) return;
      const tileRect = tile.getBoundingClientRect();
      smartTileDrag = { pointerId: event.pointerId, tile, from: Number(tile.dataset.smartIndex), fromSlot: Number(tile.dataset.smartSlot), toSlot: Number(tile.dataset.smartSlot), x: event.clientX, y: event.clientY, tileLeft: tileRect.left, tileTop: tileRect.top, moved: false, ghost: null };
      tile.setPointerCapture?.(event.pointerId);
    });
    window.addEventListener("pointermove", (event) => {
      const drag = smartTileDrag;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) < 8) return;
      if (!drag.moved) {
        drag.moved = true;
        drag.ghost = drag.tile.cloneNode(true);
        drag.ghost.querySelector("[data-smart-delete]")?.remove();
        drag.ghost.classList.remove("is-editing");
        drag.ghost.classList.add("new-smart-drag-ghost");
        drag.ghost.removeAttribute("role");
        drag.ghost.removeAttribute("tabindex");
        drag.ghost.setAttribute("aria-hidden", "true");
        nodes.signage.append(drag.ghost);
        drag.tile.classList.add("is-drag-origin");
      }
      event.preventDefault();
      const list = nodes.smartList;
      const signageRect = nodes.signage.getBoundingClientRect();
      const signageScale = signageRect.width / nodes.signage.offsetWidth || 1;
      // Both the dragged icon and the highlighted slot must use the same
      // pointer coordinates. Preserve the original grab point, then convert
      // the tile's viewport position back to the scaled signage stage.
      const dragLeft = (drag.tileLeft + event.clientX - drag.x - signageRect.left) / signageScale;
      const dragTop = (drag.tileTop + event.clientY - drag.y - signageRect.top) / signageScale;
      drag.ghost.style.left = `${dragLeft.toFixed(2)}px`;
      drag.ghost.style.top = `${dragTop.toFixed(2)}px`;
      const rect = list.getBoundingClientRect();
      const css = getComputedStyle(list);
      const scale = rect.width / list.offsetWidth || 1;
      const columnWidth = parseFloat(css.gridTemplateColumns) || 108;
      const rowHeight = parseFloat(css.gridAutoRows) || 114;
      const columnGap = parseFloat(css.columnGap) || 0;
      const rowGap = parseFloat(css.rowGap) || 0;
      const x = (event.clientX - rect.left) / scale + list.scrollLeft - parseFloat(css.paddingLeft);
      const y = (event.clientY - rect.top) / scale + list.scrollTop - parseFloat(css.paddingTop);
      const column = Math.max(0, Math.min(8, Math.floor(x / (columnWidth + columnGap))));
      const row = Math.max(0, Math.min(3, Math.floor(y / (rowHeight + rowGap))));
      drag.toSlot = row * 9 + column;
      list.querySelectorAll(".new-smart-slot-guide").forEach((guide) => guide.classList.toggle("is-drop-target", Number(guide.dataset.smartSlot) === drag.toSlot && drag.toSlot !== drag.fromSlot));
      list.querySelectorAll("[data-smart-index]").forEach((tile) => tile.classList.toggle("is-drop-target", Number(tile.dataset.smartSlot) === drag.toSlot && drag.toSlot !== drag.fromSlot));
    }, { passive: false });
    const endDrag = (event) => {
      const drag = smartTileDrag;
      if (!drag || drag.pointerId !== event.pointerId) return;
      smartTileDrag = null;
      drag.ghost?.remove();
      drag.tile.classList.remove("is-drag-origin");
      nodes.smartList.querySelectorAll(".is-drop-target").forEach((tile) => tile.classList.remove("is-drop-target"));
      if (!drag.moved) return;
      suppressActionClickUntil = performance.now() + 450;
      if (event.type === "pointercancel" || drag.toSlot === drag.fromSlot) return;
      const actions = window.MoriyaSmartHome.getActions();
      const other = actions.find((item, index) => index !== drag.from && item.slot === drag.toSlot);
      if (other) other.slot = drag.fromSlot;
      actions[drag.from].slot = drag.toSlot;
      window.MoriyaSmartHome.saveActions(actions);
    };
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
  }

  function openSmartSheet() {
    if (!nodes.smartSheet || smartSheetOpen) return;
    closeGarbageSchedule();
    smartSheetOpen = true;
    showSmartReservations(false);
    syncScheduledButtons();
    syncSheetDismiss();
    renderSmartSheet();
    nodes.smartSheet.hidden = false;
    nodes.smartSheet.classList.toggle("is-window-expansion", animationMode() === "rich" && windowOnlyBlurEnabled());
    requestAnimationFrame(() => requestAnimationFrame(() => nodes.smartSheet.classList.add("is-open")));
    resetInactivityTimer();
  }

  function closeSmartSheet() {
    if (!nodes.smartSheet || !smartSheetOpen) return;
    smartSheetOpen = false;
    syncSheetDismiss();
    smartSortMode = false;
    nodes.smartEditor.hidden = true;
    const expandsToHome = animationMode() === "rich" && windowOnlyBlurEnabled() && activePage === "home";
    if (!expandsToHome) nodes.smartSheet.classList.remove("is-window-expansion");
    nodes.smartSheet.classList.remove("is-open");
    const duration = animationMode() === "off" ? 0 : expandsToHome ? 540 : 220;
    window.setTimeout(() => {
      if (smartSheetOpen) return;
      nodes.smartSheet.hidden = true;
      nodes.smartSheet.classList.remove("is-window-expansion");
    }, duration);
  }

  function openSmartEditor(index = -1) {
    const actions = window.MoriyaSmartHome?.getActions?.() || [];
    if (index < 0 && actions.length >= 24) {
      nodes.smartEditorStatus.textContent = "操作ボタンは24個までです。";
      return;
    }
    smartEditIndex = index;
    const item = index >= 0 ? actions[index] : null;
    smartEditorChoices = window.MoriyaSmartHome?.getChoices?.() || [];
    if (item?.action && !smartEditorChoices.some((choice) => JSON.stringify(choice.action) === JSON.stringify(item.action))) {
      smartEditorChoices.unshift({ label: `${item.label}（現在の操作）`, action: item.action });
    }
    nodes.smartAction.replaceChildren(new Option("操作を選択", ""), ...smartEditorChoices.map((choice, choiceIndex) => new Option(choice.label, String(choiceIndex))));
    const selected = item?.action ? smartEditorChoices.findIndex((choice) => JSON.stringify(choice.action) === JSON.stringify(item.action)) : -1;
    nodes.smartAction.value = selected >= 0 ? String(selected) : "";
    nodes.smartIcon.replaceChildren(...(window.MoriyaSmartHome?.getIcons?.() || []).map(([value, label]) => new Option(label, value)));
    nodes.smartIcon.value = item?.icon || "auto";
    window.MoriyaRenderIconPicker?.(nodes.smartIcon);
    nodes.smartBadge.replaceChildren(...(window.MoriyaSmartHome?.getBadges?.() || []).map(([value, label]) => new Option(label, value)));
    nodes.smartBadge.value = item?.badge || "none";
    window.MoriyaRenderBadgePicker?.(nodes.smartBadge);
    requestAnimationFrame(() => window.MoriyaCenterIcons?.(nodes.smartEditor));
    nodes.smartLabel.value = item?.label || "";
    nodes.smartEditorTitle.textContent = index >= 0 ? "操作ボタンを編集" : "操作ボタンを追加";
    nodes.smartEditorStatus.textContent = "";
    nodes.smartEditor.hidden = false;
    nodes.smartLabel.focus();
  }

  function renderNewTrains() {
    const previousScrollTop = nodes.trains?.scrollTop || 0;
    const current = now();
    const currentMinutes = minutesInTokyo(current);
    const target = new Date(current.getTime() + settings.trainOffsetMinutes * 60000);
    const dayType = isHolidayOrWeekend(current) ? "weekend" : "weekday";
    const table = timetable[dayType] || [];
    let upcoming = tokyoDateKey(target) === tokyoDateKey(current)
      ? table.filter((train) => train.hour * 60 + train.minute >= minutesInTokyo(target)).slice(0, 24).map((train) => ({
          ...train,
          waitMinutes: train.hour * 60 + train.minute - currentMinutes,
        }))
      : [];
    if (qaTrain && upcoming.length) {
      const waits = [14, 18, 24, 31, 42];
      upcoming = upcoming.map((train, index) => ({
        ...train,
        waitMinutes: waits[index] ?? train.waitMinutes,
        startsHere: index === 4 ? false : (index === 0 || train.startsHere),
        destination: index === 4 ? "北千住" : train.destination,
      }));
    }
    nodes.trainDayType.textContent = dayType === "weekend" ? "土休日" : "平日";
    if (!upcoming.length) {
      nodes.trains.innerHTML = `<li class="new-train-row"><span class="new-train-destination">${table.length ? "本日の運転は終了しました" : "時刻表を読み込んでいます"}</span></li>`;
      return;
    }
    nodes.trains.innerHTML = upcoming.map((train) => {
      const destination = [train.startsHere ? "当駅始発" : "", train.destination && train.destination !== "秋葉原" ? `${train.destination}行` : ""].filter(Boolean).join(" ・ ");
      return `
        <li class="new-train-row ${safe(train.kind)} ${alertClass(train.waitMinutes)}" data-train-time="${safe(train.time)}" role="button" tabindex="0" aria-label="${safe(train.time)}発 ${safe(SERVICE_LABELS[train.kind] || train.kind)}の停車駅を表示">
          <span class="new-service-bar" aria-hidden="true"></span>
          <span class="new-train-service"><strong>${safe(SERVICE_LABELS[train.kind] || train.kind)}</strong>${destination ? `<small>${safe(destination)}</small>` : ""}</span>
          <span class="new-train-time new-number">${safe(train.time)}</span>
          <span class="new-train-wait"><strong class="new-number">${safe(train.waitMinutes)}</strong>分後</span>
        </li>`;
    }).join("");
    if (previousScrollTop > 0) requestAnimationFrame(() => { nodes.trains.scrollTop = previousScrollTop; });
  }

  function openTrainDetail(time) {
    const dayType = isHolidayOrWeekend(now()) ? "weekend" : "weekday";
    const record = window.MORIYA_TRAIN_STOPS?.[dayType]?.[time];
    const train = (timetable[dayType] || []).find((item) => item.time === time);
    if (!train) return;
    nodes.trainDetailTitle.replaceChildren();
    const departure = document.createElement("time");
    departure.textContent = time;
    const departureUnit = document.createElement("span");
    departureUnit.className = "new-train-departure-unit";
    departureUnit.textContent = "発";
    const service = document.createElement("span");
    service.className = "new-train-detail-service";
    service.textContent = SERVICE_LABELS[train.kind] || train.kind;
    nodes.trainDetailTitle.append(departure, departureUnit, service);
    const departureMinutes = Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
    const rows = [["守谷", time, "発", 0], ...(record?.stops || []).map(([station, stopTime, kind]) => {
      let minutes = Number(stopTime.slice(0, 2)) * 60 + Number(stopTime.slice(3)) - departureMinutes;
      if (minutes < 0) minutes += 1440;
      return [station, stopTime, kind, minutes];
    })];
    nodes.trainDetailStops.innerHTML = record?.stops?.length
      ? rows.map(([station, stopTime, kind, minutes]) => `<li class="${["北千住", "秋葉原"].includes(station) ? "is-key-station" : ""}"><span>${safe(station)}</span><time class="new-number">${safe(stopTime)}</time><small>${minutes ? `${minutes}分 · ` : ""}${safe(kind)}</small></li>`).join("")
      : `<li><span>公式の停車時刻を確認中です</span></li>`;
    nodes.trainBoard.scrollLeft = 0;
    nodes.trainBoard.classList.add("is-detail");
    nodes.trainDetailClose.focus({ preventScroll: true });
  }

  function closeTrainDetail() {
    nodes.trainBoard.classList.remove("is-detail");
    nodes.trainBoard.scrollLeft = 0;
  }

  function resetTrainScroll(smooth = false) {
    clearTimeout(trainScrollResetTimer);
    trainScrollResetTimer = 0;
    nodes.trains?.scrollTo?.({ top: 0, behavior: smooth && animationMode() !== "off" ? "smooth" : "auto" });
    if (nodes.trains && typeof nodes.trains.scrollTo !== "function") nodes.trains.scrollTop = 0;
  }

  function scheduleTrainScrollReset() {
    clearTimeout(trainScrollResetTimer);
    trainScrollResetTimer = window.setTimeout(() => resetTrainScroll(true), 60000);
  }

  function calendarItemsForDate(dateKey) {
    if (scheduleIsHidden()) return [];
    const items = typeof debugEventsForDate === "function" ? debugEventsForDate(dateKey) : [];
    if (qaCalendar && dateKey.endsWith("-08")) items.push(
      { startLabel: "10:00", title: "地域連絡会議", meta: "守谷市民ホール" },
      { startLabel: "18:30", title: "年末特別イルミネーション準備会議と来年度の運営計画についての打ち合わせ", meta: "第2会議室" },
      { startLabel: "21:00", title: "設備確認と翌日の準備", meta: "" },
    );
    if (qaCalendar && dateKey.endsWith("-12")) items.push({ startLabel: "終日", title: "設備点検", meta: "" });
    if (!settings.icalUrl || !cachedIcalDefinitions) return items;
    items.push(...expandIcalEvents(cachedIcalDefinitions, dateKey)
      .filter((event) => eventOccursOnDate(event, dateKey))
      .sort((a, b) => a.start - b.start)
      .map((event) => ({
        startLabel: event.allDay ? "終日" : formatTime(event.start),
        title: event.summary || "無題の予定",
        meta: isCalendarSourceLabel(event.location) ? "" : event.location || "",
      })));
    return items.sort((a, b) => String(a.startLabel).localeCompare(String(b.startLabel)));
  }

  function renderEventPanel(container, items, emptyText) {
    const content = items.length ? items.slice(0, 4) : [{ startLabel: "--", title: emptyText, meta: "" }];
    container.innerHTML = content.map((event) => `
      <li class="new-event-item">
        <span class="new-event-time new-number">${safe(event.startLabel)}</span>
        <div class="new-event-copy">
          <div class="new-event-title"><span class="new-event-title-text">${safe(event.title)}</span></div>
          ${event.meta ? `<div class="new-event-meta">${safe(event.meta)}</div>` : ""}
        </div>
      </li>
    `).join("");
  }

  function renderNewCalendars(todayOverride = null, source = "") {
    const todayKey = tokyoDateKey(now());
    const tomorrowKey = tokyoDateKey(addDays(dateFromKey(todayKey), 1));
    // Always rebuild the New-mode agenda from the current settings/cache. This also
    // makes newly saved debug events visible immediately instead of waiting for a
    // page navigation to trigger another render.
    let today = calendarItemsForDate(todayKey);
    const tomorrow = calendarItemsForDate(tomorrowKey);
    if (qaLongEvent && !scheduleIsHidden()) {
      today = [{ startLabel: "18:30", title: "地域交流センターで開催される年末特別イルミネーション準備会議と来年度の運営計画についての打ち合わせ", meta: "守谷市民ホール 第2会議室" }, ...today];
    }
    nodes.eventCalendarColumn.hidden = true;
    nodes.monthCalendar.hidden = false;
    renderMonthCalendar();
    renderEventPanel(nodes.todayEvents, today, settings.icalUrl ? "今日の予定はありません" : "カレンダー未設定");
    renderEventPanel(nodes.tomorrowEvents, tomorrow, settings.icalUrl ? "明日の予定はありません" : "設定からiCalを登録できます");
    const agendaText = today.length
      ? today.slice(0, 3).map((event) => `${event.startLabel} ${event.title}`).join("　/　")
      : "予定はありません";
    if (nodes.commuteAgenda && nodes.commuteAgendaText) {
      nodes.commuteAgenda.hidden = scheduleIsHidden();
      nodes.commuteAgenda.disabled = !today.length;
      nodes.commuteAgenda.dataset.calendarDate = todayKey;
      nodes.commuteAgendaText.textContent = agendaText;
    }
    if (nodes.homeAgenda && nodes.homeAgendaList) {
      nodes.homeAgenda.hidden = scheduleIsHidden() || !today.length;
      const rows = today.slice(0, 3).map((event) => `
        <div class="new-home-agenda-row">
          <span class="new-home-agenda-time new-number">${safe(event.startLabel)}</span>
          <div class="new-event-title"><span class="new-event-title-text">${safe(event.title)}</span></div>
        </div>`);
      if (today.length > 3) rows.push(`
        <div class="new-home-agenda-row is-more">
          <span class="new-home-agenda-time" aria-hidden="true"></span><span>他予定あり</span>
        </div>`);
      nodes.homeAgendaList.innerHTML = rows.join("");
    }
    requestAnimationFrame(() => requestAnimationFrame(updateNewEventScroll));
  }

  function renderMonthCalendar(direction = 0) {
    const current = now();
    const year = calendarViewYear;
    const month = calendarViewMonth;
    const todayKey = tokyoDateKey(current);
    const first = new Date(Date.UTC(year, month - 1, 1, 12));
    const daysInMonth = new Date(Date.UTC(year, month, 0, 12)).getUTCDate();
    const leading = first.getUTCDay();
    const cells = [];
    for (let index = 0; index < 42; index += 1) {
      const day = index - leading + 1;
      if (day < 1 || day > daysInMonth) {
        cells.push('<span class="new-month-day is-empty" aria-hidden="true"></span>');
        continue;
      }
      const key = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const weekday = index % 7;
      const holiday = HOLIDAYS.has(key);
      const hasEvents = Boolean(calendarItemsForDate(key).length);
      const tone = holiday || weekday === 0 ? "is-holiday" : weekday === 6 ? "is-saturday" : "";
      const today = key === todayKey ? "is-today" : "";
      cells.push(`<button class="new-month-day ${tone} ${today} ${hasEvents ? "has-events" : ""}" data-calendar-date="${key}" type="button" aria-label="${month}月${day}日${holiday ? " 祝日" : ""}${hasEvents ? " 予定あり" : ""}"><span>${day}</span></button>`);
    }
    const canGoPrevious = year > 2026 || month > 1;
    const canGoNext = year < 2028 || month < 12;
    const thisMonthParts = tokyoParts(current);
    const currentMonthYear = Math.max(2026, Math.min(2028, Number(thisMonthParts.year)));
    const currentMonthMonth = Number(thisMonthParts.year) < 2026 ? 1 : Number(thisMonthParts.year) > 2028 ? 12 : Number(thisMonthParts.month);
    const viewingCurrentMonth = year === currentMonthYear && month === currentMonthMonth;
    const shell = document.createElement("div");
    shell.innerHTML = `
      <div class="new-calendar-view" data-calendar-view>
        <div class="new-calendar-main">
          <header class="new-month-head"><button class="new-month-step new-month-step-previous" type="button" data-month-step="-1" aria-label="前の月" ${canGoPrevious ? "" : "disabled"}><span class="material-symbols-outlined" aria-hidden="true">chevron_left</span></button><button class="new-month-current" type="button" data-current-month aria-label="今月に戻る" ${viewingCurrentMonth ? "disabled" : ""}>今月</button><h3><strong class="new-number">${month}</strong>月 <span class="new-number">${year}</span></h3><button class="new-month-step new-month-step-next" type="button" data-month-step="1" aria-label="次の月" ${canGoNext ? "" : "disabled"}><span class="material-symbols-outlined" aria-hidden="true">chevron_right</span></button></header>
          <div class="new-month-weekdays"><span class="is-holiday">日</span><span>月</span><span>火</span><span>水</span><span>木</span><span>金</span><span class="is-saturday">土</span></div>
          <div class="new-month-grid">${cells.join("")}</div>
        </div>
        <section class="new-calendar-day-sheet" data-calendar-day-sheet hidden></section>
      </div>`;
    const nextView = shell.firstElementChild;
    bindCalendarView(nextView, currentMonthYear, currentMonthMonth);
    const previousView = nodes.monthCalendar.querySelector("[data-calendar-view]");
    if (!previousView || !direction || animationMode() === "off") {
      clearTimeout(calendarTransitionTimer);
      nodes.monthCalendar.classList.remove("is-calendar-transitioning");
      nodes.monthCalendar.replaceChildren(nextView);
      return;
    }
    const enteringClass = direction > 0 ? "is-entering-right" : "is-entering-left";
    const leavingClass = direction > 0 ? "is-leaving-left" : "is-leaving-right";
    const duration = animationMode() === "rich" ? 520 : 410;
    nodes.monthCalendar.style.setProperty("--calendar-motion-duration", `${duration}ms`);
    nodes.monthCalendar.classList.add("is-calendar-transitioning");
    nextView.classList.add(enteringClass);
    nodes.monthCalendar.append(nextView);
    void nextView.offsetWidth;
    requestAnimationFrame(() => {
      nextView.classList.remove(enteringClass);
      previousView.classList.add(leavingClass);
    });
    calendarTransitionTimer = window.setTimeout(() => {
      previousView.remove();
      nextView.classList.remove("is-entering-left", "is-entering-right", "is-leaving-left", "is-leaving-right");
      nodes.monthCalendar.classList.remove("is-calendar-transitioning");
    }, duration + 40);
  }

  function bindCalendarView(view, currentMonthYear, currentMonthMonth) {
    view.querySelectorAll("[data-month-step]").forEach((button) => button.addEventListener("click", () => {
      moveCalendarMonth(Number(button.dataset.monthStep));
    }));
    view.querySelector("[data-current-month]")?.addEventListener("click", () => {
      const direction = currentMonthYear * 12 + currentMonthMonth > calendarViewYear * 12 + calendarViewMonth ? 1 : -1;
      calendarViewYear = currentMonthYear;
      calendarViewMonth = currentMonthMonth;
      renderMonthCalendar(direction);
      resetInactivityTimer();
    });
    view.querySelectorAll("[data-calendar-date]").forEach((button) => button.addEventListener("click", () => {
      renderCalendarDaySheet(button.dataset.calendarDate, view);
      resetInactivityTimer();
    }));
  }

  function moveCalendarMonth(step) {
    const nextDate = new Date(Date.UTC(calendarViewYear, calendarViewMonth - 1 + step, 1, 12));
    const nextYear = nextDate.getUTCFullYear();
    if (nextYear < 2026 || nextYear > 2028) return false;
    calendarViewYear = nextYear;
    calendarViewMonth = nextDate.getUTCMonth() + 1;
    renderMonthCalendar(step);
    resetInactivityTimer();
    return true;
  }

  function renderCalendarDaySheet(dateKey, view = null) {
    const activeView = view || [...nodes.monthCalendar.querySelectorAll("[data-calendar-view]")].at(-1);
    const sheet = activeView?.querySelector("[data-calendar-day-sheet]");
    if (!sheet) return;
    nodes.monthCalendar.style.setProperty("--calendar-motion-duration", animationMode() === "rich" ? "520ms" : "410ms");
    const date = dateFromKey(dateKey);
    const title = new Intl.DateTimeFormat("ja-JP", { month: "long", day: "numeric", weekday: "short" }).format(date);
    const items = calendarItemsForDate(dateKey);
    sheet.innerHTML = `
      <header><button class="new-calendar-back" type="button" data-close-day aria-label="月間カレンダーに戻る"><span class="material-symbols-outlined" aria-hidden="true">chevron_left</span></button><div><span class="new-eyebrow">DAY SCHEDULE</span><h3>${safe(title)}</h3></div></header>
      <ol class="new-calendar-day-events">${(items.length ? items : [{ startLabel: "--", title: "この日の予定はありません", meta: "" }]).map((event) => `
        <li><time class="new-number">${safe(event.startLabel)}</time><div><div class="new-event-title"><span class="new-event-title-text">${safe(event.title)}</span></div>${event.meta ? `<span>${safe(event.meta)}</span>` : ""}</div></li>`).join("")}</ol>`;
    sheet.hidden = false;
    const showSheet = () => {
      activeView.classList.add("is-showing-day");
      sheet.classList.add("is-visible");
    };
    if (animationMode() === "off") showSheet();
    else requestAnimationFrame(() => requestAnimationFrame(showSheet));
    sheet.querySelector("[data-close-day]")?.addEventListener("click", () => {
      activeView.classList.remove("is-showing-day");
      sheet.classList.remove("is-visible");
      const finish = () => { sheet.hidden = true; };
      if (animationMode() === "off") finish();
      else window.setTimeout(finish, animationMode() === "rich" ? 520 : 410);
      resetInactivityTimer();
    });
    requestAnimationFrame(() => requestAnimationFrame(updateNewEventScroll));
  }

  function stopNewEventScroll(title, text) {
    const state = title._marqueeState;
    if (state?.timer) clearTimeout(state.timer);
    state?.animation?.cancel();
    delete title._marqueeState;
    title.classList.remove("is-overflowing", "is-scrolling");
    text.style.removeProperty("transform");
  }

  function startNewEventScroll(title, text, distance) {
    const state = { timer: 0, animation: null };
    title._marqueeState = state;
    title.classList.add("is-overflowing");
    const duration = Math.max(4200, distance * 34);
    const run = () => {
      if (!title.isConnected || title._marqueeState !== state) return;
      title.classList.add("is-scrolling");
      state.animation = text.animate([
        { transform: "translateX(0)" },
        { transform: `translateX(-${distance}px)` },
      ], { duration, easing: "linear", fill: "forwards" });
      state.animation.finished.then(() => {
        if (title._marqueeState !== state) return;
        title.classList.remove("is-scrolling");
        state.timer = window.setTimeout(() => {
          state.animation?.cancel();
          state.animation = null;
          text.style.removeProperty("transform");
          state.timer = window.setTimeout(run, 1800);
        }, 1300);
      }).catch(() => {});
    };
    state.timer = window.setTimeout(run, 1700);
  }

  function updateNewEventScroll() {
    for (const title of document.querySelectorAll(".new-event-title")) {
      const text = title.querySelector(".new-event-title-text");
      if (!text) continue;
      stopNewEventScroll(title, text);
      const distance = Math.ceil(text.scrollWidth - title.clientWidth);
      if (distance <= 3 || settings.display.reduceMotion) continue;
      startNewEventScroll(title, text, distance + 20);
    }
  }

  function setNewClockText(node, value) {
    if (!node || node.textContent === value) return;
    node.textContent = value;
    if (animationMode() !== "rich") return;
    node.classList.remove("rich-number-swap");
    void node.offsetWidth;
    node.classList.add("rich-number-swap");
    window.setTimeout(() => node.classList.remove("rich-number-swap"), 560);
  }

  function syncNewClock() {
    const current = now();
    const part = tokyoParts(current);
    const weekday = new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", weekday: "short" }).format(current).replace("曜", "");
    const time = `${part.hour}:${part.minute}`;
    const date = `${Number(part.month)}/${Number(part.day)}`;
    setNewClockText(nodes.clockHour, part.hour);
    setNewClockText(nodes.clockMinute, part.minute);
    nodes.seconds.textContent = part.second.padStart(2, "0");
    nodes.date.textContent = date;
    nodes.weekday.textContent = weekday;
    setNewClockText(nodes.commuteTime, time);
    nodes.commuteSeconds.textContent = part.second.padStart(2, "0");
    nodes.commuteDate.textContent = date;
    setNewClockText(nodes.weatherTime, time);
    nodes.weatherSeconds.textContent = part.second.padStart(2, "0");
    nodes.weatherDate.textContent = date;
    nodes.startupTime.textContent = time;
  }

  function resetCalendarView() {
    const currentCalendarParts = tokyoParts(now());
    calendarViewYear = Math.max(2026, Math.min(2028, Number(currentCalendarParts.year)));
    calendarViewMonth = Number(currentCalendarParts.year) < 2026
      ? 1
      : Number(currentCalendarParts.year) > 2028
        ? 12
        : Number(currentCalendarParts.month);
  }

  function syncPinButtons() {
    for (const button of nodes.pinButtons) {
      button.classList.toggle("is-active", isPinned);
      button.setAttribute("aria-pressed", String(isPinned));
      button.setAttribute("aria-label", isPinned ? "画面の固定を解除" : "この画面を固定");
    }
  }

  function preparePageContent(name) {
    if (name === "commute") {
      renderNewTrains();
      renderNewCalendars();
    }
    if (name === "weather" && latestWeather) renderNewWeather(latestWeather);
  }

  function commitPageState(name) {
    activePage = name;
    nodes.signage.dataset.activePage = name;
    if (name === "home") {
      isPinned = false;
      syncPinButtons();
      resetCalendarView();
      resetTrainScroll(false);
    }
    resetInactivityTimer();
  }

  function cancelMotionGlassRelease() {
    if (motionGlassReleaseRaf) cancelAnimationFrame(motionGlassReleaseRaf);
    motionGlassReleaseRaf = 0;
  }

  function clearLiveGlassProxies() {
    nodes.motionGlassLayer?.replaceChildren();
    liveGlassProxies.clear();
    liveGlassGeometry = [];
  }

  function captureLiveGlassGeometry() {
    clearLiveGlassProxies();
    if (!nodes.motionGlassLayer) return;
    const signageRect = nodes.signage.getBoundingClientRect();
    const scale = signageRect.width > 0 ? signageRect.width / 1280 : 1;
    liveGlassGeometry = [...nodes.signage.querySelectorAll(".new-rect-panel, .new-forecast-preview")]
      .map((panel) => {
        const page = panel.closest(".new-page");
        const rect = panel.getBoundingClientRect();
        if (!page || !rect.width || !rect.height) return null;
        return {
          panel,
          pageName: page.dataset.page,
          left: (rect.left - signageRect.left) / scale,
          top: (rect.top - signageRect.top) / scale,
          width: rect.width / scale,
          height: rect.height / scale,
        };
      })
      .filter(Boolean);
  }

  function syncLiveGlassProxies(pageStates, transition = "none") {
    if (!nodes.motionGlassLayer) return;
    const visible = new Set();
    for (const geometry of liveGlassGeometry) {
      if (!Object.prototype.hasOwnProperty.call(pageStates, geometry.pageName)) continue;
      const pageState = pageStates[geometry.pageName];
      const offset = typeof pageState === "number" ? pageState : Number(pageState?.offset) || 0;
      const opacity = typeof pageState === "number" ? 1 : Math.max(0, Math.min(1, Number(pageState?.opacity) || 0));
      let proxy = liveGlassProxies.get(geometry.panel);
      if (!proxy) {
        proxy = document.createElement("div");
        proxy.className = "new-motion-glass-proxy";
        if (geometry.panel.classList.contains("new-forecast-preview")) proxy.classList.add("is-forecast-proxy");
        nodes.motionGlassLayer.append(proxy);
        liveGlassProxies.set(geometry.panel, proxy);
      }
      visible.add(proxy);
      proxy.hidden = false;
      proxy.style.transition = transition;
      proxy.style.opacity = String(opacity);
      proxy.style.left = `${(geometry.left + offset).toFixed(2)}px`;
      proxy.style.top = `${geometry.top.toFixed(2)}px`;
      proxy.style.width = `${geometry.width.toFixed(2)}px`;
      proxy.style.height = `${geometry.height.toFixed(2)}px`;
    }
    for (const proxy of liveGlassProxies.values()) {
      if (!visible.has(proxy)) proxy.hidden = true;
    }
  }

  function beginMotionGlass() {
    if (!windowOnlyBlurEnabled()) return;
    cancelMotionGlassRelease();
    if (animationMode() !== "off" && nodes.motionGlassLayer) {
      captureLiveGlassGeometry();
      nodes.signage.classList.remove("is-glass-motion");
      nodes.signage.classList.add("is-live-glass-motion");
      syncLiveGlassProxies({ [activePage]: 0 });
      return;
    }
    const signageRect = nodes.signage.getBoundingClientRect();
    const scale = signageRect.width > 0 ? signageRect.width / 1280 : 1;
    nodes.signage.querySelectorAll(".new-rect-panel, .new-forecast-preview").forEach((panel) => {
      const rect = panel.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      panel.style.setProperty("--motion-glass-x", `${-((rect.left - signageRect.left) / scale).toFixed(2)}px`);
      panel.style.setProperty("--motion-glass-y", `${-((rect.top - signageRect.top) / scale).toFixed(2)}px`);
    });
    nodes.signage.classList.add("is-glass-motion");
  }

  function releaseMotionGlass() {
    cancelMotionGlassRelease();
    if (!nodes.signage.classList.contains("is-glass-motion") && !nodes.signage.classList.contains("is-live-glass-motion")) return;
    // Keep the transition glass for two paint frames so the original window can
    // resume backdrop sampling without a one-frame flash on Android WebView.
    motionGlassReleaseRaf = requestAnimationFrame(() => {
      motionGlassReleaseRaf = requestAnimationFrame(() => {
        motionGlassReleaseRaf = 0;
        nodes.signage.classList.remove("is-glass-motion", "is-live-glass-motion");
        clearLiveGlassProxies();
      });
    });
  }

  function showPageImmediately(name) {
    const next = nodes.pages.find((page) => page.dataset.page === name);
    if (!next) return false;
    clearTimeout(pageTransitionTimer);
    cancelMotionGlassRelease();
    if (dragRenderRaf) cancelAnimationFrame(dragRenderRaf);
    dragRenderRaf = 0;
    isTransitioning = false;
    preparePageContent(name);
    commitPageState(name);
    for (const page of nodes.pages) {
      page.classList.remove(...TRANSITION_CLASSES, "is-drag-preview");
      page.style.removeProperty("transition");
      page.style.removeProperty("transform");
      page.classList.toggle("is-active", page === next);
      page.setAttribute("aria-hidden", String(page !== next));
    }
    nodes.signage.classList.remove("is-transitioning", "is-rich-dragging", "is-rich-settling", "is-rich-cleanup", "is-glass-motion", "is-live-glass-motion");
    clearLiveGlassProxies();
    return true;
  }

  function animateLightNavigation(name) {
    const previous = nodes.pages.find((page) => page.dataset.page === activePage);
    const next = nodes.pages.find((page) => page.dataset.page === name);
    if (!previous || !next) return false;
    preparePageContent(name);
    beginMotionGlass();
    isTransitioning = true;
    nodes.signage.classList.add("is-transitioning");
    clearTimeout(pageTransitionTimer);
    for (const page of nodes.pages) page.classList.remove(...TRANSITION_CLASSES);
    // Commit the initial live-glass frame before changing opacity. Without this
    // paint boundary, Chromium can coalesce creation and fade into an instant jump.
    if (nodes.motionGlassLayer) void nodes.motionGlassLayer.offsetWidth;
    previous.classList.add("light-fade-out");
    syncLiveGlassProxies(
      { [activePage]: { offset: 0, opacity: 0 } },
      "opacity 165ms cubic-bezier(.4,0,.8,.55)",
    );

    pageTransitionTimer = window.setTimeout(() => {
      previous.classList.remove("is-active", "light-fade-out");
      previous.setAttribute("aria-hidden", "true");
      next.classList.add("is-active", "light-fade-in", "light-fade-entering");
      next.setAttribute("aria-hidden", "false");
      syncLiveGlassProxies({ [name]: { offset: 0, opacity: 0 } });
      void next.offsetWidth;
      requestAnimationFrame(() => {
        next.classList.remove("light-fade-in");
        syncLiveGlassProxies(
          { [name]: { offset: 0, opacity: 1 } },
          "opacity 250ms cubic-bezier(.16,.72,.22,1)",
        );
      });
      commitPageState(name);

      pageTransitionTimer = window.setTimeout(() => {
        for (const page of nodes.pages) page.classList.remove(...TRANSITION_CLASSES);
        isTransitioning = false;
        nodes.signage.classList.remove("is-transitioning");
        releaseMotionGlass();
      }, 270);
    }, 165);
    return true;
  }

  function showPage(name) {
    if (name === activePage || isTransitioning) return false;
    closeTrainDetail();
    const mode = animationMode();
    if (mode === "off") return showPageImmediately(name);
    if (mode === "rich") return animateRichNavigation(name);
    return animateLightNavigation(name);
  }

  function animateRichNavigation(name) {
    if (name === activePage || isTransitioning) return false;
    const previousName = activePage;
    const previous = nodes.pages.find((page) => page.dataset.page === previousName);
    const next = nodes.pages.find((page) => page.dataset.page === name);
    if (!previous || !next) return false;
    const direction = PAGE_SIDE[name] > PAGE_SIDE[previousName] ? 1 : -1;
    const duration = 540;
    preparePageContent(name);
    beginMotionGlass();
    isTransitioning = true;
    nodes.signage.classList.add("is-transitioning", "is-rich-settling");
    for (const page of nodes.pages) page.classList.remove(...TRANSITION_CLASSES);
    next.classList.add("is-active", "is-drag-preview");
    next.setAttribute("aria-hidden", "false");
    previous.style.transition = "none";
    next.style.transition = "none";
    previous.style.transform = "translate3d(0,0,0)";
    next.style.transform = `translate3d(${direction * 1280}px,0,0)`;
    syncLiveGlassProxies({ [previousName]: 0, [name]: direction * 1280 });
    void next.offsetWidth;
    previous.style.transition = `transform ${duration}ms cubic-bezier(.18,.76,.16,1)`;
    next.style.transition = `transform ${duration}ms cubic-bezier(.18,.76,.16,1)`;
    requestAnimationFrame(() => {
      previous.style.transform = `translate3d(${-direction * 1280}px,0,0)`;
      next.style.transform = "translate3d(0,0,0)";
      syncLiveGlassProxies(
        { [previousName]: -direction * 1280, [name]: 0 },
        `left ${duration}ms cubic-bezier(.18,.76,.16,1)`,
      );
    });
    clearTimeout(pageTransitionTimer);
    pageTransitionTimer = window.setTimeout(() => {
      commitPageState(name);
      isTransitioning = false;
      clearDragPresentation();
    }, duration + 35);
    return true;
  }

  function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    if (isPinned && activePage !== "home") return;
    inactivityTimer = window.setTimeout(() => {
      const settingsDialog = document.querySelector("#settingsDialog");
      if (settingsDialog && !settingsDialog.hidden) {
        resetInactivityTimer();
        return;
      }
      if (activePage !== "home") showPage("home");
    }, inactivityDelay);
  }

  function pageForSwipe(dx) {
    if (activePage === "home") return dx < 0 ? "weather" : "commute";
    if (activePage === "commute" && dx < 0) return "home";
    if (activePage === "weather" && dx > 0) return "home";
    return null;
  }

  function isCommittedSwipe(dx, dy, elapsed) {
    const minimumDistance = elapsed <= 420 ? 24 : 42;
    return Math.abs(dx) >= minimumDistance && Math.abs(dx) > Math.abs(dy) * 0.72;
  }

  function clearDragPresentation() {
    if (dragRenderRaf) cancelAnimationFrame(dragRenderRaf);
    dragRenderRaf = 0;
    nodes.signage.classList.add("is-rich-cleanup");
    for (const page of nodes.pages) {
      page.classList.remove("is-drag-preview");
      page.style.removeProperty("transition");
      page.style.removeProperty("transform");
      page.classList.toggle("is-active", page.dataset.page === activePage);
      page.setAttribute("aria-hidden", String(page.dataset.page !== activePage));
    }
    void nodes.signage.offsetWidth;
    nodes.signage.classList.remove("is-rich-dragging", "is-rich-settling", "is-rich-cleanup", "is-transitioning");
    releaseMotionGlass();
  }

  function renderRichDragFrame() {
    dragRenderRaf = 0;
    if (!dragState?.moved || animationMode() !== "rich") return;
    const dx = dragState.dx;
    const nextTargetName = pageForSwipe(dx);
    if (nextTargetName && dragState.targetName !== nextTargetName) preparePageContent(nextTargetName);
    if (dragState.targetName && dragState.targetName !== nextTargetName) {
      const oldTarget = nodes.pages.find((page) => page.dataset.page === dragState.targetName);
      oldTarget?.classList.remove("is-drag-preview");
      oldTarget?.style.removeProperty("transform");
    }
    dragState.targetName = nextTargetName;
    const current = nodes.pages.find((page) => page.dataset.page === activePage);
    const target = dragState.targetName ? nodes.pages.find((page) => page.dataset.page === dragState.targetName) : null;
    if (!nodes.signage.classList.contains("is-live-glass-motion")) beginMotionGlass();
    nodes.signage.classList.add("is-rich-dragging");
    const currentOffset = target ? dx : dx * 0.14;
    if (current) current.style.transform = `translate3d(${currentOffset}px,0,0)`;
    if (target) {
      const base = PAGE_SIDE[dragState.targetName] > PAGE_SIDE[activePage] ? 1280 : -1280;
      target.classList.add("is-drag-preview");
      target.style.transform = `translate3d(${base + dx}px,0,0)`;
      syncLiveGlassProxies({ [activePage]: currentOffset, [dragState.targetName]: base + dx });
    } else {
      syncLiveGlassProxies({ [activePage]: currentOffset });
    }
  }

  function settleRichSwipe(targetName, dx, commit) {
    const previousName = activePage;
    const previous = nodes.pages.find((page) => page.dataset.page === previousName);
    const target = targetName ? nodes.pages.find((page) => page.dataset.page === targetName) : null;
    const remaining = commit ? 1280 - Math.min(1280, Math.abs(dx)) : Math.min(1280, Math.abs(dx));
    const duration = Math.max(260, Math.min(520, 230 + remaining * 0.22));
    nodes.signage.classList.remove("is-rich-dragging");
    nodes.signage.classList.add("is-rich-settling");
    isTransitioning = true;
    if (previous) previous.style.transition = `transform ${duration}ms cubic-bezier(.2,.8,.2,1)`;
    if (target) target.style.transition = `transform ${duration}ms cubic-bezier(.2,.8,.2,1)`;
    requestAnimationFrame(() => {
      if (commit && target) {
        const finalDirection = PAGE_SIDE[targetName] > PAGE_SIDE[previousName] ? -1 : 1;
        target.classList.add("is-active", "is-drag-preview");
        target.setAttribute("aria-hidden", "false");
        previous.style.transform = `translate3d(${finalDirection * 1280}px,0,0)`;
        target.style.transform = "translate3d(0,0,0)";
        syncLiveGlassProxies(
          { [previousName]: finalDirection * 1280, [targetName]: 0 },
          `left ${duration}ms cubic-bezier(.2,.8,.2,1)`,
        );
      } else {
        previous.style.transform = "translate3d(0,0,0)";
        if (target) {
          const base = PAGE_SIDE[targetName] > PAGE_SIDE[previousName] ? 1280 : -1280;
          target.style.transform = `translate3d(${base}px,0,0)`;
          syncLiveGlassProxies(
            { [previousName]: 0, [targetName]: base },
            `left ${duration}ms cubic-bezier(.2,.8,.2,1)`,
          );
        } else {
          syncLiveGlassProxies(
            { [previousName]: 0 },
            `left ${duration}ms cubic-bezier(.2,.8,.2,1)`,
          );
        }
      }
    });
    clearTimeout(pageTransitionTimer);
    pageTransitionTimer = window.setTimeout(() => {
      if (commit && target) {
        commitPageState(targetName);
      }
      isTransitioning = false;
      clearDragPresentation();
    }, duration + 35);
  }

  function setupNavigation() {
    $("#newGoCommute")?.addEventListener("click", () => showPage("commute"));
    $("#newGoWeather")?.addEventListener("click", () => showPage("weather"));
    $("#newClockTap")?.addEventListener("click", () => showPage("commute"));
    $("#newWeatherTap")?.addEventListener("click", () => showPage("weather"));
    nodes.garbageWidget?.addEventListener("click", openGarbageSchedule);
    nodes.garbageClose?.addEventListener("click", closeGarbageSchedule);
    nodes.sheetDismiss?.addEventListener("click", () => {
      if (isTransitioning || performance.now() < suppressClickUntil) return;
      closeGarbageSchedule();
      closeSmartSheet();
    });
    document.addEventListener("pointerdown", (event) => {
      if (nodes.signage?.contains(event.target) || (!timerTarget && !garbageSheetOpen && !smartSheetOpen)) return;
      outsideDismissUntil = performance.now() + 500;
      event.preventDefault();
      event.stopPropagation();
      if (timerTarget) closeTimerSheet();
      else { closeGarbageSchedule(); closeSmartSheet(); }
    }, true);
    document.addEventListener("click", (event) => {
      if (nodes.signage?.contains(event.target) || performance.now() > outsideDismissUntil) return;
      event.preventDefault();
      event.stopPropagation();
    }, true);
    nodes.remoExpand?.addEventListener("click", openSmartSheet);
    nodes.smartClose?.addEventListener("click", closeSmartSheet);
    nodes.timerClose?.addEventListener("click", closeTimerSheet);
    nodes.timerDismiss?.addEventListener("click", () => {
      if (isTransitioning || performance.now() < suppressClickUntil) return;
      closeTimerSheet();
    });
    nodes.timerSheet?.addEventListener("pointerdown", (event) => {
      if (!timerTarget || event.button !== 0 || event.target.closest("button,input,select,textarea,a")) return;
      timerDrag = { id: event.pointerId, y: event.clientY, distance: 0 };
      nodes.timerSheet.setPointerCapture?.(event.pointerId);
    });
    nodes.timerSheet?.addEventListener("pointermove", (event) => {
      if (!timerDrag || event.pointerId !== timerDrag.id) return;
      timerDrag.distance = Math.max(0, event.clientY - timerDrag.y);
      if (timerDrag.distance < 6) return;
      event.preventDefault();
      if (animationMode() === "rich") {
        nodes.timerSheet.style.transition = "none";
        nodes.timerSheet.style.transform = `translate3d(0, ${timerDrag.distance}px, 0)`;
        nodes.timerSheet.style.opacity = String(Math.max(.72, 1 - timerDrag.distance / 650));
      }
    });
    const finishTimerDrag = (event) => {
      if (!timerDrag || event.pointerId !== timerDrag.id) return;
      const distance = timerDrag.distance;
      timerDrag = null;
      if (event.type !== "pointercancel" && distance >= 95) { closeTimerSheet(true); return; }
      nodes.timerSheet.style.removeProperty("transition");
      nodes.timerSheet.style.removeProperty("transform");
      nodes.timerSheet.style.removeProperty("opacity");
    };
    nodes.timerSheet?.addEventListener("pointerup", finishTimerDrag);
    nodes.timerSheet?.addEventListener("pointercancel", finishTimerDrag);
    nodes.timerPresets?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-timer-minutes]");
      if (button) scheduleTimer(Number(button.dataset.timerMinutes));
    });
    nodes.timerCustomSet?.addEventListener("click", () => scheduleTimer(Number(nodes.timerCustomMinutes.value)));
    nodes.timerPending?.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-cancel-schedule]");
      if (!button) return;
      await cancelListedSchedule(button.dataset.cancelSchedule);
    });
    nodes.smartScheduleList?.addEventListener("click", () => {
      const show = nodes.smartReservations.hidden;
      showSmartReservations(show);
      if (!show) renderSmartSheet();
    });
    nodes.smartReservationsBack?.addEventListener("click", () => { showSmartReservations(false); renderSmartSheet(); });
    nodes.smartReservationsRefresh?.addEventListener("click", async () => {
      nodes.smartReservationsRefresh.disabled = true;
      nodes.smartReservationsStatus.textContent = "予約を同期しています…";
      await window.MoriyaGithubSync?.refresh?.();
      renderSmartReservations();
    });
    nodes.smartReservationsRows?.addEventListener("click", async event => {
      const button = event.target.closest("[data-cancel-schedule]");
      if (button) await cancelListedSchedule(button.dataset.cancelSchedule);
    });
    document.addEventListener("moriya-smart-schedule-sync-status", () => { if (!nodes.smartReservations.hidden) renderSmartReservations(); });
    document.addEventListener("moriya-smart-schedules-change", () => {
      syncScheduledButtons();
      if (timerTarget) renderTimerSheet();
      if (!nodes.smartReservations.hidden) renderSmartReservations();
    });
    document.addEventListener("moriya-smart-device-states-change", syncPowerIndicators);
    installActionLongPress(nodes.remoActions, "[data-nature-action]", "home");
    installActionLongPress(nodes.smartList, "[data-smart-index]", "panel");
    setupSmartTileReorder();
    nodes.smartSort?.addEventListener("click", () => {
      smartSortMode = !smartSortMode;
      renderSmartSheet();
    });
    nodes.smartAdd?.addEventListener("click", () => openSmartEditor());
    nodes.smartCancel?.addEventListener("click", () => { nodes.smartEditor.hidden = true; });
    nodes.smartSave?.addEventListener("click", () => {
      const label = nodes.smartLabel.value.trim();
      const choice = nodes.smartAction.value === "" ? null : smartEditorChoices[Number(nodes.smartAction.value)];
      if (!label || !choice) { nodes.smartEditorStatus.textContent = "表示名と操作を選択してください。"; return; }
      const actions = window.MoriyaSmartHome.getActions();
      const usedSlots = new Set(actions.map((entry) => entry.slot));
      const item = { id: smartEditIndex >= 0 ? actions[smartEditIndex]?.id : undefined, slot: smartEditIndex >= 0 ? actions[smartEditIndex]?.slot : Array.from({ length: 36 }, (_, slot) => slot).find((slot) => !usedSlots.has(slot)), label, icon: nodes.smartIcon.value, badge: nodes.smartBadge.value, action: choice.action };
      if (smartEditIndex < 0) actions.push(item);
      else {
        if (JSON.stringify(actions[smartEditIndex]?.action) !== JSON.stringify(item.action)) {
          window.MoriyaSmartHome.pendingFor("panel", smartEditIndex).forEach((entry) => window.MoriyaSmartHome.cancelSchedule(entry.id));
        }
        actions[smartEditIndex] = item;
      }
      window.MoriyaSmartHome.saveActions(actions);
      nodes.smartEditor.hidden = true;
      renderSmartSheet();
    });
    nodes.smartList?.addEventListener("click", (event) => {
      if (performance.now() < suppressActionClickUntil) return;
      const tile = event.target.closest("[data-smart-index]");
      if (!tile) return;
      const index = Number(tile.dataset.smartIndex);
      const actions = window.MoriyaSmartHome.getActions();
      if (event.target.closest("[data-smart-delete]")) {
        window.MoriyaSmartHome.pendingFor("panel", index).forEach((entry) => window.MoriyaSmartHome.cancelSchedule(entry.id));
        actions.splice(index, 1);
        window.MoriyaSmartHome.saveActions(actions);
        return;
      }
      if (smartSortMode) openSmartEditor(index);
      else {
        tile.classList.add("is-sending");
        void window.MoriyaSmartHome.send(index).then((sent) => {
          tile.classList.remove("is-sending");
          tile.classList.add(sent ? "is-sent" : "is-error");
          window.setTimeout(() => tile.classList.remove("is-sent", "is-error"), 1100);
        });
      }
      resetInactivityTimer();
    });
    nodes.smartList?.addEventListener("keydown", (event) => {
      if (!["Enter", " "].includes(event.key) || event.target !== event.target.closest("[data-smart-index]")) return;
      event.preventDefault();
      event.target.click();
    });
    document.addEventListener("moriya-smart-home-actions-change", renderSmartSheet);
    nodes.remoActions?.addEventListener("click", (event) => {
      if (performance.now() < suppressActionClickUntil) return;
      const button = event.target.closest("[data-nature-action]");
      if (!button || button.disabled) return;
      void window.MoriyaNatureRemo?.send?.(Number(button.dataset.natureAction));
      resetInactivityTimer();
    });
    nodes.trains?.addEventListener("scroll", () => {
      scheduleTrainScrollReset();
      resetInactivityTimer();
    }, { passive: true });
    nodes.trains?.addEventListener("click", (event) => {
      const row = event.target.closest("[data-train-time]");
      if (row && performance.now() >= suppressClickUntil) openTrainDetail(row.dataset.trainTime);
    });
    nodes.trains?.addEventListener("keydown", (event) => {
      if (!["Enter", " "].includes(event.key) || !event.target.matches("[data-train-time]")) return;
      event.preventDefault();
      openTrainDetail(event.target.dataset.trainTime);
    });
    nodes.trainDetailClose?.addEventListener("click", closeTrainDetail);
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeTrainDetail(); });
    let trainDetailSwipe = null;
    nodes.trainBoard?.addEventListener("pointerdown", (event) => {
      if (!nodes.trainBoard.classList.contains("is-detail") || event.target.closest("button")) return;
      trainDetailSwipe = { id: event.pointerId, x: event.clientX, y: event.clientY };
    });
    nodes.trainBoard?.addEventListener("pointerup", (event) => {
      if (!trainDetailSwipe || event.pointerId !== trainDetailSwipe.id) return;
      const dx = event.clientX - trainDetailSwipe.x;
      const dy = event.clientY - trainDetailSwipe.y;
      trainDetailSwipe = null;
      if (dx > 60 && Math.abs(dx) > Math.abs(dy) * 1.3) closeTrainDetail();
    });
    nodes.trainBoard?.addEventListener("pointercancel", () => { trainDetailSwipe = null; });
    $("[data-open-today-schedule]")?.addEventListener("click", (event) => {
      const button = event.currentTarget;
      if (button.disabled || scheduleIsHidden()) return;
      renderCalendarDaySheet(button.dataset.calendarDate || tokyoDateKey(now()));
      resetInactivityTimer();
    });
    document.querySelectorAll("[data-new-home]").forEach((button) => button.addEventListener("click", () => showPage("home")));
    nodes.pinButtons.forEach((button) => button.addEventListener("click", () => {
      isPinned = !isPinned;
      syncPinButtons();
      resetInactivityTimer();
    }));
    nodes.settingsButton?.addEventListener("click", () => {
      openSettings();
      nodes.settingsButton.setAttribute("aria-expanded", "true");
    });
    $("#viewportShell")?.addEventListener("click", (event) => {
      if ($("#viewportShell")?.dataset.mode !== "new" || !$("#settingsDialog")?.hidden) return;
      if (event.target.closest("button, input, select, textarea, a, label")) return;
      const edgeWidth = Math.max(32, Math.min(72, window.innerWidth * 0.06));
      if (event.clientX <= edgeWidth) {
        if (activePage === "home") showPage("commute");
        else if (activePage === "weather") showPage("home");
      } else if (event.clientX >= window.innerWidth - edgeWidth) {
        if (activePage === "home") showPage("weather");
        else if (activePage === "commute") showPage("home");
      }
    });

    nodes.signage.addEventListener("pointerdown", (event) => {
      if (isTransitioning) return;
      if (event.target.closest(".new-train-board.is-detail, .new-train-back, .new-home-button, .new-pin-button, .new-settings-button, .new-smart-tile, .new-smart-editor, .new-month-step, .new-month-current, [data-close-day], [data-open-today-schedule], input, select, textarea, a")) return;
      dragState = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        dx: 0,
        dy: 0,
        startedAt: performance.now(),
        targetName: null,
        moved: false,
      };
    });
    nodes.signage.addEventListener("pointermove", (event) => {
      if (!dragState || dragState.pointerId !== event.pointerId) return;
      const dx = Math.max(-1280, Math.min(1280, event.clientX - dragState.startX));
      const dy = event.clientY - dragState.startY;
      if (!dragState.moved && Math.abs(dx) < 4) return;
      if (!dragState.moved && Math.abs(dx) < Math.abs(dy) * 0.8) return;
      dragState.moved = true;
      nodes.signage.setPointerCapture?.(event.pointerId);
      dragState.dx = dx;
      dragState.dy = dy;
      if (animationMode() !== "rich") {
        event.preventDefault();
        return;
      }
      if (!dragRenderRaf) dragRenderRaf = requestAnimationFrame(renderRichDragFrame);
      event.preventDefault();
    }, { passive: false });
    nodes.signage.addEventListener("pointerup", (event) => {
      if (!dragState || dragState.pointerId !== event.pointerId) return;
      const dx = dragState.moved ? dragState.dx : event.clientX - dragState.startX;
      const dy = dragState.moved ? dragState.dy : event.clientY - dragState.startY;
      const elapsed = performance.now() - dragState.startedAt;
      if (animationMode() === "rich" && dragState.moved) {
        if (dragRenderRaf) cancelAnimationFrame(dragRenderRaf);
        renderRichDragFrame();
        suppressClickUntil = performance.now() + 420;
        const targetName = dragState.targetName;
        const commit = Boolean(targetName) && isCommittedSwipe(dx, dy, elapsed);
        settleRichSwipe(targetName, dx, commit);
        dragState = null;
        return;
      }
      dragState = null;
      if (!isCommittedSwipe(dx, dy, elapsed)) return;
      suppressClickUntil = performance.now() + 420;
      if (activePage === "home" && dx < 0) showPage("weather");
      else if (activePage === "home" && dx > 0) showPage("commute");
      else if (activePage === "commute" && dx < 0) showPage("home");
      else if (activePage === "weather" && dx > 0) showPage("home");
    });
    nodes.signage.addEventListener("pointercancel", () => {
      if (dragState?.moved && animationMode() === "rich") {
        if (dragRenderRaf) cancelAnimationFrame(dragRenderRaf);
        renderRichDragFrame();
        settleRichSwipe(dragState.targetName, dragState.dx, false);
      } else if (dragState?.moved) {
        const elapsed = performance.now() - dragState.startedAt;
        if (isCommittedSwipe(dragState.dx, dragState.dy, elapsed)) {
          const targetName = pageForSwipe(dragState.dx);
          if (targetName) showPage(targetName);
        }
      }
      dragState = null;
    });
    nodes.signage.addEventListener("click", (event) => {
      if (performance.now() >= suppressClickUntil) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
    ["pointerdown", "keydown", "wheel"].forEach((eventName) => window.addEventListener(eventName, resetInactivityTimer, { passive: true }));
    syncPinButtons();
    resetInactivityTimer();
  }

  const originalApplyWeather = window.applyWeather;
  if (typeof originalApplyWeather === "function") {
    window.applyWeather = (payload) => {
      originalApplyWeather(payload);
      renderNewWeather(payload);
    };
  }

  const originalRenderTrains = window.renderTrains;
  if (typeof originalRenderTrains === "function") {
    window.renderTrains = (force = false) => {
      originalRenderTrains(force);
      renderNewTrains();
    };
  }

  const originalRenderEvents = window.renderEvents;
  if (typeof originalRenderEvents === "function") {
    window.renderEvents = (events, source) => {
      originalRenderEvents(events, source);
      renderNewCalendars(events, source);
    };
  }

  const floatingLayer = $("#newFloatingLayer");
  if (floatingLayer) {
    [nodes.sheetDismiss, nodes.garbageSheet, nodes.smartSheet, nodes.timerDismiss, nodes.timerSheet, nodes.smartToast]
      .filter(Boolean).forEach((node) => floatingLayer.append(node));
  }
  setupNavigation();
  syncNewClock();
  renderNewTrains();
  renderNewCalendars();
  renderMarket(window.__moriyaMarketPayload || { enabled: ["market", "hybrid"].includes(settings.homeInfoMode), items: settings.market?.items || [], stale: true });
  renderNatureRemo(window.__moriyaNatureRemoPayload || { enabled: ["remo", "hybrid"].includes(settings.homeInfoMode), actions: settings.natureRemo?.actions || [] });
  renderGarbage();
  applyNewBackground(3);

  const requestedPage = preview.get("screen");
  if (requestedPage === "commute") showPage("commute");
  if (requestedPage === "weather") showPage("weather");

  window.addEventListener("resize", updateNewEventScroll);
  window.addEventListener('resize', () => { updateMarketLabels(nodes.marketItems); updateMarketLabels(nodes.hybridMarket); });
  document.addEventListener("visibilitychange", () => {
    scheduleBackgroundRotation(backgroundRotationItemCount);
    if (!document.hidden) applyNewBackground(lastBackgroundWeatherCode);
  });
  document.addEventListener("moriya-settings-visibility", () => {
    if (settingsAreOpen()) {
      window.clearInterval(backgroundRotationTimer);
      backgroundRotationTimer = 0;
      return;
    }
    applyNewBackground(lastBackgroundWeatherCode);
    scheduleBackgroundRotation(backgroundRotationItemCount);
  });
  document.addEventListener("moriya-local-video-change", () => applyNewBackground(lastBackgroundWeatherCode));
  document.addEventListener("moriya-market-data", (event) => renderMarket(event.detail));
  document.addEventListener("moriya-nature-remo-data", (event) => renderNatureRemo(event.detail));
  document.addEventListener("moriya-nature-action-state", (event) => {
    if (event.detail?.state === "error") {
      if (event.detail?.source === "home") showHomeSmartError(event.detail?.message);
      else showSmartToast(event.detail?.message || "家電を操作できませんでした。");
    } else if (event.detail?.source === "home" && event.detail?.state === "sent" && nodes.homeSmartError) {
      nodes.homeSmartError.hidden = true;
    }
    if (event.detail?.source !== "home") return;
    const button = nodes.remoActions?.querySelector(`[data-nature-action="${event.detail?.index}"]`);
    if (!button) return;
    button.disabled = event.detail?.state === "sending" || button.dataset.configured !== "true";
    const status = button.querySelector("small");
    if (status) status.textContent = event.detail?.state === "sending" ? "送信中" : event.detail?.state === "sent" ? "完了" : event.detail?.state === "error" ? "失敗" : "操作";
    button.classList.toggle("is-sending", event.detail?.state === "sending");
    button.classList.toggle("is-sent", event.detail?.state === "sent");
    button.classList.toggle("is-error", event.detail?.state === "error");
  });
  document.addEventListener("moriya-tick", (event) => {
    syncNewClock();
    const tickDate = event.detail?.date || now();
    const dateKey = `${tokyoDateKey(tickDate)}:${Number(tokyoParts(tickDate).hour) >= 12 ? "pm" : "am"}`;
    if (dateKey !== lastGarbageDateKey) {
      lastGarbageDateKey = dateKey;
      renderGarbage();
    }
    const minuteKey = event.detail?.minuteKey || "";
    if (minuteKey && minuteKey !== lastVideoScheduleMinute) {
      lastVideoScheduleMinute = minuteKey;
      applyNewBackground(lastBackgroundWeatherCode);
    }
  });

  window.MoriyaNewUi = {
    renderCalendars: renderNewCalendars,
    renderTrains: renderNewTrains,
    showPage,
    getActivePage: () => activePage,
    resetInactivityTimer,
    renderMarket,
    renderNatureRemo,
    renderGarbage,
  };

  const backgroundReady = new Promise((resolve) => {
    const image = new Image();
    image.onload = image.onerror = resolve;
    image.src = "./assets/backgrounds/cloudy-forest-1.webp";
  });
  Promise.race([
    Promise.all([document.fonts?.ready || Promise.resolve(), backgroundReady]),
    new Promise((resolve) => setTimeout(resolve, 1300)),
  ]).then(() => requestAnimationFrame(() => requestAnimationFrame(() => nodes.startupVeil?.classList.add("is-ready"))));
})();
