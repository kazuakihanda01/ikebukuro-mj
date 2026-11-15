"use client";
import { useState } from "react";
import Link from "next/link";
import { categories, season, topicDate, type Topic, type CmsImage } from "@/lib/content";

// Article body and server configuration are never sent to the list client.
export type TopicSummary = Pick<Topic, "id" | "title" | "displayDate" | "seasonYear" | "category"> & { cover: CmsImage | null };
export function TopicList({ topics }: { topics: TopicSummary[] }) {
  const [year, setYear] = useState("");
  const years = [...new Set(topics.map(season).filter((item): item is string => !!item))].sort((a, b) => b.localeCompare(a, "ja", { numeric: true }));
  const visible = topics.filter(topic => !year || season(topic) === year);
  return <><div className="topics-toolbar"><p>{visible.length}件の記事</p><label htmlFor="season">年度で絞り込む<select id="season" value={year} onChange={event => setYear(event.target.value)}><option value="">すべての年度</option>{years.map(item => <option key={item} value={item}>{item}年度</option>)}</select></label></div><div className="topic-list" aria-live="polite">{visible.length ? visible.map(topic => {
    const date = topicDate(topic.displayDate);
    return <article key={topic.id} className="topic-card"><Link href={`/topics/${encodeURIComponent(topic.id)}`} className="topic-link">{topic.cover && <img className="topic-cover" src={topic.cover.url} alt="" loading="lazy"/>}<div className="topic-card-copy"><div className="topic-meta">{categories(topic).map(category => <span className="badge" key={category}>{category}</span>)}{date && <time dateTime={date.iso}>{date.label}</time>}{season(topic) && <span>{season(topic)}年度</span>}</div><h2>{topic.title || "無題の記事"}</h2></div></Link></article>;
  }) : <p className="empty-message">この年度の記事はありません。</p>}</div></>;
}
