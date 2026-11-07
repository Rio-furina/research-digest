// "Helpful" button for static pages. Shows only when the Supabase functions exist (see supabase/helpful.sql). Counts only; one vote per browser per page.
(function () {
  'use strict';
  var box = document.getElementById('helpful'), C = window.SITECFG || {};
  if (!box || !C.supabaseUrl || !C.supabaseAnonKey || !/^https?:$/.test(location.protocol)) return;
  var U = C.supabaseUrl.replace(/\/+$/, ''), K = C.supabaseAnonKey, kind = box.getAttribute('data-kind'), id = box.getAttribute('data-id');
  var en = false; try { en = localStorage.getItem('digest.lang') === 'en'; } catch (e) {}
  var T = en ? { b: 'Helpful', d: 'Thanks for your feedback' } : { b: '\u5f79\u306b\u7acb\u3063\u305f', d: '\u3042\u308a\u304c\u3068\u3046\u3054\u3056\u3044\u307e\u3059' };
  var key = 'digest.helpful.' + kind + '.' + id, voted = false;
  try { voted = localStorage.getItem(key) === '1'; } catch (e) {}
  function rpc(fn) {
    return fetch(U + '/rest/v1/rpc/' + fn, { method: 'POST', headers: { apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_kind: kind, p_id: id }) })
      .then(function (r) { return r.ok ? r.json() : null; }, function () { return null; });
  }
  rpc('helpful_count').then(function (n) {
    if (typeof n !== 'number') return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'btn';
    function draw() { b.textContent = (voted ? '\u2713 ' : '') + T.b + ' (' + n + ')'; b.disabled = voted; }
    b.onclick = function () {
      if (voted) return; voted = true; n += 1; draw();
      try { localStorage.setItem(key, '1'); } catch (e) {}
      rpc('helpful_vote');
      var s = document.createElement('small'); s.textContent = '\u3000' + T.d; box.appendChild(s);
    };
    draw(); box.appendChild(b);
  });
})();
