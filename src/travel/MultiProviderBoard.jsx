import { useEffect, useMemo, useState } from 'react';
import { filterProviderRows, prepareProviderRows, providerComparisonRows } from './providerBoard.js';
import YahooTravelAd from './YahooTravelAd.jsx';
import './multi-provider.css';

// Inspired by the tasks found on established booking sites, not a copy of their design.
// Here we compare booking destinations and which search inputs can be passed forward.
// Prices can only be ranked when a licensed provider returns comparable actual totals.
export default function MultiProviderBoard({ providers, category, criteria, onOutbound }) {
  const [phrase, setPhrase] = useState('');
  const [onlyReady, setOnlyReady] = useState(false);
  const [sort, setSort] = useState('handoff');
  const [layout, setLayout] = useState('list');
  const [selected, setSelected] = useState([]);
  useEffect(() => {
    setPhrase('');
    setOnlyReady(false);
    setSelected([]);
  }, [category]);
  const rows = useMemo(() => prepareProviderRows(providers, criteria), [providers, criteria]);
  const visible = useMemo(() => filterProviderRows(rows, { phrase, onlySearchReady: onlyReady, sort }), [rows, phrase, onlyReady, sort]);
  const readyCount = rows.filter(row => row.hasSearchHandoff).length;
  const compared = selected.map(id => rows.find(row => row.provider.id === id)).filter(Boolean);
  const toggle = id => setSelected(ids => ids.includes(id) ? ids.filter(existing => existing !== id) : ids.length < 4 ? [...ids, id] : ids);
  const fields = providerComparisonRows();
  function go(row, placement = 'global') {
    onOutbound?.(row.provider, Boolean(row.target.sponsored), placement);
  }
  return <section className="mp-board" aria-label="旅行予約サイトの比較一覧">
    <header className="mp-summary">
      <div><p className="mp-eyebrow">COMPARE BOOKING OPTIONS</p>
        <h3>予約サイトを見比べる</h3>
        <p>現在の分類で<strong>{rows.length}社</strong>を掲載。<strong>{readyCount}社</strong>は検索条件の一部を引き継げます。</p>
      </div>
      <a className="mp-total-link" href="#travel-total-cost">確認した金額を総額で比較する →</a>
    </header>
    <div className="mp-search-tools">
      <label className="mp-filter-search">予約サイトや特徴を検索
        <input type="search" value={phrase} onChange={e => setPhrase(e.target.value)}
          placeholder="例：ポイント、キャンセル、国内ホテル" maxLength={80}/>
      </label>
      <label className="mp-sort">並び替え
        <select value={sort} onChange={e => setSort(e.target.value)}>
          <option value="handoff">入力条件を引き継げる順</option>
          <option value="name">サイト名順</option>
        </select>
      </label>
      <label className="mp-ready-toggle"><input type="checkbox" checked={onlyReady}
        onChange={e => setOnlyReady(e.target.checked)}/>条件を引き継げるサイトのみ</label>
      <div className="mp-layout-switch" role="group" aria-label="比較結果の表示方法">
        <button type="button" aria-pressed={layout === 'list'} onClick={() => setLayout('list')}>一覧</button>
        <button type="button" aria-pressed={layout === 'cards'} onClick={() => setLayout('cards')}>カード</button>
      </div>
    </div>
    <div className="mp-results-count" role="status">{visible.length}社を表示
      {phrase && <button type="button" onClick={() => setPhrase('')}>検索語をクリア</button>}
    </div>
    {visible.length === 0 ? <div className="mp-empty">
      <strong>条件に合う予約サイトはありません。</strong>
      <p>「検索条件を引き継げるサイトのみ」を解除すると、通常の公式サイトも表示できます。</p>
      <button type="button" onClick={() => { setPhrase(''); setOnlyReady(false); }}>絞り込みを解除する</button>
    </div> : <div className={layout === 'cards' ? 'mp-results is-cards' : 'mp-results is-list'}>
      {visible.map(row => {
        const { provider, target, hasSearchHandoff, transferredFields } = row;
        const marked = selected.includes(provider.id);
        return <article className="mp-provider" key={provider.id}>
          <div className="mp-provider-name"><span className="mp-provider-letter" aria-hidden="true">{provider.name[0]}</span>
            <div><h4>{provider.name}</h4><p>{provider.capabilities.join(' ・ ')}</p></div>
          </div>
          <div className="mp-provider-conditions">
            <strong>{hasSearchHandoff ? '一部の条件を引き継ぎ' : '条件は予約先で入力'}</strong>
            <small>{hasSearchHandoff ? transferredFields.join('・') : '目的地・日付・人数などを予約先で指定'}</small>
          </div>
          <div className="mp-provider-price"><span>現在の予約料金</span><strong>未取得</strong>
            <small>最終価格・空席/空室は予約先で確認</small></div>
          <div className="mp-provider-actions">
            <a href={target.url} target="_blank" rel={target.sponsored ? 'sponsored noopener noreferrer' : 'noopener noreferrer'}
              onClick={() => go(row)}>
              {hasSearchHandoff ? '条件を引き継いで検索' : 'サイトで料金を確認'} ↗
              {target.sponsored && <span className="mp-ad-mark">PR</span>}
            </a>
            <label className="mp-pick"><input type="checkbox" checked={marked} disabled={!marked && selected.length >= 4}
              onChange={() => toggle(provider.id)}/>比較表に追加</label>
          </div>
        </article>;
      })}
    </div>}
    <div className="mp-footer-hint"><strong>予約前の確認</strong>
      <p>同じ目的地でも、宿泊日・人数・部屋・食事・取消条件が違えば金額は比べられません。広告の有無はサイトの表示順に影響しません。</p></div>
    {compared.length > 0 && <section className="mp-selection" aria-labelledby="mp-selection-title">
      <div className="mp-selection-head"><div><p className="mp-eyebrow">YOUR SHORTLIST</p>
        <h3 id="mp-selection-title">選んだ{compared.length}社を横並びで比較</h3></div>
        <button type="button" onClick={() => setSelected([])}>選択を解除</button></div>
      <div className="mp-comparison-scroll" tabIndex="0" role="region" aria-label="選んだ旅行予約サイトの比較表。横スクロール可能です">
        <table><caption>掲載サービスの特徴と検索引継ぎの比較（料金比較ではありません）</caption>
          <thead><tr><th scope="col">比較項目</th>{compared.map(row => <th scope="col" key={row.provider.id}>{row.provider.name}</th>)}</tr></thead>
          <tbody>{fields.map(field => <tr key={field.label}><th scope="row">{field.label}</th>
            {compared.map(row => <td key={row.provider.id}>{field.get(row)}</td>)}</tr>)}
            <tr><th scope="row">料金を確認</th>{compared.map(row => <td key={row.provider.id}>
              <a href={row.target.url} target="_blank" rel={row.target.sponsored ? 'sponsored noopener noreferrer' : 'noopener noreferrer'}
                onClick={() => go(row, 'global-shortlist')}>{row.provider.name}で確認 ↗{row.target.sponsored ? '（PR）' : ''}</a>
            </td>)}</tr></tbody>
        </table>
      </div>
      <p>最大4社まで。実際の販売料金を取得していません。最新の空席・空室も未取得です。サイトで確認した総額は、<a href="#travel-total-cost">支払総額の比較ツール</a>に入力できます。</p>
    </section>}
    {category === 'hotel' && <div className="mp-yahoo-sponsor">
      <h3>Yahoo!トラベルも宿泊候補に</h3>
      <p>同じ宿泊日・人数・部屋タイプで、即時ポイント利用後の支払額とキャンセル規定をご確認ください。</p>
      <YahooTravelAd variant="banner234" placement="multi-provider-yahoo"/>
    </div>}
  </section>;
}
