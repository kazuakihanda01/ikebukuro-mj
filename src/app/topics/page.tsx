import { connection } from "next/server";
import { getTopics, cmsFailure } from "@/lib/cms";
import { coverImage, sortTopics } from "@/lib/content";
import { PageShell, ContentUnavailable } from "@/components/content-page";
import { TopicList } from "@/components/topic-list";
export const metadata = { title: "お知らせ・トピックス" };
export default async function Topics() {
  await connection();
  let content;
  try {
    const topics = sortTopics(await getTopics()).map(topic => ({ id: topic.id, title: topic.title, displayDate: topic.displayDate, seasonYear: topic.seasonYear, category: topic.category, cover: coverImage(topic, process.env.MICROCMS_TOPICS_COVER_FIELD) }));
    content = <TopicList topics={topics}/>;
  } catch (error) { cmsFailure(error); content = <ContentUnavailable/>; }
  return <PageShell title="お知らせ・トピックス">{content}</PageShell>;
}
