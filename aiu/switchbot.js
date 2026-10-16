/* ES5; SwitchBot only. No polling, WebCrypto, Promise or peer connections. */
(function () {
  'use strict';
  var KEY = 'moriya-aiu-switchbot-v1', saved = {}, busy = false, sequence = 0, pending = null;
  var token = '', secret = '', devices = [], selected = [];
  function el(id) { return document.getElementById(id); }
  function message(id, text) { el(id).textContent = text; }
  function clean(value) { return String(value || '').replace(/^Bearer\s+/i, '').replace(/\s/g, '').substring(0, 512); }
  function contains(list, value) { var i; for (i = 0; i < list.length; i++) { if (list[i] === value) { return true; } } return false; }
  function persist() {
    try { window.localStorage.setItem(KEY, JSON.stringify({ token: token, secret: secret, devices: devices, selected: selected })); return true; }
    catch (e) { return false; }
  }
  function tidy(list) {
    var result = [], i, item;
    if (Object.prototype.toString.call(list) !== '[object Array]') { return result; }
    for (i = 0; i < list.length && result.length < 100; i++) {
      item = list[i];
      if (item && typeof item.externalId === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(item.externalId)) {
        result.push({ externalId: item.externalId, name: String(item.name || 'SwitchBot').substring(0, 120), deviceType: String(item.deviceType || ''), cloudEnabled: item.cloudEnabled !== false });
      }
    }
    return result;
  }
  function commands(device) {
    var type = device.deviceType.toLowerCase(), result;
    if (type === 'bot') { return [['press', '押す'], ['on', 'オン'], ['off', 'オフ']]; }
    if (!/plug|bulb|light|lamp|tv|fan|humidifier|purifier|speaker|others/.test(type)) { return []; }
    result = [['on', 'オン'], ['off', 'オフ']];
    if (/bulb|ceiling light|strip light/.test(type)) { result.push(['brightness', '明るさ（1〜100）']); }
    if (/color bulb|ceiling light/.test(type)) { result.push(['colorTemperature', '色温度（2700〜6500）']); }
    if (/color bulb|strip light/.test(type)) { result.push(['color', '色（R:G:B）']); }
    return result;
  }
  function validate(command, value) {
    var number = Number(value), rgb, i;
    if (command === 'brightness' || command === 'colorTemperature') {
      if (!/^\d+$/.test(value) || !isFinite(number) || (command === 'brightness' ? number < 1 || number > 100 : number < 2700 || number > 6500)) { return null; }
      return number;
    }
    if (command === 'color') {
      if (!/^\d{1,3}:\d{1,3}:\d{1,3}$/.test(value)) { return null; }
      rgb = value.split(':'); for (i = 0; i < 3; i++) { if (Number(rgb[i]) > 255) { return null; } } return value;
    }
    return 'default';
  }
  function request(operation, action, done) {
    if (busy) { done('別の操作を送信中です'); return; }
    if (token.length < 20 || secret.length < 8) { done('設定にTokenとSecret Keyを登録してください'); return; }
    if (window.location.protocol === 'file:') { done('SwitchBot操作はAndroid版、または同梱サーバーのWeb版で利用できます'); return; }
    busy = true;
    var finished = false, timeout, xhr, id = ++sequence;
    function finish(error, result) {
      if (finished) { return; } finished = true; busy = false; pending = null; window.clearTimeout(timeout);
      done(error, result);
    }
    var payload = { id: id, operation: operation, token: token, secret: secret, action: action || {} };
    timeout = window.setTimeout(function () {
      finish(operation === 'send' ? '応答がありません。送信済みの可能性があります。実際の家電を確認してください' : '機器取得がタイムアウトしました');
      if (xhr) { xhr.abort(); }
    }, 25000);
    if (window.location.hostname === 'aiu.local') {
      pending = { id: id, finish: finish };
      try {
        if (window.prompt('AIU_SWITCHBOT', JSON.stringify(payload)) !== 'accepted') { finish('SwitchBot接続を開始できません'); }
      } catch (e) { finish('SwitchBot接続を開始できません'); }
      return;
    }
    xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4 || finished) { return; }
      try {
        var data = JSON.parse(xhr.responseText);
        if (xhr.status !== 200) { finish(data.message || 'SwitchBotへ接続できません'); } else { finish(null, data); }
      } catch (e) { finish('SwitchBotへ接続できません。同梱サーバーでWeb版を開いてください'); }
    };
    try {
      xhr.open('POST', '/api/switchbot/' + (operation === 'discover' ? 'discover' : 'send'), true);
      xhr.setRequestHeader('Content-Type', 'application/json'); xhr.send(JSON.stringify(payload));
    } catch (e) { finish('SwitchBotへ接続できません'); }
  }
  window.AiuSwitchBotResult = function (id, result) {
    if (!pending || pending.id !== id) { return; }
    pending.finish(result.error || null, result);
  };
  function empty(node) { while (node.firstChild) { node.removeChild(node.firstChild); } }
  function renderDevices() {
    var parent = el('switchBotDevices'); empty(parent);
    if (!devices.length) { parent.textContent = '機器は未取得です'; return; }
    parent.textContent = '';
    var i;
    for (i = 0; i < devices.length; i++) {
      (function (device) {
        var row = document.createElement('p'), label = document.createElement('label'), check = document.createElement('input'), name = document.createElement('span');
        check.type = 'checkbox'; check.checked = contains(selected, device.externalId);
        check.disabled = !device.cloudEnabled || commands(device).length === 0;
        name.textContent = ' ' + device.name + ' / ' + device.deviceType + (check.disabled ? '（この版では操作不可）' : '');
        check.onchange = function () {
          var next = [], j;
          for (j = 0; j < selected.length; j++) { if (selected[j] !== device.externalId) { next.push(selected[j]); } }
          if (check.checked) {
            if (next.length >= 4) { check.checked = false; message('switchBotSetupStatus', '選択は最大4台です'); return; }
            next.push(device.externalId);
          }
          selected = next;
          message('switchBotSetupStatus', persist() ? '操作する機器を保存しました' : 'この場では反映しましたが、端末への保存はできません');
        };
        label.appendChild(check); label.appendChild(name); row.appendChild(label); parent.appendChild(row);
      }(devices[i]));
    }
  }
  function send(device, command, value) {
    var checked = validate(command, value);
    if (checked === null) { message('switchBotControlStatus', '数値の範囲、または色の形式（0〜255のR:G:B）を確認してください'); return; }
    if (busy) { message('switchBotControlStatus', '別の操作を送信中です'); return; }
    message('switchBotControlStatus', device.name + '：送信中');
    request('send', { externalId: device.externalId, command: command, value: checked }, function (error) {
      message('switchBotControlStatus', error || device.name + '：送信を受け付けました（動作完了・現在状態は未確認）');
    });
  }
  function renderControls() {
    var parent = el('switchBotControls'), count = 0, i; empty(parent); parent.textContent = '';
    for (i = 0; i < devices.length && count < 4; i++) {
      if (!contains(selected, devices[i].externalId) || !devices[i].cloudEnabled) { continue; }
      var allowed = commands(devices[i]); if (!allowed.length) { continue; } count++;
      (function (device, list) {
        var row = document.createElement('div'), name = document.createElement('div'), select = document.createElement('select'), input = document.createElement('input'), run = document.createElement('button'), j, extra = false;
        row.className = 'switchbot-device'; name.className = 'switchbot-name'; name.textContent = device.name; row.appendChild(name);
        for (j = 0; j < list.length; j++) {
          (function (item) {
            if (item[0] === 'on' || item[0] === 'off' || item[0] === 'press') {
              var button = document.createElement('button'); button.type = 'button'; button.textContent = item[1]; button.onclick = function () { send(device, item[0], 'default'); }; row.appendChild(button);
            } else { var option = document.createElement('option'); option.value = item[0]; option.textContent = item[1]; select.appendChild(option); extra = true; }
          }(list[j]));
        }
        if (extra) {
          var advanced = document.createElement('p'); input.type = 'text'; input.value = '50'; input.maxLength = 16;
          select.onchange = function () { input.value = select.value === 'color' ? '255:255:255' : select.value === 'colorTemperature' ? '4000' : '50'; };
          run.type = 'button'; run.textContent = '実行'; run.onclick = function () { send(device, select.value, input.value); };
          advanced.appendChild(select); advanced.appendChild(input); advanced.appendChild(run); row.appendChild(advanced);
        }
        parent.appendChild(row);
      }(devices[i], allowed));
    }
    if (!count) { parent.textContent = '設定のSwitchBot欄で認証情報を登録し、操作する機器を選択してください。'; }
  }
  el('switchBotDiscover').onclick = function () {
    if (busy) { message('switchBotSetupStatus', '別の操作を送信中です'); return; }
    var nextToken = clean(el('switchBotToken').value), nextSecret = clean(el('switchBotSecret').value);
    if (nextToken.length < 20 || nextSecret.length < 8) { message('switchBotSetupStatus', 'TokenとSecret Keyを確認してください'); return; }
    if (nextToken !== token || nextSecret !== secret) { devices = []; selected = []; }
    token = nextToken; secret = nextSecret; var stored = persist(); renderDevices();
    message('switchBotSetupStatus', '機器を取得中');
    request('discover', null, function (error, result) {
      if (error) { message('switchBotSetupStatus', error + (stored ? '' : ' / 端末への保存不可')); return; }
      devices = tidy(result.devices); var next = [], i, j;
      for (i = 0; i < selected.length; i++) { for (j = 0; j < devices.length; j++) { if (selected[i] === devices[j].externalId && devices[j].cloudEnabled && commands(devices[j]).length) { next.push(selected[i]); break; } } }
      selected = next; stored = persist(); renderDevices();
      message('switchBotSetupStatus', devices.length + '台を取得しました。操作する機器を選択してください' + (stored ? '' : ' / 端末への保存不可'));
    });
  };
  el('switchBotForget').onclick = function () {
    if (busy) { message('switchBotSetupStatus', '送信が終了してから解除してください'); return; }
    token = ''; secret = ''; devices = []; selected = []; el('switchBotToken').value = ''; el('switchBotSecret').value = '';
    message('switchBotSetupStatus', persist() ? '登録を解除しました' : '端末の保存領域を更新できません'); renderDevices();
  };
  el('switchBotOpen').onclick = function () { renderControls(); message('switchBotControlStatus', ''); el('switchBotPanel').style.display = 'block'; window.scrollTo(0, 0); };
  el('switchBotClose').onclick = function () { el('switchBotPanel').style.display = 'none'; };
  window.AiuSwitchBotSave = function () {
    if (busy) { return true; }
    var nextToken = clean(el('switchBotToken').value), nextSecret = clean(el('switchBotSecret').value);
    if (nextToken !== token || nextSecret !== secret) { devices = []; selected = []; }
    token = nextToken; secret = nextSecret; renderDevices(); return persist();
  };
  try { saved = JSON.parse(window.localStorage.getItem(KEY)) || {}; } catch (e) {}
  token = clean(saved.token); secret = clean(saved.secret); devices = tidy(saved.devices);
  if (Object.prototype.toString.call(saved.selected) === '[object Array]') { selected = saved.selected.slice(0, 4); }
  el('switchBotToken').value = token; el('switchBotSecret').value = secret; renderDevices();
}());
