EDCB Material WebUI
===================

**EDCBのWebUIをMaterial Design Lite使いマテリアルデザインに沿うよう表示します**  
予約の追加確認、番組表の表示などの基本的な機能ほかリモート視聴、ファイル再生などができます  
また[Legacy WebUI](https://github.com/xtne6f/EDCB/tree/work-plus-s/ini/HttpPublic/legacy)をベースとして作成しています  
おかげさまでド素人にも作成することができましたxtne6f氏に感謝します


### 使い方

1. 必要なファイルのダウンロード (EDCBの[releases](https://github.com/xtne6f/EDCB/releases)と[ffmpeg.org](https://www.ffmpeg.org)から)
   * CivetWebの組み込んだEDCB一式 ([xtne6f氏](https://github.com/xtne6f/EDCB)の[work-plus-s-180529](https://github.com/xtne6f/EDCB/releases/tag/work-plus-s-180529)以降)
   * lua52.dll [^1]
   * ffmpeg.exe [^2]
   * ffprobe.exe [^2] [^3]
   * readex.exe [^2]
   * asyncbuf.exe [^2]

[^1]: WebUIを表示に使用
[^2]: 再生機能に使用  
[^3]: ffmpegに同梱  
1. EDCBのReadme_Mod.txtの[*Civetwebの組み込みについて*](https://github.com/xtne6f/EDCB/blob/a25b9a98f12f5bc5fd912eb3a646949973ebbc01/Document/Readme_Mod.txt#L631-L743)をよく読む
1. EDCBのHTTPサーバ機能を有効化、アクセス制御を設定
   * `EnableHttpSrv=1`
   * `HttpAccessControlList=+127.0.0.1,+192.168.0.0/16`
1. http://localhost:5510/ にアクセス、サーバー機能が有効になったことを確認  
\# ここでうまく行かない場合はEDCBの設定の問題だと思われます
1. ファイルを適切に設置 (下記の配置例を参照)  
   \# 解凍したEDCB-work-plus-s-bin.zipにこのEMWUIを放り込めばとりあえず動くはず  
   \# 配置例 (＊があるものは必ずその場所に配置)

       EDCB/
        ├─ HttpPublic/
        │   ├─ api/ ＊
        │   ├─ EMWUI/
        │   ├─ legacy/
        │   ├─ img/ *
        │   │   └logo/ *
        │   └─ video/ ＊
        ├─ Tools/
        │   ├─ ffmpeg.exe
        │   ├─ ffprobe.exe
        │   ├─ readex.exe
        │   └─ asyncbuf.exe
        ├─ EpgDataCap_Bon.exe ＊
        ├─ EpgTimerSrv.exe ＊
        ├─ EpgTimer.exe ＊
        ├─ lua52.dll ＊
        └─ SendTSTCP.dll ＊

1. リモート視聴する場合EpgDataCap_Bon.exeのネットワーク設定でTCP送信に0.0.0.1 ポート:0を設定
1. http://localhost:5510/EMWUI/ にアクセス出来たら準備完了、設定へ

### 設定
基本的な設定は[設定ページ](http://localhost:5510/EMWUI/setting)にて行ってください  
必要に応じて設定ファイル(Setting\HttpPublic.ini)のSETに以下のキー[=デフォルト]を指定してください  
HttpPublic.iniは設定ページにて設定を保存すると作成されます

`batPath[=EDCBのbatフォルダ]`  
録画設定でこのフォルダの.batと.ps1が選択可能になります  
\# 変更する場合必ずフルパスで設定  
`batFileTag=`  
録画タグの候補を表示できるようになります  
カンマ区切りで指定ください

#### テーマカラー
テーマカラーを変えることが出来ます  
[MDLのcustomize](http://www.getmdl.io/customize/index.html)で色を選択cssをダウンロードしmaterial.min.cssを置き換える  
もしくは設定ファイルでキーcssに下部に表示されてる<LINK>タグを追加することでできます  
\# 例`css=<link rel="stylesheet" href="https://code.getmdl.io/1.3.0/material.blue_grey-pink.min.css" />`  
※一部(border周り)が置き換えただけでは対応できない部分があります(.mark)  
気になる方はcssをuser.cssに記述してください  
色は[Material design](http://www.google.com/design/spec/style/color.html#color-color-palette)から選択することをお勧めします  
.markのborderはA700を指定しています

#### 再生機能
**ffmpeg.exe、ffprobe.exe、readex.exeが必要です**  
`ffmpeg[=Tools\ffmpeg.exe]`  
ffmpeg.exeのパス

`ffprobe[=Tools\ffprobe.exe]`  
ffprobe.exeのパス

`readex[=Tools\readex.exe]`  
readex.exeのパス

`asyncbuf[=Tools\asyncbuf.exe]`  
asyncbuf.exeのパス
\# 出力バッファの量(XBUF)を指定した場合に必要になります
\# 変換負荷や通信のむらを吸収します

#### 画質設定(ffmpegオプション)
以下のような設定を書き込むとデフォルトと以下で指定した設定を読み込めるようになります

    [MOVIE]
    HD=-vcodec libvpx -b 1800k -quality realtime -cpu-used 2 $FILTER -s 960x540 -r 30000/1001 -acodec libvorbis -ab 128k -f webm -

もしくは[MOVIE]に`画質名=ffmpegオプション`を[SET]のqualityに画質名をコンマ区切りで複数の設定を読み込むことができます  
\# 例(オプションはものすごく適当です)

    [SET]
    quality=720p,480p,360p
    [MOVIE]
    720p=-vcodec libvpx -b:v 1800k -quality realtime -cpu-used 2 $FILTER -s 1280x720 -r 30000/1001 -acodec libvorbis -ab 128k -f webm -
    480p=-vcodec libvpx -b:v 1500k -quality realtime -cpu-used 2 $FILTER -s 720x480 -r 30000/1001 -acodec libvorbis -ab 128k -f webm -
    360p=-vcodec libvpx -b:v 1200k -quality realtime -cpu-used 2 $FILTER -s 640x360 -r 30000/1001 -acodec libvorbis -ab 128k -f webm -
    NVENC=-vcodec h264_nvenc -profile:v main -level 31 -b:v 1408k -maxrate 8M -bufsize 8M -preset medium -g 120 $FILTER -s 1280x720 -acodec aac -ab 128k -f mp4 -movflags frag_keyframe+empty_moov -

\# **$FILTERはフィルタオプション(インタレ解除:`-vf yadif=0:-1:1` 逆テレシネ:`-vf pullup -r 24000/1001`)に置換します**  
\# -iは指定する必要ありません  
\# -fのオプションを必ず指定するようにしてくださいmp4かどうか判定しています  
\# リアルタイム変換と画質が両立するようにビットレート-bと計算量-cpu-usedを調整する  
\# オプションにてQSVなども有効なようです


#### ライブラリ
録画保存フォルダのビデオファイル(ts,mp4,webm等)を表示・再生します  
Chrome系ブラウザでmp4を再生しようとするとエラーで再生できないことがありますが`-movflags faststart`オプションを付けエンコすることで再生できる場合が  
また公開フォルダ外のファイルはスクリプトを経由するためシークできるブラウザとできないブラウザあるようです  

`LibraryPath=1`  
ライブラリに表示するフォルダの読み込み設定を録画保存フォルダ(Common.ini)からHttpPublic.iniに変更します  
\# Common.iniと同じ形式で指定してください  
\# 例

    [SET]
    LibraryPath=1
    RecFolderNum=2
    RecFolderPath0=C:\DTV
    RecFolderPath1=C:\hoge

##### サムネ
HttpPublicFolderのvideo\thumbsフォルダに`md5ハッシュ.jpg`があるとサムネを表示できます  
ライブラリページのメニューから作成することができます

#### リモート視聴
**EpgDataCap_Bon.exeの設定、SendTSTCP.dllが必要です**  

EpgDataCap_Bon.exeはNetworkTVモードで起動しています  
NetworkTVモードを使用している場合は注意してください  
**音声が切り替わったタイミングで止まることがありますがその時は再読み込みしてください**

##### ファイル再生について
* トランスコードするファイル(ts)もシークっぽい動作を可能にしました(offset(転送開始位置(100分率))を指定して再読み込み)  
* 録画結果ページ  
録画結果(GetRecFileInfo())からファイルパスを取得してます  
リネームや移動していると再生することが出来ません


##### 放送中一覧
URLに`?webPanel=`を追加するとWEBパネル向けのデザインになります  
WEBパネルに追加して使用してください


##### 局ロゴ
TVTestの局ロゴを使用します  
TVTestの設定の「BMP形式のロゴを保存する」にチェックを入れてください  
\# TVTestのフォルダはEDCBのフォルダと同じ階層にあることを想定しています  
LogoData.iniが見つからない場合のみ公開フォルダ下の`img\logo\ONIDSID{.png|.bmp}`(4桁で16進数)を表示(旧仕様互換)  
TVTestのフォルダが想定規定と違う場合やLogoData.ini、Logoフォルダの設定を変更している場合設定ファイルにて指定してください  
`LOGO_INI[=TVTestのフォルダ\LogoData.ini]`  
LogoData.iniのパス  
`LOGO_DIR[=TVTestのフォルダ\Logo]`  
Logoフォルダのパス  

##### 番組表の隠しコマンド
`hour=整数`  
開始時間を指定

`interval=整数`  
表示間隔を指定  
デフォルト値 `PC=25` `スマホ=8`

`chcount=整数`  
読み込むチャンネル数を一時的に変更  
デフォルト値 `PC=0(無制限)` `スマホ=15`  
\# showが有効時は非表示のチャンネルを含みます

`show=`  
非表示指定したチャンネルを読み込む(サイドバーで表示・非表示)  
\# 値は指定する必要はありません

`subch=`  
サービス一覧でサブチャンネルを表示します  
\# 番組表だけでなくサービス一覧があるページで有効です(放送中、magnezio等)

以上をGETメゾットで取得しますURLに含めてください  
chcountとshowは週間番組表では使えません

### お知らせ機能
※PCでのみでの機能です  
登録した番組の開始30秒前にデスクトップ通知します  
videoフォルダにnotification.mp3を用意すると通知音が出ます  
各自で用意してください

### 注意
チャンネルが増えたりしたら設定を保存しなおしてください(番組表に表示されません)  
**スタンバイの機能を使うにはスクリプト(api/Common)のコメントアウトを解除する必要があります**  

### 動作確認

- Windows
  - Chrome
  - Vivaldi
  - firefox
- Android
  - Chrome

-ffmpeg version 4.3.1

### その他
**iOS、スカパープレミアムの環境はありません。**  
このプログラムを使用し不利益が生じても一切の責任を負いません  
また改変・再配布などはご自由にどうぞ  
バグ報告は詳細に、環境ない箇所の場合は特に、対処できません

#### Framework & JavaScriptライブラリ

* [Material Design Lite](http://www.getmdl.io)
* [Material icons](https://design.google.com/icons/)
* [dialog-polyfill](https://github.com/GoogleChrome/dialog-polyfill)
* [jQuery](https://jquery.com)
* [jQuery UI](https://jqueryui.com)
* [jQuery UI Touch Punch](http://touchpunch.furf.com)
* [Hammer.JS](http://hammerjs.github.io)
* [jquery.hammer.js](https://github.com/hammerjs/jquery.hammer.js)
