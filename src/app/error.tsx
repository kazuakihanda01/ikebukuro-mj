"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <main id="main" className="content-main"><h1>ページを表示できませんでした</h1><p>時間をおいて、もう一度お試しください。</p><button className="button button-primary" onClick={reset}>もう一度表示する</button></main>; }
