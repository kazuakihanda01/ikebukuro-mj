import sanitizeHtml from "sanitize-html";

export function sanitizeRichText(html: string): string {
  const clean = sanitizeHtml(html, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "img", "figure", "figcaption", "s", "del", "sub", "sup", "hr"],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "width", "height", "loading"],
      th: ["colspan", "rowspan", "scope"], td: ["colspan", "rowspan"],
      ol: ["start"], code: ["class"],
    },
    allowedSchemes: ["https", "http", "mailto", "tel"],
    allowedSchemesByTag: { img: ["https"] },
    allowProtocolRelative: false,
    transformTags: {
      a: (_name, attributes) => ({ tagName: "a", attribs: { ...attributes, rel: "noopener noreferrer" } }),
      img: (_name, attributes) => ({ tagName: "img", attribs: { ...attributes, loading: "lazy" } }),
    },
  });
  // Wrap only after sanitizing, so CMS input cannot create arbitrary UI containers.
  return clean.replace(/<table(\s[^>]*)?>/g, '<div class="table-scroll" role="region" aria-label="横にスクロールできる表" tabindex="0"><table$1>').replace(/<\/table>/g, "</table></div>");
}

