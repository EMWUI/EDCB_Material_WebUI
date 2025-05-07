--[[
以下の設定用のファイルです
・トランスコードオプション
・字幕表示のオプション
・実況ログ表示機能のIDの対応づけ
・chatタグ表示前の置換
--]]

--トランスコードオプション
--HLSのときはセグメント長約4秒、最大8MBytes(=1秒あたり16Mbits)を想定しているので、オプションもそれに合わせること
--HLSでないときはフラグメントMP4などを使ったプログレッシブダウンロード。字幕は適当な重畳手法がまだないので未対応
--name:表示名
--xcoder:トランスコーダーのToolsフォルダからの相対パス。'|'で複数候補を指定可。見つからなければ最終候補にパスが通っているとみなす
--       Windows以外では".exe"が除去されて最終候補のみ参照される
--option:$OUTPUTは必須、再生時に適宜置換される。標準入力からMPEG2-TSを受け取るようにオプションを指定する
--※EMWUIでの倍速再生はHTMLMediaElement APIを使用しているため以下の設定は直接パラメータを指定等しない限り呼び出されない
--filter(Cinema):等速再生用、filterCinemaは未定義でもよい。特別に':'とするとトランスコードを省略してそのまま出力する
--filter*FastFunc:倍速再生用、未定義でもよい。倍率に応じたオプションを返す関数を指定する
--editorFast:単独で倍速再生にできないトランスコーダーの手前に置く編集コマンド。指定方法はxcoderと同様
--editorOptionFastFunc:標準入出力ともにMPEG2-TSで倍速再生になるようにオプションを返す関数を指定する
XCODE_OPTIONS={
  {
    --ffmpegの例。-b:vでおおよその最大ビットレートを決め、-qminで動きの少ないシーンのデータ量を節約する
    name='360p/h264/ffmpeg',
    xcoder='ffmpeg\\ffmpeg.exe|ffmpeg.exe',
    option='-f mpegts -analyzeduration 1M -i - -map 0:v:0? -vcodec libx264 -flags:v +cgop -profile:v main -level 31 -b:v 1888k -qmin 23 -maxrate 4M -bufsize 4M -preset veryfast $FILTER -s 640x360 -map 0:a:$AUDIO -acodec aac -ac 2 -b:a 160k $CAPTION -max_interleave_delta 500k $OUTPUT',
    filter='-g 120 -vf yadif=0:-1:1',
    filterCinema='-g 96 -vf pullup -r 24000/1001',
    filterFastFunc=function(rate) return '-g 120 -vf yadif=0:-1:1,setpts=PTS/'..rate..' -af atempo='..rate..' -bsf:s setts=ts=TS/'..rate end,
    filterCinemaFastFunc=function(rate) return '-g 96 -vf pullup,setpts=PTS/'..rate..' -af atempo='..rate..' -bsf:s setts=ts=TS/'..rate..' -r 24000/1001' end,
    captionNone='-sn',
    captionHls='-map 0:s? -scodec copy',
    output={'mp4','-f mp4 -movflags frag_keyframe+empty_moov -'},
    outputHls={'m2t','-f mpegts -'},
  },
  {
    name='720p/h264/ffmpeg-nvenc',
    xcoder='ffmpeg\\ffmpeg.exe|ffmpeg.exe',
    option='-f mpegts -analyzeduration 1M -i - -map 0:v:0? -vcodec h264_nvenc -profile:v main -level 41 -b:v 3936k -qmin 23 -maxrate 8M -bufsize 8M -preset medium $FILTER -s 1280x720 -map 0:a:$AUDIO -acodec aac -ac 2 -b:a 160k $CAPTION -max_interleave_delta 500k $OUTPUT',
    filter='-g 120 -vf yadif=0:-1:1',
    filterCinema='-g 96 -vf pullup -r 24000/1001',
    filterFastFunc=function(rate) return '-g 120 -vf yadif=0:-1:1,setpts=PTS/'..rate..' -af atempo='..rate..' -bsf:s setts=ts=TS/'..rate end,
    filterCinemaFastFunc=function(rate) return '-g 96 -vf pullup,setpts=PTS/'..rate..' -af atempo='..rate..' -bsf:s setts=ts=TS/'..rate..' -r 24000/1001' end,
    captionNone='-sn',
    captionHls='-map 0:s? -scodec copy',
    output={'mp4','-f mp4 -movflags frag_keyframe+empty_moov -'},
    outputHls={'m2t','-f mpegts -'},
  },
  {
    --ffmpegのh264_qsvは環境によって異常にビットレートが高くなったりしてあまり質が良くない。要注意
    name='720p/h264/ffmpeg-qsv',
    xcoder='ffmpeg\\ffmpeg.exe|ffmpeg.exe',
    option='-f mpegts -analyzeduration 1M -i - -map 0:v:0? -vcodec h264_qsv -profile:v main -level 41 -b:v 3936k -min_qp_i 23 -min_qp_p 26 -min_qp_b 30 -maxrate 8M -bufsize 8M -preset medium $FILTER -s 1280x720 -map 0:a:$AUDIO -acodec aac -ac 2 -b:a 160k $CAPTION -max_interleave_delta 500k $OUTPUT',
    filter='-g 120 -vf yadif=0:-1:1',
    filterCinema='-g 96 -vf pullup -r 24000/1001',
    filterFastFunc=function(rate) return '-g 120 -vf yadif=0:-1:1,setpts=PTS/'..rate..' -af atempo='..rate..' -bsf:s setts=ts=TS/'..rate end,
    filterCinemaFastFunc=function(rate) return '-g 96 -vf pullup,setpts=PTS/'..rate..' -af atempo='..rate..' -bsf:s setts=ts=TS/'..rate..' -r 24000/1001' end,
    captionNone='-sn',
    captionHls='-map 0:s? -scodec copy',
    output={'mp4','-f mp4 -movflags frag_keyframe+empty_moov -'},
    outputHls={'m2t','-f mpegts -'},
  },
  {
    name='360p/webm/ffmpeg',
    xcoder='ffmpeg\\ffmpeg.exe|ffmpeg.exe',
    option='-f mpegts -analyzeduration 1M -i - -map 0:v:0? -vcodec libvpx -b:v 1888k -quality realtime -cpu-used 1 $FILTER -s 640x360 -map 0:a:$AUDIO -acodec libvorbis -ac 2 -b:a 160k $CAPTION -max_interleave_delta 500k $OUTPUT',
    filter='-vf yadif=0:-1:1',
    filterCinema='-vf pullup -r 24000/1001',
    filterFastFunc=function(rate) return '-vf yadif=0:-1:1,setpts=PTS/'..rate..' -af atempo='..rate end,
    filterCinemaFastFunc=function(rate) return '-vf pullup,setpts=PTS/'..rate..' -af atempo='..rate..' -r 24000/1001' end,
    captionNone='-sn',
    output={'webm','-f webm -'},
  },
  {
    --NVEncCの例。倍速再生にはffmpegも必要
    name='720p/h264/NVEncC',
    xcoder='NVEncC\\NVEncC64.exe|NVEncC\\NVEncC.exe|NVEncC64.exe|nvencc.exe',
    option='--input-format mpegts --input-analyze 1 --input-probesize 4M -i - --avhw --avsync forcecfr --profile main --level 4.1 --vbr 3936 --qp-min 23:26:30 --max-bitrate 8192 --vbv-bufsize 8192 --preset default $FILTER --output-res 1280x720 --audio-stream $AUDIO?:stereo --audio-codec $AUDIO?aac --audio-bitrate $AUDIO?160 --audio-disposition $AUDIO?default $CAPTION -m max_interleave_delta:500k $OUTPUT',
    audioStartAt=1,
    filter='--gop-len 120 --interlace tff --vpp-deinterlace normal',
    filterCinema='--gop-len 96 --interlace tff --vpp-deinterlace normal --vpp-decimate',
    filterFastFunc=function(rate) return '--fps '..math.floor(30000*rate+0.5)..'/1001 --gop-len '..math.floor(120*rate)..' --interlace tff --vpp-deinterlace normal' end,
    filterCinemaFastFunc=function(rate) return '--fps '..math.floor(30000*rate+0.5)..'/1001 --gop-len '..math.floor(96*rate)..' --interlace tff --vpp-deinterlace normal --vpp-decimate' end,
    editorFast='ffmpeg\\ffmpeg.exe|ffmpeg.exe',
    editorOptionFastFunc=function(rate) return '-f mpegts -analyzeduration 1M -i - -bsf:v setts=ts=TS/'..rate..' -map 0:v:0? -vcodec copy -af atempo='..rate..' -bsf:s setts=ts=TS/'..rate..' -map 0:a -acodec ac3 -ac 2 -b:a 640k -map 0:s? -scodec copy -max_interleave_delta 300k -f mpegts -' end,
    captionNone='',
    captionHls='--sub-copy',
    output={'mp4','-f mp4 --no-mp4opt -m movflags:frag_keyframe+empty_moov -o -'},
    outputHls={'m2t','-f mpegts -o -'},
  },
  {
    --QSVEncCの例。倍速再生にはffmpegも必要
    name='720p/h264/QSVEncC',
    xcoder='QSVEncC\\QSVEncC64.exe|QSVEncC\\QSVEncC.exe|QSVEncC64.exe|qsvencc.exe',
    option='--input-format mpegts --input-analyze 1 --input-probesize 4M -i - --avhw --avsync forcecfr --profile main --level 4.1 --qvbr 3936 --qvbr-quality 26 --fallback-rc --max-bitrate 8192 --vbv-bufsize 8192 $FILTER --output-res 1280x720 --audio-stream $AUDIO?:stereo --audio-codec $AUDIO?aac --audio-bitrate $AUDIO?160 --audio-disposition $AUDIO?default $CAPTION -m max_interleave_delta:500k $OUTPUT',
    audioStartAt=1,
    filter='--gop-len 120 --interlace tff --vpp-deinterlace normal',
    filterCinema='--gop-len 96 --interlace tff --vpp-deinterlace normal --vpp-decimate',
    filterFastFunc=function(rate) return '--fps '..math.floor(30000*rate+0.5)..'/1001 --gop-len '..math.floor(120*rate)..' --interlace tff --vpp-deinterlace normal' end,
    filterCinemaFastFunc=function(rate) return '--fps '..math.floor(30000*rate+0.5)..'/1001 --gop-len '..math.floor(96*rate)..' --interlace tff --vpp-deinterlace normal --vpp-decimate' end,
    editorFast='ffmpeg\\ffmpeg.exe|ffmpeg.exe',
    editorOptionFastFunc=function(rate) return '-f mpegts -analyzeduration 1M -i - -bsf:v setts=ts=TS/'..rate..' -map 0:v:0? -vcodec copy -af atempo='..rate..' -bsf:s setts=ts=TS/'..rate..' -map 0:a -acodec ac3 -ac 2 -b:a 640k -map 0:s? -scodec copy -max_interleave_delta 300k -f mpegts -' end,
    captionNone='',
    captionHls='--sub-copy',
    output={'mp4','-f mp4 --no-mp4opt -m movflags:frag_keyframe+empty_moov -o -'},
    outputHls={'m2t','-f mpegts -o -'},
  },
  {
    --QSVEncCの例。HEVC(未対応環境多め)。倍速再生にはffmpegも必要
    name='720p/hevc/QSVEncC',
    xcoder='QSVEncC\\QSVEncC64.exe|QSVEncC\\QSVEncC.exe|QSVEncC64.exe|qsvencc.exe',
    option='--input-format mpegts --input-analyze 1 --input-probesize 4M -i - --avhw --avsync forcecfr -c hevc --profile main --level 4.1 --qvbr 3936 --qvbr-quality 26 --fallback-rc --max-bitrate 8192 --vbv-bufsize 8192 $FILTER --output-res 1280x720 --audio-stream $AUDIO?:stereo --audio-codec $AUDIO?aac --audio-bitrate $AUDIO?160 --audio-disposition $AUDIO?default $CAPTION -m max_interleave_delta:500k $OUTPUT',
    audioStartAt=1,
    filter='--gop-len 120 --interlace tff --vpp-deinterlace normal',
    filterCinema='--gop-len 96 --interlace tff --vpp-deinterlace normal --vpp-decimate',
    filterFastFunc=function(rate) return '--fps '..math.floor(30000*rate+0.5)..'/1001 --gop-len '..math.floor(120*rate)..' --interlace tff --vpp-deinterlace normal' end,
    filterCinemaFastFunc=function(rate) return '--fps '..math.floor(30000*rate+0.5)..'/1001 --gop-len '..math.floor(96*rate)..' --interlace tff --vpp-deinterlace normal --vpp-decimate' end,
    editorFast='ffmpeg\\ffmpeg.exe|ffmpeg.exe',
    editorOptionFastFunc=function(rate) return '-f mpegts -analyzeduration 1M -i - -bsf:v setts=ts=TS/'..rate..' -map 0:v:0? -vcodec copy -af atempo='..rate..' -bsf:s setts=ts=TS/'..rate..' -map 0:a -acodec ac3 -ac 2 -b:a 640k -map 0:s? -scodec copy -max_interleave_delta 300k -f mpegts -' end,
    captionNone='',
    captionHls='--sub-copy',
    output={'mp4','-f mp4 --no-mp4opt -m movflags:frag_keyframe+empty_moov -o -'},
    outputHls={'m2t','-f mpegts -o -'},
  },
  {
    --TS-Live!方式の例。そのまま転送。トランスコーダー不要(tsreadex.exeは必要)
    name='tslive',
    tslive=true,
    xcoder='',
    option='',
    filter=':',
    filterFastFunc=function() return ':' end,
    output={'m2t',''},
  },
}



