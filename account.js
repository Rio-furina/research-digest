// Account: sign-in (Google / email) and per-user cloud copy of "My page" data, via Supabase REST (no library, no inline script).
// Active only when config/site.json has supabaseUrl + supabaseAnonKey (public build). Otherwise window.Acct.enabled is false.
(function () {
  'use strict';
  var C = window.SITECFG || {};
  var A = window.Acct = { enabled: false, recovery: false, notice: '' };
  if (!C.supabaseUrl || !C.supabaseAnonKey) return;
  A.enabled = true;
  var URL_ = C.supabaseUrl.replace(/\/+$/, ''), KEY = C.supabaseAnonKey, SK = 'digest.session';
  var sess = null;

  function load() { try { sess = JSON.parse(localStorage.getItem(SK) || 'null'); } catch (e) { sess = null; } }
  function store(s) { sess = s; try { if (s) localStorage.setItem(SK, JSON.stringify(s)); else localStorage.removeItem(SK); } catch (e) { /* private mode */ } }
  function fromTokens(o) {
    var exp = o.expires_at ? o.expires_at : Math.floor(Date.now() / 1000) + (+o.expires_in || 3600);
    return { access_token: o.access_token, refresh_token: o.refresh_token, expires_at: exp, user: o.user || (sess && sess.user) || null };
  }
  function parseJwt(t) { try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); } catch (e) { return {}; } }

  function api(method, path, body, opt) {
    opt = opt || {};
    var h = { apikey: KEY, 'Content-Type': 'application/json' };
    h.Authorization = 'Bearer ' + (opt.anon ? KEY : (sess ? sess.access_token : KEY));
    if (opt.prefer) h.Prefer = opt.prefer;
    return fetch(URL_ + path, { method: method, headers: h, body: body ? JSON.stringify(body) : undefined }).then(function (r) {
      return r.text().then(function (t) {
        var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = null; }
        if (!r.ok) { var m = (j && (j.msg || j.message || j.error_description || j.error)) || ('HTTP ' + r.status); var err = new Error(m); err.status = r.status; throw err; }
        return j;
      });
    });
  }
  // Refresh shortly before expiry. Resolves even when offline (keeps the old session).
  function fresh() {
    if (!sess) return Promise.resolve();
    if (sess.expires_at - 60 > Date.now() / 1000) return Promise.resolve();
    return api('POST', '/auth/v1/token?grant_type=refresh_token', { refresh_token: sess.refresh_token }, { anon: true }).then(function (j) {
      store(fromTokens(j));
    }, function (e) { if (e.status === 400 || e.status === 401) store(null); });
  }
  function redirectUrl() { return location.origin + location.pathname; }

  // Returning from Google / email link: tokens arrive in the URL fragment.
  load();
  (function takeHash() {
    var hs = location.hash || '';
    if (hs.indexOf('access_token=') < 0 && hs.indexOf('error=') < 0) return;
    var p = {}; hs.replace(/^#/, '').split('&').forEach(function (kv) { var i = kv.indexOf('='); if (i > 0) p[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(kv.slice(i + 1).replace(/\+/g, ' ')); });
    if (p.access_token) {
      var claims = parseJwt(p.access_token);
      store(fromTokens({ access_token: p.access_token, refresh_token: p.refresh_token, expires_in: p.expires_in, expires_at: p.expires_at, user: { id: claims.sub, email: claims.email } }));
      if (p.type === 'recovery') A.recovery = true;
    } else if (p.error) A.notice = 'ログインできませんでした（' + (p.error_description || p.error) + '）';
    try { history.replaceState(null, '', location.pathname + location.search + '#my'); } catch (e) { location.hash = '#my'; }
  })();

  A.ready = fresh();
  A.user = function () { return sess && sess.user ? sess.user : null; };
  A.signInGoogle = function () { location.href = URL_ + '/auth/v1/authorize?provider=google&redirect_to=' + encodeURIComponent(redirectUrl()); };
  A.signUp = function (email, pw) {
    return api('POST', '/auth/v1/signup?redirect_to=' + encodeURIComponent(redirectUrl()), { email: email, password: pw }, { anon: true }).then(function (j) {
      if (j && j.access_token) { store(fromTokens(j)); return 'in'; }
      return 'mail';
    });
  };
  A.signIn = function (email, pw) {
    return api('POST', '/auth/v1/token?grant_type=password', { email: email, password: pw }, { anon: true }).then(function (j) { store(fromTokens(j)); });
  };
  A.reset = function (email) { return api('POST', '/auth/v1/recover?redirect_to=' + encodeURIComponent(redirectUrl()), { email: email }, { anon: true }); };
  A.setPassword = function (pw) { return fresh().then(function () { return api('PUT', '/auth/v1/user', { password: pw }); }); };
  A.signOut = function () {
    var done = function () { store(null); };
    return (sess ? api('POST', '/auth/v1/logout').then(done, done) : Promise.resolve());
  };
  // Cloud copy: one row per user (RLS limits it to the owner). pull() -> {data, updated_at} | null.
  A.pull = function () {
    return fresh().then(function () {
      if (!sess) return null;
      return api('GET', '/rest/v1/user_data?select=data,updated_at&limit=1').then(function (rows) { return rows && rows[0] ? rows[0] : null; });
    });
  };
  A.push = function (data) {
    return fresh().then(function () {
      if (!sess || !sess.user) return;
      return api('POST', '/rest/v1/user_data?on_conflict=user_id', { user_id: sess.user.id, data: data, updated_at: new Date().toISOString() }, { prefer: 'resolution=merge-duplicates,return=minimal' });
    });
  };
  A.deleteAccount = function () {
    return fresh().then(function () { return api('POST', '/rest/v1/rpc/delete_my_account', {}); }).then(function () { store(null); });
  };
})();

// Views: counts clicks on report links (once per report per browser per day) and reads the ranking. Stores no personal data.
(function () {
  'use strict';
  var C = window.SITECFG || {}, V = window.Views = { enabled: false, hit: function () {}, top: function () { return Promise.resolve([]); } };
  if (!C.supabaseUrl || !C.supabaseAnonKey || !/^https?:$/.test(location.protocol)) return;
  var U = C.supabaseUrl.replace(/\/+$/, ''), K = C.supabaseAnonKey;
  function rpc(fn, body) {
    return fetch(U + '/rest/v1/rpc/' + fn, { method: 'POST', headers: { apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true })
      .then(function (r) { return r.ok ? r.text().then(function (t) { return t ? JSON.parse(t) : null; }) : null; }, function () { return null; });
  }
  V.enabled = true;
  V.hit = function (kind, id) {
    var key = 'digest.v.' + kind + '.' + id, day = new Date().toISOString().slice(0, 10);
    try { if (localStorage.getItem(key) === day) return; localStorage.setItem(key, day); } catch (e) { /* private mode: count anyway */ }
    rpc('hit', { p_kind: kind, p_id: String(id) });
  };
  V.top = function (kind, days, limit) { return rpc('top_views', { p_kind: kind, p_days: days, p_limit: limit || 5 }).then(function (j) { return j || []; }); };
})();
