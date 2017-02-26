EDCB Material WebUI
===================

**EDCBのWebUIをMaterial Design Liteでマテリアルデザインっぽくします**  
[xtne6f氏](https://github.com/xtne6f/EDCB)の[e186f9a](https://github.com/xtne6f/EDCB/commit/2e186f9ad25d64ccbef0f649cb6ff92285674e81)以降で動作します  
またファイル再生にffmpeg.exe,readex.exe、ライブラリ機能にlfs.dllが必要です  
ffmpeg.exe,readex.exe,lfs.dllを別途ダウロードしてください  
lfs.dll,readex.exeのダウンロードはEDCBの[releases](https://github.com/xtne6f/EDCB/releases)からEDCB-work-plus-s-bin.zip、EDCB-tools-bin.zipにそれぞれ同梱されています


###使い方
EDCBのReadme_Mod.txtの*[Civetwebの組み込みについて](https://github.com/xtne6f/EDCB/blob/work-plus-s/Document/Readme_Mod.txt#L439-L507)*をよく読み  
README.md以外をEpgTimerSrv.exeと同じ場所に、ffmpeg.exeとreadex.exeをToolsフォルダに入れてください  
[HttpPublicFolder](https://github.com/xtne6f/EDCB/blob/work-plus-s/Document/Readme_Mod.txt#L462-L465)を設定している場合はHttpPublicの中身をそこに  
※HttpPublicFolderの任意のフォルダに入れる場合**apiフォルダ**だけは***HttpPublicFolder直下***に入れてください  

###テーマカラー
テーマカラーを変えることが出来ます  
[MDLのcustomize](http://www.getmdl.io/customize/index.html)で色を選択し
cssをダウンロードしmaterial.min.cssを置き換えるか  
Setting\HttpPublic.iniのSETのcssに下部に表示されてる<LINK>タグを追加して設定してください  
※一部(border周り)が置き換えただけでは対応できない部分があります(.mark)  
気になる方はcssをuser.cssに記述してください  
色は[Material design](http://www.google.com/design/spec/style/color.html#color-color-palette)から選択することをお勧めします  
.markのborderはA700を指定しています

###ライブラリ
録画保存フォルダのビデオファイル(ts,mp4,webm等)を表示・再生します  
Chrome系ブラウザでmp4を再生しようとするとエラーで再生できないことがありますが`-movflags faststart`オプションを付けエンコすることで再生できる場合があるようです  
また公開フォルダ外のファイルはスクリプトを経由するためシークできないようになっています  
**LuaFileSystem(lfs.dll)が必要です**  

必要に応じてSetting\HttpPublic.iniのSETに以下のキー[=デフォルト]を指定してください  
`batPath[=EDCBのbatフォルダ]`  
録画設定でこのフォルダの.batが選択可能になります  
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

**※ffmpegとreadexのデフォルト値がToolsフォルダに変更になりました※**  
`ffmpeg[=Tools\ffmpeg]`  
ffmpeg.exeのパス

`readex[=Tools\readex]`  
readex.exeのパス  

`ffmpegoption[=-vcodec libvpx -b 896k -quality realtime -cpu-used 1 -vf yadif=0:-1:1 -s 512x288 -r 30000/1001 -acodec libvorbis -ab 128k -f webm -]`  
ffmpegのオプション  
\# -iは指定する必要ありません  
\# リアルタイム変換と画質が両立するようにビットレート-bと計算量-cpu-usedを調整する

次は**[MOVIE]**で指定  
`HD[=-vcodec libvpx -b 1800k -quality realtime -cpu-used 2 -vf yadif=0:-1:1  -s 960x540 -r 30000/1001 -acodec libvorbis -ab 128k -f webm -]`  
ffmpegのオプションのHD用設定  
\# HDと言いつつデフォルトでは960x540なのでバランスを見つつHDに調整してください

#####サムネ
HttpPublicFolderのthumbsフォルダにファイル名.jpgがあるとグリッド表示の時にサムネを表示します

#####ファイル再生
* トランスコードするファイル(ts)もシークっぽい動作を可能にしました(offset(転送開始位置(99分率))を指定して再読み込み)  
また総再生時間が得られないためシークバーは動かしてません  
* スマホではtsの場合再生終了のフラグが得られないのか自動再生が動きません  
* 番組・予約詳細ページ  
容量確保録画の場合シークっぽい動作はできません
* 録画結果ページ  
録画結果(GetRecFileInfo())からファイルパスを取得してます  
リネームや移動していると再生することが出来ません

#####番組表の隠しコマンド
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

###お知らせ機能
※PCでのみでの機能です  
登録した番組の開始30秒前にディスクトップ通知します  
videoフォルダにnotification.mp3を用意すると通知音が出ます  
各自で用意してください

###注意
チャンネルが増えたりしたら設定を保存しなおしてください(番組表に表示されません)  
**スタンバイの機能を使うにはスクリプト(api/Common)のコメントアウトを解除する必要があります**  
~~tkntrec氏版をお使いのかたは必ず設定のtkntrec氏版を**有効**にしてください  
有効せずに使用しEPG予約を変更しようとすると番組長などの追加機能の設定がデフォルトにされます~~  
[cc6fafc](https://github.com/xtne6f/EDCB/commit/cc6fafcbfe5cb558e1ed89f6f3ff62ea5ec620ca)でオリジナルの機能がなくなったはずなので必要なくなりました  
設定は残しておきます

###動作確認

- PC
  - Chrome
  - Vivaldi
  - firefox
- Android
  - Chrome

※IEでも基本的に動作すると思いますがおすすめしません  

###その他
このプログラムの使用し不利益が生じても一切の責任を負いません  
また改変・再配布などはご自由にどうぞ

####Framework & JavaScriptライブラリ

* [Material Design Lite](http://www.getmdl.io)
* [Material icons](https://design.google.com/icons/)
* [dialog-polyfill](https://github.com/GoogleChrome/dialog-polyfill)
* [jQuery](https://jquery.com)
* [jQuery UI](https://jqueryui.com)
* [jQuery UI Touch Punch](http://touchpunch.furf.com)
* [Hammer.JS](http://hammerjs.github.io)
* [jquery.hammer.js](https://github.com/hammerjs/jquery.hammer.js)
