import { useCallback, useEffect, useState } from 'react';
import {
  PAGE_LABELS, SECTION_LABELS, SOURCE_LABELS, dailyCsv, formatCount, formatRate, formatYen, parseConversionCsv, rate,
} from './report.js';
import './admin.css';

const TOKEN_KEY = 'hikaku-admin-token';
const RANGES = [[7, '7日'], [30, '30日'], [90, '90日']];
const ERRORS = {
  unauthorized: '管理トークンが違います。',
  store_not_configured: 'データの保存先（Upstash Redis）がまだ接続されていません。docs/ANALYTICS.md の手順で接続してください。',
  admin_not_configured: 'Vercel の環境変数 ADMIN_TOKEN（16文字以上）が未設定です。',
  store_unavailable: 'データの保存先に接続できませんでした。少し待ってから再読み込みしてください。',
};

const readToken = () => { try { return sessionStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; } };
const writeToken = value => { try { value ? sessionStorage.setItem(TOKEN_KEY, value) : sessionStorage.removeItem(TOKEN_KEY); } catch { /* private mode */ } };

async function api(token, { method = 'GET', query = '', body } = {}) {
  const response = await fetch('/api/stats' + query, {
    method,
    headers: { Authorization: 'Bearer ' + token, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'http_' + response.status);
  return data;
}

function Login({ onLogin, error }) {
  const [value, setValue] = useState('');
  return <form className="ad-login" onSubmit={e => { e.preventDefault(); if (value.trim()) onLogin(value.trim()); }}>
    <h1>アクセス・成果レポート</h1>
    <p>Vercel の環境変数 <code>ADMIN_TOKEN</code> に設定した管理トークンを入力してください。トークンはこのタブを閉じると消えます。</p>
    <label htmlFor="ad-token">管理トークン</label>
    <input id="ad-token" type="password" autoComplete="current-password" value={value} onChange={e => setValue(e.target.value)} />
    {error && <p className="ad-error" role="alert">{error}</p>}
    <button type="submit">表示する</button>
  </form>;
}

function Kpi({ label, value, note }) {
  return <div className="ad-kpi"><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div>;
}

function DailyChart({ daily }) {
  const max = Math.max(1, ...daily.map(d => d.views));
  const w = 760, h = 200, gap = 2, bw = Math.max(2, (w - gap * daily.length) / daily.length);
  return <figure className="ad-chart">
    <svg viewBox={`0 0 ${w} ${h + 22}`} role="img" aria-label="日別のページビューと訪問者数">
      {daily.map((d, i) => {
        const x = i * (bw + gap);
        const vh = (d.views / max) * h, uh = (d.visitors / max) * h;
        const showLabel = daily.length <= 14 || i % Math.ceil(daily.length / 10) === 0;
        return <g key={d.day}>
          <title>{`${d.day}：訪問者 ${d.visitors}／PV ${d.views}／クリック ${d.clicks}／成果 ${d.conversions}`}</title>
          <rect x={x} y={h - vh} width={bw} height={vh} className="ad-bar-views" />
          <rect x={x + bw * 0.2} y={h - uh} width={bw * 0.6} height={uh} className="ad-bar-visitors" />
          {d.conversions > 0 && <circle cx={x + bw / 2} cy={Math.max(6, h - vh - 8)} r="3.5" className="ad-dot-conv" />}
          {showLabel && <text x={x + bw / 2} y={h + 16} textAnchor="middle">{d.day.slice(5).replace('-', '/')}</text>}
        </g>;
      })}
    </svg>
    <figcaption><span className="ad-key ad-key-views" />ページビュー <span className="ad-key ad-key-visitors" />訪問者数 <span className="ad-key ad-key-conv" />成果があった日</figcaption>
  </figure>;
}

function Table({ caption, head, rows, empty = 'まだデータがありません' }) {
  return <section className="ad-card">
    <h2>{caption}</h2>
    {rows.length === 0 ? <p className="ad-empty">{empty}</p> : <div className="ad-scroll"><table>
      <thead><tr>{head.map((label, i) => <th key={label} scope="col" className={i ? 'num' : ''}>{label}</th>)}</tr></thead>
      <tbody>{rows.map(row => <tr key={row[0] + row.slice(1).join('|')}>{row.map((cell, i) => i ? <td key={i} className="num">{cell}</td> : <th key={i} scope="row">{cell}</th>)}</tr>)}</tbody>
    </table></div>}
  </section>;
}

function ConversionImport({ token, onSaved }) {
  const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
  const [single, setSingle] = useState({ day: today, merchant: '', conversions: '1', revenue: '' });
  const [csv, setCsv] = useState('');
  const [message, setMessage] = useState('');
  async function save(rows) {
    setMessage('保存しています…');
    try {
      const result = await api(token, { method: 'POST', body: { rows } });
      setMessage(`${result.saved}件の行を保存しました。`);
      onSaved();
    } catch (error) {
      setMessage(error.message === 'invalid_row' ? '入力に誤りがある行があります（日付・件数・金額を確認）。' : ERRORS[error.message] || '保存できませんでした。');
    }
  }
  const parsed = parseConversionCsv(csv);
  return <section className="ad-card ad-import">
    <h2>成果（購入・申込）を記録する</h2>
    <p>楽天アフィリエイト・A8.net・Amazonアソシエイトなどの成果は、各社の管理画面にしかありません。レポートの数字をここに入れると、クリック数と並べて成約率・報酬を確認できます。同じ日付・同じ名前で入れ直すと上書きされます（二重に数えません）。</p>
    <form className="ad-single" onSubmit={e => { e.preventDefault(); save([{ ...single, conversions: Number(single.conversions), revenue: Number(single.revenue || 0) }]); }}>
      <label>日付<input type="date" required value={single.day} onChange={e => setSingle({ ...single, day: e.target.value })} /></label>
      <label>ショップ・案件名<input required maxLength={40} placeholder="例：rakuten / 楽天モバイル" value={single.merchant} onChange={e => setSingle({ ...single, merchant: e.target.value })} /></label>
      <label>件数<input type="number" min="0" step="1" required value={single.conversions} onChange={e => setSingle({ ...single, conversions: e.target.value })} /></label>
      <label>報酬額（円）<input type="number" min="0" step="1" value={single.revenue} onChange={e => setSingle({ ...single, revenue: e.target.value })} /></label>
      <button type="submit">1行保存</button>
    </form>
    <label className="ad-csv-label" htmlFor="ad-csv">まとめて貼り付け（CSV・スプレッドシートからコピー可）<small>形式：日付, ショップ・案件名, 件数, 報酬額</small></label>
    <textarea id="ad-csv" rows={5} value={csv} onChange={e => setCsv(e.target.value)} placeholder={'2026-10-01,rakuten,3,1240\n2026-10-01,楽天モバイル,1,2000'} />
    <div className="ad-import-foot">
      <span>{csv.trim() ? `読み取り：${parsed.rows.length}行${parsed.errors.length ? `／読めない行：${parsed.errors.join('・')}行目` : ''}` : ''}</span>
      <button type="button" disabled={!parsed.rows.length || parsed.errors.length > 0} onClick={() => save(parsed.rows)}>まとめて保存</button>
    </div>
    {message && <p className="ad-message" role="status">{message}</p>}
    <p className="ad-hint">ショップ名をクリック計測と同じID（rakuten, amazon, yahoo-shopping, rakuten-mobile など）にすると、下の「ショップ・サービス別」で同じ行にまとまり、成約率が出ます。</p>
  </section>;
}

export default function AdminPage() {
  const [token, setToken] = useState(readToken);
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      setData(await api(token, { query: '?days=' + days }));
    } catch (e) {
      setError(ERRORS[e.message] || '読み込めませんでした（' + e.message + '）');
      if (e.message === 'unauthorized') { writeToken(''); setToken(''); }
    } finally { setLoading(false); }
  }, [token, days]);
  useEffect(() => { load(); }, [load]);

  if (!token) return <main className="ad-page"><Login error={error} onLogin={value => { writeToken(value); setToken(value); }} /></main>;

  function exportCsv() {
    const url = URL.createObjectURL(new Blob(['﻿' + dailyCsv(data.daily)], { type: 'text/csv' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `hikaku-labo-${data.range.from}_${data.range.to}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  }

  const t = data?.totals;
  return <main className="ad-page">
    <header className="ad-head">
      <div><span className="ad-kicker">HIKAKU LABO / OWNER REPORT</span><h1>アクセス・成果レポート</h1>
        {data && <p>{data.range.from} 〜 {data.range.to}（日本時間）</p>}</div>
      <div className="ad-tools">
        <div className="ad-range" role="group" aria-label="期間">{RANGES.map(([n, label]) =>
          <button key={n} type="button" aria-pressed={days === n} onClick={() => setDays(n)}>{label}</button>)}</div>
        <button type="button" onClick={load} disabled={loading}>{loading ? '読み込み中…' : '再読み込み'}</button>
        {data && <button type="button" onClick={exportCsv}>CSVで保存</button>}
        <button type="button" className="ad-ghost" onClick={() => { writeToken(''); setToken(''); setData(null); }}>ログアウト</button>
      </div>
    </header>
    {error && <p className="ad-error" role="alert">{error}</p>}
    {t && <>
      <section className="ad-kpis" aria-label="期間の合計">
        <Kpi label="訪問者数" value={formatCount(t.visitors)} note="同じ人の同じ日の訪問は1人（日をまたぐと別に数えます）" />
        <Kpi label="ページビュー" value={formatCount(t.views)} note={t.visitors ? `1人あたり ${(t.views / t.visitors).toFixed(1)} ページ` : null} />
        <Kpi label="外部リンククリック" value={formatCount(t.clicks)} note={`クリック率 ${formatRate(rate(t.clicks, t.views))}`} />
        <Kpi label="成果（購入・申込）" value={formatCount(t.conversions)} note={`成約率 ${formatRate(rate(t.conversions, t.clicks))}（クリック比）`} />
        <Kpi label="報酬額" value={formatYen(t.revenue)} note={t.visitors ? `訪問者1人あたり ${formatYen(t.revenue / t.visitors)}` : null} />
      </section>
      <section className="ad-card"><h2>日別の推移</h2><DailyChart daily={data.daily} /></section>
      <div className="ad-grid">
        <Table caption="ページ別" head={['ページ', 'ページビュー', '訪問者数']}
          rows={data.pages.map(p => [PAGE_LABELS[p.page] || p.page, formatCount(p.views), formatCount(p.visitors)])} />
        <Table caption="流入元（どこから来たか）" head={['流入元', 'ページビュー', '割合']}
          rows={data.sources.map(s => [SOURCE_LABELS[s.source] || s.source, formatCount(s.views), formatRate(rate(s.views, t.views))])} />
      </div>
      <Table caption="ショップ・サービス別（クリックと成果）" head={['ショップ・サービス', '分野', 'クリック', 'うち広告', '成果', '成約率', '報酬額']}
        rows={data.merchants.map(m => [m.merchant, SECTION_LABELS[m.section] || '—', formatCount(m.clicks), formatCount(m.sponsoredClicks),
          formatCount(m.conversions), formatRate(rate(m.conversions, m.clicks)), formatYen(m.revenue)])} />
      <Table caption="掲載位置別のクリック" head={['掲載位置', '分野', 'クリック']}
        rows={data.placements.slice(0, 30).map(p => [p.placement, SECTION_LABELS[p.section] || p.section, formatCount(p.clicks)])} />
    </>}
    <ConversionImport token={token} onSaved={load} />
    <section className="ad-card ad-notes">
      <h2>数字の見方</h2>
      <ul>
        <li><b>訪問者数</b>：Cookieを使わず、日ごとに変わる暗号化した値で数えています。同じ人でも日が違えば別の訪問者になり、検索エンジンのロボットは除外しています。</li>
        <li><b>成果・報酬</b>：ASP（楽天・A8.net・Amazonなど）の管理画面の数字を入力したものです。最終的な確定額は各ASPの画面で確認してください。</li>
        <li>広告ブロッカーを使っている人など、計測されない訪問があるため、実際より少し少なめに出ます。</li>
      </ul>
    </section>
  </main>;
}
