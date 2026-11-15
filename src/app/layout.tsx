import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ikebukuro-mj.vercel.app"),
  title: { default: "池袋雀友会 ポータル", template: "%s | 池袋雀友会" },
  description: "2008年から池袋を拠点に活動するノーレート麻雀のサークルです",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body><a href="#main" className="skip-link">本文へ移動</a><Header/>{children}<footer className="site-footer"><div><Link href="/">池袋雀友会</Link><span>ノーレートで、楽しいひとときを。</span></div><small>IKEBUKURO JAN-YU-KAI · SINCE 2008</small></footer></body></html>;
}
