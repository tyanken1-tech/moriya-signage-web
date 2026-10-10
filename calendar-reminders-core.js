(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MoriyaReminderCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const DAY = 86400000;
  const dayKey = value => new Date(new Date(value).getTime() + 9 * 3600000).toISOString().slice(0, 10);
  const midnight = key => Date.parse(key + 'T00:00:00+09:00');
  const folded = text => String(text || '').normalize('NFKC').toLocaleLowerCase('ja-JP');
  // Only an identity fallback, not encryption. Cloud documents use AES-GCM.
  function legacyId(text) {
    let hash = 2166136261;
    for (const char of text) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    return 'rule-' + (hash >>> 0).toString(16);
  }
  function normalize(value) {
    const ids = new Set();
    const rules = (Array.isArray(value?.rules) ? value.rules : []).slice(0, 5).map((rule, index) => {
      const keyword = String(rule?.keyword || '').trim().slice(0, 80);
      let id = /^[A-Za-z0-9-]{1,128}$/.test(rule?.id || '') ? rule.id : legacyId(keyword + ':' + index);
      if (ids.has(id)) id = legacyId(id + ':' + index);
      ids.add(id);
      const times = [], seen = new Set();
      for (const time of (Array.isArray(rule?.times) ? rule.times : []).slice(0, 3)) {
        const daysBefore = Number(time?.daysBefore), clock = String(time?.time || '');
        const key = daysBefore + ':' + clock;
        if (![0, 1, 2].includes(daysBefore) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(clock) || seen.has(key)) continue;
        seen.add(key); times.push({ daysBefore, time: clock });
      }
      return { id, enabled: rule?.enabled !== false, keyword,
        color: /^#[a-f0-9]{6}$/i.test(rule?.color || '') ? rule.color : '#a84840',
        design: ['glass', 'solid', 'outline'].includes(rule?.design) ? rule.design : 'glass', times };
    });
    return { enabled: value?.enabled === true, rules };
  }
  function collect(config, events, at, source) {
    const current = Number(new Date(at)), result = [], seen = new Set();
    if (!Number.isFinite(current)) return result;
    const rules = normalize(config);
    if (!rules.enabled) return result;
    for (const event of events) {
      const start = Number(new Date(event.start));
      if (!Number.isFinite(start) || event.status === 'CANCELLED') continue;
      const date = dayKey(start), expiresAt = midnight(date) + DAY;
      if (expiresAt <= current) continue;
      for (const rule of rules.rules) {
        if (!rule.enabled || !rule.keyword || !folded(event.summary).includes(folded(rule.keyword))) continue;
        // Use the latest elapsed slot even if it was acknowledged: never revive older slots.
        const dueAt = rule.times.map(time => midnight(date) - time.daysBefore * DAY
          + Number(time.time.slice(0, 2)) * 3600000 + Number(time.time.slice(3)) * 60000)
          .filter(time => time <= current).sort((a, b) => b - a)[0];
        if (dueAt === undefined) continue;
        const eventKey = JSON.stringify([source, event.uid || event.summary, start]);
        // Equivalent rules on independently configured peers share the same acknowledgement.
        const key = JSON.stringify([1, eventKey, folded(rule.keyword), dueAt]);
        if (seen.has(key)) continue;
        seen.add(key);
        result.push({ key, eventKey, dueAt, expiresAt, start, allDay: Boolean(event.allDay),
          title: String(event.summary || '無題の予定'), keyword: rule.keyword, color: rule.color, design: rule.design });
      }
    }
    return result.sort((a, b) => a.start - b.start || b.dueAt - a.dueAt);
  }
  async function identify(key) {
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
    return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
  }
  function normalizeGarbage(value) {
    const normalized = normalize(value);
    normalized.rules = normalized.rules.slice(0, 3);
    return normalized;
  }
  function collectGarbage(config, calendar, at) {
    const normalized = normalizeGarbage(config);
    const categories = new Set(normalized.rules.filter(rule => rule.enabled).map(rule => rule.keyword));
    const events = [];
    const today = dayKey(at), start = midnight(today);
    for (let offset = 0; offset <= 2; offset++) {
      const date = dayKey(start + offset * DAY);
      for (const category of calendar?.entries?.[date] || []) {
        // Exact category matching prevents 可燃 / 不燃 or 缶 / ビン collisions.
        if (!categories.has(category)) continue;
        events.push({ uid: date + ':' + category, start: midnight(date), allDay: true, summary: category });
      }
    }
    return collect(normalized, events, at, 'garbage:' + (calendar?.city || '守谷市'))
      .map(item => ({ ...item, title: item.title + 'を出す日' }));
  }
  function marks(values, at = Date.now()) {
    const map = new Map();
    for (const mark of (Array.isArray(values) ? values : []).slice(0, 5000)) {
      if (!/^[a-f0-9]{64}$/.test(mark?.id || '') || !Number.isFinite(mark.until) || mark.until <= at
        || !Number.isFinite(mark.at) || mark.at > at + 60000) continue;
      if (!map.has(mark.id) || map.get(mark.id).at < mark.at) map.set(mark.id, { id: mark.id, at: mark.at, until: mark.until });
    }
    return [...map.values()].sort((a, b) => a.id.localeCompare(b.id));
  }
  function mergeMarks(...lists) { return marks(lists.flat()); }
  return { normalize, normalizeGarbage, collect, collectGarbage, identify, marks, mergeMarks, dayKey };
});
