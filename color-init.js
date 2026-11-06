// Applies the saved colour choice (light / dark) before the page paints. No saved choice = follow the device.
(function () {
  try { var v = localStorage.getItem('digest.color'); if (v === 'light' || v === 'dark') document.documentElement.setAttribute('data-color', v); } catch (e) { /* private mode */ }
})();
