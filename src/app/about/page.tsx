import { connection } from "next/server";
import { getAbout, cmsFailure } from "@/lib/cms";
import { PageShell, RichText, ContentUnavailable } from "@/components/content-page";
export const metadata = { title: "池袋雀友会について" };
export default async function About() {
  await connection();
  let content;
  try {
    const about = await getAbout();
    const picture = about.Adviserpic;
    content = <>
      <RichText html={about.aboutus}/>
      {about.Adviser?.trim() && <div className="adviser-content"><RichText html={about.Adviser}/></div>}
      {picture?.url?.startsWith("https://") && <img className="adviser-picture" src={picture.url} alt="池袋雀友会の顧問紹介" width={picture.width} height={picture.height} loading="lazy"/>}
    </>;
  }
  catch (error) { cmsFailure(error); content = <ContentUnavailable/>; }
  return <PageShell title="池袋雀友会について"><section className="content-panel">{content}</section></PageShell>;
}
