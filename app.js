const DEFAULT_SETTINGS = {
  font: "lineSeed",
  numberFont: "lineSeed",
  clockFont: "lineSeed",
  fontWeight: "700",
  numberFontWeight: "400",
  clockFontWeight: "100",
  icalUrl: "",
  trainOffsetMinutes: 10,
  trainAlerts: { orangeMinutes: 19, redMinutes: 15, orangeColor: "#d19862", redColor: "#c86363" },
  backgroundImage: "",
  backgroundImages: [],
  backgroundSlideshowSeconds: 120,
  homeInfoMode: "market",
  market: {
    enabled: true,
    items: [
      { label: "USD / JPY", symbol: "JPY=X" },
      { label: "S&P 500", symbol: "^GSPC" },
      { label: "日経平均", symbol: "^N225" },
    ],
  },
  natureRemo: {
    token: "",
    temperatureDeviceId: "",
    actionCount: 3,
    scenes: [],
    panelActions: [],
    gridColumns: 9,
    actions: [
      { label: "照明", icon: "auto", action: null },
      { label: "テレビ", icon: "auto", action: null },
      { label: "エアコン", icon: "auto", action: null },
      { label: "シーン", icon: "scene", action: null },
    ],
  },
  switchBot: { token: "", secret: "" },
  smartLife: {
    endpoint: "https://openapi-ueaz.tuyaus.com",
    accessId: "",
    accessSecret: "",
    userId: "",
    deviceIds: "",
  },
  garbage: { homeEnabled: true },
  videoQuietHours: { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] },
  backgroundThemes: {
    sunny: ["sunny-komorebi-color.webp"],
    cloudy: ["cloudy-forest-1.webp"],
    rain: ["rain-window-2.webp"],
    nightClear: ["night-clear-milkyway.webp"],
    nightCloudy: ["night-cloudy-1.webp"],
    nightRain: ["night-rain-1.webp"],
  },
  display: { mode: "new", profile: "standard", forecastMode: "hourly", schedulePanelMode: "calendar", animationMode: "light", reduceMotion: false, hideSchedule: false, windowOnlyBlur: false, localVideoBeta: false, richBlur: 23, richTransparency: 87 },
  android: { keepAwake: true },
  weather: { name: "茨城県 守谷市", latitude: 35.9514, longitude: 139.9754 },
  debug: { enabled: false, dateTime: "", weatherCode: "", temperature: "", clockBaseMs: null, clockStartedAtMs: null, events: [] },
};

const LIVE_POWER_DAYS = [
  ["mon", "月"], ["tue", "火"], ["wed", "水"], ["thu", "木"],
  ["fri", "金"], ["sat", "土"], ["sun", "日"],
];

const NATURE_ICON_OPTIONS = [
  ["auto", "操作に合わせる"], ["power", "電源"], ["light", "照明"], ["tv", "テレビ"],
  ["ac", "エアコン"], ["fan", "扇風機"], ["fanOscillate", "扇風機の首振り"], ["nhk", "NHK"], ["curtain", "カーテン"], ["music", "音楽"], ["scene", "シーン"], ["timer", "タイマー"],
  ["minus", "－"], ["plus", "＋"], ["left", "＜"], ["right", "＞"], ["up", "上"], ["down", "下"],
  ["on", "ON"], ["off", "OFF"], ["play", "再生"], ["pause", "一時停止"], ["mute", "消音"],
  ["sofa", "ソファ"], ["bed", "ベッド"], ["wallLight", "壁を照らす照明"], ["ambientLight", "間接照明"],
];
const NATURE_BADGE_OPTIONS = [["none", "なし"], ["on", "ON"], ["off", "OFF"], ["plus", "＋"], ["minus", "－"], ["left", "＜"], ["right", "＞"], ["up", "上"], ["down", "下"], ["power", "電源"], ["timer", "タイマー"]];
const SMART_GRID_SLOTS = 36;

function natureActionGraphic(kind) {
  const common = 'viewBox="0 0 32 32" aria-hidden="true" focusable="false"';
  const shape = {
    light: '<path d="M10.5 21.4h11M12.6 25h6.8M16 3.5a9 9 0 0 0-5.4 16.2c1.3 1 1.9 2.2 1.9 3.3h7c0-1.1.6-2.3 1.9-3.3A9 9 0 0 0 16 3.5Z"/>',
    tv: '<rect x="4.5" y="7" width="23" height="16" rx="1.5"/><path d="m11 3 5 4 5-4M12 27h8"/>',
    ac: '<rect x="3" y="5" width="26" height="13" rx="2"/><path d="M4 13h24M8 16h16M23 9h2"/>',
    fan: '<circle cx="16" cy="12" r="9"/><circle cx="16" cy="12" r="1.8"/><path d="M16 10V6M18 12h4M16 14v4M14 12h-4M16 21v6M10 29h12"/>',
    fanOscillate: '<circle cx="16" cy="10" r="7"/><circle cx="16" cy="10" r="1.4"/><path d="M16 8V5M18 10h3M16 12v3M14 10h-3M16 17v10M11 29h10M3 20h8M3 20l3-3M3 20l3 3M29 20h-8M29 20l-3-3M29 20l-3 3"/>',
    nhk: '<path d="M2 23V9l7 14V9M12 9v14M19 9v14M12 16h7M22 9v14M29 9l-7 7 7 7"/>',
    timer: '<circle cx="16" cy="18" r="10"/><path d="M12 3h8M16 3v5M24 7l2-2M16 12v6l4 2"/>',
    curtain: '<path d="M5 5h22M7 6v21M25 6v21M7 7c6 4 6 12 0 19M25 7c-6 4-6 12 0 19M16 6v21"/>',
    music: '<path d="M13 24V8l13-3v15M13 13l13-3"/><ellipse cx="9.5" cy="24" rx="3.5" ry="2.5"/><ellipse cx="22.5" cy="20" rx="3.5" ry="2.5"/>',
    scene: '<path d="m16 3 2.2 7.2L25 13l-6.8 2.8L16 23l-2.2-7.2L7 13l6.8-2.8L16 3ZM25 21l.9 2.9L29 25l-3.1 1.1L25 29l-.9-2.9L21 25l3.1-1.1L25 21Z"/>',
    minus: '<path d="M5 16h22"/>', plus: '<path d="M5 16h22M16 5v22"/>',
    left: '<path d="m20 5-11 11 11 11"/>', right: '<path d="M12 5 23 16 12 27"/>',
    up: '<path d="M5 20 16 9 27 20"/>', down: '<path d="M5 12 16 23 27 12"/>',
    play: '<path d="m9 5 18 11L9 27V5Z"/>', pause: '<path d="M10 5v22M22 5v22"/>',
    mute: '<path d="M5 12h6l7-6v20l-7-6H5v-8ZM23 11l6 10M29 11l-6 10"/>',
    power: '<path d="M16 3v12M9.2 7.7a11 11 0 1 0 13.6 0"/>',
    sofa: '<path d="M5 16V9a3 3 0 0 1 3-3h16a3 3 0 0 1 3 3v7M8 15h16M5 25V14a3 3 0 0 0-3 3v6a2 2 0 0 0 2 2h24a2 2 0 0 0 2-2v-6a3 3 0 0 0-3-3v11M7 25v3M25 25v3"/>',
    bed: '<path d="M3 26V8M29 26V14a3 3 0 0 0-3-3H3M3 17h26M7 11V8a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v3M3 23h26M6 26v2M26 26v2"/>',
    wallLight: '<path d="M5 4v24M11 12h9l-2-6h-5l-2 6ZM15.5 12v3M10 20l-3 5M16 20v7M22 20l3 5M8 28h20"/>',
    ambientLight: '<path d="M11 5h10l2 12H9L11 5ZM16 17v8M11 26h10M8 28h16M6 9 3 7M26 9l3-2"/>',
  };
  if (kind === "on" || kind === "off") return `<svg ${common} data-center-icon><g data-icon-art><text x="16" y="20" text-anchor="middle" font-size="${kind === "off" ? 11 : 13}" font-weight="700" fill="currentColor" stroke="none">${kind.toUpperCase()}</text></g></svg>`;
  return `<svg ${common} data-center-icon><g data-icon-art>${shape[kind] || shape.power}</g></svg>`;
}
window.MoriyaIconGraphic = natureActionGraphic;
window.MoriyaCenterIcons = (root = document) => {
  root.querySelectorAll?.('svg[data-center-icon]').forEach((svg) => {
    const art = svg.querySelector('[data-icon-art]');
    if (!art || svg.dataset.centered === 'true') return;
    try {
      const bounds = art.getBBox();
      if (!bounds.width && !bounds.height) return;
      art.setAttribute('transform', `translate(${(16 - bounds.x - bounds.width / 2).toFixed(3)} ${(16 - bounds.y - bounds.height / 2).toFixed(3)})`);
      svg.dataset.centered = 'true';
    } catch {}
  });
};

const ICAL_FETCHERS = [(url) => url];

const FONT_STACKS = {
  lineSeed: '"LINE Seed JP", "Yu Gothic UI", Meiryo, sans-serif',
  system: 'Inter, "Segoe UI", "Yu Gothic UI", "Hiragino Sans", Meiryo, sans-serif',
  segoe: '"Segoe UI", "Yu Gothic UI", sans-serif',
  yu: '"Yu Gothic UI", "Yu Gothic", "Hiragino Sans", Meiryo, sans-serif',
  meiryo: 'Meiryo, "Yu Gothic UI", sans-serif',
  noto: '"Noto Sans JP", "Yu Gothic UI", Meiryo, sans-serif',
  biz: '"BIZ UDPGothic", "Yu Gothic UI", Meiryo, sans-serif',
  arial: 'Arial, "Yu Gothic UI", sans-serif',
  trebuchet: '"Trebuchet MS", "Yu Gothic UI", sans-serif',
  verdana: 'Verdana, "Yu Gothic UI", sans-serif',
  consolas: 'Consolas, "Cascadia Mono", monospace',
  cascadia: '"Cascadia Code", "Cascadia Mono", Consolas, monospace',
  serif: '"Yu Mincho", "Hiragino Mincho ProN", serif',
};

const FONT_OPTIONS = [
  ["lineSeed", "LINE Seed JP（埋め込み）"],
  ["system", "System UI"],
  ["segoe", "Segoe UI"],
  ["yu", "Yu Gothic UI"],
  ["meiryo", "Meiryo"],
  ["noto", "Noto Sans JP"],
  ["biz", "BIZ UDPGothic"],
  ["arial", "Arial"],
  ["trebuchet", "Trebuchet MS"],
  ["verdana", "Verdana"],
  ["consolas", "Consolas"],
  ["cascadia", "Cascadia"],
  ["serif", "Yu Mincho"],
];

const FONT_WEIGHT_LABELS = {
  100: "Thin 100",
  200: "ExtraLight 200",
  300: "Light 300",
  400: "Regular 400",
  500: "Medium 500",
  600: "SemiBold 600",
  700: "Bold 700",
  800: "ExtraBold 800",
  900: "Black 900",
};

const FONT_WEIGHTS = {
  lineSeed: [100, 400, 700, 800],
  system: [400, 600, 700],
  segoe: [300, 400, 600, 700],
  yu: [400, 700],
  meiryo: [400, 700],
  noto: [100, 300, 400, 500, 700, 900],
  biz: [400, 700],
  arial: [400, 700],
  trebuchet: [400, 700],
  verdana: [400, 700],
  consolas: [400, 700],
  cascadia: [200, 300, 400, 500, 600, 700],
  serif: [400, 700],
};

const MARKET_PRESETS = [
  { symbol: "JPY=X", label: "USD / JPY", name: "ドル円" },
  { symbol: "^N225", label: "日経225", name: "日経225" },
  { symbol: "1306.T", label: "TOPIX ETF", name: "TOPIX連動ETF（1306）" },
  { symbol: "^GSPC", label: "S&P 500", name: "S&P 500" },
  { symbol: "^IXIC", label: "NASDAQ", name: "NASDAQ総合" },
  { symbol: "2559.T", label: "オルカン ETF", name: "MAXIS 全世界株式（2559）" },
  { symbol: "ACWI", label: "MSCI ACWI", name: "iShares 全世界株式（ACWI）" },
];

const BACKGROUND_SAMPLE_GROUPS = window.MORIYA_DISPLAY_THEME.groups;

const HOLIDAYS = new Set([
  "2026-01-01", "2026-01-12", "2026-02-11", "2026-02-23", "2026-03-20",
  "2026-04-29", "2026-05-03", "2026-05-04", "2026-05-05", "2026-05-06",
  "2026-07-20", "2026-08-11", "2026-09-21", "2026-09-22", "2026-09-23",
  "2026-10-12", "2026-11-03", "2026-11-23",
  "2027-01-01", "2027-01-11", "2027-02-11", "2027-02-23", "2027-03-21",
  "2027-03-22", "2027-04-29", "2027-05-03", "2027-05-04", "2027-05-05",
  "2027-07-19", "2027-08-11", "2027-09-20", "2027-09-23", "2027-10-11",
  "2027-11-03", "2027-11-23",
  // 2028年分は、現行の祝日法と国立天文台の長期計算による春分・秋分を使用。
  // 内閣府の正式一覧（2027年2月公開予定）が出たら、この行を照合する。
  "2028-01-01", "2028-01-10", "2028-02-11", "2028-02-23", "2028-03-20",
  "2028-04-29", "2028-05-03", "2028-05-04", "2028-05-05", "2028-07-17",
  "2028-08-11", "2028-09-18", "2028-09-22", "2028-10-09", "2028-11-03",
  "2028-11-23",
]);

const WEATHER_CODES = {
  0: ["快晴", "☀", "sunny"],
  1: ["晴れ", "☀", "sunny"],
  2: ["薄曇り", "◐", "cloudy"],
  3: ["曇り", "☁", "cloudy"],
  45: ["霧", "≋", "cloudy"],
  48: ["霧氷", "≋", "cloudy"],
  51: ["小雨", "☂", "rainy"],
  53: ["雨", "☂", "rainy"],
  55: ["強い雨", "☂", "rainy"],
  61: ["雨", "☂", "rainy"],
  63: ["雨", "☂", "rainy"],
  65: ["大雨", "☂", "rainy"],
  80: ["にわか雨", "☂", "rainy"],
  81: ["にわか雨", "☂", "rainy"],
  82: ["激しい雨", "☂", "rainy"],
  95: ["雷雨", "↯", "storm"],
};

function materialWeatherIconName(code, isNight = false) {
  const numericCode = Number(code);
  if (numericCode === 0) return isNight ? "clear_night" : "sunny";
  if (numericCode === 1 || numericCode === 2) return isNight ? "partly_cloudy_night" : "partly_cloudy_day";
  if (numericCode === 3) return "cloud";
  if (numericCode === 45 || numericCode === 48) return "foggy";
  if (numericCode >= 71 && numericCode <= 77) return "weather_snowy";
  if (numericCode >= 95) return "thunderstorm";
  if ((numericCode >= 51 && numericCode <= 69) || (numericCode >= 80 && numericCode <= 82)) return "rainy";
  return "cloud";
}

const SERVICE_LABELS = { rapid: "快速", semiRapid: "区快", local: "普通" };
const STAGE_WIDTH = 1280;
const STAGE_HEIGHT = 800;
const TOKYO_PARTS_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});
const TOKYO_WEEKDAY_JA_FORMATTER = new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", weekday: "short" });
const TOKYO_WEEKDAY_EN_FORMATTER = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tokyo", weekday: "short" });

const el = {
  shell: document.querySelector("#viewportShell"),
  signage: document.querySelector(".signage"),
  clockHour: document.querySelector("#clockHour"),
  clockMinute: document.querySelector("#clockMinute"),
  seconds: document.querySelector("#seconds"),
  date: document.querySelector("#date"),
  weekday: document.querySelector("#weekday"),
  weatherTitle: document.querySelector("#weatherTitle"),
  weatherIcon: document.querySelector("#weatherIcon"),
  temperature: document.querySelector("#temperature"),
  weatherSummary: document.querySelector("#weatherSummary"),
  weatherDetail: document.querySelector("#weatherDetail"),
  weatherStatus: document.querySelector("#weatherStatus"),
  refreshWeather: document.querySelector("#refreshWeather"),
  forecast: document.querySelector("#forecast"),
  events: document.querySelector("#events"),
  calendarTitle: document.querySelector("#calendarTitle"),
  calendarDateButton: document.querySelector("#calendarDateButton"),
  calendarDateDialog: document.querySelector("#calendarDateDialog"),
  calendarDateInput: document.querySelector("#calendarDateInput"),
  calendarDateClose: document.querySelector("#calendarDateClose"),
  calendarDateApply: document.querySelector("#calendarDateApply"),
  calendarTodayButton: document.querySelector("#calendarTodayButton"),
  calendarStatus: document.querySelector("#calendarStatus"),
  trainLeadLabel: document.querySelector("#trainLeadLabel"),
  nextTrainBox: document.querySelector("#nextTrainBox"),
  nextTrain: document.querySelector("#nextTrain"),
  nextTrainSub: document.querySelector("#nextTrainSub"),
  nextTrainKind: document.querySelector("#nextTrainKind"),
  nextTrainService: document.querySelector("#nextTrainService"),
  nextTrainOrigin: document.querySelector("#nextTrainOrigin"),
  nextTrainNote: document.querySelector("#nextTrainNote"),
  trains: document.querySelector("#trains"),
  trainDayType: document.querySelector("#trainDayType"),
  settingsButton: document.querySelector("#settingsButton"),
  settingsDialog: document.querySelector("#settingsDialog"),
  settingsClose: document.querySelector("#settingsClose"),
  settingsForm: document.querySelector("#settingsForm"),
  displayMode: document.querySelector("#displayMode"),
  displayProfile: document.querySelector("#displayProfile"),
  fontSelect: document.querySelector("#fontSelect"),
  numberFontSelect: document.querySelector("#numberFontSelect"),
  clockFontSelect: document.querySelector("#clockFontSelect"),
  fontWeightSelect: document.querySelector("#fontWeightSelect"),
  numberFontWeightSelect: document.querySelector("#numberFontWeightSelect"),
  clockFontWeightSelect: document.querySelector("#clockFontWeightSelect"),
  syncNumberFont: document.querySelector("#syncNumberFont"),
  loadLocalFonts: document.querySelector("#loadLocalFonts"),
  bodyFontPreview: document.querySelector("#bodyFontPreview"),
  numberFontPreview: document.querySelector("#numberFontPreview"),
  clockFontPreview: document.querySelector("#clockFontPreview"),
  icalUrl: document.querySelector("#icalUrl"),
  hideSchedule: document.querySelector("#hideSchedule"),
  homeInfoMode: document.querySelector("#homeInfoMode"),
  marketSettingsFields: document.querySelector("#marketSettingsFields"),
  marketSettingRow2: document.querySelector("#marketSettingRow2"),
  marketSettingRow3: document.querySelector("#marketSettingRow3"),
  marketPreset3: document.querySelector("#marketPreset3"),
  marketLabel3: document.querySelector("#marketLabel3"),
  marketSymbol3: document.querySelector("#marketSymbol3"),
  marketPreset1: document.querySelector("#marketPreset1"),
  marketLabel1: document.querySelector("#marketLabel1"),
  marketSymbol1: document.querySelector("#marketSymbol1"),
  marketPreset2: document.querySelector("#marketPreset2"),
  marketLabel2: document.querySelector("#marketLabel2"),
  marketSymbol2: document.querySelector("#marketSymbol2"),
  natureRemoSettingsFields: document.querySelector("#natureRemoSettingsFields"),
  natureRemoToken: document.querySelector("#natureRemoToken"),
  natureRemoConnect: document.querySelector("#natureRemoConnect"),
  natureRemoStatus: document.querySelector("#natureRemoStatus"),
  androidAppSettings: document.querySelector("#androidAppSettings"),
  settingsBackupScope: document.querySelector("#settingsBackupScope"),
  settingsBackupText: document.querySelector("#settingsBackupText"),
  settingsBackupStatus: document.querySelector("#settingsBackupStatus"),
  createSettingsBackup: document.querySelector("#createSettingsBackup"),
  copySettingsBackup: document.querySelector("#copySettingsBackup"),
  restoreSettingsBackup: document.querySelector("#restoreSettingsBackup"),
  switchBotToken: document.querySelector("#switchBotToken"),
  switchBotSecret: document.querySelector("#switchBotSecret"),
  switchBotConnect: document.querySelector("#switchBotConnect"),
  switchBotStatus: document.querySelector("#switchBotStatus"),
  tuyaEndpoint: document.querySelector("#tuyaEndpoint"),
  tuyaAccessId: document.querySelector("#tuyaAccessId"),
  tuyaAccessSecret: document.querySelector("#tuyaAccessSecret"),
  tuyaUserId: document.querySelector("#tuyaUserId"),
  tuyaDeviceIds: document.querySelector("#tuyaDeviceIds"),
  tuyaConnect: document.querySelector("#tuyaConnect"),
  tuyaStatus: document.querySelector("#tuyaStatus"),
  natureTemperatureDevice: document.querySelector("#natureTemperatureDevice"),
  natureActionCountField: document.querySelector("#natureActionCountField"),
  natureActionCount: document.querySelector("#natureActionCount"),
  natureLabel1: document.querySelector("#natureLabel1"),
  natureAction1: document.querySelector("#natureAction1"),
  natureIcon1: document.querySelector("#natureIcon1"),
  natureBadge1: document.querySelector("#natureBadge1"),
  natureLabel2: document.querySelector("#natureLabel2"),
  natureAction2: document.querySelector("#natureAction2"),
  natureIcon2: document.querySelector("#natureIcon2"),
  natureBadge2: document.querySelector("#natureBadge2"),
  natureLabel3: document.querySelector("#natureLabel3"),
  natureAction3: document.querySelector("#natureAction3"),
  natureIcon3: document.querySelector("#natureIcon3"),
  natureBadge3: document.querySelector("#natureBadge3"),
  natureLabel4: document.querySelector("#natureLabel4"),
  natureAction4: document.querySelector("#natureAction4"),
  natureIcon4: document.querySelector("#natureIcon4"),
  natureBadge4: document.querySelector("#natureBadge4"),
  natureSceneList: document.querySelector("#natureSceneList"),
  addNatureScene: document.querySelector("#addNatureScene"),
  garbageHomeEnabled: document.querySelector("#garbageHomeEnabled"),
  trainOffset: document.querySelector("#trainOffset"),
  orangeMinutes: document.querySelector("#orangeMinutes"),
  orangeColor: document.querySelector("#orangeColor"),
  redMinutes: document.querySelector("#redMinutes"),
  redColor: document.querySelector("#redColor"),
  resetTimetableSettings: document.querySelector("#resetTimetableSettings"),
  backgroundImage: document.querySelector("#backgroundImage"),
  clearBackgroundImage: document.querySelector("#clearBackgroundImage"),
  customBackgroundList: document.querySelector("#customBackgroundList"),
  backgroundSlideshowSeconds: document.querySelector("#backgroundSlideshowSeconds"),
  localVideoBeta: document.querySelector("#localVideoBeta"),
  localVideoControls: document.querySelector("#localVideoControls"),
  localVideoFile: document.querySelector("#localVideoFile"),
  clearLocalVideo: document.querySelector("#clearLocalVideo"),
  localVideoStatus: document.querySelector("#localVideoStatus"),
  livePowerSchedule: document.querySelector("#livePowerSchedule"),
  livePowerCopyDay: document.querySelector("#livePowerCopyDay"),
  copyLivePowerToAll: document.querySelector("#copyLivePowerToAll"),
  sunnyBackgroundTheme: document.querySelector("#sunnyBackgroundTheme"),
  cloudyBackgroundTheme: document.querySelector("#cloudyBackgroundTheme"),
  rainBackgroundTheme: document.querySelector("#rainBackgroundTheme"),
  nightClearBackgroundTheme: document.querySelector("#nightClearBackgroundTheme"),
  nightCloudyBackgroundTheme: document.querySelector("#nightCloudyBackgroundTheme"),
  nightRainBackgroundTheme: document.querySelector("#nightRainBackgroundTheme"),
  backgroundSampleList: document.querySelector("#backgroundSampleList"),
  weatherQuery: document.querySelector("#weatherQuery"),
  searchWeather: document.querySelector("#searchWeather"),
  forecastMode: document.querySelector("#forecastMode"),
  schedulePanelMode: document.querySelector("#schedulePanelMode"),
  animationMode: document.querySelector("#animationMode"),
  windowOnlyBlur: document.querySelector("#windowOnlyBlur"),
  windowBlurControls: document.querySelector("#windowBlurControls"),
  richBlur: document.querySelector("#richBlur"),
  richBlurValue: document.querySelector("#richBlurValue"),
  richTransparency: document.querySelector("#richTransparency"),
  richTransparencyValue: document.querySelector("#richTransparencyValue"),
  keepAwake: document.querySelector("#keepAwake"),
  debugEnabled: document.querySelector("#debugEnabled"),
  debugDateTime: document.querySelector("#debugDateTime"),
  debugWeatherCode: document.querySelector("#debugWeatherCode"),
  debugTemperature: document.querySelector("#debugTemperature"),
  addDebugEvent: document.querySelector("#addDebugEvent"),
  debugEventsList: document.querySelector("#debugEventsList"),
  resetSettings: document.querySelector("#resetSettings"),
  settingsMessage: document.querySelector("#settingsMessage"),
};

