/* ES5 calendar UI; parse/cache on fetch, expand only for the displayed date range. */
(function () {
  'use strict';
  var KEY = 'moriya-aiu-calendar-v1', CACHE = 'moriya-aiu-calendar-cache-v1', DAY = 86400000, JST = 32400000;
  var url = '', parsed = { events: [], warning: '' }, cache = null, busy = false, pending = null, serial = 0, timer = null;
  var selected = Math.floor((new Date().getTime() + JST) / DAY) * DAY - JST, month = selected, renderedDay = '', status = '';
  function el(id) { return document.getElementById(id); }
  function put(id, value) { el(id).textContent = value; }
  function read(key) { try { return JSON.parse(window.localStorage.getItem(key)); } catch (e) { return null; } }
  function store(key, value) { try { window.localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; } }
  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function key(ms) { var d = new Date(ms + JST); return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); }
  function time(ms) { var d = new Date(ms + JST); return pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()); }
  function today() { return Math.floor((new Date().getTime() + JST) / DAY) * DAY - JST; }
  function empty(node) { while (node.firstChild) { node.removeChild(node.firstChild); } node.textContent = ''; }
  function rows(id, events, max) {
    var parent = el(id), i; empty(parent);
    if (!events.length) { parent.textContent = url ? '予定はありません' : 'iCal URLは未設定です'; return; }
    for (i = 0; i < events.length && i < max; i++) {
      var row = document.createElement('div'), clock = document.createElement('span'), title = document.createElement('span');
      row.className = 'event-row'; clock.className = 'event-time'; clock.textContent = events[i].allDay ? '終日' : time(events[i].start); title.textContent = events[i].summary;
      row.appendChild(clock); row.appendChild(title);
      if (events[i].location && id !== 'homeAgenda') { var location = document.createElement('div'); location.className = 'event-location'; location.textContent = events[i].location; row.appendChild(location); }
      parent.appendChild(row);
    }
    if (events.length > max && id !== 'homeAgenda') { var more = document.createElement('p'); more.textContent = 'ほか ' + (events.length - max) + '件'; parent.appendChild(more); }
  }
  function setStatus(value) {
    status = value + (parsed.warning ? ' / ' + parsed.warning : '');
    put('calendarStatus', status); put('calendarSetupStatus', status); put('calendarDetailStatus', status);
  }
  function daily(force) {
    var day = today(); if (!force && renderedDay === key(day)) { return; } renderedDay = key(day);
    var events = window.AiuIcal.between(parsed, day, day + DAY);
    rows('todayEvents', events, 100); rows('homeAgenda', events, 2); rows('tomorrowEvents', window.AiuIcal.between(parsed, day + DAY, day + 2 * DAY), 100);
  }
  function renderMonth() {
    var date = new Date(month + JST), year = date.getUTCFullYear(), m = date.getUTCMonth();
    put('calendarMonth', year + '年 ' + (m + 1) + '月');
    var first = Date.UTC(year, m, 1) - JST, start = first - new Date(first + JST).getUTCDay() * DAY;
    var events = window.AiuIcal.between(parsed, start, start + 42 * DAY), counts = {}, i, day;
    for (i = 0; i < events.length; i++) {
      for (day = Math.max(start, Math.floor((events[i].start + JST) / DAY) * DAY - JST); day < events[i].end && day < start + 42 * DAY; day += DAY) { counts[key(day)] = (counts[key(day)] || 0) + 1; }
    }
    var parent = el('monthCalendar'), table = document.createElement('table'), head = document.createElement('tr'); empty(parent); table.className = 'month-table';
    for (i = 0; i < 7; i++) { var th = document.createElement('th'); th.textContent = '日月火水木金土'.charAt(i); head.appendChild(th); } table.appendChild(head);
    for (i = 0; i < 6; i++) {
      var tr = document.createElement('tr'), j;
      for (j = 0; j < 7; j++) {
        (function (ms) {
          var td = document.createElement('td'), button = document.createElement('button'), d = new Date(ms + JST), count = counts[key(ms)] || 0;
          button.type = 'button'; button.textContent = d.getUTCDate() + (count ? ' · ' + count : '');
          button.className = (key(ms) === key(selected) ? 'picked ' : '') + (count ? 'has-events ' : '') + (d.getUTCMonth() !== m ? 'outside' : '');
          button.onclick = function () { selected = ms; renderMonth(); }; td.appendChild(button); tr.appendChild(td);
        }(start + (i * 7 + j) * DAY));
      }
      table.appendChild(tr);
    }
    parent.appendChild(table); put('selectedDate', key(selected)); rows('selectedEvents', window.AiuIcal.between(parsed, selected, selected + DAY), 100); put('calendarDetailStatus', status);
  }
  function accept(text) {
    try {
      var result = window.AiuIcal.parse(text); parsed = result;
      cache = { url: url, text: text, at: key(new Date().getTime()) + ' ' + time(new Date().getTime()) };
      var saved = store(CACHE, cache); setStatus('取得済み ' + cache.at + (saved ? '' : ' / 端末への保存不可')); daily(true);
      if (el('calendarPanel').style.display === 'block') { renderMonth(); }
    } catch (e) { setStatus(e.message || 'iCalを読み込めません'); }
  }
  function fetchCalendar() {
    if (!url || busy) { return; } busy = true; setStatus('予定を取得中');
    var done = false, xhr = null, id = ++serial, timeout;
    function finish(error, text) {
      if (done) { return; } done = true; busy = false; pending = null; window.clearTimeout(timeout);
      if (error) { setStatus(error + (cache ? ' / 保存済みの予定 ' + cache.at : '')); } else { accept(text); }
    }
    function readText(target, body) {
      xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () { if (xhr.readyState === 4 && !done) { finish(xhr.status === 200 || xhr.status === 0 && /BEGIN:VCALENDAR/.test(xhr.responseText) ? null : 'iCalを取得できません（通信・HTTPS制約など）', xhr.responseText); } };
      try { xhr.open(body ? 'POST' : 'GET', target, true); if (body) { xhr.setRequestHeader('Content-Type', 'application/json'); } xhr.send(body ? JSON.stringify(body) : null); }
      catch (e) { finish('iCalを取得できません（起動方法・URLを確認してください）'); }
    }
    timeout = window.setTimeout(function () { finish('iCal取得がタイムアウトしました'); if (xhr) { xhr.abort(); } }, 25000);
    pending = { id: id, finish: finish, readText: readText };
    if (window.location.hostname === 'aiu.local') {
      try { if (window.prompt('AIU_ICAL', JSON.stringify({ id: id, url: url })) !== 'accepted') { finish('iCal接続を開始できません'); } }
      catch (e) { finish('iCal接続を開始できません'); }
    } else if (/^https:\/\/calendar\.google\.com\/calendar\/ical\//.test(url) && window.location.protocol !== 'file:') { readText('/api/ical', { url: url }); }
    else { readText(url, null); }
  }
  window.AiuCalendarResult = function (id, result) {
    if (!pending || id !== pending.id) { return; }
    if (result.error) { pending.finish(result.error); } else { pending.readText('http://aiu.local/calendar.ics', null); }
  };
  function save() {
    var next = String(el('icalUrl').value || '').replace(/^\s+|\s+$/g, '').replace(/^webcal:/i, 'https:');
    if (next && !/^https?:\/\//i.test(next)) { put('calendarSetupStatus', 'iCal URLはhttpまたはhttpsで指定してください'); return false; }
    if (busy && next !== url) { put('calendarSetupStatus', '取得が終了してからURLを変更してください'); return false; }
    var changed = next !== url; url = next; var saved = store(KEY, { url: url });
    if (changed) {
      cache = null; parsed = { events: [], warning: '' }; store(CACHE, null); daily(true);
      window.clearInterval(timer); timer = null; setStatus(url ? '未取得' : 'iCal URLは未設定です');
      if (url) { fetchCalendar(); timer = window.setInterval(fetchCalendar, 1800000); }
    }
    return saved;
  }
  window.AiuCalendar = { save: save, dayChanged: function () { daily(false); } };
  el('refreshCalendar').onclick = function () { if (save()) { fetchCalendar(); } else { put('calendarSetupStatus', '保存できません。URLと端末の保存設定を確認してください'); } };
  el('openCalendar').onclick = function () { selected = today(); month = selected; renderMonth(); el('calendarPanel').style.display = 'block'; };
  el('closeCalendar').onclick = function () { el('calendarPanel').style.display = 'none'; };
  function moveMonth(delta) { var d = new Date(month + JST); month = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + delta, 1) - JST; renderMonth(); }
  el('calendarPrev').onclick = function () { moveMonth(-1); }; el('calendarNext').onclick = function () { moveMonth(1); };
  el('calendarToday').onclick = function () { selected = today(); month = selected; renderMonth(); };
  var settings = read(KEY); url = settings && typeof settings.url === 'string' ? settings.url.substring(0, 4096) : ''; el('icalUrl').value = url;
  cache = read(CACHE);
  if (url && cache && cache.url === url && typeof cache.text === 'string') { try { parsed = window.AiuIcal.parse(cache.text); setStatus('保存済みの予定 ' + cache.at); } catch (e) { cache = null; } } else { cache = null; }
  daily(true); if (!url) { setStatus('iCal URLは未設定です'); } else { fetchCalendar(); timer = window.setInterval(fetchCalendar, 1800000); }
}());
