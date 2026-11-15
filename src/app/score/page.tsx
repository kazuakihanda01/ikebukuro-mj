import { connection } from "next/server";
import { getScore, cmsFailure } from "@/lib/cms";
import { PageShell, RichText, ContentUnavailable } from "@/components/content-page";
export const metadata = { title: "今期成績", robots: { index: false, follow: true, googleBot: { index: false, follow: true } } };
export default async function Score() {
  await connection();
  let content;
  try { const score = await getScore(); content = <><section className="content-panel"><div className="panel-heading"><span className="status-dot"/><h2>今期速報</h2></div><RichText html={score.CurrentStandings}/></section><section className="content-panel"><h2>過去の成績</h2><RichText html={score.HistoricalStandings}/></section></>; }
  catch (error) { cmsFailure(error); content = <ContentUnavailable/>; }
  return <PageShell title="今期成績" english="STANDINGS">{content}</PageShell>;
}
