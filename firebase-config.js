/* =========================================================================
   Firebase 設定（このファイルだけ編集すればOK）
   -------------------------------------------------------------------------
   ・null のまま   → ローカル同期（同一ブラウザのタブ間だけ。アカウント不要）
   ・設定を貼る     → Firebase 同期（本物の複数端末・別PCでもリアルタイム）

   Firebase コンソールの「ウェブアプリ」設定からコピーした firebaseConfig を
   下の例のように window.FIREBASE_CONFIG に入れる。databaseURL は必須。
   ※ このキーはクライアント公開前提のもので秘密ではない（保護はDBルールで行う）。
   ========================================================================= */
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyBTTv7njH4w7NiObrwDWIUVDMR3QVG2lg0",
  authDomain: "badminton-scorer-9c187.firebaseapp.com",
  databaseURL: "https://badminton-scorer-9c187-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "badminton-scorer-9c187",
  storageBucket: "badminton-scorer-9c187.firebasestorage.app",
  messagingSenderId: "674680480849",
  appId: "1:674680480849:web:9ad3fde1883b9a2ae10470"
};
