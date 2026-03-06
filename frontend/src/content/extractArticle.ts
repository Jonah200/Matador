import { Readability } from "@mozilla/readability";

export type ExtractedArticle = {
  title: string;
  url: string;
  byline: string | null;
  excerpt: string | null;
  contentText: string;
  length: number;
  siteName: string | null;
  extractedAt: string;
};

function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function preCleanForReadability(doc: Document): void {
  const adSelectors = [
    "aside[aria-label*='advert' i]",
    "[aria-label*='advertisement' i]",
    "[aria-label*='sponsored' i]",
    "[data-ad]",
    "[data-ad-slot]",
    "[data-ad-container]",
    "[data-ad-unit]",
    "[data-testid*='ad' i]",
    "[id*='advert' i]",
    "[id*='sponsor' i]",
    "[class*='advert' i]",
    "[class*='sponsor' i]",
    "[class*='ad-slot' i]",
    "[class*='adslot' i]",
    "[class*='ad-unit' i]",
    "[class*='adunit' i]",
  ];

  const nodes = doc.querySelectorAll(adSelectors.join(", "));
  nodes.forEach((node) => node.remove());
}

function extractTextWithParagraphs(parsed: ReturnType<Readability["parse"]>): string {
  const contentHtml = parsed?.content;
  if (!contentHtml) {
    return normalizeWhitespace(parsed?.textContent ?? "");
  }

  const htmlDoc = new DOMParser().parseFromString(contentHtml, "text/html");
  const paragraphs = Array.from(htmlDoc.querySelectorAll("p"))
    .map((p) => normalizeWhitespace(p.textContent ?? ""))
    .filter(Boolean);

  if (paragraphs.length > 0) {
    return paragraphs.join("\n\n");
  }

  return normalizeWhitespace(htmlDoc.body?.textContent ?? parsed?.textContent ?? "");
}

export function extractArticleFromPage(doc: Document = document): ExtractedArticle | null {
  const cloned = doc.cloneNode(true) as Document;
  preCleanForReadability(cloned);
  const parsed = new Readability(cloned).parse();
  const text = extractTextWithParagraphs(parsed);
  const plainText = normalizeWhitespace(text);

  if (!text) {
    return null;
  }

  const title = normalizeWhitespace(parsed?.title || doc.title || "Untitled");
  const excerptSource = normalizeWhitespace(parsed?.excerpt ?? "");
  const excerpt = excerptSource || (plainText.length > 280 ? `${plainText.slice(0, 280)}...` : plainText);

  return {
    title,
    url: doc.location?.href ?? "",
    byline: parsed?.byline ?? null,
    excerpt,
    contentText: text,
    length: parsed?.length ?? text.length,
    siteName: parsed?.siteName ?? doc.location?.hostname ?? null,
    extractedAt: new Date().toISOString(),
  };
}
