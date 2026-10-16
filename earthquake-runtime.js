(() => {
  "use strict";
  const C = window.MoriyaEarthquakeCore;
  const icon = (name) => {
    const paths = { home: '<path d="m5 15 11-9 11 9M9 13v13h14V13M14 26v-8h4v8"/>',
      wave: '<path d="M2 17h6l3-8 5 16 5-18 4 10h5"/>',
      tune: '<path d="M5 9h22M5 23h22M11 5v8M21 19v8"/>',
      expand: '<path d="M5 12V5h7M20 5h7v7M27 20v7h-7M12 27H5v-7"/>',
      down: '<path d="m9 12 7 8 7-8"/>',
      play: '<path d="m12 7 14 9-14 9Z"/>' };
    return `<svg viewBox="0 0 32 32" aria-hidden="true">${paths[name] || paths.wave}</svg>`;
  };
  const escape = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const scaleOptions = (min = 10) => C.SCALES.filter((s) => s >= min).map((s) => `<option value="${s}">震度${C.label(s)}以上</option>`).join("");
  const fmt = (t, date = false) => Number.isFinite(t) ? new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", ...(date ? { month: "numeric", day: "numeric" } : {}), hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(t) : "不明";
  const color = (s) => s >= 55 ? "#f79aa2" : s >= 45 ? "#ffc58b" : s >= 40 ? "#f8df91" : s >= 20 ? "#a6dcb4" : "#a6dbe9";
  const WIDTH = 828, HEIGHT = 650;
  const project = (lon, lat) => [lon * Math.PI / 180 * 6371, -Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) * 6371];
  const rectFor = (points, padding = .15) => {
    const xs = points.map((p) => p[0]), ys = points.map((p) => p[1]);
    const w = Math.max(400, Math.max(...xs) - Math.min(...xs)) * (1 + padding * 2);
    const h = Math.max(400, Math.max(...ys) - Math.min(...ys)) * (1 + padding * 2);
    const k = Math.min(WIDTH / w, HEIGHT / h);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    return { k, x: WIDTH / 2 - cx * k, y: HEIGHT / 2 - cy * k };
  };
  async function mount(saved, save, allowed = () => true) {
    const ui = window.MoriyaNewUi;
    if (!ui) throw new Error("ニューモードを読み込めませんでした");
    const loaded = await Promise.all(["./data/earthquake-regions.json", "./data/earthquake-regions.geojson"].map(async (url) => {
      const r = await fetch(url); if (!r.ok) throw new Error("地図データを読み込めませんでした"); return r.json();
    }));
    if (!allowed()) return null;
    const [catalog, geo] = loaded;
    let config = C.options(saved);
    if (!catalog.areas.some((a) => a.code === config.area && a.pref === config.pref)) {
      const initial = catalog.areas.find((a) => a.pref === config.pref) || catalog.areas.find((a) => a.code === "301");
      config.pref = initial.pref; config.area = initial.code;
    }
    save(config);
    const life = new AbortController();
    const listeners = { signal: life.signal };
    const page = document.createElement("section");
    page.className = "new-page eq-page";
    page.dataset.page = "earthquake";
    page.setAttribute("aria-label", "地震情報 ベータ");
    page.setAttribute("aria-hidden", "true");
    page.innerHTML = `
      <button class="new-pin-button" data-pin-view type="button" aria-label="この画面を固定" aria-pressed="false"><span class="material-symbols-outlined" aria-hidden="true">push_pin</span></button>
      <button type="button" class="new-home-button" id="eqHome" aria-label="ホームへ戻る"><span class="material-symbols-outlined" aria-hidden="true">home</span></button>
      <span class="eq-connection" id="eqConnection" role="status">接続中</span>
      <div class="eq-layout"><section class="eq-map-panel new-rect-panel" aria-label="日本全国の地震地図">
        <div class="eq-map-heading"><span id="eqMapCaption">日本全国</span><button type="button" id="eqFit">${icon("expand")}全国表示</button></div>
        <svg id="eqMap" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="気象庁の地理データによる日本地図"><defs><radialGradient id="eqOcean"><stop stop-color="#77bec0" stop-opacity=".10"/><stop offset="1" stop-color="#77bec0" stop-opacity="0"/></radialGradient></defs><rect width="828" height="650" fill="url(#eqOcean)"/><g id="eqGeography"></g><g id="eqWaves"></g><g id="eqMarkers"></g></svg>
        <div class="eq-map-zoom"><button type="button" id="eqZoomIn" aria-label="地図を拡大">＋</button><button type="button" id="eqZoomOut" aria-label="地図を縮小">−</button></div>
        <div class="eq-arrival" id="eqArrival" hidden><span>S波の到着目安</span><strong id="eqArrivalSeconds"></strong><small id="eqArrivalRegion"></small></div>
        <section class="eq-observations eq-scroll" id="eqObservations" aria-label="過去の地震の各地の観測震度" hidden><div class="eq-observations-head"><div><span>各地の観測震度</span><h3 id="eqObservationsName"></h3></div><button type="button" id="eqObservationsClose" aria-label="各地の震度を閉じる"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6 18 18M18 6 6 18"/></svg></button></div><p id="eqObservationsSummary"></p><div class="eq-observations-list" id="eqObservationsList"></div></section>
        <div class="eq-intensity-legend" aria-label="地域の震度の色分け"><span>震度</span>${[[10,'0–1'],[20,'2–3'],[40,'4'],[45,'5弱・5強'],[55,'6弱–7']].map(([scale,label]) => `<span><i style="background:${color(scale)}"></i>${label}</span>`).join('')}</div>
        <div class="eq-legend"><span><i class="eq-dot eq-p"></i>P波（推定）</span><span><i class="eq-dot eq-s"></i>S波（推定）</span><span><i class="eq-dot eq-region"></i>設定地域</span><span id="eqWaveAge"></span></div>
      </section><aside class="eq-sidebar">
        <section class="eq-current new-rect-panel" aria-live="polite"><div class="eq-status-line"><span id="eqState">受信待機</span><span id="eqTestLabel" hidden>訓練／テスト</span></div><h3 id="eqName">地震情報を待っています</h3>
          <div class="eq-intensity"><div><span id="eqIntensityCaption">設定地域の予想震度</span><strong id="eqLocalIntensity">—</strong><small id="eqLocalName"></small></div><div class="eq-max"><span id="eqMaxCaption">最大予想震度</span><strong id="eqMaxIntensity">—</strong></div></div>
          <dl class="eq-facts"><div><dt>発生</dt><dd id="eqOrigin">—</dd></div><div><dt>規模 / 深さ</dt><dd id="eqMagnitude">—</dd></div><div><dt>更新</dt><dd id="eqUpdate">—</dd></div></dl><p id="eqMessage">速報を受信すると震源と波の広がりを表示します。</p>
          <div class="eq-event-tabs eq-scroll" id="eqEventTabs" aria-label="同時に発生している地震"></div><button type="button" id="eqLive" hidden>現在の情報へ戻る</button>
        </section>
        <section class="eq-history new-rect-panel"><div class="eq-history-heading"><h3>過去の地震</h3><select id="eqHistoryMin" aria-label="履歴の最大観測震度の下限">${scaleOptions(0)}</select></div><p id="eqHistoryStatus" role="status">履歴を取得中…</p><div class="eq-history-list eq-scroll" id="eqHistoryList"></div></section>
      </aside></div>`;
    document.querySelector("#newPageStage").append(page);
    const $ = (id) => page.querySelector(`#${id}`);
    const controls = document.querySelector("#earthquakeBetaControls");
    controls.classList.add("eq-controls");
    controls.innerHTML = `<div class="settings-grid">
      <label><span>都道府県</span><select id="eqPref">${catalog.prefs.map((p) => `<option>${escape(p)}</option>`).join("")}</select></label>
      <label><span>地震の予報区（細分区域）</span><select id="eqArea"></select></label>
      <label class="checkbox-row"><input type="checkbox" id="eqThresholdEnabled"><span>地域の予想震度で自動表示</span></label><label><span>自動表示する予想震度</span><select id="eqThreshold">${scaleOptions()}</select></label>
      <label class="checkbox-row"><input type="checkbox" id="eqWarningEnabled"><span>設定地域が緊急地震速報の警報対象なら自動表示</span></label>
      <label class="checkbox-row"><input type="checkbox" id="eqNationwide"><span>全国どこかに緊急地震速報の警報が出たら自動表示</span></label>
      <label><span>お知らせ音</span><select id="eqSound"><option value="off">鳴らさない</option><option value="soft">穏やかな通知音</option><option value="chime">速報用チャイム（控えめ）</option><option value="eewFirst">指定の地震速報音（1回・約3秒）</option></select></label><button type="button" id="eqSoundTest">音を試す</button></div>
      <p class="dialog-note">いずれかの条件を満たすとアプリ内の地震画面へ移動します。予想震度は配信に含まれる場合のみ判定します。終了後60秒で元の画面に戻ります。手動でホームへ戻った地震の続報では再び自動表示しません。設定・履歴はこの端末に保存します。</p>
      <p class="dialog-note">無料・認証不要の非公式配信を利用します。公式の緊急地震速報の代わりにはなりません。地域の目印は予報区の代表位置です。P波6km/s・S波3.5km/sの概算で描画します。音は端末・ブラウザの制限により操作後に有効になります。</p>
      <details id="eqDebug"><summary>デバッグ・テスト地震</summary><div class="settings-grid">
      <label><span>テストする都道府県</span><select id="eqDebugPref">${catalog.prefs.map((p) => `<option>${escape(p)}</option>`).join("")}</select></label><label><span>テストする予報区</span><select id="eqDebugArea"></select></label>
      <label><span>予想震度</span><select id="eqDebugScale">${C.SCALES.filter((s) => s >= 0).map((s) => `<option value="${s}">震度${C.label(s)}</option>`).join("")}</select></label><label><span>発生日時（日本時間）</span><input id="eqDebugTime" type="datetime-local" step="1"></label>
      <label><span>深さ（km）</span><input id="eqDebugDepth" type="number" min="0" max="700" value="30"></label><label><span>マグニチュード</span><input id="eqDebugMagnitude" type="number" min="0" max="10" step="0.1" value="6.2"></label>
      <label><span>震源の緯度</span><input id="eqDebugLat" type="number" min="20" max="50" step="0.0001"></label><label><span>震源の経度</span><input id="eqDebugLon" type="number" min="120" max="160" step="0.0001"></label>
      <label class="checkbox-row"><input id="eqDebugWarning" type="checkbox" checked><span>緊急地震速報の警報を含む</span></label></div>
      <div class="button-row"><button type="button" id="eqDebugNow">今すぐテスト</button><button type="button" id="eqDebugSchedule">指定時刻にテスト</button><button type="button" id="eqDebugFinal">最終報を送る</button><button type="button" id="eqDebugCancel">取消報を送る</button><button type="button" id="eqDebugStop">テストを終了</button></div><p id="eqDebugStatus" class="dialog-note" role="status">実際の地震とは別の訓練表示です。テストは90秒で最終報、ベータをオフにすると予約も終了します。</p></details>`;
    const earthquakeDebug = controls.querySelector('#eqDebug');
    const field = (id) => controls.querySelector(`#${id}`) || earthquakeDebug.querySelector(`#${id}`);
    let destroyed = false, foreground = !document.hidden, events = new Map(), history = [], selected = null;
    let scheduled = null, test = null, latestLive = null, auto = null, pendingAuto = null, pendingReturn = null;
    let sockets = [], reconnectTimers = [], historyTimer = 0, networkGeneration = 0, request = null;
    let audio = null, soundUnavailable = false;
    let alertBuffer = null, alertLoading = null, alertSource = null, alertSequence = 0;
    const dismissed = new Set(), triggered = new Set(), connection = new Map();
    let raf = 0, mapTarget = null, mapView = null, lastMapKey = "", zoomManual = false, nationalMode = true;
    let detailsOpen = false, detailsKey = "", mapShift = 0;
    const region = () => catalog.areas.find((a) => a.code === config.area);
    const animationOff = () => document.documentElement.dataset.animationMode === "off" || matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ns = "http://www.w3.org/2000/svg";
    function svg(tag, attrs) { const n = document.createElementNS(ns, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; }
    const geography = $("eqGeography"), waves = $("eqWaves"), markers = $("eqMarkers");
    const paths = [], insets = [];
    for (const spec of [{name:"沖縄・奄美",x:18,y:62,width:205,height:170,bounds:[122.5,23.7,132,30.1]}, {name:"小笠原諸島",x:18,y:242,width:205,height:90,bounds:[140.5,23.7,154.5,28.2]}]) {
      const frame=svg("svg",{x:spec.x,y:spec.y,width:spec.width,height:spec.height,viewBox:`0 0 ${spec.width} ${spec.height}`,class:"eq-inset",overflow:"hidden"});
      frame.append(svg("rect",{width:spec.width,height:spec.height,rx:8,class:"eq-inset-background"}));
      const points=[project(spec.bounds[0],spec.bounds[1]),project(spec.bounds[2],spec.bounds[3])];
      const k=Math.min((spec.width-18)/Math.abs(points[1][0]-points[0][0]),(spec.height-36)/Math.abs(points[1][1]-points[0][1]))/1.06;
      const cx=(points[0][0]+points[1][0])/2,cy=(points[0][1]+points[1][1])/2;
      const view={k,x:spec.width/2-cx*k,y:(spec.height+22)/2-cy*k};
      const land=svg("g",{transform:`translate(${view.x},${view.y}) scale(${k})`}), wave=svg("g",{transform:`translate(${view.x},${view.y}) scale(${k})`}), mark=svg("g",{});
      frame.append(land,wave,mark);
      const text=svg("text",{x:10,y:18,class:"eq-inset-caption"});text.textContent=spec.name;frame.append(text);
      $("eqMap").append(frame);
      const p=svg("path",{class:"eq-wave-p","vector-effect":"non-scaling-stroke"}),s=svg("path",{class:"eq-wave-s","vector-effect":"non-scaling-stroke"});wave.append(p,s);
      insets.push({...spec,frame,land,mark,view,p,s});
    }
    const insetIndex = (lon,lat) => lat<30.2 && lon<132 ? 0 : lat<30 && lon>140.5 ? 1 : -1;
    for (const f of geo.features) {
      const polygons = f.geometry.type === "MultiPolygon" ? f.geometry.coordinates : [f.geometry.coordinates];
      for (const polygon of polygons) {
        const d=polygon.map(ring=>ring.map((p,i)=>`${i ? "L" : "M"}${project(...p).map(n=>n.toFixed(2)).join(",")}`).join("")+"Z").join("");
        const center=polygon[0].reduce((a,p)=>[a[0]+p[0]/polygon[0].length,a[1]+p[1]/polygon[0].length],[0,0]);
        const inset=insetIndex(...center);
        const n=svg("path",{d,class:"eq-land","vector-effect":"non-scaling-stroke"});
        geography.append(n);paths.push({node:n,area:f.properties,inset});
        if(inset>=0){const copy=n.cloneNode(true);insets[inset].land.append(copy);paths.push({node:copy,area:f.properties,inset:-1});}
      }
    }
    const waveP = svg("path", { class: "eq-wave-p", "vector-effect": "non-scaling-stroke" });
    const waveS = svg("path", { class: "eq-wave-s", "vector-effect": "non-scaling-stroke" });
    waves.append(waveP, waveS);
    const national = rectFor([project(128.5,30.5),project(146.2,45.8)], .025);
    national.k *= .91; national.x = 505-project(137.35,38.5)[0]*national.k; national.y = 310-project(137.35,38.5)[1]*national.k;
    mapTarget = mapView = { ...national };
    geography.setAttribute("transform", `translate(${national.x},${national.y}) scale(${national.k})`);
    function showHome() {
      for (const e of events.values()) if (C.fresh(e, Date.now())) dismissed.add(e.id);
      if (test) dismissed.add(test.id);
      pendingAuto = null; pendingReturn = null; auto = null;
      ui.showPage("home");
    }
    ui.registerEarthquakePage(page, { hold: () => !!auto || !!pendingAuto });
    function populateAreas(prefInput, areaInput, code) {
      areaInput.innerHTML = catalog.areas.filter((a) => a.pref === prefInput.value).map((a) => `<option value="${a.code}">${escape(a.name)}</option>`).join("");
      if ([...areaInput.options].some((o) => o.value === code)) areaInput.value = code;
    }
    field("eqPref").value = config.pref;
    populateAreas(field("eqPref"), field("eqArea"), config.area);
    const bindings = { eqThresholdEnabled: "thresholdEnabled", eqThreshold: "threshold", eqWarningEnabled: "warningEnabled", eqNationwide: "nationwide", eqSound: "sound" };
    for (const [id, prop] of Object.entries(bindings)) {
      const input = field(id);
      if (input.type === "checkbox") input.checked = config[prop]; else input.value = config[prop];
    }
    $("eqHistoryMin").value = config.historyMin;
    function saveConfig() { save({ ...config }); render(); }
    field("eqPref").addEventListener("change", () => { populateAreas(field("eqPref"), field("eqArea")); config.pref = field("eqPref").value; config.area = field("eqArea").value; saveConfig(); }, listeners);
    field("eqArea").addEventListener("change", () => { config.area = field("eqArea").value; saveConfig(); }, listeners);
    for (const [id, prop] of Object.entries(bindings)) field(id).addEventListener("change", () => { const n = field(id); config[prop] = n.type === "checkbox" ? n.checked : prop === "threshold" ? Number(n.value) : n.value; saveConfig(); }, listeners);
    $("eqHistoryMin").addEventListener("change", () => { config.historyMin = Number($("eqHistoryMin").value); saveConfig(); renderHistory(); }, listeners);
    field("eqDebugPref").value = config.pref;
    populateAreas(field("eqDebugPref"), field("eqDebugArea"), config.area);
    field("eqDebugScale").value = "50";
    function debugRegion() {
      const r = catalog.areas.find((a) => a.code === field("eqDebugArea").value);
      field("eqDebugLat").value = r.latitude.toFixed(4); field("eqDebugLon").value = r.longitude.toFixed(4);
    }
    debugRegion();
    field("eqDebugPref").addEventListener("change", () => { populateAreas(field("eqDebugPref"), field("eqDebugArea")); debugRegion(); }, listeners);
    field("eqDebugArea").addEventListener("change", debugRegion, listeners);
    field("eqDebugTime").value = new Date(Date.now() + 9 * 3600000 + 60000).toISOString().slice(0, 19);
    $("eqHome").addEventListener("click", showHome, listeners);
    document.querySelector("#newSettingsButton").addEventListener("click", () => { if(ui.getActivePage()==="earthquake") controls.closest("section")?.scrollIntoView({block:"start",behavior:"instant"}); }, listeners);
    $("eqFit").addEventListener("click", () => { zoomManual = true; nationalMode = true; mapTarget = { ...national }; startMap(); }, listeners);
    $("eqLive").addEventListener("click", () => { selected = null; detailsOpen = false; zoomManual = false; render(); }, listeners);
    $("eqObservationsClose").addEventListener("click", () => { detailsOpen = false; $("eqObservations").hidden = true; }, listeners);
    page.addEventListener("keydown", e => { if(e.key === "Escape") { detailsOpen=false; $("eqObservations").hidden=true; } }, listeners);
    const mapPointers=new Map();let gesture=null;
    const mapPoint=e=>{const rect=$("eqMap").getBoundingClientRect();return{x:(e.clientX-rect.left)*WIDTH/rect.width-mapShift,y:(e.clientY-rect.top)*HEIGHT/rect.height};};
    function zoom(factor,anchor={x:WIDTH/2,y:HEIGHT/2}) {
      zoomManual=true; nationalMode=false;
      mapTarget=C.zoomView(mapTarget,anchor,factor,national.k*.35,national.k*30);startMap();
    }
    $("eqZoomIn").addEventListener("click",()=>zoom(1.5),listeners);
    $("eqZoomOut").addEventListener("click",()=>zoom(1/1.5),listeners);
    function snapshotGesture() {
      const points=[...mapPointers.values()];
      const anchor=points.length>1?{x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2}:points[0];
      const inset=nationalMode?insets.find(i=>anchor.x>=i.x && anchor.x<=i.x+i.width && anchor.y>=i.y && anchor.y<=i.y+i.height):null;
      gesture={anchor,view:inset?{k:inset.view.k,x:inset.x+inset.view.x,y:inset.y+inset.view.y}:{...mapView},distance:points.length>1?Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y):0};
    }
    $("eqMap").addEventListener("pointerdown",e=>{
      mapPointers.set(e.pointerId,mapPoint(e));
      if(mapPointers.size>1 || zoomManual){ui.cancelEarthquakeDrag();e.stopPropagation();for(const id of mapPointers.keys())$("eqMap").setPointerCapture(id);snapshotGesture();}
    },listeners);
    $("eqMap").addEventListener("pointermove",e=>{
      if(!mapPointers.has(e.pointerId))return;mapPointers.set(e.pointerId,mapPoint(e));
      if(!gesture)return;e.stopPropagation();e.preventDefault();
      const points=[...mapPointers.values()],anchor=points.length>1?{x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2}:points[0];
      const distance=points.length>1?Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y):0;
      zoomManual=true;nationalMode=false;
      mapTarget=C.zoomView(gesture.view,gesture.anchor,gesture.distance&&distance?distance/gesture.distance:1,national.k*.35,national.k*30);
      mapTarget.x+=anchor.x-gesture.anchor.x;mapTarget.y+=anchor.y-gesture.anchor.y;
      mapView={...mapTarget};startMap();
    },listeners);
    function releaseMapPointer(e){mapPointers.delete(e.pointerId);if(gesture){e.stopPropagation();if(mapPointers.size)snapshotGesture();else gesture=null;}}
    $("eqMap").addEventListener("pointerup",releaseMapPointer,listeners);
    $("eqMap").addEventListener("pointercancel",releaseMapPointer,listeners);
    window.addEventListener("pointerup",e=>{if(!e.target.closest?.("#eqMap")){mapPointers.delete(e.pointerId);if(!mapPointers.size)gesture=null;}},listeners);
    window.addEventListener("pointercancel",e=>{mapPointers.delete(e.pointerId);if(!mapPointers.size)gesture=null;},listeners);
    $("eqMap").addEventListener("wheel",e=>{e.preventDefault();e.stopPropagation();zoom(Math.exp(-Math.max(-150,Math.min(150,e.deltaY))*.004),mapPoint(e));},{...listeners,passive:false});
    document.addEventListener("moriya-page-change", (e) => {
      if (e.detail.page !== "earthquake") {
        mapPointers.clear(); gesture=null;
        if (auto || pendingAuto) {
          for (const id of triggered) dismissed.add(id);
          auto = null; pendingAuto = null;
        }
        return;
      }
      zoomManual = false; lastMapKey = ""; render(); startMap();
    }, listeners);
    window.addEventListener("moriya-earthquake-reveal", () => { render(); startMap(); }, listeners);
    function unlockSound() {
      if (config.sound === "off" || audio) return;
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (Audio) { audio = new Audio(); void audio.resume().catch(() => {}); }
    }
    document.addEventListener("pointerdown", unlockSound, { ...listeners, capture: true });
    function stopAlertSound() {
      alertSequence++;
      if (alertSource) { try { alertSource.stop(); } catch {} alertSource.disconnect(); alertSource = null; }
    }
    function loadAlertSound() {
      if (alertBuffer) return Promise.resolve(alertBuffer);
      if (alertLoading) return alertLoading;
      const context = audio;
      if (!context) return Promise.reject(new Error('Audio unavailable'));
      alertLoading = (async () => {
        const response = await fetch('./assets/audio/eew-first.mp3', {signal:life.signal});
        if (!response.ok) throw new Error('Alert sound unavailable');
        const buffer = await context.decodeAudioData(await response.arrayBuffer());
        if (destroyed || audio !== context) throw new Error('Audio closed');
        alertBuffer = buffer;
        return buffer;
      })().finally(() => { alertLoading = null; });
      return alertLoading;
    }
    field('eqSound').addEventListener('change', () => {
      stopAlertSound();
      if (config.sound === 'eewFirst') { unlockSound(); void loadAlertSound().catch(() => {}); }
    }, listeners);
    async function playSound(force = false) {
      if (!foreground || config.sound === "off") return;
      if (force) { unlockSound(); try { await audio?.resume(); } catch { /* Browser may deny audio. */ } }
      if (!audio || audio.state !== "running") { soundUnavailable = true; render(); return; }
      soundUnavailable = false;
      stopAlertSound();
      if (config.sound === 'eewFirst') {
        const sequence = alertSequence;
        try {
          const buffer = await loadAlertSound();
          if (destroyed || !foreground || config.sound !== 'eewFirst' || sequence !== alertSequence || audio.state !== 'running') return;
          const source = audio.createBufferSource(), gain = audio.createGain();
          source.buffer = buffer; source.loop = false;
          gain.gain.value = .7;
          source.connect(gain); gain.connect(audio.destination);
          alertSource = source;
          source.onended = () => { source.disconnect(); gain.disconnect(); if (alertSource === source) alertSource = null; };
          source.start();
        } catch { if (!destroyed && sequence === alertSequence) { soundUnavailable = true; render(); } }
        return;
      }
      const t = audio.currentTime;
      const tones = config.sound === "chime" ? [660, 880, 660, 880] : [523, 659];
      tones.forEach((f, i) => {
        const oscillator = audio.createOscillator(), gain = audio.createGain(), start = t + i * .23;
        oscillator.type = "sine"; oscillator.frequency.value = f;
        gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(.10, start + .035); gain.gain.exponentialRampToValueAtTime(.001, start + .30);
        oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(start); oscillator.stop(start + .32);
      });
    }
    field("eqSoundTest").addEventListener("click", () => playSound(true), listeners);
    function activeEvents(stamp) {
      return [...events.values(), ...(test && test.origin <= stamp ? [test] : [])].filter((e) => stamp < C.endTime(e) + 60000)
        .sort((a, b) => Number(!!b.test) - Number(!!a.test) || C.localScale(b, region()) - C.localScale(a, region()) || b.issued - a.issued);
    }
    function ingest(value, source) {
      let event = source === "wolfx" ? C.normalizeWolfx(value) : C.normalizeP2P(value);
      if (!event) return;
      const equivalent = [...events.values()].find((e) => e.id === event.id || (Math.abs(e.origin - event.origin) <= 5000 && C.hasLocation(e) && C.hasLocation(event) && Math.abs(e.latitude - event.latitude) < 1 && Math.abs(e.longitude - event.longitude) < 1));
      if (equivalent) event = { ...event, id: equivalent.id };
      if (equivalent && event.cancelled && !Number.isFinite(event.origin)) event = { ...event, origin: equivalent.origin };
      if (!C.fresh(event, Date.now())) return;
      const merged = C.merge(equivalent, event);
      if (merged === equivalent) return;
      events.set(merged.id, merged);
      latestLive = merged;
      if (test || scheduled) { test = scheduled = null; field("eqDebugStatus").textContent = "実際の速報を受信したためテストを終了しました。"; }
      evaluate(); render();
    }
    function evaluate() {
      const stamp = Date.now();
      for (const [id, e] of events) if (stamp > C.endTime(e) + 60000) events.delete(id);
      if (test && !test.final && stamp >= test.origin + 90000) test = { ...test, serial: test.serial + 1, final: true, issued: test.origin + 90000 };
      if (test && stamp >= C.endTime(test) + 60000) test = null;
      if (latestLive && stamp >= C.endTime(latestLive) + 60000) latestLive = null;
      if (auto && !activeEvents(stamp).some((e) => triggered.has(e.id) && !dismissed.has(e.id))) {
        pendingReturn = ui.getActivePage()==="earthquake" && ui.isPagePinned() ? null : auto.returnPage; auto = null; pendingAuto = null;
      }
      if (!foreground || document.querySelector("#viewportShell")?.dataset.mode !== "new") return;
      if (pendingReturn) {
        if (ui.getActivePage() !== "earthquake" || ui.showPage(pendingReturn)) pendingReturn = null;
      }
      const candidates = activeEvents(stamp).filter((e) => !e.cancelled && !triggered.has(e.id) && !dismissed.has(e.id) && C.trigger(e, config, region()));
      if (candidates.length) {
        const event = candidates[0];
        if (!auto) auto = { returnPage: ui.getActivePage() === "earthquake" ? "home" : ui.getActivePage() };
        selected = null; zoomManual = false; pendingReturn = null;
        detailsOpen = false;
        for (const e of candidates) triggered.add(e.id);
        pendingAuto = event.id;
        if (!document.querySelector("#settingsDialog")?.hidden) window.closeSettings?.();
        playSound();
      }
      if (pendingAuto && (ui.getActivePage() === "earthquake" || ui.showPage("earthquake"))) pendingAuto = null;
    }
    function current() {
      if (selected) return typeof selected === "string" ? events.get(selected) || (test?.id === selected ? test : null) : selected;
      return activeEvents(Date.now())[0] || latestLive;
    }
    function renderHistory() {
      const list = history.filter((e) => e.maxScale >= config.historyMin);
      $("eqHistoryList").innerHTML = list.map((e) => `<button type="button" class="eq-history-item" data-id="${escape(e.id)}"><span class="eq-scale-badge" style="--eq-scale-color:${color(e.maxScale)}">${C.label(e.maxScale)}</span><span><strong>${escape(e.name)}</strong><small>${fmt(e.origin, true)} / M${e.magnitude === null || e.magnitude < 0 ? "不明" : e.magnitude.toFixed(1)}</small></span></button>`).join("");
      if (!list.length && history.length) $("eqHistoryList").innerHTML = '<p class="eq-empty">指定した震度以上の地震は取得済みの履歴にありません。</p>';
    }
    $("eqHistoryList").addEventListener("click", (e) => {
      const b = e.target.closest("[data-id]"); if (!b) return;
      selected = history.find((e) => e.id === b.dataset.id) || null; detailsOpen = true; zoomManual = false; render();
    }, listeners);
    $("eqEventTabs").addEventListener("click", (e) => {
      const b = e.target.closest("[data-event-id]"); if (!b) return;
      selected = b.dataset.eventId; zoomManual = false; render();
    }, listeners);
    function renderObservations(event) {
      $("eqObservations").hidden = !detailsOpen || !event?.historical;
      if(!event?.historical || !detailsOpen) return;
      const weatherName = ui.getWeatherLocationName?.() || '';
      const key=event.id+":"+event.issued+":"+event.points.length+":"+weatherName;
      if(detailsKey===key)return;detailsKey=key;
      const rows=C.observations(event);
      $("eqObservationsName").textContent=event.name;
      $("eqObservationsSummary").textContent=`${fmt(event.origin,true)} · 最大震度${C.label(event.maxScale)} · ${rows.length}地点`;
      const placeLabel = (place, pref) => {
        const match = !place.isArea && C.weatherMunicipalityMatch(weatherName, pref, place.name, catalog.prefs);
        if (!match) return escape(place.name);
        return `${escape(place.name.slice(0,match.start))}<mark class="eq-weather-municipality">${escape(place.name.slice(match.start,match.end))}</mark>${escape(place.name.slice(match.end))}`;
      };
      $("eqObservationsList").innerHTML=rows.length?C.observationGroups(event).map(group=>`<section class="eq-observed-group"><h4 style="--eq-scale-color:${color(group.scale)}">震度${C.label(group.scale)}</h4>${group.prefectures.map(pref=>`<div class="eq-observed-pref"><h5>${escape(pref.pref)}</h5><ul>${pref.places.map(place=>`<li>${placeLabel(place,pref.pref)}${place.isArea ? '<small>（地域集計）</small>' : ''}</li>`).join('')}</ul></div>`).join('')}</section>`).join(''):'<p class="eq-empty">各地の観測震度はこの情報に含まれていません。</p>';
    }
    function render() {
      if (destroyed) return;
      const event = current(), r = region();
      const observed = event?.historical ? C.observations(event) : [];
      renderObservations(event);
      $("eqLocalName").textContent = r.name;
      $("eqIntensityCaption").textContent=event?.historical?"設定地域の観測震度":"設定地域の予想震度";
      $("eqMaxCaption").textContent=event?.historical?"最大観測震度":"最大予想震度";
      $("eqLive").hidden = !selected;
      const states = [...connection.entries()].map(([name, s]) => `${name}: ${s}`);
      $("eqConnection").textContent = !foreground ? "受信休止中" : connection.get("Wolfx") === "接続中" ? "速報受信中" : "速報接続を再試行中";
      $("eqConnection").title = states.join(" / ");
      $("eqConnection").classList.toggle("is-connected", foreground && connection.get("Wolfx") === "接続中");
      const list = activeEvents(Date.now());
      $("eqEventTabs").innerHTML = list.length > 1 ? list.map((e) => `<button type="button" data-event-id="${escape(e.id)}" aria-pressed="${e.id === event?.id}">${e.test ? "テスト · " : ""}${escape(e.name)}</button>`).join("") : "";
      page.classList.toggle("is-emergency", !!auto);
      $("eqTestLabel").hidden = !event?.test;
      if (!event) {
        $("eqState").textContent = foreground && connection.get("Wolfx") === "接続中" ? "受信待機" : "接続確認中";
        $("eqName").textContent = "地震情報を待っています";
        $("eqLocalIntensity").textContent = $("eqMaxIntensity").textContent = "—";
        $("eqOrigin").textContent = $("eqMagnitude").textContent = $("eqUpdate").textContent = "—";
        $("eqMessage").textContent = "速報を受信すると震源と波の広がりを表示します。";
      } else {
        const status = event.historical ? "過去の地震 · 観測値" : event.cancelled ? "速報取消" : Date.now() >= C.endTime(event) ? "速報終了" : event.warning ? "緊急地震速報 · 警報情報" : "緊急地震速報 · 予報情報";
        $("eqState").textContent = status;
        $("eqName").textContent = event.name;
        const observation = event.historical ? C.localObservation(event, r, ui.getWeatherLocationName?.() || '', catalog.prefs) : null;
        const local = event.historical ? observation.scale : C.localScale(event, r);
        $("eqIntensityCaption").textContent = observation?.weatherFallback ? "天気設定地点の観測震度" : event.historical ? "設定地域の観測震度" : "設定地域の予想震度";
        if (observation?.weatherFallback) $("eqLocalName").textContent = `${observation.municipality}（市町村内の最大）`;
        $("eqMaxCaption").textContent = event.historical ? "最大観測震度" : "最大予想震度";
        $("eqLocalIntensity").textContent = C.label(local);
        $("eqLocalIntensity").style.color = color(local);
        $("eqMaxIntensity").textContent = C.label(event.maxScale);
        $("eqMaxIntensity").style.color = color(event.maxScale);
        $("eqOrigin").textContent = fmt(event.origin, true);
        $("eqMagnitude").textContent = `M${event.magnitude === null || event.magnitude < 0 ? "不明" : event.magnitude.toFixed(1)} / ${event.depth === null || event.depth < 0 ? "不明" : event.depth + "km"}`;
        $("eqUpdate").textContent = event.historical ? "観測情報" : `第${event.serial || "—"}報 · ${fmt(event.issued)}`;
        $("eqMessage").textContent = event.cancelled ? "この速報は取り消されました。" : event.historical ? "観測後の地震情報です。P波・S波のライブ表示は行いません。" : local < 0 ? "この地域の予想震度は配信に含まれていません。" : "予想震度・波の位置は参考値です。身の安全を確保してください。";
        if (observation?.weatherFallback && !event.cancelled) $("eqMessage").textContent = `設定地域の集計がないため、${observation.municipality}内の観測地点の最大震度を表示しています。`;
        if (event.test) $("eqMessage").textContent = "訓練／テスト表示です。実際の地震ではありません。";
        if (soundUnavailable && auto) $("eqMessage").textContent += " 音を有効にするには画面を操作してください。";
      }
      const mapKey = `${event?.id || "national"}:${event?.latitude}:${event?.longitude}:${event?.issued}:${config.area}`;
      if (mapKey !== lastMapKey) {
        lastMapKey = mapKey;
        if (!zoomManual) {
          nationalMode = !(event && C.hasLocation(event));
          mapTarget = !nationalMode ? rectFor([project(event.longitude, event.latitude), ...(event.historical ? [] : [project(r.longitude, r.latitude)])], .40) : { ...national };
        }
        for (const p of paths) {
          const matched = event && !event.historical ? C.matchingAreas(event, p.area) : [];
          const intensity = event?.historical ? Math.max(-1,...observed.filter(a=>a.isArea && a.name===p.area.name).map(a=>a.scale)) : matched.length ? Math.max(...matched.map((a) => Math.max(a.to, a.from))) : -1;
          p.node.style.fill = intensity >= 0 ? color(intensity) : "";
          p.node.classList.toggle("eq-land-observed", intensity >= 0);
          p.node.classList.toggle("eq-land-selected", p.area.code === config.area);
        }
      }
      $("eqMapCaption").textContent = event?.test ? "訓練／テスト · 推定波面" : event?.historical ? "過去の地震" : event ? "震源と推定波面" : "日本全国";
      if (ui.getActivePage() === "earthquake") startMap();
    }
    let lastFrame = 0;
    function startMap() { if (!raf && foreground && !destroyed) raf = requestAnimationFrame(drawMap); }
    function drawMap(frame) {
      raf = 0;
      if (destroyed || !foreground || (!page.classList.contains("is-active") && !page.classList.contains("is-drag-preview"))) return;
      const dt = Math.min(.1, (frame - lastFrame) / 1000 || .03); lastFrame = frame;
      const blend = animationOff() ? 1 : 1 - Math.exp(-dt * 7);
      for (const k of ["k", "x", "y"]) mapView[k] += (mapTarget[k] - mapView[k]) * blend;
      const panel = $("eqObservations");
      const shiftTarget = !panel.hidden ? C.observationMapOffset($("eqMap").getBoundingClientRect(), panel.getBoundingClientRect(), WIDTH) : 0;
      mapShift += (shiftTarget - mapShift) * blend;
      // Keep the logical camera intact so closing the list restores its center
      // without resetting user zoom/pan. Land, waves and markers move together.
      const displayView = { ...mapView, x: mapView.x + mapShift };
      const transform = `translate(${displayView.x},${displayView.y}) scale(${displayView.k})`;
      geography.setAttribute("transform", transform); waves.setAttribute("transform", transform);
      insets.forEach(i=>{i.frame.style.display=nationalMode?"":"none";i.frame.setAttribute("transform",`translate(${mapShift},0)`);i.mark.replaceChildren();});
      paths.forEach(p=>{if(p.inset>=0)p.node.style.display=nationalMode?"none":"";});
      const event = current(), stamp = Date.now();
      const active = event && !event.historical && !event.cancelled && stamp < event.origin + 180000 && C.hasLocation(event);
      for (const [node, velocity] of [[waveP, 6], [waveS, 3.5]]) {
        const radius = active ? C.surfaceRadius(event, stamp, velocity) : null;
        if (!radius) { node.setAttribute("d", ""); insets.forEach(i=>(velocity===6?i.p:i.s).setAttribute("d","")); continue; }
        let d = "";
        for (let bearing = 0; bearing <= 360; bearing += 4) {
          const xy = project(...C.destination(event.latitude, event.longitude, radius, bearing));
          d += `${bearing ? "L" : "M"}${xy.map((n) => n.toFixed(2)).join(",")}`;
        }
        node.setAttribute("d", d + "Z");
        insets.forEach(i=>(velocity===6?i.p:i.s).setAttribute("d",d+"Z"));
      }
      const r = region(), local = project(r.longitude, r.latitude);
      markers.replaceChildren();
      function marker(p, kind, text, lon, lat) {
        const index=nationalMode?insetIndex(lon,lat):-1;
        const view=index>=0?insets[index].view:displayView;
        const x = p[0] * view.k + view.x, y = p[1] * view.k + view.y;
        const group = svg("g", { transform: `translate(${x},${y})`, class: `eq-marker eq-marker-${kind}` });
        group.append(kind === "source" ? svg("path", { d: "M-7-7 7 7M7-7-7 7" }) : svg("circle", { r: 5 }));
        const caption = svg("text", { x: 11, y: -10 }); caption.textContent = text; group.append(caption); (index>=0?insets[index].mark:markers).append(group);
      }
      marker(local, "local", r.name,r.longitude,r.latitude);
      if (event && C.hasLocation(event)) marker(project(event.longitude, event.latitude), "source", event.test ? "テスト震源" : "震源",event.longitude,event.latitude);
      const seconds=C.sArrival(event,r,stamp);
      $("eqArrival").hidden=seconds===null;
      $("eqArrivalSeconds").textContent=seconds===null?"":seconds>0?`約${Math.ceil(seconds)}秒`:"到達推定時刻を過ぎました";
      $("eqArrivalRegion").textContent=`${r.name}の代表位置 · 推定`;
      $("eqWaveAge").textContent = active ? `発生から${Math.max(0, Math.floor((stamp - event.origin) / 1000))}秒` : event && !event.historical && !C.hasLocation(event) ? "震源情報待ち" : "";
      raf = requestAnimationFrame(drawMap);
    }
    function updateConnection(name, text) { connection.set(name, text); render(); }
    function startNetwork() {
      if (destroyed || !foreground || sockets.length) return;
      const token = ++networkGeneration;
      function connect(name, url, source, attempt = 0) {
        if (destroyed || !foreground || token !== networkGeneration) return;
        updateConnection(name, "接続待ち");
        let socket;
        try { socket = new WebSocket(url); } catch { retry(); return; }
        sockets.push(socket);
        let lastPacket = Date.now();
        const health = setInterval(() => {
          if (source === "wolfx" && Date.now() - lastPacket > 100000) socket.close();
          if (source === "wolfx" && socket.readyState === WebSocket.OPEN) socket.send("ping");
        }, 45000);
        socket.onopen = () => { if (token !== networkGeneration) { socket.close(); return; } updateConnection(name, "接続中"); if (source === "wolfx") socket.send("query_jmaeew"); };
        socket.onmessage = (message) => {
          if (token !== networkGeneration || !foreground) return;
          lastPacket = Date.now();
          try { const v = JSON.parse(message.data); if (v.type === "heartbeat" || v.type === "pong") return; ingest(v, source); } catch { /* Ignore malformed packets without destroying the connection. */ }
        };
        socket.onerror = () => socket.close();
        socket.onclose = () => { clearInterval(health); sockets = sockets.filter((s) => s !== socket); retry(); };
        function retry() {
          if (token !== networkGeneration || destroyed || !foreground) return;
          updateConnection(name, "再接続中");
          const timer = setTimeout(() => { reconnectTimers = reconnectTimers.filter((t) => t !== timer); connect(name, url, source, attempt + 1); }, Math.min(60000, 3000 * 2 ** Math.min(attempt, 5)));
          reconnectTimers.push(timer);
        }
      }
      connect("Wolfx", "wss://ws-api.wolfx.jp/jma_eew", "wolfx");
      connect("P2P", "wss://api.p2pquake.net/v2/ws", "p2p");
      void loadHistory(); historyTimer = setInterval(loadHistory, 120000);
    }
    async function loadHistory() {
      if (destroyed || !foreground || request) return;
      const token = networkGeneration;
      request = new AbortController(); const controller = request;
      const timeout = setTimeout(() => controller.abort(), 12000);
      try {
        const r = await fetch("https://api.p2pquake.net/v2/history?codes=551&limit=100", { signal: controller.signal, cache: "no-store" });
        if (!r.ok) throw new Error(String(r.status));
        const values = await r.json(); if (!Array.isArray(values)) throw new Error("invalid history");
        if (destroyed || token !== networkGeneration) return;
        history = C.histories(values);
        try { localStorage.setItem("moriyaEarthquakeBetaHistory", JSON.stringify({ saved: Date.now(), values })); } catch { /* Optional cache. */ }
        $("eqHistoryStatus").textContent = history.length ? `最大観測震度で絞り込み · ${fmt(Date.now())}更新` : "配信元の履歴は空です。";
        renderHistory();
      } catch {
        if (!destroyed && foreground && token === networkGeneration) $("eqHistoryStatus").textContent = history.length ? "取得失敗 · 保存済みの履歴を表示中" : "履歴を取得できませんでした。再試行します。";
      } finally { clearTimeout(timeout); if (request === controller) request = null; }
    }
    try {
      const cached = JSON.parse(localStorage.getItem("moriyaEarthquakeBetaHistory") || "null");
      if (cached && Array.isArray(cached.values)) { history = C.histories(cached.values); $("eqHistoryStatus").textContent = `保存済み · ${fmt(cached.saved, true)}取得`; renderHistory(); }
    } catch { /* Invalid cache is discarded. */ }
    function stopNetwork() {
      ++networkGeneration;
      clearInterval(historyTimer); historyTimer = 0;
      request?.abort(); request = null;
      reconnectTimers.forEach(clearTimeout); reconnectTimers = [];
      const closing = sockets; sockets = []; closing.forEach((s) => s.close());
      connection.clear();
    }
    function visibility(active) {
      foreground = active && !document.hidden;
      if (foreground) { startNetwork(); evaluate(); render(); startMap(); }
      else { stopNetwork(); cancelAnimationFrame(raf); raf = 0; stopAlertSound(); void audio?.suspend().catch(() => {}); }
    }
    document.addEventListener("visibilitychange", () => visibility(!document.hidden), listeners);
    window.addEventListener("blur", () => visibility(false), listeners);
    window.addEventListener("focus", () => { void audio?.resume().catch(() => {}); visibility(true); }, listeners);
    function createTest(origin) {
      const r = catalog.areas.find((a) => a.code === field("eqDebugArea").value);
      const latitude = C.numeric(field("eqDebugLat").value), longitude = C.numeric(field("eqDebugLon").value), depth = C.numeric(field("eqDebugDepth").value), magnitude = C.numeric(field("eqDebugMagnitude").value);
      if (latitude === null || latitude < 20 || latitude > 50 || longitude === null || longitude < 120 || longitude > 160 || depth === null || depth < 0 || depth > 700 || magnitude === null || magnitude < 0 || magnitude > 10) throw new Error("震源位置・深さ・規模を入力範囲内に設定してください。");
      const intensity = Number(field("eqDebugScale").value), warning = field("eqDebugWarning").checked;
      return { id: `test-${origin}`, origin, issued: origin, name: r.name, latitude, longitude, depth, magnitude, maxScale: intensity,
        serial: 1, test: true, source: "テスト", warning, training: false, cancelled: false, final: false,
        areas: [{ name: r.name, from: intensity, to: intensity, warning, arrival: NaN }] };
    }
    function queueTest(immediate) {
      try {
        const origin = immediate ? Date.now() : C.time(field("eqDebugTime").value);
        if (!Number.isFinite(origin) || origin < Date.now() - 1000) throw new Error("現在より後の発生日時（日本時間）を指定してください。");
        const event = createTest(origin);
        if (immediate) { test = event; scheduled = null; selected = null; evaluate(); render(); }
        else scheduled = event;
        field("eqDebugStatus").textContent = immediate ? "訓練／テスト中。自動表示条件に一致する場合に地震画面へ移動します。" : `${fmt(origin, true)}（日本時間）に訓練／テストを予約しました。`;
      } catch (error) { field("eqDebugStatus").textContent = error.message; }
    }
    field("eqDebugNow").addEventListener("click", () => queueTest(true), listeners);
    field("eqDebugSchedule").addEventListener("click", () => queueTest(false), listeners);
    field("eqDebugFinal").addEventListener("click", () => { if (test) { test = { ...test, final: true, serial: test.serial + 1, issued: Date.now() }; evaluate(); render(); } }, listeners);
    field("eqDebugCancel").addEventListener("click", () => { if (test) { test = { ...test, cancelled: true, serial: test.serial + 1, issued: Date.now() }; evaluate(); render(); } }, listeners);
    field("eqDebugStop").addEventListener("click", () => {
      test = scheduled = null; selected = null; latestLive = null;
      field("eqDebugStatus").textContent = "テストと予約を終了しました。"; evaluate(); render();
    }, listeners);
    const tick = setInterval(() => {
      if (!foreground) return;
      if (scheduled && Date.now() >= scheduled.origin) {
        if (Date.now() - scheduled.origin <= 10000) { test = scheduled; selected = null; }
        else field("eqDebugStatus").textContent = "予約時刻にアプリが開かれていなかったためテストを見送りました。";
        scheduled = null;
      }
      evaluate();
      if (ui.getActivePage() === "earthquake") render();
    }, 1000);
    document.querySelector('#settingsAdvanced > .settings-category-body')?.append(earthquakeDebug);
    render(); startNetwork();
    return { destroy() {
      if (destroyed) return;
      destroyed = true; life.abort(); clearInterval(tick); stopNetwork(); cancelAnimationFrame(raf); stopAlertSound(); alertBuffer = null; void audio?.close().catch(() => {});
      test = scheduled = null; ui.unregisterEarthquakePage(); page.remove(); earthquakeDebug.remove(); controls.replaceChildren(); controls.classList.remove("eq-controls");
    } };
  }
  window.MoriyaEarthquakeRuntime = { mount };
})();
