import { useState } from 'react';
import { savingsEstimate } from './savings.js';
import { serviceLink } from './affiliate.js';
import { recordOutboundClick } from '../shared/outboundClient.js';
import { recordFunnelEvent } from '../shared/outboundClient.js';
import './savings.css';

const yen = value => Math.abs(value).toLocaleString('ja-JP') + '円';

export default function SavingsPlanner() {
  const [current, setCurrent] = useState('');
  const [lines, setLines] = useState('1');
  const [usage, setUsage] = useState('10');
  const [support, setSupport] = useState('online');
  const [switchingCost, setSwitchingCost] = useState('0');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const destination = result ? serviceLink(result.service, import.meta.env) : null;
  function submit(event) {
    event.preventDefault();
    const estimate = savingsEstimate({ current, lines, usage, support, switchingCost });
    setResult(estimate);
    setError(estimate ? '' : '料金は0〜1,000,000円の整数、回線数は1〜6回線で入力してください。');
    if (estimate) recordFunnelEvent('savings_complete');
  }
  function edit(setter) { return event => { setter(event.target.value); setResult(null); setError(''); }; }
  return <section className="vl-savings" id="savings" aria-labelledby="vl-savings-title">
    <div className="vl-savings-copy"><span className="hl-kicker">毎月の支出を見直す</span>
      <h2 id="vl-savings-title">スマホ代を見直すと、<br/>1年でいくら変わる？</h2>
      <p>いまの料金と使い方から、掲載プランとの差額を計算。家族分の回線も、乗り換え費用も含めて考えられます。</p>
      <span className="vl-savings-badge">無料・登録不要・入力金額は送信しません</span>
    </div>
    <div className="vl-savings-work">
      <form onSubmit={submit}>
        <div className="vl-savings-fields">
          <label htmlFor="vl-current">現在の月額（1回線・端末代を除く）<span><input id="vl-current" required type="number" inputMode="numeric" min="0" max="1000000" step="1" value={current} onChange={edit(setCurrent)} placeholder="例：6000"/> 円</span></label>
          <label htmlFor="vl-lines">同じ使い方の回線数<select id="vl-lines" value={lines} onChange={edit(setLines)}>{[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}回線</option>)}</select></label>
          <label htmlFor="vl-usage">毎月使うデータ量<select id="vl-usage" value={usage} onChange={edit(setUsage)}><option value="3">3GB以内</option><option value="10">10GB以内</option><option value="30">30GB以内</option><option value="unlimited">100GB以上・大容量</option></select></label>
          <label htmlFor="vl-support">相談方法<select id="vl-support" value={support} onChange={edit(setSupport)}><option value="online">オンラインでOK</option><option value="store">店舗で相談したい</option></select></label>
          <label htmlFor="vl-switching">乗り換えの一時費用（全回線合計）<span><input id="vl-switching" required type="number" inputMode="numeric" min="0" max="1000000" step="1" value={switchingCost} onChange={edit(setSwitchingCost)}/> 円</span></label>
        </div>
        <button className="vl-primary" type="submit">年間の差額を計算する <span aria-hidden="true">→</span></button>
      </form>
      {error && <p role="alert">{error}</p>}
      <div aria-live="polite" aria-atomic="true">{result && <div className="vl-savings-result">
        <span>入力条件に合う掲載プランのうち、基本料金が最も安い候補</span>
        <h3>{result.service.name}<small>1回線 月額 {yen(result.target)}</small></h3>
        <p>{result.firstYear > 0 ? '初年度の支出が' : result.firstYear < 0 ? '初年度の支出は' : '初年度の差額は'} <strong>{yen(result.firstYear)}</strong> {result.firstYear > 0 ? '少なくなる計算です' : result.firstYear < 0 ? '増える計算です' : 'です'}</p>
        <small>{result.lines}回線・毎月の基本料金差 {result.monthly < 0 ? '増加 ' : ''}{yen(result.monthly)} × 12か月 − 一時費用 {yen(result.switchingCost)}{result.paybackMonths !== null && result.switchingCost > 0 ? `。費用回収の目安 ${result.paybackMonths}か月` : ''}</small>
        {result.firstYear > 0 && <a className="vl-primary vl-savings-official" href={destination.url} target="_blank" rel={destination.sponsored ? 'sponsored noopener noreferrer' : 'noopener noreferrer'} onClick={() => recordOutboundClick({ section: 'life', merchant: result.service.id, placement: 'savings-result', sponsored: destination.sponsored })}>{result.service.name}の料金・条件を確認 ↗{destination.sponsored && <small>PR</small>}</a>}
        <a className={result.firstYear > 0 ? 'vl-savings-compare' : 'vl-primary'} href={result.comparisonUrl} onClick={() => recordFunnelEvent('savings_compare')}>この使い方で各社を比較する →</a>
        <a href={result.service.sourceUrl} target="_blank" rel="noopener noreferrer">計算に使った料金の出典（公式） ↗</a>
      </div>}</div>
      <p className="vl-savings-note">税込・割引前の掲載基本料金による試算です。通話料・端末代・家族割・セット割・通信品質は含みません。各回線が同じ料金と使い方の場合の計算です。初期費用は入力した金額だけを反映します。削減額を保証するものではありません。</p>
    </div>
  </section>;
}
