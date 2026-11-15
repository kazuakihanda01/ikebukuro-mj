import Link from "next/link";
import { HeroImage } from "@/components/hero-image";
import { navigation } from "@/lib/navigation";
import "./home.css";

export default function Home() {
  return <main id="main" className="home-main">
    <section className="hero">
      <div className="hero-copy">
        <h1>池袋雀友会 <span>ポータル</span></h1>
        <p className="intro">2008年から池袋を拠点に活動するノーレート麻雀のサークルです</p>
      </div>
      <HeroImage/>
    </section>
    <section className="menu-section" aria-labelledby="menu-title">
      <div className="section-heading"><h2 id="menu-title">メニュー</h2></div>
      <div className="menu-grid">
        {navigation.map((item, index) => <Link className={`menu-card menu-card-${index}`} href={item.href} key={item.href}><h3>{item.label}</h3></Link>)}
      </div>
    </section>
  </main>;
}
