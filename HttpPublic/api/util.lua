ini='Setting\\HttpPublic.ini'

--EDCBのロゴフォルダにロゴがないときにTvTestのロゴを検索するかどうか
LOGO_DIR=tonumber(edcb.GetPrivateProfile('SET','TVTest_LOGO',false,ini))~=0
if LOGO_DIR then
  TVTest=edcb.GetPrivateProfile('SET','ModulePath','','Common.ini'):gsub('[^\\/]*$','')..'TVTest'
  --LogoData.iniとLogoフォルダの絶対パス
  LOGO_INI=edcb.GetPrivateProfile('SET','LOGO_INI',TVTest..'\\LogoData.ini',ini)
  LOGO_DIR=edcb.GetPrivateProfile('SET','LOGO_DIR',TVTest..'\\Logo',ini)
end

--情報通知ログの表示を許可するかどうか
SHOW_NOTIFY_LOG=tonumber(edcb.GetPrivateProfile('SET','SHOW_NOTIFY_LOG',true,ini))~=0
--デバッグ出力の表示を許可するかどうか
SHOW_DEBUG_LOG=tonumber(edcb.GetPrivateProfile('SET','SHOW_DEBUG_LOG',false,ini))~=0

--メニューに「システムスタンバイ」ボタンを表示するかどうか
INDEX_ENABLE_SUSPEND=tonumber(edcb.GetPrivateProfile('SET','SUSPEND',false,ini))~=0
--メニューの「システムスタンバイ」ボタンを「システム休止」にするかどうか
INDEX_SUSPEND_USE_HIBERNATE=tonumber(edcb.GetPrivateProfile('SET','HIBERNATE',false,ini))~=0

--HLS(HTTP Live Streaming)を許可するかどうか。する場合はtsmemseg.exeを用意すること。IE非対応
ALLOW_HLS=tonumber(edcb.GetPrivateProfile('HLS','ALLOW_HLS',true,ini))~=0
--ネイティブHLS非対応環境でもhls.jsを使ってHLS再生するかどうか
ALWAYS_USE_HLS=tonumber(edcb.GetPrivateProfile('HLS','ALWAYS_USE_HLS',true,ini))~=0
--HLS再生時にトランスコーダーから受け取ったMPEG2-TSをMP4に変換するかどうか。有効時はHEVCトランスコードに対応
--※Android版Firefoxでは不具合があるため無効扱いになる
USE_MP4_HLS=tonumber(edcb.GetPrivateProfile('HLS','USE_MP4_HLS',true,ini))~=0
--視聴機能(viewボタン)でLowLatencyHLSにするかどうか。再生遅延が小さくなる。ネイティブHLS環境ではHTTP/2が要求されるためhls.js使用時のみ有用
USE_MP4_LLHLS=tonumber(edcb.GetPrivateProfile('HLS','USE_MP4_LLHLS',true,ini))~=0

--倍速再生(fastボタン)の速度
XCODE_FAST=tonumber(edcb.GetPrivateProfile('XCODE','FAST',1.25,ini))