let settings = loadSettings();
if (ensureDebugClockAnchor()) saveSettings();

async function directCloudRequest(provider, operation, credentials, action = null) {
  const nativePlugin = getNativeSignagePlugin();
  const nativeMethod = provider === "switchbot"
    ? (operation === "discover" ? "fetchSwitchBot" : "sendSwitchBot")
    : (operation === "discover" ? "fetchSmartLife" : "sendSmartLife");
  if (typeof nativePlugin?.[nativeMethod] === "function") {
    const result = await nativePlugin[nativeMethod]({ ...credentials, ...(action ? { action } : {}) });
    return JSON.parse(result?.text || "{}");
  }
  const response = await fetch(`./api/${provider}/${operation}`, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...credentials, ...(action ? { action } : {}) }),
  });
  let detail = null;
  try { detail = await response.json(); } catch {}
  if (!response.ok) {
    const label = provider === "switchbot" ? "SwitchBot" : "Smart Life";
    if ([404, 405].includes(response.status) && !detail?.message) {
      throw new Error(`${label}連携用のローカルAPIが古い状態です。サイネージサーバーを再起動してください。`);
    }
    throw new Error(detail?.message || `${label} API returned HTTP ${response.status}.`);
  }
  return detail || {};
}

async function loadSwitchBot(force = false) {
  const credentials = normalizeSwitchBotSettings({ token: el.switchBotToken?.value || settings.switchBot?.token, secret: el.switchBotSecret?.value || settings.switchBot?.secret });
  settings.switchBot = credentials;
  if (!credentials.token || !credentials.secret) {
    if (el.switchBotStatus) el.switchBotStatus.textContent = "TokenとSecret Keyを入力してください";
    return null;
  }
  if (el.switchBotStatus) el.switchBotStatus.textContent = "SwitchBotから機器を読み込み中…";
  try {
    const result = await directCloudRequest("switchbot", "discover", credentials);
    latestSwitchBotDiscovery = { configured: true, devices: result.devices || [], fetchedAt: Date.now() };
    localStorage.setItem("moriyaSwitchBotCache", JSON.stringify(latestSwitchBotDiscovery));
    if (el.switchBotStatus) el.switchBotStatus.textContent = `直接接続済み：${latestSwitchBotDiscovery.devices.length}台`;
    populateNatureRemoSelectors(latestNatureRemoDiscovery);
    document.dispatchEvent(new Event("moriya-smart-device-states-change"));
    if (force) saveSettings();
    return latestSwitchBotDiscovery;
  } catch (error) {
    if (el.switchBotStatus) el.switchBotStatus.textContent = error?.message || "SwitchBotへ接続できません";
    return null;
  }
}

async function loadSmartLife(force = false) {
  const credentials = normalizeSmartLifeSettings({
    endpoint: el.tuyaEndpoint?.value || settings.smartLife?.endpoint,
    accessId: el.tuyaAccessId?.value || settings.smartLife?.accessId,
    accessSecret: el.tuyaAccessSecret?.value || settings.smartLife?.accessSecret,
    userId: el.tuyaUserId?.value || settings.smartLife?.userId,
    deviceIds: el.tuyaDeviceIds?.value || settings.smartLife?.deviceIds,
  });
  settings.smartLife = credentials;
  if (!credentials.accessId || !credentials.accessSecret || (!credentials.userId && !credentials.deviceIds)) {
    if (el.tuyaStatus) el.tuyaStatus.textContent = "Access ID/SecretとUIDまたはDevice IDを入力してください";
    return null;
  }
  if (el.tuyaStatus) el.tuyaStatus.textContent = "Smart LifeからWP6を読み込み中…";
  try {
    const result = await directCloudRequest("smartlife", "discover", credentials);
    latestSmartLifeDiscovery = { configured: true, devices: result.devices || [], fetchedAt: Date.now() };
    localStorage.setItem("moriyaSmartLifeCache", JSON.stringify(latestSmartLifeDiscovery));
    if (el.tuyaStatus) el.tuyaStatus.textContent = `直接接続済み：${latestSmartLifeDiscovery.devices.length}台`;
    populateNatureRemoSelectors(latestNatureRemoDiscovery);
    document.dispatchEvent(new Event("moriya-smart-device-states-change"));
    if (force) saveSettings();
    return latestSmartLifeDiscovery;
  } catch (error) {
    if (el.tuyaStatus) el.tuyaStatus.textContent = error?.message || "Smart Lifeへ接続できません";
    return null;
  }
}

let timetable = { weekday: [], weekend: [] };
let lastMinuteKey = "";
let lastScheduleDateKey = tokyoDateKey(now());
let lastTrainSignature = "";
let lastWeatherSignature = "";
let lastCalendarSignature = "";
let selectedCalendarDateKey = tokyoDateKey(now());
let calendarFollowsToday = true;
let cachedIcalUrl = "";
let cachedIcalText = "";
let cachedIcalDefinitions = null;
let cachedCalendarEventsByDate = new Map();
let calendarLoadSequence = 0;
let weatherTimer = null;
let scaleRaf = 0;
let marketRefreshTimer = 0;
let marketLoadSequence = 0;
let natureRemoRefreshTimer = 0;
let natureRemoLoadSequence = 0;
let latestNatureRemoPayload = null;
let latestNatureRemoDiscovery = null;
let latestSwitchBotDiscovery = { configured: false, devices: [] };
let latestSmartLifeDiscovery = { configured: false, devices: [] };
function smartActionPowerState(action) {
  if (!action || !["switchbot", "tuya"].includes(action.kind)) return null;
  const devices = action.kind === "switchbot" ? latestSwitchBotDiscovery?.devices : latestSmartLifeDiscovery?.devices;
  const device = devices?.find((item) => item.id === action.id || item.externalId === action.externalId);
  const state = device?.state;
  if (!state || Date.now() - Number(state.observedAt || 0) > 10 * 60 * 1000) return null;
  return typeof state.power === "boolean" ? state.power : null;
}

function restoreDirectCloudCaches() {
  try {
    const cached = JSON.parse(localStorage.getItem("moriyaSwitchBotCache") || "null");
    if (Array.isArray(cached?.devices)) latestSwitchBotDiscovery = cached;
  } catch {}
  try {
    const cached = JSON.parse(localStorage.getItem("moriyaSmartLifeCache") || "null");
    if (Array.isArray(cached?.devices)) latestSmartLifeDiscovery = cached;
  } catch {}
}

function normalizeMarketSettings(value) {
  const defaults = DEFAULT_SETTINGS.market.items;
  const rawItems = Array.isArray(value?.items) ? value.items : defaults;
  const items = [0, 1, 2].map((index) => ({
    label: String(rawItems[index]?.label || defaults[index].label).trim().slice(0, 80),
    symbol: String(rawItems[index]?.symbol || defaults[index].symbol).trim().toUpperCase().slice(0, 24),
  }));
  return { enabled: value?.enabled !== false, items };
}

function normalizeNatureAction(action) {
  if (!action || !["signal", "tv", "light", "aircon", "scene", "switchbot", "tuya"].includes(action.kind)) return null;
  const normalized = {
    kind: action.kind,
    id: String(action.id || "").slice(0, 80),
    provider: String(action.provider || "").slice(0, 20),
    command: String(action.command || "toggle").slice(0, 32),
    externalId: String(action.externalId || "").slice(0, 128),
    powerCode: String(action.powerCode || "").slice(0, 80),
    button: String(action.button || "").slice(0, 40),
    mode: String(action.mode || "").slice(0, 20),
    temp: String(action.temp || "").slice(0, 12),
    vol: String(action.vol || "").slice(0, 20),
    dir: String(action.dir || "").slice(0, 20),
    appliance: String(action.appliance || "").slice(0, 32),
    name: String(action.name || "").slice(0, 40),
  };
  return normalized.id ? normalized : null;
}

function normalizeSwitchBotSettings(value) {
  return { token: normalizeNatureToken(value?.token), secret: normalizeNatureToken(value?.secret) };
}

function normalizeSmartLifeSettings(value) {
  const allowed = new Set([
    "https://openapi.tuyaus.com", "https://openapi-ueaz.tuyaus.com", "https://openapi.tuyacn.com",
    "https://openapi.tuyaeu.com", "https://openapi-weaz.tuyaeu.com", "https://openapi.tuyain.com", "https://openapi-sg.iotbing.com",
  ]);
  const endpoint = String(value?.endpoint || DEFAULT_SETTINGS.smartLife.endpoint).trim().replace(/\/$/, "");
  return {
    endpoint: allowed.has(endpoint) ? endpoint : DEFAULT_SETTINGS.smartLife.endpoint,
    accessId: normalizeNatureToken(value?.accessId),
    accessSecret: normalizeNatureToken(value?.accessSecret),
    userId: String(value?.userId || "").trim().slice(0, 128),
    deviceIds: String(value?.deviceIds || "").trim().slice(0, 1024),
  };
}

