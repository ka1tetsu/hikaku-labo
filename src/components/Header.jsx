import SiteHeader from '../shared/SiteHeader.jsx';

export default function Header({ inputValue, setInputValue, onSearch }) {
  return <SiteHeader active="products">
    <div className="hl-searchbar">
      <div className="hl-container hl-searchbar-row">
        <span className="hl-searchbar-prompt"><img src="/icons/tabler/search.svg" alt="" aria-hidden="true" width="19" height="19"/> 商品を探す</span>
        <form className="hl-searchform" role="search" onSubmit={onSearch}>
          <label className="hl-visually-hidden" htmlFor="hl-product-search">商品名・キーワード</label>
          <input
            id="hl-product-search"
            type="search"
            value={inputValue}
            onChange={event => setInputValue(event.target.value)}
            placeholder="例：ワイヤレスイヤホン、1万円以下のノートPC、母の日のプレゼント"
            autoComplete="off"
          />
          <button type="submit">商品を検索 <img src="/icons/tabler/arrow-right.svg" alt="" aria-hidden="true" width="17" height="17"/></button>
        </form>
        <span className="hl-searchbar-help">「予算」「用途」もそのまま入力OK</span>
      </div>
    </div>
  </SiteHeader>;
}