--字幕表示のオプション https://github.com/monyone/aribb24.js#options
ARIBB24_JS_OPTION=[=[
  normalFont:'"Rounded M+ 1m for ARIB","Yu Gothic Medium",sans-serif',
  drcsReplacement:true
]=]



--実況の番号(jk?)と、チャットのID(ch???やlv???など)
--指定しない番号には"jkconst.lua"にある既定値が使われる
JKCNSL_CHAT_STREAMS={
  --jk7の対応づけを変更したいとき
  --[7]='ch???',
  --jk7はどこにも接続したくないとき
  --[7]='',
  --jk7はニコニコ実況だけにしたいとき
  --[7]='ch2646441,',
  --jk7はNX-Jikkyo・避難所だけにしたいとき("NX"の部分は任意の英数字)
  --[7]=',NX',
}

--実況ログ表示機能のデジタル放送のサービスIDと、実況の番号(jk?)
--キーの下4桁の16進数にサービスID、上1桁にネットワークID(ただし地上波は15=0xF)を指定
--指定しないサービスには"jkconst.lua"にある既定値が使われる
JK_CHANNELS={
  --例:テレビ東京(0x0430)をjk7と対応づけたいとき
  --[0xF0430]=7,
  --例:NHKBS1(0x0065)とデフォルト(jk101)との対応付けを解除したいとき
  --[0x40065]=-1,
}

--chatタグ表示前の置換(JavaScript)
JK_CUSTOM_REPLACE=[=[
  // 広告などを下コメにする
  tag = tag.replace(/^<chat(?![^>]*? mail=)/, '<chat mail=""');
  tag = tag.replace(/^(<chat[^>]*? premium="3"[^>]*?>\/nicoad )(\{[^<]*?"totalAdPoint":)(\d+)/, "$1$3$2");
  tag = tag.replace(/^<chat(?=[^>]*? premium="3")([^>]*? mail=")([^>]*?>)\/nicoad (\d*)\{[^<]*?"message":("[^<]*?")[,}][^<]*/, '<chat align="right"$1shita small yellow $2$4($3pt)');
  tag = tag.replace(/^<chat(?=[^>]*? premium="3")([^>]*? mail=")([^>]*?>)\/spi /, '<chat align="right"$1shita small white2 $2');
]=]
