import { connection } from "next/server";
import { getSchedule, cmsFailure } from "@/lib/cms";
import { PageShell, RichText, ContentUnavailable } from "@/components/content-page";
export const metadata = { title: "開催日程" };
export default async function Schedule() {
  await connection();
  let content;
  try { content = <RichText html={(await getSchedule()).schedule}/>; }
  catch (error) { cmsFailure(error); content = <ContentUnavailable/>; }
  return <PageShell title="開催日程"><section className="content-panel">{content}</section></PageShell>;
}
