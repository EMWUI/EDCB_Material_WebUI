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

### 6. SSE専用ポートの使用を有効に
   * [ポート:5521](https://localhost:5521/) でのアクセスが可能か確認し、問題なければ[設定ページ](https://localhost:5511/E3/index.html#setting)の`SSE専用ポートを使用する`を有効に  
   * 他の項目は必要に応じて設定
     * ロゴを保存するを有効に

> [!NOTE]
> 初期設定では、設定ページでの変更は、ローカルホストでのアクセス時のみ有効になります。  
> 他のデバイスからの場合は、`HttpPublic.ini`を直接編集して設定してください。  
> また、`ALLOW_SETTING_LIST`にアクセス元のIPアドレスを追加することで設定ページからの変更が可能になります。

> [!TIP]
> SSEの仕様により、ブラウザの同一オリジンに対する同時接続数制限(通常6～8接続)の1つを消費します。  
> レスポンスに影響が出る場合があるため、回避策としてSSE接続を専用ポートで実施します。     
> 設定が有効の場合、SSE接続はメインのポートに設定されたポート番号に`+10`したポート番号で確立されます。  
> 例: メインポートが`5510`の場合、SSEは`5520`で接続を試みます  

### 7. リモート視聴する場合
   * EpgDataCap_Bonのネットワーク設定でTCP送信先にSrvPipeを追加
   * `XCODE_OPTIONS.lua`でトランスコード用プリセットを設定

> [!IMPORTANT]
> 更新の際は`HttpPublic`のフォルダのみを上書きしてください

## 注意事項

### キャッシュ

オフライン機能やデータセーバー機能に、下記の表の通り`ブラウザストレージ`を使用します。  

| カテゴリ | 保存量 | `localStrage`  | `IndexedDB` | `CacheStorage`|
|:---|:---:|:---:|:---:|:---:|
| EPGデータ | 前2時間＋3日 |  | 〇 |  | 
| 予約 | 全件 |  | 〇 |  | 
| チューナ別予約 | 全件 |  | 〇 |  | 
| 自動予約 | 全件 |   | 〇 |  | 
| プログラム予約 | 全件 |   | 〇 |  | 
| 録画結果 | 200件 |  | 〇 |  | 
| サービス一覧 | 全件 |  | 〇 |  | 
| 録画プリセット | 全件 |  | 〇 |  | 
| アセット（html,css,js） | - |  |  | 〇 | 
| 局ロゴ | - |  |  | 〇 | 
| ユーザー設定 | - | 〇 |  |  | 


> [!NOTE]
> ~~自動更新非対象のサービス一覧・録画プリセットに変更があった場合、右上アイコンの設定から「基礎データ」で再取得を実行してください。~~  
> ~~※ただし録画プリセットは[設定ページ](https://localhost:5511/E3/index.html#setting)で変更した場合、変更時に再取得されます。~~  
> ページ読み込み時に更新するように変更。

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

### その他

本ソフトウェアを利用したことによるいかなる損害についても、作者は一切の責任を負いません。  
本ソフトウェアの利用は、すべて使用者ご自身の責任において行ってください。  
リモート視聴機能の使用にあたっては、特に以下の事項を必ず遵守し、すべて自己責任において行ってください。  

- **私的使用の範囲内での利用（外部公開の禁止）**  
  本機能は、著作権法で認められた「私的使用」および「家庭内などの限られた範囲内」での利用を前提としています。不特定多数、または家庭外の第三者がアクセスできる状態（インターネット上への公開、アカウントの共有など）にすることは、著作権法違反となる恐れがあります。これらに起因するいかなる法的トラブルについても、作者は一切の責任を負いません。

- **ネットワークおよびセキュリティ**  
  本機能の利用に伴うポート開放、VPN構築、その他ネットワーク設定の変更は、すべてユーザーの責任において行ってください。設定の不備により生じた不正アクセス、情報漏洩、マルウェア感染、通信機器の故障などの損害について、作者は一切の責任を負いません。

- **通信量および費用**  
  自宅外からの視聴には大量のデータ通信が発生します。通信制限やキャリアから請求される通信費用等について、作者は一切関知いたしません。

- **動作保証の制限**  
  通信環境、プロバイダの制限（IPv4/IPv6の環境差など）、OSのアップデート等により、本機能が正常に動作しない場合があります。作者は本機能の完全な動作や維持、サポートの義務を負わないものとします。

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
*   [TS-Live!](https://github.com/xtne6f/ts-live) - MIT License

## SpecialThanks

[Legacy WebUI](https://github.com/xtne6f/EDCB/tree/work-plus-s/ini/HttpPublic/legacy)から、多くの部分を流用させていただきました。  
EDCBという素晴らしいソフトを作成していただいた**xtne6f氏に感謝します**。  
また、データ放送や実況などのライブラリ作者様にも感謝します。

## 支援

プロジェクトを応援いただける方は、以下のリストからご支援いただけると励みになります。
* [欲しい物リスト](https://www.amazon.co.jp/hz/wishlist/ls/1FFBR5ZLZK8EY?ref_=wl_share)