--トランスコードオプション
--HLSのときはセグメント長約4秒、最大8MBytes(=1秒あたり16Mbits)を想定しているので、オプションもそれに合わせること
--HLSでないときはフラグメントMP4などを使ったプログレッシブダウンロード。字幕は適当な重畳手法がまだないので未対応
--name:表示名
--xcoder:トランスコーダーのToolsフォルダからの相対パス。'|'で複数候補を指定可。見つからなければ最終候補にパスが通っているとみなす
--option:$OUTPUTは必須、再生時に適宜置換される。標準入力からMPEG2-TSを受け取るようにオプションを指定する
--filter*Fast:倍速再生用、未定義でもよい
XCODE_OPTIONS={
  {
    --ffmpegの例。-b:vでおおよその最大ビットレートを決め、-qminで動きの少ないシーンのデータ量を節約する
    name='360p/h264/ffmpeg',
    xcoder='ffmpeg\\ffmpeg.exe|ffmpeg.exe',
    option='-f mpegts -analyzeduration 1M -i - -map 0:v?:0 -vcodec libx264 -flags:v +cgop -profile:v main -level 31 -b:v 1888k -qmin 23 -maxrate 4M -bufsize 4M -preset veryfast $FILTER -s 640x360 -map 0:a:$AUDIO -acodec aac -ac 2 -b:a 160k $CAPTION -max_interleave_delta 500k $OUTPUT',
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
    option='-f mpegts -analyzeduration 1M -i - -map 0:v?:0 -vcodec h264_nvenc -profile:v main -level 41 -b:v 3936k -qmin 23 -maxrate 8M -bufsize 8M -preset medium $FILTER -s 1280x720 -map 0:a:$AUDIO -acodec aac -ac 2 -b:a 160k $CAPTION -max_interleave_delta 500k $OUTPUT',
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
    option='-f mpegts -analyzeduration 1M -i - -map 0:v?:0 -vcodec h264_qsv -profile:v main -level 41 -b:v 3936k -min_qp_i 23 -min_qp_p 26 -min_qp_b 30 -maxrate 8M -bufsize 8M -preset medium $FILTER -s 1280x720 -map 0:a:$AUDIO -acodec aac -ac 2 -b:a 160k $CAPTION -max_interleave_delta 500k $OUTPUT',
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
    option='-f mpegts -analyzeduration 1M -i - -map 0:v?:0 -vcodec libvpx -b:v 1888k -quality realtime -cpu-used 1 $FILTER -s 640x360 -map 0:a:$AUDIO -acodec libvorbis -ac 2 -b:a 160k $CAPTION -max_interleave_delta 500k $OUTPUT',
    filter='-vf yadif=0:-1:1',
    filterCinema='-vf pullup -r 24000/1001',
    filterFast='-vf yadif=0:-1:1,setpts=PTS/'..XCODE_FAST..' -af atempo='..XCODE_FAST,
    filterCinemaFast='-vf pullup,setpts=PTS/'..XCODE_FAST..' -af atempo='..XCODE_FAST..' -r 24000/1001',
    captionNone='-sn',
    output={'webm','-f webm -'},
  },
  {
    --NVEncCの例。倍速再生未対応
    name='720p/h264/NVEncC',
    xcoder='NVEncC\\NVEncC64.exe|NVEncC\\NVEncC.exe|NVEncC64.exe|NVEncC.exe',
    option='--input-format mpegts --input-analyze 1 --input-probesize 4M -i - --avhw --profile main --level 4.1 --vbr 3936 --qp-min 23:26:30 --max-bitrate 8192 --vbv-bufsize 8192 --preset default $FILTER --output-res 1280x720 --audio-stream $AUDIO?:stereo --audio-codec $AUDIO?aac --audio-bitrate $AUDIO?160 --audio-disposition $AUDIO?default $CAPTION -m max_interleave_delta:500k $OUTPUT',
    audioStartAt=1,
    filter='--gop-len 120 --interlace tff --vpp-deinterlace normal',
    filterCinema='--gop-len 96 --interlace tff --vpp-afs preset=cinema,24fps=true,rff=true',
    captionNone='',
    captionHls='--sub-copy',
    output={'mp4','-f mp4 --no-mp4opt -m movflags:frag_keyframe+empty_moov -o -'},
    outputHls={'m2t','-f mpegts -o -'},
  },
  {
    --QSVEncCの例。倍速再生未対応
    name='720p/h264/QSVEncC',
    xcoder='QSVEncC\\QSVEncC64.exe|QSVEncC\\QSVEncC.exe|QSVEncC64.exe|QSVEncC.exe',
    option='--input-format mpegts --input-analyze 1 --input-probesize 4M -i - --avhw --profile main --level 4.1 --qvbr 3936 --qvbr-quality 26 --fallback-rc --max-bitrate 8192 --vbv-bufsize 8192 $FILTER --output-res 1280x720 --audio-stream $AUDIO?:stereo --audio-codec $AUDIO?aac --audio-bitrate $AUDIO?160 --audio-disposition $AUDIO?default $CAPTION -m max_interleave_delta:500k $OUTPUT',
    audioStartAt=1,
    filter='--gop-len 120 --interlace tff --vpp-deinterlace normal',
    filterCinema='--gop-len 96 --interlace tff --vpp-afs preset=cinema,24fps=true',
    captionNone='',
    captionHls='--sub-copy',
    output={'mp4','-f mp4 --no-mp4opt -m movflags:frag_keyframe+empty_moov -o -'},
    outputHls={'m2t','-f mpegts -o -'},
  },
}

