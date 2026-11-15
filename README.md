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
| `MICROCMS_WEBHOOK_SECRET` | CMSのWebhook設定と同じ十分長いランダム文字列 |
| `MICROCMS_TOPICS_COVER_FIELD` | 実スキーマで確認したカバー画像フィールドID（任意、下記参照） |

APIキーはサーバー専用モジュールだけで使用します。ドラフトキーは使いません。キーや `.env.local` をGitに含めないでください。

Framework PresetはNext.js、Root Directoryはリポジトリルート、Node.jsは22以上、Build Commandは `npm run build` です。既存Git連携のProduction Branchを変更せず、作業ブランチからPreview Deploymentを作成してください。CLI使用時は既存チームを選んで `vercel link --project ikebukuro-mj`、その後 `vercel` を実行します。`vercel --prod` は今回の範囲に含みません。CLI用 `VERCEL_TOKEN` は開発環境のシークレットとして管理し、アプリの環境変数には不要です。

既存プロジェクトのFrameworkは `nextjs` に設定済みで、ソースにも `vercel.json` を配置しています。読み取りAPIキーは既存のProduction設定を維持してPreviewにも追加済みです。Webhookシークレットは未設定で、実通信確認はユーザー指示により今回は保留です。

環境変数の追加・変更後はプレビューデプロイを作り直してください。通常のCMS本文更新では再デプロイは不要です。

動作確認したプレビュー: https://ikebukuro-deaq2wtw1-kazuakihanda01-5525s-projects.vercel.app （Vercel Authenticationあり）。実データとローカルのテストデータの検証範囲は `VERIFICATION.md` に記載しています。

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

## キャッシュとWebhook

CMSページはリクエスト時にサーバーで描画し、CMSのfetch結果をNext.js Data Cacheに `force-cache` / `revalidate: false` で保持します。TTLや定期更新はありません。初回や無効化後にAPIから公開済みデータを取得します。CMS未設定・取得失敗の画面自体を永続キャッシュしません。

5 APIそれぞれのAPI設定 → Webhook → カスタム通知を設定します。

1. URL: `https://<対象のデプロイURL>/api/revalidate`（POST）
2. 通知内容: microCMS標準JSON（`api` / `id` / `type` を含む）
3. 通知条件: 公開・公開中コンテンツの更新・公開終了・削除など、公開内容が変わるイベントすべて。予約公開/予約公開終了を使う場合も対象にします。
4. シークレット: Vercelの `MICROCMS_WEBHOOK_SECRET` と同じ値を設定。

microCMS標準の `x-microcms-signature` を、生のリクエスト本文に対するHMAC-SHA256（hex）と定数時間比較します。URLに秘密を含めません。未設定は503、不正署名は401、不明APIや不正JSONは400です。

認証成功後、対象APIのキャッシュタグを即時期限切れにし、対象ページも無効化します。`topics` は一覧・該当詳細を対象とします（IDがない場合は全詳細）。次に開き直したリクエストで再取得するため、古い内容を一度返す方式は使いません。すでに開いている画面の自動更新は行いません。CMS側のWebhook失敗履歴も確認してください。

プレビューと本番のキャッシュは別です。プレビュー確認にはプレビューURL向けWebhookを追加します。Vercel Deployment Protectionが有効ならmicroCMSからの通知も止まるため、既存設定を確認し、Vercel公式のAutomation Bypassなど運用上承認された方法を設定してください。今回、保護設定や本番向けWebhookを勝手に変更しません。プレビューを削除したら検証用Webhookも削除します。

現在の既存設定はVercel Authenticationが `all_except_custom_domains` で有効です。本番URLも `vercel.app` ドメインのため、別工程の本番切り替え時に、会員がログイン不要で閲覧できるよう保護の適用範囲も確認してください。

本番切り替え時は、別工程として本番URLのWebhookを設定・検証します。CMS取得失敗時に公開終了記事の本文を返す独自フォールバックは設けていません。

## トップPNGの差し替え

指定画像「富士を望む江戸の麻雀座敷.png」は `public/images/hero.png` に配置済みです。同じパスのPNGを差し替えてコミット・デプロイすれば更新できます。CMSやソースのパス変更は不要です。元PNGはカラーのまま保存し、トップページのCSSで白黒表示しています。

タイトルと説明はHTMLテキストです。画像とは分離しています。スマホは元画像の縦横比を使って高さを抑え、タブレットでは最大320pxにしています。`src/app/home.css` の `.hero-image>img` の `object-position` で富士山と麻雀卓の位置を調整できます。PC・スマホで元画像の表示を確認済みです。

トップページは白と黒を基調とし、しっぽり明朝を `public/fonts/` からローカル配信しています（SIL Open Font License 1.1）。メニューは名称のみで、説明文・英語・番号・アイコンを省いています。トップ専用の配色と書体は `src/app/home.css` にまとめています。

## 引き渡し確認

- PC/スマホでタイトル・説明・5メニュー・共通ナビゲーションを確認。
- 実APIの各本文と成績2区分、スプレッドシートの既存リンク先を確認。
- トピックス一覧/詳細、年度絞り込み、画像あり/なし、分類・日付なしの記事を確認。
- テスト用記事を公開 → 表示 → 本文修正 → 再読込 → 公開終了 → 一覧から消え詳細404、を同じデプロイで確認。運営の実記事を無断で編集しないでください。
- 不正署名で401、正常Webhook後の再読込で変更が反映されることを確認。

旧トピックスの一括移行・本番へのマージ/切り替えは今回の対象外です。
