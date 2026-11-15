"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation } from "@/lib/navigation";

export function Header() {
  const pathname = usePathname();
  return <header className="site-header"><div className="header-inner">
    <Link className="brand" href="/" aria-label="池袋雀友会 トップ">池袋雀友会</Link>
    <nav className="main-nav" aria-label="共通メニュー"><Link href="/" aria-current={pathname === "/" ? "page" : undefined}>トップ</Link>{navigation.map(item => <Link key={item.href} href={item.href} aria-current={pathname.startsWith(item.href) ? "page" : undefined}>{item.label}</Link>)}</nav>
  </div></header>;
}
