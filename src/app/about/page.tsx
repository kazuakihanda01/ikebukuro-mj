import { connection } from "next/server";
import { getAbout, cmsFailure } from "@/lib/cms";
import { PageShell, RichText, ContentUnavailable } from "@/components/content-page";
export const metadata = { title: "池袋雀友会について" };
export default async function About() {
  await connection();
  let content;
  try { content = <RichText html={(await getAbout()).aboutus}/>; }
  catch (error) { cmsFailure(error); content = <ContentUnavailable/>; }
  return <PageShell title="池袋雀友会について"><section className="content-panel">{content}</section></PageShell>;
}
