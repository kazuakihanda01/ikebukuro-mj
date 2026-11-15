# 池袋雀友会 ポータル

Next.js App Router / TypeScript / React。会員はログインせず閲覧できます。トップ `/` はCMSを呼ばず表示します。成績集計は既存のGoogleスプレッドシートで継続し、CMS本文のリンクをそのまま表示します。

## ローカル起動

Node.js 22以上を使用します。

```sh
npm ci
cp .env.example .env.local
# .env.local にサーバー用の値を設定
npm run dev
```

`http://localhost:3000` を開きます。CMS未設定でもトップとナビゲーションを確認できます。CMSページは取得不能の案内を表示し、架空の開催情報や成績は表示しません。APIが公開終了・削除で404を返した記事は404ページになります。

```sh
npm run test
npm run typecheck
npm run build
npm run test:e2e
npm start
node --env-file=.env.local scripts/check-cms.mjs
```

最後のコマンドで実APIのフィールドIDを確認できます。秘密や記事本文は出力しません。`test:e2e` は直前の本番ビルドをポート3107で起動し、テストプロセス内だけでmicroCMS通信を模擬します。Chromiumが必要です（このクラウド環境の `/usr/bin/chromium` を自動使用、別環境では `PLAYWRIGHT_CHROMIUM_EXECUTABLE` を指定するか `npx playwright install chromium`）。CMSの実データは変更しません。

## Vercel

対象は既存の `ikebukuro-mj` プロジェクトと `kazuakihanda01/ikebukuro-mj` リポジトリ。本番URLは `https://ikebukuro-mj.vercel.app`。新しいVercelプロジェクトは作りません。

Project Settings → Environment Variables に次を設定します。プレビュー検証には **Preview**、後日の本番切り替えには **Production** を対象にしてください。`NEXT_PUBLIC_` は付けません。

| 変数 | 内容 |
| --- | --- |
| `MICROCMS_SERVICE_DOMAIN` | `ikebukuromj`（未設定時も同値） |
| `MICROCMS_API_KEY` | 対象5 APIの公開データにGET権限を持つ読み取り専用キー |
| `MICROCMS_TOPICS_COVER_FIELD` | 実スキーマで確認したカバー画像フィールドID（任意、下記参照） |

APIキーはサーバー専用モジュールだけで使用します。ドラフトキーは使いません。キーや `.env.local` をGitに含めないでください。

Framework PresetはNext.js、Root Directoryはリポジトリルート、Node.jsは22以上、Build Commandは `npm run build` です。既存Git連携のProduction Branchを変更せず、作業ブランチからPreview Deploymentを作成してください。CLI使用時は既存チームを選んで `vercel link --project ikebukuro-mj`、その後 `vercel` を実行します。`vercel --prod` は今回の範囲に含みません。CLI用 `VERCEL_TOKEN` は開発環境のシークレットとして管理し、アプリの環境変数には不要です。

既存プロジェクトのFrameworkは `nextjs` に設定済みで、ソースにも `vercel.json` を配置しています。読み取りAPIキーは既存のProduction設定を維持してPreviewにも追加済みです。CMSデータの更新は300秒キャッシュ方式で行い、Webhookの設定は不要です。

環境変数の追加・変更後はプレビューデプロイを作り直してください。通常のCMS本文更新では再デプロイは不要です。

動作確認したプレビュー: https://ikebukuro-mj-git-feat-memb-91ffa7-kazuakihanda01-5525s-projects.vercel.app （Vercel Authenticationあり）。実データとローカルのテストデータの検証範囲は `VERIFICATION.md` に記載しています。

## microCMSのAPI対応

ベースURL: `https://ikebukuromj.microcms.io/api/v1/`

| 公開ページ | APIと参照フィールド |
| --- | --- |
| `/schedule` | オブジェクト `schedule` の直下 `schedule` |
| `/score` | オブジェクト `score` の直下 `CurrentStandings` / `HistoricalStandings` |
| `/topics` | リスト `topics` の `contents`（100件ずつ全ページ取得） |
| `/topics/[id]` | `topics/{id}` の `title` / `body` / `displayDate` / `seasonYear` / `category` |
| `/about` | オブジェクト `about` の直下 `aboutus` |
| `/rules` | オブジェクト `rules` の直下 `rules` |

掲載日は `Asia/Tokyo` で表示。年度は `seasonYear` で絞り込みます。初期一覧では年度・分類・掲載日なしの記事も表示します。分類は配列の「お知らせ」「トピックス」を表示します。日付なしの記事は日付ありの記事の後に表示します。

