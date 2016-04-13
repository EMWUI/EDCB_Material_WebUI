EDCB Material WebUI
===================

**EDCBのWebUIをMaterial Design Liteでマテリアルデザインっぽくします**  
[xtne6f氏](https://github.com/xtne6f/EDCB)の[9bdd0a0](https://github.com/xtne6f/EDCB/commit/9bdd0a0f0c72a24eb680b1f890bf54c46bd2e939)以降が必要になります

###使い方
EDCBのReadme_Mod.txtの[Civetwebの組み込みについて](https://github.com/xtne6f/EDCB/blob/work-plus-s/Document/Readme_Mod.txt#L407-L481)をよく読み
HttpPublicの中身を[HttpPublicFolder](https://github.com/xtne6f/EDCB/blob/work-plus-s/Document/Readme_Mod.txt#L429-L432)に入れてください  

###テーマカラー
テーマカラーを変えることが出来ます  
[MDLのcustomize](http://www.getmdl.io/customize/index.html)で色を選択し
cssをダウンロードしmaterial.min.cssを置き換えるか  
Setting\HttpPublic.iniのSETのcssに下部に表示されてる<LINK>タグを追加して設定してください  
※一部(border周り)が置き換えただけでは対応できない部分があります(.mark)  
気になる方はcssをuser.cssに記述してください  
色は[Material design](http://www.google.com/design/spec/style/color.html#color-color-palette)から選択することをお勧めします  
.markのborderはA700を指定しています

###ファイル再生について
Setting\HttpPublic.iniのSETに以下のキー[=デフォルト]を指定してください  
`ffmpeg[=ffmpeg]`  
ffmpeg.exeのパス

`readex[=readex]`  
readex.exeのパス  
\# ダウンロードはEDCBのソース[ここ](https://github.com/xtne6f/EDCB/blob/work-plus-s/ini/HttpPublic/video/readtool.zip)から

以下は必要に応じて追加してください  
`ffmpegoption[=-vcodec libvpx -b 896k -quality realtime -cpu-used 1 -vf yadif=0:-1:1 -s 512x288 -r 30000/1001 -acodec libvorbis -ab 128k -f webm -]`  
ffmpegのオプション  
\# -iは指定する必要ありません  
\# リアルタイム変換と画質が両立するようにビットレート-bと計算量-cpu-usedを調整する

`xprepare[=48128]`  
転送開始前に変換しておく量(bytes)

※録画結果からファイルパスを取得してます  
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

###注意
チャンネルが増えたりしたら設定を保存しなおしてください(番組表に表示されません)  
tkntrec氏版をお使いのかたは必ず設定のtkntrec氏版を**有効**にしてください  
有効せずに使用しEPG予約を変更しようとすると番組長などの追加機能の設定がデフォルトにされます

###動作確認

- PC
  - Chrome
  - ~~Opera~~
  - Vivaldi
  - firefox
- Android
  - Chrome
  - Opera

※IEでも基本的に動作すると思いますがおすすめしません  
~~※**iPhoneなどの一部ブラウザで番組表でflexが効かずなのか表示が崩れてるようです**  
該当機種を所持しておらず確認できず対応できておりません  
対応できる方がいましたら協力お願いします~~

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
