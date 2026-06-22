# 🏸 バドミントン大会 得点共有システム

各コートの得点端末（[court.html](court.html)）の試合状況を、本部のダッシュボード（[hq.html](hq.html)）でリアルタイムに一覧確認するためのシステム。

既存の単一HTML得点カウンターを土台に、軽い同期層を足しただけの構成。採点ロジックは元のまま。

## 構成

| ファイル | 役割 |
|---|---|
| `court.html` | 各コートの得点端末。得点・サーブ・ローテーション等を自動処理しつつ、状況を本部へ送信。設定で「コート番号・試合番号」を入力 |
| `hq.html` | 本部ダッシュボード（読み取り専用）。全コートの試合番号・スコア・進行状況をカードで一覧表示 |
| `sync.js` | 同期層。`publish`（送信）/ `subscribe`（受信）の薄い共通API |
| `firebase-config.js` | Firebase の設定（このファイルだけ編集すれば切替わる） |
| `firebase-boot.js` | 設定があれば Firebase SDK を読み込んで接続、無ければローカル同期にフォールバック |

## 同期モード

- **ローカル同期**（`firebase-config.js` が `null`）: 同一ブラウザのタブ間だけで同期。アカウント不要。動作確認・デモ用。
- **Firebase 同期**（設定を貼ると自動切替）: Firebase Realtime Database を介し、別PC・別端末でもリアルタイムに同期。大会本番用。

各端末がそれぞれインターネットに出られれば、同じネットワークである必要はない（会場Wi-Fi・スマホ回線・テザリング混在でOK）。

## 使い方

1. 各コートのタブレット等で `court.html` を開き、コート番号・試合番号を入れて試合開始。
2. 本部のPCで `hq.html` を開く。全コートが自動で並ぶ。

## Firebase 設定（本番運用）

1. Firebase コンソールでプロジェクト作成 → Realtime Database を有効化。
2. Realtime Database のルール（誰でも読める／書き込みは試合データ形式が正しい時のみ）:
   ```json
   {
     "rules": {
       "rooms": {
         "$room": {
           "matches": {
             ".read": true,
             "$court": {
               ".write": true,
               ".validate": "newData.hasChildren(['court','scoreA','scoreB','status','updatedAt'])"
             }
           }
         }
       }
     }
   }
   ```
3. ウェブアプリを登録し、`firebaseConfig` を `firebase-config.js` の `window.FIREBASE_CONFIG` に貼る。
4. 大会を区切る合言葉は `sync.js` の `ROOM` で変更可能。

※ Firebase のウェブ設定キーはクライアント公開前提のもので秘密情報ではない。保護は Realtime Database のルールで行う。