カバー画像のフィールドIDは、接続後にAPI設定画面または `scripts/check-cms.mjs` の結果で確認して `MICROCMS_TOPICS_COVER_FIELD` に設定してください。未設定の場合は実レスポンス直下にHTTPSの `url` を持つ画像オブジェクトがちょうど1つあれば使用し、複数ある場合は推測しません。画像のない記事も表示します。読み取りAPIキーはVercel Previewで動作確認済みです。現在の公開記事にはカバー画像がなく、画像フィールドIDは実スキーマでの確認待ちです。

リッチHTMLは `sanitize-html` で許可要素・属性・URLに限定します。スクリプト・イベント属性・危険なURL・iframe・任意のstyleは除去。見出し、改行、表、HTTPS画像、通常のリンクは保持します。Googleスプレッドシートのリンクも保持します。表は専用の横スクロール領域で表示します。`/score` に `noindex` を設定しています（アクセス制限ではありません）。

## 300秒キャッシュによる更新

CMSの取得結果をNext.js Data Cache（`unstable_cache`）に **300秒** 保持します。対象は開催日程・成績・トピックス一覧/詳細・会の紹介・ルールです。トップは引き続きCMSを呼びません。

1. キャッシュがない場合は、サーバーからmicroCMSの公開済みデータを取得します。
2. キャッシュ作成から300秒以内のアクセスは、キャッシュを表示します。
3. 300秒経過後のアクセスでは、キャッシュを表示しながらバックグラウンドでAPIから再取得します。
4. 再取得後にページを開き直すと、新しい内容を確認できます。

アクセスがなければAPIを呼びません。常駐タイマー・Vercel Cron・ブラウザからの定期ポーリングは使いません。すでに開いている画面も自動では再読み込みしません。更新時刻の指定や日々の更新での再デプロイは不要です。これは300秒ごとに必ず通信する仕組みではなく、ユーザー指定の「300秒キャッシュし、期限後のアクセスで更新する」方式です。

キャッシュはAPIのURL（記事ID・ページ分割を含む）単位です。公開終了した記事の404もキャッシュの内容として記録し、古い公開本文が残り続けないようにします。再公開した場合も、404キャッシュの期限後の再取得で表示へ戻ります。APIの5xxや一時的な接続失敗では直近の成功したキャッシュを保持し、次のアクセスで再試行します。初回取得が失敗した場合は取得不能の案内を表示します。

Webhookの受信API `/api/revalidate` と共有シークレットは廃止しました。microCMS側のWebhook登録・`MICROCMS_WEBHOOK_SECRET` は不要です。以前に通知を登録してある場合は停止または削除してください。Vercelの未使用シークレットも削除できます。

プレビューと本番のキャッシュは別です。現在のVercel Authentication設定は維持しています。本番切り替えは別工程として、会員がログイン不要で閲覧できるよう保護の適用範囲を確認してください。

## トップPNGの差し替え

指定画像「富士を望む江戸の麻雀座敷.png」は `public/images/hero.png` に配置済みです。同じパスのPNGを差し替えてコミット・デプロイすれば更新できます。CMSやソースのパス変更は不要です。元PNGはカラーのまま保存し、トップページのCSSで白黒表示しています。

タイトルと説明はHTMLテキストです。画像とは分離しています。スマホは元画像の縦横比を使って高さを抑え、タブレットでは最大320pxにしています。`src/app/home.css` の `.hero-image>img` の `object-position` で富士山と麻雀卓の位置を調整できます。PC・スマホで元画像の表示を確認済みです。

全ページは白と黒を基調とし、しっぽり明朝を `public/fonts/` からローカル配信しています（SIL Open Font License 1.1）。メニューは名称のみで、説明文・英語・番号・アイコンを省いています。共通の配色と書体は `src/app/theme.css`、トップ専用のレイアウトは `src/app/home.css` にまとめています。

## 引き渡し確認

- PC/スマホでタイトル・説明・5メニュー・共通ナビゲーションを確認。
- 実APIの各本文と成績2区分、スプレッドシートの既存リンク先を確認。
- トピックス一覧/詳細、年度絞り込み、画像あり/なし、分類・日付なしの記事を確認。
- テスト用記事の公開・修正・公開終了について、300秒のキャッシュ期限後の再取得で一覧/詳細に反映されることを同じデプロイで確認。期限後の最初の閲覧は古いキャッシュを表示する場合があるため、再取得後にもう一度開き直してください。運営の実記事を無断で編集しないでください。

旧トピックスの一括移行・本番へのマージ/切り替えは今回の対象外です。
