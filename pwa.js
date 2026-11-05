// Registers the service worker so the site can be installed as an app (home-screen icon, full screen, offline copy of visited pages).
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
}
