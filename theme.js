// Theme switcher (loaded in <head> so the saved theme applies before first paint).
(function () {
  var THEMES = [['', '現在'], ['datadesk', 'B データ'], ['quietdocs', 'C 静か'], ['front', 'D 一面'], ['margin', 'E 余白'], ['ledger', 'F 索引'], ['pop', 'G ポップ'], ['rank', 'H ランク'], ['warm', 'I ウォーム']];
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
// A card opens and closes on click (outside links and buttons); the new themes hide secondary text until it is open.
document.addEventListener('click', function (ev) {
  if (ev.target.closest('a, button, summary, input, select, textarea, label')) return;
  var c = ev.target.closest('.card'); if (!c || c.classList.contains('tpbox') || c.closest('.filters')) return;
  c.classList.toggle('open');
});
