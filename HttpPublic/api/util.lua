--処理するPOSTリクエストボディの最大値
POST_MAX_BYTE=1024*1024

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

--HTTP日付の文字列を取得する
function ImfFixdate(t)
  return ('%s, %02d %s %d %02d:%02d:%02d GMT'):format(({'Sun','Mon','Tue','Wed','Thu','Fri','Sat'})[t.wday],t.day,
    ({'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'})[t.month],t.year,t.hour,t.min,t.sec)
end

--レスポンスを生成する
function Response(code,ctype,charset,cl)
  return 'HTTP/1.1 '..code..' '..mg.get_response_code_text(code)
    ..'\r\nDate: '..ImfFixdate(os.date('!*t'))
    ..'\r\nX-Frame-Options: SAMEORIGIN'
    ..(ctype and '\r\nX-Content-Type-Options: nosniff\r\nContent-Type: '..ctype..(charset and '; charset='..charset or '') or '')
    ..(cl and mg.request_info.request_method~='HEAD' and '\r\nContent-Length: '..cl or '')
    ..(mg.keep_alive(not not cl) and '\r\n' or '\r\nConnection: close\r\n')
end

--現在の変換モードでHTMLエスケープする
function EdcbHtmlEscape(s)
  return edcb.Convert('utf-8','utf-8',s)
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
      local pos,diff=0,sec*45000
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
