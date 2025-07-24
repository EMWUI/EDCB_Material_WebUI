INI='Setting/HttpPublic.ini'

--情報通知ログの表示を許可するかどうか
SHOW_NOTIFY_LOG=tonumber(edcb.GetPrivateProfile('SET','SHOW_NOTIFY_LOG',true,INI))~=0
--デバッグ出力の表示を許可するかどうか
SHOW_DEBUG_LOG=tonumber(edcb.GetPrivateProfile('SET','SHOW_DEBUG_LOG',false,INI))~=0

--メニューに「システムスタンバイ」ボタンを表示するかどうか(Windows専用)
INDEX_ENABLE_SUSPEND=tonumber(edcb.GetPrivateProfile('SET','SUSPEND',false,INI))~=0
--メニューの「システムスタンバイ」ボタンを「システム休止」にするかどうか
INDEX_SUSPEND_USE_HIBERNATE=tonumber(edcb.GetPrivateProfile('SET','HIBERNATE',false,INI))~=0

--HLS(HTTP Live Streaming)を許可するかどうか。する場合はtsmemseg.exeを用意すること。IE非対応
ALLOW_HLS=tonumber(edcb.GetPrivateProfile('HLS','ALLOW_HLS',true,INI))~=0
--ネイティブHLS非対応環境でもhls.jsを使ってHLS再生するかどうか
ALWAYS_USE_HLS=tonumber(edcb.GetPrivateProfile('HLS','ALWAYS_USE_HLS',true,INI))~=0
--HLS再生時にトランスコーダーから受け取ったMPEG2-TSをMP4に変換するかどうか。有効時はHEVCトランスコードに対応
--※Android版Firefoxでは不具合があるため無効扱いになる
USE_MP4_HLS=tonumber(edcb.GetPrivateProfile('HLS','USE_MP4_HLS',true,INI))~=0
--視聴機能(viewボタン)でLowLatencyHLSにするかどうか。再生遅延が小さくなる。ネイティブHLS環境ではHTTP/2が要求されるためhls.js使用時のみ有用
USE_MP4_LLHLS=tonumber(edcb.GetPrivateProfile('HLS','USE_MP4_LLHLS',true,INI))~=0

--倍速再生の倍率のリスト
XCODE_FAST_RATES={
  0.25,
  0.5,
  0.75,
  1.0,
  1.25,
  1.5,
  2.0,
}

--トランスコードオプション
--HLSのときはセグメント長約4秒、最大8MBytes(=1秒あたり16Mbits)を想定しているので、オプションもそれに合わせること
--HLSでないときはフラグメントMP4などを使ったプログレッシブダウンロード。字幕は適当な重畳手法がまだないので未対応
--name:表示名
--xcoder:トランスコーダーのToolsフォルダからの相対パス。'|'で複数候補を指定可。見つからなければ最終候補にパスが通っているとみなす
--       Windows以外では".exe"が除去されて最終候補のみ参照される
--option:$OUTPUTは必須、再生時に適宜置換される。標準入力からMPEG2-TSを受け取るようにオプションを指定する
--filter(Cinema):等速再生用、filterCinemaは未定義でもよい。特別に':'とするとトランスコードを省略してそのまま出力する
--filter*FastFunc:倍速再生用、未定義でもよい。倍率に応じたオプションを返す関数を指定する
--editorFast:単独で倍速再生にできないトランスコーダーの手前に置く編集コマンド。指定方法はxcoderと同様
--editorOptionFastFunc:標準入出力ともにMPEG2-TSで倍速再生になるようにオプションを返す関数を指定する
--autoCinema:TS-Live!方式専用。Cinema(逆テレシネ)モードを自動切り替え
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
    name='TS-Live!',
    autoCinema=true,
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

--字幕表示にSVGRendererを使うかどうか。描画品質が上がる(ただし一部ブラウザで背景に線が入る)。IE非対応
ARIBB24_USE_SVG=tonumber(edcb.GetPrivateProfile('HLS','ARIBB24_USE_SVG',false,INI))~=0

--データ放送表示機能を使うかどうか。トランスコード中に表示する場合はpsisiarc.exeを用意すること。IE非対応
USE_DATACAST=tonumber(edcb.GetPrivateProfile('SET','DATACAST',true,INI))~=0

--ライブ実況表示機能を使うかどうか
--利用には実況を扱うツール側の対応(NicoJKの場合はcommentShareMode)が必要
USE_LIVEJK=tonumber(edcb.GetPrivateProfile('JK','LIVEJK',true,INI))~=0

--jkcnslを直接呼び出してライブ実況する場合、その絶対パス。Windows以外ではコマンド名
--コメント投稿したい場合はあらかじめjkcnsl側でログインしておく(jkcnslのReadmeを参照)
JKCNSL_PATH=edcb.GetPrivateProfile('JK','JKCNSL_PATH','',INI)
if JKCNSL_PATH=='' then JKCNSL_PATH=nil end

--jkcnslの設定ファイルなどが置かれている場所(通常、変更不要)
JKCNSL_UNIX_BASE_DIR=edcb.GetPrivateProfile('JK','UNIX_BASE_DIR','/var/local/jkcnsl',INI)

--以下、JKCNSL_で始まる定数はjkcnslを直接呼び出してライブ実況する場合のオプション。意味はNicoJKの対応する設定と同じ
JKCNSL_REFUGE_URI=edcb.GetPrivateProfile('JK','refugeUri','',INI)
if JKCNSL_REFUGE_URI=='' then JKCNSL_REFUGE_URI=nil end
JKCNSL_DROP_FORWARDED_COMMENT=edcb.GetPrivateProfile('JK','dropForwardedComment',false,INI)~=0
JKCNSL_REFUGE_MIXING=edcb.GetPrivateProfile('JK','refugeMixing',false,INI)~=0
JKCNSL_ANONYMITY=edcb.GetPrivateProfile('JK','anonymity',true,INI)~=0

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

--実況ログ表示機能を使う場合、jkrdlog.exeの絶対パス。Windows以外ではコマンド名
JKRDLOG_PATH=edcb.GetPrivateProfile('JK','JKRDLOG_PATH','',INI)
if JKRDLOG_PATH=='' then JKRDLOG_PATH=nil end

--実況コメントの文字の高さ(px)
JK_COMMENT_HEIGHT=tonumber(edcb.GetPrivateProfile('JK','COMMENT_HEIGHT',32,INI))

--実況コメントの表示時間(秒)
JK_COMMENT_DURATION=tonumber(edcb.GetPrivateProfile('JK','COMMENT_DURATION',5,INI))

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

--トランスコードするプロセスを1つだけに制限するかどうか(並列処理できる余裕がシステムにない場合など)
XCODE_SINGLE=tonumber(edcb.GetPrivateProfile('XCODE','SINGLE',false,INI))~=0
--ログを"log"フォルダに保存するかどうか
XCODE_LOG=tonumber(edcb.GetPrivateProfile('XCODE','LOG',false,INI))~=0
--出力バッファの量(bytes)。asyncbuf.exeを用意すること。変換負荷や通信のむらを吸収する
XCODE_BUF=tonumber(edcb.GetPrivateProfile('XCODE','BUF',0,INI))
--転送開始前に変換しておく量(bytes)
XCODE_PREPARE=tonumber(edcb.GetPrivateProfile('XCODE','PREPARE',0,INI))

--このサイズ以上のときページ圧縮する(nilのとき常に非圧縮)
GZIP_THRESHOLD_BYTE=4096

