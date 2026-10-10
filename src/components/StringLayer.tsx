import { memo, type RefObject } from 'react';
import { stringPath, tiePoint } from '../lib/strings';
import { WALL_H, WALL_W, type Link, type Note } from '../types';

interface Props {
  links: Link[];
  notes: Note[];
  /** String tool is up: strings take clicks, and a click cuts. */
  cutting: boolean;
  onCut: (id: string) => void;
  svgRef: RefObject<SVGSVGElement>;
  /** The loose end while a string is being pulled out — see useTieString. */
  liveRef: RefObject<SVGPathElement>;
}

/**
 * Red yarn between notes, drawn over them (it's wound round the fasteners,
 * after all) but under the vignette. Wall units throughout, like the ink.
 */
function StringLayerImpl({ links, notes, cutting, onCut, svgRef, liveRef }: Props) {
  const byId = new Map(notes.map((n) => [n.id, n]));

  return (
    <svg
      ref={svgRef}
      className={`strings ${cutting ? 'is-cutting' : ''}`}
      viewBox={`0 0 ${WALL_W} ${WALL_H}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      {links.map((l) => {
        const a = byId.get(l.a);
        const b = byId.get(l.b);
        // One end is in the bin. The link waits there in case it comes back.
        if (!a || !b) return null;
        const pa = tiePoint(a);
        const pb = tiePoint(b);
        const d = stringPath(pa, pb);
        return (
          <g
            key={l.id}
            className="strings__link"
            data-a={l.a}
            data-b={l.b}
            onClick={cutting ? () => onCut(l.id) : undefined}
          >
            <path className="strings__shadow" d={d} />
            <path className="strings__yarn" d={d} />
            <path className="strings__hit" d={d} />
            <circle className="strings__knot" cx={pa.x} cy={pa.y} r={3.6} />
            <circle className="strings__knot" cx={pb.x} cy={pb.y} r={3.6} />
          </g>
        );
      })}
      <path ref={liveRef} className="strings__yarn strings__live" />
    </svg>
  );
}

export const StringLayer = memo(StringLayerImpl);

/**
 * Re-ties the strings on a note that's mid-drag. The drag moves the note by
 * hand, outside React, so its strings have to be moved the same way or
 * they'd stay behind until the note was dropped.
 */
export function retie(
  svg: SVGSVGElement | null,
  id: string,
  moved: Note,
  notes: Map<string, Note>,
): void {
  if (!svg) return;
  svg.querySelectorAll<SVGGElement>(`[data-a="${id}"], [data-b="${id}"]`).forEach((g) => {
    const movedIsA = g.dataset.a === id;
    const other = notes.get((movedIsA ? g.dataset.b : g.dataset.a) ?? '');
    if (!other) return;
    const pm = tiePoint(moved);
    const po = tiePoint(other);
    const [pa, pb] = movedIsA ? [pm, po] : [po, pm];
    const d = stringPath(pa, pb);
    g.querySelectorAll('path').forEach((p) => p.setAttribute('d', d));
    const [ka, kb] = g.querySelectorAll('circle');
    ka?.setAttribute('cx', String(pa.x));
    ka?.setAttribute('cy', String(pa.y));
    kb?.setAttribute('cx', String(pb.x));
    kb?.setAttribute('cy', String(pb.y));
  });
}