--フォーム上の各オプションのデフォルト選択状態を指定する
XCODE_SELECT_OPTION=tonumber(edcb.GetPrivateProfile('XCODE','SELECT_OPTION',1,ini))
XCODE_CHECK_CINEMA=tonumber(edcb.GetPrivateProfile('XCODE','CHECK_CINEMA',false,ini))~=0
XCODE_CHECK_FAST=tonumber(edcb.GetPrivateProfile('XCODE','CHECK_FAST',false,ini))~=0
XCODE_CHECK_CAPTION=tonumber(edcb.GetPrivateProfile('XCODE','CHECK_CAPTION',false,ini))~=0

--字幕表示のオプション https://github.com/monyone/aribb24.js#options
ARIBB24_JS_OPTION=[=[
  normalFont:'"Rounded M+ 1m for ARIB","Yu Gothic Medium",sans-serif',
  drcsReplacement:true
]=]

--字幕表示にSVGRendererを使うかどうか。描画品質が上がる(ただし一部ブラウザで背景に線が入る)。IE非対応
ARIBB24_USE_SVG=tonumber(edcb.GetPrivateProfile('SET','ARIBB24_USE_SVG',false,ini))~=0

--データ放送表示機能を使うかどうか。トランスコード中に表示する場合はpsisiarc.exeを用意すること。IE非対応
USE_DATACAST=tonumber(edcb.GetPrivateProfile('SET','DATACAST',true,ini))~=0

--ライブ実況表示機能を使うかどうか
--利用には実況を扱うツール側の対応(NicoJKの場合はcommentShareMode)が必要
USE_LIVEJK=tonumber(edcb.GetPrivateProfile('SET','LIVEJK',true,ini))~=0

--実況ログ表示機能を使う場合、jkrdlog.exeの絶対パス
JKRDLOG_PATH=edcb.GetPrivateProfile('JK','JKRDLOG_PATH','',ini)
--JKRDLOG_PATH='C:\\Path\\to\\jkrdlog.exe'

--実況コメントの文字の高さ(px)
JK_COMMENT_HEIGHT=tonumber(edcb.GetPrivateProfile('JK','COMMENT_HEIGHT',32,ini))

--実況コメントの表示時間(秒)
JK_COMMENT_DURATION=tonumber(edcb.GetPrivateProfile('JK','COMMENT_DURATION',5,ini))

