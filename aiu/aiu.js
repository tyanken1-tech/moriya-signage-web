/* ES5 only. Static rendering; no framework, animation or peer connections. */
(function () {
  'use strict';
  var KEY = 'moriya-aiu-v1', CACHE = 'moriya-aiu-weather-v1';
  var timer = null, weatherTimer = null, request = null, cancelRequest = null, lastMinute = '', weatherCache = null;
  var config = { lead: 10, dayType: 'auto', seconds: false, keepAwake: true, fontSize: 'normal', notes: '', weatherEnabled: false, background: 'photo' };
  function el(id) { return document.getElementById(id); }
  function put(id, value) { var node = el(id); value = String(value); if (node.textContent !== value) { node.textContent = value; } }
  function read(key) { try { return JSON.parse(window.localStorage.getItem(key)); } catch (e) { return null; } }
  function store(key, value) { try { window.localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; } }
  function pad(n) { return n < 10 ? '0' + n : String(n); }
  /* Tokyo time does not depend on the device timezone or Intl support. */
  function tokyo() { return new Date(new Date().getTime() + 9 * 3600000); }
  function key(d) { return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); }
  function stamp(d) { return key(d) + ' ' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()); }
  function normalise(raw) {
    raw = raw || {};
    var lead = Number(raw.lead);
    config.lead = isFinite(lead) && lead >= 0 && lead <= 120 ? Math.floor(lead) : 10;
    config.dayType = raw.dayType === 'weekday' || raw.dayType === 'weekend' ? raw.dayType : 'auto';
    config.seconds = raw.seconds === true;
    config.keepAwake = raw.keepAwake !== false;
    config.fontSize = raw.fontSize === 'large' ? 'large' : 'normal';
    config.notes = typeof raw.notes === 'string' ? raw.notes.substring(0, 2000) : '';
    config.weatherEnabled = raw.weatherEnabled !== false;
    config.background = raw.background === 'plain' ? 'plain' : 'photo';
  }
  function isWeekend(d) {
    var holidays = window.AIU_HOLIDAYS || [], i;
    if (d.getUTCDay() === 0 || d.getUTCDay() === 6) { return true; }
    for (i = 0; i < holidays.length; i++) { if (holidays[i] === key(d)) { return true; } }
    return false;
  }
  function renderTrains(d) {
    var data = window.TX_MORIYA_AKIHABARA_TIMETABLE, body = el('trains');
    var type = config.dayType === 'auto' ? (isWeekend(d) ? 'weekend' : 'weekday') : config.dayType;
    var now = d.getUTCHours() * 60 + d.getUTCMinutes(), threshold = now + config.lead;
    var found = 0, offset, day, list, i, train, departure, tr, td;
    while (body.firstChild) { body.removeChild(body.firstChild); }
    put('trainMode', (type === 'weekend' ? '土休日' : '平日') + 'ダイヤ / ' + config.lead + '分後以降');
    if (!data) { put('trainStatus', '時刻表データを読み込めません'); return; }
    for (offset = 0; offset <= 1 && found < 4; offset++) {
      day = new Date(d.getTime() + offset * 86400000);
      type = config.dayType === 'auto' ? (isWeekend(day) ? 'weekend' : 'weekday') : config.dayType;
      list = data[type] || [];
      for (i = 0; i < list.length && found < 4; i++) {
        train = list[i]; departure = offset * 1440 + train.hour * 60 + train.minute;
        if (departure < threshold) { continue; }
        tr = document.createElement('tr'); tr.className = found === 0 ? 'first' : '';
        td = document.createElement('td'); td.textContent = (offset ? '翌 ' : '') + train.time; tr.appendChild(td);
        td = document.createElement('td'); td.className = train.kind;
        td.textContent = (data.services[train.kind] || train.kind) + (train.startsHere ? ' 始発' : ''); tr.appendChild(td);
        td = document.createElement('td'); td.textContent = (departure - now) + '分'; tr.appendChild(td);
        body.appendChild(tr); found++;
      }
    }
    put('trainStatus', '同梱時刻表 / 運行状況・遅延は反映しません' + (d.getUTCFullYear() > 2027 && config.dayType === 'auto' ? ' / 祝日は手動でダイヤ指定してください' : ''));
  }
  function renderGarbage(d) {
    var data = window.MORIYA_GARBAGE_CALENDAR, start = new Date(d.getTime()), i, day, entries;
    if (d.getUTCHours() >= 12) { start.setUTCDate(start.getUTCDate() + 1); }
    if (!data || key(start) < data.validFrom || key(start) > data.validThrough) { put('garbage', '同梱カレンダーの対象期間外です'); return; }
    for (i = 0; i < 14; i++) {
      day = new Date(start.getTime() + i * 86400000); entries = data.entries[key(day)];
      if (entries && entries.length) { put('garbage', (day.getUTCMonth() + 1) + '/' + day.getUTCDate() + '（' + '日月火水木金土'.charAt(day.getUTCDay()) + '） ' + entries.join('・')); return; }
    }
    put('garbage', '近日の収集予定はありません');
  }
  function tick() {
    var d = tokyo(), minute = stamp(d);
    put('clockMain', pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()));
    put('commuteClock', pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()));
    put('weatherClock', pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()));
    if (config.seconds) { put('clockSeconds', ':' + pad(d.getUTCSeconds())); }
    if (lastMinute !== minute) {
      lastMinute = minute;
      put('date', d.getUTCFullYear() + '/' + pad(d.getUTCMonth() + 1) + '/' + pad(d.getUTCDate()) + '（' + '日月火水木金土'.charAt(d.getUTCDay()) + '）');
      renderTrains(d); renderGarbage(d);
      if (window.AiuCalendar) { window.AiuCalendar.dayChanged(); }
    }
    timer = window.setTimeout(tick, config.seconds ? 1000 - new Date().getMilliseconds() : 60000 - (new Date().getSeconds() * 1000 + new Date().getMilliseconds()));
  }
  function weatherName(code) {
    if (code === 0) { return '晴れ'; } if (code <= 3) { return '晴れ・くもり'; }
    if (code <= 48) { return '霧'; } if (code <= 67) { return '雨'; }
    if (code <= 77) { return '雪'; } if (code <= 82) { return 'にわか雨'; }
    if (code <= 86) { return 'にわか雪'; } return '雷雨';
  }
  function showWeather(status) {
    if (!config.weatherEnabled) { put('weather', '天気の取得はオフ'); put('weatherStatus', '設定で有効にできます'); put('weatherDetail', '守谷の天気'); return; }
    if (weatherCache) {
      put('weather', weatherName(weatherCache.code));
      put('weatherTemp', weatherCache.temp + '°'); put('weatherSymbol', weatherSymbol(weatherCache.code));
      put('weatherDetail', weatherName(weatherCache.code) + ' ' + weatherCache.temp + '℃');
      renderForecasts(weatherCache);
      put('weatherStatus', status + ' / 取得日時 ' + weatherCache.at + ' / Open-Meteo');
    } else { put('weather', '天気データなし'); put('weatherStatus', status); }
  }
  function weatherSymbol(code) { return code === 0 ? '☀' : code <= 3 ? '☁' : code >= 71 && code <= 77 || code >= 85 && code <= 86 ? '❄' : '☂'; }
  function renderForecasts(cache) {
    var data = cache.forecast || {}, daily = data.daily || {}, hourly = data.hourly || {}, i, count = 0;
    var home = el('homeForecast'), hours = el('hourlyForecast'), days = el('dailyForecast');
    home.innerHTML = ''; hours.innerHTML = ''; days.innerHTML = '';
    if (daily.temperature_2m_max && daily.temperature_2m_max.length) { put('weatherFacts', Math.round(daily.temperature_2m_max[0]) + '/' + Math.round(daily.temperature_2m_min[0]) + '°　降水 ' + daily.precipitation_probability_max[0] + '%'); }
    function item(parent, label, temp, code, rain, preview) {
      var row = document.createElement('div'), title = document.createElement('span'), symbol = document.createElement('span'), temperature = document.createElement('span'), precip = document.createElement('span');
      row.className = preview ? 'preview-item' : 'forecast-item'; title.textContent = label; symbol.className = 'preview-symbol'; symbol.textContent = weatherSymbol(code); temperature.className = 'preview-temp'; temperature.textContent = temp; precip.className = 'preview-rain'; precip.textContent = rain + '%';
      row.appendChild(title); row.appendChild(symbol); row.appendChild(temperature); row.appendChild(precip); parent.appendChild(row);
    }
    var now = stamp(tokyo()).replace(' ', 'T');
    for (i = 0; hourly.time && i < hourly.time.length && count < 12; i++) {
      if (hourly.time[i] < now) { continue; }
      var label = Number(hourly.time[i].substring(11, 13)) + '時', temp = Math.round(hourly.temperature_2m[i]) + '°';
      if (count < 3) { item(home, label, temp, hourly.weather_code[i], hourly.precipitation_probability[i], true); }
      item(hours, label, temp, hourly.weather_code[i], hourly.precipitation_probability[i], false); count++;
    }
    for (i = 0; daily.time && i < daily.time.length && i < 7; i++) { item(days, daily.time[i].substring(5).replace('-', '/'), Math.round(daily.temperature_2m_max[i]) + '/' + Math.round(daily.temperature_2m_min[i]) + '°', daily.weather_code[i], daily.precipitation_probability_max[i], false); }
  }
  function fetchWeather() {
    if (!config.weatherEnabled || request) { return; }
    showWeather('取得中');
    var xhr = new XMLHttpRequest(), timeout, finished = false;
    request = xhr;
    function finish(ok) {
      if (finished) { return; } finished = true; window.clearTimeout(timeout); request = null; cancelRequest = null;
      if (ok) {
        try {
          var current = JSON.parse(xhr.responseText).current_weather;
          if (!current || typeof current.temperature !== 'number' || typeof current.weathercode !== 'number') { throw new Error('Invalid weather'); }
          var forecast = JSON.parse(xhr.responseText);
          weatherCache = { temp: current.temperature, code: current.weathercode, at: stamp(tokyo()), forecast: { daily: forecast.daily, hourly: forecast.hourly } };
          store(CACHE, weatherCache); showWeather('取得済み'); return;
        } catch (e) {}
      }
      showWeather('取得できません（通信・HTTPS制約など）');
    }
    xhr.onreadystatechange = function () { if (xhr.readyState === 4) { finish(xhr.status === 200); } };
    cancelRequest = function () { finished = true; window.clearTimeout(timeout); xhr.onreadystatechange = null; xhr.abort(); request = null; cancelRequest = null; };
    try {
      var url = window.location.hostname === 'aiu.local' ? 'http://aiu.local/weather.json' : 'https://api.open-meteo.com/v1/forecast?latitude=35.951&longitude=139.975&current_weather=true&hourly=temperature_2m,precipitation_probability,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=Asia%2FTokyo&forecast_days=7';
      xhr.open('GET', url, true);
      timeout = window.setTimeout(function () { finish(false); xhr.abort(); }, 15000); xhr.send(null);
    } catch (e) { finish(false); }
  }
  function apply() {
    window.clearTimeout(timer); window.clearInterval(weatherTimer); weatherTimer = null;
    if (cancelRequest) { cancelRequest(); }
    document.body.className = (config.fontSize === 'large' ? 'large ' : '') + (config.background === 'plain' ? 'plain' : '');
    if (window.location.hostname === 'aiu.local') { try { window.prompt('AIU_DISPLAY', config.keepAwake ? 'true' : 'false'); } catch (e) {} }
    el('clock').innerHTML = '<span id="clockMain">--:--</span>' + (config.seconds ? '<span id="clockSeconds" class="clock-seconds"></span>' : '');
    put('notes', config.notes || '設定から入力できます'); lastMinute = ''; tick(); showWeather('保存済みの天気');
    if (config.weatherEnabled) { fetchWeather(); weatherTimer = window.setInterval(fetchWeather, 1800000); }
  }
  el('settingsButton').onclick = function () {
    el('lead').value = config.lead; el('dayType').value = config.dayType;
    el('seconds').checked = config.seconds; el('fontSize').value = config.fontSize;
    el('keepAwake').checked = config.keepAwake;
    el('background').value = config.background;
    el('noteInput').value = config.notes; el('weatherEnabled').checked = config.weatherEnabled;
    put('saveStatus', ''); el('settings').style.display = 'block'; window.scrollTo(0, 0);
  };
  el('cancelSettings').onclick = function () { el('settings').style.display = 'none'; };
  el('settingsForm').onsubmit = function () {
    var lead = Number(el('lead').value);
    if (!isFinite(lead) || lead < 0 || lead > 120) { put('saveStatus', '余裕時間は0〜120分で入力してください'); return false; }
    normalise({ lead: lead, dayType: el('dayType').value, seconds: el('seconds').checked, keepAwake: el('keepAwake').checked, fontSize: el('fontSize').value, notes: el('noteInput').value, weatherEnabled: el('weatherEnabled').checked, background: el('background').value });
    var saved = store(KEY, config); apply();
    if (window.AiuCalendar && !window.AiuCalendar.save()) { saved = false; }
    if (window.AiuSwitchBotSave && !window.AiuSwitchBotSave()) { saved = false; }
    if (saved) { el('settings').style.display = 'none'; } else { put('saveStatus', '反映しましたが、このブラウザでは保存できません。再起動すると初期設定に戻ります。'); }
    return false;
  };
  normalise(read(KEY));
  var cached = read(CACHE);
  if (cached && typeof cached.temp === 'number' && typeof cached.code === 'number' && typeof cached.at === 'string') { weatherCache = cached; }
  function page(name) {
    el('homePage').style.display = name === 'home' ? 'block' : 'none'; el('commutePage').style.display = name === 'commute' ? 'block' : 'none'; el('weatherPage').style.display = name === 'weather' ? 'block' : 'none';
  }
  el('goCommute').onclick = el('clockTap').onclick = function () { page('commute'); };
  el('goWeather').onclick = el('homeWeather').onclick = function () { page('weather'); };
  el('commuteHome').onclick = el('weatherHome').onclick = function () { page('home'); };
  el('refreshWeather').onclick = fetchWeather;
  function fit() {
    var width = window.innerWidth || document.documentElement.clientWidth, height = window.innerHeight || document.documentElement.clientHeight, scale = Math.min(width / 1280, height / 800);
    var stage = el('stage'); stage.style.left = Math.round((width - 1280 * scale) / 2) + 'px'; stage.style.top = Math.round((height - 800 * scale) / 2) + 'px'; stage.style.webkitTransform = 'scale(' + scale + ')'; stage.style.transform = 'scale(' + scale + ')';
  }
  window.onresize = fit; fit();
  apply();
}());