--処理するPOSTリクエストボディの最大値
POST_MAX_BYTE=1024*1024

----------定数定義ここまで----------

--以下、関数名はパスカルケース、定数名はアッパースネークケースとし、変数は関数スコープに閉じ込めること

function Checkbox(b,v)
  return ' type="checkbox" value="'..(v or 1)..(b and '" checked' or '"')
end

function Radiobtn(b,v)
  return ' type="radio" value="'..(v or 1)..(b and '" checked' or '"')
end

function Selected(b)
  return b and ' selected' or ''
end

function GetTranscodeQueries(qs)
  local reload=(mg.get_var(qs,'reload') or ''):match('^'..('[0-9a-f]'):rep(16,'?')..'$')
  local loadKey=reload or (mg.get_var(qs,'load') or ''):match('^'..('[0-9a-f]'):rep(16,'?')..'$')
  local option=GetVarInt(qs,'option',1,#XCODE_OPTIONS)
  return {
    option=option,
    tslive=XCODE_OPTIONS[option or 1].tslive,
    autoCinema=XCODE_OPTIONS[option or 1].autoCinema,
    offset=GetVarInt(qs,'offset',0,100),
    audio2=GetVarInt(qs,'audio2')==1,
    cinema=GetVarInt(qs,'cinema')==1,
    --0は明示的に等速を表す
    fast=option and not XCODE_OPTIONS[option].filterFastFunc and 0 or GetVarInt(qs,'fast',0,#XCODE_FAST_RATES),
    reload=not not reload,
    loadKey=loadKey,
    caption=(GetVarInt(qs,'caption') or XCODE_CHECK_CAPTION and 1)==1,
    jikkyo=(GetVarInt(qs,'jikkyo') or XCODE_CHECK_JIKKYO and 1)==1,
  }
end

function ConstructTranscodeQueries(xq)
  return (xq.option and '&amp;option='..xq.option or '')
    ..(xq.offset and '&amp;offset='..xq.offset or '')
    ..(xq.audio2 and '&amp;audio2=1' or '')
    ..(xq.cinema and '&amp;cinema=1' or '')
    ..(xq.fast and '&amp;fast='..xq.fast or '')
    ..(xq.loadKey and '&amp;'..(xq.reload and 're' or '')..'load='..xq.loadKey or '')
end


function RecModeTextList()
  return {'全サービス','指定サービス','全サービス（デコード処理なし）','指定サービス（デコード処理なし）','視聴'}
end

function NetworkType(onid)
  return not onid and {'地デジ','BS','110CS1','110CS2','124/128CS','その他'}
    or NetworkType()[0x7880<=onid and onid<=0x7FE8 and 1 or onid==4 and 2 or onid==6 and 3 or onid==7 and 4 or onid==10 and 5 or 6]
end

function NetworkIndex(v)
  return not v and {'地デジ','ワンセグ','BS','CS','124/128度CS','その他'}
    or NetworkType(v.onid)=='地デジ' and ((v.service_type or v.serviceType)==0x01 and 1 or (v.partialReceptionFlag or v.partialFlag) and 2) or NetworkType(v.onid)=='BS' and 3 or NetworkType(v.onid):find('^110CS') and 4 or NetworkType(v.onid)=='124/128CS'and 5 or 6
end

--表示するサービスを選択する
function SelectChDataList(a)
  local r={}
  for i,v in ipairs(a) do
    --EPG取得対象サービスのみ
    if v.epgCapFlag then
      r[#r+1]=v
    end
  end
  return r
end

--サービスをソートする
function SortServiceListInplace(r)
  local bsmin={}
  for i,v in ipairs(r) do
    if NetworkType(v.onid)=='BS' and (bsmin[v.tsid] or 65536)>v.sid then
      bsmin[v.tsid]=v.sid
    end
  end
  table.sort(r,function(a,b) return
    ('%04X%04X%04X%04X'):format((NetworkType(a.onid)~='地デジ' and 65535 or a.remote_control_key_id or 0),
                                a.onid,(NetworkType(a.onid)=='BS' and bsmin[a.tsid] or a.tsid),a.sid)<
    ('%04X%04X%04X%04X'):format((NetworkType(b.onid)~='地デジ' and 65535 or b.remote_control_key_id or 0),
                                b.onid,(NetworkType(b.onid)=='BS' and bsmin[b.tsid] or b.tsid),b.sid) end)
  return r
end

--URIをタグ装飾する
function DecorateUri(s)
  local hwhost='-.0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  local hw='!#$%&()*+/:;=?@_~~'..hwhost
  local fwhost='－．０１２３４５６７８９ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ'
  local fw='！＃＄％＆（）＊＋／：；＝？＠＿～￣'..fwhost
  --sを半角置換
  local r,i={},1
  while i<=#s do
    local j=fw:find(s:sub(i,i+2),1,true)
    if i+2<=#s and j and j%3==1 then
      r[#r+1]=hw:sub((j+2)/3,(j+2)/3)
      i=i+2
    else
      r[#r+1]=s:sub(i,i)
    end
    i=i+1
  end
  r=table.concat(r)

  --置換後nにある文字がsのどこにあるか
  local spos=function(n)
    local i=1
    while i<=#s and n>1 do
      n=n-1
      local j=fw:find(s:sub(i,i+2),1,true)
      if i+2<=#s and j and j%3==1 then
        i=i+2
      end
      i=i+1
    end
    return i
  end

  local t,n,i='',1,1
  while i<=#r do
    --特定のTLDっぽい文字列があればホスト部分をさかのぼる
    local h=0
    if r:find('^%.com/',i) or r:find('^%.jp/',i) or r:find('^%.tv/',i) then
      --装飾前文字列はHTMLエスケープ済みであることを仮定しているので<>"となりうる表現も除外する
      while i-h>1 and hwhost:find(r:sub(i-h-1,i-h-1),1,true) and
            (i-h<5 or not r:find('^&[lg]t;',i-h-4)) and (i-h<7 or not r:find('^&quot;',i-h-6)) do
        h=h+1
      end
    end
    if (h>0 and (i-h==1 or r:find('^[^/]',i-h-1))) or r:find('^https?://',i) then
      local j=i
      while j<=#r and hw:find(r:sub(j,j),1,true) and
            not r:find('^&[lg]t;',j) and not r:find('^&quot;',j) do
        j=j+1
      end
      t=t..s:sub(spos(n),spos(i-h)-1)..'<a rel="noreferrer" href="'..(h>0 and 'https://' or '')
        ..r:sub(i-h,j-1):gsub('&amp;','&'):gsub('&','&amp;')..'" target="_blank">'..s:sub(spos(i-h),spos(j)-1)..'</a>'
      n=j
      i=j-1
    end
    i=i+1
  end
  t=t..s:sub(spos(n))
  return t
end

--時間の文字列を取得する
function FormatTimeAndDuration(t,dur)
  dur=dur and (t.hour*3600+t.min*60+t.sec+dur)
  return ('%d/%02d/%02d(%s) %02d:%02d'):format(t.year,t.month,t.day,({'日','月','火','水','木','金','土',})[t.wday],t.hour,t.min)
    ..(t.sec~=0 and ('<small>:%02d</small>'):format(t.sec) or '')
    ..(dur and ('～%02d:%02d'):format(math.floor(dur/3600)%24,math.floor(dur/60)%60)..(dur%60~=0 and ('<small>:%02d</small>'):format(dur%60) or '') or '')
end

--システムのタイムゾーンに影響されずに時間のテーブルを数値表現にする (timezone=0のとき概ねos.date('!*t')の逆関数)
function TimeWithZone(t,timezone)
  return os.time(t)+90000-os.time(os.date('!*t',90000))-(timezone or 0)
end

--Windowsかどうか
WIN32=not package.config:find('^/')

--OSのディレクトリ区切りとなる文字集合
DIR_SEPS=WIN32 and '\\/' or '/'

--OSの標準ディレクトリ区切り
DIR_SEP=WIN32 and '\\' or '/'

--io.popenのバイナリオープンモード
POPEN_BINARY=WIN32 and 'b' or ''

--パスを連結する
function PathAppend(path,more)
  return path:gsub('['..DIR_SEPS..']*$',DIR_SEP)..more:gsub('^['..DIR_SEPS..']+','')
end

--パスとして同一かどうか
function IsEqualPath(path1,path2)
  return (WIN32 and path1:upper()==path2:upper()) or (not WIN32 and path1==path2)
end

--ドキュメントルートへの相対パスを取得する
function PathToRoot()
  return ('../'):rep(#mg.script_name:gsub('[^'..DIR_SEPS..']*['..DIR_SEPS..']+[^'..DIR_SEPS..']*','N')-
                     #(mg.document_root..'/'):gsub('[^'..DIR_SEPS..']*['..DIR_SEPS..']+','N'))
end

--OSの絶対パスをドキュメントルートからの相対パスに変換する
function NativeToDocumentPath(path)
  local root=(mg.document_root..'/'):gsub('['..DIR_SEPS..']+','/')
  if IsEqualPath(path:gsub('['..DIR_SEPS..']+','/'):sub(1,#root),root) then
    return path:gsub('['..DIR_SEPS..']+','/'):sub(#root+1)
  end
  return nil
end

--ドキュメントルートからの相対パスをOSの絶対パスに変換する
function DocumentToNativePath(path)
  --冗長表現の可能性を潰す
  local esc=edcb.htmlEscape
  edcb.htmlEscape=0
  path=edcb.Convert('utf-8','utf-8',path):gsub('/+','/')
  edcb.htmlEscape=esc
  --禁止文字と正規化のチェック
  if not path:find('[\0-\x1f\x7f'..(WIN32 and '\\:*?"<>|' or '')..']') and not path:find('%./') and not path:find('%.$') then
    return PathAppend(mg.document_root,path:gsub('/',DIR_SEP))
  end
  return nil
end

--EDCBフォルダのパス
function EdcbModulePath()
  return edcb.GetPrivateProfile('SET','ModulePath','','Common.ini')
end

--プラグインファイル等のフォルダのパス (指定されている場合)
function EdcbLibPath()
  local dir=edcb.GetPrivateProfile('SET','ModuleLibPath','','Common.ini')
  return dir~='' and dir
end

--設定関係保存フォルダのパス
function EdcbSettingPath()
  local dir=edcb.GetPrivateProfile('SET','DataSavePath','','Common.ini')
  return dir~='' and dir or PathAppend(EdcbModulePath(),'Setting')
end

--録画保存フォルダのパスのリスト
function EdcbRecFolderPathList()
  local n=tonumber(edcb.GetPrivateProfile('SET','RecFolderNum',0,'Common.ini')) or 0
  local r={n>0 and edcb.GetPrivateProfile('SET','RecFolderPath0','','Common.ini') or ''}
  if r[1]=='' then
    --必ず返す
    r[1]=EdcbSettingPath()
  end
  for i=2,n do
    local dir=edcb.GetPrivateProfile('SET','RecFolderPath'..(i-1),'','Common.ini')
    --空要素は詰める
    if dir~='' then
      r[#r+1]=dir
    end
  end
  return r
end

--プラグインファイル名を列挙する
function EnumPlugInFileName(name)
  local esc=edcb.htmlEscape
  edcb.htmlEscape=0
  local pattern=PathAppend(EdcbLibPath() or PathAppend(EdcbModulePath(),name),name)..(WIN32 and '*.dll' or '*.so')
  edcb.htmlEscape=esc
  local r={}
  for i,v in ipairs(edcb.FindFile(pattern,0) or {}) do
    if not v.isdir then
      r[#r+1]=v.name
    end
  end
  return r
end

--現在の変換モードでHTMLエスケープする
function EdcbHtmlEscape(s)
  return edcb.Convert('utf-8','utf-8',s)
end

--単一のファイルに関する情報を探す
function EdcbFindFilePlain(path)
  local n=path:find('[^'..DIR_SEPS..']*$')
  if not path:find('[*?]',n) then
    --そのまま
    local ff=edcb.FindFile(path,1)
    return ff and ff[1]
  end
  --ワイルドカード文字を含むので、その効果を打ち消すために*を?にして候補を比較
  for i,v in ipairs(edcb.FindFile(path:sub(1,n-1)..path:sub(n):gsub('%*','?'),0) or {}) do
    if IsEqualPath(EdcbHtmlEscape(path:sub(n)),v.name) then return v end
  end
  return nil
end

--プロセス名(拡張子を除いたもの)とコマンドラインのパターン(部分一致)に一致するコマンドをすべて終了させる
function TerminateCommandlineLike(name,pattern)
  if not WIN32 then
    --拡張正規表現の記号はエスケープ
    name=name:gsub('[$()*+.?[\\%]^{|}]','\\%0')
    pattern=pattern:gsub('[$()*+.?[\\%]^{|}]','\\%0')
    edcb.os.execute('pkill -9 -xf "'..name..(pattern=='' and '( .*)?' or
      pattern:find('^ ') and '('..pattern..'| .*'..pattern..').*' or ' .*'..pattern..'.*')..'"')
  elseif pattern=='' then
    edcb.os.execute('taskkill /f /im "'..name..'.exe"')
  elseif not edcb.os.execute('wmic process where "name=\''..name..'.exe\' and commandline like \'%'..pattern:gsub('_','[_]')..'%\'" call terminate >nul') then
    --wmicがないとき
    edcb.os.execute('powershell -NoProfile -c "try{(gwmi win32_process -filter \\"name=\''..name..'.exe\' and commandline like \'%'
      ..pattern:gsub('_','[_]')..'%\'\\").terminate()}catch{}"')
  end
end

--コマンドラインのコマンド名として使うコマンドを探す
function FindToolsCommand(name)
  if not WIN32 then
    --そのまま。ただし親プロセスのシグナルマスクを継承しないようにする
    return 'env --default-signal '..name
  end
  --EDCBのToolsフォルダにあるものを優先する
  local esc=edcb.htmlEscape
  edcb.htmlEscape=0
  local path=PathAppend(EdcbModulePath(),PathAppend('Tools',name..'.exe'))
  edcb.htmlEscape=esc
  --拡張子をつけて引用符で囲む
  return '"'..(EdcbFindFilePlain(path) and path or name..'.exe')..'"'
end

--コマンドラインの引数として使うパスを引用符で囲む
--※Windowsでは引用符などパスとして不正な文字がpathに含まれていないことが前提
--※Windowsでstartコマンドなどでネストされたコマンドの引数として使うときはnestedにする
function QuoteCommandArgForPath(path,nested)
  return WIN32 and '"'..(nested and path:gsub('[&^]','^%0') or path):gsub('%%','"%%"')..'"' or "'"..path:gsub("'","'\"'\"'").."'"
end

--SendTSTCPのストリーム取得用パイプのパス
function SendTSTCPPipePath(name,index)
  if WIN32 then
    --同時利用でも名前は同じ
    return '\\\\.\\pipe\\SendTSTCP_'..name
  end
  --同時利用のためのindexがつく
  local esc=edcb.htmlEscape
  edcb.htmlEscape=0
  local path=PathAppend(EdcbModulePath(),'SendTSTCP_'..name..'_'..index..'.fifo')
  edcb.htmlEscape=esc
  return path
end

--tsmemsegのストリーム取得用パイプのパス
function TsmemsegPipePath(name,suffix)
  if WIN32 then
    return '\\\\.\\pipe\\tsmemseg_'..name..suffix
  end
  local esc=edcb.htmlEscape
  edcb.htmlEscape=0
  local path=PathAppend(EdcbModulePath(),'tsmemseg_'..name..suffix..'.fifo')
  edcb.htmlEscape=esc
  return path
end

--tsmemsegのストリーム取得用パイプを開く
function OpenTsmemsegPipe(name,suffix)
  if WIN32 then
    return edcb.io.open(TsmemsegPipePath(name,suffix),'rb')
  end
  for retry=1,9 do
    local f=edcb.io.open(TsmemsegPipePath(name,suffix),'rb')
    if not f then break end
    --FIFOは同時に読めてしまうのでプロセス間でロックが必要
    if edcb.io._flock_nb(f) then
      --タイミングによっては途中から読んでしまう可能性があるので検証が必要
      local buf=f:read(suffix=='00' and 64 or 188)
      if buf and (suffix=='00' and #buf==64 and buf:find('^'..name) or
                  suffix~='00' and #buf==188 and buf:find('^....'..name)) then
        return f
      end
    end
    f:close()
    edcb.Sleep(10*retry)
  end
  return nil
end

--ソート済みリストを二分探索してlower(upper)境界のインデックスを返す
function BinarySearchBound(a,k,comp,upper)
  local n,i=#a,1
  while n~=i-1 do
    local j=i+math.floor((n-i+1)/2)
    if upper and (comp and not comp(k,a[j]) or not comp and not k<a[j]) or
       not upper and (comp and comp(a[j],k) or not comp and a[j]<k) then i=j+1 else n=j-1 end
  end
  return i
end

--ソート済みリストを二分探索して一致する要素を返す
function BinarySearch(a,k,comp)
  local i=BinarySearchBound(a,k,comp)
  if i<=#a and (comp and not comp(k,a[i]) or not comp and not k<a[i]) then return a[i] end
  return nil
end

--奇数番目の引数(偶数番目は降順か否かの真偽値)で指定した1つ以上のフィールドでテーブルを比較する関数を返す
function CompareFields(...)
  local args={...}
  local function comp(a,b,i)
    i=i or 1
    local k=args[i]
    local desc=i<#args and args[i+1]
    return desc and b[k]<a[k] or not desc and a[k]<b[k] or i+1<#args and a[k]==b[k] and comp(a,b,i+2)
  end
  return comp
end

--符号なし整数の時計算の差を計算する
function UintCounterDiff(a,b)
  return (a+0x100000000-b)%0x100000000
end

--TSパケットヘッダを解析する
function ParseTsPacket(ts,buf,i)
  i=i or 1
  if not buf or #buf<i+187 or buf:byte(i)~=0x47 then return false end
  local b=buf:byte(i+1)
  ts.err=b>127
  ts.unitStart=b%128>63
  ts.pid=b%32*256+buf:byte(i+2)
  ts.adaptation=math.floor(buf:byte(i+3)/16)%4
  return true
end

--PCR(45000Hz)があれば取得する
function GetPcrFromTsPacket(adaptation,buf,i)
  i=i or 1
  --adaptation_field_length and PCR_flag
  return adaptation>=2 and buf:byte(i+4)>=5 and buf:byte(i+5)%32>15 and
    ((buf:byte(i+6)*256+buf:byte(i+7))*256+buf:byte(i+8))*256+buf:byte(i+9)
end

--PCRまで読む
function ReadToPcr(f,pid)
  local ts={}
  for i=1,10000 do
    local buf=f:read(188)
    if not ParseTsPacket(ts,buf) then break end
    local pcr=GetPcrFromTsPacket(ts.adaptation,buf)
    if not ts.err and pcr and (not pid or pid==ts.pid) then
      return pcr,ts.pid,i*188
    end
  end
  return nil
end

--MPEG-2映像のIフレームを取得する
function GetIFrameVideoStream(f)
  local ts={}
  local exclude={}
  local priorPid=8192
  local videoPid=nil
  local stream,pesRemain,headerRemain,seqState
  local function findPictureCodingType(buf)
    for i=1,#buf do
      local b=buf:byte(i)
      if (seqState<=1 or seqState==3) and b==0 or seqState==4 then
        seqState=seqState+1
      elseif seqState==2 and b<=1 then
        if b==1 then
          seqState=seqState+1
        end
      elseif seqState==5 then
        seqState=-1
        return math.floor(b/8)%8
      else
        seqState=0
      end
    end
    return nil
  end
  for i=1,15000 do
    local buf=f:read(188)
    if not ParseTsPacket(ts,buf) then break end
    if not ts.err and (ts.pid==videoPid or ts.unitStart and not videoPid) then
      if ts.unitStart and videoPid then
        if pesRemain==0 then
          --PESがたまった
          if seqState<0 then return table.concat(stream) end
          exclude[ts.pid]=true
        end
        videoPid=nil
      end
      local adaptationLen=ts.adaptation==1 and -1 or ts.adaptation==3 and buf:byte(5) or 183
      if adaptationLen>183 then break end
      local pos=6+adaptationLen
      --H.262のpicture_coding_typeが見つからないものは除外。複数候補ある場合はPIDが小さいほう
      if not videoPid and not exclude[ts.pid] and ts.pid<=priorPid and pos<=180 and buf:find('^\0\0\1[\xE0-\xEF]',pos) then
        --H.262/264/265 PES
        videoPid=ts.pid
        stream={}
        pesRemain=buf:byte(pos+4)*256+buf:byte(pos+5)
        headerRemain=buf:byte(pos+8)
        seqState=0
        pos=pos+9
      end
      if videoPid and pos<=188 then
        local n=math.min(189-pos,headerRemain)
        headerRemain=headerRemain-n
        pos=pos+n
        if pos<=188 then
          n=pesRemain>0 and math.min(189-pos,pesRemain) or 189-pos
          stream[#stream+1]=buf:sub(pos,pos+n-1)
          if seqState>=0 and findPictureCodingType(stream[#stream])~=1 and seqState<0 then
            --Iフレームじゃない
            priorPid=ts.pid
            videoPid=nil
          elseif pesRemain>0 then
            pesRemain=pesRemain-n
            if pesRemain==0 then
              --PESがたまった
              if seqState<0 then return table.concat(stream) end
              exclude[ts.pid]=true
              videoPid=nil
            end
          end
        end
      end
    end
  end
  return nil
end

--PCRをもとにファイルの長さを概算する
function GetDurationSec(f)
  local fsize=f:seek('end') or 0
  if fsize>1880000 and f:seek('set') then
    local pcr,pid=ReadToPcr(f)
    if pcr and f:seek('set',(math.floor(fsize/188)-10000)*188) then
      local pcr2,pid2,n=ReadToPcr(f,pid)
      if pcr2 then
        --終端まで読む
        local range=1880000
        while true do
          local dur=math.floor(UintCounterDiff(pcr2,pcr)/45000)
          range=range-n
          pcr2,pid2,n=ReadToPcr(f,pid)
          if not pcr2 or range<0 then
            return dur,fsize
          end
        end
      end
      --TSデータが存在する境目を見つける
      local predicted,range=math.floor(fsize/2/188)*188,fsize
      while range>1880000 and f:seek('set',predicted) do
        local buf=f:read(189)
        local valid=buf and #buf==189 and buf:byte(1)==0x47 and buf:byte(189)==0x47
        predicted=math.floor((predicted+(valid and range/4 or -range/4))/188)*188
        range=range/2
      end
      predicted=predicted-1880000
      if predicted>0 and f:seek('set',predicted) then
        pcr2=ReadToPcr(f,pid)
        if pcr2 then
          return math.floor(UintCounterDiff(pcr2,pcr)/45000),predicted
        end
      end
    end
  end
  return 0,fsize
end

--ファイルの先頭からsec秒だけシークする
function SeekSec(f,sec,dur,fsize)
  if dur>0 and fsize>1880000 and f:seek('set') then
    local pcr,pid=ReadToPcr(f)
    if pcr then
      --最終目標の3秒手前を目標に6ループまたは誤差が±3秒未満になるまで動画レートから概算シーク
      local pos,diff,rate=0,math.min(math.max(sec-3,0),dur)*45000,fsize/dur
      for i=1,6 do
        if math.abs(diff)<45000*3 then break end
        local approx=math.floor(math.min(math.max(pos+rate*diff/45000,0),fsize-1880000)/188)*188
        if not f:seek('set',approx) then return false end
        local pcr2=ReadToPcr(f,pid)
        if not pcr2 then return false end
        --移動分を差し引く
        local diff2=diff+(UintCounterDiff(pcr2,pcr)<0x80000000 and -UintCounterDiff(pcr2,pcr) or UintCounterDiff(pcr,pcr2))
        if math.abs(diff2)>=45000*3 and ((diff<0 and diff2>-diff/2) or (diff>0 and diff2<-diff/2)) then
          --移動しすぎているのでレートを下げてやり直し
          rate=rate/1.5
        else
          if (diff<0 and diff2*2<diff) or (diff>0 and diff2*2>diff) then
            --あまり移動していないのでレートを上げる
            rate=rate*1.5
          end
          pos=approx
          pcr=pcr2
          diff=diff2
        end
      end
      if math.abs(diff)<45000*3 then
        --最終目標まで進む
        diff=diff+45000*3
        local diff2=diff
        while diff2>22500 do
          if diff2>45000*6 then return false end
          local pcr2=ReadToPcr(f,pid)
          if not pcr2 then return false end
          diff2=diff+(UintCounterDiff(pcr2,pcr)<0x80000000 and -UintCounterDiff(pcr2,pcr) or UintCounterDiff(pcr,pcr2))
        end
      end
      return true
    end
  end
  return false
end

--ファイルの先頭のTOT時刻とネットワークIDとサービスIDを取得する
function GetTotAndServiceID(f)
  if f:seek('set') then
    local pcr,pcrPid=ReadToPcr(f)
    if pcr then
      local ts,tot,nid,sid={},nil,nil,nil
      for i=1,400000 do
        local buf=f:read(188)
        if not ParseTsPacket(ts,buf) then break end
        local adaptationLen=ts.adaptation==1 and -1 or ts.adaptation==3 and buf:byte(5) or 183
        if not ts.err and ts.unitStart and adaptationLen<183 then
          local pointer=7+adaptationLen+buf:byte(6+adaptationLen)
          local id=pointer<=188 and buf:byte(pointer)
          if ts.pid==0 and pointer+13<=188 and id==0x00 then
            --PAT
            local sectionLen=buf:byte(pointer+2)
            sid=buf:byte(pointer+8)*256+buf:byte(pointer+9)
            if sectionLen>=17 and sid==0 then
              sid=buf:byte(pointer+12)*256+buf:byte(pointer+13)
            end
            if sectionLen<13 or sid==0 then
              sid=nil
            end
          elseif ts.pid==16 and pointer+4<=188 and id==0x40 then
            --NIT
            nid=buf:byte(pointer+3)*256+buf:byte(pointer+4)
          elseif ts.pid==20 and pointer+7<=188 and (id==0x70 or id==0x73) and not tot then
            --TDT,TOT
            local pcr2=ReadToPcr(f,pcrPid)
            if not pcr2 then break end
            local mjd=buf:byte(pointer+3)*256+buf:byte(pointer+4)
            local h=buf:byte(pointer+5)
            local m=buf:byte(pointer+6)
            local s=buf:byte(pointer+7)
            tot=((mjd*24+math.floor(h/16)*10+h%16)*60+math.floor(m/16)*10+m%16)*60+math.floor(s/16)*10+s%16-
                3506749200-math.floor(UintCounterDiff(pcr2,pcr)/45000)
          end
          if tot and nid and sid then
            return tot,nid,sid
          end
        end
      end
    end
  end
  return nil
end

--ライブ実況やjkrdlogの出力のチャンクを1つだけ読み取る
function ReadJikkyoChunk(f)
  local head=f:read(80)
  if not head or #head~=80 then return nil end
  local payload=''
  local payloadSize=tonumber(head:match('L=([0-9]+)'))
  if not payloadSize then return nil end
  if payloadSize>0 then
    payload=f:read(payloadSize)
    if not payload or #payload~=payloadSize then return nil end
  end
  return head..payload
end

--リトルエンディアンの値を取得する
function GetLeNumber(buf,pos,len)
  local n=0
  for i=pos+len-1,pos,-1 do n=n*256+buf:byte(i) end
  return n
end

DOCTYPE_HTML4_STRICT='<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">\n'

--HTTP日付の文字列を取得する
function ImfFixdate(t)
  return ('%s, %02d %s %d %02d:%02d:%02d GMT'):format(({'Sun','Mon','Tue','Wed','Thu','Fri','Sat'})[t.wday],t.day,
    ({'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'})[t.month],t.year,t.hour,t.min,t.sec)
end

--レスポンスを生成する
function Response(code,ctype,charset,cl,cz,maxage)
  return 'HTTP/1.1 '..code..' '..mg.get_response_code_text(code)
    ..'\r\nDate: '..ImfFixdate(os.date('!*t'))
    ..'\r\nX-Frame-Options: SAMEORIGIN'
    ..(ctype and '\r\nX-Content-Type-Options: nosniff\r\nContent-Type: '..ctype..(charset and '; charset='..charset or '') or '')
    ..(cl and mg.request_info.request_method~='HEAD' and '\r\nContent-Length: '..cl or '')
    ..(cz and '\r\nContent-Encoding: gzip' or '')
    ..'\r\nCache-Control: private, max-age='..(maxage or 0)
    ..(mg.keep_alive(not not cl) and '\r\n' or '\r\nConnection: close\r\n')
end

--コンテンツ(レスポンスボディ)を連結するオブジェクトを生成する
--※HEADリクエストでは何も追加されない
--※threshを省略すると圧縮は行われない
function CreateContentBuilder(thresh)
  local self={ct={''},len=0,thresh_=thresh}
  function self:Append(s)
    if mg.request_info.request_method=='HEAD' then
      return
    end
    if self.thresh_ and self.len+#s>=self.thresh_ and not self.stream_ then
      self.stream_=true
      --可能ならコンテンツをgzip圧縮する(lua-zlib(zlib.dll)が必要)
      for k,v in pairs(mg.request_info.http_headers) do
        if k:lower()=='accept-encoding' and v:lower():find('gzip') then
          local status,zlib=pcall(require,'zlib')
          if status then
            self.stream_=zlib.deflate(6,31)
            self.ct={'',(self.stream_(table.concat(self.ct)))}
            self.len=#self.ct[2]
            self.gzip=true
          end
          break
        end
      end
    end
    s=self.gzip and self.stream_(s) or s
    if #s>0 then
      self.ct[#self.ct+1]=s
      self.len=self.len+#s
    end
  end
  --コンテンツの連結を完了してlenを確定させる
  function self:Finish()
    if self.gzip and self.stream_ then
      self.ct[#self.ct+1]=self.stream_()
      self.len=self.len+#self.ct[#self.ct]
    end
    self.stream_=nil
  end
  --必要ならヘッダをつけて全体を取り出す
  function self:Pop(s)
    self:Finish()
    self.ct[1]=s or ''
    s=table.concat(self.ct)
    self.ct={''}
    self.len=0
    self.gzip=nil
    return s
  end
  return self
end

--POSTメッセージボディをすべて読む
function AssertPost()
  local post, s
  if mg.request_info.request_method=='POST' then
    post=''
    repeat
      s=mg.read()
      post=post..(s or '')
      assert(#post<POST_MAX_BYTE)
    until not s
    if #post~=mg.request_info.content_length then
      post=''
    end
    AssertCsrf(post)
  end
  return post
end

--クエリパラメータを整数チェックして取得する
function GetVarInt(qs,n,ge,le,occ)
  n=tonumber(mg.get_var(qs,n,occ))
  if n and n==math.floor(n) and n>=(ge or -2147483648) and n<=(le or 2147483647) then
    return n
  end
  return nil
end

--クエリパラメータから時刻を取得する
function GetVarTime(qs,n,occ)
  local hour,min,sec=(mg.get_var(qs,n,occ) or ''):match('^(%d+):(%d+):?(%d*)')
  if hour then
    return hour*3600+min*60+(tonumber(sec) or 0)
  end
  return 0
end

--クエリパラメータから日時を取得する
function GetVarDate(qs,n,occ)
  local year,month,day=(mg.get_var(qs,n,occ) or ''):match('^(%d%d%d%d)%-(%d?%d)%-(%d?%d)$')
  if year then
    return TimeWithZone({year=year,month=month,day=day,hour=0})
  end
end

--クエリパラメータからサービスのIDを取得する
function GetVarServiceID(qs,n,occ,leextra)
  local onid,tsid,sid,x=(mg.get_var(qs,n,occ) or ''):match('^([0-9]+)%-([0-9]+)%-([0-9]+)'..(leextra and '%-([0-9]+)' or '')..'$')
  if onid then
    onid=tonumber(onid)
    tsid=tonumber(tsid)
    sid=tonumber(sid)
    x=tonumber(x)
  else
    onid,tsid,sid,x=GetVarInt(qs,'onid'), GetVarInt(qs,'tsid'), GetVarInt(qs,'sid'), (leextra and (GetVarInt(qs,'eid') or GetVarInt(qs,'startTime')) or nil)
  end
  if onid and onid==math.floor(onid) and onid>=0 and onid<=65535 and
     tsid and tsid==math.floor(tsid) and tsid>=0 and tsid<=65535 and
     sid and sid==math.floor(sid) and sid>=0 and sid<=65535 then
    if not leextra then
      return onid,tsid,sid,0
    elseif x and x==math.floor(x) and x>=0 and x<=leextra then
      return onid,tsid,sid,x
    end
  end
  --失敗
  return 0,0,0,0
end

--クエリパラメータから番組のIDを取得する
function GetVarEventID(qs,n,occ)
  return GetVarServiceID(qs,n,occ,65535)
end

--クエリパラメータから過去番組のIDを取得する
function GetVarPastEventID(qs,n,occ)
  return GetVarServiceID(qs,n,occ,4294967295)
end

--CSRFトークンを取得する
--※このトークンを含んだコンテンツを圧縮する場合はBREACH攻撃に少し気を配る
function CsrfToken(m,t)
  --メッセージに時刻をつける
  m=(m or mg.script_name:match('[^\\/]*$'):lower())..'/legacy/'..(math.floor(os.time()/3600/12)+(t or 0))
  local kip,kop=('\54'):rep(48),('\92'):rep(48)
  for k in edcb.serverRandom:sub(1,32):gmatch('..') do
    kip=string.char(bit32.bxor(tonumber(k,16),54))..kip
    kop=string.char(bit32.bxor(tonumber(k,16),92))..kop
  end
  --HMAC-MD5(hex)
  return mg.md5(kop..mg.md5(kip..m))
end

--CSRFトークンを検査する
--※サーバに変更を加える要求(POSTに限らない)を処理する前にこれを呼ぶべき
function AssertCsrf(qs)
  assert(mg.get_var(qs,'ctok')==CsrfToken() or mg.get_var(qs,'ctok')==CsrfToken(nil,-1))
end

if not WIN32 then
  INDEX_ENABLE_SUSPEND=false
  USE_LIVEJK=not not JKCNSL_PATH
end

----------ここまでLegacy WebUIから----------





local XCODE_OPTIONS_LUA=PathAppend(EdcbModulePath(),'Setting'..DIR_SEP..'XCODE_OPTIONS.lua')
if edcb.FindFile(XCODE_OPTIONS_LUA, 1) then
  dofile(XCODE_OPTIONS_LUA)
end

--EDCBのロゴフォルダにロゴがないときにTvTestのロゴを検索するかどうか
LOGO_DIR=tonumber(edcb.GetPrivateProfile('SET','TVTest_LOGO',false,INI))~=0
if LOGO_DIR then
  TVTest=EdcbModulePath():gsub('[^\\/]*$','')..'TVTest'
  --LogoData.iniとLogoフォルダの絶対パス
  LOGO_INI=edcb.GetPrivateProfile('SET','LOGO_INI',TVTest..'\\LogoData.ini',INI)
  LOGO_DIR=edcb.GetPrivateProfile('SET','LOGO_DIR',TVTest..'\\Logo',INI)
end

--予想ファイルサイズ
BITRATE={}
function getPredictionSize(v)
  local rsdef=(edcb.GetReserveData(0x7FFFFFFF) or {}).recSetting
  local size=nil
  local key
  if v.recSetting.recMode~=4 then
    for j=1,4 do
      key=('%04X%04X%04X'):format((j>3 and 65535 or v.onid),(j>2 and 65535 or v.tsid),(j>1 and 65535 or v.sid))
      BITRATE[key]=BITRATE[key] or tonumber(edcb.GetPrivateProfile('BITRATE',key,0,'Bitrate.ini')) or 0
      if BITRATE[key]>0 then
        break
      elseif j==4 then
        BITRATE[key]=19456
      end
    end
    size=BITRATE[key]/8*1000*math.max((v.recSetting.startMargin or rsdef and rsdef.startMargin or 0)+
                                  (v.recSetting.endMargin or rsdef and rsdef.endMargin or 0)+v.durationSecond,0)
  end
  return size
end

function HideServiceList()
  local st={}
  for i=0,1000 do
    local key=edcb.GetPrivateProfile('HIDE','hide'..i,false,INI)
    if key=='0' then break end
    st[key]=true
  end
  return st
end

function CustomServiceList()
  local subch=mg.get_var(mg.request_info.query_string,'subch')
  local SubChConcat=tonumber(edcb.GetPrivateProfile('GUIDE','subChConcat',true,INI))~=0
  local NOT_SUBCH={
    --サブチャンネルでない、結合させないものを指定
    ['4-16626-202']=true, --スターチャンネル3
  }

  local function SubChanel(a,b)
    return not subch and SubChConcat and not NOT_SUBCH[a.onid..'-'..a.tsid..'-'..a.sid] and (NetworkType(a.onid)=='地デジ' or NetworkType(a.onid)=='BS') and b and a.onid==b.onid and a.tsid==b.tsid
  end

  local a=edcb.GetServiceList() or {}
  local ServiceList={}
  if edcb.GetPrivateProfile('SORT','sort0',false,INI)~='0' then
    local GetServiceList={}
    local HIDE_SERVICES=HideServiceList()
    for i,v in ipairs(a) do
      GetServiceList[v.onid..'-'..v.tsid..'-'..v.sid]=v
    end
    for i=0,1000 do
      local key=edcb.GetPrivateProfile('SORT','sort'..i,false,INI)
      if key=='0' then break end
      local v=GetServiceList[key]
      if v then
        v.hide=HIDE_SERVICES[key]
        if show or not v.hide then
          v.subCh=SubChanel(v, ServiceList[#ServiceList])
          table.insert(ServiceList, v)
        end
      end
    end
  else
    local showServices={}
    for i,v in ipairs(SelectChDataList(edcb.GetChDataList())) do
      showServices[v.onid..'-'..v.tsid..'-'..v.sid]=true
    end
    for i,v in ipairs(a) do
      if showServices[v.onid..'-'..v.tsid..'-'..v.sid] and v.service_type==0x01 or v.service_type==0x02 or v.service_type==0xA5 or v.service_type==0xAD then
        v.subCh=SubChanel(v, ServiceList[#ServiceList])
        table.insert(ServiceList,v)
      end
    end
    SortServiceListInplace(ServiceList)
  end
  return ServiceList
end

--録画設定をxmlに
function XmlRecSetting(rs)
  local rsdef=(edcb.GetReserveData(0x7FFFFFFF) or {}).recSetting
  local s='<recsetting><recEnabled>'
    ..(rs.recMode~=5 and 1 or 0)..'</recEnabled><recMode>'
    ..(rs.recMode~=5 and rs.recMode or rs.noRecMode or 1)..'</recMode><priority>'
    ..rs.priority..'</priority><tuijyuuFlag>'
    ..(rs.tuijyuuFlag and 1 or 0)..'</tuijyuuFlag><serviceMode>'
    ..rs.serviceMode..'</serviceMode><pittariFlag>'
    ..(rs.pittariFlag and 1 or 0)..'</pittariFlag><batFilePath>'
    ..rs.batFilePath..'</batFilePath><recFolderList>'
  for i,v in ipairs(rs.recFolderList) do
    s=s..'<recFolderInfo><recFolder>'
      ..v.recFolder..'</recFolder><writePlugIn>'
      ..v.writePlugIn..'</writePlugIn><recNamePlugIn>'
      ..v.recNamePlugIn..'</recNamePlugIn></recFolderInfo>'
  end
  s=s..'</recFolderList><suspendMode>'
    ..rs.suspendMode..'</suspendMode><defserviceMode>'
    ..(rsdef.serviceMode or rs.suspendMode)..'</defserviceMode><rebootFlag>'
    ..((rs.suspendMode==0 and rsdef.rebootFlag or rs.suspendMode~=0 and rs.rebootFlag) and 1 or 0)..'</rebootFlag><useMargineFlag>'
    ..(rs.startMargin and 1 or 0)..'</useMargineFlag><startMargine>'
    ..(rs.startMargin or rsdef.startMargin or 0)..'</startMargine><endMargine>'
    ..(rs.endMargin or rsdef.endMargin or 0)..'</endMargine><continueRecFlag>'
    ..(rs.continueRecFlag and 1 or 0)..'</continueRecFlag><partialRecFlag>'
    ..rs.partialRecFlag..'</partialRecFlag><tunerID>'
    ..rs.tunerID..'</tunerID><partialRecFolder>'
  for i,v in ipairs(rs.partialRecFolder) do
    s=s..'<recFolderInfo><recFolder>'
      ..v.recFolder..'</recFolder><writePlugIn>'
      ..v.writePlugIn..'</writePlugIn><recNamePlugIn>'
      ..v.recNamePlugIn..'</recNamePlugIn></recFolderInfo>'
  end
  return s..'</partialRecFolder></recsetting>'
end

--録画設定を取得
function GetRecSetting(post)
  local useMargin=GetVarInt(post,'useDefMarginFlag')~=1 or nil
  local rs={
    batFilePath=mg.get_var(post, 'batFilePath') and mg.get_var(post, 'batFilePath')..(#mg.get_var(post, 'batFileTag')>0 and '*'..mg.get_var(post, 'batFileTag') or '') or rs.batFilePath,
    recFolderList={},
    partialRecFolder={},
    recMode=GetVarInt(post,'recEnabled')~=1 and 5 or GetVarInt(post,'recMode',0,4),
    noRecMode=GetVarInt(post,'recMode',0,4),
    tuijyuuFlag=GetVarInt(post,'tuijyuuFlag'),
    priority=GetVarInt(post,'priority',1,5),
    pittariFlag=GetVarInt(post,'pittariFlag'),
    suspendMode=GetVarInt(post,'suspendMode',0,4),
    rebootFlag=GetVarInt(post,'rebootFlag'),
    startMargin=useMargin and GetVarInt(post,'startMargin',-6*3600,6*3600),
    endMargin=useMargin and GetVarInt(post,'endMargin',-6*3600,6*3600),
    serviceMode=GetVarInt(post,'serviceMode')==1 and 0 or 1+16*(GetVarInt(post,'serviceMode_1',0,1) or 0)+32*(GetVarInt(post,'serviceMode_2',0,1) or 0),
    continueRecFlag=GetVarInt(post,'continueRecFlag'),
    tunerID=GetVarInt(post,'tunerID'),
    partialRecFlag=GetVarInt(post,'partialRecFlag',0,1) or 0
  }
  if mg.get_var(post, 'recFolder') then
    for i=0,10000 do
      if not mg.get_var(post, 'recFolder', i) then break end
      table.insert(rs.recFolderList, {
        recFolder=mg.get_var(post, 'recFolder', i),
        writePlugIn=mg.get_var(post, 'writePlugIn', i),
        recNamePlugIn=mg.get_var(post, 'recNamePlugIn', i)..(#mg.get_var(post, 'recNamePlugIn', i)>0 and #mg.get_var(post, 'recName', i)>0 and '?'..mg.get_var(post, 'recName', i) or '')
      } )
    end
  end
  if mg.get_var(post, 'partialrecFolder') then
    for i=0,10000 do
      if not mg.get_var(post, 'partialrecFolder', i) then break end
      table.insert(rs.partialRecFolder, {
        recFolder=mg.get_var(post, 'partialrecFolder', i),
        writePlugIn=mg.get_var(post, 'partialwritePlugIn', i),
        recNamePlugIn=mg.get_var(post, 'partialrecNamePlugIn', i)..(#mg.get_var(post, 'partialrecName', i)>0 and #mg.get_var(post, 'partialrecName', i)>0 and '?'..mg.get_var(post, 'partialrecName', i) or '')
      } )
    end
  end
  if rs.recMode and
      rs.priority and
      rs.suspendMode and
      (not useMargin or rs.startMargin and rs.endMargin) and
      rs.tunerID
  then
    return rs
  end
  return false
end

--検索条件を取得
--文字列返却値(andKeyとnotKey)の実体参照変換はedcb.htmlEscapeに従う
function GetSearchKey(post)
  local notKey=mg.get_var(post,'notKey') or ''
  local note=mg.get_var(post,'note') or ''
  if #note>0 or notKey:find('^:note:') then
    notKey=':note:'..note:gsub('\\','\\\\'):gsub(' ','\\s'):gsub('　','\\m')..(#notKey>0 and ' '..notKey or '')
  end
  local key={
    andKey=(mg.get_var(post, 'disableFlag') and '^!{999}' or '')
      ..(mg.get_var(post, 'caseFlag') and 'C!{999}' or '')
      ..EdcbHtmlEscape(mg.get_var(post, 'andKey') or ''),
    notKey=EdcbHtmlEscape(notKey:gsub('%c','')),
    regExpFlag=mg.get_var(post, 'regExpFlag')~=nil,
    titleOnlyFlag=mg.get_var(post, 'titleOnlyFlag')~=nil,
    aimaiFlag=mg.get_var(post, 'aimaiFlag')~=nil,
    notContetFlag=mg.get_var(post, 'notContetFlag')~=nil,
    notDateFlag=mg.get_var(post, 'notDateFlag')~=nil,
    freeCAFlag=GetVarInt(post, 'freeCAFlag') or 0,
    chkRecEnd=mg.get_var(post, 'chkRecEnd')~=nil,
    chkRecDay=GetVarInt(post, 'chkRecDay') or 6,
    chkRecNoService=mg.get_var(post, 'chkRecNoService')~=nil,
    chkDurationMin=GetVarInt(post, 'chkDurationMin') or 0,
    chkDurationMax=GetVarInt(post, 'chkDurationMax') or 0,
    days=GetVarInt(post, 'days') or 0,
    contentList={},
    serviceList={},
    dateList={},
  }
  if mg.get_var(post, 'contentList') then
    for i=0,10000 do
      local v=mg.get_var(post, 'contentList', i)
      if not v then break end
      table.insert(key.contentList, {content_nibble=tonumber(v)})
    end
  end
  if mg.get_var(post, 'serviceList') then
    for i=0,10000 do
      local onid,tsid,sid=GetVarServiceID(post, 'serviceList', i)
      if onid==0 then break end
      table.insert(key.serviceList, {onid=onid, tsid=tsid, sid=sid})
    end
  end
  if mg.get_var(post, 'dateList') then
    for v in (mg.get_var(post,'dateList') or ''):gmatch('[^,]+') do
      local m={string.match(v, '^(.-)%-(%d+):(%d+)%-(.-)%-(%d+):(%d+)$')}
      if #m==6 then
        local dateInfo={
          startDayOfWeek=({['日']=0,['月']=1,['火']=2,['水']=3,['木']=4,['金']=5,['土']=6})[m[1]],
          endDayOfWeek=({['日']=0,['月']=1,['火']=2,['水']=3,['木']=4,['金']=5,['土']=6})[m[4]]
        }
        if dateInfo.startDayOfWeek and dateInfo.endDayOfWeek then
          dateInfo.startHour=0+m[2]
          dateInfo.startMin=0+m[3]
          dateInfo.endHour=0+m[5]
          dateInfo.endMin=0+m[6]
          table.insert(key.dateList, dateInfo)
        end
      end
    end
  end
  return key
end

--検索条件(キーワードのみ)を取得
--文字列返却値(andKey)の実体参照変換はedcb.htmlEscapeに従う
function GetSearchKeyKeyword(query)
  local key=GetSearchKey()
  for i,v in ipairs(edcb.GetChDataList()) do
    if v.searchFlag then
      table.insert(key.serviceList, {onid=v.onid, tsid=v.tsid, sid=v.sid})
    end
  end
  key.andKey=(mg.get_var(query, 'caseFlag') and 'C!{999}' or '')
    ..EdcbHtmlEscape(mg.get_var(query, 'andKey') or '')
  key.regExpFlag=mg.get_var(query, 'regExpFlag')~=nil
  key.titleOnlyFlag=mg.get_var(query, 'titleOnlyFlag')~=nil
  key.aimaiFlag=mg.get_var(query, 'aimaiFlag')~=nil
  return key
end

--検索キーワードをフラグとキーワード自身に分解
function ParseAndKey(andKey)
  local r={}
  r.disableFlag=andKey:match('^^!{999}(.*)')
  r.caseFlag=(r.disableFlag or andKey):match('^C!{999}(.*)')
  r.andKey=r.caseFlag or r.disableFlag or andKey
  return r
end

function ParseNotKey(notKey)
  local r={}
  r.note=notKey:match('^:note:(.-　)') or notKey:match('^:note:([^ ]* ?)')
  r.notKey=notKey:sub(r.note and #r.note+7 or 1)
  r.note=(r.note or ''):gsub('　',''):gsub(' ',''):gsub('\\s',' '):gsub('\\m','　'):gsub('\\\\','\\')
  return r
end

function GetFilePath(query)
  local fpath=edcb.GetRecFilePath((GetVarInt(query,'reid') or 0))
  if not fpath then
    fpath=edcb.GetRecFileInfo((GetVarInt(query,'id') or 0))
    if fpath then
      fpath=fpath.recFilePath
    else
      local faddr=mg.get_var(query,'fname')
      if faddr then
        fpath=DocumentToNativePath(faddr)
        if not fpath then
          -- 冗長表現の可能性を潰す
          faddr=edcb.Convert('utf-8','utf-8',faddr):gsub('/+','/')
          for i,v in ipairs(GetLibraryPathList()) do
            -- ライブラリ配下にあるか＋禁止文字と正規化のチェック
            v=(v..'\\'):gsub('/+','/')
            if faddr:sub(1,#v):lower()==v:lower() and not faddr:sub(#v+1):find('[\0-\x1f\x7f'..(WIN32 and ':*?"<>|' or '')..']') and not faddr:sub(#v+1):find('%./') and not faddr:sub(#v+1):find('%.$') then
                fpath=faddr
              break
            end
          end
        end
      end
    end
  end
  return fpath
end

--ライブラリに表示するフォルダのリストを取得する
function GetLibraryPathList()
  local list={}
  local esc=edcb.htmlEscape
  edcb.htmlEscape=0
  local notSet=edcb.GetPrivateProfile('SET','LibraryPath',0,INI)=='0'
  local ini=notSet and 'Common.ini' or INI
  local n=tonumber(edcb.GetPrivateProfile('SET','RecFolderNum',0,ini))
  if n<=0 and notSet then
    --録画保存フォルダが未設定のときは設定関係保存フォルダになる
    list[1]=edcb.GetPrivateProfile('SET','DataSavePath','','Common.ini')
    if list[1]=='' then
      list[1]=PathAppend(EdcbModulePath(),'Setting')
    end
  end
  for i=0,n-1 do
    local path=edcb.GetPrivateProfile('SET','RecFolderPath'..i,'',ini)
    if path~='' then
      list[#list+1]=path
    end
  end
  edcb.htmlEscape=esc
  return list
end

-- ios判定
function Check_iOS()
  for hk,hv in pairs(mg.request_info.http_headers) do
    if hk:lower()=='user-agent' then
      for i,v in ipairs({'iphone','ipad','macintosh'}) do
        if hv:lower():match(v) then
          return true
        end
      end
      break
    end
  end
end
