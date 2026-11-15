import Link from "next/link";
import { HeroImage } from "@/components/hero-image";
import { Icon } from "@/components/icon";
import { navigation } from "@/lib/navigation";

export default function Home() {
  return <main id="main" className="home-main">
    <section className="hero"><div className="hero-copy"><p className="eyebrow"><span/> 仲間と囲む、いつもの一卓。</p><h1>池袋雀友会 <span>ポータル</span></h1><p className="intro">2008年から池袋を拠点に活動するノーレート麻雀のサークルです</p><div className="hero-actions"><Link className="button button-primary" href="/schedule"><Icon name="calendar"/>開催日程<span aria-hidden="true">↗</span></Link><Link className="button button-light" href="/score"><Icon name="chart"/>今期成績<span aria-hidden="true">↗</span></Link></div><p className="hero-note">会員のみなさんへ。開催情報と成績を、こちらから。</p></div><HeroImage/></section>
    <section className="menu-section" aria-labelledby="menu-title"><div className="section-heading"><div><p className="eyebrow">MEMBER&apos;S GUIDE</p><h2 id="menu-title">会員メニュー</h2></div><p>いつもの情報を、ひとつの場所に。</p></div><div className="menu-grid">{navigation.map((item, index) => <Link className={`menu-card menu-card-${index}`} href={item.href} key={item.href}><div className="card-top"><span className="menu-icon"><Icon name={item.icon}/></span><span className="card-index">0{index + 1}</span></div><p className="card-en">{item.en}</p><h3>{item.label}</h3><p>{item.description}</p><span className="card-arrow" aria-hidden="true">↗</span></Link>)}</div></section>
    <aside className="home-message"><span className="message-tile" aria-hidden="true">友</span><div><h2>勝っても、負けても、また一緒に。</h2><p>麻雀を通じた交流を大切に。今日も気持ちよく卓を囲みましょう。</p></div><Link href="/about">池袋雀友会について <span aria-hidden="true">→</span></Link></aside>
  </main>;
}
