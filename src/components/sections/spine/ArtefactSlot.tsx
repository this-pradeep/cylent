import type { ReactNode } from "react";

type ArtefactSlotProps = {
  /** Shown in the panel foot, e.g. "Draft 01 · artefact". */
  label: string;
  /** What the panel shows at rest. Empty until the creative work exists. */
  base?: ReactNode;
  /**
   * Revealed on hover as the panel takes the text side. Unreachable on touch, so this must
   * never hold information that is not available elsewhere — it is supplementary by rule.
   */
  detail?: ReactNode;
};

function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <p className="m-0 text-center font-mono text-[0.59rem] uppercase leading-[1.8] tracking-[0.16em] text-ink-muted">
      <span className="block font-semibold tracking-[0.1em] text-ink">{title}</span>
      {note}
    </p>
  );
}

/**
 * The 60% creative half of a draft card. Deliberately a swappable slot: the contents are
 * expected to change once real work exists, and filling it should be a one-file edit.
 */
export function ArtefactSlot({ label, base, detail }: ArtefactSlotProps) {
  return (
    <>
      <div className="relative grid min-h-0 flex-1 place-items-center rounded-[14px] border border-dashed border-ink/15 p-[18px]">
        <div className="draft-slot-layer draft-slot-base absolute inset-0 grid place-items-center p-[18px]">
          {base ?? <Placeholder title="Creative slot" note="Empty · awaiting content" />}
        </div>
        <div className="draft-slot-layer draft-slot-detail absolute inset-0 grid place-items-center p-[18px]">
          {detail ?? <Placeholder title="Detail layer" note="Revealed on hover" />}
        </div>
      </div>
      <p className="m-0 pt-3 font-mono text-[0.56rem] uppercase tracking-[0.14em] text-ink-muted">
        {label}
      </p>
    </>
  );
}
