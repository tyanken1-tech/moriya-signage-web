(() => {
  'use strict';
  const core = window.MoriyaReminderCore, bridge = window.MoriyaCalendarReminderBridge;
  if (!core || !bridge) return;
  const $ = id => document.getElementById(id);
  const storageKey = 'moriyaCalendarReminderAcknowledgements';
  const cacheKey = 'moriyaReminderCalendarCache';
  const sheet = $('calendarReminderPopup'), list = $('calendarReminderItems');
  let own = [], all = [], calendarCache = null, visible = [], signature = '', generation = 0, editorDirty = false;
  let previousFocus = null, draft = core.normalize(bridge.config());
  let pending = [], demoNotices = null;
  const identities = new Map();
  const safe = text => String(text).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
    own = core.marks(stored.own); all = core.mergeMarks(stored.all, own);
    calendarCache = JSON.parse(localStorage.getItem(cacheKey) || 'null');
  } catch { /* A corrupt cache cannot prevent fresh calendar data or new notices. */ }
  function persist(nextOwn, nextAll) {
    localStorage.setItem(storageKey, JSON.stringify({ own: nextOwn, all: nextAll }));
    own = nextOwn; all = nextAll;
  }
  function makeRule() {
    return { id: 'rule-' + crypto.randomUUID(), enabled: true, keyword: '', color: '#a84840', design: 'glass', times: [{ daysBefore: 1, time: '09:00' }] };
  }
  function renderEditor() {
    $('calendarRemindersEnabled').checked = draft.enabled;
    $('calendarReminderRules').innerHTML = draft.rules.map((rule, index) => `
      <fieldset class="reminder-rule" data-reminder-rule="${index}">
        <div class="reminder-rule-head"><strong>ルール ${index + 1}</strong><label class="checkbox-row"><input type="checkbox" data-field="enabled" ${rule.enabled ? 'checked' : ''}>有効</label><button type="button" data-remove-rule="${index}" aria-label="ルール${index + 1}を削除">削除</button></div>
        <label><span>予定名に含まれる語句</span><input type="text" maxlength="80" data-field="keyword" value="${safe(rule.keyword)}" placeholder="例：当直、資源回収"></label>
        <div class="reminder-style-fields"><label><span>背景色</span><input type="color" data-field="color" aria-label="ルール${index + 1}の背景色" value="${rule.color}"></label><label><span>デザイン</span><select data-field="design" aria-label="ルール${index + 1}のデザイン"><option value="glass" ${rule.design === 'glass' ? 'selected' : ''}>カラーガラス</option><option value="solid" ${rule.design === 'solid' ? 'selected' : ''}>落ち着いた単色</option><option value="outline" ${rule.design === 'outline' ? 'selected' : ''}>色付きライン</option></select></label></div>
        <div class="reminder-preview" data-design="${rule.design}" style="--reminder-color:${rule.color}"><span>予定のお知らせ</span><strong>${safe(rule.keyword || 'プレビュー')}</strong></div>
        ${rule.times.map((time, slot) => `<div class="reminder-time" data-reminder-slot="${slot}"><select data-field="daysBefore" aria-label="ルール${index + 1}の通知${slot + 1}の日"><option value="2" ${time.daysBefore === 2 ? 'selected' : ''}>前々日</option><option value="1" ${time.daysBefore === 1 ? 'selected' : ''}>前日</option><option value="0" ${time.daysBefore === 0 ? 'selected' : ''}>当日</option></select><input type="time" required data-field="time" aria-label="ルール${index + 1}の通知${slot + 1}の時刻" value="${time.time}"><button type="button" data-remove-time="${slot}" aria-label="通知${slot + 1}を削除">削除</button></div>`).join('')}
        <button type="button" data-add-time="${index}" ${rule.times.length >= 3 ? 'disabled' : ''}>通知日時を追加（最大3回）</button>
      </fieldset>`).join('') || '<p class="dialog-note">語句と通知日時を設定するルールを追加してください。</p>';
    $('addCalendarReminderRule').disabled = draft.rules.length >= 5;
  }
  $('calendarReminderRules').addEventListener('input', event => {
    const field = event.target.dataset.field;
    const container = event.target.closest('[data-reminder-rule]');
    if (!container || !field) return;
    const rule = draft.rules[Number(container.dataset.reminderRule)], slot = event.target.closest('[data-reminder-slot]');
    if (slot) rule.times[Number(slot.dataset.reminderSlot)][field] = field === 'daysBefore' ? Number(event.target.value) : event.target.value;
    else rule[field] = field === 'enabled' ? event.target.checked : event.target.value;
    const preview = container.querySelector('.reminder-preview');
    preview.style.setProperty('--reminder-color', rule.color); preview.dataset.design = rule.design;
    preview.querySelector('strong').textContent = rule.keyword || 'プレビュー';
    editorDirty = true;
  });
  $('calendarRemindersEnabled').addEventListener('change', event => { draft.enabled = event.target.checked; editorDirty = true; });
  $('addCalendarReminderRule').addEventListener('click', () => {
    if (draft.rules.length < 5) { draft.rules.push(makeRule()); editorDirty = true; renderEditor(); }
  });
  $('calendarReminderRules').addEventListener('click', event => {
    const button = event.target.closest('button'); if (!button) return;
    const container = button.closest('[data-reminder-rule]'); if (!container) return;
    const index = Number(container.dataset.reminderRule), rule = draft.rules[index];
    if (button.dataset.removeRule !== undefined) draft.rules.splice(index, 1);
    else if (button.dataset.removeTime !== undefined) rule.times.splice(Number(button.dataset.removeTime), 1);
    else if (button.dataset.addTime !== undefined && rule.times.length < 3) rule.times.push({ daysBefore: 0, time: '09:00' });
    else return;
    editorDirty = true; renderEditor();
  });
  // The main settings submit consumes this draft before persisting and syncing settings.
  window.MoriyaReminderEditor = {
    read: () => core.normalize(draft),
    validate: () => !draft.enabled ? '' : draft.rules.find(rule => rule.enabled && (!rule.keyword.trim() || !rule.times.length))
      ? '有効な通知ルールに、検索する語句と少なくとも1つの通知日時を設定してください。' : '',
  };
  document.addEventListener('moriya-settings-visibility', () => {
    if (!$('settingsDialog').hidden && !editorDirty) { draft = core.normalize(bridge.config()); renderEditor(); }
    if ($('settingsDialog').hidden) { editorDirty = false; draft = core.normalize(bridge.config()); renderEditor(); }
  });
  function position() {
    const stage = document.querySelector(settings.display.mode === 'classic' ? '.classic-signage' : '#newSignage');
    if (stage && sheet.parentElement !== stage) stage.append(sheet);
    sheet.classList.toggle('is-appliance-reminder', settings.display.mode === 'new' && settings.display.applianceMode);
  }
  function render(notices) {
    pending = notices;
    notices = demoNotices || pending;
    visible = notices;
    const next = JSON.stringify([Boolean(demoNotices), notices.map(item => [item.id, item.start, item.allDay, item.title, item.color, item.design])]);
    if (next === signature) return;
    signature = next;
    sheet.dataset.demo = String(Boolean(demoNotices));
    $('calendarReminderPopupStatus').textContent = '';
    if (!notices.length) {
      sheet.hidden = true; sheet.classList.remove('is-visible');
      if (sheet.contains(document.activeElement)) previousFocus?.focus?.({ preventScroll: true });
      return;
    }
    const groups = new Map();
    for (const item of notices) {
      if (!groups.has(item.eventKey)) groups.set(item.eventKey, { ...item, keywords: new Set() });
      groups.get(item.eventKey).keywords.add(item.keyword);
    }
    const first = notices[0];
    sheet.style.setProperty('--reminder-color', first.color);
    sheet.style.setProperty('--reminder-rgb', [1, 3, 5].map(offset => parseInt(first.color.slice(offset, offset + 2), 16)).join(','));
    sheet.dataset.design = first.design;
    list.innerHTML = [...groups.values()].map(item => `<li><time><span>${safe(new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', month: 'numeric', day: 'numeric', weekday: 'short' }).format(item.start))}</span><small>${item.allDay ? '終日' : safe(new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', hour12: false }).format(item.start))}</small></time><strong>${safe(item.title)}</strong></li>`).join('');
    if (sheet.hidden) {
      previousFocus = document.activeElement; sheet.hidden = false;
      requestAnimationFrame(() => sheet.classList.add('is-visible'));
      // Do not steal keyboard focus from the settings editor while it is open.
      if ($('settingsDialog').hidden) $('acknowledgeCalendarReminders').focus({ preventScroll: true });
    }
  }
  async function refresh() {
    const stamp = ++generation;
    position();
    const snapshot = bridge.snapshot(calendarCache);
    if (snapshot.freshText && snapshot.freshText.length <= 2 * 1024 * 1024
      && (calendarCache?.url !== snapshot.source || calendarCache?.text !== snapshot.freshText)) {
      calendarCache = { url: snapshot.source, text: snapshot.freshText };
      try { localStorage.setItem(cacheKey, JSON.stringify(calendarCache)); } catch { /* In-memory data still works. */ }
    }
    const candidates = core.collect(snapshot.config, snapshot.events, snapshot.now, snapshot.source);
    const garbage = bridge.garbageSnapshot?.();
    if (garbage) candidates.push(...core.collectGarbage(garbage.config, garbage.calendar, garbage.now));
    candidates.sort((a, b) => a.start - b.start || b.dueAt - a.dueAt);
    const notices = await Promise.all(candidates.map(async item => {
      if (!identities.has(item.key)) identities.set(item.key, core.identify(item.key));
      return { ...item, id: await identities.get(item.key) };
    }));
    if (stamp !== generation) return;
    const acknowledged = new Set(all.map(mark => mark.id));
    render(notices.filter(item => !acknowledged.has(item.id)));
    if (identities.size > 2000) identities.clear();
  }
  function requestRefresh() {
    void refresh().catch(() => { $('calendarReminderSyncStatus').textContent = '通知の確認に失敗しました。設定または端末の保存領域を確認してください。'; });
  }
  $('acknowledgeCalendarReminders').addEventListener('click', () => {
    if (demoNotices) { demoNotices = null; render(pending); requestRefresh(); return; }
    const at = Date.now(), additions = visible.map(item => ({ id: item.id, at, until: item.expiresAt }));
    try { persist(core.mergeMarks(own, additions), core.mergeMarks(all, additions)); }
    catch { $('calendarReminderPopupStatus').textContent = '確認を保存できませんでした。端末の空き容量を確認してください。'; return; }
    document.dispatchEvent(new Event('moriya-reminder-acknowledged'));
    requestRefresh();
  });
  $('showCalendarReminderDemo').addEventListener('click', () => {
    const snapshot = bridge.snapshot(calendarCache);
    const rule = core.normalize(bridge.config()).rules.find(rule => rule.enabled);
    const style = { color: rule?.color || '#56b8d6', design: rule?.design || 'glass' };
    const day = core.dayKey(snapshot.now);
    demoNotices = [
      { id: 'demo-one', eventKey: 'demo-one', start: new Date(day + 'T00:00:00+09:00'), allDay: true, title: '資源ごみの回収（デモ）', keyword: '', ...style },
      { id: 'demo-two', eventKey: 'demo-two', start: new Date(day + 'T16:00:00+09:00'), allDay: false, title: '打ち合わせ（デモ）', keyword: '', ...style },
    ];
    // A transient preview never creates acknowledgement IDs, writes storage or dispatches sync events.
    if (typeof closeSettings === 'function') closeSettings();
    position(); render(pending);
  });
  // No close button, outside-click, Escape or swipe dismissal. Only acknowledgement clears it.
  sheet.addEventListener('pointerdown', event => event.stopPropagation());
  sheet.addEventListener('click', event => event.stopPropagation());
  window.MoriyaCalendarReminders = {
    ownMarks: () => core.marks(own),
    mergeAcknowledgements(values) {
      const merged = core.mergeMarks(all, values);
      if (JSON.stringify(merged) !== JSON.stringify(all)) { persist(core.marks(own), merged); requestRefresh(); }
    }, refresh: requestRefresh,
  };
  document.addEventListener('moriya-tick', event => {
    const key = event.detail?.minuteKey;
    if (key !== sheet.dataset.minute) { sheet.dataset.minute = key; requestRefresh(); }
  });
  for (const type of ['moriya-calendar-data', 'moriya-settings-saved', 'moriya-settings-visibility'])
    document.addEventListener(type, () => {
      if (type === 'moriya-settings-saved' && (!editorDirty || JSON.stringify(core.normalize(bridge.config())) === JSON.stringify(core.normalize(draft)))) {
        editorDirty = false; draft = core.normalize(bridge.config()); renderEditor();
      }
      requestRefresh();
    });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) requestRefresh(); });
  document.addEventListener('moriya-reminder-sync-status', () => {
    const sync = window.MoriyaGithubSync;
    $('calendarReminderSyncStatus').textContent = sync?.reminderError ? `了解情報の同期待ち：${sync.reminderError}` : sync?.lastReminderSync ? '了解情報をGitHub経由で同期しています。' : 'GitHub接続時は、どの端末で了解しても全端末に反映します。';
  });
  renderEditor(); requestRefresh();
})();
