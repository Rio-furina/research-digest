// Applies the saved colour choice (light / dark) before the page paints. No saved choice = follow the device.
(function () {
  try { var v = localStorage.getItem('digest.color'); if (v === 'light' || v === 'dark') document.documentElement.setAttribute('data-color', v); } catch (e) { /* private mode */ }
})();
// Installed-app mode (home-screen app): mark the page so the phone layout can use app-style navigation. ?app=1 previews it in a browser.
(function () {
  try {
    var m = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    if (m || navigator.standalone === true || /[?&]app=1\b/.test(location.search)) document.documentElement.classList.add('app');
  } catch (e) { /* ignore */ }
})();
