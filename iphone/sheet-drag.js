(() => {
  "use strict";
  function shouldDismiss({ distance, peak, velocity, height }) {
    // Reversing toward the top always wins over distance or a previous flick.
    if (peak - distance > 8 || velocity < -.05) return false;
    return distance >= Math.min(160, Math.max(80, height * .18)) || (distance >= 40 && velocity > .65);
  }
  function attach(header, sheet, overlay, dismiss) {
    let gesture = null, frame = 0;
    const scrim = overlay.querySelector('.overlay-scrim');
    const paint = () => {
      frame = 0;
      if (!gesture) return;
      sheet.style.setProperty('--drag-offset', `${gesture.distance}px`);
      scrim.style.opacity = String(Math.max(0, 1 - gesture.distance / gesture.height));
    };
    function reset() {
      cancelAnimationFrame(frame); frame = 0;
      const pointerId = gesture?.id; gesture = null;
      if (pointerId != null && header.hasPointerCapture(pointerId)) header.releasePointerCapture(pointerId);
      sheet.classList.remove('is-dragging', 'is-dismissing');
      sheet.style.removeProperty('--drag-offset'); sheet.style.removeProperty('--dismiss-distance');
      scrim.style.removeProperty('opacity');
    }
    header.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0 || event.target.closest('button, input, a') || !overlay.classList.contains('is-open') || gesture) return;
      reset();
      gesture = { id:event.pointerId, start:event.clientY, last:event.clientY, at:event.timeStamp, distance:0, peak:0, velocity:0, height:sheet.getBoundingClientRect().height };
      sheet.classList.add('is-dragging');
      header.setPointerCapture(event.pointerId);
    });
    function move(event) {
      if (!gesture || event.pointerId !== gesture.id) return;
      const delta = event.clientY - gesture.last;
      if (delta !== 0) gesture.velocity = delta / Math.max(1, event.timeStamp - gesture.at);
      gesture.last = event.clientY; gesture.at = event.timeStamp;
      gesture.distance = Math.max(0, event.clientY - gesture.start);
      gesture.peak = Math.max(gesture.peak, gesture.distance);
      if (!frame) frame = requestAnimationFrame(paint);
    }
    header.addEventListener('pointermove', move);
    function finish(event, cancelled = false) {
      if (!gesture || event.pointerId !== gesture.id) return;
      // Ignore stale flick velocity when the finger pauses before release.
      const paused = event.timeStamp - gesture.at > 100;
      move(event); cancelAnimationFrame(frame); paint();
      const close = !cancelled && shouldDismiss({...gesture, velocity:paused ? 0 : gesture.velocity});
      const pointerId = gesture.id, height = gesture.height;
      gesture = null;
      if (header.hasPointerCapture(pointerId)) header.releasePointerCapture(pointerId);
      sheet.classList.remove('is-dragging');
      if (close) {
        sheet.style.setProperty('--dismiss-distance', `${height + 60}px`);
        sheet.classList.add('is-dismissing'); scrim.style.opacity = '0'; dismiss();
      } else {
        sheet.style.removeProperty('--drag-offset'); scrim.style.removeProperty('opacity');
      }
    }
    header.addEventListener('pointerup', event => finish(event));
    header.addEventListener('pointercancel', event => finish(event, true));
    header.addEventListener('lostpointercapture', event => { if (gesture?.id === event.pointerId) finish(event, true); });
    return {reset};
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {shouldDismiss, attach};
  else window.MORIYA_SHEET_DRAG = {shouldDismiss, attach};
})();
