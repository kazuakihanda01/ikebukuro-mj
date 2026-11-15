import { connection } from "next/server";
import { getScore, cmsFailure } from "@/lib/cms";
import { PageShell, RichText, ContentUnavailable } from "@/components/content-page";
export const metadata = { title: "スコア", robots: { index: false, follow: true, googleBot: { index: false, follow: true } } };
export default async function Score() {
  await connection();
  let content;
  try { const score = await getScore(); content = <><section className="content-panel"><RichText html={score.CurrentStandings}/></section><section className="content-panel"><h2>過去の成績</h2><RichText html={score.HistoricalStandings}/></section></>; }
  catch (error) { cmsFailure(error); content = <ContentUnavailable/>; }
  return <PageShell title="スコア">{content}</PageShell>;
}
