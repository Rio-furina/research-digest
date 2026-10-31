// A card opens and closes on click (outside links and buttons); the design shows only the headline until it is open.
document.addEventListener('click', function (ev) {
  if (ev.target.closest('a, button, summary, input, select, textarea, label')) return;
  var c = ev.target.closest('.card'); if (!c || c.classList.contains('tpbox') || c.closest('.filters')) return;
  c.classList.toggle('open');
});
