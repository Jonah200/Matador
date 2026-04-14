import SectionLabel from "./SectionLabel";

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

function RelatedCoverageSection({ keywords = [], stories = [] }) {
    if (keywords.length === 0 && stories.length === 0) {
        return null;
    }

    return (
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)] shadow-sm">
            <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_55%)]" />

            <div className="relative p-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <SectionLabel text="Related Coverage" />
                        <p className="text-[12px] leading-5 text-slate-600 max-w-[40ch]">
                            Context pulled from the article’s most prominent people,
                            places, and organizations.
                        </p>
                    </div>

                    {stories.length > 0 ? (
                        <div className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                            {stories.length} story{stories.length === 1 ? "" : "ies"}
                        </div>
                    ) : null}
                </div>

                {keywords.length > 0 ? (
                    <div className="mt-4">
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

                {stories.length > 0 ? (
                    <div className="mt-5 grid gap-3">
                        {stories.slice(0, 2).map((story) => (
                            <StoryCard key={story.id} story={story} />
                        ))}

                        {stories.length > 2 ? (
                            <div className="grid gap-3 md:grid-cols-2">
                                {stories.slice(2).map((story) => (
                                    <StoryCard key={story.id} story={story} />
                                ))}
                            </div>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </section>
    );
}

export default RelatedCoverageSection;
