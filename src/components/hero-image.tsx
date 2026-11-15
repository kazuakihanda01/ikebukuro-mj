"use client";
import { useEffect, useRef, useState } from "react";

export function HeroImage() {
  const [loaded, setLoaded] = useState(false);
  const photo = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (photo.current?.complete && photo.current.naturalWidth > 0) setLoaded(true);
  }, []);
  return <div className="hero-image">
    <div className="hero-fallback" aria-label="麻雀牌の装飾" aria-hidden={loaded}><span>東</span><span>南</span><span>西</span><span>北</span><span>發</span></div>
    <img ref={photo} src="/images/hero.png" alt="富士山を望む江戸の座敷で麻雀卓を囲む風景" fetchPriority="high" style={{ opacity: loaded ? 1 : 0 }} onLoad={() => setLoaded(true)} onError={() => setLoaded(false)} />
    <div className="image-caption">池袋で集い、麻雀を楽しむ。</div>
  </div>;
}
