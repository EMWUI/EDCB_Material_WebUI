EDCB Material WebUI
===================

**EDCBのWebUIをMaterial Design Lite使いマテリアルデザインに沿うように表示できます**  

予約の追加確認、番組表の表示などの基本的な機能の他、リモート視聴・ファイル再生、PWAなどに対応しています  

[Legacy WebUI](https://github.com/xtne6f/EDCB/tree/work-plus-s/ini/HttpPublic/legacy)をベースとして、多くの部分を流用し、作成しています  
`view` `mp4init.lua` `segment.lua` `comment` `legacy.script.js` は一部ファイル名を変えて流用、  
`logo`をTvTestの設定の読み込み部分など、 `xcode`を公開フォルダ外のファイルにアクセスできるよう変更し使わせて頂きました  

おかげさまでド素人にも作成することができました。**xtne6f氏に感謝します**


# 導入
最低限の動作に必要なファイルは、EDCBの[releases](https://github.com/xtne6f/EDCB/releases)の`EDCB-work-plus-s-bin.zip`で入手可能です  
リモート視聴を行う場合は、別途使用するトランスコーダが必要です  
1. EDCBのReadme_Mod.txtの[*Civetwebの組み込みについて*](https://github.com/xtne6f/EDCB/blob/work-plus-s/Document/Readme_Mod.txt#civetweb%E3%81%AE%E7%B5%84%E3%81%BF%E8%BE%BC%E3%81%BF%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6)をよく読む
1. EDCBのHTTPサーバ機能を有効化、アクセス制御を設定
   * `EnableHttpSrv=1`
   * `HttpAccessControlList=+127.0.0.1,+192.168.0.0/16`
1. http://localhost:5510/ などにアクセス、サーバー機能が有効になったことを確認  
※ ここでうまく行かない場合はEDCBの設定の問題だと思われます
1. ファイルを適切に設置 (下記の配置例を参照)  
   `HttpPublic`と`Setting`をEDCBフォルダに入れる  
   ※ 配置例 (＊があるものは必ずその場所に配置)

       EDCB/
        ├─ HttpPublic/
        │   ├─ api/ ＊
        │   ├─ EMWUI/
        │   ├─ legacy/
        │   ├─ img/ ＊
        │   │   └logo/ ＊
        │   └─ video/ ＊
        ├─ Tools/
        │   ├─ ffmpeg.exe
        │   ├─ ffprobe.exe ＊
        │   ├─ tsreadex.exe ＊
        │   ├─ asyncbuf.exe ＊
        │   ├─ tsmemseg.exe ＊
        │   └─ psisiarc.exe ＊
        ├─ Setting/
        │   ├─ XCODE_OPTIONS.lua ＊
        │   └─ HttpPublic.ini ＊
        ├─ EpgDataCap_Bon.exe ＊
        ├─ EpgTimerSrv.exe ＊
        ├─ EpgTimer.exe ＊
        ├─ lua52.dll ＊
        └─ SendTSTCP.dll ＊

1. リモート視聴する場合EpgDataCap_Bonなどのネットワーク設定でTCP送信先にSrvPipeを追加
1. http://localhost:5510/EMWUI/ にアクセス出来たら準備完了、設定へ  

* 更新の際は`HttpPublic`のみ上書きしてください  
* PWAを使用する場合は追加の設定や別途ファイルが必要です


# 設定
番組表などの基本的な設定は[設定ページ](http://localhost:5510/EMWUI/setting)で  
配信機能の設定などは`HttpPublic.ini`と`XCODE_OPTIONS.lua`を編集してください  

#### テーマカラー
[MDL](http://www.getmdl.io/customize/index.html)で選択したテーマカラーに変更することができます  
選んだテーマカラーの`css`をダウンロードし`material.min.css`を置き換えるか、`HttpPublic.ini`の`cssキー`を編集することで変更できます  
* 一部(border周り)が置き換えただけでは対応できない部分があります(`.mark`)  
気になる方はcssを`user.css`に記述してください  
* 色は[Material design](http://www.google.com/design/spec/style/color.html#color-color-palette)から選択することをお勧めします  
`.mark`のborderはA700を指定しています


# PWA
PWA（プログレッシブウェブアプリ）に対応しアプリとしてインストールすることができます  
* SSL/TLSによる通信が必須となります
* [*Civetwebの組み込みについて*](https://github.com/xtne6f/EDCB/blob/work-plus-s/Document/Readme_Mod.txt#civetweb%E3%81%AE%E7%B5%84%E3%81%BF%E8%BE%BC%E3%81%BF%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6)を参照してSSL/TLSを有効にしてください


# 視聴機能
Legacy WebUIの配信機能を移植し、以下の事が可能となりました  
* HLSでの配信
* web-bmlによるデータ放送の表示
* aribb24.jsによる字幕表示
* 実況の表示

過去の機能と仕様などが変わり互換性はありませんので再度設定をしてください
[EDCB Legacy WebUIについて](http://localhost:5510/legacy/about.html)にも目を通してください  

### 注意
* トランスコードオプションは`XCODE_OPTIONS.lua`を編集してください
* リモコン、コメントボタンを長押しすると各データの常時取得が有効になります
* **データ放送がリセットできない**ため、一度データ放送を読み込みチャンネルを変更すると、リモコンボタンは無効化されます  
上記の理由から常時取得有効中でも、リモコンボタンを一度押すまでデータ放送は読み込まれません
* .pscファイルによる表示は現在非対応としています（要望があったら対応するかもしれません）  
* プレイヤーの速度設定はブラウザ側の機能を使用しています  
トランスコードオプションの`filterFast`は、UIが未実装です

## リモート視聴
* **EpgDataCap_BonなどのTCP送信先にSrvPipeが追加されている必要があります**  
* NetworkTVモードでEpgDataCap_Bonなどを起動しています  
他にNetworkTVモードを使用している場合は注意してください  

## ファイル再生
* 開始時間を指定し、再度トランスコードすることでシークっぽい動作をしています
* 録画結果ページでは録画結果(`GetRecFileInfo()`)からファイパスを取得し、ファイルの確認をし表示します
* `ffprobe.exe`がToolsフォルダにある場合、メタ情報が取得可能となり、より正確な処理ができます

## ライブラリ
* 録画保存フォルダのビデオファイル(`ts`,`mp4`,`webm`等)を表示・再生します  
`HttpPublic.ini`でフォルダの変更が可能です  
* Chrome系ブラウザでmp4を再生しようとするとエラーで再生できないことがありますが`-movflags faststart`オプションを付けエンコすることで再生できる場合が、
また公開フォルダ外のファイルはスクリプトを経由するためシークできるブラウザとできないブラウザあるようです  

* サムネ  
HttpPublicFolderのvideo\thumbsフォルダに`md5ハッシュ.jpg`があるとサムネを表示できます  
ライブラリページのメニューから作成することができます


# 補足

### 局ロゴ
EDCBのロゴに対応しています  
* ロゴフォルダにない場合、TVTestのロゴを検索するかどうか`HttpPublic.ini`で設定できます  
* LogoData.iniが見つからない場合のみ公開フォルダ下の`img\logo\ONIDSID{.png|.bmp}`(4桁で16進数)を表示(旧仕様互換)  

### 放送中ページ
URLに`?webPanel=`を追加すると無駄をそぎ落としたデザインになります  
* VivaldiのWEBパネルに追加して使用することを想定しています

### 番組表の隠しコマンド
以下をGETメゾットで取得しますのでURLに含めてください  
* `hour=整数`  
開始時間を指定
* `interval=整数`  
表示間隔を指定  
  * デフォルト値 `PC=25` `スマホ=13`
* `chcount=整数`  
読み込むチャンネル数を一時的に変更  
  * デフォルト値 `PC=0(無制限)` `スマホ=15`  
  * showが有効時は非表示のチャンネルを含みます
* `show=`  
非表示指定したチャンネルを読み込む(サイドバーで表示・非表示)  
  * 値は指定する必要はありません
* `subch=`  
サービス一覧でサブチャンネルを表示します  

`chcount`と`show`は週間番組表では使えません

### お知らせ機能
※PCでのみでの機能です  
* 登録した番組の開始30秒前にデスクトップ通知します  
* videoフォルダにnotification.mp3を用意すると通知音が出ます  
各自で用意してください

### 注意
チャンネルが増えたりしたら設定を保存しなおしてください(番組表に表示されません)  


# 動作確認
- Windows
  - Chrome
  - Vivaldi
  - firefox
- Android
  - Chrome


# その他
* **iOS、スカパープレミアムの環境はありません。**  
* バグ報告は詳細に、上記の環境ない箇所の場合は特に詳細に、対処できません  
* [欲しい物リスト](https://www.amazon.co.jp/hz/wishlist/ls/1FFBR5ZLZK8EY?ref_=wl_share)を公開しました、ご支援の程よろしくお願いします  
* このプログラムを使用し不利益が生じても一切の責任を負いません  
* また改変・再配布などはご自由にどうぞ  

### Framework & JavaScriptライブラリ

* [Material Design Lite](http://www.getmdl.io)
* [Material icons](https://design.google.com/icons/)
* [dialog-polyfill](https://github.com/GoogleChrome/dialog-polyfill)
* [jQuery](https://jquery.com)
* [jQuery UI](https://jqueryui.com)
* [jQuery UI Touch Punch](http://touchpunch.furf.com)
* [Hammer.JS](http://hammerjs.github.io)
* [jquery.hammer.js](https://github.com/hammerjs/jquery.hammer.js)
* [hls.js](https://github.com/video-dev/hls.js)
* [web_bml_play_ts.js](https://github.com/xtne6f/web-bml)
* [aribb24.js](https://github.com/xtne6f/aribb24.js)
* [danmaku.js](https://github.com/DIYgod/DPlayer)

This software includes the work that is distributed in the Apache License 2.0.