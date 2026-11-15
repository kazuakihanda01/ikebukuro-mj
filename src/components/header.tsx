"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { navigation } from "@/lib/navigation";

export function Header() {
  const pathname = usePathname();
  const [closeUnavailable, setCloseUnavailable] = useState(false);
  function closeApp() {
    window.close();
    if (!window.closed) setCloseUnavailable(true);
  }
  return <header className="site-header"><div className="header-inner">
    <div className="header-brand-row">
      <Link className="brand" href="/" aria-label="池袋雀友会 トップ">池袋雀友会</Link>
      <button className="close-app" type="button" aria-label="Webアプリを閉じる" onClick={closeApp}>閉じる</button>
    </div>
    <nav className="main-nav" aria-label="共通メニュー"><Link href="/" aria-current={pathname === "/" ? "page" : undefined}>トップ</Link>{navigation.map(item => <Link key={item.href} href={item.href} aria-current={pathname.startsWith(item.href) ? "page" : undefined}>{item.label}</Link>)}</nav>
  </div>{closeUnavailable && <p className="close-app-notice" role="status">この画面は自動で閉じられません。ブラウザーのタブを閉じてください。</p>}</header>;
}
