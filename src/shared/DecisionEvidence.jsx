import { EDITORIAL_PANELS } from './editorialPanels.js';
import './DecisionEvidence.css';

/** Shared, source-conscious alternative to decorative dashboard hero art. */
export default function DecisionEvidence({ section }) {
  const data = EDITORIAL_PANELS[section];
  if (!data) return null;
  return <aside className="vl-decision-evidence" aria-label={data.ariaLabel}>
    <p className="vl-decision-evidence__eyebrow">{data.eyebrow}</p>
    <h2>{data.title}</h2>
    <dl>{data.rows.map(row => <div key={row.label}>
      <dt>{row.label}</dt>
      <dd>{row.value}</dd>
    </div>)}</dl>
    <p className="vl-decision-evidence__note">{data.footnote}</p>
    <a href={data.href}>{data.linkLabel} <span aria-hidden="true">↗</span></a>
  </aside>;
}
