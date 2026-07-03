/* ポータル本体。ログイン後に GAS からアプリ一覧を取得して描画する。
   一覧データは公開ソースに持たない（サーバ側の Script Property から取得）。 */

function busyOff() {}   // auth.js が任意で参照

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// アイコン（単色SVG）。GAS側 icon 値に対応。未知は box。
const APP_ICONS = {
  box:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 20 7v10l-8 4-8-4V7l8-4Z"/><path d="M12 3v18M4 7l8 4 8-4"/></svg>',
  truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.7"/><circle cx="17.5" cy="18" r="1.7"/></svg>',
  boxes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5 12 4l9 4.5-9 4.5-9-4.5Z"/><path d="M3 12l9 4.5L21 12M3 15.5 12 20l9-4.5"/></svg>'
};
const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

async function boot() {
  try {
    const apps = await api('getApps');
    renderApps(apps || []);
    document.getElementById('loading').style.display = 'none';
    document.getElementById('app').style.display = '';
  } catch (e) {
    document.getElementById('loading').textContent = '読み込みエラー: ' + (e.message || e);
  }
}

function renderApps(apps) {
  const grid = document.getElementById('grid');
  if (!apps.length) { grid.innerHTML = '<p class="note">利用できるアプリがありません。</p>'; return; }
  grid.innerHTML = apps.map(a => {
    const icon = APP_ICONS[a.icon] || APP_ICONS.box;
    return `<a class="card" href="${esc(a.url)}">
      <div class="crow"><span class="ci">${icon}</span><span class="cname">${esc(a.name)}</span></div>
      <div class="cdesc">${esc(a.desc || '')}</div>
      <div class="cfoot"><span class="go">開く ${ARROW}</span></div>
    </a>`;
  }).join('');
}
