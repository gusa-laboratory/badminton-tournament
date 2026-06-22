/* =========================================================================
   バドミントン大会 同期モジュール（プラガブル）
   - court.html（各コート端末）が publish で試合状況を送信
   - hq.html（本部）が subscribe で全コートをリアルタイム受信
   - 既定はローカル同期（同一ブラウザ・複数タブ）。アカウント不要で今すぐ動く。
   - Firebase(RTDB) を使うときは下の FIREBASE_CONFIG を埋めるだけで切替わる。
   ========================================================================= */
(function () {
  "use strict";

  // ===== 設定 ============================================================
  // 大会を区切る合言葉。本部とコート端末で同じ値にすること。
  const ROOM = "osaka-jogakuin-2026";

  // Firebase の設定は firebase-config.js（window.FIREBASE_CONFIG）で行う。
  //   - 設定があり SDK(window.__FB__) も読めていれば Firebase 同期
  //   - どちらか無ければ自動でローカル同期にフォールバック
  // =======================================================================
  const LS_KEY = "bdmt:" + ROOM + ":matches";
  let backend = null;
  let subscribers = [];
  let store = {};                 // courtId -> payload

  function notify() {
    subscribers.forEach(cb => { try { cb(store); } catch (e) { console.error(e); } });
  }

  // ---------- ローカル backend（同一ブラウザ・複数タブ） -----------------
  const local = {
    bc: null,
    init() {
      try { store = JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch (e) { store = {}; }
      this.bc = ("BroadcastChannel" in window) ? new BroadcastChannel(LS_KEY) : null;
      if (this.bc) this.bc.onmessage = ev => { store = ev.data || {}; notify(); };
      // BroadcastChannel 非対応環境向けの保険（別タブの localStorage 変更を検知）
      window.addEventListener("storage", e => {
        if (e.key === LS_KEY) { try { store = JSON.parse(e.newValue || "{}"); } catch (_) { store = {}; } notify(); }
      });
    },
    publish(id, data) {
      store[id] = data;
      localStorage.setItem(LS_KEY, JSON.stringify(store));
      if (this.bc) this.bc.postMessage(store);
      notify();
    },
    remove(id) {
      delete store[id];
      localStorage.setItem(LS_KEY, JSON.stringify(store));
      if (this.bc) this.bc.postMessage(store);
      notify();
    }
  };

  // ---------- Firebase backend（本物の複数端末） -------------------------
  // window.__FB__ = { db, ref, onValue, set, remove } を前提にした薄いラッパ。
  const firebaseBackend = {
    F: null, base: null,
    init() {
      const F = window.__FB__;
      this.F = F;
      this.base = F.ref(F.db, "rooms/" + ROOM + "/matches");
      F.onValue(this.base, snap => { store = snap.val() || {}; notify(); });
    },
    publish(id, data) { this.F.set(this.F.ref(this.F.db, "rooms/" + ROOM + "/matches/" + id), data); },
    remove(id) { this.F.remove(this.F.ref(this.F.db, "rooms/" + ROOM + "/matches/" + id)); }
  };

  function canUseFirebase() { return !!window.FIREBASE_CONFIG && !!window.__FB__; }

  const CourtSync = {
    mode: "local",
    room: ROOM,
    init() {
      if (canUseFirebase()) { backend = firebaseBackend; this.mode = "firebase"; }
      else { backend = local; this.mode = "local"; }
      backend.init();
      return this;
    },
    publish(id, data) { backend.publish(String(id), data); },
    remove(id) { if (backend.remove) backend.remove(String(id)); },
    subscribe(cb) {
      subscribers.push(cb);
      cb(store);                                  // 現在のスナップショットを即時通知
      return () => { subscribers = subscribers.filter(x => x !== cb); };
    },
    snapshot() { return store; }
  };

  window.CourtSync = CourtSync;
})();
