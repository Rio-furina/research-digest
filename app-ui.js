// App mode only: adds a "More" button to the bottom bar, opening a small sheet with the less-used pages.
(function () {
  if (!document.documentElement.classList.contains('app')) return;
  var nav = document.getElementById('tabs'); if (!nav) return;
  var sheet = null;
  function close() { if (sheet) { sheet.remove(); sheet = null; } }
  function open() {
    close();
    sheet = document.createElement('div'); sheet.className = 'moresheet'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-label', 'その他のページ');
    [['#reports', 'レポート'], ['#notes', 'ノート'], ['#about', '使い方・このサイトについて'], ['privacy.html', 'プライバシーポリシー'], ['terms.html', '利用規約'], ['contact.html', 'お問い合わせ'], ['message.html', '制作者から一言']].forEach(function (x) {
      var a = document.createElement('a'); a.href = x[0]; a.textContent = x[1]; a.addEventListener('click', close); sheet.appendChild(a);
    });
    document.body.appendChild(sheet);
  }
  function addBtn() {
    if (nav.querySelector('.morebtn')) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'morebtn'; b.textContent = 'その他';
    b.addEventListener('click', function (e) { e.stopPropagation(); if (sheet) close(); else open(); });
    nav.appendChild(b);
  }
  document.addEventListener('click', function (e) { if (sheet && !e.target.closest('.moresheet')) close(); });
  window.addEventListener('hashchange', close);
  new MutationObserver(addBtn).observe(nav, { childList: true });
  addBtn();
})();
