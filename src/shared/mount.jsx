import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';

// ビルド時に静的HTML（scripts/prerender.mjs）が埋め込まれていればハイドレーションし、
// そうでなければ（開発サーバー等）通常どおり描画する。
// クエリ付きURL（?keyword=…）は静的HTMLと初期表示が異なるため、作り直して描画する。
export function mount(element) {
  const container = document.getElementById('root');
  const app = <StrictMode>{element}</StrictMode>;
  if (container.hasChildNodes() && !window.location.search) {
    hydrateRoot(container, app);
  } else {
    container.textContent = '';
    createRoot(container).render(app);
  }
}
