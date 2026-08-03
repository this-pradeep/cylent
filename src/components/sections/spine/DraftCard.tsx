import type { CSSProperties } from "react";
import { ArtefactSlot } from "./ArtefactSlot";

export type NoteLine = {
  /** Short bold prefix, e.g. "Q." or an em dash. */
  lead?: string;
  text: string;
  /** Struck through — a thing we considered and rejected. */
  struck?: boolean;
};

export type Draft = {
  rail: string;
  day: string;
  /** Drafts 01 and 02 are stamped OURS. Draft 03 is not, which is the closing line said early. */
  stamp: string;
  owned: boolean;
  word: string;
  body: string;
  note: NoteLine[];
  slotLabel: string;
};

type DraftCardProps = {
  draft: Draft;
  /** Sticky offset for this card, so each sits 17px below the one before it. */
  top: string;
  /** Scroll distance before the next card arrives. */
  gap: string;
  zIndex: number;
};

export function DraftCard({ draft, top, gap, zIndex }: DraftCardProps) {
  return (
    <article
      data-draft-card
      data-cursor
      style={{ "--card-top": top, "--card-gap": gap, zIndex } as CSSProperties}
      className="draft-card relative mb-[1.375rem] flex flex-col overflow-hidden rounded-3xl border border-ink/[0.13] bg-paper"
    >
      <div className="relative z-[3] grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-ink/[0.07] bg-paper px-[18px] py-[15px] font-mono text-[0.59rem] uppercase tracking-[0.16em] text-ink-muted md:px-7">
        <span>{draft.rail}</span>
        {draft.owned ? (
          <span className="-rotate-1 rounded-full border border-accent px-[9px] py-[3px] text-[0.53rem] tracking-[0.14em] text-accent">
            {draft.stamp}
          </span>
        ) : (
          <span className="px-[9px] py-[3px] text-[0.53rem] tracking-[0.14em]">{draft.stamp}</span>
        )}
        <span className="text-right">{draft.day}</span>
      </div>

      <div data-draft-body className="relative flex min-h-0 flex-1 flex-col min-[820px]:block">
        {/* 40% text side. The word sits in the leftmost 25% and is never covered; everything
            below it lives in the strip the panel sweeps over, so it fades rather than reflows. */}
        <div className="z-[1] flex flex-col p-5 min-[820px]:absolute min-[820px]:inset-y-0 min-[820px]:left-0 min-[820px]:w-2/5 min-[820px]:p-7">
          <p className="m-0 mb-3 font-mono text-[0.59rem] uppercase tracking-[0.18em] text-ink-muted min-[820px]:mb-[18px]">
            Movement
          </p>
          <h3 className="m-0 text-[clamp(1.5rem,3.2vw,2.6rem)] font-semibold leading-[0.96] tracking-[-0.04em] text-ink">
            {draft.word}
          </h3>
          <div className="draft-fade flex min-h-0 flex-1 flex-col">
            <p className="mt-4 max-w-[26ch] text-[clamp(0.79rem,0.98vw,0.88rem)] leading-[1.72] text-ink-muted min-[820px]:mt-[22px]">
              {draft.body}
            </p>
            <p className="mt-6 border-t border-ink/[0.05] pt-3.5 font-mono text-[0.56rem] uppercase leading-[1.7] tracking-[0.1em] text-ink-muted min-[820px]:mt-auto">
              {draft.note.map((line) => (
                <span key={line.text} className="block">
                  {line.lead ? (
                    <b className="font-semibold text-ink">{line.lead} </b>
                  ) : null}
                  <span className={line.struck ? "text-ink-muted/50 line-through decoration-accent" : undefined}>
                    {line.text}
                  </span>
                </span>
              ))}
            </p>
          </div>
        </div>

        {/* 60% creative side, widening to 75% on hover. Fixed width, moved on transform only. */}
        <div className="draft-panel z-[2] flex min-h-[190px] flex-col border-t border-ink/[0.07] bg-panel p-4 will-change-transform min-[820px]:absolute min-[820px]:inset-y-0 min-[820px]:left-1/4 min-[820px]:right-0 min-[820px]:min-h-0 min-[820px]:border-l min-[820px]:border-t-0 min-[820px]:p-5">
          <ArtefactSlot label={draft.slotLabel} />
        </div>
      </div>
    </article>
  );
}
