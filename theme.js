// Theme switcher (loaded in <head> so the saved theme applies before first paint).
(function () {
  var THEMES = [['', '現在'], ['broadsheet', 'A 新聞'], ['datadesk', 'B データ'], ['quietdocs', 'C 静か']];
  var de = document.documentElement, KEY = 'digest.theme';
  function get() { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function apply(v) { if (v) de.setAttribute('data-theme', v); else de.removeAttribute('data-theme'); }
  apply(get());
  document.addEventListener('DOMContentLoaded', function () {
    var bar = document.querySelector('.bar'); if (!bar) return;
    var sel = document.createElement('select');
    sel.className = 'themesel'; sel.setAttribute('aria-label', 'デザイン');
    THEMES.forEach(function (t) { var o = document.createElement('option'); o.value = t[0]; o.textContent = t[1]; sel.appendChild(o); });
    sel.value = get();
    sel.addEventListener('change', function () { apply(sel.value); set(sel.value); });
    bar.appendChild(sel);
  });
})();
