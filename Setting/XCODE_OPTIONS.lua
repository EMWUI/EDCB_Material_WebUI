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
--filter*Fast:倍速再生用、未定義でもよい
--editorFast:単独で倍速再生にできないトランスコーダーの手前に置く編集コマンド。指定方法はxcoderと同様
--editorOptionFast:標準入出力ともにMPEG2-TSで倍速再生になるようにオプションを指定する
XCODE_OPTIONS={
  {
    --ffmpegの例。-b:vでおおよその最大ビットレートを決め、-qminで動きの少ないシーンのデータ量を節約する
    name='360p/h264/ffmpeg',
    xcoder='ffmpeg\\ffmpeg.exe|ffmpeg.exe',
    option='-f mpegts -analyzeduration 1M -i - -map 0:v:0? -vcodec libx264 -flags:v +cgop -profile:v main -level 31 -b:v 1888k -qmin 23 -maxrate 4M -bufsize 4M -preset veryfast $FILTER -s 640x360 -map 0:a:$AUDIO -acodec aac -ac 2 -b:a 160k $CAPTION -max_interleave_delta 500k $OUTPUT',
    filter='-g 120 -vf yadif=0:-1:1',
    filterCinema='-g 96 -vf pullup -r 24000/1001',
    filterFast='-g 120 -vf yadif=0:-1:1,setpts=PTS/'..XCODE_FAST..' -af atempo='..XCODE_FAST..' -bsf:s setts=ts=TS/'..XCODE_FAST,
    filterCinemaFast='-g 96 -vf pullup,setpts=PTS/'..XCODE_FAST..' -af atempo='..XCODE_FAST..' -bsf:s setts=ts=TS/'..XCODE_FAST..' -r 24000/1001',
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
    filterFast='-g 120 -vf yadif=0:-1:1,setpts=PTS/'..XCODE_FAST..' -af atempo='..XCODE_FAST..' -bsf:s setts=ts=TS/'..XCODE_FAST,
    filterCinemaFast='-g 96 -vf pullup,setpts=PTS/'..XCODE_FAST..' -af atempo='..XCODE_FAST..' -bsf:s setts=ts=TS/'..XCODE_FAST..' -r 24000/1001',
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
    filterFast='-g 120 -vf yadif=0:-1:1,setpts=PTS/'..XCODE_FAST..' -af atempo='..XCODE_FAST..' -bsf:s setts=ts=TS/'..XCODE_FAST,
    filterCinemaFast='-g 96 -vf pullup,setpts=PTS/'..XCODE_FAST..' -af atempo='..XCODE_FAST..' -bsf:s setts=ts=TS/'..XCODE_FAST..' -r 24000/1001',
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
    filterFast='-vf yadif=0:-1:1,setpts=PTS/'..XCODE_FAST..' -af atempo='..XCODE_FAST,
    filterCinemaFast='-vf pullup,setpts=PTS/'..XCODE_FAST..' -af atempo='..XCODE_FAST..' -r 24000/1001',
    captionNone='-sn',
    output={'webm','-f webm -'},
  },
  {
    --NVEncCの例。倍速再生にはffmpegも必要
    name='720p/h264/NVEncC',
    xcoder='NVEncC\\NVEncC64.exe|NVEncC\\NVEncC.exe|NVEncC64.exe|nvencc.exe',
    option='--input-format mpegts --input-analyze 1 --input-probesize 4M -i - --avhw --profile main --level 4.1 --vbr 3936 --qp-min 23:26:30 --max-bitrate 8192 --vbv-bufsize 8192 --preset default $FILTER --output-res 1280x720 --audio-stream $AUDIO?:stereo --audio-codec $AUDIO?aac --audio-bitrate $AUDIO?160 --audio-disposition $AUDIO?default $CAPTION -m max_interleave_delta:500k $OUTPUT',
    audioStartAt=1,
    filter='--gop-len 120 --interlace tff --vpp-deinterlace normal',
    filterCinema='--gop-len 96 --interlace tff --vpp-deinterlace normal --vpp-decimate',
    filterFast='--fps '..math.floor(30000*XCODE_FAST+0.5)..'/1001 --gop-len '..math.floor(120*XCODE_FAST)..' --interlace tff --vpp-deinterlace normal',
    filterCinemaFast='--fps '..math.floor(30000*XCODE_FAST+0.5)..'/1001 --gop-len '..math.floor(96*XCODE_FAST)..' --interlace tff --vpp-deinterlace normal --vpp-decimate',
    editorFast='ffmpeg\\ffmpeg.exe|ffmpeg.exe',
    editorOptionFast='-f mpegts -analyzeduration 1M -i - -bsf:v setts=ts=TS/'..XCODE_FAST..' -map 0:v:0? -vcodec copy -af atempo='..XCODE_FAST..' -bsf:s setts=ts=TS/'..XCODE_FAST..' -map 0:a -acodec ac3 -ac 2 -b:a 640k -map 0:s? -scodec copy -max_interleave_delta 300k -f mpegts -',
    captionNone='',
    captionHls='--sub-copy',
    output={'mp4','-f mp4 --no-mp4opt -m movflags:frag_keyframe+empty_moov -o -'},
    outputHls={'m2t','-f mpegts -o -'},
  },
  {
    --QSVEncCの例。倍速再生にはffmpegも必要
    name='720p/h264/QSVEncC',
    xcoder='QSVEncC\\QSVEncC64.exe|QSVEncC\\QSVEncC.exe|QSVEncC64.exe|qsvencc.exe',
    option='--input-format mpegts --input-analyze 1 --input-probesize 4M -i - --avhw --profile main --level 4.1 --qvbr 3936 --qvbr-quality 26 --fallback-rc --max-bitrate 8192 --vbv-bufsize 8192 $FILTER --output-res 1280x720 --audio-stream $AUDIO?:stereo --audio-codec $AUDIO?aac --audio-bitrate $AUDIO?160 --audio-disposition $AUDIO?default $CAPTION -m max_interleave_delta:500k $OUTPUT',
    audioStartAt=1,
    filter='--gop-len 120 --interlace tff --vpp-deinterlace normal',
    filterCinema='--gop-len 96 --interlace tff --vpp-deinterlace normal --vpp-decimate',
    filterFast='--fps '..math.floor(30000*XCODE_FAST+0.5)..'/1001 --gop-len '..math.floor(120*XCODE_FAST)..' --interlace tff --vpp-deinterlace normal',
    filterCinemaFast='--fps '..math.floor(30000*XCODE_FAST+0.5)..'/1001 --gop-len '..math.floor(96*XCODE_FAST)..' --interlace tff --vpp-deinterlace normal --vpp-decimate',
    editorFast='ffmpeg\\ffmpeg.exe|ffmpeg.exe',
    editorOptionFast='-f mpegts -analyzeduration 1M -i - -bsf:v setts=ts=TS/'..XCODE_FAST..' -map 0:v:0? -vcodec copy -af atempo='..XCODE_FAST..' -bsf:s setts=ts=TS/'..XCODE_FAST..' -map 0:a -acodec ac3 -ac 2 -b:a 640k -map 0:s? -scodec copy -max_interleave_delta 300k -f mpegts -',
    captionNone='',
    captionHls='--sub-copy',
    output={'mp4','-f mp4 --no-mp4opt -m movflags:frag_keyframe+empty_moov -o -'},
    outputHls={'m2t','-f mpegts -o -'},
  },
  {
    --QSVEncCの例。HEVC(未対応環境多め)。倍速再生にはffmpegも必要
    name='720p/hevc/QSVEncC',
    xcoder='QSVEncC\\QSVEncC64.exe|QSVEncC\\QSVEncC.exe|QSVEncC64.exe|qsvencc.exe',
    option='--input-format mpegts --input-analyze 1 --input-probesize 4M -i - --avhw -c hevc --profile main --level 4.1 --qvbr 3936 --qvbr-quality 26 --fallback-rc --max-bitrate 8192 --vbv-bufsize 8192 $FILTER --output-res 1280x720 --audio-stream $AUDIO?:stereo --audio-codec $AUDIO?aac --audio-bitrate $AUDIO?160 --audio-disposition $AUDIO?default $CAPTION -m max_interleave_delta:500k $OUTPUT',
    audioStartAt=1,
    filter='--gop-len 120 --interlace tff --vpp-deinterlace normal',
    filterCinema='--gop-len 96 --interlace tff --vpp-deinterlace normal --vpp-decimate',
    filterFast='--fps '..math.floor(30000*XCODE_FAST+0.5)..'/1001 --gop-len '..math.floor(120*XCODE_FAST)..' --interlace tff --vpp-deinterlace normal',
    filterCinemaFast='--fps '..math.floor(30000*XCODE_FAST+0.5)..'/1001 --gop-len '..math.floor(96*XCODE_FAST)..' --interlace tff --vpp-deinterlace normal --vpp-decimate',
    editorFast='ffmpeg\\ffmpeg.exe|ffmpeg.exe',
    editorOptionFast='-f mpegts -analyzeduration 1M -i - -bsf:v setts=ts=TS/'..XCODE_FAST..' -map 0:v:0? -vcodec copy -af atempo='..XCODE_FAST..' -bsf:s setts=ts=TS/'..XCODE_FAST..' -map 0:a -acodec ac3 -ac 2 -b:a 640k -map 0:s? -scodec copy -max_interleave_delta 300k -f mpegts -',
    captionNone='',
    captionHls='--sub-copy',
    output={'mp4','-f mp4 --no-mp4opt -m movflags:frag_keyframe+empty_moov -o -'},
    outputHls={'m2t','-f mpegts -o -'},
  },
  {
    --TS-Live!方式の例。映像はそのまま転送。倍速再生にはffmpegも必要
    name='tslive',
    tslive=true,
    xcoder='ffmpeg\\ffmpeg.exe|ffmpeg.exe',
    option='-f mpegts -analyzeduration 1M -i - -map 0:v:0? -vcodec copy $FILTER -map 0:a:$AUDIO -map 0:s? -scodec copy -max_interleave_delta 300k $OUTPUT',
    filter=':',
    filterFast='-bsf:v setts=ts=TS/'..XCODE_FAST..' -af atempo='..XCODE_FAST..' -bsf:s setts=ts=TS/'..XCODE_FAST..' -acodec aac -ac 2 -b:a 160k',
    output={'m2t','-f mpegts -'},
  },
}



--字幕表示のオプション https://github.com/monyone/aribb24.js#options
ARIBB24_JS_OPTION=[=[
  normalFont:'"Rounded M+ 1m for ARIB","Yu Gothic Medium",sans-serif',
  drcsReplacement:true
]=]



--実況ログ表示機能のデジタル放送のサービスIDと、実況の番号(jk?)
--キーの下4桁の16進数にサービスID、上1桁にネットワークID(ただし地上波は15=0xF)を指定
--指定しないサービスにはjkrdlogの既定値が使われる
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