--chatタグ表示前の置換(JavaScript)
JK_CUSTOM_REPLACE=[=[
  // 広告などを下コメにする
  tag = tag.replace(/^<chat(?![^>]*? mail=)/, '<chat mail=""');
  tag = tag.replace(/^(<chat[^>]*? premium="3"[^>]*?>\/nicoad )(\{[^<]*?"totalAdPoint":)(\d+)/, "$1$3$2");
  tag = tag.replace(/^<chat(?=[^>]*? premium="3")([^>]*? mail=")([^>]*?>)\/nicoad (\d*)\{[^<]*?"message":("[^<]*?")[,}][^<]*/, '<chat align="right"$1shita small yellow $2$4($3pt)');
  tag = tag.replace(/^<chat(?=[^>]*? premium="3")([^>]*? mail=")([^>]*?>)\/spi /, '<chat align="right"$1shita small white2 $2');
]=]

--トランスコードするかどうか。する場合はtsreadex.exeとトランスコーダー(ffmpeg.exeなど)を用意すること
XCODE=tonumber(edcb.GetPrivateProfile('XCODE','XCODE',true,ini))~=0
--トランスコードするプロセスを1つだけに制限するかどうか(並列処理できる余裕がシステムにない場合など)
XCODE_SINGLE=tonumber(edcb.GetPrivateProfile('XCODE','SINGLE',false,ini))~=0
--ログを"log"フォルダに保存するかどうか
XCODE_LOG=tonumber(edcb.GetPrivateProfile('XCODE','LOG',false,ini))~=0
--出力バッファの量(bytes)。asyncbuf.exeを用意すること。変換負荷や通信のむらを吸収する
XCODE_BUF=tonumber(edcb.GetPrivateProfile('XCODE','BUF',0,ini))
--転送開始前に変換しておく量(bytes)
XCODE_PREPARE=tonumber(edcb.GetPrivateProfile('XCODE','PREPARE',0,ini))

--このサイズ以上のときページ圧縮する(nilのとき常に非圧縮)
GZIP_THRESHOLD_BYTE=4096

--処理するPOSTリクエストボディの最大値
POST_MAX_BYTE=1024*1024

----------定数定義ここまで----------

function GetTranscodeQueries(qs)
  return {
    option=GetVarInt(qs,'option',1,#XCODE_OPTIONS),
    offset=GetVarInt(qs,'offset',0,100),
    audio2=GetVarInt(qs,'audio2')==1,
    cinema=GetVarInt(qs,'cinema')==1,
    fast=GetVarInt(qs,'fast')==1,
    caption=GetVarInt(qs,'caption')==1,
  }
end

function ConstructTranscodeQueries(xq)
  return (xq.option and '&amp;option='..xq.option or '')
    ..(xq.offset and '&amp;offset='..xq.offset or '')
    ..(xq.audio2 and '&amp;audio2=1' or '')
    ..(xq.cinema and '&amp;cinema=1' or '')
    ..(xq.fast and '&amp;fast=1' or '')
    ..(xq.caption and '&amp;caption=1' or '')
end

--ドキュメントルートへの相対パスを取得する
function PathToRoot()
  return ('../'):rep(#mg.script_name:gsub('[^\\/]*[\\/]+[^\\/]*','N')-#(mg.document_root..'/'):gsub('[^\\/]*[\\/]+','N'))
end

--OSの絶対パスをドキュメントルートからの相対パスに変換する
function NativeToDocumentPath(path)
  local root=(mg.document_root..'/'):gsub('[\\/]+','/')
  if path:gsub('[\\/]+','/'):sub(1,#root):lower()==root:lower() then
    return path:gsub('[\\/]+','/'):sub(#root+1)
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
  if not path:find('[\0-\x1f\x7f\\:*?"<>|]') and not path:find('%./') and not path:find('%.$') then
    return mg.document_root..'\\'..path:gsub('/','\\')
  end
  return nil
end

--現在の変換モードでHTMLエスケープする
function EdcbHtmlEscape(s)
  return edcb.Convert('utf-8','utf-8',s)
end

--PCRまで読む
function ReadToPcr(f,pid)
  for i=1,10000 do
    local buf=f:read(188)
    if buf and #buf==188 and buf:byte(1)==0x47 then
      --adaptation_field_control and adaptation_field_length and PCR_flag
      if math.floor(buf:byte(4)/16)%4>=2 and buf:byte(5)>=5 and math.floor(buf:byte(6)/16)%2~=0 then
        local pcr=((buf:byte(7)*256+buf:byte(8))*256+buf:byte(9))*256+buf:byte(10)
        local pid2=buf:byte(2)%32*256+buf:byte(3)
        if not pid or pid==pid2 then
          return pcr,pid2
        end
      end
    end
  end
  return nil
end

--ファイルの長さを概算する
function GetDurationSec(f,fpath)
  --ffprobeを使う(正確になるはず)
  if fpath then
    local tools=edcb.GetPrivateProfile('SET', 'ModulePath', '', 'Common.ini')..'\\Tools\\'
    local ffprobe=edcb.GetPrivateProfile('SET','ffprobe',tools..'ffprobe.exe',ini)
    local ff=edcb.FindFile and edcb.FindFile(ffprobe, 1)
    if ff then
      local fp=edcb.io.popen('""'..ffprobe..'" -i "'..fpath..'" -v quiet -show_entries format=duration,size -of ini 2>&1"', 'rb')
      if fp then
        local a=fp:read('*a') or ''
        fp:close()
        local dur=tonumber(a:match('duration=(.-)\r\n'))
        local fsize=tonumber(a:match('size=(.-)\r\n'))
        if dur and fsize then
          return dur,fsize
        end
      end
    end
  end
  --PCRをもとに(少なめに報告するかもしれない)
  local fsize=f:seek('end') or 0
  if fsize>1880000 and f:seek('set') then
    local pcr,pid=ReadToPcr(f)
    if pcr and f:seek('set',(math.floor(fsize/188)-10000)*188) then
      local pcr2=ReadToPcr(f,pid)
      if pcr2 then
        return math.floor((pcr2+0x100000000-pcr)%0x100000000/45000),fsize
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
          return math.floor((pcr2+0x100000000-pcr)%0x100000000/45000),predicted
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
      local pos,diff=0,math.min(math.max(sec,0),dur)*45000
      --5ループまたは誤差が2秒未満になるまで動画レートから概算シーク
      for i=1,5 do
        if math.abs(diff)<90000 then break end
        pos=math.floor(math.min(math.max(pos+fsize/dur*diff/45000,0),fsize-1880000)/188)*188
        if not f:seek('set',pos) then return false end
        local pcr2=ReadToPcr(f,pid)
        if not pcr2 then return false end
        --移動分を差し引く
        diff=diff+((pcr2+0x100000000-pcr)%0x100000000<0x80000000 and -((pcr2+0x100000000-pcr)%0x100000000) or (pcr+0x100000000-pcr2)%0x100000000)
        pcr=pcr2
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
      local tot,nid,sid=nil,nil,nil
      for i=1,400000 do
        local buf=f:read(188)
        if not buf or #buf~=188 or buf:byte(1)~=0x47 then break end
        local adaptation=math.floor(buf:byte(4)/16)%4
        local adaptationLen=adaptation==1 and -1 or adaptation==3 and buf:byte(5) or 183
        --payload_unit_start_indicator
        if math.floor(buf:byte(2)/64)%2==1 and adaptationLen<183 then
          local pid=buf:byte(2)%32*256+buf:byte(3)
          local pointer=7+adaptationLen+buf:byte(6+adaptationLen)
          local id=pointer<=188 and buf:byte(pointer)
          if pid==0 and pointer+13<=188 and id==0x00 then
            --PAT
            local sectionLen=buf:byte(pointer+2)
            sid=buf:byte(pointer+8)*256+buf:byte(pointer+9)
            if sectionLen>=17 and sid==0 then
              sid=buf:byte(pointer+12)*256+buf:byte(pointer+13)
            end
            if sectionLen<13 or sid==0 then
              sid=nil
            end
          elseif pid==16 and pointer+4<=188 and id==0x40 then
            --NIT
            nid=buf:byte(pointer+3)*256+buf:byte(pointer+4)
          elseif pid==20 and pointer+7<=188 and (id==0x70 or id==0x73) and not tot then
            --TDT,TOT
            local pcr2=ReadToPcr(f,pcrPid)
            if not pcr2 then break end
            local mjd=buf:byte(pointer+3)*256+buf:byte(pointer+4)
            local h=buf:byte(pointer+5)
            local m=buf:byte(pointer+6)
            local s=buf:byte(pointer+7)
            tot=((mjd*24+math.floor(h/16)*10+h%16)*60+math.floor(m/16)*10+m%16)*60+math.floor(s/16)*10+s%16-
                3506749200-math.floor((pcr2+0x100000000-pcr)%0x100000000/45000)
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


--リトルエンディアンの値を取得する
function GetLeNumber(buf,pos,len)
  local n=0
  for i=pos+len-1,pos,-1 do n=n*256+buf:byte(i) end
  return n
end

--HTTP日付の文字列を取得する
function ImfFixdate(t)
  return ('%s, %02d %s %d %02d:%02d:%02d GMT'):format(({'Sun','Mon','Tue','Wed','Thu','Fri','Sat'})[t.wday],t.day,
    ({'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'})[t.month],t.year,t.hour,t.min,t.sec)
end

--レスポンスを生成する
function Response(code,ctype,charset,cl,maxage)
  return 'HTTP/1.1 '..code..' '..mg.get_response_code_text(code)
    ..'\r\nDate: '..ImfFixdate(os.date('!*t'))
    ..'\r\nX-Frame-Options: SAMEORIGIN'
    ..(ctype and '\r\nX-Content-Type-Options: nosniff\r\nContent-Type: '..ctype..(charset and '; charset='..charset or '') or '')
    ..(cl and mg.request_info.request_method~='HEAD' and '\r\nContent-Length: '..cl or '')
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
  assert(mg.get_var(qs,'ctok')==CsrfToken() or mg.get_var(qs,'ctok')==CsrfToken(nil,-1) or mg.get_var(qs,'ctok',1)==CsrfToken() or mg.get_var(qs,'ctok',1)==CsrfToken(nil,-1))
end

----------ここまでLegacy WebUIから----------

--録画設定をxmlに
function xmlRecSetting(rs, rsdef)
  local s='<recsetting><recMode>'
    ..rs.recMode..'</recMode><priority>'
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
    ..(rsdef and rsdef.recSetting.serviceMode or rs.suspendMode)..'</defserviceMode><rebootFlag>'
    ..((rs.suspendMode==0 and rsdef and rsdef.recSetting.rebootFlag or rs.suspendMode~=0 and rs.rebootFlag) and 1 or 0)..'</rebootFlag><useMargineFlag>'
    ..(rs.startMargin and 1 or 0)..'</useMargineFlag><startMargine>'
    ..(rs.startMargin or rsdef and rsdef.recSetting.startMargin or 0)..'</startMargine><endMargine>'
    ..(rs.endMargin or rsdef and rsdef.recSetting.endMargin or 0)..'</endMargine><continueRecFlag>'
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
function getRecSetting(rs,post)
  if rs then
    local useMargin=GetVarInt(post,'useDefMarginFlag')~=1 or nil
    rs={
      batFilePath=mg.get_var(post, 'batFilePath') and mg.get_var(post, 'batFilePath')..(#mg.get_var(post, 'batFileTag')>0 and '*'..mg.get_var(post, 'batFileTag') or '') or rs.batFilePath,
      recFolderList={},
      partialRecFolder={},
      recMode=GetVarInt(post,'recMode',0,5),
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
  end
  return false
end

--検索条件を取得
--文字列返却値(andKeyとnotKey)の実体参照変換はedcb.htmlEscapeに従う
function getSearchKey(post)
  local key={
    andKey=(mg.get_var(post, 'disableFlag') and '^!{999}' or '')
      ..(mg.get_var(post, 'caseFlag') and 'C!{999}' or '')
      ..EdcbHtmlEscape(mg.get_var(post, 'andKey') or ''),
    notKey=EdcbHtmlEscape(mg.get_var(post, 'notKey') or ''),
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
      local v=mg.get_var(post, 'serviceList', i)
      if not v then break end
      local m={string.match(v, '^(%d+)%-(%d+)%-(%d+)$')}
      if #m==3 then
        table.insert(key.serviceList, {onid=0+m[1], tsid=0+m[2], sid=0+m[3]})
      end
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
function getSearchKeyKeyword(query)
  local key=getSearchKey()
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
function parseAndKey(andKey)
  local r={}
  r.disableFlag=andKey:match('^^!{999}(.*)')
  r.caseFlag=(r.disableFlag or andKey):match('^C!{999}(.*)')
  r.andKey=r.caseFlag or r.disableFlag or andKey
  return r
end

--ライブラリに表示するフォルダのリストを取得する
function GetLibraryPathList()
  local list={}
  local esc=edcb.htmlEscape
  edcb.htmlEscape=0
  local ini='Setting\\HttpPublic.ini'
  ini=edcb.GetPrivateProfile('SET','LibraryPath',0,ini)=='0' and 'Common.ini' or ini
  local n=tonumber(edcb.GetPrivateProfile('SET','RecFolderNum',0,ini))
  if n<=0 and ini=='Common.ini' then
    --録画保存フォルダが未設定のときは設定関係保存フォルダになる
    list[1]=edcb.GetPrivateProfile('SET','DataSavePath','',ini)
    if list[1]=='' then
      list[1]=edcb.GetPrivateProfile('SET','ModulePath','',ini)..'\\Setting'
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
