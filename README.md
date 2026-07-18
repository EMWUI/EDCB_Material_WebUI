# EMWUI 3

Geminiにモダンにと一から作り直してもらいました。
 
## 主な特徴

*   **SPA (Single Page Application)**
    *   ページ遷移を最小限に抑え、ネイティブアプリのようなスムーズな操作感を提供。
*   **SSE (Server-Sent Events) によるリアルタイム更新**
    *   番組情報の更新や録画ステータスの変化をリアルタイムに反映。
*   **Material 3 デザイン**
    *   最新の [M3](https://m3.material.io/) デザインシステムを採用。

## 使用フレームワーク

*   [Alpine.js](https://alpinejs.dev/) - 軽量でパワフルな JavaScript フレームワーク
*   [Beer CSS](https://www.beercss.com/) - Material 3 に準拠した CSS フレームワーク

## 注意事項

*   SSEの仕様
    *   CivetWebのスレッドを接続毎に1つ常時消費します。  
        *   デフォルトのスレッド数は5です。環境に合わせて適切に調整してください。
    *   ブラウザの同一オリジンに対する同時接続数制限(通常6～8接続)を1つ常時消費します。  
        *   レスポンスに影響が出る場合があるため、回避策としてSSE接続を専用ポートで実施します。     
        *   専用ポートの使用が有効の場合、SSE接続はメインのポートに設定されたポート番号に`+10`したポート番号で確立されます。使用するポート番号に追加指定してください。  
            (例: メインポートが5510の場合、SSEは5520で接続を試みます)
*   各データをキャッシュし、LocalStorageに保存します。  
    *   録画結果は日々増え、膨大になるため200件に制御してますが、予約情報は全件キャッシュしています。  
        全録環境のは方は注意してください。動作状況や改善点をお待ちしています。

## 開発状況

- [x] SPA 構造の基本設計
- [x] SSE による通知の実装
- [x] Beer CSS (Material 3) 
- [x] 予約等の一覧
- [ ] 一覧のブラッシュアップ
- [ ] ページネーション
- [x] 詳細表示
- [x] 予約の追加、変更
- [x] 番組表
- [x] 配信機能
    - [x] HLS
    - [ ] TS-Live!
    - [x] データ放送
    - [x] 実況
- [ ] 設定画面の拡充
- [x] PWA
- [x] ローカルアセットへの移行

### 不具合、改善点

- [ ] スタンバイ移行時のオフライン判定
- [x] EPGデータのダイエット（現状36時間分で約4.5MBとぎりぎり → 約3.5MB）
- [ ] データ放送読み込み時などで、ローディングなどが発生

## ライセンス

本プロジェクトでは以下のオープンソースライブラリを利用しています。

*   [Alpine.js](https://github.com/alpinejs/alpine) - MIT License
*   [Beer CSS](https://github.com/beercss/beercss) (including Material Symbols) - Apache License 2.0
*   [material-dynamic-colors](https://github.com/targoninc/material-dynamic-colors) - Apache License 2.0
*   [hls.js](https://github.com/video-dev/hls.js) - Apache License 2.0
*   [aribb24.js](https://github.com/monyone/aribb24.js) - MIT License

## 支援

プロジェクトを応援いただける方は、以下のリストからご支援いただけると励みになります。
* [欲しい物リスト](https://www.amazon.co.jp/hz/wishlist/ls/1FFBR5ZLZK8EY?ref_=wl_share)
