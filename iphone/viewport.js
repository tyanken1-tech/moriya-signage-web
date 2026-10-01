(() => {
  "use strict";
  // iOS standalone visualViewport may omit the home-indicator strip even with
  // viewport-fit=cover. Only standalone mode may use the physical CSS screen.
  function measure({ innerHeight, clientHeight, visualHeight, screenHeight, standalone, keyboard }) {
    const layout = innerHeight || clientHeight || 0;
    const visible = visualHeight || layout;
    const surface = Math.max(layout, standalone ? screenHeight || 0 : 0);
    return { surface, content: keyboard ? visible : surface };
  }
  if (typeof module !== "undefined" && module.exports) module.exports = measure;
  else window.MORIYA_MOBILE_VIEWPORT = measure;
})();
