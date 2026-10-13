(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MoriyaEarthquakeCore = api;
})(typeof window === "object" ? window : globalThis, function () {
  "use strict";
  const SCALES = [-1, 0, 10, 20, 30, 40, 45, 50, 55, 60, 70];
  const LABELS = { "-1": "不明", 0: "0", 10: "1", 20: "2", 30: "3", 40: "4", 45: "5弱", 50: "5強", 55: "6弱", 60: "6強", 70: "7" };
  const DEFAULTS = { enabled: false, pref: "茨城県", area: "301", thresholdEnabled: true, threshold: 40, warningEnabled: true, nationwide: false, sound: "off", historyMin: 20 };
  const numeric = (v) => v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? null : Number(v);
  function weatherMunicipalityMatch(weatherName, prefecture, pointName, prefectures = []) {
    const normalize = value => String(value ?? '').normalize('NFKC').replace(/\s/g, '');
    let municipality = normalize(weatherName);
    const weatherPref = prefectures.find(pref => municipality.startsWith(normalize(pref)));
    if (weatherPref) {
      if (normalize(weatherPref) !== normalize(prefecture)) return null;
      municipality = municipality.slice(normalize(weatherPref).length);
    }
    // Weather labels may include a county; observation labels usually do not.
    municipality = municipality.replace(/^.+郡(?=.+[町村]$)/, '');
    if (!/^.+[市町村区]$/.test(municipality)) return null;
    const name = String(pointName ?? '');
    const prefix = String(prefecture ?? '');
    const start = prefix && name.startsWith(prefix) ? prefix.length : 0;
    // Match the municipality prefix, not a similarly named observation site.
    if (name.slice(start, start + municipality.length) !== municipality) return null;
    return { start, end: start + municipality.length };
  }
  function localObservation(event, region, weatherName, prefectures = []) {
    if (!event?.historical) return { scale: -1, weatherFallback: false };
    const rows = observations(event);
    const regional = Math.max(-1, ...rows.filter(point => point.isArea && point.name === region.name).map(point => point.scale));
    if (regional >= 0) return { scale: regional, weatherFallback: false };
    const matches = rows.filter(point => !point.isArea && weatherMunicipalityMatch(weatherName, point.pref, point.name, prefectures));
    if (!matches.length) return { scale: -1, weatherFallback: false };
    const strongest = matches.reduce((left, right) => right.scale > left.scale ? right : left);
    const match = weatherMunicipalityMatch(weatherName, strongest.pref, strongest.name, prefectures);
    return { scale: strongest.scale, weatherFallback: true, municipality: strongest.name.slice(match.start, match.end) };
  }
  function scale(value, encoded = false) {
    if (encoded) { const n = numeric(value); return n !== null && SCALES.includes(Math.floor(n)) ? Math.floor(n) : -1; }
    const s = String(value ?? "").replace(/震度|以上|\s/g, "").replace(/[−ー－]/g, "-").replace(/＋/g, "+");
    const m = { "0": 0, "1": 10, "2": 20, "3": 30, "4": 40, "5-": 45, "5弱": 45, "5+": 50, "5強": 50, "6-": 55, "6弱": 55, "6+": 60, "6強": 60, "7": 70 };
    return m[s] ?? -1;
  }
  const label = (s) => LABELS[s] ?? "不明";
  function time(value) {
    if (typeof value !== "string" || !value.trim()) return NaN;
    const s = value.trim().replace(/\//g, "-").replace(" ", "T");
    return Date.parse(/(?:Z|[+-]\d\d:\d\d)$/.test(s) ? s : s + "+09:00");
  }
  function options(value) {
    const v = value || {};
    return { ...DEFAULTS, enabled: v.enabled === true, pref: typeof v.pref === "string" ? v.pref : DEFAULTS.pref,
      area: typeof v.area === "string" ? v.area : DEFAULTS.area,
      thresholdEnabled: typeof v.thresholdEnabled === "boolean" ? v.thresholdEnabled : true,
      threshold: SCALES.slice(2).includes(Number(v.threshold)) ? Number(v.threshold) : 40,
      warningEnabled: typeof v.warningEnabled === "boolean" ? v.warningEnabled : true,
      nationwide: v.nationwide === true, sound: ["off", "soft", "chime"].includes(v.sound) ? v.sound : "off",
      historyMin: SCALES.slice(1).includes(Number(v.historyMin)) ? Number(v.historyMin) : 20 };
  }
  function normalizeWolfx(v) {
    if (!v || !v.EventID || (v.type && v.type !== "jma_eew")) return null;
    const origin = time(v.OriginTime), issued = time(v.AnnouncedTime);
    if ((!Number.isFinite(origin) && v.isCancel !== true) || !Number.isFinite(issued)) return null;
    const training = v.isTraining === true || v.Issue?.Status === "訓練" || v.Issue?.Status === "試験";
    return { id: String(v.EventID), serial: numeric(v.Serial) ?? 0, origin, issued, name: String(v.Hypocenter || "震源情報待ち"),
      latitude: numeric(v.Latitude), longitude: numeric(v.Longitude), depth: numeric(v.Depth), magnitude: numeric(v.Magnitude ?? v.Magunitude),
      maxScale: scale(v.MaxIntensity), warning: v.isWarn === true, final: v.isFinal === true, cancelled: v.isCancel === true,
      training, source: "Wolfx", areas: Array.isArray(v.WarnArea) ? v.WarnArea.map((a) => ({ name: String(a.Chiiki || ""),
        from: scale(a.Shindo2), to: scale(a.Shindo1), above: /以上/.test(String(a.Shindo1)), warning: a.Type === "警報", arrival: time(a.Time) })) : [] };
  }
  function normalizeP2P(v) {
    if (!v || v.code !== 556) return null;
    const q = v.earthquake || {}, h = q.hypocenter || {};
    const origin = time(q.originTime || q.time), issued = time(v.issue?.time || v.time);
    if ((!Number.isFinite(origin) && v.cancelled !== true) || !Number.isFinite(issued)) return null;
    return { id: String(v.issue?.eventId || v.eventId || `origin-${origin}`), serial: numeric(v.issue?.serial) ?? 0,
      origin, issued, name: String(h.name || "震源情報待ち"), latitude: numeric(h.latitude), longitude: numeric(h.longitude),
      depth: numeric(h.depth), magnitude: numeric(h.magnitude), maxScale: scale(q.maxScale, true), warning: !v.cancelled,
      final: false, cancelled: v.cancelled === true, training: v.issue?.test === true || v.issue?.status === "訓練", source: "P2P地震情報",
      areas: Array.isArray(v.areas) ? v.areas.map((a) => ({ name: String(a.name || ""), pref: String(a.pref || ""),
        from: scale(a.scaleFrom, true), to: scale(a.scaleTo, true), above: Number(a.scaleTo) === 99,
        warning: ["10", "11", "19"].includes(String(a.kindCode)), arrival: time(a.arrivalTime) })) : [] };
  }
  function history(v) {
    if (!v || v.code !== 551) return null;
    const q = v.earthquake || {}, h = q.hypocenter || {}, origin = time(q.time);
    if (!Number.isFinite(origin)) return null;
    return { id: `history-${origin}`, origin, issued: time(v.issue?.time || v.time), name: String(h.name || "震源情報待ち"),
      latitude: numeric(h.latitude), longitude: numeric(h.longitude), depth: numeric(h.depth), magnitude: numeric(h.magnitude),
      maxScale: scale(q.maxScale, true), source: "P2P地震情報", points: Array.isArray(v.points) ? v.points : [], historical: true };
  }
  function histories(values) {
    const map = new Map();
    for (const v of values || []) {
      const event = history(v);
      if (!event) continue;
      const prior = map.get(event.id);
      if (!prior || (!hasLocation(prior) && hasLocation(event)) || ((event.issued || 0) > (prior.issued || 0) && event.maxScale >= 0)) map.set(event.id, event);
    }
    return [...map.values()].sort((a, b) => b.origin - a.origin).slice(0, 100);
  }
  const areaKey = (s) => String(s || "").replace(/[\s　]/g, "");
  function matchingAreas(event, region) {
    if (!region) return [];
    return event.areas.filter((a) => areaKey(a.name) === areaKey(region.name));
  }
  function localScale(event, region) {
    const areas = matchingAreas(event, region);
    return areas.length ? Math.max(...areas.map((a) => Math.max(a.from, a.to))) : -1;
  }
  function trigger(event, config, region) {
    if (!config.enabled || event.cancelled || event.training) return false;
    const local = matchingAreas(event, region);
    return (config.thresholdEnabled && localScale(event, region) >= config.threshold)
      || (config.warningEnabled && local.some((a) => a.warning))
      || (config.nationwide && event.warning);
  }
  function fresh(event, stamp) {
    return !!event && !event.training && event.origin <= stamp + 10000 && event.origin >= stamp - 300000
      && event.issued <= stamp + 10000 && event.issued >= stamp - 180000;
  }
  function endTime(event) {
    if (event.cancelled || event.final) return event.issued;
    // A missing final bulletin must not trap the signage on this screen.
    return Math.min(event.origin + 300000, event.issued + 180000);
  }
  function hasLocation(event) {
    return event && Number.isFinite(event.latitude) && Number.isFinite(event.longitude)
      && Math.abs(event.latitude) <= 90 && Math.abs(event.longitude) <= 180 && !(event.latitude === 0 && event.longitude === 0)
      && event.latitude !== -200 && event.longitude !== -200;
  }
  function surfaceRadius(event, stamp, velocity) {
    if (!hasLocation(event) || event.depth === null || event.depth < 0 || !Number.isFinite(event.depth)) return null;
    const travelled = Math.max(0, (stamp - event.origin) / 1000) * velocity;
    return travelled <= event.depth ? 0 : Math.sqrt(travelled ** 2 - event.depth ** 2);
  }
  function sArrival(event, region, stamp) {
    if (!event || event.historical || event.cancelled || !hasLocation(event) || !hasLocation(region)
      || !Number.isFinite(event.origin) || !Number.isFinite(event.depth) || event.depth < 0) return null;
    const rad = Math.PI / 180;
    const a = Math.sin((region.latitude-event.latitude)*rad/2)**2
      + Math.cos(event.latitude*rad)*Math.cos(region.latitude*rad)*Math.sin((region.longitude-event.longitude)*rad/2)**2;
    const distance = 6371*2*Math.asin(Math.sqrt(Math.min(1,a)));
    return (event.origin-stamp)/1000 + Math.hypot(distance,event.depth)/3.5;
  }
  function observationMapOffset(mapRect, panelRect, width = 828, gap = 18) {
    if (!(mapRect?.width > 0) || !(panelRect?.width > 0)) return 0;
    const covered = (panelRect.right - mapRect.left) * width / mapRect.width;
    return Math.max(0, Math.min(width - 120, covered + gap)) / 2;
  }
  function zoomView(view, anchor, factor, minimum, maximum) {
    const k = Math.max(minimum, Math.min(maximum, view.k*factor));
    const ratio = k/view.k;
    return { k, x: anchor.x-(anchor.x-view.x)*ratio, y: anchor.y-(anchor.y-view.y)*ratio };
  }
  function observations(event) {
    const rows = new Map();
    for (const p of event?.points || []) {
      const intensity=scale(p.scale,true);
      if(intensity<0 || !p.addr) continue;
      const pref=String(p.pref || "地域不明"), name=String(p.addr);
      const key=pref+":"+name;
      if(!rows.has(key) || intensity>rows.get(key).scale) rows.set(key,{pref,name,scale:intensity,isArea:p.isArea===true});
    }
    return [...rows.values()].sort((a,b)=>b.scale-a.scale || a.pref.localeCompare(b.pref,"ja") || a.name.localeCompare(b.name,"ja"));
  }
  function destination(latitude, longitude, km, bearing) {
    const rad = Math.PI / 180, p = latitude * rad, l = longitude * rad, b = bearing * rad, d = km / 6371;
    const phi = Math.asin(Math.sin(p) * Math.cos(d) + Math.cos(p) * Math.sin(d) * Math.cos(b));
    const lambda = l + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(p), Math.cos(d) - Math.sin(p) * Math.sin(phi));
    return [((lambda / rad + 540) % 360) - 180, phi / rad];
  }
  function observationGroups(event) {
    const groups = new Map();
    for (const row of observations(event)) {
      if (!groups.has(row.scale)) groups.set(row.scale, new Map());
      const prefectures = groups.get(row.scale);
      if (!prefectures.has(row.pref)) prefectures.set(row.pref, []);
      prefectures.get(row.pref).push({ name: row.name, isArea: row.isArea });
    }
    return [...groups].map(([scale, prefectures]) => ({ scale,
      prefectures: [...prefectures].map(([pref, places]) => ({ pref, places })) }));
  }
  function merge(prior, next) {
    if (!prior) return next;
    if (next.issued < prior.issued || (next.source === prior.source && next.serial < prior.serial)) return prior;
    const areas = new Map(prior.areas.map((a) => [areaKey(a.name), a]));
    // Replace the same provider's area list; fill omissions across providers only.
    if (prior.source === next.source) areas.clear();
    for (const a of next.areas) areas.set(areaKey(a.name), a);
    return { ...prior, ...next, areas: [...areas.values()],
      latitude: hasLocation(next) ? next.latitude : prior.latitude, longitude: hasLocation(next) ? next.longitude : prior.longitude,
      depth: next.depth !== null && next.depth >= 0 ? next.depth : prior.depth,
      magnitude: next.magnitude !== null && next.magnitude >= 0 ? next.magnitude : prior.magnitude,
      final: prior.final || next.final, cancelled: prior.cancelled || next.cancelled };
  }
  return { SCALES, DEFAULTS, numeric, scale, label, time, options, normalizeWolfx, normalizeP2P, history, histories,
    matchingAreas, localScale, localObservation, trigger, fresh, endTime, hasLocation, surfaceRadius, sArrival, observationMapOffset, zoomView, observations, observationGroups, weatherMunicipalityMatch, destination, merge };
});
