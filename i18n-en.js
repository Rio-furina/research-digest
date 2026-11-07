// English display for the interface (menus, labels, buttons, guides). Article / event / term content stays in Japanese.
// Active when localStorage digest.lang = 'en' (or ?lang=en). Translates text on screen after the page renders; no change to the Japanese pages.
(function () {
  var KEY = 'digest.lang';
  var lang = 'ja';
  try {
    var m = /[?&]lang=(en|ja)\b/.exec(location.search);
    if (m) { localStorage.setItem(KEY, m[1]); history.replaceState(null, '', location.pathname + location.hash); }
    lang = localStorage.getItem(KEY) === 'en' ? 'en' : 'ja';
  } catch (e) { /* private mode */ }
  var JA = /[぀-ヿ一-鿿]/;

  // ---- exact strings (compared after trimming spaces, including full-width) ----
  var D = {};
  function add(pairs) { for (var i = 0; i < pairs.length; i += 2) D[pairs[i]] = pairs[i + 1]; }
  add([
    // navigation
    'ホーム', 'Home', '出来事', 'Events', '記事', 'Articles', 'レポート', 'Reports', '用語集', 'Glossary', 'マイページ', 'My page', 'ノート', 'Notes', '使い方', 'How to use',
    'リサーチ・ダイジェスト', 'Research Digest', 'サイト内検索', 'Site search', 'サイト内を検索', 'Search this site', '検索', 'Search',
    // home
    '今週の出来事', 'This week’s events', '今週の読む記事', 'Articles to read this week', '出来事の更新後に表示されます。', 'Shown after the next events update.',
    'チェックは、このブラウザの中だけに保存されます。', 'Checks are saved only in this browser.',
    '調べたいこと', 'To look into', 'メモ', 'Memo', 'ノートの「もっと調べたいこと」に書くと、ここに出ます。', 'Things you write under “Want to look into more” in Notes appear here.',
    'ノートを開く →', 'Open Notes →', '気になる言葉で探す（例：物価、日銀、為替、AI）', 'Search by a word (e.g. prices, BOJ, FX, AI)',
    'すべて見る →', 'See all →', '関連する出来事', 'Related events', '関連する記事', 'Related articles', '関連するレポート', 'Related reports',
    '急上昇（1週間）', 'Trending (1 week)', '定番（全期間）', 'Popular (all time)', '読み込み中…', 'Loading…', 'まだ集計がありません。', 'No counts yet.',
    '人気のレポート', 'Popular reports', '原文リンクを開いた回数', 'Times the original link was opened', '出来事はまだありません。定期タスクの実行後に表示されます。', 'No events yet. They appear after the next scheduled update.',
    '記事の一覧 →', 'Article list →', 'レポートの一覧 →', 'Report list →', 'なし', 'none',
    '日付不明', 'Date unknown', '入力中…', 'Typing…',
    // events page
    'すべて', 'All', '国内', 'Japan', '海外・グローバル', 'Overseas / Global', '国内・海外', 'Japan / Overseas',
    '週ごとの重要な出来事と、理解のための記事（国内・海外のタブで切り替え）', 'Key events week by week, with articles to help you understand them (switch between Japan and overseas).',
    'まだありません。', 'None yet.', '該当する出来事がありません。', 'No matching events.', 'すべての月', 'All months', '分野', 'Field', 'すべての分野', 'All fields', '絞り込み', 'Filter',
    '過去の週の出来事は、その週に集めたレポートの見出しからAIが作成したものです（報道リンクなし）。事実関係は、必ず原文で確認してください。', 'Events from past weeks were written by AI from the headlines of reports collected that week (no news links). Always check the facts in the original source.',
    '読む', 'Read', '選んだ理由', 'Why this one', 'この出来事を理解するために読む', 'Read this to understand the event', 'この出来事に合う記事は、まだ記事データベースにありません。', 'No article in the database fits this event yet.',
    'この出来事の固定ページ（共有用）', 'Permanent page for this event (for sharing)', '読んだ', 'Read', '媒体が報道', 'Reported by the media', 'レポートから作成（AI）', 'Made from reports (AI)',
    // articles / reports
    '経済見通し・月報/週報・金融市場や政策の分析レポート・論文。2020年以降のライブラリ', 'Economic outlooks, monthly/weekly reports, and analyses and papers on financial markets and policy. A library from 2020 onward.',
    'コラム・解説・速報。2020年以降のライブラリ。要約のないものは見出しだけ表示します', 'Columns, explainers and flash reports. A library from 2020 onward. Items without a summary show only the headline.',
    '条件に合う記事がありません。絞り込みを緩めてください。', 'No articles match. Try loosening the filters.', 'キーワード検索（タイトル・要約・タグ）', 'Keyword search (title, summary, tags)',
    '期間', 'Period', '直近1週間', 'Last week', '直近1か月', 'Last month', '直近3か月', 'Last 3 months', '2020年以降のすべて（月ごと）', 'Everything since 2020 (by month)',
    '機関', 'Institution', 'すべての機関', 'All institutions', '年：指定なし', 'Year: any', '月：すべて', 'Month: all', '細分類で絞り込む', 'Filter by subcategory',
    '（テーマ・地域・動向・政策・労働・コンサル・法律）', '(theme, region, trend, policy, labour, consulting, law)', '細分類をすべて解除', 'Clear all subcategories',
    '分野・レベル・視点などで絞り込む', 'Filter by field, level, viewpoint and more', 'レベル', 'Level', '視点', 'Viewpoint', '言語', 'Language', '日本語', 'Japanese', '英語', 'English',
    '範囲', 'Scope', 'すべての収集', 'Everything collected', '見出しだけのものも含む', 'Including headline-only items', '要約あり', 'With summary',
    'すべてのレベル', 'All levels', '細分類', 'Subcategory', 'すべての細分類', 'All subcategories',
    '要約・関連を見る', 'See summary and related', '要約なし（見出しだけ収集）', 'No summary (headline only)', '概要のみ', 'Overview only',
    '未判定', 'Not rated', 'まだ要約していないため、難易度は未判定です', 'Not summarised yet, so the difficulty is not rated.', '英語の記事です。要約は日本語です', 'An English article. The summary is in Japanese.',
    '見出しから自動で判定した分野です', 'Field judged automatically from the headline.', '本文を読めず、概要だけから要約しています', 'The full text was not available; summarised from the overview only.',
    '共通キーワード:', 'Shared keywords:', '過去の参考', 'Past references', '関連', 'Related', '関連・おすすめ', 'Related / recommended', 'やさしく言うと', 'In plain words',
    '出典：', 'Source:', '（公式ページの冒頭にある要旨・概要を引用。著作権は各機関に帰属します）', '(Abstract quoted from the top of the official page. Copyright belongs to each institution.)',
    '事例・歴史から学ぶ', 'Learn from cases and history', 'AIが書いた補足です。年や数値は出典で確認してください', 'Added by AI. Check years and figures against the source.', 'AI補足・要確認', 'AI note – please verify',
    '関連する出来事・事例', 'Related events and cases', '歴史的事実・類似事例', 'Historical facts and similar cases', 'この記事で学べること', 'What you can learn from this article', '読む記事', 'Article to read',
    'もっと見る（事例・歴史／要約／ノート）', 'More (cases & history / summary / notes)', 'この記事のノート', 'Notes on this article',
    // glossary
    '用語検索', 'Term search', '見つかりません', 'Not found', '見つかりません。', 'Not found.', '用語を押すと、用語集で詳しく見られます。', 'Tap a term to see it in detail in the glossary.',
    '用語', 'Term', '例・ヒント', 'Example / tip', '別の呼び方：', 'Also called:', '関連：', 'Related:', 'くわしい解説ページを開く →', 'Open the detailed page →', 'この言葉で記事を探す', 'Find articles with this word',
    '経済・金融・政策の言葉と、読み方のヒント。★や用語帳で、自分用にまとめられます', 'Terms of economics, finance and policy, with reading tips. Collect your own with ★ and word books.',
    'マークをつけたものだけ', 'Marked ones only', 'もっと見る', 'Show more',
    '＋ 用語帳に追加…', '+ Add to a word book…', '新しい用語帳を作る…', 'Create a new word book…', '用語帳に追加', 'Add to a word book', 'ログインすると使えます', 'Available after logging in',
    'お気に入り', 'Favourite', 'あとで', 'Later', 'わからない', 'Don’t understand', '理解した', 'Understood', '記事から', 'From articles', '新しい用語帳の名前', 'Name of the new word book',
    // my page
    '表示の明るさ', 'Appearance', '「自動」は、お使いの端末の設定に合わせます。選んだ内容は、このブラウザに保存されます。', '“Auto” follows your device setting. Your choice is saved in this browser.',
    '自動', 'Auto', 'ライト', 'Light', 'ダーク', 'Dark', 'アカウント', 'Account', 'ログアウト', 'Log out', 'ログアウトしました', 'Logged out',
    'マーク、用語帳、メモを、自分用にためる場所です', 'A place to keep your marks, word books and memos.', 'マーク', 'Marks',
    'まだありません。記事や用語のカードにある ★ ⚑ ？ ✓ を押すと、ここに集まります。', 'Nothing yet. Press ★ ⚑ ? ✓ on article or term cards and they gather here.',
    '用語帳', 'Word books', '用語帳の名前（例：金融政策、試験対策）', 'Word book name (e.g. monetary policy, exam prep)', '用語帳の名前', 'Word book name', '自分のメモ（覚え方、例、疑問）', 'Your memo (how to remember, example, question)',
    '自作', 'Own', '外す', 'Remove', '空です。用語集の「＋用語帳に追加」か、下の自作フォームから追加できます。', 'Empty. Add from “+ Add to a word book” in the glossary, or use the form below.',
    '自作の用語', 'Your own term', '意味・説明', 'Meaning / explanation', '説明', 'Explanation', '自作の用語を追加', 'Add your own term', '用語帳の名前を変更', 'Rename the word book', '名前を変える', 'Rename',
    'この用語帳を削除', 'Delete this word book', 'まだありません。名前を入れて作ってください。', 'None yet. Enter a name to create one.', '用語帳を作る', 'Create a word book',
    '学んだこと、疑問、考えたこと', 'What you learned, questions, thoughts', '＋ メモを書く', '+ Write a memo', '記事ごとのノート・AI学習は「ノート」タブ →', 'Per-article notes and AI study are in the Notes tab →',
    '読み込むファイル', 'File to import', '読み込みました', 'Imported', '読み込めませんでした', 'Could not import', 'バックアップ', 'Backup', '書き出し（JSON）', 'Export (JSON)', '読み込み（上書き）', 'Import (overwrite)',
    'アカウントの削除', 'Delete account', 'アカウントと、保存したマーク・用語帳・メモをすべて削除します。元に戻せません。必要なら、先に「書き出し」で保存してください。', 'This deletes your account and all saved marks, word books and memos. It cannot be undone. Export first if you need to.',
    'アカウントを削除する', 'Delete my account', '削除しました', 'Deleted', '削除', 'Delete',
    'ログインすると、マーク・用語帳・メモが使えます', 'Log in to use marks, word books and memos.', 'メールアドレス', 'Email address', 'パスワード（8文字以上）', 'Password (8+ characters)', 'パスワード', 'Password',
    'ログイン', 'Log in', '新規登録', 'Sign up', 'パスワードを忘れた', 'Forgot password', 'Googleでログイン', 'Log in with Google', 'またはメールアドレスで', 'or with your email address',
    'マーク（★⚑？✓）、用語帳、メモは、アカウントに保存されます。無料です。別の端末でも、同じ内容が使えます。', 'Marks (★⚑?✓), word books and memos are saved to your account. It’s free, and works the same on other devices.',
    '利用規約', 'Terms of Use', 'プライバシーポリシー', 'Privacy Policy', 'ログインしました', 'Logged in', '（メール非公開）', '(email hidden)',
    '新しいパスワード（8文字以上）', 'New password (8+ characters)', '新しいパスワード', 'New password', '新しいパスワードを設定してください', 'Please set a new password', '設定する', 'Set', 'パスワードを変更しました', 'Password changed',
    'アカウントとすべてのデータを削除します。元に戻せません。よろしいですか？', 'This deletes your account and all data. It cannot be undone. Continue?',
    'メールアドレスを入れてください。', 'Please enter your email address.', 'パスワードを入れてください。', 'Please enter your password.', 'パスワードは8文字以上にしてください。', 'The password must be at least 8 characters.',
    '確認メールを送りました。メール内のリンクを押すと、登録が完了します。', 'We sent a confirmation email. Press the link in it to finish signing up.',
    '再設定のメールを送りました（登録済みの場合）。メール内のリンクから新しいパスワードを設定してください。', 'We sent a reset email (if the address is registered). Set a new password from the link in it.',
    'メールアドレスまたはパスワードが違います。', 'Wrong email address or password.', 'メールの確認がまだです。届いたメールのリンクを押してください。', 'Your email is not confirmed yet. Press the link in the email we sent.',
    'このメールアドレスは登録済みです。「ログイン」を押してください。', 'This email address is already registered. Press “Log in”.', 'パスワードを入力してください。', 'Please enter your password.',
    '短時間に何度も試されました。しばらくしてからお試しください。', 'Too many attempts in a short time. Please try again later.', '通信できませんでした。接続を確認してください。', 'Could not connect. Please check your connection.',
    // notes tab (local use)
    '保存', 'Save', '保存しました。', 'Saved.', '保存中…', 'Saving…', '保存に失敗しました', 'Could not save', '質問', 'Question', 'コピーしました。', 'Copied.',
    '更新', 'Updated', '新しいメモ', 'New memo', '種類', 'Type', '記事ノート', 'Article notes', '自由メモ', 'Free memos', '記事かレポートか', 'Article or report', '記事・レポート両方', 'Articles and reports',
    'いつでも', 'Any time', '7日以内', 'Within 7 days', '30日以内', 'Within 30 days', '90日以内', 'Within 90 days', '書いた欄', 'Filled in',
    '調べたいことあり', 'Has “want to look into”', 'わからないところあり', 'Has “don’t understand”', '学んだことあり', 'Has “what I learned”', 'Markdownで保存', 'Save as Markdown',
    'バックアップ（JSON）', 'Backup (JSON)', 'バックアップを読み込む', 'Load a backup', 'ノートを検索', 'Search notes', 'ノート検索', 'Note search',
    'わからないところ', 'What I don’t understand', '読んで引っかかった点・疑問', 'Points or questions that caught your attention', '学んだこと', 'What I learned', '自分の言葉で', 'In your own words',
    'もっと調べたいこと', 'Want to look into more', 'キーワードや、次に読みたいもの', 'Keywords, or what to read next', '（記入あり）', '(filled in)', '題', 'Title', '本文', 'Body',
    'メモの題', 'Memo title', '自由にメモ（学んだこと、疑問、考えたこと）', 'Free memo (what you learned, questions, thoughts)', 'このメモを削除', 'Delete this memo', 'このノートを削除', 'Delete this note',
    '（題なし）', '(untitled)', 'ノートはまだありません。「新しいメモ」を押すか、各記事の「ノート」から書き始めてください。', 'No notes yet. Press “New memo”, or start from “Notes” on any article.',
    // status
    '収集状況', 'Collection status', '正常', 'OK', 'エラー', 'Error', '状態', 'Status', '方法', 'Method', '最終収集日', 'Last collected', '収集範囲', 'Range collected', '30日の件数', 'Items in 30 days',
    '直近の収集', 'Latest collection', '自動（毎週月曜）', 'Auto (every Monday)', '要確認（2週間以上新着なし）', 'Check needed (no new items for 2+ weeks)',
    '新着なし（対象期間内に記事がない）', 'No new items (no articles in the period)',
    '機関ごとの最終収集日と直近30日の件数。「要確認」は、サイトの形が変わった可能性があります', 'Last collection date and the last 30 days’ count per institution. “Check needed” may mean the source site changed.',
    // about / how to use
    'このサイトについて', 'About this site', '特徴', 'Features', '各タブの使い方', 'How to use each tab', '設定とデータの扱い', 'Settings and your data', 'ご利用上の注意', 'Notes on use', '基本の流れ', 'Basic flow',
    '難易度（レベル）', 'Difficulty (level)', '視点（マクロ／ミクロ）', 'Viewpoint (macro / micro)', '見方のヒント', 'Reading tips',
    '国内外のシンクタンク・金融機関・中央銀行が公開するレポートを集め、「いま何が起きているか」を週ごとの出来事として整理するサイトです。経済ニュースを毎日追えない人でも、重要な動きと、その背景を読む記事・レポートにたどり着けることを目的にしています。',
      'This site collects reports published by think tanks, financial institutions and central banks in Japan and abroad, and organises “what is happening now” as week-by-week events. It aims to let even people who cannot follow economic news every day reach the key developments and the articles and reports that explain their background.',
    'ここに載せるのは、見出し、AIが作った短い要約・解説、原文へのリンクだけです。本文や図表は載せていません。詳しく読むときは、必ず原文を開いてください。', 'This site shows only headlines, short AI-made summaries and explanations, and links to the originals. Full texts and charts are not reproduced. Always open the original to read in detail.',
    '収集が土台: 国内外の機関の新着を、定期的に自動で集めています。', 'Collection is the foundation: new items from institutions in Japan and abroad are gathered automatically on a regular basis.',
    '出来事は週ごとに、国内と海外・グローバルに分けて選んでいます。各出来事に、読むべき記事を1〜2本だけ添えています（重要な順に並びます）。', 'Events are chosen each week, split into Japan and overseas/global. Each event has just one or two articles to read, in order of importance.',
    '記事・レポートは2020年以降の分を収録しています（古い分は見出しとリンクが中心です）。', 'Articles and reports from 2020 onward are included (older ones are mostly headlines and links).',
    'やさしい解説: 難しい記事には「やさしく言うと」と用語メモが付きます。経済に詳しくなくても読み進められます。', 'Plain explanations: harder articles come with “In plain words” and glossary notes, so you can follow along without an economics background.',
    '用語集: 経済・金融の用語を、説明と例つきで収録しています。', 'Glossary: economic and financial terms, with explanations and examples.',
    '自分用の機能: マーク、用語帳、メモ（マイページ）。', 'Personal features: marks, word books and memos (My page).',
    '今週の出来事、検索バー（記事・レポートを横断して探せます）、更新状況。', 'This week’s events, the search bar (searches across articles and reports), and update status.',
    '月→週の順にたどります。「すべて／国内／海外・グローバル」のタブで切り替えられ、月と分野でも絞り込めます。カードを押すと、理由と読む記事が開きます。', 'Go from month to week. Switch with the All / Japan / Overseas tabs, and filter by month and field. Press a card to see the reason and the articles to read.',
    '各出来事には、共有用の固定ページがあります。', 'Each event has a permanent page for sharing.', '記事／レポート', 'Articles / Reports',
    '2020年以降に集めたリンク。分野、レベル、視点、機関、細分類、年月などで絞り込めます。', 'Links collected since 2020. Filter by field, level, viewpoint, institution, subcategory, year and month.',
    '用語の検索。★などのマークや、自分の用語帳への追加ができます。', 'Search terms. Add marks such as ★ or put them in your own word book.',
    'マークを付けたものの一覧、用語帳、メモ、バックアップ。', 'Your marked items, word books, memos and backup.', 'ログインが必要です。', 'Login required.',
    'マイページを使うには、Googleまたはメールアドレスでログインします（無料）。ログインしなくても、記事・出来事・用語集は読めます。', 'To use My page, log in with Google or an email address (free). You can read articles, events and the glossary without logging in.',
    'マーク・用語帳・メモは、あなたのアカウントに保存され、別の端末でも使えます。他の人には見えません。', 'Marks, word books and memos are saved to your account and work on other devices. Nobody else can see them.',
    'マイページの「書き出し」で、内容をファイルに保存できます。「アカウントの削除」で、アカウントと保存内容をすべて消せます。', 'Use “Export” on My page to save your content to a file. “Delete account” removes the account and everything saved.',
    '詳しくは、ページ下部のプライバシーポリシーをご覧ください。', 'See the Privacy Policy at the bottom of the page for details.',
    'マーク・用語帳・メモは、このブラウザの中にだけ保存されます。他の人には見えません。', 'Marks, word books and memos are saved only in this browser. Nobody else can see them.',
    'ブラウザを変える・データを消すときは、マイページの「書き出し」で保存してください。「読み込み」で戻せます。', 'Before changing browsers or clearing data, save with “Export” on My page. “Import” brings it back.',
    '要約・やさしい説明・用語解説・歴史の補足・出来事の選定は、AIが作成しています。誤りや古い情報を含むことがあります。年や数値は必ず原文で確認してください。', 'Summaries, plain explanations, glossary entries, historical notes and the selection of events are made by AI. They may contain errors or outdated information. Always check years and figures in the original.',
    '投資・法律・税務などの助言ではありません。', 'This is not investment, legal or tax advice.', '各レポートの著作権は、各機関にあります。', 'Copyright of each report belongs to its institution.',
    '更新はおおむね週2回（月・木）です。最終更新日は、ページ下部に表示されています。', 'Updates happen roughly twice a week (Mon, Thu). The last update date is shown at the bottom of the page.',
    '「ホーム」で今週の出来事を見る。', 'See this week’s events on Home.', '出来事ごとの「読む記事」を、原文のページで読む。', 'Read the “article to read” for each event on the original page.',
    '気づいたこと・わからないことを、記事のノート欄に書く。必要ならAIに質問する。', 'Write what you notice or don’t understand in the article’s notes. Ask AI if you need to.', '「ノート」タブで、書きためたものと「もっと調べたいこと」を見返す。', 'Review what you wrote and your “want to look into more” in the Notes tab.',
    '「標準」「専門」の記事には、経済に詳しくない人向けの「やさしく言うと」と用語メモを付けています。', 'Articles rated “standard” or “specialist” come with “In plain words” and glossary notes for people new to economics.',
    '「記事」タブには、収集したすべてのレポートが並びます。要約があるのは一部で、残りは見出しだけです（分野は見出しから自動判定）。', 'The Articles tab lists every report collected. Only some have summaries; the rest are headlines only (the field is judged from the headline).',
    '「関連」は同じ話題の別の記事、「過去の参考」は少し前の似た話題の記事です。', '“Related” means other articles on the same topic; “Past references” are articles on similar topics from a little earlier.',
    '「AI補足・要確認」の欄は、AIが書いた歴史的な説明です。年や数値は必ず出典で確認してください。', 'The “AI note – please verify” box is a historical explanation written by AI. Always check years and figures against the source.',
    '「概要のみ」は、本文を読めず、タイトルや概要だけから作った要約です。', '“Overview only” means the full text was not available, so the summary comes from the title and overview only.',
    'タグを押すと、そのキーワードで記事を検索します。', 'Press a tag to search articles by that keyword.', 'トピックは公式RSSの見出しとリンクだけを使い、記事本文は保存していません。', 'Topics use only headlines and links from official RSS feeds; article bodies are not stored.',
    '記事ごとの学習ノートとAIへの質問、自由メモ。手元のサイトでのみ使えます。', 'Per-article study notes, questions to AI, and free memos. Available only on a local copy of the site.',
    // footer / cookie / misc
    '要約・レベル・歴史の補足はAIが作成しています。正確な内容は必ず原文でご確認ください。各レポートの著作権は各機関にあります。このサイトは見出し・要約・リンクのみを掲載しています。', 'Summaries, levels and historical notes are made by AI. Always check the original for accuracy. Copyright of each report belongs to its institution. This site shows only headlines, summaries and links.',
    '出来事の一覧', 'Event list', '用語集（一覧）', 'Glossary (list)', '利用規約・免責', 'Terms & Disclaimer', '運営者情報・お問い合わせ', 'Operator & Contact', '制作者から一言', 'A Word from the Creator',
    'Cookie設定', 'Cookie settings', 'Cookieの設定', 'Cookie settings', '広告', 'Advertising', '同意する', 'Agree', '同意しない', 'Decline',
    '広告配信のためにCookieを使います。同意しない場合、広告は表示されません（サイトは同じように使えます）。詳しくは', 'We use cookies to serve ads. If you decline, no ads are shown (the site works the same). For details, see the',
    'をご覧ください。', '.',
    '使い方・このサイトについて', 'How to use / About this site', 'その他', 'More', 'お問い合わせ', 'Contact',
    'リサーチ・ダイジェスト | 国内外のシンクタンク・金融機関レポートの要約', 'Research Digest | Summaries of think-tank and financial-institution reports'
  ]);

  add([
    // taxonomy (config/sources.json) and extra labels
    '金融市場', 'Financial markets', '日本経済', 'Japanese economy', '海外経済', 'Overseas economy', '政治・政策', 'Politics & policy', '産業・企業', 'Industry & business', '社会・家計', 'Society & households', 'その他', 'Other',
    '為替・株式・債券/金利・商品・暗号資産、金融政策の市場への影響', 'FX, stocks, bonds/rates, commodities, crypto assets, and the market impact of monetary policy',
    '景気・物価・賃金・GDP・日本の統計と見通し', 'Business cycle, prices, wages, GDP, and Japanese statistics and outlooks', '米国・欧州・中国・新興国の経済と国際金融', 'The US, Europe, China and emerging economies, and international finance',
    '政治・財政・税制・通商・地政学が経済に与える影響', 'How politics, fiscal policy, taxes, trade and geopolitics affect the economy', '産業動向・企業経営・AI/DX・エネルギー・環境', 'Industry trends, corporate management, AI/DX, energy and the environment',
    '労働・人口・地域・社会保障・消費者の行動', 'Labour, population, regions, social security and consumer behaviour', '上のどれにも当てはまらないもの', 'Anything that fits none of the above',
    'マクロ', 'Macro', 'ミクロ', 'Micro', '経済全体・景気・物価・金融政策・財政・為替など、国や世界全体の話', 'The economy as a whole: business cycle, prices, monetary and fiscal policy, FX – national or global topics',
    '個別の産業・企業・家計・市場の仕組みなど、個々の主体の話', 'Individual industries, firms, households and how markets work – topics about individual players',
    '入門', 'Beginner', '標準', 'Standard', '専門', 'Specialist', '経済の知識がなくても読める', 'Readable without economics knowledge',
    '経済学部・大学院生レベル。基礎〜中級の経済学・統計の知識があると読める', 'University / graduate level. Basic-to-intermediate economics and statistics help.', '実務家・専門家向け。専門用語や市場実務の前提知識が要る', 'For practitioners and experts. Requires specialist terms and market know-how.',
    '表示', 'View', '一覧（一言だけ）', 'List (one-liner)', '詳細（要約つき）', 'Detail (with summary)', 'テーマ', 'Themes', '地域別', 'By region', '動向', 'Trends', '政策', 'Policy', '労働', 'Labour', 'コンサル', 'Consulting', '法律', 'Law',
    '日本', 'Japan', '米国', 'US', '欧州', 'Europe', 'アジア', 'Asia', '中国', 'China', '新興国', 'Emerging markets', 'グローバル', 'Global',
    '国内外の研究機関のレポートを集め、出来事と結び付けて学ぶ', 'Collect reports from research institutions in Japan and abroad, and learn by linking them to events',
    '件）', ')', 'Claudeが閲覧', 'Viewed by Claude', '自動', 'Auto', '収集リンク', 'Links collected',
    // glossary categories
    '労働・社会', 'Labour & society', '資産運用・投資', 'Asset management & investing', 'デジタル・フィンテック', 'Digital & fintech', '企業・産業', 'Business & industry', '国際経済・各国', 'International economy & countries',
    '金融・市場', 'Finance & markets', '経済学の基礎', 'Economics basics', '財政・政策', 'Fiscal & policy', '金融政策・金利', 'Monetary policy & rates', '機関・統計', 'Institutions & statistics', '為替・国際', 'FX & international',
    '統計・指標', 'Statistics & indicators', '物価・景気', 'Prices & business cycle', 'エネルギー・環境', 'Energy & environment', '税・会計', 'Tax & accounting', '歴史・事件', 'History & events', '銀行・保険・決済', 'Banking, insurance & payments',
    '不動産・住宅', 'Real estate & housing', '法律・制度', 'Law & systems', '家計・生活', 'Households & daily life', '登録すると、', 'By signing up, you agree to the ', 'と', ' and ', 'に同意したものとみなします。ログインしなくても、記事・出来事・用語集は読めます。', '. You can read articles, events and the glossary without logging in.',
    '国内シンクタンク', 'Japanese think tanks', '海外機関', 'Overseas institutions',
    'マークを付けたものの一覧、用語帳、メモ、バックアップ。ログインが必要です。', 'Your marked items, word books, memos and backup. Login required.',
    '細分類で絞り込む（テーマ・地域・動向・政策・労働・コンサル・法律）', 'Filter by subcategory (theme, region, trend, policy, labour, consulting, law)',
    '経済・金融動向', 'Economic & financial trends', '政策・制度', 'Policy & systems', '労働・社会構造', 'Labour & social structure', 'コンサルティング', 'Consulting', '法律制度', 'Legal systems',
    // institutions and media (proper names)
    '第一生命経済研究所', 'Dai-ichi Life Research Institute', 'ニッセイ基礎研究所', 'NLI Research Institute', '日本総合研究所', 'Japan Research Institute', '日本銀行', 'Bank of Japan', '大和総研', 'Daiwa Institute of Research',
    '三菱UFJリサーチ&コンサルティング', 'Mitsubishi UFJ Research & Consulting', '三菱総合研究所', 'Mitsubishi Research Institute', 'みずほ総合研究所（旧みずほR&T）', 'Mizuho Research Institute (formerly Mizuho R&T)',
    '野村総合研究所', 'Nomura Research Institute', '野村資本市場研究所', 'Nomura Institute of Capital Markets Research', '伊藤忠総研', 'Itochu Research Institute',
    'Yahoo!ニュース', 'Yahoo! News', '東洋経済オンライン', 'Toyo Keizai Online', '日本経済新聞', 'Nikkei', 'みんかぶ FX/為替', 'Minkabu FX', 'NHKニュース', 'NHK News', '読売新聞', 'Yomiuri Shimbun',
    'ザイFX！', 'ZAi FX!', 'トウシル', 'Toushiru', '毎日新聞', 'Mainichi Shimbun', '食品新聞', 'Shokuhin Shimbun', '時事ドットコム', 'Jiji.com', '共同通信', 'Kyodo News', 'マネクリ', 'Manekuri', 'Googleニュース(ビジネス)', 'Google News (Business)'
  ]);

  // ---- patterns for text built from pieces (anchored to the whole text node) ----
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var WD = { '日': 'Sun', '月': 'Mon', '火': 'Tue', '水': 'Wed', '木': 'Thu', '金': 'Fri', '土': 'Sat' };
  function dateRe(s) {
    s = s.replace(/(\d{4})年(\d{1,2})月(\d{1,2})日（([日月火水木金土])）/g, function (_, y, m, d, w) { return WD[w] + ', ' + MON[+m - 1] + ' ' + +d + ', ' + y; });
    s = s.replace(/(\d{4})年(\d{1,2})月(\d{1,2})日/g, function (_, y, m, d) { return MON[+m - 1] + ' ' + +d + ', ' + y; });
    s = s.replace(/(\d{4})年(\d{1,2})月/g, function (_, y, m) { return MON[+m - 1] + ' ' + y; });
    return s;
  }
  var P = [
    [/^(.+?)　読む記事は (\d+)本$/, function (m) { return tr(m[1]) + ' · Articles to read: ' + m[2]; }],
    [/^(\d{4})年$/, '$1'], [/^(\d{1,2})月$/, function (m) { return MON[+m[1] - 1]; }],
    [/^(.+。)　更新: (.+)$/, function (m) { return tr(m[1]) + ' Updated: ' + m[2]; }],
    [/^報道を見る（(\d+)件）$/, 'See coverage ($1)'], [/^別の呼び方：(.+)$/, 'Also called: $1'], [/^共通キーワード: (.+)$/, 'Shared keywords: $1'], [/^記事に (\d+)回$/, 'In $1 articles'],
    [/^(.+?)　(\d{4}-\d{2}-\d{2})$/, function (m) { return tr(m[1]) + ' · ' + m[2]; }], [/^(.+?)　閲覧 (\d+)$/, function (m) { return tr(m[1]) + ' · ' + m[2] + ' views'; }],
    [/^(\d+)媒体が報道$/, 'Reported by $1 outlets'], [/^(\d+)\/(\d+)〜(\d+)\/(\d+)の週$/, 'Week of $1/$2–$3/$4'], [/^読む記事は (\d+)本$/, 'Articles to read: $1'],
    [/^(.+?)〜（(\d+)件）$/, '$1 – ($2 items)'], [/^：(.+)$/, function (m) { return ': ' + tr(m[1]); }],
    [/^(.+?)（(\d+)）$/, function (m) { var k = m[1].trim(); return Object.prototype.hasOwnProperty.call(D, k) ? D[k] + ' (' + m[2] + ')' : null; }],
    [/^(.+?) (\d+)$/, function (m) { return Object.prototype.hasOwnProperty.call(D, m[1]) ? D[m[1]] + ' ' + m[2] : null; }],
    [/^すべて見る（(\d+)件）→$/, 'See all ($1) →'], [/^用語を検索（(\d+)語）$/, 'Search terms ($1)'], [/^(\d+)件$/, '$1'], [/^（(\d+)件）$/, '($1)'], [/^(\d+)語$/, '$1 terms'],
    [/^(\d+)本$/, '$1'], [/^閲覧 (\d+)$/, '$1 views'], [/^報道を見る（(\d+)/, 'See coverage ($1'], [/^更新: (.+)$/, 'Updated: $1'], [/^更新 (.+)$/, 'Updated $1'],
    [/^さらに表示（残り (\d+)本）$/, 'Show more ($1 left)'], [/^(\d+)回$/, '$1 times'], [/^記事に (\d+)$/, 'In $1'], [/^「もっと調べたいこと」が (\d+)$/, '“Want to look into more”: $1'],
    [/^(\d{4}-\d{2}-\d{2})の週$/, 'Week of $1'], [/^「(.+)」に合うものは見つかりませんでした。別の言葉や、短い言葉でお試しください。$/, 'Nothing matched “$1”. Try other or shorter words.'],
    [/^(.+)」に追加しました$/, 'Added to “$1”'], [/^「(.+)」を削除しますか？$/, 'Delete “$1”?'], [/^ログイン中: (.+?)　?内容は自動で保存されます。$/, 'Logged in: $1. Your content is saved automatically.'],
    [/^(\d+)件を読み込みました。$/, '$1 imported.'], [/^うまくいきませんでした（(.+)$/, 'Something went wrong ($1'], [/^ログインできませんでした（(.+)$/, 'Could not log in ($1'],
    [/^収集リンク (\d+)本（うち要約 (\d+)本）　最終収集 (.+?)　更新 (.+)$/, '$1 links collected ($2 summarised) · last collected $3 · updated $4']
  ];

  function tr(s) {
    var m = /^([\s　]*)([\s\S]*?)([\s　]*)$/.exec(s), core = m[2], pre = m[1] ? ' ' : '', post = m[3] ? ' ' : '';
    if (!core || !JA.test(core)) return s;
    if (Object.prototype.hasOwnProperty.call(D, core)) return pre + D[core] + post;
    for (var i = 0; i < P.length; i++) {
      var mm = P[i][0].exec(core); if (!mm) continue;
      var out = typeof P[i][1] === 'function' ? P[i][1](mm) : core.replace(P[i][0], P[i][1]);
      if (out == null) continue;
      return pre + dateRe(out) + post;
    }
    var d = dateRe(core);
    if (d !== core) return pre + d + post;
    return s;
  }

  function fix(n) {
    if (n.nodeType === 3) { var t = n.nodeValue; if (JA.test(t)) { var r = tr(t); if (r !== t) n.nodeValue = r; } return; }
    if (n.nodeType !== 1) return;
    var tag = n.tagName; if (tag === 'SCRIPT' || tag === 'STYLE') return;
    ['placeholder', 'aria-label', 'title', 'alt'].forEach(function (a) { var v = n.getAttribute && n.getAttribute(a); if (v && JA.test(v)) { var r = tr(v); if (r !== v) n.setAttribute(a, r); } });
    if (tag === 'A') { var hr = n.getAttribute('href'); if (hr && /^(privacy|terms|contact|message)\.html$/.test(hr)) n.setAttribute('href', hr.replace('.html', '-en.html')); }
    for (var c = n.firstChild; c; c = c.nextSibling) fix(c);
  }

  function boot() {
    document.documentElement.setAttribute('lang', lang);
    // language switch (shown in both languages)
    var bar = document.querySelector('.bar');
    if (bar && !bar.querySelector('.langbtn')) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'langbtn'; b.textContent = lang === 'en' ? '日本語' : 'EN';
      b.setAttribute('aria-label', lang === 'en' ? '日本語で表示' : 'Switch to English');
      b.addEventListener('click', function () { try { localStorage.setItem(KEY, lang === 'en' ? 'ja' : 'en'); } catch (e) { /* ignore */ } location.reload(); });
      var help = document.getElementById('help'); if (help) bar.insertBefore(b, help); else bar.appendChild(b);
    }
    if (lang !== 'en') return;
    fix(document.body); document.title = tr(document.title);
    var mo = new MutationObserver(function (list) {
      mo.disconnect();
      list.forEach(function (r) {
        if (r.type === 'childList') r.addedNodes.forEach(fix);
        else fix(r.target);
      });
      document.title = tr(document.title);
      connect();
    });
    function connect() { mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'aria-label', 'title', 'alt'] }); }
    connect();
    var tt = document.querySelector('title'); if (tt) new MutationObserver(function () { var v = tr(document.title); if (v !== document.title) document.title = v; }).observe(tt, { childList: true });
  }
  window.__i18nDump = function () { var out = {}; (function w(n) { if (n.nodeType === 3) { var t = n.nodeValue.trim(); if (t && JA.test(t)) out[t] = 1; } else if (n.nodeType === 1 && n.tagName !== 'SCRIPT') for (var c = n.firstChild; c; c = c.nextSibling) w(c); })(document.body); return Object.keys(out); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
