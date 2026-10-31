(function () {
  'use strict';
  var D = window.DIGEST;
  var app = document.getElementById('app');
  var PUBLIC = !!(D && D.public);   // public build: read-only (no notes, no AI, no local API)
  var TABS = [['home', 'ホーム'], ['events', '出来事'], ['articles', '記事'], ['reports', 'レポート'], ['notes', 'ノート'], ['about', '使い方']]
    .filter(function (t) { return !(PUBLIC && t[0] === 'notes'); });
  var WD = ['日', '月', '火', '水', '木', '金', '土'];

  // ---------------------------------------------------------------- helpers
  function lsGet(k) { try { return localStorage.getItem('digest.' + k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem('digest.' + k, v); } catch (e) { /* ignore */ } }

  function add(e, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { add(e, x); }); return; }
    e.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
  function h(tag, attrs) {
    var e = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === 'class') e.className = v;
        else if (k.indexOf('on') === 0) e.addEventListener(k.slice(2), v);
        else e.setAttribute(k, v === true ? '' : v);
      });
    }
    for (var i = 2; i < arguments.length; i++) add(e, arguments[i]);
    return e;
  }
  function safeUrl(u) { return /^https?:\/\//i.test(u || '') ? u : '#'; }
  function domain(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } }
  function link(href, text, cls) { return h('a', { href: safeUrl(href), target: '_blank', rel: 'noopener noreferrer', referrerpolicy: 'no-referrer', 'class': cls }, text); }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(d) { return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); }
  function daysAgo(n) { var d = new Date(); d.setDate(d.getDate() - n); return ymd(d); }
  function parseYmd(s) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; }
  function fmtDate(s) {
    var d = parseYmd(s); if (!d) return s || '日付不明';
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日（' + WD[d.getDay()] + '）';
  }
  function daysBetween(a, b) { var x = parseYmd(a), y = parseYmd(b); return x && y ? Math.round((x - y) / 86400000) : 0; }
  function fmtTime(iso) { var d = new Date(iso); return isNaN(d) ? '' : ymd(d) + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()); }

  if (!D) { app.textContent = 'data.js が見つかりません。scripts\\build.ps1 を実行してください。'; return; }
  document.title = D.site.title;
  document.getElementById('brand').textContent = D.site.title;

  var byId = {}, catName = {}, levels = {}, scopes = {};
  D.articles.forEach(function (a) { byId[a.id] = a; });
  D.categories.forEach(function (c) { catName[c.id] = c.name; });
  D.levels.forEach(function (l) { levels[l.id] = l; });
  D.scopes.forEach(function (s) { scopes[s.id] = s; });
  function adate(a) { return a.date || a.added; }

  var state = { cat: 'all', level: 'all', scope: 'all', lang: 'all', mode: 'all', src: 'all', period: '30', year: '', month: '', tps: [], q: '', view: lsGet('view') || 'list', limit: 60, nq: '', nkind: 'all' };

  // ---------------------------------------------------------------- notes storage
  // Saved to data\notes.json when the site is opened through start.cmd (local server); otherwise in this browser only.
  var Store = (function () {
    var notes = {}, mode = 'local', timer = null, listeners = [];
    function status(s) { listeners.forEach(function (f) { f(s, mode); }); }
    function list() { return Object.keys(notes).map(function (k) { return notes[k]; }); }
    function localSave() { try { localStorage.setItem('digest.notes', JSON.stringify({ notes: list() })); } catch (e) { /* ignore */ } }
    function localLoad() { try { return (JSON.parse(localStorage.getItem('digest.notes') || '{}').notes) || []; } catch (e) { return []; } }
    function init() {
      if (PUBLIC) return Promise.resolve();
      if (location.protocol === 'file:') { localLoad().forEach(function (n) { notes[n.id] = n; }); return Promise.resolve(); }
      return fetch('api/notes', { headers: { 'X-Digest': '1' }, cache: 'no-store' })
        .then(function (r) { if (!r.ok) throw new Error('no api'); return r.json(); })
        .then(function (j) {
          mode = 'server';
          (j.notes || []).forEach(function (n) { notes[n.id] = n; });
          // notes written earlier in this browser (before the server was used) are kept, not lost
          localLoad().forEach(function (n) { if (!notes[n.id]) { notes[n.id] = n; } });
        })
        .catch(function () { mode = 'local'; localLoad().forEach(function (n) { notes[n.id] = n; }); });
    }
    function flush() {
      status('saving'); localSave();
      if (mode !== 'server') { status('saved'); return; }
      fetch('api/notes', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Digest': '1' }, body: JSON.stringify({ notes: list() }) })
        .then(function (r) { if (!r.ok) throw new Error('save failed'); status('saved'); })
        .catch(function () { status('error'); });
    }
    function touch(n) { n.updated = new Date().toISOString(); clearTimeout(timer); timer = setTimeout(flush, 700); status('dirty'); }
    function create(o) {
      var now = new Date().toISOString();
      var n = { id: 'n_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), aid: '', aTitle: '', aUrl: '', aSrc: '', title: '', unclear: '', learned: '', todo: '', body: '', ai: [], created: now, updated: now };
      Object.keys(o || {}).forEach(function (k) { n[k] = o[k]; });
      notes[n.id] = n; touch(n); return n;
    }
    function remove(id) { delete notes[id]; clearTimeout(timer); flush(); }
    function merge(arr) {
      var c = 0;
      (arr || []).forEach(function (n) { if (n && n.id && (!notes[n.id] || (notes[n.id].updated || '') < (n.updated || ''))) { notes[n.id] = n; c++; } });
      if (c) flush();
      return c;
    }
    return { init: init, get: function (id) { return notes[id]; }, list: list, create: create, touch: touch, remove: remove, merge: merge, onStatus: function (f) { listeners.push(f); }, mode: function () { return mode; } };
  })();

  var statusEl = h('div', { id: 'status', role: 'status', 'aria-live': 'polite', hidden: true });
  document.body.appendChild(statusEl);
  var statusTimer = null;
  Store.onStatus(function (s, mode) {
    var t = { dirty: '入力中…', saving: '保存中…', saved: mode === 'server' ? '保存しました（data\\notes.json）' : '保存しました（このブラウザ内）', error: '保存に失敗しました' }[s] || '';
    statusEl.textContent = t; statusEl.className = s === 'error' ? 'err' : '';
    statusEl.hidden = !t;
    clearTimeout(statusTimer);
    if (s === 'saved') { statusTimer = setTimeout(function () { statusEl.hidden = true; }, 2500); renderSide(); }
  });

  // ---------------------------------------------------------------- AI (OpenAI-compatible / Anthropic, or copy a prompt)
  var PRESETS = {
    openai: { label: 'OpenAI', style: 'openai', base: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
    deepseek: { label: 'DeepSeek', style: 'openai', base: 'https://api.deepseek.com', model: 'deepseek-chat' },
    anthropic: { label: 'Anthropic (Claude)', style: 'anthropic', base: 'https://api.anthropic.com/v1', model: 'claude-haiku-5-5' },
    custom: { label: 'その他（OpenAI互換API）', style: 'openai', base: '', model: '' }
  };
  function aiConf() {
    try { var c = JSON.parse(lsGet('ai') || 'null'); if (c && c.provider) return c; } catch (e) { /* ignore */ }
    return { provider: 'openai', base: PRESETS.openai.base, model: PRESETS.openai.model, key: '' };
  }
  function aiReady() { var c = aiConf(); return !!(c.key && c.base && c.model); }
  var SYSTEM = 'あなたは経済を学ぶ人の家庭教師です。日本語で、経済学部の学生にも伝わるよう簡潔に答えてください。' +
    '記事に書かれていない事実を断定しないでください。推測は「推測」と明記し、歴史的な事実や数値は確かなものだけを挙げ、不確かなときはそう書いてください。';
  function callAI(user) {
    var c = aiConf(), style = (PRESETS[c.provider] || PRESETS.custom).style, base = c.base.replace(/\/+$/, '');
    var req;
    if (style === 'anthropic') {
      req = fetch(base + '/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': c.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: c.model, max_tokens: 1500, system: SYSTEM, messages: [{ role: 'user', content: user }] }) });
    } else {
      req = fetch(base + '/chat/completions', { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + c.key },
        body: JSON.stringify({ model: c.model, temperature: 0.3, messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: user }] }) });
    }
    return req.then(function (r) {
      return r.text().then(function (t) {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + t.slice(0, 200));
        var j = JSON.parse(t);
        var out = style === 'anthropic' ? (j.content && j.content[0] && j.content[0].text) : (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content);
        if (!out) throw new Error('応答が空です');
        return out;
      });
    });
  }
  var KINDS = [['ask', '質問する'], ['organize', 'ノートを整理する'], ['research', '次に調べることを提案'], ['quiz', '理解度チェック']];
  function noteText(n) {
    if (!n) return '（ノートはまだ空です）';
    var parts = [];
    if (n.title) parts.push('【メモの題】' + n.title);
    if (n.body) parts.push('【メモ】\n' + n.body);
    if (n.unclear) parts.push('【わからないところ】\n' + n.unclear);
    if (n.learned) parts.push('【学んだこと】\n' + n.learned);
    if (n.todo) parts.push('【もっと調べたいこと】\n' + n.todo);
    return parts.length ? parts.join('\n\n') : '（ノートはまだ空です）';
  }
  function buildUser(kind, ctx, n, q) {
    var base = (ctx ? '【記事の情報】\n' + ctx + '\n\n' : '') + '【私のノート】\n' + noteText(n) + '\n\n';
    if (kind === 'ask') return base + '【質問】\n' + (q || '（質問が空です。ノートの「わからないところ」に答えてください）');
    if (kind === 'organize') return base + '【依頼】ノートの内容を、(1)要点 (2)まだ曖昧な点 (3)次にやること、の3つに整理してください。ノートに無いことは足さないでください。';
    if (kind === 'research') return base + '【依頼】このテーマで次に調べるとよいことを5つ、それぞれ「理由」と「検索キーワード」を付けて挙げてください。あわせて、関連する経済学の概念を3つ、似た過去の事例を1〜2つ（年と事実が確かなものだけ）示してください。';
    return base + '【依頼】理解度を確かめる記述式の問題を3問作ってください。最後に「解答例」をまとめて書いてください。';
  }
  function copyText(text, onDone) {
    function fallback() { var t = h('textarea', { 'class': 'offscreen' }); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); onDone(true); } catch (e) { onDone(false); } t.remove(); }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(function () { onDone(true); }, fallback); else fallback();
  }

  // getNote(create) -> note object; ctx -> article description for the prompt
  function aiPanel(getNote, ctx) {
    var kind = h('select', { 'class': 'field', 'aria-label': 'AIへの依頼' }, KINDS.map(function (k) { return h('option', { value: k[0] }, k[1]); }));
    var q = h('input', { 'class': 'field', type: 'text', placeholder: '質問を書く（例：この「実質賃金」はなぜ下がる？）', 'aria-label': '質問' });
    var out = h('div', { 'class': 'ai-out' });
    var msg = h('div', { 'class': 'sub' });
    var ask = h('button', { 'class': 'btn', type: 'button' }, 'AIに聞く');
    var cp = h('button', { 'class': 'btn ghost', type: 'button' }, 'プロンプトをコピー');
    function sync() { q.hidden = kind.value !== 'ask'; ask.disabled = !aiReady(); ask.title = aiReady() ? '' : 'ノートタブの「AI設定」でAPIキーを設定してください'; }
    function render() {
      out.textContent = '';
      var n = getNote(false); var arr = (n && n.ai) || [];
      arr.slice().reverse().forEach(function (r, i) {
        var idx = arr.length - 1 - i;
        out.appendChild(h('div', { 'class': 'ai-item' },
          h('div', { 'class': 'sub' }, (KINDS.filter(function (k) { return k[0] === r.k; })[0] || ['', r.k])[1] + (r.q ? '：' + r.q : '') + '　' + fmtTime(r.at) + '　',
            h('button', { 'class': 'tag', type: 'button', onclick: function () { var nn = getNote(true); nn.ai.splice(idx, 1); Store.touch(nn); render(); } }, '削除')),
          h('div', { 'class': 'ai-text' }, r.a)));
      });
    }
    kind.addEventListener('change', sync);
    ask.addEventListener('click', function () {
      var n = getNote(true); var question = q.value.trim();
      if (kind.value === 'ask' && !question && !n.unclear) { msg.textContent = '質問を書くか、「わからないところ」に書いてください。'; return; }
      msg.textContent = 'AIが考えています…'; ask.disabled = true;
      callAI(buildUser(kind.value, ctx, n, question)).then(function (text) {
        n.ai = n.ai || []; n.ai.push({ k: kind.value, q: question, a: text, at: new Date().toISOString() }); Store.touch(n);
        msg.textContent = ''; q.value = ''; render();
      }).catch(function (e) {
        msg.textContent = 'AIに接続できませんでした：' + e.message + '　（ブラウザの制限で拒否された場合は、右のボタンでプロンプトをコピーして、お使いのAIに貼り付けてください）';
      }).then(sync);
    });
    cp.addEventListener('click', function () {
      var n = getNote(false); var text = SYSTEM + '\n\n' + buildUser(kind.value, ctx, n, q.value.trim());
      copyText(text, function (ok) { msg.textContent = ok ? 'コピーしました。お使いのAI（ChatGPT・DeepSeek・Claudeなど）に貼り付けてください。' : 'コピーできませんでした。下の欄から手動でコピーしてください。'; });
      if (!msg.nextSibling || !msg.nextSibling.classList || !msg.nextSibling.classList.contains('prompt-copy')) {
        var ta = h('textarea', { 'class': 'prompt-copy', rows: 4, readonly: true }); ta.value = text; msg.parentNode.insertBefore(ta, msg.nextSibling);
      } else { msg.nextSibling.value = text; }
    });
    sync(); render();
    return h('div', { 'class': 'ai' }, h('div', { 'class': 'ai-row' }, h('b', { 'class': 'nl-t' }, 'AIと学ぶ'), kind, q, ask, cp), msg, out);
  }

  // ---------------------------------------------------------------- note editors
  function articleContext(a) {
    var s = ['タイトル：' + a.title, '機関：' + a.src + (a.date ? '（' + a.date + '）' : ''), 'URL：' + a.url];
    if (a.sum) s.push('要約：' + a.sum);
    if (a.plain) s.push('やさしい説明：' + a.plain);
    return s.join('\n');
  }
  function getArticleNote(a, create) {
    var id = 'n_a_' + a.id, n = Store.get(id);
    if (!n && create) n = Store.create({ id: id, aid: a.id, aTitle: a.title, aUrl: a.url, aSrc: a.src });
    return n;
  }
  function noteFields(getNote) {
    var wrap = h('div');
    [['unclear', 'わからないところ', '読んで引っかかった点・疑問'], ['learned', '学んだこと', '自分の言葉で'], ['todo', 'もっと調べたいこと', 'キーワードや、次に読みたいもの']].forEach(function (f) {
      var ta = h('textarea', { rows: 3, placeholder: f[2], 'aria-label': f[1], oninput: function (e) { var n = getNote(true); n[f[0]] = e.target.value; Store.touch(n); } });
      var n0 = getNote(false); ta.value = n0 ? (n0[f[0]] || '') : '';
      wrap.appendChild(h('label', { 'class': 'nl' }, h('span', { 'class': 'nl-t' }, f[1]), ta));
    });
    return wrap;
  }
  function noteBox(a) {
    var get = function (c) { return getArticleNote(a, c); };
    return h('div', { 'class': 'notebox' }, noteFields(get), aiPanel(get, articleContext(a)));
  }
  function noteToggle(a, label) {
    if (PUBLIC) return null;
    var has = !!getArticleNote(a, false);
    var d = h('details', { 'class': 'more note-toggle' }, h('summary', null, (label || 'ノート') + (has ? '（記入あり）' : '')));
    d.addEventListener('toggle', function () { if (d.open && !d.getAttribute('data-ready')) { d.appendChild(noteBox(a)); d.setAttribute('data-ready', '1'); } });
    return d;
  }

  // ---------------------------------------------------------------- article / event pieces
  function levelBadge(n) {
    if (!n) return h('span', { 'class': 'badge scope', title: 'まだ要約していないため、難易度は未判定です' }, '未判定');
    var L = levels[n] || {}; return h('span', { 'class': 'badge l' + n, title: L.desc || '' }, L.name || ('Lv' + n));
  }
  function scopeBadge(k) { var S = scopes[k] || {}; return h('span', { 'class': 'badge scope', title: S.desc || '' }, S.name || k); }
  function langBadge(a) { return a.lang === 'en' ? h('span', { 'class': 'badge en', title: '英語の記事です。要約は日本語です' }, 'EN') : null; }

  function goSearch(t) {
    state.q = t; state.cat = state.level = state.scope = state.lang = state.src = 'all'; state.mode = 'all'; state.period = 'all';
    if (location.hash === '#articles') route(); else location.hash = '#articles';
  }

  function relatedList(rel, baseDate) {
    var items = (rel || []).map(function (r) {
      var o = byId[r.id]; if (!o) return null;
      var kind = r.kind || (daysBetween(baseDate, adate(o)) > 21 ? 'past' : 'rel');
      var why = r.why || (r.shared && r.shared.length ? '共通キーワード: ' + r.shared.join('・') : '');
      return h('li', null, h('span', { 'class': 'badge ' + (kind === 'past' ? 'past' : 'rel') }, kind === 'past' ? '過去の参考' : '関連'),
        levelBadge(o.level), langBadge(o), link(o.url, o.title), h('span', { 'class': 'sub' }, o.src + '　' + (o.date || '')), why ? h('div', { 'class': 'why' }, why) : null);
    }).filter(Boolean);
    return items.length ? h('div', { 'class': 'related' }, h('h4', null, '関連・おすすめ'), h('ul', null, items)) : null;
  }
  function summaryDetail(a) {
    return h('div', { 'class': 'detail' },
      h('p', { 'class': 'sum' }, a.sum),
      a.plain ? h('p', { 'class': 'plain' }, h('b', null, 'やさしく言うと　'), a.plain) : null,
      a.terms && a.terms.length ? h('dl', { 'class': 'terms' }, a.terms.map(function (t) { return [h('dt', null, t.t), h('dd', null, t.d)]; })) : null,
      a.tags && a.tags.length ? h('div', { 'class': 'tags' }, a.tags.map(function (t) { return h('button', { 'class': 'tag', type: 'button', onclick: function () { goSearch(t); } }, t); })) : null,
      relatedList(a.rel, adate(a)));
  }
  function originLine(a) { return h('p', { 'class': 'origin' }, link(a.url, '原文を開く（' + domain(a.url) + '）↗')); }

  function articleCard(a, open) {
    var meta = h('div', { 'class': 'meta' },
      a.raw ? null : levelBadge(a.level), a.raw ? null : scopeBadge(a.scope), h('span', { 'class': 'src' }, a.src),
      a.date ? h('time', null, a.date) : null, langBadge(a),
      a.raw ? h('span', { 'class': 'badge scope', title: '見出しから自動で判定した分野です' }, catName[a.cat] || a.cat) : null,
      a.partial ? h('span', { 'class': 'badge warn', title: '本文を読めず、概要だけから要約しています' }, '概要のみ') : null,
      a.added === D.latest ? h('span', { 'class': 'badge new' }, 'NEW') : null);
    var kids = [meta, h('h3', null, link(a.url, a.title))];
    if (a.raw) kids.push(h('p', { 'class': 'sub' }, '要約なし（見出しだけ収集）'));
    else {
      kids.push(h('p', { 'class': 'one' }, a.one));
      kids.push(h('details', { 'class': 'more', open: open }, h('summary', null, '要約・関連を見る'), summaryDetail(a)));
    }
    kids.push(noteToggle(a), originLine(a));
    return h('article', { 'class': 'card' + (a.raw ? ' rawcard' : '') }, kids);
  }

  function learnBox(r) {
    if (!r.event && !r.history && !r.lesson) return null;
    return h('div', { 'class': 'learn' },
      h('div', { 'class': 'learn-h' }, '事例・歴史から学ぶ', h('span', { 'class': 'badge warn', title: 'AIが書いた補足です。年や数値は出典で確認してください' }, 'AI補足・要確認')),
      r.event ? h('p', null, h('b', null, '関連する出来事・事例　'), r.event) : null,
      r.history ? h('p', null, h('b', null, '歴史的事実・類似事例　'), r.history) : null,
      r.lesson ? h('p', null, h('b', null, 'この記事で学べること　'), r.lesson) : null);
  }
  function readBlock(r) {
    var a = byId[r.id]; if (!a) return null;
    return h('div', { 'class': 'read' },
      h('div', { 'class': 'meta' }, h('span', { 'class': 'badge ' + (r.role === 'past' ? 'past' : 'main') }, r.role === 'past' ? '過去の参考' : '読む記事'),
        a.raw ? null : levelBadge(a.level), langBadge(a), h('span', { 'class': 'src' }, a.src), a.date ? h('time', null, a.date) : null,
        a.partial ? h('span', { 'class': 'badge warn' }, '概要のみ') : null, readCheck(a.id)),
      h('h4', null, link(a.url, a.title)),
      r.why ? h('p', { 'class': 'why2' }, h('b', null, 'なぜこの記事か　'), r.why) : null,
      moreBlock(r, a),
      originLine(a));
  }
  // Everything secondary (history, summary, notes) stays closed until asked for, so each event stays short.
  function moreBlock(r, a) {
    var d = h('details', { 'class': 'more' }, h('summary', null, 'もっと見る（事例・歴史／要約／ノート）'));
    d.addEventListener('toggle', function () {
      if (!d.open || d.getAttribute('data-ready')) return;
      d.setAttribute('data-ready', '1');
      add(d, learnBox(r));
      if (!a.raw) d.appendChild(h('div', { 'class': 'inner' }, h('p', { 'class': 'one' }, a.one), summaryDetail(a)));
      if (!PUBLIC) d.appendChild(h('div', { 'class': 'inner' }, h('h4', { 'class': 'reads-h' }, 'この記事のノート'), noteBox(a)));
    });
    return d;
  }
  function mediaRow(m) { return h('li', null, link(m.url, m.title), h('span', { 'class': 'sub' }, '　' + m.name)); }
  function eventCard(t) {
    var reads = (t.reads || []).map(readBlock).filter(Boolean);
    return h('article', { 'class': 'card event' },
      h('div', { 'class': 'meta' }, h('span', { 'class': 'badge cat' }, catName[t.cat] || t.cat), t.media && t.media.length ? h('span', { 'class': 'heat' }, t.heat + '媒体が報道') : h('span', { 'class': 'heat' }, 'レポートから作成（AI）')),
      h('h3', { 'class': 'ev-title' }, t.title),
      h('p', { 'class': 'sum' }, t.blurb),
      t.media && t.media.length ? h('details', { 'class': 'inline' }, h('summary', null, '報道を見る（' + t.media.length + '件）'), h('ul', { 'class': 'media' }, t.media.map(mediaRow))) : null,
      reads.length ? h('div', { 'class': 'reads' }, h('h4', { 'class': 'reads-h' }, 'この出来事を理解するために読む'), reads) : (t.media && t.media.length ? h('p', { 'class': 'sub' }, 'この出来事に合う記事は、まだ記事データベースにありません。') : null),
      t.tags && t.tags.length ? h('div', { 'class': 'tags' }, t.tags.map(function (x) { return h('button', { 'class': 'tag', type: 'button', onclick: function () { goSearch(x); } }, x); })) : null);
  }

  function viewToggle(onchange) {
    var wrap = h('div', { 'class': 'frow', 'data-view': '1' }, h('label', null, '表示'));
    [['list', '一覧（一言だけ）'], ['detail', '詳細（要約つき）']].forEach(function (o) {
      wrap.appendChild(h('button', { 'class': 'chip', 'data-v': o[0], type: 'button', 'aria-pressed': String(state.view === o[0]), onclick: function () {
        state.view = o[0]; lsSet('view', o[0]); onchange();
        Array.prototype.forEach.call(document.querySelectorAll('[data-view] .chip'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === state.view)); });
      } }, o[1]));
    });
    return wrap;
  }
  function chips(label, opts, key, onchange) {
    var row = h('div', { 'class': 'frow' }, h('label', null, label));
    opts.forEach(function (o) {
      row.appendChild(h('button', { 'class': 'chip', type: 'button', title: o[2] || '', 'aria-pressed': String(state[key] === o[0]), onclick: function (ev) {
        state[key] = o[0]; state.limit = 60;
        Array.prototype.forEach.call(row.querySelectorAll('.chip'), function (b) { b.setAttribute('aria-pressed', 'false'); });
        ev.currentTarget.setAttribute('aria-pressed', 'true'); onchange();
      } }, o[1]));
    });
    return row;
  }

  // ---------------------------------------------------------------- pages
  function allNotes() { return Store.list(); }
  function todoCount() { return allNotes().filter(function (n) { return (n.todo || '').trim(); }).length; }

  // ---- sidebar: reading checklist, things to look into, glossary
  function readMap() { try { return JSON.parse(lsGet('read') || '{}'); } catch (e) { return {}; } }   // this browser only
  function setRead(id, v) {
    var m = readMap(); if (v) m[id] = 1; else delete m[id];
    lsSet('read', JSON.stringify(m));
    Array.prototype.forEach.call(document.querySelectorAll('input[data-rid]'), function (c) { if (c.getAttribute('data-rid') === id) c.checked = !!v; });
    renderSide();
  }
  function readCheck(id) {
    var cb = h('input', { type: 'checkbox', 'data-rid': id, 'aria-label': '読んだ' }); cb.checked = !!readMap()[id];
    cb.addEventListener('change', function () { setRead(id, cb.checked); });
    return h('label', { 'class': 'readchk' }, cb, '読んだ');
  }
  var sideEl = document.getElementById('side'), glossEl = null;
  function buildGlossary() {
    var map = {};
    D.articles.forEach(function (a) { (a.terms || []).forEach(function (t) { if (t.t && !map[t.t]) map[t.t] = { t: t.t, d: t.d, n: 0 }; if (map[t.t]) map[t.t].n++; }); });
    var arr = Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return b.n - a.n || (a.t < b.t ? -1 : 1); });
    var q = h('input', { 'class': 'field', type: 'search', placeholder: '用語を検索（' + arr.length + '語）', 'aria-label': '用語検索' });
    var out = h('ul', { 'class': 'gloss' });
    function paint() {
      out.textContent = '';
      var s = q.value.trim().toLowerCase();
      var list = arr.filter(function (x) { return !s || x.t.toLowerCase().indexOf(s) >= 0 || (x.d || '').toLowerCase().indexOf(s) >= 0; }).slice(0, 8);
      if (!list.length) out.appendChild(h('li', { 'class': 'sub' }, '見つかりません'));
      list.forEach(function (x) { out.appendChild(h('li', null, h('button', { 'class': 'tag', type: 'button', onclick: function () { goSearch(x.t); } }, x.t), h('div', { 'class': 'sub' }, x.d))); });
    }
    q.addEventListener('input', paint); paint();
    return h('section', { 'class': 'sidebox' }, h('h3', null, '用語集'), q, out, h('p', { 'class': 'sub' }, '用語を押すと、その言葉で記事を検索します。'));
  }
  function renderSide() {
    if (!sideEl) return;
    sideEl.textContent = '';
    var set = curWeek(), rm = readMap(), ids = [];
    if (set) set.topics.forEach(function (t) { (t.reads || []).forEach(function (r) { if (byId[r.id] && ids.indexOf(r.id) < 0) ids.push(r.id); }); });
    var done = ids.filter(function (i) { return rm[i]; }).length;
    sideEl.appendChild(h('section', { 'class': 'sidebox' }, h('h3', null, '今週の読む記事', h('span', { 'class': 'cnt' }, done + ' / ' + ids.length)),
      ids.length ? h('ul', { 'class': 'chk' }, ids.map(function (id) {
        var a = byId[id], cb = h('input', { type: 'checkbox', 'data-rid': id, 'aria-label': '読んだ' }); cb.checked = !!rm[id];
        cb.addEventListener('change', function () { setRead(id, cb.checked); });
        return h('li', { 'class': rm[id] ? 'done' : '' }, h('label', null, cb, link(a.url, a.title)), h('div', { 'class': 'sub' }, a.src + (a.date ? '　' + a.date : '')));
      })) : h('p', { 'class': 'sub' }, '出来事の更新後に表示されます。'),
      h('p', { 'class': 'sub' }, 'チェックは、このブラウザの中だけに保存されます。')));
    if (!PUBLIC) {
      var td = allNotes().filter(function (n) { return (n.todo || '').trim(); }).sort(function (a, b) { return (b.updated || '') < (a.updated || '') ? -1 : 1; }).slice(0, 6);
      sideEl.appendChild(h('section', { 'class': 'sidebox' }, h('h3', null, '調べたいこと', h('span', { 'class': 'cnt' }, String(td.length))),
        td.length ? h('ul', { 'class': 'todo' }, td.map(function (n) {
          return h('li', null, h('b', null, (n.aid ? n.aTitle : (n.title || 'メモ')).slice(0, 40)), h('div', { 'class': 'pre' }, n.todo.trim().split('\n').slice(0, 3).join('\n')));
        })) : h('p', { 'class': 'sub' }, 'ノートの「もっと調べたいこと」に書くと、ここに出ます。'),
        h('a', { href: '#notes' }, 'ノートを開く →')));
    }
    if (!glossEl) glossEl = buildGlossary();
    sideEl.appendChild(glossEl);
  }

  function home() {
    var page = h('div');
    var total = D.articles.length, sums = D.articles.filter(function (a) { return !a.raw; }).length;
    page.appendChild(h('section', { 'class': 'hero' }, h('h1', null, D.site.title), h('p', null, D.site.subtitle),
      h('p', { 'class': 'stat' }, '収集リンク ' + total + '本（うち要約 ' + sums + '本）　最終収集 ' + (D.latest ? fmtDate(D.latest) : 'なし') + '　更新 ' + D.generated)));
    var set = curWeek();
    var nreads = set ? set.topics.reduce(function (s, t) { return s + (t.reads || []).length; }, 0) : 0;
    var blk = h('section', { 'class': 'block' }, h('h2', null, '今週の出来事', h('small', null, set ? fmtDate(set.date) + '　読む記事は ' + nreads + '本' : '')));
    if (set && set.topics.length) {
      var stack = h('div', { 'class': 'stack' }); set.topics.forEach(function (t) { stack.appendChild(eventCard(t)); }); blk.appendChild(stack);
    } else blk.appendChild(h('p', { 'class': 'empty' }, '出来事はまだありません。定期タスクの実行後に表示されます。'));
    page.appendChild(blk);
    var tc = PUBLIC ? 0 : todoCount();
    if (!PUBLIC) page.appendChild(h('section', { 'class': 'block' }, h('h2', null, 'ノート'),
      h('p', { 'class': 'lead' }, tc ? '「もっと調べたいこと」が ' + tc + '件あります。' : 'ノートに「わからないところ」「学んだこと」「調べたいこと」を書くと、ここに集まります。', ' ', h('a', { href: '#notes' }, 'ノートを開く →'))));
    page.appendChild(h('p', { 'class': 'origin' }, h('a', { href: '#articles' }, '記事の一覧 →'), '　', h('a', { href: '#reports' }, 'レポートの一覧 →')));
    return page;
  }

  // This week's events: every set (Mon and Thu runs) that falls in the same week as the newest one.
  function curWeek() {
    var sets = D.topicSets || []; if (!sets.length) return null;
    var k = weekStart(sets[0].date), topics = [];
    sets.forEach(function (s) { if (weekStart(s.date) === k) topics = topics.concat(s.topics); });
    return { date: sets[0].date, topics: topics };
  }
  function weekStart(s) { var d = parseYmd(s); if (!d) return s; d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return ymd(d); }
  function weekLabel(ws) {
    var a = parseYmd(ws), b = new Date(a.getFullYear(), a.getMonth(), a.getDate() + 6);
    return (a.getMonth() + 1) + '/' + a.getDate() + '〜' + (b.getMonth() + 1) + '/' + b.getDate() + 'の週';
  }
  function weekMonth(ws) { var a = parseYmd(ws); a.setDate(a.getDate() + 3); return a.getFullYear() + '-' + p2(a.getMonth() + 1); }   // the month most of the week falls in
  var evState = { month: 'all', cat: 'all' };
  function eventsPage() {
    var page = h('div', null, h('h2', { 'class': 'page-title' }, '出来事', h('small', null, '週ごとの重要な出来事（5〜7件）と、理解のための記事')));
    var weeks = {}, order = [];
    (D.topicSets || []).forEach(function (s) {
      var k = weekStart(s.date);
      if (!weeks[k]) { weeks[k] = []; order.push(k); }
      s.topics.forEach(function (t) { weeks[k].push(t); });
    });
    order.sort().reverse();
    if (!order.length) { page.appendChild(h('p', { 'class': 'empty' }, 'まだありません。')); return page; }
    var months = []; order.forEach(function (k) { var m = weekMonth(k); if (months.indexOf(m) < 0) months.push(m); });
    var out = h('div');
    function paint() {
      out.textContent = '';
      var lastM = '', n = 0;
      order.forEach(function (k) {
        var m = weekMonth(k); if (evState.month !== 'all' && evState.month !== m) return;
        var list = weeks[k].filter(function (t) { return evState.cat === 'all' || t.cat === evState.cat; });
        if (!list.length) return;
        if (m !== lastM) { out.appendChild(h('div', { 'class': 'daterow' }, m.slice(0, 4) + '年' + (+m.slice(5)) + '月')); lastM = m; }
        var det = h('details', { 'class': 'weekbox', open: n < 2 }, h('summary', null, weekLabel(k), h('span', { 'class': 'cnt' }, list.length + '件')));
        var stack = h('div', { 'class': 'stack' }); list.forEach(function (t) { stack.appendChild(eventCard(t)); }); det.appendChild(stack);
        out.appendChild(det); n++;
      });
      if (!n) out.appendChild(h('p', { 'class': 'empty' }, '該当する出来事がありません。'));
    }
    var msel = h('select', { 'class': 'field', 'aria-label': '月', onchange: function (e) { evState.month = e.target.value; paint(); } },
      [h('option', { value: 'all' }, 'すべての月')].concat(months.map(function (m) { return h('option', { value: m }, m.slice(0, 4) + '年' + (+m.slice(5)) + '月'); })));
    var csel = h('select', { 'class': 'field', 'aria-label': '分野', onchange: function (e) { evState.cat = e.target.value; paint(); } },
      [h('option', { value: 'all' }, 'すべての分野')].concat(D.categories.map(function (c) { return h('option', { value: c.id }, c.name); })));
    msel.value = evState.month; csel.value = evState.cat;
    page.appendChild(h('div', { 'class': 'frow' }, h('label', null, '絞り込み'), msel, csel));
    page.appendChild(h('p', { 'class': 'sub' }, '過去の週の出来事は、その週に集めたレポートの見出しからAIが作成したものです（報道リンクなし）。事実関係は、必ず原文で確認してください。'));
    page.appendChild(out); paint();
    return page;
  }

  function matches(a) {
    if (!baseMatch(a)) return false;
    for (var i = 0; i < state.tps.length; i++) if ((a.tp || []).indexOf(state.tps[i]) < 0) return false;   // every selected sub-category
    return true;
  }
  function baseMatch(a) {
    if (state.kind && a.kind !== state.kind) return false;
    if (state.mode === 'summary' && a.raw) return false;
    if (state.cat !== 'all' && a.cat !== state.cat) return false;
    if (state.level !== 'all' && String(a.level) !== state.level) return false;
    if (state.scope !== 'all' && a.scope !== state.scope) return false;
    if (state.lang !== 'all' && a.lang !== state.lang) return false;
    if (state.src !== 'all' && a.src !== state.src) return false;
    if (state.year) {   // a chosen year (and month) replaces the period menu
      var ad = adate(a);
      if (ad.slice(0, 4) !== state.year) return false;
      if (state.month && ad.slice(5, 7) !== (state.month.length < 2 ? '0' : '') + state.month) return false;
    } else if (state.period !== 'all' && adate(a) < daysAgo(+state.period)) return false;
    if (state.q) {
      var hay = [a.title, a.one, a.sum, a.plain, (a.tags || []).join(' '), (a.terms || []).map(function (t) { return t.t; }).join(' '), a.src].join(' ').toLowerCase();
      var qs = state.q.toLowerCase().split(/\s+/).filter(Boolean);
      for (var i = 0; i < qs.length; i++) if (hay.indexOf(qs[i]) < 0) return false;
    }
    return true;
  }
  function libraryPage(kind) {
    state.kind = kind; state.limit = 60;
    var isReport = kind === 'report';
    var page = h('div', null, h('h2', { 'class': 'page-title' }, isReport ? 'レポート' : '記事',
      h('small', null, isReport ? '経済見通し・月報/週報・金融市場や政策の分析レポート・論文。2026年分のライブラリ' : 'コラム・解説・速報。2026年分のライブラリ。要約のないものは見出しだけ表示します')));
    var results = h('div');
    function paint() {
      results.textContent = '';
      paintTp();
      var list = D.articles.filter(matches);
      results.appendChild(h('p', { 'class': 'count' }, list.length + '本'));
      var shown = list.slice(0, state.limit), last = null;
      shown.forEach(function (a) {
        var d = adate(a), gk = (state.year ? !state.month : (state.period === 'all' || state.period === '90')) ? d.slice(0, 7) : d;
        if (gk !== last) { results.appendChild(h('div', { 'class': 'daterow' }, gk.length === 7 ? gk.slice(0, 4) + '年' + (+gk.slice(5, 7)) + '月' : fmtDate(d))); last = gk; }
        results.appendChild(articleCard(a, state.view === 'detail'));
      });
      if (!list.length) results.appendChild(h('p', { 'class': 'empty' }, '条件に合う記事がありません。絞り込みを緩めてください。'));
      if (list.length > shown.length) results.appendChild(h('button', { 'class': 'more-btn', type: 'button', onclick: function () { state.limit += 60; paint(); } }, 'さらに表示（残り ' + (list.length - shown.length) + '本）'));
    }
    var srcs = []; D.articles.forEach(function (a) { if (srcs.indexOf(a.src) < 0) srcs.push(a.src); });
    var q = h('input', { 'class': 'field', type: 'search', placeholder: 'キーワード検索（タイトル・要約・タグ）', value: state.q, 'aria-label': '検索', oninput: function (e) { state.q = e.target.value.trim(); state.limit = 60; paint(); } });
    var period = h('select', { 'class': 'field', 'aria-label': '期間', onchange: function (e) { state.period = e.target.value; state.limit = 60; paint(); } },
      [['7', '直近1週間'], ['30', '直近1か月'], ['90', '直近3か月'], ['all', '2026年のすべて（月ごと）']].map(function (o) { return h('option', { value: o[0], selected: state.period === o[0] }, o[1]); }));
    var src = h('select', { 'class': 'field', 'aria-label': '機関', onchange: function (e) { state.src = e.target.value; state.limit = 60; paint(); } },
      [h('option', { value: 'all' }, 'すべての機関')].concat(srcs.map(function (s) { return h('option', { value: s, selected: state.src === s }, s); })));
    var years = []; D.articles.forEach(function (a) { var y = adate(a).slice(0, 4); if (y && years.indexOf(y) < 0) years.push(y); }); years.sort().reverse();
    var year = h('select', { 'class': 'field', 'aria-label': '年', onchange: function (e) { state.year = e.target.value; if (!state.year) state.month = ''; month.value = state.month; month.disabled = !state.year; period.disabled = !!state.year; state.limit = 60; paint(); } },
      [h('option', { value: '' }, '年：指定なし')].concat(years.map(function (y) { return h('option', { value: y, selected: state.year === y }, y + '年'); })));
    var months = []; for (var mi = 1; mi <= 12; mi++) months.push(String(mi));
    var month = h('select', { 'class': 'field', 'aria-label': '月', onchange: function (e) { state.month = e.target.value; state.limit = 60; paint(); } },
      [h('option', { value: '' }, '月：すべて')].concat(months.map(function (m) { return h('option', { value: m, selected: state.month === m }, m + '月'); })));
    month.disabled = !state.year; period.disabled = !!state.year;
    // fine-grained sub-categories (themes, regions, trends, policy, labour, consulting, law); several can be combined
    var tpSum = h('summary', null), tpBody = h('div');
    var tpBox = h('details', { 'class': 'card tpbox', open: true }, tpSum, tpBody);
    function paintTp() {
      var cnt = {};
      D.articles.forEach(function (a) { if (baseMatch(a)) (a.tp || []).forEach(function (l) { cnt[l] = (cnt[l] || 0) + 1; }); });
      tpSum.textContent = '細分類で絞り込む' + (state.tps.length ? '（選択中：' + state.tps.join('、') + '）' : '（テーマ・地域・動向・政策・労働・コンサル・法律）');
      tpBody.textContent = '';
      (D.topicGroups || []).forEach(function (g) {
        var row = h('div', { 'class': 'frow' }, h('label', null, g.name));
        g.items.forEach(function (l) {
          var on = state.tps.indexOf(l) >= 0;
          row.appendChild(h('button', { 'class': 'chip', type: 'button', 'aria-pressed': String(on), onclick: function () {
            var i = state.tps.indexOf(l); if (i >= 0) state.tps.splice(i, 1); else state.tps.push(l);
            state.limit = 60; paint();
          } }, l + ' ' + (cnt[l] || 0)));
        });
        tpBody.appendChild(row);
      });
      if (state.tps.length) tpBody.appendChild(h('div', { 'class': 'frow' }, h('button', { 'class': 'btn ghost', type: 'button', onclick: function () { state.tps = []; paint(); } }, '細分類をすべて解除')));
    }
    var hasOther = D.articles.some(function (a) { return a.cat === 'other'; });
    var f = h('div', { 'class': 'filters' },
      h('div', { 'class': 'frow' }, q, period, year, month, src),
      chips('分野', [['all', 'すべて']].concat(D.categories.filter(function (c) { return c.id !== 'other' || hasOther; }).map(function (c) { return [c.id, c.name, c.desc]; })), 'cat', paint),
      chips('レベル', [['all', 'すべて']].concat(D.levels.map(function (l) { return [String(l.id), l.name, l.desc]; })), 'level', paint),
      chips('視点', [['all', 'すべて']].concat(D.scopes.map(function (s) { return [s.id, s.name, s.desc]; })), 'scope', paint),
      chips('言語', [['all', 'すべて'], ['ja', '日本語'], ['en', '英語']], 'lang', paint),
      chips('範囲', [['all', 'すべての収集', '見出しだけのものも含む'], ['summary', '要約あり']], 'mode', paint),
      viewToggle(paint));
    page.appendChild(f); page.appendChild(tpBox); page.appendChild(results);
    paint();
    return page;
  }

  // ---- notes page
  function memoBox(n, onDelete) {
    var get = function () { return n; };
    var title = h('input', { 'class': 'field', type: 'text', placeholder: 'メモの題', value: n.title || '', 'aria-label': '題', oninput: function (e) { n.title = e.target.value; Store.touch(n); } });
    var body = h('textarea', { rows: 6, placeholder: '自由にメモ（学んだこと、疑問、考えたこと）', 'aria-label': '本文', oninput: function (e) { n.body = e.target.value; Store.touch(n); } }); body.value = n.body || '';
    return h('div', { 'class': 'notebox' }, title, body, noteFieldsMini(n), aiPanel(get, ''),
      h('p', { 'class': 'origin' }, h('button', { 'class': 'tag', type: 'button', onclick: function () { if (confirm('このメモを削除しますか？')) onDelete(); } }, 'このメモを削除')));
  }
  function noteFieldsMini(n) { return noteFields(function () { return n; }); }
  function aiSettings() {
    var c = aiConf();
    var prov = h('select', { 'class': 'field', 'aria-label': 'サービス' }, Object.keys(PRESETS).map(function (k) { return h('option', { value: k, selected: c.provider === k }, PRESETS[k].label); }));
    var base = h('input', { 'class': 'field', type: 'text', value: c.base, 'aria-label': 'APIのURL' });
    var model = h('input', { 'class': 'field', type: 'text', value: c.model, 'aria-label': 'モデル名' });
    var key = h('input', { 'class': 'field', type: 'password', value: c.key, placeholder: 'APIキー', autocomplete: 'off', 'aria-label': 'APIキー' });
    var msg = h('p', { 'class': 'sub' });
    prov.addEventListener('change', function () { var p = PRESETS[prov.value]; base.value = p.base; model.value = p.model; });
    function save() { lsSet('ai', JSON.stringify({ provider: prov.value, base: base.value.trim(), model: model.value.trim(), key: key.value.trim() })); }
    return h('details', { 'class': 'card inline-card' }, h('summary', null, 'AI設定（質問・整理・調べ物の提案に使う）' + (aiReady() ? '　設定済み' : '　未設定')),
      h('p', { 'class': 'sub' }, 'OpenAI・DeepSeek・Claudeなどのキーを入れると、ノートの「AIに聞く」が使えます。キーは、このブラウザの中にだけ保存されます（ファイルやフォルダには書きません）。共用のパソコンでは入れないでください。利用額の上限は、各サービスの画面で設定しておくと安心です。キーが無くても「プロンプトをコピー」で、お使いのAIに貼り付けて使えます。'),
      h('div', { 'class': 'form' }, h('label', null, 'サービス', prov), h('label', null, 'APIのURL', base), h('label', null, 'モデル名', model), h('label', null, 'APIキー', key)),
      h('div', { 'class': 'frow' },
        h('button', { 'class': 'btn', type: 'button', onclick: function () { save(); msg.textContent = '保存しました。'; } }, '保存'),
        h('button', { 'class': 'btn ghost', type: 'button', onclick: function () {
          save(); msg.textContent = '接続を確かめています…';
          callAI('「OK」とだけ返してください。').then(function (t) { msg.textContent = '接続できました：' + t.slice(0, 40); }).catch(function (e) { msg.textContent = '接続できませんでした：' + e.message; });
        } }, '接続テスト'),
        h('button', { 'class': 'btn ghost', type: 'button', onclick: function () { lsSet('ai', ''); key.value = ''; msg.textContent = 'APIキーを消去しました。'; } }, 'キーを消す')),
      msg);
  }
  function download(name, text, type) {
    var url = URL.createObjectURL(new Blob([text], { type: type })); var a = h('a', { href: url, download: name }); document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function notesMarkdown() {
    return allNotes().sort(function (a, b) { return (b.updated || '') < (a.updated || '') ? -1 : 1; }).map(function (n) {
      var t = n.aid ? n.aTitle : (n.title || '（題なし）');
      var s = '## ' + t + '\n' + (n.aUrl ? n.aUrl + '\n' : '') + '更新: ' + (n.updated || '') + '\n';
      if (n.body) s += '\n' + n.body + '\n';
      if (n.unclear) s += '\n### わからないところ\n' + n.unclear + '\n';
      if (n.learned) s += '\n### 学んだこと\n' + n.learned + '\n';
      if (n.todo) s += '\n### もっと調べたいこと\n' + n.todo + '\n';
      (n.ai || []).forEach(function (r) { s += '\n### AI（' + r.k + '）' + (r.q ? '：' + r.q : '') + '\n' + r.a + '\n'; });
      return s;
    }).join('\n---\n\n');
  }
  function notesPage() {
    var page = h('div');
    var where = Store.mode() === 'server' ? '保存先：data\\notes.json（OneDriveと同期）' : '保存先：このブラウザの中だけ（start.cmd から開くと、ファイルに保存されます）';
    page.appendChild(h('h2', { 'class': 'page-title' }, 'ノート', h('small', null, where)));
    page.appendChild(aiSettings());
    var list = h('div'), todo = h('div');
    function paint() {
      todo.textContent = ''; list.textContent = '';
      var ns = allNotes().sort(function (a, b) { return (b.updated || '') < (a.updated || '') ? -1 : 1; });
      var td = ns.filter(function (n) { return (n.todo || '').trim(); });
      if (td.length) {
        todo.appendChild(h('section', { 'class': 'block' }, h('h2', null, 'もっと調べたいこと', h('small', null, td.length + '件')),
          h('ul', { 'class': 'todo' }, td.map(function (n) { return h('li', null, h('b', null, n.aid ? n.aTitle : (n.title || '（題なし）')), h('div', { 'class': 'pre' }, n.todo)); }))));
      }
      var q = state.nq.toLowerCase();
      var shown = ns.filter(function (n) {
        if (state.nkind === 'article' && !n.aid) return false; if (state.nkind === 'memo' && n.aid) return false;
        if (!q) return true;
        return [n.title, n.aTitle, n.body, n.unclear, n.learned, n.todo].join(' ').toLowerCase().indexOf(q) >= 0;
      });
      list.appendChild(h('p', { 'class': 'count' }, shown.length + '件'));
      if (!shown.length) list.appendChild(h('p', { 'class': 'empty' }, 'ノートはまだありません。「新しいメモ」を押すか、各記事の「ノート」から書き始めてください。'));
      shown.forEach(function (n) {
        var head = n.aid ? h('div', { 'class': 'meta' }, h('span', { 'class': 'src' }, n.aSrc || '記事'), '　', link(n.aUrl, n.aTitle)) : null;
        var inner = n.aid ? h('div', { 'class': 'notebox' }, noteFields(function () { return n; }), aiPanel(function () { return n; }, articleContext({ title: n.aTitle, src: n.aSrc, url: n.aUrl, date: '', sum: (byId[n.aid] || {}).sum, plain: (byId[n.aid] || {}).plain })),
          h('p', { 'class': 'origin' }, h('button', { 'class': 'tag', type: 'button', onclick: function () { if (confirm('このノートを削除しますか？')) { Store.remove(n.id); paint(); } } }, 'このノートを削除')))
          : memoBox(n, function () { Store.remove(n.id); paint(); });
        var d = h('details', { 'class': 'card note-card' }, h('summary', null, n.aid ? ('記事ノート：' + n.aTitle) : ('メモ：' + (n.title || '（題なし）')), '　', h('span', { 'class': 'sub' }, (n.updated || '').slice(0, 10))), head, inner);
        list.appendChild(d);
      });
    }
    var q = h('input', { 'class': 'field', type: 'search', placeholder: 'ノートを検索', value: state.nq, 'aria-label': 'ノート検索', oninput: function (e) { state.nq = e.target.value.trim(); paint(); } });
    var file = h('input', { type: 'file', accept: 'application/json,.json', hidden: true, onchange: function (e) {
      var f = e.target.files[0]; if (!f) return; var r = new FileReader();
      r.onload = function () { try { var c = Store.merge((JSON.parse(r.result).notes) || []); alert(c + '件を読み込みました。'); paint(); } catch (x) { alert('読み込めませんでした：' + x.message); } };
      r.readAsText(f);
    } });
    page.appendChild(h('div', { 'class': 'filters' },
      h('div', { 'class': 'frow' },
        h('button', { 'class': 'btn', type: 'button', onclick: function () { Store.create({ title: '' }); state.nkind = 'all'; paint(); var d = list.querySelector('details'); if (d) d.open = true; } }, '新しいメモ'), q,
        h('select', { 'class': 'field', 'aria-label': '種類', onchange: function (e) { state.nkind = e.target.value; paint(); } },
          [['all', 'すべて'], ['article', '記事ノート'], ['memo', '自由メモ']].map(function (o) { return h('option', { value: o[0], selected: state.nkind === o[0] }, o[1]); }))),
      h('div', { 'class': 'frow' },
        h('button', { 'class': 'btn ghost', type: 'button', onclick: function () { download('notes.md', notesMarkdown(), 'text/markdown'); } }, 'Markdownで保存'),
        h('button', { 'class': 'btn ghost', type: 'button', onclick: function () { download('notes.json', JSON.stringify({ notes: allNotes() }, null, 2), 'application/json'); } }, 'バックアップ（JSON）'),
        h('button', { 'class': 'btn ghost', type: 'button', onclick: function () { file.click(); } }, 'バックアップを読み込む'), file)));
    page.appendChild(todo); page.appendChild(list);
    paint();
    return page;
  }

  // ---- about / status
  var STATUS = { ok: ['正常', 'l1'], stale: ['要確認（2週間以上新着なし）', 'warn'], error: ['エラー', 'warn'], none: ['新着なし（対象期間内に記事がない）', 'scope'] };
  function aboutPage() {
    var page = h('div', null, h('h2', { 'class': 'page-title' }, '使い方'));
    page.appendChild(h('div', { 'class': 'prose' },
      h('h3', null, '基本の流れ'),
      h('ul', null, ['「ホーム」で今週の出来事を見る。', '出来事ごとの「読む記事」を、原文のページで読む。', '気づいたこと・わからないことを、記事のノート欄に書く。必要ならAIに質問する。', '「ノート」タブで、書きためたものと「もっと調べたいこと」を見返す。'].map(function (t) { return h('li', null, t); })),
      h('h3', null, '難易度（レベル）'),
      h('ul', null, D.levels.map(function (l) { return h('li', null, h('span', { 'class': 'badge l' + l.id }, l.name), ' ' + l.desc); })),
      h('p', null, '「標準」「専門」の記事には、経済に詳しくない人向けの「やさしく言うと」と用語メモを付けています。'),
      h('h3', null, '視点（マクロ／ミクロ）'),
      h('ul', null, D.scopes.map(function (s) { return h('li', null, h('b', null, s.name), '：' + s.desc); })),
      h('h3', null, '分野'),
      h('ul', null, D.categories.map(function (c) { return h('li', null, h('b', null, c.name), '：' + c.desc); })),
      h('h3', null, '見方のヒント'),
      h('ul', null, [
        '「記事」タブには、収集したすべてのレポートが並びます。要約があるのは一部で、残りは見出しだけです（分野は見出しから自動判定）。',
        '「関連」は同じ話題の別の記事、「過去の参考」は少し前の似た話題の記事です。',
        '「AI補足・要確認」の欄は、AIが書いた歴史的な説明です。年や数値は必ず出典で確認してください。',
        '「概要のみ」は、本文を読めず、タイトルや概要だけから作った要約です。',
        'タグを押すと、そのキーワードで記事を検索します。',
        'トピックは公式RSSの見出しとリンクだけを使い、記事本文は保存していません。'
      ].map(function (t) { return h('li', null, t); }))));
    // collection status
    var rows = (D.health || []).map(function (s) {
      var st = STATUS[s.status] || STATUS.none;
      return h('tr', null,
        h('td', null, s.name, s.lang === 'en' ? h('span', { 'class': 'badge en' }, 'EN') : null),
        h('td', null, s.mode === 'agent' ? 'Claudeが閲覧' : (s.weekly ? '自動（毎週月曜）' : '自動')),
        h('td', null, s.lastAdded || '―'), h('td', null, (s.oldest || '―') + '〜（' + (s.total || 0) + '件）'), h('td', null, String(s.count30)),
        h('td', null, s.lastRun ? fmtTime(s.lastRun) + '（新着' + s.lastNew + '）' : '―'),
        h('td', null, h('span', { 'class': 'badge ' + st[1] }, st[0]), s.error ? h('div', { 'class': 'sub' }, s.error) : null));
    });
    page.appendChild(h('section', { 'class': 'block' }, h('h2', null, '収集状況', h('small', null, '機関ごとの最終収集日と直近30日の件数。「要確認」は、サイトの形が変わった可能性があります')),
      h('div', { 'class': 'tablewrap' }, h('table', { 'class': 'tbl' },
        h('thead', null, h('tr', null, ['機関', '方法', '最終収集日', '収集範囲', '30日の件数', '直近の収集', '状態'].map(function (x) { return h('th', null, x); }))),
        h('tbody', null, rows)))));
    return page;
  }

  var pages = { home: home, events: eventsPage, articles: function () { return libraryPage('article'); }, reports: function () { return libraryPage('report'); }, notes: notesPage, about: aboutPage };
  function route() {
    var t = (location.hash || '#home').slice(1);
    if (!pages[t] || (PUBLIC && t === 'notes')) t = 'home';
    var nav = document.getElementById('tabs'); nav.textContent = '';
    TABS.forEach(function (x) { nav.appendChild(h('a', { href: '#' + x[0], 'aria-current': x[0] === t ? 'page' : null }, x[1])); });
    app.textContent = ''; app.appendChild(pages[t]()); renderSide(); window.scrollTo(0, 0);
  }
  document.getElementById('foot').textContent = '要約・レベル・歴史の補足はAIが作成しています。正確な内容は必ず原文でご確認ください。各レポートの著作権は各機関にあります。このサイトは見出し・要約・リンクのみを掲載しています。　更新: ' + D.generated;
  window.addEventListener('hashchange', route);
  Store.init().then(route, route);
})();
