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
> [!NOTE]  
> PWAやTS-Live!にSSL/TLSによる通信が必須なため、HTTPSでの運用を前提として記述しています。  

### 1. EDCBのReadme_Mod.txtの[*Civetwebの組み込みについて*](https://github.com/xtne6f/EDCB/blob/work-plus-s/Document/Readme_Mod.txt#civetweb%E3%81%AE%E7%B5%84%E3%81%BF%E8%BE%BC%E3%81%BF%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6)をよく読む
### 2. HTTPSに必要な自己署名証明書を作成、インストール
### 3. `HttpPublic`と`Setting`のフォルダをEDCBフォルダに入れる  

> [!TIP]
> 配置例 (E3、legacyは任意にリネーム等可)
>
>      EDCB/
>        ├─ HttpPublic/
>        │   ├─ api/
>        │   ├─ E3/
>        │   ├─ legacy/
>        │   ├─ video/
>        │   ├─ index.html
>        │   :
>        │
>        ├─ Tools/
>        │   ├─ ffmpeg/
>        │   │   ├─ ffmpeg.exe
>        │   │   ├─ ffprobe.exe
>        │   │   :
>        │   ├─ NVEncC/
>        │   │   :
>        │   ├─ QSVEncC/
>        │   │   :
>        │   ├─ asyncbuf.exe
>        │   ├─ edcbnosuspend.exe
>        │   ├─ psisiarc.exe
>        │   ├─ psisimux.exe
>        │   ├─ tsmemseg.exe
>        │   ├─ tsreadex.exe
>        │   ├─ tspgtxt.exe
>        │   :
>        │
>        ├─ Setting/
>        │   ├─ XCODE_OPTIONS.lua
>        │   ├─ HttpPublic.ini
>        │   :
>        │
>        ├─ EpgDataCap_Bon.exe
>        ├─ EpgTimerSrv.exe
>        ├─ EpgTimer.exe
>        ├─ lua52.dll
>        ├─ SendTSTCP.dll
>        ├─ libssl-3(-x64).dll
>        ├─ libcrypto-3(-x64).dll
>        ├─ ssl_cert.pem
>        ├─ ssl_peer.pem
>        :

> [!NOTE]  
> 最低限の動作に必要なファイルは、EDCBの[releases](https://github.com/xtne6f/EDCB/releases)の`EDCB-work-plus-s-bin.zip`で入手可能です。  
> リモート視聴を行う場合は、別途使用するトランスコーダが必要です。  

### 4. EDCBのHTTPサーバ機能を有効化、アクセス制御を設定
   * `EnableHttpSrv=1`
   * `HttpAccessControlList=+127.0.0.1,+192.168.0.0/16`
   * `HttpPort=5510,5520,5511s,5521s`
   * `HttpNumThreads=50`
> [!TIP]
> SSEの仕様により、表示ごとにCivetWebのスレッドを1つ常に消費します。  
> `HttpNumThreads`がデフォルトの`5`の場合、複数のタブで開いた場合などで応答なしとなる事があります。  
> デバイスの性能や同時アクセス数に合わせて`HttpNumThreads`を適切な値に調整してください。  
### 5. http://localhost:5510/ や https://localhost:5511/ にアクセスし、サーバー機能とHTTPSが有効か確認  
> [!TIP]
> うまく行かない場合はEDCBの設定を見直してください
### 6. `HttpPublic.ini`での設定
   * `useSsePort=1`に変更しSSE専用ポートの使用を有効にし、 https://localhost:5521/ でのアクセスが可能か確認
   * その他必要に応じて設定
> [!TIP]
> SSEの仕様により、ブラウザの同一オリジンに対する同時接続数制限(通常6～8接続)の1つを消費します。  
> レスポンスに影響が出る場合があるため、回避策としてSSE接続を専用ポートで実施します。     
> 設定が有効の場合、SSE接続はメインのポートに設定されたポート番号に`+10`したポート番号で確立されます。  
> 例: メインポートが`5510`の場合、SSEは`5520`で接続を試みます  
### 7. リモート視聴する場合
   * EpgDataCap_Bonなどのネットワーク設定でTCP送信先にSrvPipeを追加
   * `XCODE_OPTIONS.lua`でトランスコード用プリセットを設定

> [!IMPORTANT]
> 更新の際は`HttpPublic`のフォルダのみを上書きしてください

## 注意事項

### キャッシュ

下記の表の通り、オフライン機能やデータセーバー機能のために、`LocalStorage`にデータを保存します。  

| カテゴリ | 保存量 | 自動更新 |
|:---|:---|:--:|
| EPGデータ | 2時間前から36時間分 | 〇 |
| 予約 | 全件 | 〇 |
| チューナ別予約 | 全件 | 〇 |
| 自動予約 | 全件 | 〇 |
| プログラム予約 | 全件 | 〇 |
| 録画結果 | 200件 | 〇 |
| サービス一覧 | 全件 | ✕ |
| 録画プリセット | 全件 | ✕ |

上記以外にも、アセットや局ロゴなどはサービスワーカーにより`CacheStorage`に保存されます。

> [!NOTE]
> 自動更新非対象のサービス一覧・録画プリセットに変更があった場合、右上アイコンの設定から「基礎データ」で再取得を実行してください。  
> ※ただし録画プリセットは[設定ページ](https://localhost:5511/E3/index.html#setting)で変更した場合、変更時に再取得されます。

> [!TIP]
> 全録環境の場合、予約情報が膨大になるため注意してください。  

### データセーバー

セルラー回線でのアクセス時、SSEによるキャッシュデータの自動更新を停止し、キャッシュデータを使用して通信量を節約します。  
更新ボタンでのみとなるため、必要に応じて手動で更新してください。  
キャッシュ範囲外のデータは必要に応じて取得します。

> [!NOTE]
> 予約などを変更した場合でも、自動更新されません。  

> [!WARNING]
> **Firefox**と**Safari**では回線による切り替えができません。  
> 判定に必要な`navigator.connection`が利用できないため、有効時は回線に関係なく自動更新がOFFになります。

## 不具合、改善点

> [!IMPORTANT]
> TS-Live!の対応について  
> 動的に生成されるcanvas要素をTS-Live!が認識できない問題があります。  
> web-bmlのように再読み込みによる力業で実装できると期待していましたがそれも難しいようです。  
> もし、これらを回避して実装できる方法や、TS-Live!の修正などができる方がいましたら力を貸してください。

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
