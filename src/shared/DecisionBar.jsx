import { useEffect, useRef, useState } from 'react';
import { recordOutboundClick } from './outboundClient.js';
import './decision-bar.css';

// Appears only after a visitor has reached and scrolled past the recommendation.
// No timed popups, hidden conditions or changes to the underlying ranking.
export default function DecisionBar({ anchorRef, name, detail, section, merchant, link, placement, caution }) {
  const [visible, setVisible] = useState(false);
  const barRef = useRef(null);
  useEffect(() => {
    const target = anchorRef.current;
    if (!target || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting && entry.boundingClientRect.bottom <= 0));
    observer.observe(target);
    return () => observer.disconnect();
  }, [anchorRef]);
  useEffect(() => {
    const bar = barRef.current;
    if (!visible || !bar || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => {
      const height = bar.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--vl-decision-space', height ? `${height + 12}px` : '0px');
    });
    observer.observe(bar);
    return () => { observer.disconnect(); document.documentElement.style.removeProperty('--vl-decision-space'); };
  }, [visible]);
  if (!visible || !link) return null;
  return <aside ref={barRef} className="vl-decision-bar" aria-label="選択した条件での候補">
    <div><strong>{name}</strong><span>{detail}</span>{caution && <small>{caution}</small>}</div>
    <a href={link.url} target="_blank" rel={link.sponsored ? 'sponsored noopener noreferrer' : 'noopener noreferrer'} onClick={() => recordOutboundClick({ section, merchant, placement, sponsored: link.sponsored })}>公式で条件を確認 ↗{link.sponsored && <em>PR</em>}</a>
  </aside>;
}