function createNatureSceneId() {
  return `scene-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeNatureSceneStep(step) {
  if (step?.type === "wait") return { type: "wait", seconds: clampNumber(step.seconds, 1, 300, 3) };
  const action = normalizeNatureAction(step?.action);
  return { type: "action", action: action && action.kind !== "scene" ? action : null };
}

function normalizeNatureScenes(value) {
  return (Array.isArray(value) ? value : []).slice(0, 8).map((scene, index) => ({
    id: String(scene?.id || createNatureSceneId()).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80) || createNatureSceneId(),
    name: String(scene?.name || `シーン${index + 1}`).trim().slice(0, 20) || `シーン${index + 1}`,
    steps: (Array.isArray(scene?.steps) ? scene.steps : []).map(normalizeNatureSceneStep).filter(Boolean).slice(0, 20),
  }));
}

function normalizeNatureToken(value) {
  let token = String(value || "").trim().replace(/^Bearer\s+/i, "").trim();
  const wrappers = [["「", "」"], ["『", "』"], ["“", "”"], ['"', '"'], ["'", "'"]];
  for (const [open, close] of wrappers) {
    if (token.startsWith(open) && token.endsWith(close)) {
      token = token.slice(open.length, -close.length).trim();
      break;
    }
  }
  return token.replace(/\\_/g, "_").replace(/\s+/g, "").slice(0, 512);
}

function normalizeNatureRemoSettings(value) {
  const defaults = DEFAULT_SETTINGS.natureRemo.actions;
  const rawActions = Array.isArray(value?.actions) ? value.actions : defaults;
  const scenes = normalizeNatureScenes(value?.scenes);
  const panelSource = Array.isArray(value?.panelActions)
    ? value.panelActions
    : rawActions.slice(0, clampNumber(value?.actionCount, 1, 4, 3)).filter((item) => item?.action);
  const previousColumns = Number(value?.gridColumns) === 9 ? 9 : 8;
  return {
    token: normalizeNatureToken(value?.token),
    temperatureDeviceId: String(value?.temperatureDeviceId || "").slice(0, 80),
    actionCount: clampNumber(value?.actionCount, 1, 4, DEFAULT_SETTINGS.natureRemo.actionCount),
    scenes,
    gridColumns: 9,
    panelActions: panelSource.slice(0, 24).map((item, index) => ({
      id: typeof item?.id === "string" && /^[a-zA-Z0-9_-]{8,80}$/.test(item.id) ? item.id : (window.crypto?.randomUUID?.() || `action-${Date.now()}-${index}-${Math.random().toString(36).slice(2)}`),
      label: String(item?.label || `操作${index + 1}`).trim().slice(0, 30),
      icon: NATURE_ICON_OPTIONS.some(([key]) => key === item?.icon) ? item.icon : "auto",
      badge: NATURE_BADGE_OPTIONS.some(([key]) => key === item?.badge) ? item.badge : "none",
      slot: (() => {
        const rawSlot = Number(item?.slot);
        if (!Number.isInteger(rawSlot) || rawSlot < 0 || rawSlot >= previousColumns * 4) return index;
        return previousColumns === 9 ? rawSlot : Math.floor(rawSlot / 8) * 9 + rawSlot % 8;
      })(),
      action: normalizeNatureAction(item?.action),
    })).filter((item) => item.action).reduce((items, item) => {
      const used = new Set(items.map((existing) => existing.slot));
      if (used.has(item.slot)) item.slot = Array.from({ length: SMART_GRID_SLOTS }, (_, index) => index).find((slot) => !used.has(slot)) ?? item.slot;
      items.push(item);
      return items;
    }, []),
    actions: [0, 1, 2, 3].map((index) => ({
      label: String(rawActions[index]?.label || defaults[index].label).trim().slice(0, 30),
      icon: NATURE_ICON_OPTIONS.some(([key]) => key === rawActions[index]?.icon) ? rawActions[index].icon : defaults[index].icon,
      badge: NATURE_BADGE_OPTIONS.some(([key]) => key === rawActions[index]?.badge) ? rawActions[index].badge : "none",
      action: normalizeNatureAction(rawActions[index]?.action),
    })),
  };
}

function natureSettingRows() {
  return [
    [el.natureAction1, el.natureLabel1, el.natureIcon1],
    [el.natureAction2, el.natureLabel2, el.natureIcon2],
    [el.natureAction3, el.natureLabel3, el.natureIcon3],
    [el.natureAction4, el.natureLabel4, el.natureIcon4],
  ];
}

function populateNatureIconOptions() {
  for (const [, , select] of natureSettingRows()) {
    if (!select) continue;
    select.innerHTML = NATURE_ICON_OPTIONS.map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
    renderNatureIconPicker(select);
  }
  document.querySelectorAll('[data-nature-badge]').forEach((select) => {
    select.replaceChildren(...NATURE_BADGE_OPTIONS.map(([value, label]) => new Option(label, value)));
    renderNatureBadgePicker(select);
  });
}

function renderNatureBadgePicker(select) {
  if (!select) return;
  let gallery = select.parentElement.querySelector('.nature-badge-gallery');
  if (!gallery) {
    gallery = document.createElement('div');
    gallery.className = 'nature-icon-gallery nature-badge-gallery';
    gallery.setAttribute('role', 'group');
    gallery.setAttribute('aria-label', '右上の小アイコンを選択');
    select.insertAdjacentElement('afterend', gallery);
    gallery.addEventListener('click', (event) => {
      const button = event.target.closest('[data-badge-choice]');
      if (!button) return;
      select.value = button.dataset.badgeChoice;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    select.addEventListener('change', () => syncNatureBadgePicker(select));
  }
  gallery.innerHTML = NATURE_BADGE_OPTIONS.map(([value, label]) => `<button type="button" data-badge-choice="${value}" aria-label="${label}" title="${label}" aria-pressed="false">${value === 'none' ? '<span class="nature-auto-icon">なし</span>' : natureActionGraphic(value)}</button>`).join('');
  select.classList.add('nature-icon-select-hidden');
  syncNatureBadgePicker(select);
  requestAnimationFrame(() => window.MoriyaCenterIcons(gallery));
}

function syncNatureBadgePicker(select) {
  select.parentElement.querySelectorAll('[data-badge-choice]').forEach((button) => {
    const active = button.dataset.badgeChoice === select.value;
    button.classList.toggle('is-selected', active);
    button.setAttribute('aria-pressed', String(active));
  });
}
window.MoriyaRenderBadgePicker = renderNatureBadgePicker;

function renderNatureIconPicker(select) {
  if (!select) return;
  let gallery = select.parentElement.querySelector(".nature-icon-gallery");
  if (!gallery) {
    gallery = document.createElement("div");
    gallery.className = "nature-icon-gallery";
    gallery.setAttribute("role", "group");
    gallery.setAttribute("aria-label", "アイコンを選択");
    select.insertAdjacentElement("afterend", gallery);
    gallery.addEventListener("click", (event) => {
      const button = event.target.closest("[data-icon-choice]");
      if (!button) return;
      select.value = button.dataset.iconChoice;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    select.addEventListener("change", () => syncNatureIconPicker(select));
  }
  gallery.innerHTML = NATURE_ICON_OPTIONS.map(([value, label]) => `<button type="button" data-icon-choice="${value}" aria-label="${label}" title="${label}" aria-pressed="false">${value === "auto" ? '<span class="nature-auto-icon">自動</span>' : natureActionGraphic(value)}</button>`).join("");
  select.classList.add("nature-icon-select-hidden");
  syncNatureIconPicker(select);
  requestAnimationFrame(() => window.MoriyaCenterIcons(gallery));
}

function syncNatureIconPicker(select) {
  select.parentElement.querySelectorAll("[data-icon-choice]").forEach((button) => {
    const active = button.dataset.iconChoice === select.value;
    button.classList.toggle("is-selected", active);
    button.setAttribute("aria-pressed", String(active));
  });
}
window.MoriyaRenderIconPicker = renderNatureIconPicker;

function syncNatureActionRows(mode = el.homeInfoMode?.value || settings.homeInfoMode) {
  const hybrid = mode === "hybrid";
  const count = hybrid ? 1 : clampNumber(el.natureActionCount?.value, 1, 4, settings.natureRemo?.actionCount || 3);
  if (el.natureActionCountField) el.natureActionCountField.hidden = hybrid;
  document.querySelectorAll("[data-nature-action-row]").forEach((row) => {
    row.hidden = Number(row.dataset.natureActionRow) > count;
  });
  if (el.marketSettingRow2) el.marketSettingRow2.hidden = false;
  if (el.marketSettingRow3) el.marketSettingRow3.hidden = hybrid;
}

function populateMarketPresets() {
  for (const select of [el.marketPreset1, el.marketPreset2, el.marketPreset3].filter(Boolean)) {
    select.innerHTML = `${MARKET_PRESETS.map((preset) => `<option value="${preset.symbol}">${preset.name}</option>`).join("")}<option value="custom">銘柄コードを直接入力</option>`;
  }
}

function syncMarketPresetUi() {
  [[el.marketPreset1, el.marketLabel1, el.marketSymbol1], [el.marketPreset2, el.marketLabel2, el.marketSymbol2], [el.marketPreset3, el.marketLabel3, el.marketSymbol3]].forEach(([select, , symbolInput]) => {
    if (!select || !symbolInput) return;
    const symbol = symbolInput.value.trim().toUpperCase();
    select.value = MARKET_PRESETS.some((preset) => preset.symbol === symbol) ? symbol : "custom";
  });
}

function applyMarketPreset(select, labelInput, symbolInput) {
  if (!select || !labelInput || !symbolInput || select.value === "custom") return;
  const preset = MARKET_PRESETS.find((item) => item.symbol === select.value);
  if (!preset) return;
  labelInput.value = preset.label;
  symbolInput.value = preset.symbol;
}

function natureActionValue(action) {
  return action ? JSON.stringify(normalizeNatureAction(action)) : "";
}

function readNatureActionSelect(select) {
  if (!select?.value) return null;
  try {
    return normalizeNatureAction(JSON.parse(select.value));
  } catch {
    return null;
  }
}

function setNatureRemoFieldsVisibility(mode = el.homeInfoMode?.value || settings.homeInfoMode) {
  if (el.marketSettingsFields) el.marketSettingsFields.hidden = !["market", "hybrid"].includes(mode);
  if (el.natureRemoSettingsFields) el.natureRemoSettingsFields.hidden = !["remo", "hybrid"].includes(mode);
  syncNatureActionRows(mode);
}

function natureActionIcon(action, preferred = "auto") {
  if (preferred && preferred !== "auto") return preferred;
  if (["switchbot", "tuya"].includes(action?.kind)) return /照明|電球|bulb|light/i.test(`${action.appliance || ""} ${action.name || ""}`) ? "light" : "power";
  if (action?.kind === "scene") return "scene";
  if (action?.kind === "light") return "light";
  if (action?.kind === "tv") return "tv";
  if (action?.kind === "aircon") return "ac";
  return "power";
}

function buildNatureRemoChoices(appliances = []) {
  const choices = [];
  for (const appliance of appliances) {
    const applianceName = String(appliance.nickname || "家電");
    for (const signal of appliance.signals || []) {
      choices.push({ label: `${applianceName} › ${signal.name}`, action: { kind: "signal", id: signal.id, appliance: applianceName, name: signal.name } });
    }
    for (const button of appliance.tv?.buttons || []) {
      choices.push({ label: `${applianceName} › ${button.name}`, action: { kind: "tv", id: appliance.id, button: button.name, appliance: applianceName, name: button.name } });
    }
    for (const button of appliance.light?.buttons || []) {
      choices.push({ label: `${applianceName} › ${button.name}`, action: { kind: "light", id: appliance.id, button: button.name, appliance: applianceName, name: button.name } });
    }
    if (appliance.type === "AC") {
      const current = appliance.settings || {};
      choices.push({ label: `${applianceName} › 運転`, action: { kind: "aircon", id: appliance.id, mode: current.mode || "auto", temp: current.temp || "", vol: current.vol || "", dir: current.dir || "", appliance: applianceName, name: "運転" } });
      choices.push({ label: `${applianceName} › 停止`, action: { kind: "aircon", id: appliance.id, button: "power-off", appliance: applianceName, name: "停止" } });
    }
  }
  return choices;
}

function buildDirectCloudChoices() {
  const devices = [...(latestSwitchBotDiscovery?.devices || []), ...(latestSmartLifeDiscovery?.devices || [])];
  return devices.flatMap((device) => {
    const providerLabel = device.adapter === "tuya" ? "Smart Life" : "SwitchBot";
    return [["toggle", "電源切替"], ["on", "ON"], ["off", "OFF"]].map(([command, label]) => ({
      label: `${providerLabel} › ${device.name} › ${label}`,
      action: {
        kind: device.adapter === "tuya" ? "tuya" : "switchbot",
        id: device.id,
        externalId: device.externalId,
        powerCode: device.commandCodes?.power || "",
        command,
        appliance: device.name,
        name: label,
      },
    }));
  });
}

function natureSceneChoices(scenes = settings.natureRemo?.scenes || []) {
  return normalizeNatureScenes(scenes).map((scene) => ({
    label: `サイネージ内シーン › ${scene.name}`,
    action: { kind: "scene", id: scene.id, appliance: "サイネージ内シーン", name: scene.name },
  }));
}

function natureChoiceOptions(choices, selected = "") {
  return choices.map((choice) => `<option value='${escapeHtml(natureActionValue(choice.action))}' ${natureActionValue(choice.action) === selected ? "selected" : ""}>${escapeHtml(choice.label)}</option>`).join("");
}

function readNatureScenesEditor() {
  if (!el.natureSceneList) return [];
  return [...el.natureSceneList.querySelectorAll("[data-nature-scene]")].map((card, sceneIndex) => ({
    id: card.dataset.natureScene,
    name: card.querySelector("[data-scene-name]")?.value || `シーン${sceneIndex + 1}`,
    steps: [...card.querySelectorAll("[data-scene-step]")].map((row) => row.dataset.stepType === "wait"
      ? { type: "wait", seconds: row.querySelector("[data-scene-wait]")?.value || 3 }
      : { type: "action", action: readNatureActionSelect(row.querySelector("[data-scene-action]")) }),
  }));
}

function renderNatureScenesEditor(sceneValue = settings.natureRemo?.scenes || []) {
  if (!el.natureSceneList) return;
  const scenes = normalizeNatureScenes(sceneValue);
  const choices = [...buildNatureRemoChoices(latestNatureRemoDiscovery?.appliances || []), ...buildDirectCloudChoices()];
  el.natureSceneList.innerHTML = scenes.length ? scenes.map((scene, sceneIndex) => `
    <section class="nature-scene-card" data-nature-scene="${escapeHtml(scene.id)}">
      <header><label><span>シーン名</span><input data-scene-name type="text" maxlength="20" value="${escapeHtml(scene.name)}" /></label><button type="button" data-delete-scene="${sceneIndex}">削除</button></header>
      <div class="nature-scene-steps">${scene.steps.length ? scene.steps.map((step, stepIndex) => step.type === "wait"
        ? `<div class="nature-scene-step is-wait" data-scene-step="${stepIndex}" data-step-type="wait"><b>待機</b><label><span>秒数</span><input data-scene-wait type="number" min="1" max="300" step="1" value="${step.seconds}" /></label><div class="nature-scene-step-buttons"><button type="button" data-move-step="up" aria-label="上へ">↑</button><button type="button" data-move-step="down" aria-label="下へ">↓</button><button type="button" data-delete-step aria-label="削除">×</button></div></div>`
        : `<div class="nature-scene-step is-action" data-scene-step="${stepIndex}" data-step-type="action"><b>操作</b><label><span>家電操作</span><select data-scene-action><option value="">操作を選択</option>${natureChoiceOptions(choices, natureActionValue(step.action))}</select></label><div class="nature-scene-step-buttons"><button type="button" data-move-step="up" aria-label="上へ">↑</button><button type="button" data-move-step="down" aria-label="下へ">↓</button><button type="button" data-delete-step aria-label="削除">×</button></div></div>`).join("") : '<p class="nature-scene-empty">操作または待ち時間を追加してください</p>'}</div>
      <footer><button type="button" data-add-scene-step="action">家電操作を追加</button><button type="button" data-add-scene-step="wait">待ち時間を追加</button></footer>
    </section>`).join("") : '<p class="nature-scene-empty">シーンはまだありません。</p>';
}

function refreshNatureSceneChoices() {
  const drafts = normalizeNatureScenes(readNatureScenesEditor());
  const discovery = latestNatureRemoDiscovery;
  const appliances = Array.isArray(discovery?.appliances) ? discovery.appliances : [];
  const choices = [...buildNatureRemoChoices(appliances), ...buildDirectCloudChoices(), ...natureSceneChoices(drafts)];
  natureSettingRows().forEach(([select], index) => {
    if (!select) return;
    const selected = select.value || natureActionValue(settings.natureRemo.actions[index]?.action);
    select.innerHTML = `<option value="">操作を選択</option>${natureChoiceOptions(choices, selected)}`;
  });
}

function populateNatureRemoSelectors(discovery = latestNatureRemoDiscovery) {
  const devices = Array.isArray(discovery?.devices) ? discovery.devices : [];
  const appliances = Array.isArray(discovery?.appliances) ? discovery.appliances : [];
  if (el.natureTemperatureDevice) {
    const selected = el.natureTemperatureDevice.value || settings.natureRemo.temperatureDeviceId;
    el.natureTemperatureDevice.innerHTML = `<option value="">自動（最新のセンサー）</option>${devices.filter((device) => Number.isFinite(Number(device?.newest_events?.te?.val))).map((device) => `<option value="${device.id}">${device.name || "Nature Remo"}</option>`).join("")}`;
    el.natureTemperatureDevice.value = devices.some((device) => device.id === selected) ? selected : "";
  }
  const draftScenes = el.natureSceneList?.querySelector("[data-nature-scene]") ? readNatureScenesEditor() : settings.natureRemo.scenes;
  const choices = [...buildNatureRemoChoices(appliances), ...buildDirectCloudChoices(), ...natureSceneChoices(draftScenes)];
  natureSettingRows().forEach(([select], index) => {
    if (!select) return;
    const selected = select.value || natureActionValue(settings.natureRemo.actions[index]?.action);
    select.innerHTML = `<option value="">操作を選択</option>${choices.map((choice) => `<option value='${escapeHtml(natureActionValue(choice.action))}'>${escapeHtml(choice.label)}</option>`).join("")}`;
    if ([...select.options].some((option) => option.value === selected)) select.value = selected;
  });
  renderNatureScenesEditor(draftScenes);
}

function normalizeBackgroundSelection(value, fallback) {
  const normalized = Array.isArray(value) ? value : (typeof value === "string" && value ? [value] : []);
  const unique = [...new Set(normalized.filter((item) => typeof item === "string" && item))];
  if (unique.length) return unique;
  return Array.isArray(fallback) ? [...fallback] : [fallback].filter(Boolean);
}

function clampNumber(value, min, max, fallback) {
  const numeric = Number(value);
  return Math.max(min, Math.min(max, Number.isFinite(numeric) ? numeric : fallback));
}

function normalizeLiveQuietHours(value) {
  const result = Object.fromEntries(LIVE_POWER_DAYS.map(([key]) => [key, []]));
  for (const [key] of LIVE_POWER_DAYS) {
    const ranges = Array.isArray(value?.[key]) ? value[key] : [];
    result[key] = ranges.slice(0, 8).map((range) => ({
      start: /^\d{2}:\d{2}$/.test(range?.start || "") ? range.start : "00:00",
      end: /^\d{2}:\d{2}$/.test(range?.end || "") ? range.end : "06:00",
    }));
  }
  return result;
}

function appendLivePowerRange(dayKey, range = { start: "00:00", end: "06:00" }) {
  const list = el.livePowerSchedule?.querySelector(`[data-live-power-ranges="${dayKey}"]`);
  if (!list || list.children.length >= 8) return;
  const row = document.createElement("div");
  row.className = "live-power-range";
  row.innerHTML = `<input type="time" value="${range.start}" aria-label="停止開始" /><span>–</span><input type="time" value="${range.end}" aria-label="停止終了" /><button class="live-power-remove" type="button" aria-label="この時間帯を削除">×</button>`;
  list.append(row);
}

function renderLivePowerSchedule(schedule = settings.videoQuietHours) {
  if (!el.livePowerSchedule) return;
  const normalized = normalizeLiveQuietHours(schedule);
  el.livePowerSchedule.replaceChildren();
  for (const [key, label] of LIVE_POWER_DAYS) {
    const day = document.createElement("div");
    day.className = "live-power-day";
    day.dataset.livePowerDay = key;
    day.innerHTML = `<span class="live-power-day-name">${label}曜</span><div class="live-power-ranges" data-live-power-ranges="${key}"></div><button class="live-power-add" type="button" data-live-power-add="${key}">＋時間帯</button>`;
    el.livePowerSchedule.append(day);
    for (const range of normalized[key]) appendLivePowerRange(key, range);
  }
}

function readLivePowerSchedule() {
  const result = Object.fromEntries(LIVE_POWER_DAYS.map(([key]) => [key, []]));
  for (const [key] of LIVE_POWER_DAYS) {
    const rows = el.livePowerSchedule?.querySelectorAll(`[data-live-power-ranges="${key}"] .live-power-range`) || [];
    result[key] = Array.from(rows).map((row) => {
      const inputs = row.querySelectorAll('input[type="time"]');
      return { start: inputs[0]?.value || "00:00", end: inputs[1]?.value || "06:00" };
    });
  }
  return result;
}

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem("moriyaSignageSettings") || "{}");
    const savedDisplay = { ...DEFAULT_SETTINGS.display, ...(saved.display || {}) };
    savedDisplay.profile = savedDisplay.profile === "tablet10" ? "tablet10" : "standard";
    if (!saved.display?.animationMode) savedDisplay.animationMode = savedDisplay.reduceMotion ? "off" : "light";
    if (typeof saved.display?.windowOnlyBlur !== "boolean") savedDisplay.windowOnlyBlur = savedDisplay.animationMode === "rich";
    savedDisplay.reduceMotion = savedDisplay.animationMode === "off";
    savedDisplay.schedulePanelMode = "calendar";
    savedDisplay.localVideoBeta = Boolean(saved.display?.localVideoBeta);
    const savedDebug = { ...DEFAULT_SETTINGS.debug, ...(saved.debug || {}) };
    savedDebug.events = Array.isArray(savedDebug.events) ? savedDebug.events : [];
    const backgroundThemes = { ...DEFAULT_SETTINGS.backgroundThemes };
    for (const key of Object.keys(backgroundThemes)) {
      backgroundThemes[key] = normalizeBackgroundSelection(saved.backgroundThemes?.[key], DEFAULT_SETTINGS.backgroundThemes[key]);
    }
    const legacyBackground = typeof saved.backgroundImage === "string" && saved.backgroundImage ? [saved.backgroundImage] : [];
    const backgroundImages = (Array.isArray(saved.backgroundImages) ? saved.backgroundImages : legacyBackground)
      .filter((item) => typeof item === "string" && item.startsWith("data:image/"))
      .slice(0, 5);
    const natureRemo = normalizeNatureRemoSettings(saved.natureRemo);
    return cleanSignageSettings({
      ...DEFAULT_SETTINGS,
      ...saved,
      backgroundImage: backgroundImages[0] || "",
      backgroundImages,
      backgroundSlideshowSeconds: clampNumber(saved.backgroundSlideshowSeconds, 30, 600, DEFAULT_SETTINGS.backgroundSlideshowSeconds),
      homeInfoMode: ["none", "market", "remo", "hybrid"].includes(saved.homeInfoMode)
        ? saved.homeInfoMode
        : saved.market?.enabled === false ? "none" : "market",
      market: normalizeMarketSettings(saved.market),
      natureRemo,
      switchBot: normalizeSwitchBotSettings(saved.switchBot),
      smartLife: normalizeSmartLifeSettings(saved.smartLife),
      garbage: { ...DEFAULT_SETTINGS.garbage, ...(saved.garbage || {}) },
      videoQuietHours: normalizeLiveQuietHours(saved.videoQuietHours || saved.liveBackgroundQuietHours),
      trainAlerts: { ...DEFAULT_SETTINGS.trainAlerts, ...(saved.trainAlerts || {}) },
      backgroundThemes,
      display: savedDisplay,
      weather: { ...DEFAULT_SETTINGS.weather, ...(saved.weather || {}) },
      android: { keepAwake: saved.android?.keepAwake !== false },
      debug: savedDebug,
    });
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

function saveSettings() {
  localStorage.setItem("moriyaSignageSettings", JSON.stringify(settings));
  document.dispatchEvent(new Event("moriya-settings-saved"));
}

const SETTINGS_BACKUP_FORMAT = "moriya-signage-settings";
const SETTINGS_BACKUP_VERSION = 1;
const SMART_HOME_SETTING_KEYS = ["homeInfoMode", "natureRemo", "switchBot", "smartLife"];

function cleanSignageSettings(value) {
  const clean = { ...value, android: { keepAwake: value?.android?.keepAwake !== false } };
  delete clean.homeHub;
  delete clean.kensHomeScenesUpdatedAt;
  return clean;
}

function blobAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("動画を読み取れませんでした。"));
    reader.readAsDataURL(blob);
  });
}

function normalizeGithubBackupConnection(value) {
  if (value === null) return null;
  if (!window.MoriyaGithubCore) throw new Error("GitHub接続情報の検証機能を読み込めませんでした。");
  const checked = window.MoriyaGithubCore.config(value);
  return {
    repo: checked.repo, token: checked.token, key: checked.key,
    role: value.role === "child" ? "child" : "parent",
    scope: ["all", "shared", "smartHome", "schedules"].includes(value.scope) ? value.scope : "shared",
    conflictMode: value.conflictMode === "whole" ? "whole" : "partial",
    schedulesEnabled: value.schedulesEnabled !== false,
    deviceName: String(value.deviceName || "").slice(0,40),
    interval: [30, 60, 120, 300].includes(Number(value.interval)) ? Number(value.interval) : 60,
    enabled: value.enabled !== false,
  };
}

async function createSettingsBackupText(scope, includeVideo = true, includeGithub = true) {
  const current = cleanSignageSettings(JSON.parse(localStorage.getItem("moriyaSignageSettings") || JSON.stringify(settings)));
  const data = scope === "smartHome"
    ? Object.fromEntries(SMART_HOME_SETTING_KEYS.map((key) => [key, current[key]]))
    : current;
  const backup = {
    format: SETTINGS_BACKUP_FORMAT,
    version: SETTINGS_BACKUP_VERSION,
    scope,
    createdAt: new Date().toISOString(),
    settings: data,
  };
  if (scope === "all" && includeGithub) {
    const stored = localStorage.getItem("moriyaGithubConnection");
    backup.githubConnection = normalizeGithubBackupConnection(stored ? JSON.parse(stored) : null);
  }
  if (scope === "all" && includeVideo) {
    const video = await window.MoriyaLocalVideo?.getBackupRecord?.();
    backup.video = video?.blob ? {
      name: video.name || "背景動画",
      type: video.type || video.blob.type || "video/mp4",
      dataUrl: await blobAsDataUrl(video.blob),
    } : null;
  }
  return JSON.stringify(backup);
}

function parseSettingsBackupText(text) {
  let backup;
  try { backup = JSON.parse(text); } catch { throw new Error("文章をJSONとして読み取れませんでした。全文を貼り付けてください。"); }
  if (backup?.format !== SETTINGS_BACKUP_FORMAT || backup.version !== SETTINGS_BACKUP_VERSION || !["all", "smartHome"].includes(backup.scope)) {
    throw new Error("守谷サイネージの対応したバックアップ形式ではありません。");
  }
  if (!backup.settings || typeof backup.settings !== "object" || Array.isArray(backup.settings)) throw new Error("設定データがありません。");
  if (backup.scope === "all" && !Object.hasOwn(backup.settings, "display")) throw new Error("全設定のデータが不足しています。");
  if (backup.scope === "smartHome" && SMART_HOME_SETTING_KEYS.some((key) => !Object.hasOwn(backup.settings, key))) throw new Error("スマートホーム設定のデータが不足しています。");
  if (backup.scope === "all" && backup.video !== null && backup.video !== undefined && !/^data:video\/[a-z0-9.+-]+;base64,[a-z0-9+/=]+$/i.test(backup.video?.dataUrl || "")) {
    throw new Error("背景動画データが壊れています。");
  }
  if (backup.scope === "all" && Object.hasOwn(backup, "githubConnection")) {
    backup.githubConnection = normalizeGithubBackupConnection(backup.githubConnection);
  }
  return backup;
}

async function restoreSettingsBackupText(text) {
  const backup = parseSettingsBackupText(text);
  const previous = localStorage.getItem("moriyaSignageSettings");
  const previousGithub = localStorage.getItem("moriyaGithubConnection");
  const current = JSON.parse(previous || JSON.stringify(DEFAULT_SETTINGS));
  const incoming = cleanSignageSettings(backup.settings);
  const next = backup.scope === "all"
    ? incoming
    : cleanSignageSettings({ ...current, ...Object.fromEntries(SMART_HOME_SETTING_KEYS.map((key) => [key, incoming[key]])) });
  let previousVideo;
  if (backup.scope === "all" && Object.hasOwn(backup, "video")) {
    previousVideo = await window.MoriyaLocalVideo?.getBackupRecord?.();
    const restoredVideo = backup.video === null ? null : {
      blob: await fetch(backup.video.dataUrl).then((response) => response.blob()),
      name: backup.video.name || "背景動画",
      type: backup.video.type || "video/mp4",
      savedAt: Date.now(),
    };
    await window.MoriyaLocalVideo?.restoreBackupRecord?.(restoredVideo);
  }
  try {
    localStorage.setItem("moriyaSignageSettings", JSON.stringify(next));
    if (backup.scope === "all" && Object.hasOwn(backup, "githubConnection")) {
      if (backup.githubConnection === null) localStorage.removeItem("moriyaGithubConnection");
      else localStorage.setItem("moriyaGithubConnection", JSON.stringify(backup.githubConnection));
    }
  } catch (error) {
    if (previous === null) localStorage.removeItem("moriyaSignageSettings");
    else localStorage.setItem("moriyaSignageSettings", previous);
    if (previousGithub === null) localStorage.removeItem("moriyaGithubConnection");
    else localStorage.setItem("moriyaGithubConnection", previousGithub);
    if (previousVideo !== undefined) await window.MoriyaLocalVideo?.restoreBackupRecord?.(previousVideo);
    throw error;
  }
  location.reload();
}

// Cloud credentials are separate from synced settings; manual full backups include them.
window.MoriyaSettingsBridge = {
  export: (scope) => {
    const keys = scope === 'all' ? Object.keys(DEFAULT_SETTINGS) : scope === 'shared'
      ? [...SMART_HOME_SETTING_KEYS, 'icalUrl', 'market'] : SMART_HOME_SETTING_KEYS;
    return { scope, settings: Object.fromEntries(keys.map(key => [key, structuredClone(settings[key])])) };
  },
  apply: async (data) => {
    if (!data || !['all','shared','smartHome'].includes(data.scope) || !data.settings || Array.isArray(data.settings)) throw new Error('同期設定の形式が不正です。');
    const keys = data.scope === 'all' ? Object.keys(DEFAULT_SETTINGS) : data.scope === 'shared'
      ? [...SMART_HOME_SETTING_KEYS, 'icalUrl', 'market'] : SMART_HOME_SETTING_KEYS;
    if (keys.some(key => !Object.hasOwn(data.settings, key))) throw new Error('同期設定に必要な項目が不足しています。');
    const incoming = Object.fromEntries(keys.map(key => [key, data.settings[key]]));
    const next = { ...settings, ...incoming, android: settings.android, debug: settings.debug };
    next.display = { ...next.display, profile: settings.display.profile };
    const previous = localStorage.getItem('moriyaSignageSettings');
    try {
      localStorage.setItem('moriyaSignageSettings', JSON.stringify(next));
      settings = loadSettings();
      saveSettings();
    } catch (error) {
      if (previous !== null) localStorage.setItem('moriyaSignageSettings', previous);
      else localStorage.removeItem('moriyaSignageSettings');
      throw error;
    }
    lastTrainSignature = lastWeatherSignature = lastCalendarSignature = '';
    applySettingsToUi();
    tick();
    document.dispatchEvent(new Event('moriya-smart-home-actions-change'));
    void window.MoriyaNatureRemo?.refresh?.();
    void loadCalendar(true);
    void loadWeather(true);
    void fetchMarketQuotes(true);
  },
  backup: (scope) => createSettingsBackupText(scope, false, false),
  restore: restoreSettingsBackupText,
};

function updateStageScale() {
  const viewport = window.visualViewport;
  const width = viewport?.width || window.innerWidth || STAGE_WIDTH;
  const height = viewport?.height || window.innerHeight || STAGE_HEIGHT;
  const scale = Math.min(width / STAGE_WIDTH, height / STAGE_HEIGHT);
  const safeScale = Math.max(0.1, scale);
  el.shell.style.setProperty("--stage-scale", safeScale.toFixed(4));
  el.shell.style.setProperty("--stage-left", `${Math.max(0, (width - STAGE_WIDTH * safeScale) / 2).toFixed(2)}px`);
  el.shell.style.setProperty("--stage-top", `${Math.max(0, (height - STAGE_HEIGHT * safeScale) / 2).toFixed(2)}px`);
  el.shell.scrollLeft = 0;
  el.shell.scrollTop = 0;
}

function lockStageScroll() {
  if (!el.shell.scrollLeft && !el.shell.scrollTop) return;
  el.shell.scrollLeft = 0;
  el.shell.scrollTop = 0;
}

function requestStageScaleUpdate() {
  if (scaleRaf) cancelAnimationFrame(scaleRaf);
  scaleRaf = requestAnimationFrame(() => {
    scaleRaf = 0;
    updateStageScale();
    updateEventTitleScroll();
  });
}

function closestAvailableWeight(weights, preferredWeight) {
  const preferred = Number(preferredWeight || 400);
  return String(weights.reduce((best, weight) => (
    Math.abs(weight - preferred) < Math.abs(best - preferred) ? weight : best
  ), weights[0] || 400));
}

function syncFontWeightOptions(fontSelect, weightSelect, preferredWeight) {
  if (!fontSelect || !weightSelect) return;
  const weights = FONT_WEIGHTS[fontSelect.value] || [400, 700];
  const selected = closestAvailableWeight(weights, preferredWeight ?? weightSelect.value);
  weightSelect.innerHTML = weights
    .map((weight) => `<option value="${weight}">${FONT_WEIGHT_LABELS[weight] || weight}</option>`)
    .join("");
  weightSelect.value = selected;
}

function syncAllFontWeightOptions(preferred = {}) {
  syncFontWeightOptions(el.fontSelect, el.fontWeightSelect, preferred.fontWeight);
  syncFontWeightOptions(el.numberFontSelect, el.numberFontWeightSelect, preferred.numberFontWeight);
  syncFontWeightOptions(el.clockFontSelect, el.clockFontWeightSelect, preferred.clockFontWeight);
}

function populateFonts() {
  const html = FONT_OPTIONS.map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
  el.fontSelect.innerHTML = html;
  el.numberFontSelect.innerHTML = html;
  el.clockFontSelect.innerHTML = html;
  syncAllFontWeightOptions({
    fontWeight: settings?.fontWeight || DEFAULT_SETTINGS.fontWeight,
    numberFontWeight: settings?.numberFontWeight || DEFAULT_SETTINGS.numberFontWeight,
    clockFontWeight: settings?.clockFontWeight || DEFAULT_SETTINGS.clockFontWeight,
  });
}

function syncLocalVideoControls(enabled = el.localVideoBeta?.checked) {
  if (el.localVideoControls) el.localVideoControls.hidden = !enabled;
}

function populateBackgroundSamples() {
  if (!el.backgroundSampleList) return;
  el.backgroundSampleList.innerHTML = BACKGROUND_SAMPLE_GROUPS.map(([targetId, label, items]) => `
    <section class="background-sample-group" aria-label="${label}">
      <div class="background-sample-heading"><h3>${label}</h3><span data-selection-count="${targetId}"></span></div>
      <div class="background-sample-grid">${items.map(([value, name]) => `
        <button class="background-sample" type="button" data-background-target="${targetId}" data-background-value="${value}" aria-label="${label}：${name}">
          <img src="./assets/backgrounds/${value}" alt="" loading="lazy" />
          <span class="background-sample-check" aria-hidden="true">選択中</span>
          <span>${name}</span>
        </button>`).join("")}</div>
    </section>`).join("");
  el.backgroundSampleList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-background-target]");
    if (!button) return;
    const select = document.getElementById(button.dataset.backgroundTarget);
    if (!select) return;
    const selected = readBackgroundSelection(select);
    const value = button.dataset.backgroundValue;
    if (selected.includes(value)) {
      if (selected.length === 1) {
        el.settingsMessage.textContent = "各天気につき、背景写真を1枚以上選択してください。";
        return;
      }
      select.value = JSON.stringify(selected.filter((item) => item !== value));
    } else {
      select.value = JSON.stringify([...selected, value]);
    }
    syncBackgroundSampleSelection();
  });
}

function readBackgroundSelection(input, fallback = []) {
  if (!input) return normalizeBackgroundSelection([], fallback);
  try {
    return normalizeBackgroundSelection(JSON.parse(input.value || "[]"), fallback);
  } catch {
    return normalizeBackgroundSelection(input.value, fallback);
  }
}

function writeBackgroundSelection(input, value, fallback) {
  if (!input) return;
  input.value = JSON.stringify(normalizeBackgroundSelection(value, fallback));
}

function renderCustomBackgroundPreviews() {
  if (!el.customBackgroundList) return;
  const images = Array.isArray(settings.backgroundImages) ? settings.backgroundImages.slice(0, 5) : [];
  el.customBackgroundList.hidden = images.length === 0;
  el.customBackgroundList.innerHTML = images.map((source, index) => `
    <figure class="custom-background-item">
      <img src="${source}" alt="カスタム背景 ${index + 1}" />
      <figcaption>${index + 1}</figcaption>
      <button type="button" data-remove-custom-background="${index}" aria-label="カスタム背景 ${index + 1} を削除">
        <span aria-hidden="true">×</span>
      </button>
    </figure>`).join("");
}

function appendDebugEventRow(event = {}) {
  if (!el.debugEventsList) return;
  const row = document.createElement("div");
  row.className = "debug-event-row";
  row.innerHTML = `
    <label><span>時刻</span><input type="time" data-debug-event-time value="${escapeHtml(event.time || "")}" /></label>
    <label><span>予定</span><input type="text" data-debug-event-title maxlength="120" value="${escapeHtml(event.title || "")}" placeholder="例：地域連絡会議" /></label>
    <button type="button" data-remove-debug-event>削除</button>`;
  el.debugEventsList.append(row);
}

function renderDebugEventsEditor() {
  if (!el.debugEventsList) return;
  el.debugEventsList.innerHTML = "";
  const events = Array.isArray(settings.debug.events) ? settings.debug.events : [];
  events.forEach(appendDebugEventRow);
  if (!events.length) appendDebugEventRow();
}

function readDebugEventsEditor() {
  if (!el.debugEventsList) return [];
  return [...el.debugEventsList.querySelectorAll(".debug-event-row")]
    .map((row) => ({
      time: row.querySelector("[data-debug-event-time]")?.value || "",
      title: row.querySelector("[data-debug-event-title]")?.value.trim() || "",
    }))
    .filter((event) => event.title)
    .sort((a, b) => a.time.localeCompare(b.time));
}

function syncBackgroundSampleSelection() {
  if (!el.backgroundSampleList) return;
  const counts = new Map();
  for (const button of el.backgroundSampleList.querySelectorAll("[data-background-target]")) {
    const select = document.getElementById(button.dataset.backgroundTarget);
    const selected = readBackgroundSelection(select);
    const isSelected = selected.includes(button.dataset.backgroundValue);
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
    counts.set(button.dataset.backgroundTarget, selected.length);
  }
  for (const [targetId, count] of counts) {
    const label = el.backgroundSampleList.querySelector(`[data-selection-count="${targetId}"]`);
    if (label) label.textContent = `${count}枚選択`;
  }
}

function applyRichGlassTransparency(value) {
  return window.MORIYA_DISPLAY_THEME.applyTransparency(clampNumber(value, 80, 100, DEFAULT_SETTINGS.display.richTransparency));
}

function applyWindowBlurUi(enabled) {
  const isEnabled = Boolean(enabled);
  document.documentElement.dataset.windowBlur = isEnabled ? "on" : "off";
  if (el.windowOnlyBlur) el.windowOnlyBlur.checked = isEnabled;
  if (el.windowBlurControls) el.windowBlurControls.hidden = !isEnabled;
  if (el.richBlur) el.richBlur.disabled = !isEnabled;
  if (el.richTransparency) el.richTransparency.disabled = !isEnabled;
}

function applySettingsToUi() {
  document.documentElement.style.setProperty("--font-main", FONT_STACKS[settings.font] || FONT_STACKS.system);
  document.documentElement.style.setProperty("--font-number", FONT_STACKS[settings.numberFont] || FONT_STACKS.system);
  document.documentElement.style.setProperty("--font-clock", FONT_STACKS[settings.clockFont] || FONT_STACKS.system);
  document.documentElement.style.setProperty("--font-main-weight", settings.fontWeight || DEFAULT_SETTINGS.fontWeight);
  document.documentElement.style.setProperty("--font-number-weight", settings.numberFontWeight || DEFAULT_SETTINGS.numberFontWeight);
  document.documentElement.style.setProperty("--font-clock-weight", settings.clockFontWeight || DEFAULT_SETTINGS.clockFontWeight);
  document.documentElement.style.setProperty("--alert-orange", settings.trainAlerts.orangeColor);
  document.documentElement.style.setProperty("--alert-red", settings.trainAlerts.redColor);
  el.shell.dataset.mode = settings.display.mode || "new";
  el.shell.dataset.displayProfile = settings.display.profile === "tablet10" ? "tablet10" : "standard";
  settings.backgroundImages = (Array.isArray(settings.backgroundImages) ? settings.backgroundImages : []).slice(0, 5);
  settings.backgroundImage = settings.backgroundImages[0] || "";
  el.shell.classList.toggle("has-custom-bg", settings.backgroundImages.length > 0);
  el.shell.classList.toggle("hide-schedule", Boolean(settings.display.hideSchedule));
  if (settings.backgroundImages[0]) {
    el.shell.style.setProperty("--custom-bg-image", `url("${settings.backgroundImages[0]}")`);
  } else {
    el.shell.style.removeProperty("--custom-bg-image");
  }
  el.fontSelect.value = settings.font;
  el.numberFontSelect.value = settings.numberFont;
  el.clockFontSelect.value = settings.clockFont;
  syncAllFontWeightOptions({
    fontWeight: settings.fontWeight || DEFAULT_SETTINGS.fontWeight,
    numberFontWeight: settings.numberFontWeight || DEFAULT_SETTINGS.numberFontWeight,
    clockFontWeight: settings.clockFontWeight || DEFAULT_SETTINGS.clockFontWeight,
  });
  writeBackgroundSelection(el.sunnyBackgroundTheme, settings.backgroundThemes.sunny, DEFAULT_SETTINGS.backgroundThemes.sunny);
  writeBackgroundSelection(el.cloudyBackgroundTheme, settings.backgroundThemes.cloudy, DEFAULT_SETTINGS.backgroundThemes.cloudy);
  writeBackgroundSelection(el.rainBackgroundTheme, settings.backgroundThemes.rain, DEFAULT_SETTINGS.backgroundThemes.rain);
  writeBackgroundSelection(el.nightClearBackgroundTheme, settings.backgroundThemes.nightClear, DEFAULT_SETTINGS.backgroundThemes.nightClear);
  writeBackgroundSelection(el.nightCloudyBackgroundTheme, settings.backgroundThemes.nightCloudy, DEFAULT_SETTINGS.backgroundThemes.nightCloudy);
  writeBackgroundSelection(el.nightRainBackgroundTheme, settings.backgroundThemes.nightRain, DEFAULT_SETTINGS.backgroundThemes.nightRain);
  syncBackgroundSampleSelection();
  renderCustomBackgroundPreviews();
  if (el.backgroundSlideshowSeconds) el.backgroundSlideshowSeconds.value = String(settings.backgroundSlideshowSeconds || DEFAULT_SETTINGS.backgroundSlideshowSeconds);
  if (el.localVideoBeta) el.localVideoBeta.checked = Boolean(settings.display.localVideoBeta);
  syncLocalVideoControls(Boolean(settings.display.localVideoBeta));
  renderLivePowerSchedule(settings.videoQuietHours);
  el.icalUrl.value = settings.icalUrl;
  if (el.hideSchedule) el.hideSchedule.checked = Boolean(settings.display.hideSchedule);
  if (el.homeInfoMode) el.homeInfoMode.value = settings.homeInfoMode;
  setNatureRemoFieldsVisibility(settings.homeInfoMode);
  if (el.marketLabel1) el.marketLabel1.value = settings.market.items[0].label;
  if (el.marketSymbol1) el.marketSymbol1.value = settings.market.items[0].symbol;
  if (el.marketLabel2) el.marketLabel2.value = settings.market.items[1].label;
  if (el.marketSymbol2) el.marketSymbol2.value = settings.market.items[1].symbol;
  if (el.marketLabel3) el.marketLabel3.value = settings.market.items[2].label;
  if (el.marketSymbol3) el.marketSymbol3.value = settings.market.items[2].symbol;
  syncMarketPresetUi();
  if (el.natureRemoToken) el.natureRemoToken.value = settings.natureRemo.token;
  if (el.switchBotToken) el.switchBotToken.value = settings.switchBot?.token || "";
  if (el.switchBotSecret) el.switchBotSecret.value = settings.switchBot?.secret || "";
  if (el.tuyaEndpoint) el.tuyaEndpoint.value = settings.smartLife?.endpoint || DEFAULT_SETTINGS.smartLife.endpoint;
  if (el.tuyaAccessId) el.tuyaAccessId.value = settings.smartLife?.accessId || "";
  if (el.tuyaAccessSecret) el.tuyaAccessSecret.value = settings.smartLife?.accessSecret || "";
  if (el.tuyaUserId) el.tuyaUserId.value = settings.smartLife?.userId || "";
  if (el.tuyaDeviceIds) el.tuyaDeviceIds.value = settings.smartLife?.deviceIds || "";
  if (el.natureTemperatureDevice) el.natureTemperatureDevice.value = settings.natureRemo.temperatureDeviceId;
  if (el.natureActionCount) el.natureActionCount.value = String(settings.natureRemo.actionCount);
  [el.natureLabel1, el.natureLabel2, el.natureLabel3, el.natureLabel4].forEach((input, index) => {
    if (input) input.value = settings.natureRemo.actions[index].label;
  });
  [el.natureIcon1, el.natureIcon2, el.natureIcon3, el.natureIcon4].forEach((input, index) => {
    if (input) {
      input.value = settings.natureRemo.actions[index].icon;
      syncNatureIconPicker(input);
    }
  });
  [el.natureBadge1, el.natureBadge2, el.natureBadge3, el.natureBadge4].forEach((input, index) => {
    if (input) { input.value = settings.natureRemo.actions[index].badge || "none"; syncNatureBadgePicker(input); }
  });
  renderNatureScenesEditor(settings.natureRemo.scenes);
  populateNatureRemoSelectors();
  syncNatureActionRows(settings.homeInfoMode);
  syncMarketPresetUi();
  if (el.garbageHomeEnabled) el.garbageHomeEnabled.checked = settings.garbage.homeEnabled !== false;
  el.trainOffset.value = settings.trainOffsetMinutes;
  el.orangeMinutes.value = settings.trainAlerts.orangeMinutes;
  el.orangeColor.value = settings.trainAlerts.orangeColor;
  el.redMinutes.value = settings.trainAlerts.redMinutes;
  el.redColor.value = settings.trainAlerts.redColor;
  el.weatherQuery.value = settings.weather.name;
  el.weatherTitle.textContent = settings.weather.name;
  if (el.forecastMode) el.forecastMode.value = settings.display.forecastMode;
  settings.display.schedulePanelMode = "calendar";
  if (el.displayMode) el.displayMode.value = settings.display.mode || "new";
  if (el.displayProfile) el.displayProfile.value = settings.display.profile === "tablet10" ? "tablet10" : "standard";
  const animationMode = settings.display.animationMode || (settings.display.reduceMotion ? "off" : "light");
  settings.display.animationMode = animationMode;
  settings.display.reduceMotion = animationMode === "off";
  if (el.animationMode) el.animationMode.value = animationMode;
  settings.display.windowOnlyBlur = Boolean(settings.display.windowOnlyBlur);
  applyWindowBlurUi(settings.display.windowOnlyBlur);
  const richBlur = clampNumber(settings.display.richBlur, 0, 64, DEFAULT_SETTINGS.display.richBlur);
  settings.display.richBlur = richBlur;
  document.documentElement.style.setProperty("--rich-blur", `${richBlur}px`);
  if (el.richBlur) el.richBlur.value = String(richBlur);
  if (el.richBlurValue) el.richBlurValue.value = `${richBlur}px`;
  const richTransparency = applyRichGlassTransparency(settings.display.richTransparency);
  settings.display.richTransparency = richTransparency;
  if (el.richTransparency) el.richTransparency.value = String(richTransparency);
  if (el.richTransparencyValue) el.richTransparencyValue.value = `${richTransparency}%`;
  document.documentElement.dataset.animationMode = animationMode;
  document.documentElement.classList.toggle("motion-off", animationMode === "off");
  if (el.keepAwake) el.keepAwake.checked = Boolean(settings.android.keepAwake);
  if (el.androidAppSettings) el.androidAppSettings.hidden = !(window.Capacitor?.isNativePlatform?.() && getNativeSignagePlugin());
  el.debugEnabled.checked = settings.debug.enabled;
  el.debugDateTime.value = settings.debug.dateTime;
  el.debugWeatherCode.value = settings.debug.weatherCode;
  el.debugTemperature.value = settings.debug.temperature;
  renderDebugEventsEditor();
  updateCalendarDateUi();
  el.trainLeadLabel.textContent = `${settings.trainOffsetMinutes}分後以降の次発`;
  el.signage.classList.toggle("no-calendar", !settings.icalUrl);
  updateFontPreview();
  applyNativeSettings();
}

function updateFontPreview() {
  const bodyFont = FONT_STACKS[el.fontSelect.value] || FONT_STACKS.system;
  const numberFont = FONT_STACKS[el.numberFontSelect.value] || FONT_STACKS.system;
  const clockFont = FONT_STACKS[el.clockFontSelect.value] || FONT_STACKS.system;
  el.bodyFontPreview.style.fontFamily = bodyFont;
  el.bodyFontPreview.style.fontWeight = el.fontWeightSelect?.value || DEFAULT_SETTINGS.fontWeight;
  el.numberFontPreview.style.fontFamily = numberFont;
  el.numberFontPreview.style.fontWeight = el.numberFontWeightSelect?.value || DEFAULT_SETTINGS.numberFontWeight;
  el.clockFontPreview.style.fontFamily = clockFont;
  el.clockFontPreview.style.fontWeight = el.clockFontWeightSelect?.value || DEFAULT_SETTINGS.clockFontWeight;
}

function openSettings() {
  renderDebugEventsEditor();
  syncBackgroundSampleSelection();
  el.settingsDialog.hidden = false;
  el.settingsButton.setAttribute("aria-expanded", "true");
  document.dispatchEvent(new Event("moriya-settings-visibility"));
}

function closeSettings() {
  applyWindowBlurUi(settings.display.windowOnlyBlur);
  const richBlur = clampNumber(settings.display.richBlur, 0, 64, DEFAULT_SETTINGS.display.richBlur);
  document.documentElement.style.setProperty("--rich-blur", `${richBlur}px`);
  if (el.richBlur) el.richBlur.value = String(richBlur);
  if (el.richBlurValue) el.richBlurValue.value = `${richBlur}px`;
  const richTransparency = applyRichGlassTransparency(settings.display.richTransparency);
  if (el.richTransparency) el.richTransparency.value = String(richTransparency);
  if (el.richTransparencyValue) el.richTransparencyValue.value = `${richTransparency}%`;
  el.settingsDialog.hidden = true;
  el.settingsButton.setAttribute("aria-expanded", "false");
  document.dispatchEvent(new Event("moriya-settings-visibility"));
}

function getNativeSignagePlugin() {
  return window.Capacitor?.Plugins?.MoriyaSignage || null;
}

async function applyNativeSettings() {
  const plugin = getNativeSignagePlugin();
  if (!plugin) return;
  try {
    await plugin.enterFullscreen();
    await plugin.setKeepAwake({ enabled: Boolean(settings.android.keepAwake) });
  } catch (error) {
    console.warn("Android signage settings could not be applied.", error);
  }
}

function now() {
  if (!settings.debug.enabled || !settings.debug.dateTime) return new Date();
  ensureDebugClockAnchor();
  return new Date(Number(settings.debug.clockBaseMs) + (Date.now() - Number(settings.debug.clockStartedAtMs)));
}

function ensureDebugClockAnchor(force = false) {
  const parsed = Date.parse(settings?.debug?.dateTime || "");
  if (!settings?.debug?.enabled || !Number.isFinite(parsed)) return false;
  const base = Number(settings.debug.clockBaseMs);
  const started = Number(settings.debug.clockStartedAtMs);
  if (!force && Number.isFinite(base) && Number.isFinite(started) && started > 0) return false;
  settings.debug.clockBaseMs = parsed;
  settings.debug.clockStartedAtMs = Date.now();
  return true;
}

function debugEventsForDate(dateKey) {
  if (!settings.debug.enabled || dateKey !== tokyoDateKey(now())) return [];
  return (Array.isArray(settings.debug.events) ? settings.debug.events : [])
    .filter((event) => event?.title)
    .map((event) => ({ startLabel: event.time || "終日", title: event.title, meta: "" }));
}

function tokyoParts(date) {
  const parts = TOKYO_PARTS_FORMATTER.formatToParts(date);
  return Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
}

function tokyoDateKey(date) {
  const p = tokyoParts(date);
  return `${p.year}-${p.month}-${p.day}`;
}

function formatTime(date, options = {}) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  }).format(date);
}

function formatCalendarDateTitle(dateKey) {
  if (dateKey === tokyoDateKey(now())) return "今日の予定";
  const date = dateFromKey(dateKey);
  const parts = tokyoParts(date);
  const weekday = TOKYO_WEEKDAY_JA_FORMATTER.format(date).replace("曜", "");
  return `${Number(parts.month)}月${Number(parts.day)}日（${weekday}）の予定`;
}

function updateCalendarDateUi() {
  if (el.calendarTitle) el.calendarTitle.textContent = formatCalendarDateTitle(selectedCalendarDateKey);
  if (el.calendarDateInput) el.calendarDateInput.value = selectedCalendarDateKey;
}

function setupCalendarDateControl() {
  if (!el.calendarDateButton || !el.calendarDateDialog || !el.calendarDateInput) return;

  let ignoreClickUntil = 0;
  let dialogUnlockAt = 0;
  let unlockTimer = 0;
  const isDialogLocked = () => performance.now() < dialogUnlockAt;

  const closeDateDialog = (force = false) => {
    if (!force && isDialogLocked()) return;
    clearTimeout(unlockTimer);
    el.calendarDateDialog.classList.remove("input-locked");
    el.calendarDateDialog.hidden = true;
    el.calendarDateButton.focus({ preventScroll: true });
  };

  const openDateDialog = (event, fromTouch = false) => {
    event?.preventDefault();
    event?.stopPropagation();
    const openedAt = performance.now();
    if (!el.calendarDateDialog.hidden) return;
    if (fromTouch) ignoreClickUntil = openedAt + 700;
    dialogUnlockAt = openedAt + 550;
    clearTimeout(unlockTimer);
    el.calendarDateInput.value = selectedCalendarDateKey;
    el.calendarDateDialog.classList.add("input-locked");
    el.calendarDateDialog.hidden = false;
    unlockTimer = window.setTimeout(() => {
      el.calendarDateDialog.classList.remove("input-locked");
      dialogUnlockAt = 0;
      el.calendarDateInput.focus({ preventScroll: true });
    }, 550);
  };

  const applySelectedDate = (dateKey) => {
    if (!dateKey || isDialogLocked()) return;
    selectedCalendarDateKey = dateKey;
    calendarFollowsToday = dateKey === tokyoDateKey(now());
    lastCalendarSignature = "";
    updateCalendarDateUi();
    closeDateDialog(true);
    void loadCalendar(true);
  };

  el.calendarDateButton.addEventListener("pointerup", (event) => {
    if (event.pointerType === "touch" || event.pointerType === "pen") {
      openDateDialog(event, true);
    }
  });
  el.calendarDateButton.addEventListener("click", (event) => {
    if (performance.now() < ignoreClickUntil) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    openDateDialog(event, false);
  });
  el.calendarDateApply?.addEventListener("click", () => applySelectedDate(el.calendarDateInput.value));
  el.calendarTodayButton?.addEventListener("click", () => applySelectedDate(tokyoDateKey(now())));
  el.calendarDateClose?.addEventListener("click", () => closeDateDialog());
  el.calendarDateDialog.addEventListener("click", (event) => {
    if (event.target === el.calendarDateDialog) closeDateDialog();
  });
  el.calendarDateInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applySelectedDate(el.calendarDateInput.value);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !el.calendarDateDialog.hidden) closeDateDialog(true);
  });
}

function setAnimatedText(node, value) {
  if (!node || node.textContent === value) return false;
  node.textContent = value;
  if (settings.display.reduceMotion) return true;
  const richNumber = settings.display.animationMode === "rich" && [el.clockHour, el.clockMinute].includes(node);
  node.classList.remove("text-swap", "rich-number-swap");
  void node.offsetWidth;
  node.classList.add(richNumber ? "rich-number-swap" : "text-swap");
  setTimeout(() => node.classList.remove("text-swap", "rich-number-swap"), richNumber ? 560 : 380);
  return true;
}

function setAnimatedHtml(node, html, signature) {
  if (node.dataset.signature === signature) return false;
  node.dataset.signature = signature;
  node.innerHTML = html;
  if (settings.display.reduceMotion) return true;
  node.classList.remove("content-swap");
  void node.offsetWidth;
  node.classList.add("content-swap");
  setTimeout(() => node.classList.remove("content-swap"), 420);
  return true;
}

function tick() {
  const current = now();
  const p = tokyoParts(current);
  setAnimatedText(el.clockHour, p.hour);
  setAnimatedText(el.clockMinute, p.minute);
  el.seconds.textContent = p.second.padStart(2, "0");
  setAnimatedText(
    el.date,
    `${Number(p.month)}/${Number(p.day)}`,
  );
  setAnimatedText(el.weekday, TOKYO_WEEKDAY_JA_FORMATTER.format(current).replace("曜", ""));
  updateAtmosphere();
  const currentDateKey = tokyoDateKey(current);
  const dateChanged = currentDateKey !== lastScheduleDateKey;
  if (dateChanged) {
    lastScheduleDateKey = currentDateKey;
    if (calendarFollowsToday) selectedCalendarDateKey = currentDateKey;
    lastCalendarSignature = "";
    updateCalendarDateUi();
    void loadCalendar(true);
  }
  const minuteKey = `${currentDateKey} ${p.hour}:${p.minute}`;
  if (minuteKey !== lastMinuteKey) {
    lastMinuteKey = minuteKey;
    renderTrains();
  }
  document.dispatchEvent(new CustomEvent("moriya-tick", { detail: { date: current, minuteKey } }));
}

async function loadTimetable() {
  if (window.TX_MORIYA_AKIHABARA_TIMETABLE) {
    timetable = window.TX_MORIYA_AKIHABARA_TIMETABLE;
    renderTrains(true);
    return;
  }
  try {
    const response = await fetch("./data/tx-moriya-akihabara.json", { cache: "no-store" });
    timetable = await response.json();
    renderTrains(true);
  } catch {
    setAnimatedHtml(el.trains, '<li class="train-item train-empty">時刻表データを読み込めませんでした</li>', "timetable-error");
  }
}

function isHolidayOrWeekend(date) {
  const weekday = TOKYO_WEEKDAY_EN_FORMATTER.format(date);
  return weekday === "Sat" || weekday === "Sun" || HOLIDAYS.has(tokyoDateKey(date));
}

function minutesInTokyo(date) {
  const p = tokyoParts(date);
  return Number(p.hour) * 60 + Number(p.minute);
}

function renderTrains(force = false) {
  const current = now();
  const currentMinutes = minutesInTokyo(current);
  const target = new Date(current.getTime() + settings.trainOffsetMinutes * 60 * 1000);
  const targetMinutes = minutesInTokyo(target);
  const targetDateChanged = tokyoDateKey(target) !== tokyoDateKey(current);
  const dayType = isHolidayOrWeekend(current) ? "weekend" : "weekday";
  const table = timetable[dayType] || [];
  setAnimatedText(el.trainDayType, dayType === "weekend" ? "土休日" : "平日");
  const upcoming = targetDateChanged
    ? []
    : table
        .filter((train) => train.hour * 60 + train.minute >= targetMinutes)
        .slice(0, 10)
        .map((train) => ({ ...train, waitMinutes: train.hour * 60 + train.minute - currentMinutes }));
  const signature = JSON.stringify(upcoming.map((train) => [
    train.time,
    train.kind,
    train.destination,
    train.startsHere,
    train.waitMinutes,
    settings.trainAlerts.orangeMinutes,
    settings.trainAlerts.redMinutes,
  ]));
  if (!force && signature === lastTrainSignature) return;
  lastTrainSignature = signature;
  const next = upcoming[0];
  if (!next) {
    el.nextTrainBox.className = "next-train service-ended";
    el.nextTrainService.hidden = true;
    el.nextTrainSub.hidden = true;
    setAnimatedText(el.nextTrainKind, "");
    setAnimatedText(el.nextTrainOrigin, "");
    setAnimatedHtml(el.nextTrainSub, "", "service-ended-wait");
    setAnimatedText(el.nextTrain, "本日の運転終了");
    el.nextTrainService.className = "service-cell";
    setNextTrainNote(["日付が変わると始発から表示します"]);
    setAnimatedHtml(el.trains, '<li class="train-item train-empty">次回は日付変更後の始発から表示します</li>', "service-ended");
    return;
  }
  el.nextTrainService.hidden = false;
  el.nextTrainSub.hidden = false;
  el.nextTrainBox.className = `next-train ${next.kind} ${alertClass(next.waitMinutes)} is-updating`;
  setTimeout(() => el.nextTrainBox.classList.remove("is-updating"), 320);
  setAnimatedText(el.nextTrain, next.time);
  setAnimatedHtml(el.nextTrainSub, waitMarkup(next.waitMinutes), `wait-${next.waitMinutes}`);
  setAnimatedText(el.nextTrainKind, SERVICE_LABELS[next.kind]);
  el.nextTrainKind.className = `service-chip ${next.kind}`;
  el.nextTrainService.className = `service-cell ${next.kind}`;
  const nextSubLabel = trainServiceSubLabel(next);
  el.nextTrainOrigin.hidden = !nextSubLabel;
  setAnimatedText(el.nextTrainOrigin, nextSubLabel);
  setNextTrainNote([]);
  setAnimatedHtml(el.trains, upcoming.slice(1).map(trainItem).join(""), signature);
}

function waitMarkup(minutes) {
  return `<span class="wait-number">${escapeHtml(String(minutes))}</span><span class="wait-unit">分後</span>`;
}

function trainItem(train) {
  const notes = trainNotes(train);
  const subLabel = trainServiceSubLabel(train);
  return `
    <li class="train-item ${train.kind} ${alertClass(train.waitMinutes)}">
      <div class="service-cell ${train.kind}">
        <span class="service-chip ${train.kind}">${SERVICE_LABELS[train.kind]}</span>
        ${subLabel ? `<span class="origin-label">${escapeHtml(subLabel)}</span>` : '<span class="origin-label is-empty"></span>'}
      </div>
      <div class="train-time numeric-text">${train.time}</div>
      <div class="train-wait">${waitMarkup(train.waitMinutes)}</div>
      ${notes.length ? `<div class="train-note">${notes.map(escapeHtml).join(" / ")}</div>` : ""}
    </li>
  `;
}

function trainNotes(train) {
  return [];
}

function trainServiceSubLabel(train) {
  const labels = [];
  if (train.startsHere) labels.push("当駅始発");
  if (train.destination && train.destination !== "秋葉原") labels.push(`${train.destination}行`);
  return labels.join("・");
}

function alertClass(waitMinutes) {
  if (waitMinutes <= Number(settings.trainAlerts.redMinutes)) return "alert-red";
  if (waitMinutes <= Number(settings.trainAlerts.orangeMinutes)) return "alert-orange";
  return "";
}

function setNextTrainNote(notes) {
  const text = notes.join(" / ");
  el.nextTrainNote.hidden = !text;
  setAnimatedText(el.nextTrainNote, text);
}

async function loadWeather(manual = false) {
  if (weatherTimer) clearTimeout(weatherTimer);
  el.refreshWeather.classList.toggle("is-loading", manual);
  if (settings.debug.enabled && (settings.debug.weatherCode || settings.debug.temperature !== "")) {
    const code = settings.debug.weatherCode ? Number(settings.debug.weatherCode) : 1;
    const temp = settings.debug.temperature !== "" ? Number(settings.debug.temperature) : "--";
    const daysAll = debugDailyForecast(code, temp, 7, 0);
    applyWeather({
      code,
      temp,
      precipitation: "--",
      wind: "--",
      hours: debugForecast(code, temp),
      hoursAll: debugForecast(code, temp, 12),
      today: daysAll[0],
      days: daysAll.slice(1, 5),
      daysAll,
    });
    el.refreshWeather.classList.remove("is-loading");
    weatherTimer = setTimeout(() => loadWeather(false), 10 * 60 * 1000);
    return;
  }
  const params = new URLSearchParams({
    latitude: settings.weather.latitude,
    longitude: settings.weather.longitude,
    timezone: "Asia/Tokyo",
    current: "temperature_2m,weather_code,precipitation,wind_speed_10m",
    hourly: "temperature_2m,weather_code,precipitation_probability",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    forecast_days: "7",
  });
  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    const data = await response.json();
    const code = settings.debug.enabled && settings.debug.weatherCode ? Number(settings.debug.weatherCode) : data.current.weather_code;
    const temp = settings.debug.enabled && settings.debug.temperature !== "" ? Number(settings.debug.temperature) : Math.round(data.current.temperature_2m);
    const hoursAll = data.hourly.time
      .map((time, index) => ({
        time: new Date(time),
        temp: Math.round(data.hourly.temperature_2m[index]),
        rain: data.hourly.precipitation_probability[index],
        code: data.hourly.weather_code[index],
      }))
      .filter((item) => item.time >= now())
      .slice(0, 12);
    const daysAll = data.daily.time.map((date, index) => ({
      date: new Date(`${date}T00:00:00`),
      code: data.daily.weather_code[index],
      max: Math.round(data.daily.temperature_2m_max[index]),
      min: Math.round(data.daily.temperature_2m_min[index]),
      rain: data.daily.precipitation_probability_max[index],
    }));
    applyWeather({
      code,
      temp,
      precipitation: data.current.precipitation ?? 0,
      wind: Math.round(data.current.wind_speed_10m),
      hours: hoursAll.slice(0, 4),
      hoursAll,
      today: daysAll.find((item) => tokyoDateKey(item.date) === tokyoDateKey(now())) || daysAll[0],
      days: daysAll.filter((item) => tokyoDateKey(item.date) > tokyoDateKey(now())).slice(0, 4),
      daysAll,
    });
  } catch {
    const code = settings.debug.enabled && settings.debug.weatherCode ? Number(settings.debug.weatherCode) : 3;
    const temp = settings.debug.enabled && settings.debug.temperature !== "" ? Number(settings.debug.temperature) : "--";
    applyWeather({ code, temp, precipitation: "--", wind: "--", hours: [], days: [] });
    el.weatherDetail.textContent = "オンライン接続で更新します";
    el.weatherStatus.textContent = "未更新";
  } finally {
    el.refreshWeather.classList.remove("is-loading");
    weatherTimer = setTimeout(() => loadWeather(false), 10 * 60 * 1000);
  }
}

function debugForecast(code, temp, count = 4) {
  const baseTemp = Number.isFinite(Number(temp)) ? Number(temp) : "--";
  return Array.from({ length: count }, (_, index) => {
    const time = new Date(now().getTime() + (index + 1) * 60 * 60 * 1000);
    return {
      time,
      code,
      temp: baseTemp === "--" ? "--" : baseTemp - Math.min(index, 4),
      rain: code >= 50 ? 60 : 10,
    };
  });
}

function debugDailyForecast(code, temp, count = 4, startOffset = 1) {
  const baseTemp = Number.isFinite(Number(temp)) ? Number(temp) : "--";
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now());
    date.setDate(date.getDate() + index + startOffset);
    const offset = index + startOffset;
    return {
      date,
      code,
      max: baseTemp === "--" ? "--" : baseTemp + Math.max(0, 2 - index),
      min: baseTemp === "--" ? "--" : baseTemp - 5 - offset,
      rain: code >= 50 ? 60 : 10,
    };
  });
}

function applyWeather({ code, temp, precipitation, wind, hours, days }) {
  const [summary, , atmosphere] = WEATHER_CODES[code] || ["天気", "•", "cloudy"];
  const hour = Number(tokyoParts(now()).hour);
  const icon = materialWeatherIconName(code, hour >= 17 || hour < 5);
  el.shell.dataset.weather = atmosphere;
  setAnimatedText(el.weatherTitle, settings.weather.name);
  setAnimatedText(el.temperature, `${temp}°`);
  setAnimatedText(el.weatherIcon, icon);
  el.weatherSummary.classList.toggle("is-long-weather", [...summary].length >= 4);
  setAnimatedText(el.weatherSummary, summary);
  setAnimatedText(el.weatherDetail, `降水 ${precipitation}mm / 風 ${wind}m/s`);
  setAnimatedText(el.weatherStatus, `${formatTime(now())} 更新`);
  renderForecast({ hours, days });
}

function renderForecast({ hours = [], days = [] }) {
  const isDaily = settings.display.forecastMode === "daily";
  el.forecast.classList.toggle("forecast-weekly", isDaily);
  if (isDaily) {
    renderDailyForecast(days);
  } else {
    renderHourlyForecast(hours);
  }
}

function renderHourlyForecast(hours) {
  const fallback = ["このあと", "昼ごろ", "夕方", "夜"].map((label) => ({ label, temp: "--", rain: "--", icon: "cloud" }));
  const items = hours.length
    ? hours.map((item) => {
        const itemHour = Number(tokyoParts(item.time).hour);
        return {
          label: formatTime(item.time, { hour: "numeric", minute: undefined }),
          temp: item.temp,
          rain: item.rain ?? 0,
          icon: materialWeatherIconName(item.code, itemHour >= 17 || itemHour < 5),
        };
      })
    : fallback;
  const signature = JSON.stringify(items);
  if (signature === lastWeatherSignature) return;
  lastWeatherSignature = signature;
  setAnimatedHtml(
    el.forecast,
    items
      .map(
        (item) => `
          <div class="forecast-item">
            <div class="forecast-time">${item.label}</div>
            <span class="material-symbols-outlined forecast-icon" aria-hidden="true">${item.icon}</span>
            <div class="forecast-temp numeric-text" aria-label="${item.temp}度">${item.temp}</div>
            <div class="forecast-rain">${item.rain}%</div>
          </div>
        `,
      )
      .join(""),
    signature,
  );
}

function renderDailyForecast(days) {
  const fallback = ["明日", "2日後", "3日後", "4日後"].map((label) => ({ label, temp: "--/--", rain: "--", icon: "cloud" }));
  const items = days.length
    ? days.map((item, index) => {
        return {
          label: index === 0 ? "明日" : new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric", weekday: "short" }).format(item.date).replace("曜", ""),
          temp: `${item.max}/${item.min}`,
          rain: item.rain ?? 0,
          icon: materialWeatherIconName(item.code, false),
        };
      })
    : fallback;
  const signature = `daily:${JSON.stringify(items)}`;
  if (signature === lastWeatherSignature) return;
  lastWeatherSignature = signature;
  setAnimatedHtml(
    el.forecast,
    items
      .map(
        (item) => `
          <div class="forecast-item">
            <div class="forecast-time">${item.label}</div>
            <span class="material-symbols-outlined forecast-icon" aria-hidden="true">${item.icon}</span>
            <div class="forecast-temp numeric-text" aria-label="最高最低気温 ${item.temp}度">${item.temp}</div>
            <div class="forecast-rain">${item.rain}%</div>
          </div>
        `,
      )
      .join(""),
    signature,
  );
}

function updateAtmosphere() {
  const hour = Number(tokyoParts(now()).hour);
  el.shell.dataset.time = hour >= 5 && hour < 11 ? "morning" : hour >= 17 || hour < 5 ? "night" : "day";
}

async function searchWeatherLocation(query) {
  const params = new URLSearchParams({ name: query, count: "5", language: "ja", format: "json" });
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
  const data = await response.json();
  const result = data.results?.[0];
  if (!result) throw new Error("地点が見つかりませんでした");
  settings.weather = { name: [result.admin1, result.name].filter(Boolean).join(" "), latitude: result.latitude, longitude: result.longitude };
  saveSettings();
  applySettingsToUi();
  await loadWeather(true);
}

async function loadCalendar(forceFetch = false) {
  const loadId = ++calendarLoadSequence;
  const targetDateKey = selectedCalendarDateKey;
  if (settings.display.hideSchedule) {
    el.events.innerHTML = "";
    el.calendarStatus.textContent = "";
    el.events.removeAttribute("aria-busy");
    lastCalendarSignature = "";
    window.MoriyaNewUi?.renderCalendars?.();
    renderTrains(true);
    return;
  }
  if (!settings.icalUrl) {
    el.signage.classList.add("no-calendar");
    const debugEvents = debugEventsForDate(targetDateKey);
    if (debugEvents.length) renderEvents(debugEvents, `debug:${targetDateKey}`);
    else el.events.innerHTML = "";
    el.calendarStatus.textContent = "";
    el.events.removeAttribute("aria-busy");
    lastCalendarSignature = "";
    cachedIcalUrl = "";
    cachedIcalText = "";
    cachedIcalDefinitions = null;
    cachedCalendarEventsByDate.clear();
    window.MoriyaNewUi?.renderCalendars?.();
    renderTrains(true);
    return;
  }
  el.signage.classList.remove("no-calendar");
  updateCalendarDateUi();
  const normalizedUrl = normalizeIcalUrl(settings.icalUrl);
  const canUseDateCache =
    !forceFetch &&
    cachedIcalText &&
    cachedIcalUrl === normalizedUrl &&
    cachedCalendarEventsByDate.has(targetDateKey);

  if (!canUseDateCache && !forceFetch) {
    renderCalendarLoading(targetDateKey);
    await waitForUiPaint();
  }

  try {
    if (forceFetch || !cachedIcalText || cachedIcalUrl !== normalizedUrl) {
      const freshText = await fetchIcalText(normalizedUrl);
      if (loadId !== calendarLoadSequence) return;
      cachedIcalText = freshText;
      cachedIcalUrl = normalizedUrl;
      cachedIcalDefinitions = null;
      cachedCalendarEventsByDate.clear();
    }

    let events = cachedCalendarEventsByDate.get(targetDateKey);
    if (!events) {
      if (forceFetch) await waitForUiPaint();
      if (!cachedIcalDefinitions) cachedIcalDefinitions = parseIcalDefinitions(cachedIcalText);
      events = expandIcalEvents(cachedIcalDefinitions, targetDateKey)
        .filter((event) => eventOccursOnDate(event, targetDateKey))
        .sort((a, b) => a.start - b.start);
      cachedCalendarEventsByDate.set(targetDateKey, events);
    }
    if (loadId !== calendarLoadSequence || targetDateKey !== selectedCalendarDateKey) return;

    renderEvents(
      events.length
        ? events.map((event) => ({
            startLabel: event.allDay ? "終日" : formatTime(event.start),
            title: event.summary || "無題の予定",
            meta: isCalendarSourceLabel(event.location) ? "" : event.location || "",
          }))
        : [{ startLabel: "--", title: "この日の予定はありません", meta: "" }],
      `ical:${targetDateKey}`,
    );
    el.events.removeAttribute("aria-busy");
    setAnimatedText(el.calendarStatus, `${formatTime(now())} 更新`);
  } catch (error) {
    if (loadId !== calendarLoadSequence) return;
    console.warn("Calendar could not be loaded.", error);
    renderEvents(
      [{ startLabel: "--", title: "カレンダーを読み込めませんでした", meta: "起動方法またはiCal URLを確認してください" }],
      `error:${targetDateKey}`,
    );
    el.events.removeAttribute("aria-busy");
    el.calendarStatus.textContent = "Google Calendarに接続できませんでした";
  }
}

function renderCalendarLoading(dateKey) {
  el.events.setAttribute("aria-busy", "true");
  setAnimatedHtml(
    el.events,
    `
      <li class="event-item calendar-loading">
        <div>
          <div class="event-title"><span class="event-title-text">予定を読み込んでいます</span></div>
          <div class="event-meta">しばらくお待ちください</div>
        </div>
        <span class="loading-spinner" aria-hidden="true"></span>
      </li>
    `,
    `loading:${dateKey}`,
  );
  setAnimatedText(el.calendarStatus, "予定を確認しています…");
}

function waitForUiPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 0)));
  });
}

function normalizeIcalUrl(url) {
  const trimmed = String(url || "").trim();
  if (trimmed.startsWith("webcal://")) return `https://${trimmed.slice("webcal://".length)}`;
  return trimmed;
}

