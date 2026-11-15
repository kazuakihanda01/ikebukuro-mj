import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { CmsError, getTopic, cmsFailure } from "@/lib/cms";
import { categories, coverImage, season, topicDate } from "@/lib/content";
import { PageShell, RichText, ContentUnavailable } from "@/components/content-page";
export const metadata = { title: "記事 | お知らせ・トピックス" };
export default async function TopicDetail({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) notFound();
  let topic;
  try { topic = await getTopic(id); }
  catch (error) {
    if (error instanceof CmsError && error.status === 404) notFound();
    cmsFailure(error);
    return <PageShell title="お知らせ・トピックス"><ContentUnavailable/></PageShell>;
  }
  const date = topicDate(topic.displayDate);
  const image = coverImage(topic, process.env.MICROCMS_TOPICS_COVER_FIELD);
  return <PageShell title="お知らせ・トピックス"><article className="content-panel article-panel"><div className="topic-meta">{categories(topic).map(category => <span className="badge" key={category}>{category}</span>)}{date && <time dateTime={date.iso}>{date.label}</time>}{season(topic) && <span>{season(topic)}年度</span>}</div><h2 className="article-title">{topic.title || "無題の記事"}</h2>{image && <img className="article-cover" src={image.url} alt={topic.title || "記事のカバー画像"}/>}<RichText html={topic.body}/></article><Link className="text-link" href="/topics">お知らせ・トピックス一覧へ</Link></PageShell>;
}
