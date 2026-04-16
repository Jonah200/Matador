import { useState } from "react";
import SectionLabel from "./SectionLabel";

function normalizeStoryUrl(url) {
    try {
        const parsed = new URL(url);
        parsed.hash = "";
        return parsed.toString();
    } catch {
        return url || "";
    }
}

function StoryCard({ story }) {
    return (
        <a
            href={story.link}
            target="_blank"
            rel="noreferrer"
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
        >
            <div className="aspect-[16/9] bg-slate-100 overflow-hidden">
                {story.imageUrl ? (
                    <img
                        src={story.imageUrl}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                ) : (
                    <div className="h-full w-full bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50" />
                )}
            </div>

            <div className="p-4">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {story.source ? <span>{story.source}</span> : null}
                    {story.date ? <span>{story.date}</span> : null}
                </div>

                <h3 className="mt-2 text-[14px] font-bold leading-5 text-slate-900">
                    {story.title}
                </h3>

                {story.snippet ? (
                    <p className="mt-2 text-[12px] leading-5 text-slate-600">
                        {story.snippet}
                    </p>
                ) : null}
            </div>
        </a>
    );
}

function RelatedCoverageSection({ keywords = [], stories = [], currentUrl = "" }) {
    const [showStories, setShowStories] = useState(false);
    const filteredStories = stories.filter(
        (story) =>
            story?.link &&
            normalizeStoryUrl(story.link) !== normalizeStoryUrl(currentUrl)
    );

    if (keywords.length === 0 && filteredStories.length === 0) {
        return null;
    }

    return (
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)] shadow-sm">
            <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_55%)]" />

            <div className="relative">
                <div className="bg-[linear-gradient(180deg,_rgba(239,246,255,0.95)_0%,_rgba(248,251,255,0.85)_100%)] px-4 py-4 sm:px-5 sm:py-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="pr-2">
                            <SectionLabel text="Related Coverage" />
                            <p className="mt-1 text-[12px] leading-6 text-slate-600 max-w-[40ch]">
                                Similar reporting from other outlets, matched using the
                                article’s main people, places, organizations, and headline.
                            </p>
                        </div>

                        {filteredStories.length > 0 ? (
                            <div className="flex items-center gap-2">
                                <div className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                                    {filteredStories.length} {filteredStories.length === 1 ? "story" : "stories"}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowStories((value) => !value)}
                                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                                    aria-expanded={showStories}
                                    aria-controls="related-coverage-stories"
                                >
                                    {showStories ? "Hide stories" : "Show stories"}
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
                    {keywords.length > 0 ? (
                        <div className="border-t border-slate-100 pt-5">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Key entities
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {keywords.map((keyword) => (
                                    <span
                                        key={keyword}
                                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm"
                                    >
                                        {keyword}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {filteredStories.length === 0 ? (
                        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-3 text-[12px] leading-5 text-slate-600">
                            No related coverage found yet from other outlets for this article.
                        </div>
                    ) : null}

                    {filteredStories.length > 0 && showStories ? (
                        <div id="related-coverage-stories" className="mt-4 grid gap-3">
                            {filteredStories.slice(0, 2).map((story) => (
                                <StoryCard key={story.id} story={story} />
                            ))}

                            {filteredStories.length > 2 ? (
                                <div className="grid gap-3 md:grid-cols-2">
                                    {filteredStories.slice(2).map((story) => (
                                        <StoryCard key={story.id} story={story} />
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </div>
        </section>
    );
}

export default RelatedCoverageSection;
