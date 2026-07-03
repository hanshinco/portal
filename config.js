/*
 * ポータル設定。公開されても安全な値のみ（CLIENT_IDは公開前提、GAS_URLはトークン検証で保護）。
 * ★アプリ一覧はここには置かない（ログイン後にGASから取得）。
 */
window.APP_CONFIG = {
  // demo_rental と同一（共通ログイン＝同一 aud）
  CLIENT_ID: '1061860031109-005vd0tcpi6l515d0c97npmg29saju86.apps.googleusercontent.com',
  ALLOWED_DOMAIN: 'hanshinco.com',
  // ★ポータル用GASウェブアプリの /exec URL
  GAS_URL: 'https://script.google.com/macros/s/AKfycbzqbXzaLPexHljkgi9GHLXD2fxaGP_mrHWs66viHTsrFV2QyuLXiKaC82xkRq5f5ofL/exec'
};
