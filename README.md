EDCB Material WebUI
===================

**EDCBのWebUI([Legacy WebUI](https://github.com/xtne6f/EDCB/tree/work-plus-s/ini/HttpPublic/legacy))をベースにMaterial Design Liteでマテリアルデザインっぽくします**  
[xtne6f氏](https://github.com/xtne6f/EDCB)の[e186f9a](https://github.com/xtne6f/EDCB/commit/b72c091672f3c042c7c1369e51282fcadcf61df8)以降で動作します  
またファイル再生にffmpeg.exe,readex.exe、ライブラリ機能にlfs.dllが必要です  
ffmpeg.exe,readex.exe,lfs.dllを別途ダウロードしてください  
lfs.dll,readex.exeのダウンロードはEDCBの[releases](https://github.com/xtne6f/EDCB/releases)からEDCB-work-plus-s-bin.zipまたはEDCB-tools-bin.zipに同梱されています


### 使い方
EDCBのReadme_Mod.txtの[*Civetwebの組み込みについて*](https://github.com/xtne6f/EDCB/blob/9add270103ae26e62930707cf2b39fb8c5da18b7/Document/Readme_Mod.txt#L537-L641)をよく読み  
HttpPublicをEpgTimerSrv.exeと同じ場所に、ffmpeg.exeとreadex.exeをToolsフォルダに入れ http://localhost:5510/EMWUI/ 等にアクセスしてください  
[HttpPublicFolder](https://github.com/xtne6f/EDCB/blob/9add270103ae26e62930707cf2b39fb8c5da18b7/Document/Readme_Mod.txt#L566-L570)を設定している場合はHttpPublicの中身を適切に配置してください  
※*apiフォルダ*は必ず**HttpPublicFolder直下**に入れてください  

### テーマカラー
テーマカラーを変えることが出来ます  
[MDLのcustomize](http://www.getmdl.io/customize/index.html)で色を選択し
cssをダウンロードしmaterial.min.cssを置き換えるか  
Setting\HttpPublic.iniのSETのcssに下部に表示されてる<LINK>タグを追加して設定してください  
※一部(border周り)が置き換えただけでは対応できない部分があります(.mark)  
気になる方はcssをuser.cssに記述してください  
色は[Material design](http://www.google.com/design/spec/style/color.html#color-color-palette)から選択することをお勧めします  
.markのborderはA700を指定しています

### ライブラリ
**LuaFileSystem(lfs.dll)が必要です**  
録画保存フォルダのビデオファイル(ts,mp4,webm等)を表示・再生します  
Chrome系ブラウザでmp4を再生しようとするとエラーで再生できないことがありますが`-movflags faststart`オプションを付けエンコすることで再生できる場合が  
また公開フォルダ外のファイルはスクリプトを経由するためシークできるブラウザとできないブラウザあるようです  

必要に応じてSetting\HttpPublic.iniのSETに以下のキー[=デフォルト]を指定してください  
`batPath[=EDCBのbatフォルダ]`  
録画設定でこのフォルダの.batと.ps1が選択可能になります  
\# 変更する場合必ずフルパスで設定

`LibraryPath=1`  
ライブラリに表示するフォルダの読み込み設定を録画保存フォルダ(Common.ini)からHttpPublic.iniに変更します  
\# Common.iniと同じ形式で指定してください  
\# 例

    [SET]
    RecFolderNum=2
    RecFolderPath0=C:\DTV
    RecFolderPath1=C:\hoge

`xprepare[=48128]`  
転送開始前に変換しておく量(bytes)

`ffmpeg[=Tools\ffmpeg]`  
ffmpeg.exeのパス  

`readex[=Tools\readex]`  
readex.exeのパス  

#### 画質設定(ffmpegオプション)  
以下のような設定を書き込むとデフォルトと以下で指定した設定を読み込めるようになります

    [MOVIE]
    HD=-vcodec libvpx -b 1800k -quality realtime -cpu-used 2 -vf yadif=0:-1:1  -s 960x540 -r 30000/1001 -acodec libvorbis -ab 128k -f webm -

もしくは[MOVIE]に`画質名=ffmpegオプション`を[SET]のqualityに画質名をコンマ区切りで複数の設定を読み込むことができます  
\# 例(オプションはものすごく適当です)

    [SET]
    quality=720p,480p,360p
    [MOVIE]
    720p=-vcodec libvpx -b:v 1800k -quality realtime -cpu-used 2 -vf yadif=0:-1:1  -s 1280x720 -r 30000/1001 -acodec libvorbis -ab 128k -f webm -
    480p=-vcodec libvpx -b:v 1500k -quality realtime -cpu-used 2 -vf yadif=0:-1:1  -s 720x480 -r 30000/1001 -acodec libvorbis -ab 128k -f webm -
    360p=-vcodec libvpx -b:v 1200k -quality realtime -cpu-used 2 -vf yadif=0:-1:1  -s 640x360 -r 30000/1001 -acodec libvorbis -ab 128k -f webm -

\# -iは指定する必要ありません  
\# リアルタイム変換と画質が両立するようにビットレート-bと計算量-cpu-usedを調整する




##### サムネ
HttpPublicFolderのthumbsフォルダにファイル名.jpgがあるとサムネを表示します

##### ファイル再生
* トランスコードするファイル(ts)もシークっぽい動作を可能にしました(offset(転送開始位置(99分率))を指定して再読み込み)  
また総再生時間が得られないためシークバーは動かしてません  
* スマホではtsの場合再生終了のフラグが得られないのか自動再生が動きません  
* 番組・予約詳細ページ  
容量確保録画の場合シークっぽい動作はできません
* 録画結果ページ  
録画結果(GetRecFileInfo())からファイルパスを取得してます  
リネームや移動していると再生することが出来ません

##### 放送中一覧
`\img\logo`に4桁で16進数の`ONIDSID.png`があると局ロゴを表示します  
例 BS1: `00040065.png` NHK(東京): `7FE00400.png`  
(LibISDB(TvTest)のtslogoextractのソースをちょっといじって使用するとBS・CSは作成しやすいかも）
URLに`?webPanel=`を追加するとWEBパネル向けのデザインになります  
WEBパネルに追加して使用してください

##### 番組表の隠しコマンド
`hour=整数`  
開始時間を指定

`interval=整数`  
表示間隔を指定

`chcount=整数`  
読み込むチャンネル数を一時的に変更  
\# showが有効時は非表示のチャンネルを含みます

`show=`  
非表示指定したチャンネルを読み込む(サイドバーで表示・非表示)  
\# 値は指定する必要はありません  

以上をgetメゾットで取得しますurlに含めてください  
chcountとshowは週間番組表では使えません  
スマホのブックマークなどでの使用を推薦(設定によっては軽くなるかも)

### お知らせ機能
※PCでのみでの機能です  
登録した番組の開始30秒前にディスクトップ通知します  
videoフォルダにnotification.mp3を用意すると通知音が出ます  
各自で用意してください

### 注意
チャンネルが増えたりしたら設定を保存しなおしてください(番組表に表示されません)  
**スタンバイの機能を使うにはスクリプト(api/Common)のコメントアウトを解除する必要があります**  

### 動作確認

- PC
  - Chrome
  - Vivaldi
  - firefox
- Android
  - Chrome

### その他
このプログラムの使用し不利益が生じても一切の責任を負いません  
また改変・再配布などはご自由にどうぞ

#### Framework & JavaScriptライブラリ

* [Material Design Lite](http://www.getmdl.io)
* [Material icons](https://design.google.com/icons/)
* [dialog-polyfill](https://github.com/GoogleChrome/dialog-polyfill)
* [jQuery](https://jquery.com)
* [jQuery UI](https://jqueryui.com)
* [jQuery UI Touch Punch](http://touchpunch.furf.com)
* [Hammer.JS](http://hammerjs.github.io)
* [jquery.hammer.js](https://github.com/hammerjs/jquery.hammer.js)
