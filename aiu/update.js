(function () {
  'use strict';
  if (window.location.hostname !== 'aiu.local') { return; }
  var controls = document.getElementById('apkUpdateControls');
  var status = document.getElementById('aiuUpdateStatus');
  controls.style.display = 'block';
  window.AiuUpdateResult = function (message) { status.textContent = message; };
  document.getElementById('checkAiuUpdate').onclick = function () {
    status.textContent = '画面データを確認中';
    try { if (window.prompt('AIU_UPDATE', '') !== 'accepted') status.textContent = '更新を開始できません'; }
    catch (e) { status.textContent = '更新を開始できません'; }
  };
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      try { status.textContent = JSON.parse(xhr.responseText).message; } catch (e) {}
    }
  };
  xhr.open('GET', 'http://aiu.local/update-status.json', true);
  xhr.send(null);
}());
