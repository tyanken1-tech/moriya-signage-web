(() => {
  'use strict';
  let worker, selected = [], saved = false, booting = true;
  const status = () => {
    const element = document.querySelector('#offlineStatus');
    if (element) element.textContent = saved ? 'オフライン保存済み：通信できなくても時刻表・ごみ予定・選択中の背景を使えます。' : booting ? 'オフライン用データを保存しています…' : 'オフライン保存を完了できませんでした。通信できるときに開き直してください。';
    document.querySelector('#backgroundChoices')?.toggleAttribute('inert', !navigator.onLine);
    const input = document.querySelector('#customBackground'); if (input) input.disabled = !navigator.onLine;
    const notice = document.querySelector('#photoOfflineNotice'); if (notice) notice.hidden = navigator.onLine;
  };
  async function save() {
    if (!worker) return;
    booting = true; saved = false; status();
    try {
      const ready = await new Promise(resolve => {
        const channel = new MessageChannel(), timer = setTimeout(() => {channel.port1.close(); resolve(false);}, 25000);
        channel.port1.onmessage = event => {clearTimeout(timer); channel.port1.close(); resolve(event.data?.ready === true);};
        worker.postMessage({type:'SAVE_PHOTOS',urls:selected},[channel.port2]);
      });
      saved = ready;
    } finally {booting = false; status();}
  }
  window.MORIYA_OFFLINE = { selectPhotos(urls) {
    const next = urls.filter(url => !url.startsWith('data:'));
    if (JSON.stringify(next) === JSON.stringify(selected)) return;
    selected = next; save();
  }};
  async function boot() {
    if (!('serviceWorker' in navigator)) {booting = false; status(); return;}
    try {
      let registration = await navigator.serviceWorker.getRegistration('./');
      if (registration?.scope !== new URL('./', location.href).href) registration = null;
      try {registration = await navigator.serviceWorker.register('./offline-sw.js', {scope:'./',updateViaCache:'none'});}
      catch (error) {if (!registration?.active) throw error;}
      if (!registration.active) await new Promise((resolve, reject) => {
        const candidate = registration.installing || registration.waiting;
        if (!candidate) return reject(new Error('No offline worker'));
        const timer = setTimeout(() => reject(new Error('Offline installation timed out')), 25000);
        const check = () => {if (candidate.state === 'activated') {clearTimeout(timer); resolve();} else if (candidate.state === 'redundant') {clearTimeout(timer); reject(new Error('Offline installation failed'));}};
        candidate.addEventListener('statechange', check); check();
      });
      worker = registration.active;
      await save();
      // Recover on later visits too; a temporarily unavailable server does not
      // remove the already installed worker or its complete offline snapshot.
      if (navigator.onLine) registration.update().catch(() => {});
    } catch {booting = false; status();}
  }
  window.addEventListener('online', () => {status(); save(); navigator.serviceWorker?.getRegistration('./').then(reg => reg?.update()).catch(() => {});});
  window.addEventListener('offline', status);
  navigator.serviceWorker?.addEventListener('controllerchange', async () => {worker = (await navigator.serviceWorker.getRegistration('./'))?.active; save();});
  boot();
})();