async function fetchIcalText(url) {
  const normalized = normalizeIcalUrl(url);
  let lastError = null;
  const nativePlugin = getNativeSignagePlugin();
  if (nativePlugin?.fetchIcal) {
    try {
      const result = await nativePlugin.fetchIcal({ url: normalized });
      if (/BEGIN:VCALENDAR|BEGIN:VEVENT/.test(result?.text || "")) return result.text;
      throw new Error("The Android iCal response was not a calendar.");
    } catch (error) {
      lastError = error;
    }
  }
  if (location.protocol === "http:" || location.protocol === "https:") {
    try {
      const response = await fetch("./api/ical", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalized }),
      });
      if (!response.ok) throw new Error(`Local iCal proxy returned HTTP ${response.status}`);
      const text = await response.text();
      if (/BEGIN:VCALENDAR|BEGIN:VEVENT/.test(text)) return text;
      throw new Error("The local iCal response was not a calendar.");
    } catch (error) {
      lastError = error;
    }
  }
  for (const toFetchUrl of ICAL_FETCHERS) {
    const fetchUrl = toFetchUrl(normalized);
    try {
      const response = await fetch(fetchUrl, { cache: "no-store", redirect: "follow" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      if (/BEGIN:VCALENDAR|BEGIN:VEVENT/.test(text)) return text;
      throw new Error("The response was not an iCal file.");
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("Could not load iCal.");
}

function marketQuoteFromChart(symbol, payload) {
  const result = payload?.chart?.result?.[0];
  const meta = result?.meta || {};
  const price = Number(meta.regularMarketPrice);
  const previousClose = Number(meta.chartPreviousClose ?? meta.previousClose);
  const sourceChangePercent = Number(meta.regularMarketChangePercent ?? meta.fulldayChangePercent);
  if (!Number.isFinite(price)) throw new Error(`No quote was returned for ${symbol}.`);
  return {
    symbol,
    price,
    previousClose: Number.isFinite(previousClose) ? previousClose : null,
    changePercent: Number.isFinite(sourceChangePercent)
      ? sourceChangePercent
      : Number.isFinite(previousClose) && previousClose !== 0 ? ((price - previousClose) / previousClose) * 100 : null,
    currency: meta.currency || "",
    marketTime: Number(meta.regularMarketTime || 0) * 1000,
  };
}

function readMarketCache() {
  try {
    const cached = JSON.parse(localStorage.getItem("moriyaMarketCache") || "null");
    return Array.isArray(cached?.quotes) ? cached : null;
  } catch {
    return null;
  }
}

function emitMarketQuotes(quotes, stale = false, fetchedAt = Date.now()) {
  const bySymbol = new Map((quotes || []).map((quote) => [quote.symbol, quote]));
  const sourceItems = settings.market.items.slice(0, settings.homeInfoMode === "hybrid" ? 2 : 3);
  const items = sourceItems.map((item) => ({ ...item, ...(bySymbol.get(item.symbol) || {}), fetchedAt }));
  const detail = { enabled: ["market", "hybrid"].includes(settings.homeInfoMode), items, stale, fetchedAt };
  window.__moriyaMarketPayload = detail;
  document.dispatchEvent(new CustomEvent("moriya-market-data", { detail }));
  window.MoriyaNewUi?.renderMarket?.(detail);
}

async function fetchMarketQuotes(force = false) {
  const requestId = ++marketLoadSequence;
  settings.market = normalizeMarketSettings(settings.market);
  if (!["market", "hybrid"].includes(settings.homeInfoMode)) {
    emitMarketQuotes([], false);
    return [];
  }
  const configuredItems = settings.market.items.slice(0, settings.homeInfoMode === "hybrid" ? 2 : 3);
  const symbols = [...new Set(configuredItems.map((item) => item.symbol).filter(Boolean))];
  const cached = readMarketCache();
  const matchingCache = cached && symbols.every((symbol) => cached.quotes.some((quote) => quote.symbol === symbol));
  if (matchingCache) emitMarketQuotes(cached.quotes, true, Number(cached.fetchedAt || Date.now()));
  if (!force && matchingCache && Date.now() - Number(cached.fetchedAt || 0) < 5 * 60 * 1000) return cached.quotes;

  try {
    let quotes = [];
    const nativePlugin = getNativeSignagePlugin();
    if (nativePlugin?.fetchMarket) {
      const results = await Promise.allSettled(symbols.map(async (symbol) => {
        const result = await nativePlugin.fetchMarket({ symbol });
        return marketQuoteFromChart(symbol, JSON.parse(result?.text || "{}"));
      }));
      quotes = results.filter((result) => result.status === "fulfilled").map((result) => result.value);
      if (!quotes.length) throw new Error("No requested market symbols returned a quote.");
    } else {
      const response = await fetch("./api/market", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols }),
      });
      if (!response.ok) throw new Error(`Local market proxy returned HTTP ${response.status}`);
      quotes = (await response.json()).quotes || [];
    }
    if (requestId !== marketLoadSequence) return [];
    const cacheValue = { quotes, fetchedAt: Date.now() };
    localStorage.setItem("moriyaMarketCache", JSON.stringify(cacheValue));
    emitMarketQuotes(quotes, false, cacheValue.fetchedAt);
    return quotes;
  } catch (error) {
    console.warn("Market information could not be loaded.", error);
    if (!matchingCache && requestId === marketLoadSequence) emitMarketQuotes([], true);
    return [];
  }
}

