(() => {
  'use strict';
  const core = window.MoriyaReminderCore, bridge = window.MoriyaCalendarReminderBridge;
  if (!core || !bridge?.garbageConfig) return;
  const $ = id => document.getElementById(id), dialog = $('garbageReminderDialog');
  const safe = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const categories = [...new Set(Object.values(window.MORIYA_GARBAGE_CALENDAR?.entries || {}).flat())];
  let draft, baseline, focusBefore;
  function render() {
    $('garbageRemindersEnabled').checked = draft.enabled;
    $('addGarbageReminderRule').disabled = draft.rules.length >= 3 || !categories.length;
    $('garbageReminderRules').innerHTML = draft.rules.map((rule, index) => `<fieldset class="reminder-rule" data-garbage-rule="${index}">
      <div class="reminder-rule-head"><strong>通知 ${index + 1}</strong><label class="checkbox-row"><input type="checkbox" data-field="enabled" ${rule.enabled ? 'checked' : ''}>有効</label><button type="button" data-remove-rule="${index}" aria-label="ごみ通知${index + 1}を削除">削除</button></div>
      <label><span>ごみの種類</span><select data-field="keyword" aria-label="ごみ通知${index + 1}の種類">${[...new Set([...categories, rule.keyword])].filter(Boolean).map(category => `<option value="${safe(category)}" ${category === rule.keyword ? 'selected' : ''}>${safe(category)}</option>`).join('')}</select></label>
      <div class="reminder-style-fields"><label><span>背景色</span><input type="color" data-field="color" aria-label="ごみ通知${index + 1}の色" value="${rule.color}"></label><label><span>デザイン</span><select data-field="design" aria-label="ごみ通知${index + 1}のデザイン">${[['glass','カラーガラス'],['solid','落ち着いた単色'],['outline','色付きライン']].map(([value,label]) => `<option value="${value}" ${rule.design === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label></div>
      ${rule.times.map((time, slot) => `<div class="reminder-time" data-garbage-slot="${slot}"><select data-field="daysBefore" aria-label="ごみ通知${index + 1}の通知${slot + 1}の日">${[[2,'前々日'],[1,'前日'],[0,'当日']].map(([value,label]) => `<option value="${value}" ${time.daysBefore === value ? 'selected' : ''}>${label}</option>`).join('')}</select><input type="time" required data-field="time" value="${time.time}" aria-label="ごみ通知${index + 1}の通知${slot + 1}の時刻"><button type="button" data-remove-time="${slot}" aria-label="ごみ通知${index + 1}の通知${slot + 1}を削除">削除</button></div>`).join('')}
      <button type="button" data-add-time ${rule.times.length >= 3 ? 'disabled' : ''}>日時を追加（最大3回）</button>
      </fieldset>`).join('') || '<p class="dialog-note">通知したいごみの種類を追加してください。</p>';
  }
  function close() { dialog.hidden = true; focusBefore?.focus?.({ preventScroll: true }); }
  $('garbageReminderSettingsButton').addEventListener('pointerdown', e => e.stopPropagation());
  $('garbageReminderSettingsButton').addEventListener('click', e => {
    e.stopPropagation(); focusBefore = document.activeElement;
    draft = core.normalizeGarbage(bridge.garbageConfig()); baseline = JSON.stringify(draft);
    $('garbageReminderEditorStatus').textContent = categories.length ? '' : 'ごみカレンダーのデータが見つかりません。';
    render(); dialog.hidden = false; $('closeGarbageReminderSettings').focus();
  });
  for (const id of ['closeGarbageReminderSettings', 'cancelGarbageReminderSettings']) $(id).addEventListener('click', close);
  dialog.addEventListener('pointerdown', e => e.stopPropagation());
  dialog.addEventListener('click', e => { e.stopPropagation(); });
  dialog.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    if (e.key === 'Tab') {
      const nodes = [...dialog.querySelectorAll('button:not(:disabled),input,select')];
      const first = nodes[0], last = nodes.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  $('garbageRemindersEnabled').addEventListener('change', e => { draft.enabled = e.target.checked; });
  $('addGarbageReminderRule').addEventListener('click', () => {
    if (draft.rules.length >= 3 || !categories.length) return;
    const category = categories.find(c => !draft.rules.some(rule => rule.keyword === c)) || categories[0];
    draft.rules.push({ id: 'garbage-' + crypto.randomUUID(), enabled: true, keyword: category, color: '#56b8d6', design: 'glass', times: [{ daysBefore: 1, time: '21:00' }, { daysBefore: 0, time: '07:00' }] });
    draft.enabled = true; render();
  });
  $('garbageReminderRules').addEventListener('input', e => {
    const container = e.target.closest('[data-garbage-rule]');
    if (!container || !e.target.dataset.field) return;
    const rule = draft.rules[Number(container.dataset.garbageRule)], slot = e.target.closest('[data-garbage-slot]'), field = e.target.dataset.field;
    if (slot) rule.times[Number(slot.dataset.garbageSlot)][field] = field === 'daysBefore' ? Number(e.target.value) : e.target.value;
    else rule[field] = field === 'enabled' ? e.target.checked : e.target.value;
  });
  $('garbageReminderRules').addEventListener('click', e => {
    const button = e.target.closest('button'), container = button?.closest('[data-garbage-rule]');
    if (!container) return;
    const index = Number(container.dataset.garbageRule), rule = draft.rules[index];
    if (button.dataset.removeRule !== undefined) draft.rules.splice(index, 1);
    else if (button.dataset.removeTime !== undefined) rule.times.splice(Number(button.dataset.removeTime), 1);
    else if (button.hasAttribute('data-add-time') && rule.times.length < 3) rule.times.push({ daysBefore: 0, time: '07:00' });
    render();
  });
  $('garbageReminderForm').addEventListener('submit', e => {
    e.preventDefault();
    const status = $('garbageReminderEditorStatus');
    if (draft.enabled && draft.rules.some(rule => rule.enabled && (!rule.keyword || !rule.times.length))) { status.textContent = '有効な通知には、ごみの種類と通知日時を1つ以上設定してください。'; return; }
    if (baseline !== JSON.stringify(core.normalizeGarbage(bridge.garbageConfig()))) { status.textContent = '他端末などで設定が変更されました。一度閉じて開き直してください。'; return; }
    try { bridge.saveGarbage(draft); close(); window.MoriyaCalendarReminders?.refresh(); }
    catch { status.textContent = '保存できませんでした。端末の空き容量を確認してください。'; }
  });
})();
