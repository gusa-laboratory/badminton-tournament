/* =========================================================================
   同期の起動。FIREBASE_CONFIG があれば Firebase SDK を読み込んで RTDB に接続、
   無ければ（または読み込み失敗時は）ローカル同期にフォールバックする。
   接続準備ができたら CourtSync.init() を呼び、'sync-ready' を発火する。
   ※ ES module（defer 実行）。classic スクリプト群の後に動くので順序は安全。
   ========================================================================= */
const SDK = "https://www.gstatic.com/firebasejs/10.12.0";

async function boot() {
  const cfg = window.FIREBASE_CONFIG;
  if (cfg) {
    try {
      const appMod = await import(`${SDK}/firebase-app.js`);
      const dbMod  = await import(`${SDK}/firebase-database.js`);
      const app = appMod.initializeApp(cfg);
      window.__FB__ = {
        db: dbMod.getDatabase(app),
        ref: dbMod.ref,
        onValue: dbMod.onValue,
        set: dbMod.set,
        remove: dbMod.remove
      };
    } catch (e) {
      console.warn("Firebase の読み込みに失敗。ローカル同期にフォールバックします。", e);
    }
  }
  window.CourtSync.init();
  window.dispatchEvent(new Event("sync-ready"));
}

boot();