function natureTokenKey(token) {
  return token ? `${token.length}:${token.slice(-8)}` : "";
}

function readNatureRemoCache(token) {
  try {
    const cached = JSON.parse(localStorage.getItem("moriyaNatureRemoCache") || "null");
    return cached?.tokenKey === natureTokenKey(token) && Array.isArray(cached.devices) && Array.isArray(cached.appliances) ? cached : null;
  } catch {
    return null;
  }
}

function makeNatureRemoPayload(discovery, stale = false, error = "") {
  const devices = Array.isArray(discovery?.devices) ? discovery.devices : [];
  const preferredId = settings.natureRemo.temperatureDeviceId;
  const sensorDevices = devices.filter((device) => Number.isFinite(Number(device?.newest_events?.te?.val)));
  const device = sensorDevices.find((item) => item.id === preferredId)
    || sensorDevices.sort((a, b) => Date.parse(b?.newest_events?.te?.created_at || 0) - Date.parse(a?.newest_events?.te?.created_at || 0))[0]
    || null;
  return {
    enabled: ["remo", "hybrid"].includes(settings.homeInfoMode),
    mode: settings.homeInfoMode,
    temperature: device ? Number(device.newest_events.te.val) : null,
    updatedAt: device?.newest_events?.te?.created_at || discovery?.fetchedAt || null,
    deviceName: device?.name || "",
    actions: settings.natureRemo.actions.slice(0, settings.homeInfoMode === "hybrid" ? 1 : settings.natureRemo.actionCount)
      .map((item) => ({ ...item, icon: natureActionIcon(item.action, item.icon), configured: Boolean(item.action) })),
    stale,
    error,
  };
}

