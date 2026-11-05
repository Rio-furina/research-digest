// Header search box (all pages). Sends the word to the home search through the URL hash (#search=...), so nothing is sent to a server.
(function () {
  var forms = document.querySelectorAll('form.hsearch');
  Array.prototype.forEach.call(forms, function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = (f.elements.q.value || '').trim();
      var hash = q ? '#search=' + encodeURIComponent(q) : '#home';
      if (f.hasAttribute('data-app')) {
        if (location.hash === hash && window.route) window.route(); else location.hash = hash;
      } else {
        location.href = (f.getAttribute('data-home') || './') + hash;
      }
    });
  });
})();
