/* Bounded, ES5 iCalendar reader. All times are numeric; no Intl/Date.parse dependency. */
(function (root) {
  'use strict';
  var DAY = 86400000, JST = 32400000, CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  function decode(value) { return value.replace(/\\n/gi, ' ').replace(/\\([,;\\])/g, '$1'); }
  function date(value, params) {
    var m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(value), zone;
    if (!m) { return null; }
    zone = m[7] || params.TZID === 'UTC' || params.TZID === 'Etc/UTC' ? 0 : JST;
    if (!m[7] && params.TZID && !/^(Asia\/Tokyo|Japan|UTC|Etc\/UTC)$/.test(params.TZID)) { return null; }
    var ms = Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)) - zone;
    return { ms: ms, zone: zone, allDay: !m[4] || params.VALUE === 'DATE' };
  }
  function property(line) {
    var colon = line.indexOf(':'), parts, params = {}, i, equal;
    if (colon < 0) { return null; }
    parts = line.substring(0, colon).split(';');
    for (i = 1; i < parts.length; i++) { equal = parts[i].indexOf('='); if (equal > 0) { params[parts[i].substring(0, equal).toUpperCase()] = parts[i].substring(equal + 1).replace(/^"|"$/g, ''); } }
    return { name: parts[0].toUpperCase(), params: params, value: line.substring(colon + 1) };
  }
  function rule(value) {
    var result = {}, parts = value.split(';'), i, pair;
    for (i = 0; i < parts.length; i++) { pair = parts[i].split('='); if (pair.length === 2) { result[pair[0].toUpperCase()] = pair[1].toUpperCase(); } }
    return result;
  }
  function duration(value) { var m = /^P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(value); return m ? ((+(m[1] || 0) * 7 + +(m[2] || 0)) * 86400 + +(m[3] || 0) * 3600 + +(m[4] || 0) * 60 + +(m[5] || 0)) * 1000 : null; }
  function parse(text) {
    if (typeof text !== 'string' || text.length > 1048576 || !/BEGIN:VCALENDAR/.test(text)) { throw new Error('有効なiCalファイルではありません（最大1MB）'); }
    var blocks = text.replace(/\r?\n[ \t]/g, '').match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [], events = [], warnings = [], i, j;
    if (blocks.length > 2000) { throw new Error('予定は最大2000件です。対象期間を絞ったiCalを使用してください'); }
    for (i = 0; i < blocks.length; i++) {
      var lines = blocks[i].split(/\r?\n/), props = {}, p, start, end, event;
      for (j = 0; j < lines.length; j++) { p = property(lines[j]); if (p && /^[A-Z-]+$/.test(p.name)) { if (!props[p.name]) { props[p.name] = []; } props[p.name].push(p); } }
      function first(name) { return props[name] && props[name][0]; }
      function value(name) { var found = first(name); return found ? found.value : ''; }
      p = first('DTSTART'); start = p ? date(p.value, p.params) : null;
      var recurrence = first('RECURRENCE-ID');
      if (!start && value('STATUS') === 'CANCELLED' && recurrence) { start = date(recurrence.value, recurrence.params); }
      if (!start) { warnings.push('未対応の日時・タイムゾーンを含む予定があります'); continue; }
      p = first('DTEND'); end = p ? date(p.value, p.params) : null;
      var span = value('DURATION') ? duration(value('DURATION')) : null;
      if (p && !end) { warnings.push('未対応の終了日時を含む予定があります'); continue; }
      event = { start: start.ms, zone: start.zone, allDay: start.allDay, end: end ? end.ms : start.ms + (span === null ? start.allDay ? DAY : 3600000 : span),
        uid: value('UID') || 'event-' + i, summary: decode(value('SUMMARY') || '予定'), location: decode(value('LOCATION')), cancelled: value('STATUS') === 'CANCELLED',
        rule: value('RRULE') ? rule(value('RRULE')) : null, exdates: [], rdates: [], recurrence: recurrence ? date(recurrence.value, recurrence.params) : null };
      if (event.end <= event.start || event.end - event.start > 366 * DAY) { warnings.push('期間が未対応の予定があります'); continue; }
      var lists = ['EXDATE', 'RDATE'], k, entries, n, items, a, parsed;
      for (k = 0; k < lists.length; k++) {
        entries = props[lists[k]] || [];
        for (n = 0; n < entries.length; n++) {
          items = entries[n].value.split(',');
          for (a = 0; a < items.length; a++) { parsed = date(items[a], entries[n].params); if (parsed) { event[lists[k] === 'EXDATE' ? 'exdates' : 'rdates'].push(parsed.ms); } else { warnings.push('未対応の例外日付があります'); } }
        }
      }
      if (event.rule) {
        var allowed = /^(FREQ|INTERVAL|COUNT|UNTIL|BYDAY|BYMONTHDAY|BYMONTH|BYSETPOS|WKST)$/;
        var unsupported = !/^(DAILY|WEEKLY|MONTHLY|YEARLY)$/.test(event.rule.FREQ || ''), field;
        for (field in event.rule) { if (Object.prototype.hasOwnProperty.call(event.rule, field) && !allowed.test(field)) { unsupported = true; } }
        if (unsupported) { warnings.push('未対応の繰り返し規則があります'); event.rule = null; }
      }
      if (recurrence && (!event.recurrence || recurrence.params.RANGE)) { warnings.push('未対応の繰り返し変更があります'); }
      events.push(event);
    }
    return { events: events, warning: warnings.length ? warnings[0] + '（' + warnings.length + '件）' : '' };
  }
  function has(list, value) { var i; for (i = 0; i < list.length; i++) { if (list[i] === value) { return true; } } return false; }
  function listNumbers(value, number) { var parts = value.split(','), i; for (i = 0; i < parts.length; i++) { if (+parts[i] === number) { return true; } } return false; }
  function localDay(ms, zone) { return Math.floor((ms + zone) / DAY); }
  function matches(event, day) {
    var r = event.rule, startDay = localDay(event.start, event.zone), first = new Date(startDay * DAY), d = new Date(day * DAY);
    var interval = Math.max(1, Math.floor(+r.INTERVAL || 1)), monthDiff = (d.getUTCFullYear() - first.getUTCFullYear()) * 12 + d.getUTCMonth() - first.getUTCMonth();
    // BYSETPOS must consider the whole first month, including days before DTSTART.
    if (day < startDay && !r.BYSETPOS) { return false; }
    if (r.BYMONTH && !listNumbers(r.BYMONTH, d.getUTCMonth() + 1)) { return false; }
    if (r.FREQ === 'DAILY' && (day - startDay) % interval !== 0) { return false; }
    if (r.FREQ === 'WEEKLY') {
      var weekStart = r.WKST ? CODES.indexOf(r.WKST) : 1;
      if (weekStart < 0) { weekStart = 1; }
      var firstWeek = startDay - (first.getUTCDay() - weekStart + 7) % 7, thisWeek = day - (d.getUTCDay() - weekStart + 7) % 7;
      if (Math.floor((thisWeek - firstWeek) / 7) % interval !== 0 || !r.BYDAY && d.getUTCDay() !== first.getUTCDay()) { return false; }
    }
    if (r.FREQ === 'MONTHLY' && monthDiff % interval !== 0) { return false; }
    if (r.FREQ === 'YEARLY' && ((d.getUTCFullYear() - first.getUTCFullYear()) % interval !== 0 || !r.BYMONTH && d.getUTCMonth() !== first.getUTCMonth())) { return false; }
    var maxDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate(), dayNum = d.getUTCDate();
    if (r.BYMONTHDAY && !listNumbers(r.BYMONTHDAY, dayNum) && !listNumbers(r.BYMONTHDAY, dayNum - maxDay - 1)) { return false; }
    if (r.BYDAY) {
      var weekdays = r.BYDAY.split(','), matched = false, i, m;
      for (i = 0; i < weekdays.length; i++) {
        m = /^([+-]?\d+)?(SU|MO|TU|WE|TH|FR|SA)$/.exec(weekdays[i]);
        if (!m || CODES[d.getUTCDay()] !== m[2]) { continue; }
        if (!m[1] || +m[1] > 0 && Math.floor((dayNum - 1) / 7) + 1 === +m[1] || +m[1] < 0 && -(Math.floor((maxDay - dayNum) / 7) + 1) === +m[1]) { matched = true; }
      }
      if (!matched) { return false; }
    }
    if ((r.FREQ === 'MONTHLY' || r.FREQ === 'YEARLY') && !r.BYDAY && !r.BYMONTHDAY && dayNum !== first.getUTCDate()) { return false; }
    return true;
  }
  function candidate(event, day) {
    if (!matches(event, day)) { return false; }
    var r = event.rule;
    if (!r.BYSETPOS) { return true; }
    var d = new Date(day * DAY), monthStart = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) / DAY, monthEnd = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1) / DAY, days = [], i;
    for (i = monthStart; i < monthEnd; i++) { if (matches(event, i)) { days.push(i); } }
    for (i = 0; i < days.length; i++) { if (days[i] === day) { return listNumbers(r.BYSETPOS, i + 1) || listNumbers(r.BYSETPOS, i - days.length); } }
    return false;
  }
  function occurrenceNumber(event, day) {
    var start = localDay(event.start, event.zone), r = event.rule, interval = Math.max(1, +r.INTERVAL || 1), count = 0, i;
    if (r.FREQ === 'DAILY' && !r.BYDAY && !r.BYMONTH && !r.BYMONTHDAY && !r.BYSETPOS) { return Math.floor((day - start) / interval) + 1; }
    // COUNT expansion is cached once per rule/day. Limit guards pathological ancient calendars.
    if (day - start > 40000) { return Infinity; }
    if (!event.countCache) { event.countCache = { day: start - 1, count: 0 }; }
    var cache = event.countCache;
    if (day >= cache.day && cache.count > +r.COUNT) { return cache.count; }
    if (day >= cache.day) { i = cache.day + 1; count = cache.count; } else { i = start; }
    for (; i <= day; i++) { if (candidate(event, i)) { count++; if (count > +r.COUNT) { break; } } }
    if (day >= cache.day) { cache.day = Math.min(i, day); cache.count = count; }
    return count;
  }
  function between(parsed, from, to) {
    var events = parsed.events, result = [], excluded = {}, seen = {}, i, j, event;
    for (i = 0; i < events.length; i++) { event = events[i]; if (event.recurrence) { excluded[event.uid + ':' + event.recurrence.ms] = true; } }
    function add(e, start, override) {
      var identity = e.uid + ':' + start, end = start + e.end - e.start;
      if (e.cancelled || start >= to || end <= from || !override && (has(e.exdates, start) || excluded[identity]) || seen[identity]) { return; }
      seen[identity] = true;
      result.push({ start: start, end: end, allDay: e.allDay, summary: e.summary, location: e.location });
    }
    for (i = 0; i < events.length; i++) {
      event = events[i];
      if (event.recurrence || !event.rule) { add(event, event.start, !!event.recurrence); }
      else {
        var r = event.rule, firstDay = localDay(event.start, event.zone), startDay = Math.max(firstDay, localDay(from - (event.end - event.start), event.zone)), lastDay = localDay(to, event.zone), until = r.UNTIL ? date(r.UNTIL, { TZID: event.zone === 0 ? 'UTC' : 'Asia/Tokyo' }) : null;
        var clock = (event.start + event.zone) % DAY;
        for (j = startDay; j <= lastDay; j++) {
          if (!candidate(event, j)) { continue; }
          var occurrence = j * DAY + clock - event.zone;
          if (occurrence < event.start || until && occurrence > until.ms || r.COUNT && occurrenceNumber(event, j) > +r.COUNT) { continue; }
          add(event, occurrence, false);
        }
      }
      for (j = 0; j < event.rdates.length; j++) { add(event, event.rdates[j], false); }
    }
    result.sort(function (a, b) { return a.allDay !== b.allDay ? a.allDay ? -1 : 1 : a.start - b.start; });
    return result;
  }
  root.AiuIcal = { parse: parse, between: between };
}(window));
