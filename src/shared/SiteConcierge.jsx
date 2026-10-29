import { Suspense, lazy, useEffect, useState } from 'react';
import './concierge-launcher.css';

// The chat (and the travel data behind it) loads only when someone opens it.
const ConciergeChat = lazy(() => import('./ConciergeChat.jsx'));

// Floating "AIに相談" button shown on every page of Vivlica.
export default function SiteConcierge({ section = 'site' }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(null);
  useEffect(() => {
    // Opened from the header button or "AIコンシェルジュに相談" links on the page.
    const onOpen = event => {
      setOpen(true);
      setLoaded(true);
      if (event.detail?.text) setPending({ text: event.detail.text, at: Date.now() });
    };
    window.addEventListener('hikaku:concierge-open', onOpen);
    return () => window.removeEventListener('hikaku:concierge-open', onOpen);
  }, []);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = e => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  useEffect(() => {
    // Close after the concierge hands a result to the page.
    const onAction = () => setOpen(false);
    window.addEventListener('hikaku:concierge-action', onAction);
    return () => window.removeEventListener('hikaku:concierge-action', onAction);
  }, []);

  return <div className="hcl-root">
    {(open || loaded) && <div className={'hcl-panel' + (open ? ' is-open' : '')} role="dialog" aria-modal="false" aria-label="Vivlica 条件検索アシスタント" hidden={!open}>
      <div className="hcl-panel-head">
        <span className="hcl-panel-mark" aria-hidden="true">✳</span>
        <div><strong>条件検索アシスタント</strong><small>旅行・商品・ITツールを掲載条件から探します</small></div>
        <button type="button" className="hcl-close" onClick={() => setOpen(false)} aria-label="閉じる">×</button>
      </div>
      <Suspense fallback={<p className="hcl-loading">読み込み中…</p>}>
        <ConciergeChat section={section} compact autoFocus={open} storageKey="hikaku-concierge" pending={pending} />
      </Suspense>
    </div>}
    <button type="button" className={'hcl-launcher' + (open ? ' is-open' : '')} aria-expanded={open} aria-haspopup="dialog"
      onClick={() => { setOpen(value => !value); setLoaded(true); }}>
      <span aria-hidden="true">{open ? '×' : '✳'}</span>{open ? '閉じる' : '条件を相談'}
    </button>
  </div>;
}
