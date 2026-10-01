(() => {
  'use strict';
  const core = window.MoriyaGithubCore, bridge = window.MoriyaSettingsBridge;
  if (!core || !bridge) return;
  const $ = id => document.getElementById(id);
  const storageKey = 'moriyaGithubConnection';
  let connection = null, store = null, busy = false, suppressSave = false, timer = 0, saveTimer = 0, errors = 0, generation = 0, historyPage = 0;
  let stream = null, scanTimer = 0;
  let rerun = false, suppressSchedule = false;
  const scheduleCache = new Map(), cancelMarks = new Map();
  const idKey = 'moriyaGithubDeviceId';
  let deviceId = localStorage.getItem(idKey);
  if (!deviceId) { deviceId = crypto.randomUUID?.() || 'device-' + Date.now() + '-' + Math.random().toString(36).slice(2); localStorage.setItem(idKey, deviceId); }
  const status = text => { $('githubSyncStatus').textContent = text; };
  try { connection = JSON.parse(localStorage.getItem(storageKey) || 'null'); if (connection) { core.config(connection); store = new core.Store(connection); } }
  catch { connection = null; status('保存された接続情報を読み取れません。再設定してください。'); }
  function persist() { localStorage.setItem(storageKey, JSON.stringify(connection)); }
  const scheduleMode = () => Boolean(connection?.enabled && (connection.scope === 'schedules' || connection.schedulesEnabled !== false));
  function loadCancelMarks() {
    cancelMarks.clear();scheduleCache.clear();
    try {for(const item of JSON.parse(localStorage.getItem('moriyaGithubScheduleCancellations:'+connection.repo)||'[]'))
      if(item.at > Date.now()-7*86400000)cancelMarks.set(item.id,item.at);}catch{}
  }
  function saveCancelMarks() {
    for(const [id,at] of cancelMarks)if(at < Date.now()-7*86400000)cancelMarks.delete(id);
    localStorage.setItem('moriyaGithubScheduleCancellations:'+connection.repo,JSON.stringify([...cancelMarks].map(([id,at])=>({id,at}))));
  }
  function fill() {
    if (connection) {
      $('githubSyncRepo').value = connection.repo;
      $('githubSyncToken').value = connection.token;
      $('githubSyncKey').value = connection.key;
      $('githubSyncRole').value = connection.role;
      $('githubSyncScope').value = connection.scope;
      $('githubSyncInterval').value = String(connection.interval);
      $('githubSyncEnabled').checked = connection.enabled;
      $('githubSyncConflictMode').value = connection.conflictMode === 'whole' ? 'whole' : 'partial';
      $('githubSyncSchedules').checked = connection.schedulesEnabled !== false;
      $('githubSyncDeviceName').value = connection.deviceName || '';
    }
    $('githubBackupControls').hidden = !connection;
    fillMode();
  }
  function fingerprint(scope = connection?.scope || 'shared') { return JSON.stringify(bridge.export(scope)); }
  function plan() {
    clearTimeout(timer);
    if (!connection?.enabled || document.hidden) return;
    const seconds = Math.min(600, connection.interval * Math.pow(2, Math.min(errors, 4)));
    timer = setTimeout(() => run().catch(() => {}), seconds * 1000 * (1 + Math.random() * .1));
  }
  function localEdited() { return Boolean(connection?.fingerprint && connection.fingerprint !== fingerprint(connection.appliedScope || connection.scope)); }
  async function lock(task) {
    if (busy) { status('通信中です。少し待って再試行してください。'); return; }
    busy = true;
    const buttons = [...document.querySelectorAll('#githubSyncSettings button, #githubBackupControls button')];
    buttons.forEach(button => { button.disabled = true; });
    try { return await task(); }
    catch (error) { errors++; status(error.message || 'GitHubと通信できませんでした。'); }
    finally {
      busy = false; buttons.forEach(button => { button.disabled = false; }); plan();
      if(rerun && connection?.enabled && !document.hidden){rerun=false;clearTimeout(saveTimer);saveTimer=setTimeout(()=>run(),800);}
    }
  }
  async function applyRemote(remote, force) {
    if (!remote?.data?.parentId || !remote.data.payload) throw new Error('親機の設定データが不正です。');
    if (!force && (!connection.fingerprint || (connection.conflictMode === 'whole' && localEdited()) || $('settingsDialog').open)) {
      status(connection.fingerprint ? '子機の設定変更または設定画面の編集中です。「親機の設定を取得」で反映してください。' : '接続しました。「親機の設定を取得」で初回の設定を反映してください。'); return;
    }
    suppressSave = true;
    try {
      let payload=remote.data.payload, conflicts=[];
      if(!force && connection.conflictMode !== 'whole') {
        const merged=core.mergeSettings(JSON.parse(connection.fingerprint),bridge.export(payload.scope),payload);
        payload=merged.payload;conflicts=merged.conflicts;
      }
      if(JSON.stringify(bridge.export(payload.scope))!==JSON.stringify(payload))await bridge.apply(payload);
      connection.appliedScope = remote.data.payload.scope;
      if(force)connection.fingerprint = fingerprint(connection.appliedScope);
      else {
        const baseline=structuredClone(remote.data.payload),applied=bridge.export(connection.appliedScope);
        // These settings are intentionally device-local, even in all-settings mode.
        for(const key of ['android','debug'])if(applied.settings[key]!==undefined)baseline.settings[key]=applied.settings[key];
        if(baseline.settings.display)baseline.settings.display.profile=applied.settings.display.profile;
        connection.fingerprint=JSON.stringify(baseline);
      }
      connection.sha = remote.sha;
      connection.parentId = remote.data.parentId;
      persist();
      status(conflicts.length ? `親機の設定を更新しました。子機で変更した${conflicts.length}項目だけを保護しています。「親機の設定を取得」で解除できます。` : '親機の設定を反映しました（' + new Date().toLocaleTimeString('ja-JP') + '）。');
    } finally { suppressSave = false; }
  }
  async function sync(forcePull = false, takeover = false) {
    if (!store || !connection) throw new Error('先にGitHub接続を設定してください。');
    if(connection.scope === 'schedules') {status('家電予約のみ同期します。通常設定は変更しません。');return;}
    const currentStore = store, currentGeneration = generation;
    const remote = await currentStore.read('sync');
    if (currentGeneration !== generation) return;
    errors = 0;
    if (connection.role === 'child' && !takeover) {
      if (!remote) { status('親機がまだ設定を送信していません。'); return; }
      if (forcePull || remote.sha !== connection.sha || (connection.conflictMode !== 'whole' && localEdited())) await applyRemote(remote, forcePull);
      else status(localEdited() ? '子機で変更した設定は送信されません。必要なら親機の設定を取得してください。' : '親機と同期済みです（' + new Date().toLocaleTimeString('ja-JP') + '）。');
      return;
    }
    if (remote && remote.data.parentId !== deviceId && !takeover) {
      connection.role = 'child'; connection.fingerprint = null; persist(); fill();
      status('別端末が親機です。この端末を子機に変更しました。取り込むか、明示的に親機を切り替えてください。'); return;
    }
    const payload = bridge.export(connection.scope);
    if (!remote || takeover || JSON.stringify(remote.data.payload) !== JSON.stringify(payload)) {
      const sha = await currentStore.write('sync', { parentId: deviceId, updatedAt: new Date().toISOString(), payload }, remote?.sha);
      connection.sha = sha;
    }
    connection.role = 'parent'; connection.parentId = deviceId; persist(); fill();
    status('親機の設定を送信・確認しました（' + new Date().toLocaleTimeString('ja-JP') + '）。');
  }
  async function syncSchedules() {
    if(!scheduleMode() || !window.MoriyaSmartHome)return;
    const currentStore=store,stamp=generation,listed=await currentStore.listSchedules();
    if(stamp!==generation)return;
    const present=new Set(listed.map(item=>item.ownerId));
    for(const owner of scheduleCache.keys())if(!present.has(owner))scheduleCache.delete(owner);
    for(const item of listed)if(scheduleCache.get(item.ownerId)?.sha!==item.sha) {
      const record=await currentStore.readSchedules(item.ownerId);
      if(stamp!==generation)return;
      if(record)scheduleCache.set(item.ownerId,record);
    }
    const cancelled=new Set(cancelMarks.keys());
    for(const record of scheduleCache.values())for(const mark of record.data.cancelled)if(mark.at>Date.now()-7*86400000)cancelled.add(mark.id);
    suppressSchedule=true;
    try {
      for(const item of window.MoriyaSmartHome.getOwnPending())if(cancelled.has(item.id))window.MoriyaSmartHome.cancelLocalScheduleFromPeer(item.id);
      window.MoriyaSmartHome.clearGithubPeers();
      for(const [owner,record] of scheduleCache)if(owner!==deviceId)
        window.MoriyaSmartHome.receivePeerSchedules(owner,record.data.schedules.filter(item=>!cancelled.has(item.id)),'github',record.data.name);
    }finally{suppressSchedule=false;}
    saveCancelMarks();
    const own=core.scheduleDocument({version:1,ownerId:deviceId,name:connection.deviceName || (connection.role==='parent'?'親端末':'子端末')+' · '+deviceId.slice(0,6),
      schedules:window.MoriyaSmartHome.getOwnPending(),cancelled:[...cancelMarks].map(([id,at])=>({id,at}))},deviceId);
    const old=scheduleCache.get(deviceId);
    if((old || own.schedules.length || own.cancelled.length) && JSON.stringify(old?.data)!==JSON.stringify(own)) {
      const sha=await currentStore.writeSchedules(deviceId,own,old?.sha);
      if(stamp!==generation)return;
      scheduleCache.set(deviceId,{sha,data:own});
    }
    window.MoriyaGithubSync.lastScheduleSync=Date.now();
    window.MoriyaGithubSync.scheduleError='';
    document.dispatchEvent(new Event('moriya-smart-schedule-sync-status'));
  }
  async function syncAll(force=false) {
    // Reservation sharing must remain independent of settings conflicts.
    let settingsError;
    try {await sync(force);}catch(error){settingsError=error;}
    try {await syncSchedules();}catch(error){
      window.MoriyaGithubSync.scheduleError=error.message || '予約を同期できませんでした。';
      document.dispatchEvent(new Event('moriya-smart-schedule-sync-status'));
      throw error;
    }
    if(settingsError)throw settingsError;
  }
  async function run() {
    if (!connection?.enabled || document.hidden || busy) { if(busy)rerun=true;plan(); return; }
    return lock(() => syncAll());
  }
  function configure(value) {
    const previous=connection;
    connection = { ...core.config(value), role: value.role === 'child' ? 'child' : 'parent', scope: ['all','shared','smartHome','schedules'].includes(value.scope) ? value.scope : 'shared', interval: [30,60,120,300].includes(Number(value.interval)) ? Number(value.interval) : 60, enabled: value.enabled !== false,
      conflictMode:value.conflictMode==='whole'?'whole':'partial',schedulesEnabled:value.schedulesEnabled!==false,deviceName:String(value.deviceName||'').slice(0,40) };
    // Changing the interval/name/protection option must not discard the child's merge baseline.
    if(previous?.repo===connection.repo && previous.key===connection.key && previous.scope===connection.scope && previous.role===connection.role)
      for(const key of ['fingerprint','appliedScope','sha','parentId'])if(previous[key]!==undefined)connection[key]=previous[key];
    generation++; store = new core.Store(connection); persist(); fill(); disableLanAuto();
    loadCancelMarks();
    if(!scheduleMode())window.MoriyaSmartHome?.clearGithubPeers?.();
  }
  function disableLanAuto() {
    // Two independent automatic writers would defeat the parent/child rule.
    const lan = document.getElementById('lanSyncMode');
    if (connection && lan?.value === 'auto') {
      lan.value = 'manual';
      lan.dispatchEvent(new Event('change'));
    }
  }
  $('githubSyncConnect').addEventListener('click', () => lock(async () => {
    const candidate = core.config({ repo: $('githubSyncRepo').value.trim(), token: $('githubSyncToken').value.trim(), key: $('githubSyncKey').value.trim() || core.newKey(), role: $('githubSyncRole').value, scope: $('githubSyncScope').value, interval: Number($('githubSyncInterval').value), enabled: $('githubSyncEnabled').checked,
      conflictMode:$('githubSyncConflictMode').value,schedulesEnabled:$('githubSyncSchedules').checked,deviceName:$('githubSyncDeviceName').value });
    const testStore = new core.Store(candidate); await testStore.connect();
    // Validate the key before replacing a working connection.
    await testStore.read('sync');
    configure(candidate);
    status('GitHubに接続しました。');
    if (connection.enabled) await syncAll();
  }));
  $('githubSyncPull').addEventListener('click', () => lock(async () => {
    if (!connection) throw new Error('先に接続してください。');
    if (connection.role === 'parent' || connection.scope === 'schedules') { await syncAll(); return; }
    if (!confirm('親機の同期対象設定で、この端末の設定を置き換えますか？')) return;
    await syncAll(true);
  }));
  $('githubSyncTakeover').addEventListener('click', () => lock(async () => {
    if (!connection) throw new Error('先に接続してください。');
    if(connection.scope==='schedules')throw new Error('家電予約のみ同期では親機の指定は不要です。');
    if (!confirm('この端末を親機にして、この端末の設定を全子機に配信しますか？以前の親機は次の接続確認で子機になります。')) return;
    await sync(false, true);
  }));
  $('githubSyncDisconnect').addEventListener('click', () => {
    if (!confirm('この端末のGitHub接続を解除しますか？GitHub上の暗号化データは残ります。')) return;
    generation++; connection = store = null; clearTimeout(timer); clearTimeout(saveTimer); stopScan(); localStorage.removeItem(storageKey);
    window.MoriyaSmartHome?.clearGithubPeers?.();scheduleCache.clear();cancelMarks.clear();
    ['githubSyncToken','githubSyncKey','githubSyncInviteText'].forEach(id => { $(id).value = ''; });
    $('githubSyncQr').hidden = true; fill(); status('接続を解除しました。');
  });
  $('githubSyncInvite').addEventListener('click', () => lock(async () => {
    if (!connection) throw new Error('先に接続してください。');
    if (!confirm('GitHubトークンと暗号鍵を含む接続コード・QRを画面に表示します。周囲に見られない場所ですか？')) return;
    const text = core.invite(connection); $('githubSyncInviteText').value = text;
    await script('./assets/vendor/qrcode-core.js', () => Boolean(window.MoriyaQr));
    const matrix = window.MoriyaQr.create(text, { errorCorrectionLevel: 'M' }).modules;
    const canvas = $('githubSyncQr'), ctx = canvas.getContext('2d'), size = matrix.size + 8;
    canvas.width = canvas.height = size * 5; ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle = '#000';
    for (let y=0;y<matrix.size;y++) for (let x=0;x<matrix.size;x++) if (matrix.get(y,x)) ctx.fillRect((x+4)*5,(y+4)*5,5,5);
    canvas.hidden = false;
  }));
  $('githubSyncCopy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('githubSyncInviteText').value); status('接続コードをコピーしました。自分の端末だけに渡してください。'); }
    catch { $('githubSyncInviteText').select(); status('接続コードを選択しました。手動でコピーしてください。'); }
  });
  async function join(text) {
    const invitation=core.parseInvite(text);
    const candidate = { ...invitation, role: 'child', scope: ['all','shared','smartHome','schedules'].includes(invitation.scope)?invitation.scope:'shared', enabled: true, conflictMode:'partial',schedulesEnabled:invitation.schedulesEnabled!==false };
    const testStore = new core.Store(candidate); await testStore.connect(); await testStore.read('sync');
    configure(candidate);await syncSchedules();status(candidate.scope==='schedules'?'家電予約のみ共有する端末として接続しました。通常設定は変更しません。':'子機として接続しました。通常設定は「親機の設定を取得」で初回反映してください。');
  }
  $('githubSyncJoin').addEventListener('click', () => lock(() => join($('githubSyncInviteText').value)));
  function stopScan() { clearTimeout(scanTimer); stream?.getTracks().forEach(track => track.stop()); stream = null; $('githubSyncCamera').srcObject = null; $('githubSyncCamera').hidden = true; $('githubSyncStopScan').hidden = true; }
  function script(src, ready) { if (ready()) return Promise.resolve(); return new Promise((resolve,reject) => { const s=document.createElement('script'); s.src=src; s.onload=resolve; s.onerror=()=>reject(new Error('QR機能を読み込めませんでした。')); document.head.append(s); }); }
  $('githubSyncStopScan').addEventListener('click', stopScan);
  $('githubSyncScan').addEventListener('click', async () => {
    try {
      stopScan(); await script('./assets/vendor/jsQR.js', () => typeof window.jsQR === 'function');
      stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});
      const video = $('githubSyncCamera'); video.srcObject = stream; video.hidden = false; $('githubSyncStopScan').hidden=false; await video.play();
      const canvas = document.createElement('canvas'), ctx=canvas.getContext('2d',{willReadFrequently:true});
      const scan = () => {
        if (!stream) return;
        if (video.videoWidth) {
          const scale=Math.min(1,640/video.videoWidth); canvas.width=Math.round(video.videoWidth*scale); canvas.height=Math.round(video.videoHeight*scale);
          ctx.drawImage(video,0,0,canvas.width,canvas.height); const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
          const found=window.jsQR(pixels.data,canvas.width,canvas.height);
          if(found) {stopScan(); $('githubSyncInviteText').value=found.data; void lock(()=>join(found.data)); return;}
        }
        scanTimer=setTimeout(scan,220);
      }; scan();
    } catch { stopScan(); status('カメラを利用できません。HTTPSとカメラ権限を確認するか、接続コードを貼り付けてください。'); }
  });
  async function backupRestore(ref) {
    if (!store) throw new Error('先にGitHubに接続してください。');
    const result = await store.read('backup', ref);
    if (!result?.data?.text) throw new Error('バックアップがありません。');
    if (!confirm('選択した暗号化バックアップから設定を復元しますか？現在の設定を置き換えて再読み込みします。背景動画とGitHub接続情報は変更しません。親機の場合は、復元後の設定が子機に配信されます。')) return;
    suppressSave=true;
    try { await bridge.restore(result.data.text); }
    finally { suppressSave=false; }
  }
  $('githubBackupUpload').addEventListener('click', () => lock(async () => {
    if (!store) throw new Error('先にGitHubに接続してください。');
    if (!confirm('選択した範囲の設定を暗号化し、GitHubの最新バックアップとして保存しますか？過去の履歴は残ります。')) return;
    const scope=$('settingsBackupScope').value, text=await bridge.backup(scope), previous=await store.read('backup');
    await store.write('backup',{text,createdAt:new Date().toISOString(),scope},previous?.sha);
    status('暗号化バックアップを保存しました。最新は1件、旧版は履歴から復元できます。');
  }));
  $('githubBackupRestore').addEventListener('click', () => lock(() => backupRestore()));
  async function history(reset) {
    if (!store) throw new Error('先にGitHubに接続してください。');
    if(reset) {historyPage=0;$('githubBackupVersions').replaceChildren();}
    const rows=await store.history(historyPage+1);historyPage++;
    for(const row of rows) {const option=document.createElement('option');option.value=row.sha;option.textContent=new Date(row.date).toLocaleString('ja-JP')+' / '+row.sha.slice(0,7);$('githubBackupVersions').append(option);}
    $('githubBackupOlder').hidden=rows.length<20;status('バックアップ履歴を取得しました。');
  }
  $('githubBackupHistory').addEventListener('click', () => lock(() => history(true)));
  $('githubBackupOlder').addEventListener('click', () => lock(() => history(false)));
  $('githubBackupRestoreVersion').addEventListener('click', () => lock(async () => {const ref=$('githubBackupVersions').value;if(!ref)throw new Error('先に履歴を表示して選んでください。');await backupRestore(ref);}));
  document.addEventListener('moriya-settings-saved', () => {
    if(suppressSave||!connection?.enabled)return;
    if(connection.scope==='schedules')return;
    if(connection.role==='child'){status('子機の変更は親機へ送信されません。変更した項目を保護し、他の項目は同期します。');}
    clearTimeout(saveTimer);saveTimer=setTimeout(()=>run(),800);
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(timer);clearTimeout(saveTimer);stopScan();}else void run();});
  window.addEventListener('online',()=>void run());
  window.MoriyaGithubSync={deviceId,lastScheduleSync:0,scheduleError:'',enabled:scheduleMode,refresh:run,
    cancelSchedule:(id)=>{
      if(!scheduleMode())return false;
      cancelMarks.set(id,Date.now());saveCancelMarks();
      for(const [owner,record] of scheduleCache)if(owner!==deviceId)window.MoriyaSmartHome?.removePeerSchedule?.(owner,id);
      clearTimeout(saveTimer);saveTimer=setTimeout(()=>run(),800);
      return true;
    }};
  document.addEventListener('moriya-smart-schedules-change',event=>{
    if(suppressSchedule || !scheduleMode() || !['create','cancel','complete','clear'].includes(event.detail?.kind))return;
    clearTimeout(saveTimer);saveTimer=setTimeout(()=>run(),800);
  });
  $('githubSyncScope').addEventListener('change',()=>fillMode());
  function fillMode(){
    const only=$('githubSyncScope').value==='schedules';
    $('githubSyncSchedules').disabled=only;if(only)$('githubSyncSchedules').checked=true;
    $('githubSyncRole').disabled=only;$('githubSyncConflictMode').disabled=only;
    $('githubSyncPull').textContent=only?'予約を同期':'親機の設定を取得';$('githubSyncTakeover').hidden=only;
  }
  document.addEventListener('moriya-settings-visibility',()=>{if(!$('settingsDialog').open){$('githubSyncInviteText').value='';$('githubSyncQr').hidden=true;stopScan();}});
  fill();
  if(connection) {loadCancelMarks();disableLanAuto();status('GitHub接続設定を読み込みました。');setTimeout(()=>run(),1500);}
})();
