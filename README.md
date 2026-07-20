# EMWUI 3

EDCB用のWeb UIです。
EDCBの基本的な操作に加え、リモート視聴などの機能を提供します。

---

## 主な特徴

*   **SPA (Single Page Application)**
    *   ページ遷移を最小限に抑え、ネイティブアプリのようなスムーズな操作感を提供。
*   **SSE (Server-Sent Events) によるリアルタイム更新**
    *   番組情報の更新や録画ステータスの変化をリアルタイムに反映。
*   **PWA (Progressive Web App)**
    *   インストールしてオフラインでもキャッシュにより一部機能が使用可能。
*   **Material 3 デザイン**
    *   最新の [M3](https://m3.material.io/) デザインシステムを採用。

## 導入
最低限の動作に必要なファイルは、EDCBの[releases](https://github.com/xtne6f/EDCB/releases)の`EDCB-work-plus-s-bin.zip`で入手可能です。  
PWAやTS-Live!にSSL/TLSによる通信が必須なため、HTTPSでの運用を前提として記述しています。  
リモート視聴を行う場合は、別途使用するトランスコーダが必要です。  
1. EDCBのReadme_Mod.txtの[*Civetwebの組み込みについて*](https://github.com/xtne6f/EDCB/blob/work-plus-s/Document/Readme_Mod.txt#civetweb%E3%81%AE%E7%B5%84%E3%81%BF%E8%BE%BC%E3%81%BF%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6)をよく読む
1. HTTPSに必要な自己署名証明書を作成、インストール
1. ファイルを適切に設置 (下記の配置例を参照)  
   `HttpPublic`と`Setting`のフォルダをEDCBフォルダに入れる  
   ※ 配置例 (E3、legacyは任意にリネーム等可)

       EDCB/
        ├─ HttpPublic/
        │   ├─ api/
        │   ├─ E3/
        │   ├─ legacy/
        │   ├─ video/
        │   ├─ index.html
        │   :
        │
        ├─ Tools/
        │   ├─ ffmpeg/
        │   │   ├─ ffmpeg.exe
        │   │   ├─ ffprobe.exe
        │   │   :
        │   ├─ NVEncC/
        │   │   :
        │   ├─ QSVEncC/
        │   │   :
        │   ├─ asyncbuf.exe
        │   ├─ edcbnosuspend.exe
        │   ├─ psisiarc.exe
        │   ├─ psisimux.exe
        │   ├─ tsmemseg.exe
        │   ├─ tsreadex.exe
        │   ├─ tspgtxt.exe
        │   :
        │
        ├─ Setting/
        │   ├─ XCODE_OPTIONS.lua
        │   ├─ HttpPublic.ini
        │   :
        │
        ├─ EpgDataCap_Bon.exe
        ├─ EpgTimerSrv.exe
        ├─ EpgTimer.exe
        ├─ lua52.dll
        ├─ SendTSTCP.dll
        ├─ libssl-3(-x64).dll
        ├─ libcrypto-3(-x64).dll
        ├─ ssl_cert.pem
        ├─ ssl_peer.pem
        :
1. EDCBのHTTPサーバ機能を有効化、アクセス制御を設定
   * `EnableHttpSrv=1`
   * `HttpAccessControlList=+127.0.0.1,+192.168.0.0/16`
   * `HttpPort=5510,5520,5511s,5521s`
1. http://localhost:5510/ にアクセス、サーバー機能が有効になったことを確認  
https://localhost:5511/ でHTTPSが有効を確認  
※ ここでうまく行かない場合はEDCBの設定の問題だと思われます
1. HttpPublic.iniでの設定
   * `useSsePort=1`に変更しSSE専用ポートの使用を有効にする
   * その他必要に応じて設定
1. リモート視聴する場合
   * EpgDataCap_Bonなどのネットワーク設定でTCP送信先にSrvPipeを追加
   * `XCODE_OPTIONS.lua`でトランスコード用プリセットを設定

* 更新の際は`HttpPublic`のフォルダのみを上書きしてください

## 注意事項

*   SSEの仕様
    *   CivetWebのスレッドを接続毎に1つ常時消費します。  
        *   デフォルトのスレッド数は5です。環境に合わせて適切に調整してください。
    *   ブラウザの同一オリジンに対する同時接続数制限(通常6～8接続)があり、1つ常時消費します。  
        *   レスポンスに影響が出る場合があるため、回避策としてSSE接続を専用ポートで実施します。     
        *   専用ポートの使用が有効の場合、SSE接続はメインのポートに設定されたポート番号に`+10`したポート番号で確立されます。使用するポート番号に追加指定してください。  
            (例: メインポートが5510の場合、SSEは5520で接続を試みます)
*   各データをキャッシュし、LocalStorageに保存します。  
    *   チャンネルスキャンした場合と録画プリセットを変更した場合は、右上設定アイコンから基礎データを再取得してください。
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

## 使用フレームワーク及びライセンス

本プロジェクトでは以下のオープンソースライブラリを利用しています。

*   [Alpine.js](https://github.com/alpinejs/alpine) - MIT License
*   [Beer CSS](https://github.com/beercss/beercss) - MIT License
*   [material-dynamic-colors](https://github.com/leonardorafael/material-dynamic-colors) - MIT License
*   [Material Symbols](https://github.com/google/material-design-icons/tree/master/symbols) - Apache License 2.0
*   [hls.js](https://github.com/video-dev/hls.js) - Apache License 2.0
*   [aribb24.js](https://github.com/monyone/aribb24.js) - MIT License
*   [danmaku.js](https://github.com/DIYgod/DPlayer) - MIT License
*   [web-bml](https://github.com/otya128/web-bml) - MIT License
*   [TS-Live!](https://github.com/ts-live/ts-live) - MIT License

## SpecialThanks

[Legacy WebUI](https://github.com/xtne6f/EDCB/tree/work-plus-s/ini/HttpPublic/legacy)から、多くの部分を流用させていただきました。  
EDCBという素晴らしいソフトを作成していただいた**xtne6f氏に感謝します**。  
また、データ放送や実況などのライブラリ作者様にも感謝します。

## 支援

プロジェクトを応援いただける方は、以下のリストからご支援いただけると励みになります。
* [欲しい物リスト](https://www.amazon.co.jp/hz/wishlist/ls/1FFBR5ZLZK8EY?ref_=wl_share)
