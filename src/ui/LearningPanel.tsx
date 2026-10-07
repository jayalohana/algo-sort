import { metaFor } from "../sorting/metadata";
import type { AlgorithmId } from "../sorting/algorithms";

interface LearningPanelProps {
  algorithm: AlgorithmId;
  line: number | null;
}

const KEY = [
  { label: "Moving / held", color: "#ef2d3c" },
  { label: "Compared", color: "#ffb020" },
  { label: "Sorted", color: "#2fd671" },
  { label: "Pivot", color: "#8b5cf6" },
  { label: "Unsorted", color: "#c9ccd4" },
];

/** Explanation, complexity, pseudocode + color key in an expandable panel. */
export function LearningPanel({ algorithm, line }: LearningPanelProps) {
  const meta = metaFor(algorithm);
  return (
    <details className="panel disclosure">
      <summary>How it works: {meta.name}</summary>
      <div className="disclosure-body">
        <p className="blurb">{meta.blurb}</p>

        <dl className="complexity">
          <div>
            <dt>Best</dt>
            <dd>{meta.best}</dd>
          </div>
          <div>
            <dt>Average</dt>
            <dd>{meta.average}</dd>
          </div>
          <div>
            <dt>Worst</dt>
            <dd>{meta.worst}</dd>
          </div>
          <div>
            <dt>Space</dt>
            <dd>{meta.space}</dd>
          </div>
        </dl>

        <div className="pseudo">
          <h3>Pseudocode</h3>
          <ol>
            {meta.pseudo.map((l, i) => (
              <li key={i} className={line === i + 1 ? "hot" : undefined}>
                {l}
              </li>
            ))}
          </ol>
        </div>

        <div className="key">
          <h3>Color key</h3>
          <ul>
            {KEY.map((k) => (
              <li key={k.label}>
                <span
                  className="swatch"
                  style={{ background: k.color }}
                  aria-hidden="true"
                />
                {k.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </details>
  );
}
