import { connection } from "next/server";
import { getRules, cmsFailure } from "@/lib/cms";
import { PageShell, RichText, ContentUnavailable } from "@/components/content-page";
export const metadata = { title: "ルール" };
export default async function Rules() {
  await connection();
  let content;
  try { content = <RichText html={(await getRules()).rules}/>; }
  catch (error) { cmsFailure(error); content = <ContentUnavailable/>; }
  return <PageShell title="ルール" english="RULES"><section className="content-panel">{content}</section></PageShell>;
}
