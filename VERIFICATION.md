# 検証記録

## 実施済み

- 元のGitHubリポジトリはコミット・ファイルなし。既存フレームワーク・環境変数定義・Vercelリンクファイルなし。
- 作業ブランチ: `feat/member-portal`。
- ユーザーよりVercelの本番ブランチは `main`、読み取りAPIキーはPreviewに設定済みとの確認あり。
- `feat/member-portal` をGitHubへpush済み。コミット `4bc8497` に対してVercelのGitHubステータスが `success`（Deployment has completed）。管理画面: https://vercel.com/kazuakihanda01-5525s-projects/ikebukuro-mj/HZJyYvjRBumcmYerL8CxrzVQQ2jj
- push後も本番URLはHTTP 404。`main` へのpush・本番切り替えは行っていない。
- ユーザーから共有されたプレビューURL: https://ikebukuro-j4rywf4pm-kazuakihanda01-5525s-projects.vercel.app
- 上記URLでトップ・5メニューの下層にHTTPアクセス。すべてVercelログインへ転送され、Deployment Protectionによる閲覧制限を確認（ログイン画面のHTTP 200をアプリの表示成功とは扱っていない）。
- `npm run build` 成功。トップは静的ページ、CMSページはリクエスト時描画。CMS取得結果はData Cacheで保持。
- `npm run typecheck` 成功。
- `npm test` 6件成功。HTMLのサニタイズ、日本時間表示、任意画像フィールド、署名検証など。
- `npm run test:e2e` 成功。本番ビルドを使用したテスト用CMSレスポンスで確認。実CMSの編集・公開操作は行っていない。
- 360 / 390 / 768 / 1440px の4画面幅で、トップ・5メニューの下層・記事詳細の計7ページを確認。画面全体の横はみ出しなし。長い表は表内の横スクロールを確認。
- 開催日程・今期成績の優先ボタン、共通ナビ、年度絞り込み、記事詳細遷移、画像ありの記事、分類・日付なしの旧記事を確認。
- 100件を超える記事のページ分割取得を確認（102件のfixture）。
- `CurrentStandings` と `HistoricalStandings`、Googleスプレッドシート形式のリンク保持、`/score` のnoindexを確認。
- 同じページの再表示でCMS呼び出しが増えないことを確認。
- 不正署名のWebhookは401となり、キャッシュは保持。
- 正常署名後は最初の再読込で本文変更を反映。
- 記事の公開終了で一覧から消え、詳細はHTTP 404。再公開でキャッシュ済み404から復帰。同じサーバー・ビルドで確認。
- PC・スマホのトップのスクリーンショットを目視確認。指定PNGがない状態の代替表示での確認。

## 未確認・必要な入力

- 指定画像は会話上で確認済み。ただし元PNGファイルが実行環境に共有されていないため `public/images/hero.png` は未配置。ファイルの受領後、富士山と麻雀卓の切り抜き位置を確認する。
- `MICROCMS_API_KEY` はVercel Previewに設定済み（ユーザー確認）。この開発環境には未設定。各APIの実レスポンス、記事カバーの実フィールドID、実際の過去成績リンク先、実Webhook配送は未確認。
- Vercelの自動デプロイ成功はGitHubステータスで確認済み。プレビューURLも受領済み。Deployment Protectionのため本文を取得できず、プレビュー上の動作検証は未実施。ログイン不要の共有リンクを依頼中。
- `MICROCMS_WEBHOOK_SECRET` の設定と、プレビューURL向けCMS Webhookの設定は未確認。
- 空リポジトリへの初回pushにより、GitHubのデフォルトブランチは `feat/member-portal` となった。Vercelの本番ブランチ `main` は変更していない。

公開プレビューURL（またはVercelへの接続）と指定PNGファイルを受け取り、READMEの実データ確認を続行する。実Webhook検証には共有シークレットとCMS側の設定も必要。