function emitNatureRemo(discovery = latestNatureRemoDiscovery, stale = false, error = "") {
  latestNatureRemoPayload = makeNatureRemoPayload(discovery || {}, stale, error);
  window.__moriyaNatureRemoPayload = latestNatureRemoPayload;
  document.dispatchEvent(new CustomEvent("moriya-nature-remo-data", { detail: latestNatureRemoPayload }));
  window.MoriyaNewUi?.renderNatureRemo?.(latestNatureRemoPayload);
}

async function requestNatureRemoDiscovery(token) {
  const nativePlugin = getNativeSignagePlugin();
  if (nativePlugin?.fetchNatureRemo) {
    const result = await nativePlugin.fetchNatureRemo({ token });
    return JSON.parse(result?.text || "{}");
  }
  const response = await fetch("./api/nature-remo/discover", {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!response.ok) throw new Error(response.status === 401 ? "アクセストークンを確認してください。" : `Nature Remo API returned HTTP ${response.status}.`);
  return response.json();
}

async function loadNatureRemo(force = false, tokenOverride = "") {
  const requestId = ++natureRemoLoadSequence;
  const token = normalizeNatureToken(tokenOverride || settings.natureRemo.token);
  if (tokenOverride && el.natureRemoToken) el.natureRemoToken.value = token;
  if (!["remo", "hybrid"].includes(settings.homeInfoMode) && !tokenOverride) {
    emitNatureRemo({}, false);
    return null;
  }
  if (!token) {
    const hasOtherAction = settings.natureRemo.actions.some((item) => ["switchbot", "tuya", "scene"].includes(item.action?.kind));
    emitNatureRemo({}, false, hasOtherAction ? "" : "アクセストークンを設定してください");
    if (el.natureRemoStatus) el.natureRemoStatus.textContent = hasOtherAction ? "他サービスの家電操作を使用中" : "アクセストークンを入力してください";
    return null;
  }
  const cached = readNatureRemoCache(token);
  if (cached) {
    latestNatureRemoDiscovery = cached;
    emitNatureRemo(cached, true);
    populateNatureRemoSelectors(cached);
  }
  if (!force && cached && Date.now() - Number(cached.fetchedAt || 0) < 5 * 60 * 1000) return cached;
  if (el.natureRemoStatus) el.natureRemoStatus.textContent = "Nature Remoに接続中…";
  try {
    const discovery = await requestNatureRemoDiscovery(token);
    if (requestId !== natureRemoLoadSequence) return null;
    const cacheValue = { devices: discovery.devices || [], appliances: discovery.appliances || [], fetchedAt: Date.now(), tokenKey: natureTokenKey(token) };
    localStorage.setItem("moriyaNatureRemoCache", JSON.stringify(cacheValue));
    latestNatureRemoDiscovery = cacheValue;
    populateNatureRemoSelectors(cacheValue);
    emitNatureRemo(cacheValue, false);
    if (el.natureRemoStatus) el.natureRemoStatus.textContent = `接続済み：Remo ${cacheValue.devices.length}台／家電 ${cacheValue.appliances.length}件`;
    return cacheValue;
  } catch (error) {
    if (requestId !== natureRemoLoadSequence) return null;
    const message = error?.message || "Nature Remoに接続できませんでした";
    if (el.natureRemoStatus) el.natureRemoStatus.textContent = message;
    if (!cached) emitNatureRemo({}, true, message);
    return null;
  }
}

async function sendNatureRemoAction(index, source = "home") {
  const item = source === "panel" ? settings.natureRemo.panelActions[index] : settings.natureRemo.actions[index];
  return sendConfiguredNatureAction(item, source, index);
}

async function sendConfiguredNatureAction(item, source, index, scheduledScene = null) {
  const token = settings.natureRemo.token;
  const natureKinds = new Set(["signal", "tv", "light", "aircon"]);
  const report = (state, message = "") => document.dispatchEvent(new CustomEvent("moriya-nature-action-state", { detail: { index, source, state, message } }));
  if (!item?.action || (natureKinds.has(item.action.kind) && !token)) {
    report("error", "家電の接続設定を確認してください。");
    return false;
  }
  report("sending");
  try {
    if (item.action.kind === "scene") {
      const scene = scheduledScene || settings.natureRemo.scenes.find((candidate) => candidate.id === item.action.id);
      if (!scene) throw new Error("サイネージ内シーンが見つかりません。");
      const executableSteps = scene.steps.filter((step) => step.type === "wait" || step.action);
      if (!executableSteps.some((step) => step.type === "action" && step.action)) throw new Error("シーンに家電操作がありません。");
      for (const step of executableSteps) {
        if (step.type === "wait") {
          await new Promise((resolve) => window.setTimeout(resolve, clampNumber(step.seconds, 1, 300, 3) * 1000));
        } else {
          await sendSingleNatureRemoAction(token, step.action);
        }
      }
    } else {
      await sendSingleNatureRemoAction(token, item.action);
    }
    report("sent");
    if (item.action.kind === "switchbot" || item.action.kind === "tuya" || item.action.kind === "scene") {
      window.setTimeout(() => {
        if (settings.switchBot?.token && settings.switchBot?.secret) void loadSwitchBot(false);
        if (settings.smartLife?.accessId && settings.smartLife?.accessSecret) void loadSmartLife(false);
      }, 1300);
    }
    window.setTimeout(() => report("idle"), 900);
    return true;
  } catch (error) {
    report("error", error?.message || "送信できませんでした");
    return false;
  }
}

const pendingSmartActions = new Map();
function isOwnSmartSchedule(pending) {
  return pending.ownerId === "local" || pending.ownerId === window.MoriyaLanSync?.deviceId || pending.ownerId === window.MoriyaGithubSync?.deviceId;
}
function smartActionKey(source, item, index) {
  return source === "panel" ? `panel:${item?.id || index}` : `home:${index}`;
}
function notifySmartScheduleChange(detail = {}) {
  document.dispatchEvent(new CustomEvent("moriya-smart-schedules-change", { detail }));
}
function pendingSmartActionsFor(source, index) {
  const item = source === "panel" ? settings.natureRemo.panelActions[index] : settings.natureRemo.actions[index];
  const key = smartActionKey(source, item, index);
  return [...pendingSmartActions.values()].filter((pending) => pending.key === key)
    .map(({ id, dueAt, label, ownerId, ownerName }) => ({ id, dueAt, label, ownerId, ownerName })).sort((a, b) => a.dueAt - b.dueAt);
}
function scheduleSmartAction(source, index, minutes) {
  const item = source === "panel" ? settings.natureRemo.panelActions[index] : settings.natureRemo.actions[index];
  const delayMinutes = Number(minutes);
  if (!item?.action || !Number.isInteger(delayMinutes) || delayMinutes < 1 || delayMinutes > 720) return false;
  const snapshot = structuredClone(item);
  const scene = snapshot.action.kind === "scene" ? structuredClone(settings.natureRemo.scenes.find((entry) => entry.id === snapshot.action.id) || null) : null;
  const id = window.crypto?.randomUUID?.() || `timer-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const dueAt = Date.now() + delayMinutes * 60000;
  const pending = { id, key: smartActionKey(source, item, index), dueAt, label: item.label, source, index,
    actionId: source === "panel" ? item.id : "", icon:item.icon || "power", badge:item.badge || "none",
    ownerId: window.MoriyaGithubSync?.deviceId || window.MoriyaLanSync?.deviceId || "local", timer: 0 };
  pending.timer = window.setTimeout(() => {
    pendingSmartActions.delete(id);
    notifySmartScheduleChange({ kind: "complete", entry: pending });
    if (document.hidden) return;
    void sendConfiguredNatureAction(snapshot, "scheduled", index, scene);
  }, delayMinutes * 60000);
  pendingSmartActions.set(id, pending);
  notifySmartScheduleChange({ kind: "create", entry: pending });
  return { id, dueAt };
}
function cancelSmartActionSchedule(id) {
  const pending = pendingSmartActions.get(id);
  if (!pending) return false;
  if (!isOwnSmartSchedule(pending)) {
    if (pending.transport === "github") return window.MoriyaGithubSync?.cancelSchedule?.(id) || false;
    return window.MoriyaLanSync?.cancelRemote?.(pending.ownerId, id) || Promise.resolve(false);
  }
  window.clearTimeout(pending.timer);
  pendingSmartActions.delete(id);
  notifySmartScheduleChange({ kind: "cancel", entry: pending });
  return true;
}
function receivePeerSchedules(ownerId, items, transport = "lan", ownerName = "別端末") {
  for (const [id, pending] of pendingSmartActions) {
    if (pending.ownerId !== ownerId || isOwnSmartSchedule(pending)) continue;
    window.clearTimeout(pending.timer);
    pendingSmartActions.delete(id);
  }
  for (const incoming of Array.isArray(items) ? items : []) {
    if (!incoming || typeof incoming.id !== "string" || !["home", "panel"].includes(incoming.source)
        || !Number.isFinite(Number(incoming.dueAt)) || Number(incoming.dueAt) <= Date.now()) continue;
    const index = Number(incoming.index);
    const item = incoming.source === "panel" ? settings.natureRemo.panelActions.find(item=>item.id === incoming.actionId) || settings.natureRemo.panelActions[index] : settings.natureRemo.actions[index];
    if (!item && transport !== "github") continue;
    if (pendingSmartActions.has(incoming.id)) continue;
    const key = incoming.source === "panel" && incoming.actionId ? `panel:${incoming.actionId}` : smartActionKey(incoming.source,item,index);
    const pending = { ...incoming, key, dueAt: Number(incoming.dueAt), label: String(incoming.label || item?.label || "家電操作"), ownerId, ownerName, transport, timer: 0, source: incoming.source, index };
    pending.timer = window.setTimeout(() => { pendingSmartActions.delete(pending.id); notifySmartScheduleChange(); }, Math.max(0, pending.dueAt - Date.now()) + 1000);
    pendingSmartActions.set(pending.id, pending);
  }
  notifySmartScheduleChange();
}
function removePeerSchedule(ownerId, id) {
  const pending = pendingSmartActions.get(id);
  if (!pending || pending.ownerId !== ownerId) return false;
  window.clearTimeout(pending.timer);
  pendingSmartActions.delete(id);
  notifySmartScheduleChange();
  return true;
}
function cancelLocalScheduleFromPeer(id) {
  const pending = pendingSmartActions.get(id);
  if (!pending || !isOwnSmartSchedule(pending)) return false;
  return cancelSmartActionSchedule(id);
}
function cancelAllSmartActionSchedules() {
  for (const pending of pendingSmartActions.values()) window.clearTimeout(pending.timer);
  if (pendingSmartActions.size) {
    pendingSmartActions.clear();
    notifySmartScheduleChange({kind:"clear"});
  }
}
window.addEventListener("pagehide", cancelAllSmartActionSchedules);
document.addEventListener("visibilitychange", () => { if (document.hidden) cancelAllSmartActionSchedules(); });

async function sendSingleNatureRemoAction(token, action) {
  if (!action || action.kind === "scene") throw new Error("実行できない家電操作です。");
  if (action.kind === "switchbot") {
    await directCloudRequest("switchbot", "send", settings.switchBot, action);
    return;
  }
  if (action.kind === "tuya") {
    await directCloudRequest("smartlife", "send", settings.smartLife, action);
    return;
  }
  const nativePlugin = getNativeSignagePlugin();
  if (nativePlugin?.sendNatureRemo) {
    await nativePlugin.sendNatureRemo({ token, ...action });
    return;
  }
  const response = await fetch("./api/nature-remo/send", {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, action }),
  });
  if (!response.ok) throw new Error(`Nature Remo API returned HTTP ${response.status}.`);
}

window.MoriyaNatureRemo = { send: sendNatureRemoAction, refresh: () => Promise.all([loadNatureRemo(true), loadSwitchBot(false), loadSmartLife(false)]) };
window.MoriyaSmartHome = {
  getActions: () => settings.natureRemo.panelActions.map((item) => ({ ...item })),
  getChoices: () => [...buildNatureRemoChoices(latestNatureRemoDiscovery?.appliances || []), ...buildDirectCloudChoices(), ...natureSceneChoices()],
  getIcons: () => NATURE_ICON_OPTIONS,
  getBadges: () => NATURE_BADGE_OPTIONS,
  getPowerState: smartActionPowerState,
  saveActions: (items) => {
    settings.natureRemo.panelActions = normalizeNatureRemoSettings({ ...settings.natureRemo, panelActions: items }).panelActions;
    saveSettings();
    document.dispatchEvent(new Event("moriya-smart-home-actions-change"));
  },
  send: (index) => sendNatureRemoAction(index, "panel"),
  schedule: scheduleSmartAction,
  pendingFor: pendingSmartActionsFor,
  cancelSchedule: cancelSmartActionSchedule,
  getOwnPending: () => [...pendingSmartActions.values()].filter(isOwnSmartSchedule).map(({ id, dueAt, label, source, index, actionId, icon, badge }) => ({ id, dueAt, label, source, index, actionId, icon, badge })),
  getAllPending: () => [...pendingSmartActions.values()].map(entry=>({id:entry.id,dueAt:entry.dueAt,label:entry.label,ownerId:entry.ownerId,ownerName:entry.ownerName,own:isOwnSmartSchedule(entry),icon:entry.icon || "power",badge:entry.badge || "none"})).sort((a,b)=>a.dueAt-b.dueAt),
  clearGithubPeers: () => {
    for(const [id,entry] of pendingSmartActions) if(entry.transport === "github" && !isOwnSmartSchedule(entry)) {clearTimeout(entry.timer);pendingSmartActions.delete(id);}
    notifySmartScheduleChange({kind:"receive"});
  },
  receivePeerSchedules,
  removePeerSchedule,
  cancelLocalScheduleFromPeer,
};

function parseIcal(text, targetDateKey = tokyoDateKey(now())) {
  return expandIcalEvents(parseIcalDefinitions(text), targetDateKey);
}

function parseIcalDefinitions(text) {
  const unfolded = text.replace(/\r?\n[ \t]/g, "");
  const blocks = unfolded.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];
  return blocks.flatMap((block) => {
    const props = parseIcalProperties(block);
    const startProp = firstIcalProperty(props, "DTSTART");
    if (!startProp) return [];
    const start = parseIcalDateProperty(startProp);
    const endProp = firstIcalProperty(props, "DTEND");
    const end = endProp ? parseIcalDateProperty(endProp) : addEventDurationFallback(start, start.allDay);
    const event = {
      start,
      end,
      allDay: start.allDay,
      summary: firstIcalValue(props, "SUMMARY"),
      location: firstIcalValue(props, "LOCATION"),
      rrule: firstIcalValue(props, "RRULE"),
      exdates: (props.get("EXDATE") || []).flatMap((prop) => splitIcalList(prop.value).map((value) => parseIcalDateProperty({ ...prop, value }))),
    };
    return [event];
  });
}

function expandIcalEvents(events, targetDateKey) {
  return events.flatMap((event) => expandIcalEvent(event, targetDateKey));
}

function parseIcalProperties(block) {
  const props = new Map();
  for (const line of block.split(/\r?\n/)) {
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const nameAndParams = line.slice(0, colon);
    const rawValue = line.slice(colon + 1);
    const [rawName, ...paramParts] = nameAndParams.split(";");
    const name = rawName.toUpperCase();
    const params = {};
    for (const part of paramParts) {
      const equals = part.indexOf("=");
      if (equals > 0) params[part.slice(0, equals).toUpperCase()] = part.slice(equals + 1);
    }
    const prop = { name, params, value: decodeIcalValue(rawValue), rawValue };
    if (!props.has(name)) props.set(name, []);
    props.get(name).push(prop);
  }
  return props;
}

function firstIcalProperty(props, name) {
  return (props.get(name) || [])[0] || null;
}

function firstIcalValue(props, name) {
  return firstIcalProperty(props, name)?.value || "";
}

function decodeIcalValue(value) {
  return String(value || "")
    .replace(/\\n/gi, " ")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function splitIcalList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseIcalDateProperty(prop) {
  const value = String(prop?.value || "").trim();
  const date = parseIcalDate(value, prop?.params?.TZID);
  date.allDay = /^\d{8}$/.test(value) || prop?.params?.VALUE === "DATE";
  return date;
}

function parseIcalDate(value, timeZone = "") {
  if (/^\d{8}$/.test(value)) {
    return new Date(`${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T00:00:00+09:00`);
  }
  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
  if (!match) return new Date(NaN);
  const [, year, month, day, hour, minute, second] = match.map(Number);
  if (value.endsWith("Z")) return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  if (!timeZone || /^(Asia\/Tokyo|Japan)$/i.test(timeZone)) {
    return new Date(
      `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}+09:00`,
    );
  }
  return new Date(year, month - 1, day, hour, minute, second);
}

function expandIcalEvent(event, targetDateKey) {
  if (!event.rrule || Number.isNaN(event.start.getTime())) return [event];
  const rule = parseRrule(event.rrule);
  if (!rule.FREQ) return [event];

  const targetStart = dateFromKey(targetDateKey);
  const targetEnd = addDays(targetStart, 1);
  const until = rule.UNTIL ? parseIcalDate(rule.UNTIL) : null;
  const interval = Math.max(1, Number(rule.INTERVAL || 1));
  const duration = Math.max(0, event.end.getTime() - event.start.getTime());
  const occurrences = [];
  const candidateDays = Math.max(1, Math.ceil(duration / 86400000));

  for (let offset = candidateDays; offset >= 0; offset -= 1) {
    const day = addDays(targetStart, -offset);
    if (!matchesRruleDate(event.start, day, rule, interval)) continue;

    const occurrence = copyTimeToDate(event.start, day);
    if (occurrence < event.start || (until && occurrence > until)) continue;
    if (rule.COUNT && occurrenceNumber(event.start, day, rule, interval) > Number(rule.COUNT)) continue;
    if (event.exdates.some((exdate) => sameIcalOccurrence(exdate, occurrence, event.allDay))) continue;
    const occurrenceEnd = new Date(occurrence.getTime() + duration);
    if (occurrence >= targetEnd || occurrenceEnd <= targetStart) continue;
    occurrences.push({ ...event, start: occurrence, end: occurrenceEnd });
  }

  return occurrences;
}

function parseRrule(value) {
  return Object.fromEntries(
    String(value || "")
      .split(";")
      .map((part) => part.split("="))
      .filter(([key, val]) => key && val)
      .map(([key, val]) => [key.toUpperCase(), val]),
  );
}

function matchesRruleDate(start, day, rule, interval) {
  if (day < startOfDay(start)) return false;
  const freq = rule.FREQ;
  const dayCode = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][day.getDay()];
  const byday = rule.BYDAY ? rule.BYDAY.split(",").map((item) => item.replace(/^\d+/, "")) : null;
  if (byday && !byday.includes(dayCode)) return false;

  if (freq === "DAILY") return diffDays(startOfDay(start), day) % interval === 0;
  if (freq === "WEEKLY") {
    const sameWeekInterval = Math.floor(diffDays(startOfDay(start), day) / 7) % interval === 0;
    return sameWeekInterval && (byday ? true : start.getDay() === day.getDay());
  }
  if (freq === "MONTHLY") {
    const monthDiff = (day.getFullYear() - start.getFullYear()) * 12 + day.getMonth() - start.getMonth();
    const byMonthDay = rule.BYMONTHDAY ? rule.BYMONTHDAY.split(",").map(Number) : [start.getDate()];
    return monthDiff >= 0 && monthDiff % interval === 0 && byMonthDay.includes(day.getDate());
  }
  if (freq === "YEARLY") {
    const yearDiff = day.getFullYear() - start.getFullYear();
    const byMonths = rule.BYMONTH ? rule.BYMONTH.split(",").map(Number) : [start.getMonth() + 1];
    const byMonthDays = rule.BYMONTHDAY ? rule.BYMONTHDAY.split(",").map(Number) : [start.getDate()];
    return yearDiff >= 0 && yearDiff % interval === 0 && byMonths.includes(day.getMonth() + 1) && byMonthDays.includes(day.getDate());
  }
  return false;
}

function occurrenceNumber(start, day, rule, interval) {
  if (!rule.COUNT) return 1;
  if (rule.FREQ === "DAILY") return Math.floor(diffDays(startOfDay(start), day) / interval) + 1;
  if (rule.FREQ === "MONTHLY") {
    const monthDiff = (day.getFullYear() - start.getFullYear()) * 12 + day.getMonth() - start.getMonth();
    return Math.floor(monthDiff / interval) + 1;
  }
  if (rule.FREQ === "YEARLY") return Math.floor((day.getFullYear() - start.getFullYear()) / interval) + 1;

  let count = 0;
  for (let candidate = startOfDay(start); candidate <= day; candidate = addDays(candidate, 1)) {
    if (matchesRruleDate(start, candidate, rule, interval)) count += 1;
  }
  return count;
}

function startOfDay(date) {
  return dateFromKey(tokyoDateKey(date));
}

function dateFromKey(key) {
  return new Date(`${key}T00:00:00+09:00`);
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 86400000);
}

function diffDays(start, end) {
  return Math.floor((startOfDay(end).getTime() - startOfDay(start).getTime()) / 86400000);
}

function copyTimeToDate(source, targetDay) {
  const sourceParts = tokyoParts(source);
  return new Date(
    `${tokyoDateKey(targetDay)}T${sourceParts.hour}:${sourceParts.minute}:${sourceParts.second}+09:00`,
  );
}

function sameIcalOccurrence(a, b, allDay) {
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return false;
  return allDay ? tokyoDateKey(a) === tokyoDateKey(b) : a.getTime() === b.getTime();
}

function addEventDurationFallback(start, allDay) {
  return allDay ? addDays(start, 1) : new Date(start.getTime() + 60 * 60 * 1000);
}

function eventOccursOnDate(event, dateKey) {
  if (Number.isNaN(event.start.getTime()) || Number.isNaN(event.end.getTime())) return false;
  const targetStart = dateFromKey(dateKey);
  const targetEnd = addDays(targetStart, 1);
  return event.start < targetEnd && event.end > targetStart;
}

function renderEvents(events, source) {
  const signature = `${source}:${JSON.stringify(events)}`;
  if (signature === lastCalendarSignature) return;
  lastCalendarSignature = signature;
  const changed = setAnimatedHtml(
    el.events,
    events
      .map(
        (event) => `
          <li class="event-item">
            <div>
              <div class="event-title"><span class="event-title-text">${escapeHtml(event.title)}</span></div>
              ${event.meta ? `<div class="event-meta">${escapeHtml(event.meta)}</div>` : ""}
            </div>
            <div class="event-time numeric-text">${event.startLabel}</div>
          </li>
        `,
      )
      .join(""),
    signature,
  );
  if (changed) requestAnimationFrame(() => requestAnimationFrame(updateEventTitleScroll));
}

function isCalendarSourceLabel(value) {
  return /^(Google Calendar(?: iCal)?|iCal)$/i.test(String(value || "").trim());
}

function updateEventTitleScroll() {
  for (const title of el.events.querySelectorAll(".event-title")) {
    const text = title.querySelector(".event-title-text");
    if (!text) continue;
    title.classList.remove("is-overflowing");
    title.style.removeProperty("--event-scroll-distance");
    title.style.removeProperty("--event-scroll-duration");
    const distance = Math.ceil(text.scrollWidth - title.clientWidth);
    if (distance <= 2 || settings.display.reduceMotion) continue;
    title.style.setProperty("--event-scroll-distance", `${distance + 12}px`);
    title.style.setProperty("--event-scroll-duration", `${Math.max(10, distance / 18 + 5).toFixed(1)}s`);
    title.classList.add("is-overflowing");
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function fontStyleToWeight(style = "") {
  const normalized = String(style).toLowerCase().replace(/[\s_-]+/g, "");
  if (/thin|hairline/.test(normalized)) return 100;
  if (/extralight|ultralight/.test(normalized)) return 200;
  if (/light/.test(normalized)) return 300;
  if (/medium/.test(normalized)) return 500;
  if (/semibold|demibold/.test(normalized)) return 600;
  if (/extrabold|ultrabold/.test(normalized)) return 800;
  if (/black|heavy/.test(normalized)) return 900;
  if (/bold/.test(normalized)) return 700;
  return 400;
}

async function loadLocalFonts() {
  if (!("queryLocalFonts" in window)) {
    el.settingsMessage.textContent = "このブラウザではPC内フォント一覧の取得に対応していません。";
    return;
  }
  try {
    const fonts = await window.queryLocalFonts();
    const names = [...new Set(fonts.map((font) => font.family))].sort((a, b) => a.localeCompare(b));
    for (const name of names) {
      const key = `local:${name}`;
      FONT_WEIGHTS[key] = [...new Set(fonts
        .filter((font) => font.family === name)
        .map((font) => fontStyleToWeight(font.style || font.fullName)))]
        .sort((a, b) => a - b);
      if (!FONT_STACKS[key]) {
        FONT_STACKS[key] = `"${name}", ${FONT_STACKS.system}`;
        FONT_OPTIONS.push([key, name]);
      }
    }
    populateFonts();
    applySettingsToUi();
    el.settingsMessage.textContent = `${names.length}件のフォント候補を読み込みました。`;
  } catch {
    el.settingsMessage.textContent = "フォント取得が許可されませんでした。";
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result || "")));
    reader.addEventListener("error", reject);
    reader.readAsDataURL(file);
  });
}

async function imageFileToBackground(file) {
  const source = await readFileAsDataUrl(file);
  const image = new Image();
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
    image.src = source;
  });

  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const maxDimension = 1440;
  const resizeScale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * resizeScale));
  const height = Math.max(1, Math.round(sourceHeight * resizeScale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

function updateLocalVideoStatus(metadata = window.MoriyaLocalVideo?.getMetadata?.()) {
  if (!el.localVideoStatus) return;
  if (!metadata) {
    el.localVideoStatus.textContent = "動画は選択されていません。";
    return;
  }
  const size = Number(metadata.size || 0);
  const sizeLabel = size >= 1024 * 1024
    ? `${(size / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(size / 1024))} KB`;
  const compatibility = metadata.playable === false ? "／この端末では再生できない形式です" : "";
  el.localVideoStatus.textContent = `選択中：${metadata.name || "背景動画"}（${sizeLabel}）${compatibility}`;
}

function setupSettings() {
  el.createSettingsBackup?.addEventListener("click", async () => {
    el.settingsBackupStatus.textContent = "バックアップ文章を作成しています…";
    try {
      el.settingsBackupText.value = await createSettingsBackupText(el.settingsBackupScope.value);
      el.settingsBackupStatus.textContent = `${el.settingsBackupScope.value === "all" ? "全設定" : "スマートホーム設定"}の文章を作成しました。秘密情報を含むため、安全な場所に保管してください。`;
    } catch (error) {
      el.settingsBackupStatus.textContent = error?.message || "バックアップを作成できませんでした。";
    }
  });
  el.copySettingsBackup?.addEventListener("click", async () => {
    if (!el.settingsBackupText.value.trim()) {
      el.settingsBackupStatus.textContent = "先にバックアップ文章を作成してください。";
      return;
    }
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(el.settingsBackupText.value);
      else {
        el.settingsBackupText.select();
        if (!document.execCommand("copy")) throw new Error("コピーできませんでした。");
      }
      el.settingsBackupStatus.textContent = "文章をコピーしました。アクセストークンが含まれるため、安全に保管してください。";
    } catch {
      el.settingsBackupText.select();
      el.settingsBackupStatus.textContent = "自動コピーができませんでした。選択された文章を手動でコピーしてください。";
    }
  });
  el.restoreSettingsBackup?.addEventListener("click", async () => {
    let backup;
    try { backup = parseSettingsBackupText(el.settingsBackupText.value.trim()); }
    catch (error) { el.settingsBackupStatus.textContent = error.message; return; }
    const label = backup.scope === "all" ? "すべての設定と背景動画" : "スマートホームの設定";
    if (!window.confirm(`${label}をこの文章の内容で置き換えます。よろしいですか？`)) return;
    el.settingsBackupStatus.textContent = "復元しています…";
    try { await restoreSettingsBackupText(el.settingsBackupText.value.trim()); }
    catch (error) { el.settingsBackupStatus.textContent = error?.message || "復元できませんでした。"; }
  });
  el.settingsButton.addEventListener("click", openSettings);
  el.settingsClose.addEventListener("click", closeSettings);
  el.settingsDialog.addEventListener("click", (event) => {
    if (event.target === el.settingsDialog) closeSettings();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !el.settingsDialog.hidden) closeSettings();
  });
  el.fontSelect.addEventListener("change", () => {
    syncFontWeightOptions(el.fontSelect, el.fontWeightSelect, el.fontWeightSelect?.value);
    updateFontPreview();
  });
  el.numberFontSelect.addEventListener("change", () => {
    syncFontWeightOptions(el.numberFontSelect, el.numberFontWeightSelect, el.numberFontWeightSelect?.value);
    updateFontPreview();
  });
  el.clockFontSelect.addEventListener("change", () => {
    syncFontWeightOptions(el.clockFontSelect, el.clockFontWeightSelect, el.clockFontWeightSelect?.value);
    updateFontPreview();
  });
  el.fontWeightSelect?.addEventListener("change", updateFontPreview);
  el.numberFontWeightSelect?.addEventListener("change", updateFontPreview);
  el.clockFontWeightSelect?.addEventListener("change", updateFontPreview);
  el.windowOnlyBlur?.addEventListener("change", () => {
    applyWindowBlurUi(el.windowOnlyBlur.checked);
  });
  el.localVideoBeta?.addEventListener("change", () => {
    syncLocalVideoControls(el.localVideoBeta.checked);
  });
  el.homeInfoMode?.addEventListener("change", () => setNatureRemoFieldsVisibility(el.homeInfoMode.value));
  el.natureActionCount?.addEventListener("change", () => syncNatureActionRows(el.homeInfoMode?.value));
  el.natureRemoConnect?.addEventListener("click", () => loadNatureRemo(true, el.natureRemoToken?.value || ""));
  el.switchBotConnect?.addEventListener("click", () => loadSwitchBot(true));
  el.tuyaConnect?.addEventListener("click", () => loadSmartLife(true));
  el.addNatureScene?.addEventListener("click", () => {
    const scenes = normalizeNatureScenes(readNatureScenesEditor());
    if (scenes.length >= 8) {
      el.natureRemoStatus.textContent = "シーンは8個まで作成できます";
      return;
    }
    scenes.push({ id: createNatureSceneId(), name: `シーン${scenes.length + 1}`, steps: [] });
    renderNatureScenesEditor(scenes);
    refreshNatureSceneChoices();
  });
  el.natureSceneList?.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const card = button.closest("[data-nature-scene]");
    const row = button.closest("[data-scene-step]");
    const scenes = normalizeNatureScenes(readNatureScenesEditor());
    const sceneIndex = card ? [...el.natureSceneList.querySelectorAll("[data-nature-scene]")].indexOf(card) : -1;
    if (sceneIndex < 0) return;
    if (button.hasAttribute("data-delete-scene")) scenes.splice(sceneIndex, 1);
    if (button.dataset.addSceneStep) {
      if (scenes[sceneIndex].steps.length >= 20) {
        el.natureRemoStatus.textContent = "1シーンは20段階までです";
        return;
      }
      scenes[sceneIndex].steps.push(button.dataset.addSceneStep === "wait" ? { type: "wait", seconds: 3 } : { type: "action", action: null });
    }
    if (row) {
      const stepIndex = [...card.querySelectorAll("[data-scene-step]")].indexOf(row);
      if (button.hasAttribute("data-delete-step")) scenes[sceneIndex].steps.splice(stepIndex, 1);
      if (button.dataset.moveStep === "up" && stepIndex > 0) [scenes[sceneIndex].steps[stepIndex - 1], scenes[sceneIndex].steps[stepIndex]] = [scenes[sceneIndex].steps[stepIndex], scenes[sceneIndex].steps[stepIndex - 1]];
      if (button.dataset.moveStep === "down" && stepIndex >= 0 && stepIndex < scenes[sceneIndex].steps.length - 1) [scenes[sceneIndex].steps[stepIndex + 1], scenes[sceneIndex].steps[stepIndex]] = [scenes[sceneIndex].steps[stepIndex], scenes[sceneIndex].steps[stepIndex + 1]];
    }
    renderNatureScenesEditor(scenes);
    refreshNatureSceneChoices();
  });
  el.natureSceneList?.addEventListener("change", (event) => {
    if (event.target.matches("[data-scene-name]")) refreshNatureSceneChoices();
  });
  natureSettingRows().forEach(([select, labelInput, iconSelect]) => {
    select?.addEventListener("change", () => {
      const action = readNatureActionSelect(select);
      if (action && labelInput && !labelInput.value.trim()) labelInput.value = action.appliance || action.name || "操作";
      if (action && iconSelect?.value === "auto") iconSelect.dataset.suggested = natureActionIcon(action);
    });
  });
  [[el.marketPreset1, el.marketLabel1, el.marketSymbol1], [el.marketPreset2, el.marketLabel2, el.marketSymbol2], [el.marketPreset3, el.marketLabel3, el.marketSymbol3]].forEach(([select, labelInput, symbolInput]) => {
    select?.addEventListener("change", () => applyMarketPreset(select, labelInput, symbolInput));
    symbolInput?.addEventListener("input", syncMarketPresetUi);
  });
  el.richBlur?.addEventListener("input", () => {
    const value = clampNumber(el.richBlur.value, 0, 64, DEFAULT_SETTINGS.display.richBlur);
    document.documentElement.style.setProperty("--rich-blur", `${value}px`);
    if (el.richBlurValue) el.richBlurValue.value = `${value}px`;
  });
  el.richTransparency?.addEventListener("input", () => {
    const value = applyRichGlassTransparency(el.richTransparency.value);
    if (el.richTransparencyValue) el.richTransparencyValue.value = `${value}%`;
  });
  [el.sunnyBackgroundTheme, el.cloudyBackgroundTheme, el.rainBackgroundTheme, el.nightClearBackgroundTheme, el.nightCloudyBackgroundTheme, el.nightRainBackgroundTheme]
    .filter(Boolean).forEach((select) => select.addEventListener("change", syncBackgroundSampleSelection));
  el.addDebugEvent?.addEventListener("click", () => appendDebugEventRow());
  el.livePowerSchedule?.addEventListener("click", (event) => {
    const add = event.target.closest("[data-live-power-add]");
    if (add) {
      appendLivePowerRange(add.dataset.livePowerAdd);
      return;
    }
    const remove = event.target.closest(".live-power-remove");
    if (remove) remove.closest(".live-power-range")?.remove();
  });
  el.copyLivePowerToAll?.addEventListener("click", () => {
    const sourceKey = el.livePowerCopyDay?.value || "mon";
    const current = readLivePowerSchedule();
    const copied = current[sourceKey].map((range) => ({ ...range }));
    for (const [key] of LIVE_POWER_DAYS) current[key] = copied.map((range) => ({ ...range }));
    renderLivePowerSchedule(current);
    el.settingsMessage.textContent = `${LIVE_POWER_DAYS.find(([key]) => key === sourceKey)?.[1] || "選択した"}曜日の停止時間を全曜日に反映しました。保存すると確定します。`;
  });
  el.debugEventsList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-debug-event]");
    if (!button) return;
    button.closest(".debug-event-row")?.remove();
    if (!el.debugEventsList.children.length) appendDebugEventRow();
  });
  el.syncNumberFont.addEventListener("click", () => {
    el.numberFontSelect.value = el.fontSelect.value;
    el.clockFontSelect.value = el.fontSelect.value;
    syncFontWeightOptions(el.numberFontSelect, el.numberFontWeightSelect, el.fontWeightSelect?.value);
    syncFontWeightOptions(el.clockFontSelect, el.clockFontWeightSelect, el.fontWeightSelect?.value);
    updateFontPreview();
    el.settingsMessage.textContent = "数字と時計・日付フォントを全体フォントに合わせました。保存すると反映されます。";
  });
  el.resetTimetableSettings?.addEventListener("click", () => {
    el.trainOffset.value = DEFAULT_SETTINGS.trainOffsetMinutes;
    el.orangeMinutes.value = DEFAULT_SETTINGS.trainAlerts.orangeMinutes;
    el.orangeColor.value = DEFAULT_SETTINGS.trainAlerts.orangeColor;
    el.redMinutes.value = DEFAULT_SETTINGS.trainAlerts.redMinutes;
    el.redColor.value = DEFAULT_SETTINGS.trainAlerts.redColor;
    el.settingsMessage.textContent = "時刻表の表示設定を初期値に戻しました。保存すると反映されます。";
  });
  el.loadLocalFonts.addEventListener("click", loadLocalFonts);
  el.refreshWeather.addEventListener("click", () => loadWeather(true));
  el.searchWeather.addEventListener("click", async () => {
    const query = el.weatherQuery.value.trim();
    if (!query) return;
    el.settingsMessage.textContent = "地点を検索しています";
    try {
      await searchWeatherLocation(query);
      el.settingsMessage.textContent = `${settings.weather.name} に変更しました`;
    } catch (error) {
      el.settingsMessage.textContent = error.message;
    }
  });
  el.resetSettings.addEventListener("click", () => {
    settings = structuredClone(DEFAULT_SETTINGS);
    el.backgroundImage.value = "";
    if (el.localVideoFile) el.localVideoFile.value = "";
    void window.MoriyaLocalVideo?.clear?.();
    saveSettings();
    lastTrainSignature = "";
    lastWeatherSignature = "";
    lastCalendarSignature = "";
    applySettingsToUi();
    tick();
    loadWeather(true);
    loadCalendar(true);
    renderTrains(true);
    void fetchMarketQuotes(true);
    void loadNatureRemo(true);
  });
  el.backgroundImage.addEventListener("change", async () => {
    const remaining = Math.max(0, 5 - (settings.backgroundImages?.length || 0));
    const files = [...(el.backgroundImage.files || [])].slice(0, remaining);
    if (!files.length) {
      el.settingsMessage.textContent = remaining ? "画像を選択してください。" : "カスタム背景は5枚までです。";
      el.backgroundImage.value = "";
      return;
    }
    el.settingsMessage.textContent = `${files.length}枚の背景画像を最適化しています...`;
    const previousImages = [...(settings.backgroundImages || [])];
    try {
      const processed = [];
      for (const file of files) processed.push(await imageFileToBackground(file));
      settings.backgroundImages = [...(settings.backgroundImages || []), ...processed].slice(0, 5);
      settings.backgroundImage = settings.backgroundImages[0] || "";
      saveSettings();
      applySettingsToUi();
      el.settingsMessage.textContent = `${processed.length}枚を保存しました（合計${settings.backgroundImages.length}/5枚）。`;
    } catch {
      settings.backgroundImages = previousImages;
      settings.backgroundImage = previousImages[0] || "";
      applySettingsToUi();
      el.settingsMessage.textContent = "背景画像を保存できませんでした。枚数を減らすか、小さい画像を試してください。";
    } finally {
      el.backgroundImage.value = "";
    }
  });
  el.localVideoFile?.addEventListener("change", async () => {
    const file = el.localVideoFile.files?.[0];
    if (!file) return;
    el.settingsMessage.textContent = "背景動画を端末内に保存しています...";
    try {
      const metadata = await window.MoriyaLocalVideo?.setFile?.(file);
      if (!metadata) throw new Error("動画保存機能を初期化できませんでした。");
      settings.display.localVideoBeta = true;
      el.localVideoBeta.checked = true;
      syncLocalVideoControls(true);
      saveSettings();
      updateLocalVideoStatus(metadata);
      el.settingsMessage.textContent = "背景動画を保存しました。設定を閉じるとループ再生を開始します。";
    } catch (error) {
      el.settingsMessage.textContent = error?.message || "動画を保存できませんでした。別の動画を試してください。";
    } finally {
      el.localVideoFile.value = "";
    }
  });
  el.clearLocalVideo?.addEventListener("click", async () => {
    try {
      await window.MoriyaLocalVideo?.clear?.();
      settings.display.localVideoBeta = false;
      el.localVideoBeta.checked = false;
      syncLocalVideoControls(false);
      saveSettings();
      updateLocalVideoStatus(null);
      el.settingsMessage.textContent = "背景動画を解除しました。";
    } catch {
      el.settingsMessage.textContent = "背景動画を解除できませんでした。";
    }
  });
  document.addEventListener("moriya-local-video-change", (event) => updateLocalVideoStatus(event.detail));
  el.customBackgroundList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-custom-background]");
    if (!button) return;
    const index = Number(button.dataset.removeCustomBackground);
    settings.backgroundImages = (settings.backgroundImages || []).filter((_, itemIndex) => itemIndex !== index);
    settings.backgroundImage = settings.backgroundImages[0] || "";
    saveSettings();
    applySettingsToUi();
    el.settingsMessage.textContent = "選択した背景画像を削除しました。";
  });
  el.clearBackgroundImage.addEventListener("click", () => {
    settings.backgroundImage = "";
    settings.backgroundImages = [];
    el.backgroundImage.value = "";
    saveSettings();
    applySettingsToUi();
    el.settingsMessage.textContent = "背景画像を解除しました。";
  });
  el.settingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    settings.font = el.fontSelect.value;
    settings.numberFont = el.numberFontSelect.value;
    settings.clockFont = el.clockFontSelect.value;
    settings.fontWeight = el.fontWeightSelect?.value || DEFAULT_SETTINGS.fontWeight;
    settings.numberFontWeight = el.numberFontWeightSelect?.value || DEFAULT_SETTINGS.numberFontWeight;
    settings.clockFontWeight = el.clockFontWeightSelect?.value || DEFAULT_SETTINGS.clockFontWeight;
    settings.backgroundThemes.sunny = readBackgroundSelection(el.sunnyBackgroundTheme, DEFAULT_SETTINGS.backgroundThemes.sunny);
    settings.backgroundThemes.cloudy = readBackgroundSelection(el.cloudyBackgroundTheme, DEFAULT_SETTINGS.backgroundThemes.cloudy);
    settings.backgroundThemes.rain = readBackgroundSelection(el.rainBackgroundTheme, DEFAULT_SETTINGS.backgroundThemes.rain);
    settings.backgroundThemes.nightClear = readBackgroundSelection(el.nightClearBackgroundTheme, DEFAULT_SETTINGS.backgroundThemes.nightClear);
    settings.backgroundThemes.nightCloudy = readBackgroundSelection(el.nightCloudyBackgroundTheme, DEFAULT_SETTINGS.backgroundThemes.nightCloudy);
    settings.backgroundThemes.nightRain = readBackgroundSelection(el.nightRainBackgroundTheme, DEFAULT_SETTINGS.backgroundThemes.nightRain);
    settings.backgroundSlideshowSeconds = clampNumber(el.backgroundSlideshowSeconds?.value, 30, 600, DEFAULT_SETTINGS.backgroundSlideshowSeconds);
    settings.videoQuietHours = readLivePowerSchedule();
    settings.icalUrl = el.icalUrl.value.trim();
    settings.display.hideSchedule = Boolean(el.hideSchedule?.checked);
    settings.homeInfoMode = ["none", "market", "remo", "hybrid"].includes(el.homeInfoMode?.value) ? el.homeInfoMode.value : "market";
    settings.market = normalizeMarketSettings({
      enabled: ["market", "hybrid"].includes(settings.homeInfoMode),
      items: [
        { label: el.marketLabel1?.value || DEFAULT_SETTINGS.market.items[0].label, symbol: el.marketSymbol1?.value || DEFAULT_SETTINGS.market.items[0].symbol },
        { label: el.marketLabel2?.value || DEFAULT_SETTINGS.market.items[1].label, symbol: el.marketSymbol2?.value || DEFAULT_SETTINGS.market.items[1].symbol },
        { label: el.marketLabel3?.value || DEFAULT_SETTINGS.market.items[2].label, symbol: el.marketSymbol3?.value || DEFAULT_SETTINGS.market.items[2].symbol },
      ],
    });
    const previousHomeActions = settings.natureRemo.actions.map((item) => item.action);
    settings.natureRemo = normalizeNatureRemoSettings({
      token: el.natureRemoToken?.value || "",
      temperatureDeviceId: el.natureTemperatureDevice?.value || "",
      actionCount: el.natureActionCount?.value || DEFAULT_SETTINGS.natureRemo.actionCount,
      scenes: readNatureScenesEditor(),
      panelActions: settings.natureRemo.panelActions,
      gridColumns: settings.natureRemo.gridColumns,
      actions: [
        { label: el.natureLabel1?.value || "照明", icon: el.natureIcon1?.value || "auto", badge: el.natureBadge1?.value || "none", action: readNatureActionSelect(el.natureAction1) },
        { label: el.natureLabel2?.value || "テレビ", icon: el.natureIcon2?.value || "auto", badge: el.natureBadge2?.value || "none", action: readNatureActionSelect(el.natureAction2) },
        { label: el.natureLabel3?.value || "エアコン", icon: el.natureIcon3?.value || "auto", badge: el.natureBadge3?.value || "none", action: readNatureActionSelect(el.natureAction3) },
        { label: el.natureLabel4?.value || "シーン", icon: el.natureIcon4?.value || "scene", badge: el.natureBadge4?.value || "none", action: readNatureActionSelect(el.natureAction4) },
      ],
    });
    settings.natureRemo.actions.forEach((item, index) => {
      if (JSON.stringify(previousHomeActions[index]) !== JSON.stringify(item.action)) {
        pendingSmartActionsFor("home", index).forEach((pending) => cancelSmartActionSchedule(pending.id));
      }
    });
    settings.switchBot = normalizeSwitchBotSettings({ token: el.switchBotToken?.value, secret: el.switchBotSecret?.value });
    settings.smartLife = normalizeSmartLifeSettings({
      endpoint: el.tuyaEndpoint?.value,
      accessId: el.tuyaAccessId?.value,
      accessSecret: el.tuyaAccessSecret?.value,
      userId: el.tuyaUserId?.value,
      deviceIds: el.tuyaDeviceIds?.value,
    });
    settings.garbage = { homeEnabled: Boolean(el.garbageHomeEnabled?.checked) };
    settings.trainOffsetMinutes = Number(el.trainOffset.value || 10);
    settings.trainAlerts.orangeMinutes = Number(el.orangeMinutes.value || DEFAULT_SETTINGS.trainAlerts.orangeMinutes);
    settings.trainAlerts.orangeColor = el.orangeColor.value || DEFAULT_SETTINGS.trainAlerts.orangeColor;
    settings.trainAlerts.redMinutes = Number(el.redMinutes.value || DEFAULT_SETTINGS.trainAlerts.redMinutes);
    settings.trainAlerts.redColor = el.redColor.value || DEFAULT_SETTINGS.trainAlerts.redColor;
    settings.display.forecastMode = el.forecastMode?.value || DEFAULT_SETTINGS.display.forecastMode;
    settings.display.schedulePanelMode = "calendar";
    settings.display.mode = el.displayMode?.value || DEFAULT_SETTINGS.display.mode;
    settings.display.profile = el.displayProfile?.value === "tablet10" ? "tablet10" : "standard";
    settings.display.animationMode = el.animationMode?.value || DEFAULT_SETTINGS.display.animationMode;
    settings.display.windowOnlyBlur = Boolean(el.windowOnlyBlur?.checked);
    settings.display.localVideoBeta = Boolean(el.localVideoBeta?.checked);
    settings.display.richBlur = clampNumber(el.richBlur?.value, 0, 64, DEFAULT_SETTINGS.display.richBlur);
    settings.display.richTransparency = clampNumber(el.richTransparency?.value, 80, 100, DEFAULT_SETTINGS.display.richTransparency);
    settings.display.reduceMotion = settings.display.animationMode === "off";
    settings.android.keepAwake = el.keepAwake ? el.keepAwake.checked : DEFAULT_SETTINGS.android.keepAwake;
    const previousDebugEnabled = settings.debug.enabled;
    const previousDebugDateTime = settings.debug.dateTime;
    settings.debug.enabled = el.debugEnabled.checked;
    settings.debug.dateTime = el.debugDateTime.value;
    settings.debug.weatherCode = el.debugWeatherCode.value;
    settings.debug.temperature = el.debugTemperature.value;
    settings.debug.events = readDebugEventsEditor();
    if (settings.debug.enabled && settings.debug.dateTime && (!previousDebugEnabled || previousDebugDateTime !== settings.debug.dateTime)) {
      ensureDebugClockAnchor(true);
    } else {
      ensureDebugClockAnchor();
    }
    saveSettings();
    lastTrainSignature = "";
    lastWeatherSignature = "";
    lastCalendarSignature = "";
    applySettingsToUi();
    tick();
    closeSettings();
    void loadWeather(true);
    await loadCalendar(true);
    renderTrains(true);
    window.MoriyaNewUi?.renderCalendars?.();
    window.MoriyaNewUi?.renderGarbage?.();
    void fetchMarketQuotes(true);
    void loadNatureRemo(true);
  });
}

populateFonts();
populateBackgroundSamples();
populateMarketPresets();
populateNatureIconOptions();
updateStageScale();
el.shell.addEventListener("scroll", lockStageScroll, { passive: true });
document.addEventListener("focusin", lockStageScroll);
window.addEventListener("resize", requestStageScaleUpdate);
window.addEventListener("orientationchange", requestStageScaleUpdate);
window.visualViewport?.addEventListener("resize", requestStageScaleUpdate);
window.visualViewport?.addEventListener("scroll", requestStageScaleUpdate);
restoreDirectCloudCaches();
applySettingsToUi();
setupSettings();
document.addEventListener("toggle", (event) => {
  if (event.target instanceof HTMLDetailsElement && event.target.open) requestAnimationFrame(() => window.MoriyaCenterIcons(event.target));
}, true);
document.fonts?.ready?.then(() => {
  document.querySelectorAll('svg[data-center-icon]').forEach((svg) => {
    delete svg.dataset.centered;
    svg.querySelector('[data-icon-art]')?.removeAttribute('transform');
  });
  window.MoriyaCenterIcons();
});
setupCalendarDateControl();
tick();
loadTimetable();
loadWeather(false);
loadCalendar();
fetchMarketQuotes(false);
loadNatureRemo(false);
if (settings.switchBot?.token && settings.switchBot?.secret) void loadSwitchBot(false);
if (settings.smartLife?.accessId && settings.smartLife?.accessSecret) void loadSmartLife(false);

setInterval(tick, 1000);
setInterval(() => loadCalendar(true), 10 * 60 * 1000);
marketRefreshTimer = window.setInterval(() => {
  if (!document.hidden && ["market", "hybrid"].includes(settings.homeInfoMode)) void fetchMarketQuotes(true);
}, 5 * 60 * 1000);
natureRemoRefreshTimer = window.setInterval(() => {
  if (!document.hidden && ["remo", "hybrid"].includes(settings.homeInfoMode)) {
    void loadNatureRemo(true);
    if (settings.switchBot?.token && settings.switchBot?.secret) void loadSwitchBot(false);
    if (settings.smartLife?.accessId && settings.smartLife?.accessSecret) void loadSmartLife(false);
  }
}, 5 * 60 * 1000);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && ["market", "hybrid"].includes(settings.homeInfoMode)) void fetchMarketQuotes(false);
  if (!document.hidden && ["remo", "hybrid"].includes(settings.homeInfoMode)) {
    void loadNatureRemo(false);
    if (settings.switchBot?.token && settings.switchBot?.secret) void loadSwitchBot(false);
    if (settings.smartLife?.accessId && settings.smartLife?.accessSecret) void loadSmartLife(false);
  }
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("./service-worker.js").catch(() => {});
}
