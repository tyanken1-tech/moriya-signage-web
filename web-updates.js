(() => {
  'use strict';
  const native = window.Capacitor?.isNativePlatform?.();
  const plugin = window.Capacitor?.Plugins?.MoriyaSignage;
  const localPreview = !native && ['127.0.0.1','localhost','[::1]'].includes(location.hostname);
  const interval = 15 * 60 * 1000;
  let busy = false, lastCheck = 0, registration, reloading = false;
  function notice(text, action) {
    let box = document.getElementById('webUpdateNotice');
    if (!box) {
      box = document.createElement('div'); box.id = 'webUpdateNotice'; box.setAttribute('role','status');
      Object.assign(box.style,{position:'fixed',bottom:'max(12px, env(safe-area-inset-bottom))',left:'50%',transform:'translateX(-50%)',zIndex:'10000',maxWidth:'90vw',padding:'10px 16px',borderRadius:'12px',background:'rgba(18,30,38,.92)',color:'#fff',fontSize:'14px',boxShadow:'0 4px 24px #0005',display:'flex',gap:'12px',alignItems:'center'});
      document.body.append(box);
    }
    box.replaceChildren(document.createTextNode(text));
    if (action) { const button = document.createElement('button'); button.type='button'; button.textContent='更新を適用'; button.addEventListener('click',action); box.append(button); }
  }
  const editing = () => [...document.querySelectorAll('[role="dialog"], .settings-dialog')].some(node => !node.hidden && getComputedStyle(node).display !== 'none');
  async function applyNative() {
    if (editing()) { notice('設定画面を閉じてから更新を適用してください。', applyNative); return; }
    if (!confirm('保存した新版へ切り替えます。画面が再起動します。家電の操作中は、操作を終えてから適用してください。')) return;
    await plugin.activateWebUpdate();
  }
  function pendingWeb() {
    if (registration?.waiting) notice('新版を保存しました。次回起動時、または今すぐ適用できます。', () => {
      if (editing()) { notice('設定画面を閉じてから更新を適用してください。', pendingWeb); return; }
      registration.waiting?.postMessage({type:'SKIP_WAITING'});
    });
  }
  async function check(force = false) {
    if (busy || document.hidden || !navigator.onLine || (!force && Date.now()-lastCheck < interval)) return;
    busy = true; lastCheck = Date.now();
    try {
      if (native && plugin?.stageWebUpdate) {
        const state = await plugin.stageWebUpdate();
        if (state.requiresApk) notice(`バージョン${state.latestVersion}はAPK本体の更新が必要です。設定の「アプリ更新」からダウンロードできます。`);
        else if (state.pendingVersion) notice(`新版${state.pendingVersion}を保存しました。次回起動時に適用します。`, applyNative);
      } else await registration?.update();
    } catch (error) {
      // Failed checks never replace the last working offline copy.
      if (force) notice('更新を確認できませんでした。保存済みの版で継続します。');
      console.warn('Web update unavailable:',error?.message);
    } finally { busy=false; }
  }
  async function boot() {
    if (localPreview) {
      // A working-tree preview must not be pinned to the last release snapshot.
      // Unregister only this app's workers, leaving localStorage/settings intact.
      const scope = new URL('./',location.href).href;
      const registrations = await navigator.serviceWorker?.getRegistrations?.() || [];
      for (const reg of registrations) {
        if (reg.scope === scope || reg.scope === new URL('iphone/',scope).href) await reg.unregister();
      }
      if (navigator.serviceWorker?.controller && !reloading) { reloading=true; location.reload(); }
      return;
    }
    const host = document.getElementById('appUpdateStatus');
    if (host) {
      const button=document.createElement('button'); button.type='button'; button.textContent='Web部分の更新を確認';
      button.addEventListener('click',()=>check(true)); host.after(button);
    }
    if (native) {
      // The APK's verified local bundle owns offline storage. Old PWA workers
      // must not shadow it; unregister without deleting user settings.
      const registrations = await navigator.serviceWorker?.getRegistrations?.() || [];
      const ours = registrations.filter(reg => reg.scope === new URL('./',location.href).href);
      for (const reg of ours) await reg.unregister();
      if (ours.length && navigator.serviceWorker.controller) { location.reload(); return; }
      if (!plugin?.getWebUpdateState) return;
      const state = await plugin.getWebUpdateState();
      const label = document.getElementById('appCurrentVersion');
      if (label) label.textContent=`${state.version}（APK ${state.nativeVersion}）`;
      // Do not declare a broken page healthy: startup has a native watchdog.
      if (window.MoriyaAppInitialized && window.MoriyaNewUi) await plugin.webUpdateReady();
      if (state.pendingVersion) notice(`新版${state.pendingVersion}を保存済みです。`,applyNative);
      await check();
    } else if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      registration = await navigator.serviceWorker.register('./service-worker.js',{updateViaCache:'none'});
      // A fully installed waiting snapshot from an earlier visit is safe to
      // apply on this fresh startup, before a user edits settings.
      if (registration.waiting && !editing()) registration.waiting.postMessage({type:'SKIP_WAITING'});
      registration.addEventListener('updatefound', () => registration.installing?.addEventListener('statechange',pendingWeb));
      pendingWeb();
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!reloading) { reloading=true; location.reload(); }
      });
      await check();
    }
  }
  window.MoriyaWebUpdates = {check:() => check(true)};
  window.addEventListener('online', () => check(true));
  document.addEventListener('visibilitychange', () => check());
  setInterval(check, interval);
  if (document.readyState === 'complete') boot().catch(console.warn);
  else window.addEventListener('load', () => boot().catch(console.warn), {once:true});
})();
