import { Readability } from "@mozilla/readability";

export type ExtractedArticle = {
    title: string;
    url: string;
    byline: string | null;
    excerpt: string;
    contentText: string;
    length: number;
    siteName: string | null;
    extractedAt: string;
};

function normalizeWhitespace(input: string): string {
    return input.replace(/\s+/g, " ").trim();
}

function preCleanForReadability(doc: Document): void {
    // Trim obvious ad and embedded noise before handing the clone to Readability.
    const adJunkSelectors = [
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
        "script",
        "style",
        "noscript",
        "iframe",
        ".advertisement"
    ];

    const nodes = doc.querySelectorAll(adJunkSelectors.join(", "));
    nodes.forEach((node) => node.remove());
}

function extractTextWithParagraphs(parsed: ReturnType<Readability["parse"]>): string {
    const contentHtml = parsed?.content;
    if (!contentHtml) {
        return normalizeWhitespace(parsed?.textContent ?? "");
    }

    const htmlDoc = new DOMParser().parseFromString(contentHtml, "text/html");
    // Prefer paragraph boundaries when they are available so previews stay readable.
    const paragraphs = Array.from(htmlDoc.querySelectorAll("p"))
        .map((p) => normalizeWhitespace(p.textContent ?? ""))
        .filter(Boolean);

    if (paragraphs.length > 0) {
        return paragraphs.join("\n\n");
    }

    return normalizeWhitespace(htmlDoc.body?.textContent ?? parsed?.textContent ?? "");
}

export function extractArticleFromPage(doc: Document = document): ExtractedArticle | null {
    const safeDoc = document.implementation.createHTMLDocument(doc.title);

    safeDoc.body.innerHTML = doc.body.innerHTML;

    preCleanForReadability(safeDoc);

    const parsed = new Readability(safeDoc).parse();

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