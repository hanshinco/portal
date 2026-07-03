/*
 * ポータル設定。公開されても安全な値のみ（CLIENT_IDは公開前提、GAS_URLはトークン検証で保護）。
 * ★アプリ一覧はここには置かない（ログイン後にGASから取得）。
 */
window.APP_CONFIG = {
  // demo_rental と同一（共通ログイン＝同一 aud）
  CLIENT_ID: '1061860031109-005vd0tcpi6l515d0c97npmg29saju86.apps.googleusercontent.com',
  ALLOWED_DOMAIN: 'hanshinco.com',
  // ★ポータル用GASウェブアプリの /exec URL。デプロイ後にここへ貼る。
  GAS_URL: 'PASTE_PORTAL_GAS_EXEC_URL_HERE'
};
