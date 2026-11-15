import Link from "next/link";
import { sanitizeRichText } from "@/lib/rich-text";

export function PageShell({ title, english, children }: { title: string; english: string; children: React.ReactNode }) {
  return <main id="main" className="content-main"><div className="breadcrumbs"><Link href="/">トップ</Link><span aria-hidden="true">/</span><span>{title}</span></div><header className="page-heading"><p className="eyebrow">{english}</p><h1>{title}</h1></header>{children}<div className="back-home"><Link href="/">← トップへ戻る</Link></div></main>;
}
export function RichText({ html }: { html?: string }) {
  return html?.trim() ? <div className="rich-text" dangerouslySetInnerHTML={{ __html: sanitizeRichText(html) }}/> : <p className="empty-message">現在、掲載されている情報はありません。</p>;
}
export function ContentUnavailable() {
  return <div className="notice" role="status"><h2>情報を表示できませんでした</h2><p>時間をおいて、もう一度ページを開いてください。</p></div>;
}
