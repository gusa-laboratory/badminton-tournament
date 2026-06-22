/* =========================================================================
   バドミントン大会 同期モジュール（プラガブル）
   - court.html（各コート端末）が publish で試合状況を送信
   - hq.html（本部）が subscribe で全コートをリアルタイム受信
   - room（大会ごとの合言葉）と backend（local / firebase）は init() で指定する。
   - Firebase の設定は firebase-config.js（window.FIREBASE_CONFIG）で行う。
     設定があり SDK(window.__FB__) も読めていれば firebase、無ければ local。
   ========================================================================= */
(function () {
  "use strict";

  const DEFAULT_ROOM = "default";

  let room = DEFAULT_ROOM;
  let backend = null;
  let subscribers = [];
  let store = {};                 // courtId -> payload
  let booted = false;             // Firebase SDK の読み込み完了フラグ
  const readyCbs = [];

  function lsKey() { return "bdmt:" + room + ":matches"; }
  function fbPath() { return "rooms/" + room + "/matches"; }
  function notify() { subscribers.forEach(cb => { try { cb(store); } catch (e) { console.error(e); } }); }

  // room を Firebase キー/localStorage キーに使える形へ正規化（本部とコートで一致させる用）
  function sanitizeRoom(s) {
    const out = String(s || "").trim().toLowerCase()
      .replace(/[.#$\[\]\/\s]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    return out || DEFAULT_ROOM;
  }

  // ---------- ローカル backend（同一ブラウザ・複数タブ） -----------------
  const local = {
    bc: null,
    init() {
      try { store = JSON.parse(localStorage.getItem(lsKey()) || "{}"); } catch (e) { store = {}; }
      if (this.bc) { try { this.bc.close(); } catch (_) {} }
      this.bc = ("BroadcastChannel" in window) ? new BroadcastChannel(lsKey()) : null;
      if (this.bc) this.bc.onmessage = ev => { store = ev.data || {}; notify(); };
      window.addEventListener("storage", e => {
        if (e.key === lsKey()) { try { store = JSON.parse(e.newValue || "{}"); } catch (_) { store = {}; } notify(); }
      });
    },
    publish(id, data) {
      store[id] = data;
      localStorage.setItem(lsKey(), JSON.stringify(store));
      if (this.bc) this.bc.postMessage(store);
      notify();
    },
    remove(id) {
      delete store[id];
      localStorage.setItem(lsKey(), JSON.stringify(store));
      if (this.bc) this.bc.postMessage(store);
      notify();
    }
  };

  // ---------- Firebase backend（本物の複数端末） -------------------------
  const firebaseBackend = {
    F: null, base: null,
    init() {
      const F = window.__FB__;
      this.F = F;
      this.base = F.ref(F.db, fbPath());
      F.onValue(this.base, snap => { store = snap.val() || {}; notify(); });
    },
    publish(id, data) { this.F.set(this.F.ref(this.F.db, fbPath() + "/" + id), data); },
    remove(id) { this.F.remove(this.F.ref(this.F.db, fbPath() + "/" + id)); }
  };

  function canUseFirebase() { return !!window.FIREBASE_CONFIG && !!window.__FB__; }

  const CourtSync = {
    mode: "local",
    room: DEFAULT_ROOM,
    sanitizeRoom,
    isFirebaseAvailable: canUseFirebase,

    // Firebase SDK の読み込み完了（firebase-boot.js）を待ってから初期化する用
    whenReady(cb) { if (booted) cb(); else readyCbs.push(cb); },
    _markBooted() { booted = true; readyCbs.splice(0).forEach(c => { try { c(); } catch (e) { console.error(e); } }); },

    // opts: { room, backend:'auto'|'local'|'firebase' }
    init(opts) {
      opts = opts || {};
      room = opts.room ? sanitizeRoom(opts.room) : DEFAULT_ROOM;
      this.room = room;
      const want = opts.backend || "auto";
      const useFb = (want === "firebase" || want === "auto") && canUseFirebase();
      store = {};
      if (useFb) { backend = firebaseBackend; this.mode = "firebase"; }
      else { backend = local; this.mode = "local"; }
      backend.init();
      return this;
    },

    publish(id, data) { if (backend) backend.publish(String(id), data); },
    remove(id) { if (backend && backend.remove) backend.remove(String(id)); },
    subscribe(cb) {
      subscribers.push(cb);
      cb(store);
      return () => { subscribers = subscribers.filter(x => x !== cb); };
    },
    snapshot() { return store; }
  };

  window.CourtSync = CourtSync;
})();
