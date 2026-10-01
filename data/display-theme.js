(() => {
  "use strict";
  // Shared photo choices and glass transparency math for signage and mobile.
  const groups = [
    ["sunnyBackgroundTheme", "晴れ・木漏れ日", [["sunny-komorebi-color.webp", "鮮やかな緑"], ["sunny-komorebi-1.webp", "森の小径"], ["sunny-komorebi-2.webp", "光芒の森"], ["sunny-komorebi-3.webp", "静かな木立"], ["sunny-komorebi-4.webp", "朝の新緑"], ["sunny-komorebi-5.webp", "金色の小径"], ["sunny-komorebi-6.webp", "深い木立の光"]]],
    ["cloudyBackgroundTheme", "曇り", [["cloudy-forest-1.webp", "霧の山林"], ["cloudy-forest-2.webp", "雲の谷"], ["cloudy-forest-3.webp", "雨を待つ空"], ["cloudy-forest-4.webp", "白い山霧"], ["cloudy-forest-5.webp", "静かな稜線"]]],
    ["rainBackgroundTheme", "雨", [["rain-window-1.webp", "緑と水滴"], ["rain-window-2.webp", "大粒の水滴"], ["rain-window-3.webp", "新緑の雨窓"], ["rain-window-4.webp", "雨の日の車窓"], ["rain-window-5.webp", "深い雨粒"]]],
    ["nightClearBackgroundTheme", "晴れた夜", [["night-clear-milkyway.webp", "輝く天の川"], ["night-clear-1.webp", "星と流星"], ["night-clear-2.webp", "星空と森"], ["night-clear-3.webp", "紫紺の星空"], ["night-clear-4.webp", "月明かりの森"], ["night-clear-5.webp", "星雲の地平"]]],
    ["nightCloudyBackgroundTheme", "曇った夜", [["night-cloudy-1.webp", "雲間の月"], ["night-cloudy-2.webp", "月明かりの雲"], ["night-cloudy-3.webp", "満月と厚い雲"], ["night-cloudy-4.webp", "青い月夜"], ["night-cloudy-5.webp", "霧と月光"]]],
    ["nightRainBackgroundTheme", "雨の夜", [["night-rain-1.webp", "青い街の水滴"], ["night-rain-2.webp", "夜景の水滴"], ["night-rain-3.webp", "金色の雨街"], ["night-rain-4.webp", "青い光の雨粒"], ["night-rain-5.webp", "遠い街の雨"]]],
  ];
  function applyTransparency(value, root = document.documentElement) {
    const numeric = Number(value);
    const transparency = Math.min(100, Math.max(80, Number.isFinite(numeric) ? numeric : 87));
    const alpha = (100 - transparency) / 100;
    for (const [key, amount] of Object.entries({
      "--rich-glass-alpha": alpha,
      "--rich-glass-alpha-soft": alpha * .269,
      "--rich-glass-alpha-dark": Math.min(.7, alpha * 1.538),
      "--rich-glass-base-alpha": Math.min(.58, alpha * 1.231),
      "--rich-glass-sheet-alpha": Math.min(.48, alpha * .81),
    })) root.style.setProperty(key, amount.toFixed(3));
    return transparency;
  }
  function isDayTime(minute, dayStart, nightStart) {
    const toMinutes = (value) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
    const start = toMinutes(dayStart); const end = toMinutes(nightStart);
    return start < end ? minute >= start && minute < end : minute >= start || minute < end;
  }
  window.MORIYA_DISPLAY_THEME = { groups, applyTransparency, isDayTime };
})();
