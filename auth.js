/*
 * 認証レイヤ + google.script.run シム  ── hanshinco 共通モジュール（demo_rental と同一）
 *
 * 役割:
 *   1) Google Identity Services でログイン → IDトークン取得 → hd(組織ドメイン)を事前確認
 *   2) fetch ラッパー api() を提供（Content-Type: text/plain でCORSプリフライト回避）
 *   3) google.script.run を “シム” で再現（api('METHOD',[args]) に橋渡し）
 *   4) ログイン成功後に boot()（portal.js内）を起動
 *
 * ★本当のドメイン制限はGAS側の verifyToken_（hd検証）が担保。ここのhdチェックは表示用。
 *
 * ── 共通の社員証（SSO）─────────────────────────────────────────────
 *   IDトークンは TOKEN_KEY で localStorage に保持。オリジン(hanshinco.github.io)共有なので
 *   同じキー・同じ CLIENT_ID を使う各アプリで「1回ログインで全アプリ入れる」＝実質SSO。
 *   ★キー(TOKEN_KEY)は全アプリで共通固定にすること。
 */

let idToken = null;

// JWT(IDトークン)のペイロードをデコード（表示・事前チェック用。検証はGAS側）
function decodeJwt(token) {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeURIComponent(
    atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
  );
  return JSON.parse(json);
}

// GAS API 呼び出し（text/plain でプリフライト回避）。args は配列（位置引数）。
async function api(action, args) {
  const res = await fetch(window.APP_CONFIG.GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: action, token: idToken, args: args || [] })
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error);
  return data.result;
}

// google.script.run のシム本体。
function makeRunner(onSuccess, onFailure) {
  return new Proxy({}, {
    get: function (_t, prop) {
      if (typeof prop !== 'string') return undefined;
      if (prop === 'withSuccessHandler') return function (f) { return makeRunner(f, onFailure); };
      if (prop === 'withFailureHandler') return function (f) { return makeRunner(onSuccess, f); };
      if (prop === 'withUserObject') return function () { return makeRunner(onSuccess, onFailure); };
      return function () {
        var args = Array.prototype.slice.call(arguments);
        api(prop, args)
          .then(function (r) { if (onSuccess) onSuccess(r); })
          .catch(function (e) {
            if (onFailure) onFailure(e);
            else { if (window.busyOff) window.busyOff(); alert(e.message || e); }
          });
      };
    }
  });
}

function installGasShim() {
  window.google = window.google || {};
  window.google.script = { run: makeRunner(null, null) };
}

let booted = false;
let refreshTimer = null;

// IDトークンの exp(UNIX秒) の少し前に自動で再サインインしてトークンを更新。
function scheduleRefresh(exp) {
  if (refreshTimer) clearTimeout(refreshTimer);
  if (!exp) return;
  var ms = exp * 1000 - Date.now() - 5 * 60 * 1000;   // 失効の5分前
  if (ms < 1000) ms = 1000;
  if (ms > 0x7fffffff) ms = 0x7fffffff;
  refreshTimer = setTimeout(function () {
    if (window.google && google.accounts && google.accounts.id) google.accounts.id.prompt();
  }, ms);
}

var TOKEN_KEY = 'hanshinco_idToken';   // ★オリジン共通キー（全アプリで同一固定＝1回ログインで全アプリ有効）

// リロード/別タブ/再起動での即復帰。
function resumeFromStorage() {
  try {
    var t = localStorage.getItem(TOKEN_KEY);
    if (!t) return false;
    var c = decodeJwt(t);
    if (c.hd !== window.APP_CONFIG.ALLOWED_DOMAIN) { localStorage.removeItem(TOKEN_KEY); return false; }
    if (!c.exp || c.exp * 1000 <= Date.now() + 30000) { localStorage.removeItem(TOKEN_KEY); return false; }  // 失効(30s余裕)
    idToken = t;
    booted = true;
    installGasShim();
    document.getElementById('login').style.display = 'none';
    document.getElementById('loading').style.display = '';
    scheduleRefresh(c.exp);
    boot();
    return true;
  } catch (e) { return false; }
}

function onCredential(resp) {
  idToken = resp.credential;
  var claims = decodeJwt(idToken);
  if (claims.hd !== window.APP_CONFIG.ALLOWED_DOMAIN) {
    try { localStorage.removeItem(TOKEN_KEY); } catch (e) {}
    var msg = document.getElementById('login-msg');
    msg.textContent = '⛔ 許可された組織のGoogleアカウントでログインしてください（あなた: ' + (claims.hd || claims.email) + '）';
    msg.className = 'login-msg ng';
    return;
  }
  try { localStorage.setItem(TOKEN_KEY, idToken); } catch (e) {}
  scheduleRefresh(claims.exp);
  if (booted) return;
  booted = true;
  installGasShim();
  document.getElementById('login').style.display = 'none';
  document.getElementById('loading').style.display = '';
  boot();
}

function initAuth() {
  google.accounts.id.initialize({
    client_id: window.APP_CONFIG.CLIENT_ID,
    callback: onCredential,
    auto_select: true
  });
  google.accounts.id.renderButton(document.getElementById('gbtn'), { theme: 'outline', size: 'large', width: 260 });
  if (resumeFromStorage()) return;
  google.accounts.id.prompt();
}

function waitForGis(tries) {
  tries = tries || 0;
  if (window.google && window.google.accounts && window.google.accounts.id) { initAuth(); return; }
  if (tries > 100) {
    document.getElementById('login-msg').textContent =
      'Googleログインを読み込めませんでした（ネットワーク/拡張機能を確認してください）';
    return;
  }
  setTimeout(function () { waitForGis(tries + 1); }, 50);
}

window.addEventListener('load', function () { waitForGis(0); });
