// Cookie consent + ads + cookieless analytics. Does nothing unless config/site.json sets adsenseClient / analyticsToken.
(function () {
  'use strict';
  var C = window.SITECFG || {};
  var KEY = 'digest.consent';
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* private mode */ } }
  function add(src, attrs) {
    var s = document.createElement('script'); s.src = src; s.async = true;
    Object.keys(attrs || {}).forEach(function (k) { s.setAttribute(k, attrs[k]); });
    document.head.appendChild(s);
  }
  if (C.analyticsToken) add('https://static.cloudflareinsights.com/beacon.min.js', { 'data-cf-beacon': JSON.stringify({ token: C.analyticsToken }), defer: '' });
  if (!C.adsenseClient) { window.Ads = { slot: function () { return null; } }; return; }

  var loaded = false;
  function loadAds() {
    if (loaded) return; loaded = true;
    add('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(C.adsenseClient), { crossorigin: 'anonymous' });
  }
  // Ad box for a given placement ('home' | 'list' | 'side'). Returns null when ads are off or not consented.
  window.Ads = {
    slot: function (kind) {
      var id = (C.adSlots || {})[kind];
      if (get() !== 'yes' || !id) return null;
      var wrap = document.createElement('div'); wrap.className = 'adbox';
      var tag = document.createElement('small'); tag.textContent = '広告'; wrap.appendChild(tag);
      var ins = document.createElement('ins'); ins.className = 'adsbygoogle'; ins.style.display = 'block';
      ins.setAttribute('data-ad-client', C.adsenseClient); ins.setAttribute('data-ad-slot', id);
      ins.setAttribute('data-ad-format', 'auto'); ins.setAttribute('data-full-width-responsive', 'true');
      wrap.appendChild(ins);
      setTimeout(function () { try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { /* blocked */ } }, 0);
      return wrap;
    }
  };

  function banner() {
    var old = document.getElementById('consent'); if (old) old.remove();
    var b = document.createElement('div'); b.id = 'consent'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-label', 'Cookieの設定');
    var p = document.createElement('p');
    p.appendChild(document.createTextNode('広告配信のためにCookieを使います。同意しない場合、広告は表示されません（サイトは同じように使えます）。詳しくは'));
    var a = document.createElement('a'); a.href = 'privacy.html'; a.textContent = 'プライバシーポリシー'; p.appendChild(a); p.appendChild(document.createTextNode('をご覧ください。'));
    var yes = document.createElement('button'); yes.type = 'button'; yes.className = 'btn'; yes.textContent = '同意する';
    var no = document.createElement('button'); no.type = 'button'; no.className = 'btn ghost'; no.textContent = '同意しない';
    function pick(v) { set(v); b.remove(); if (v === 'yes') { loadAds(); if (window.route) window.route(); } else if (window.route) window.route(); }
    yes.onclick = function () { pick('yes'); }; no.onclick = function () { pick('no'); };
    b.appendChild(p); var row = document.createElement('div'); row.className = 'row'; row.appendChild(no); row.appendChild(yes); b.appendChild(row);
    document.body.appendChild(b);
  }
  window.openConsent = banner;
  if (get() === 'yes') loadAds(); else if (get() !== 'no') banner();
})();
