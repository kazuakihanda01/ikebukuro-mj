import Link from "next/link";
export default function NotFound() { return <main id="main" className="content-main"><p className="eyebrow">404 · PAGE NOT FOUND</p><h1>ページが見つかりません</h1><p>この記事は公開を終了したか、URLが変更された可能性があります。</p><Link className="text-link" href="/topics">お知らせ・トピックスへ</Link><div className="back-home"><Link href="/">← トップへ戻る</Link></div></main>; }
