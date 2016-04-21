path='Setting\\HttpPublic.ini'
option=0+edcb.GetPrivateProfile('SET','option',false,path)~=0
Roboto=0+edcb.GetPrivateProfile('SET','Roboto',false,path)~=0
css=edcb.GetPrivateProfile('SET','css',false,path)

function template(temp)
  local path = temp.path or ''
  local s=[=[
<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=2">
<title>EpgTimer</title>
<link rel="icon" href="]=]..path..[=[img/EpgTimer.ico">
<link rel="apple-touch-icon" sizes="256x256" href="]=]..path..[=[img/apple-touch-icon.png">
]=]
..(not css==0 and css or '<link rel="stylesheet" href="'..path..'css/material.min.css">')..'\n'
..(temp.dialog and '<link rel="stylesheet" href="'..path..'css/dialog-polyfill.css">\n' or '')..[=[
<link rel="stylesheet" href="]=]..path..[=[css/default.css">
<link rel="stylesheet" href="]=]..path..[=[css/user.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
]=]
..(Roboto and '<link rel="stylesheet" href="http://fonts.googleapis.com/css?family=Roboto:300,400,500,700">' or '')

-- css
..(temp.css or '')

..[=[
<script src="]=]..path..[=[js/jquery.min.js"></script>
<script src="]=]..path..[=[js/material.min.js"></script>
<script src="]=]..path..[=[js/hammer.min.js"></script>
<script src="]=]..path..[=[js/jquery.hammer.js"></script>
]=]
..(temp.dialog and '<script src="'..path..'js/dialog-polyfill.js"></script>\n' or '')
..'<script>\npath=\''..path..'\';\nroot=\''..mg.script_name:gsub('[^\\/]*$',''):gsub(mg.document_root..'/',''):gsub('[^\\/]*[\\/]','../')..'\';\n</script>\n'
..'<script src="'..path..'js/common.js"></script>\n'

-- javascript
..(temp.js or '')

..[=[
</head>
<body>
]=]

-- dialog
..(temp.dialog and '<dialog class="mdl-dialog">\n<div class="mdl-dialog__content">'
  ..(temp.dialog.content or '')
  ..'</div>\n<div class="mdl-dialog__actions">\n'
  ..(temp.dialog.button or '')
  ..'<button class="mdl-button close">キャンセル</button>\n'
  ..'</div>\n</dialog>' or '')

..[=[
<div class="mdl-layout mdl-js-layout mdl-layout--fixed-header]=]..(not temp.Scrollable and ' mdl-layout--fixed-tabs' or '')..[=[">
  <header class="mdl-layout__header">
    <div class="mdl-layout__header-row">
      <div class="search-box mdl-cell--order-2 mdl-textfield mdl-js-textfield mdl-textfield--expandable mdl-textfield--floating-label mdl-textfield--align-right">
        <label class="mdl-button mdl-js-button mdl-button--icon" for="header-andKey">
          <i class="material-icons">search</i>
        </label>
        <div class="mdl-textfield__expandable-holder">
          <form method="GET" action="search.html">
            <input class="mdl-textfield__input" type="text" name="andKey" id="header-andKey">
          </form>
        </div>
      </div>
      <div class="navigation-container mdl-cell--order-1">
        <nav class="navigation mdl-navigation">
          <a class="mdl-navigation__link" href="]=]..path..[=[epg.html">番組表</a>
          <a class="mdl-navigation__link" href="]=]..path..[=[reserve.html">予約一覧</a>
          <a class="mdl-navigation__link" href="]=]..path..[=[autoaddepg.html">EPG予約</a>
          <a class="mdl-navigation__link" href="]=]..path..[=[recinfo.html">録画結果</a>
        </nav>
      </div>
]=]
..(temp.menu and '      <button id="menu" class="mdl-button mdl-js-button mdl-button--icon mdl-cell--order-3"><i class="material-icons">more_vert</i></button>\n' or '')..[=[
      <span class="mdl-layout-title">]=]..(temp.title or '')..[=[</span>
      <div class="mdl-layout-spacer"></div>
    </div>
]=]

..(temp.subheader or '')

-- タブ
..(temp.tab and '<div class="mdl-layout__tab-bar">\n'..temp.tab..'</div>\n' or '')

..[=[
    <div id="spinner" class="mdl-shadow--3dp"><div class="mdl-spinner mdl-js-spinner"></div></div>
  </header>
  <div class="mdl-layout__drawer">
    <span class="mdl-layout-title">EpgTimer</span>
    <nav class="mdl-navigation">
]=]

-- サイドバー
..(temp.side or '')

..[=[
      <a class="mdl-navigation__link" href="]=]..path..[=[epg.html">番組表</a>
      <a class="mdl-navigation__link" href="]=]..path..[=[epgweek.html">週間番組表</a>
      <a class="mdl-navigation__link" href="]=]..path..[=[reserve.html">予約一覧</a>
      <a class="mdl-navigation__link" href="]=]..path..[=[tunerreserve.html">チューナー別</a>
      <a class="mdl-navigation__link" href="]=]..path..[=[autoaddepg.html">EPG予約</a>
      <a class="mdl-navigation__link" href="]=]..path..[=[recinfo.html">録画結果</a>
      <a class="mdl-navigation__link" href="]=]..path..[=[search.html">検索</a>
      <a class="mdl-navigation__link" href="]=]..path..[=[setting.html">設定</a>
    </nav>
  </div>
  <div class="drawer-swipe"></div>
]=]
..(temp.video and [=[
  <div id="popup" class="mdl-layout__obfuscator">
    <div class="mdl-card mdl-shadow--16dp">
      <video id="video" controls></video>
      <span class="close mdl-badge" data-badge="&#xE5CD">
    </div>
  </div>
]=] or '')

..(temp.menu and '<div class="menu">\n'..temp.menu..'</div>\n' or '')

-- メイン
..(temp.main or '')

..[=[
  </main>
  <div class="mdl-snackbar mdl-js-snackbar">
    <div class="mdl-snackbar__text"></div>
    <button type="button" class="mdl-snackbar__action"></button>
  </div>
</div>
</body>
</html>]=]
  return s
end

--EPG情報をTextに変換(EpgTimerUtil.cppから移植)
function _ConvertEpgInfoText2(onid, tsid, sid, eid)
  local s, v = '', edcb.SearchEpg(onid, tsid, sid, eid)
      s='<div class="main-content mdl-cell mdl-cell--12-col mdl-shadow--4dp">\n'
  if v then
      beforeEnd=true
      if v.durationSecond then beforeEnd=os.time(v.startTime)+v.durationSecond>os.time() end
      s=s..'<div>\n<h4 class="mdl-typography--title">'
    if v.shortInfo then
      s=s..ConvertTitle(v.shortInfo.event_name)..'\n'
    end
    s=s..'<span class="mdl-typography--subhead mdl-grid mdl-grid--no-spacing">'..(v.startTime and os.date('<span class="date">%Y/%m/%d('..({'日','月','火','水','木','金','土'})[os.date('%w', os.time(v.startTime))+1]..') %H:%M-', os.time(v.startTime))
      ..(v.durationSecond and os.date('%H:%M', os.time(v.startTime)+v.durationSecond) or '未定') or '未定')..'</span>'
    for i,w in ipairs(edcb.GetServiceList() or {}) do
      if w.onid==v.onid and w.tsid==v.tsid and w.sid==v.sid then
        s=s..'<span class="service">'..w.service_name..'</span>'
        break
      end
    end
    s=s..'</span></h4>\n'
    if v.shortInfo then
      s=s..'<p>'..v.shortInfo.text_char:gsub('\r?\n', '<br>\n'):gsub('https?://[%w/:%#%$&%?%(%)~%.=%+%-_]+', '<a href="%1" target="_blank">%1</a>')..'</p>\n'
    end

    s=s..'</div>\n'

     ..'<div><section class="mdl-layout__tab-panel is-active" id="detail">\n'	

    if v.extInfo then
      s=s..'<div class="mdl-typography--body-1">\n'..v.extInfo.text_char:gsub('\r?\n', '<br>\n'):gsub('https?://[%w/:%#%$&%?%(%)~%.=%+%-_]+', '<a href="%1" target="_blank">%1</a>')..'</div>\n'

    end
    s=s..'<ul>\n'
    if v.contentInfoList then
      s=s..'<li>ジャンル\n<ul>'
      for i,w in ipairs(v.contentInfoList) do
        s=s..'<li>'..edcb.GetGenreName(math.floor(w.content_nibble/256)*256+255)..' - '..edcb.GetGenreName(w.content_nibble)..'</li>\n'
      end
    s=s..'</ul></li>\n'
    end
    if v.componentInfo then
      s=s..'<li>映像\n<ul><li>'..edcb.GetComponentTypeName(v.componentInfo.stream_content*256+v.componentInfo.component_type)..' '..v.componentInfo.text_char..'</li></ul></li>\n'
    end
    if v.audioInfoList then
      s=s..'<li>音声\n<ul>'
      for i,w in ipairs(v.audioInfoList) do
        s=s..'<li>'..edcb.GetComponentTypeName(w.stream_content*256+w.component_type)..' '..w.text_char..'</li>\n<li>サンプリングレート : '
          ..(({[1]='16',[2]='22.05',[3]='24',[5]='32',[6]='44.1',[7]='48'})[w.sampling_rate] or '?')..'kHz</li>\n'
      end
    s=s..'</ul></li>\n'
    end
    s=s..'<li>その他\n<ul>'
      ..((v.onid<0x7880 or 0x7FE8<v.onid) and (v.freeCAFlag and '<li>有料放送</li>\n' or '<li>無料放送</li>\n') or '')
      ..string.format('<li>OriginalNetworkID:%d(0x%04X)</li>\n', v.onid, v.onid)
      ..string.format('<li>TransportStreamID:%d(0x%04X)</li>\n', v.tsid, v.tsid)
      ..string.format('<li>ServiceID:%d(0x%04X)</li>\n', v.sid, v.sid)
      ..string.format('<li>EventID:%d(0x%04X)</li>\n', v.eid, v.eid)
    s=s..'</ul></li>\n</ul>\n'
      ..'</section>\n'
  elseif r then
    s=s..'<div>\n<h4 class="mdl-typography--title">'..ConvertTitle(r.title)
      ..'<span class="mdl-typography--subhead mdl-grid mdl-grid--no-spacing">'..os.date('<span class="date">%Y/%m/%d('..({'日','月','火','水','木','金','土'})[os.date('%w', os.time(r.startTime))+1]..') %H:%M-', os.time(r.startTime))
      ..os.date('%H:%M', os.time(r.startTime)+r.durationSecond)..'</span>\n'
      ..'<span class="service">'..r.stationName..'</span>\n</span></h4>\n</div>\n'
      ..'<div><section class="mdl-layout__tab-panel is-active" id="detail">'
      ..'<div>EPGが見つかりません</div>'
      ..'</section>\n'
  end
  return s
end

--録画設定フォームのテンプレート
function RecSettingTemplate(rs)
  local s='<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet mdl-cell--middle">録画モード</div>\n'
    ..'<div class="pulldown mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop mdl-grid mdl-grid--no-spacing"><select name="recMode">\n'
    ..'<option value="0"'..(rs.recMode==0 and ' selected' or '')..'>全サービス\n'
    ..'<option value="1"'..(rs.recMode==1 and ' selected' or '')..'>指定サービスのみ\n'
    ..'<option value="2"'..(rs.recMode==2 and ' selected' or '')..'>全サービス（デコード処理なし）\n'
    ..'<option value="3"'..(rs.recMode==3 and ' selected' or '')..'>指定サービスのみ（デコード処理なし）\n'
    ..'<option value="4"'..(rs.recMode==4 and ' selected' or '')..'>視聴\n'
    ..'<option value="5"'..(rs.recMode==5 and ' selected' or '')..'>無効\n</select></div></div>\n'

    ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet mdl-cell--middle">追従</div>\n'
    ..'<div class="mdl-layout-spacer mdl-cell--hide-desktop mdl-cell--hide-tablet"></div>\n'
    ..'<div><label for="tuijyuuFlag" class="mdl-switch mdl-js-switch"><input id="tuijyuuFlag" type="checkbox" class="mdl-switch__input" name="tuijyuuFlag" value="1"'..(rs.tuijyuuFlag and ' checked' or '')..'><span class="mdl-switch__label"></span></label></div></div>\n'

    ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet mdl-cell--middle">優先度</div>\n'
    ..'<div class="mdl-layout-spacer mdl-cell--hide-desktop mdl-cell--hide-tablet"></div>\n'
    ..'<div class="pulldown mdl-cell mdl-cell--1-col mdl-grid mdl-grid--no-spacing"><select name="priority">\n'
    ..'<option value="1"'..(rs.priority==1 and ' selected' or '')..'>1\n'
    ..'<option value="2"'..(rs.priority==2 and ' selected' or '')..'>2\n'
    ..'<option value="3"'..(rs.priority==3 and ' selected' or '')..'>3\n'
    ..'<option value="4"'..(rs.priority==4 and ' selected' or '')..'>4\n'
    ..'<option value="5"'..(rs.priority==5 and ' selected' or '')..'>5\n</select></div></div>\n'
    
    ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet mdl-cell--middle">ぴったり（？）録画</div>\n'
    ..'<div class="mdl-layout-spacer mdl-cell--hide-desktop mdl-cell--hide-tablet"></div>\n'
    ..'<div><label for="pittariFlag" class="mdl-switch mdl-js-switch"><input id="pittariFlag" class="mdl-switch__input" type="checkbox" name="pittariFlag" value="1"'..(rs.pittariFlag and ' checked' or '')..'><span class="mdl-switch__label"></span></label></div></div>\n'

    ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet">録画後動作</div>\n'
    ..'<div class="mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop mdl-grid mdl-grid--no-spacing"><div class="pulldown mdl-cell mdl-cell--12-col"><select name="suspendMode">\n'
    ..'<option value="0"'..(rs.suspendMode==0 and ' selected' or '')..'>デフォルト設定を使用\n'
    ..'<option value="1"'..(rs.suspendMode==1 and ' selected' or '')..'>スタンバイ\n'
    ..'<option value="2"'..(rs.suspendMode==2 and ' selected' or '')..'>休止\n'
    ..'<option value="3"'..(rs.suspendMode==3 and ' selected' or '')..'>シャットダウン\n'
    ..'<option value="4"'..(rs.suspendMode==4 and ' selected' or '')..'>何もしない\n</select></div>\n'
    ..'<div><label for="reboot" class="mdl-checkbox mdl-js-checkbox"><input id="reboot" class="mdl-checkbox__input" type="checkbox" name="rebootFlag" value="1"'..(rs.rebootFlag and ' checked' or '')..'><span class="mdl-checkbox__label">復帰後再起動する</span></label></div></div></div>\n'

    ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet">録画マージン</div>\n'
    ..'<div class="mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop mdl-grid mdl-grid--no-spacing">\n<div><label for="usedef" class="mdl-checkbox mdl-js-checkbox"><input id="usedef" class="mdl-checkbox__input" type="checkbox" name="useDefMarginFlag" value="1"'..(rs.startMargin and '' or ' checked')..'><span class="mdl-checkbox__label">デフォルト設定で使用</span></label></div>\n'
    ..'<div class="number recmargin mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing'..(rs.startMargin and '' or ' is-disabled')..'">\n'
    ..'<div class="textfield-container mdl-cell--4-col-tablet mdl-cell--4-col-desktop">\n<div class="text-right mdl-textfield mdl-js-textfield mdl-textfield--floating-label"><input class="mdl-textfield__input" type="number" name="startMargin" value="'..(rs.startMargin or 0)..'"'..(rs.startMargin and '' or ' disabled')..' id="startMargin"><label class="mdl-textfield__label" for="startMargin">開始</label><span class="mdl-textfield__error">Input is not a number!</span></div><span>秒前</span></div>\n'
    ..'<div class="mdl-layout-spacer mdl-cell--hide-desktop mdl-cell--hide-tablet"></div>\n'
    ..'<div class="textfield-container mdl-cell--4-col-tablet mdl-cell--4-col-desktop">\n<div class="text-right mdl-textfield mdl-js-textfield mdl-textfield--floating-label"><input class="mdl-textfield__input" type="number" name="endMargin" value="'..(rs.endMargin or 0)..'"'..(rs.startMargin and '' or ' disabled')..' id="endMargin"><label class="mdl-textfield__label" for="endMargin">終了</label><span class="mdl-textfield__error">Input is not a number!</span></div><span>秒後</span></div>\n'
    ..'<div class="mdl-layout-spacer mdl-cell--hide-desktop mdl-cell--hide-tablet"></div>\n'
    ..'</div></div></div>\n'

    ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet">指定サービス対象データ</div>\n'
    ..'<div class="mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop mdl-grid mdl-grid--no-spacing">\n<div><label for="smode" class="mdl-checkbox mdl-js-checkbox"><input id="smode" class="mdl-checkbox__input" type="checkbox" name="serviceMode" value="0"'..(rs.serviceMode%2==0 and ' checked' or '')..'><span class="mdl-checkbox__label">デフォルト設定で使用</span></label></div>\n'
    ..'<div class="smode mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n'
    ..'<div><label for="mode1" class="mdl-checkbox mdl-js-checkbox"><input id="mode1" class="mdl-checkbox__input" type="checkbox" name="serviceMode_1" value="0"'..(rs.serviceMode%2~=0 and math.floor(rs.serviceMode/16)%2~=0 and ' checked' or '')..(rs.serviceMode%2==0 and ' disabled' or '')..'><span class="mdl-checkbox__label">字幕データを含める</span></label></div>\n<div class="mdl-layout-spacer"></div>\n'
    ..'<div><label for="mode2" class="mdl-checkbox mdl-js-checkbox"><input id="mode2" class="mdl-checkbox__input" type="checkbox" name="serviceMode_2" value="0"'..(rs.serviceMode%2~=0 and math.floor(rs.serviceMode/32)%2~=0 and ' checked' or '')..(rs.serviceMode%2==0 and ' disabled' or '')..'><span class="mdl-checkbox__label">データカルーセルを含める</span></label></div>\n<div class="mdl-layout-spacer"></div>\n'
    ..'</div></div></div>\n'

    ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet mdl-cell--middle">連続録画動作</div>\n'
    ..'<div class="mdl-cell--middle"><label for="continue" class="mdl-checkbox mdl-js-checkbox"><input id="continue" class="mdl-checkbox__input" type="checkbox" name="continueRecFlag" value="1"'..(rs.continueRecFlag and ' checked' or '')..'><span class="mdl-checkbox__label">後ろの予約を同一ファイルで出力する</span></label></div></div>\n'

    ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet mdl-cell--middle">使用チューナー強制指定</div>\n'
    ..'<div class="pulldown mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop mdl-grid mdl-grid--no-spacing"><select name="tunerID">\n<option value="0"'..(rs.tunerID==0 and ' selected' or '')..'>自動\n'
  local a=edcb.GetTunerReserveAll()
  for i=1,#a-1 do
    s=s..'<option value="'..a[i].tunerID..'"'..(a[i].tunerID==rs.tunerID and ' selected' or '')..string.format('>ID:%08X(', a[i].tunerID)..a[i].tunerName..')\n'
  end
  s=s..'</select></div></div>\n'
  
    ..'<div id="preset" class="preset mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n'
    ..'<div>※プリセットによる変更のみ</div>\n'
    ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet">録画後実行bat</div>\n'
    ..'<div class="mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop">'..(rs.batFilePath=='' and '－' or rs.batFilePath )..'</div></div>\n'

  local b=''
  for i,v in ipairs(rs.recFolderList) do
    recName,recName2,recName3=string.match(v.recNamePlugIn, '^(.+%.dll)(%?(.*))??')
    b=b..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet">フォルダ</div><div class="mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop">'..v.recFolder..'</div></div>\n'
      ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet">出力PlugIn</div><div class="mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop">'..v.writePlugIn..'</div></div>\n'
      ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet">ファイル名PlugIn</div><div class="mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop">'..(option and recName or v.recNamePlugIn=='' and '－' or v.recNamePlugIn)..'</div></div>\n'
      ..(option and v.recNamePlugIn~='' and '<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet mdl-cell--middle">オプション</div>\n'
                                          ..'<div class="mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop mdl-textfield mdl-js-textfield"><input class="mdl-textfield__input" type="text" name="recName" value="'..(recName3 or '')..'" id="recName'..i..'"><label class="mdl-textfield__label" for="recName'..i..'">ファイル名オプション</label></div></div>\n' or '')
      ..'<input class="recFolderList" type=hidden name="recFolder" value="'..v.recFolder..'"><input class="recFolderList" type=hidden name="writePlugIn" value="'..v.writePlugIn..'"><input class="recFolderList" type=hidden name="recNamePlugIn" value="'..(option and recName or v.recNamePlugIn)..'">'
  end
  s=s..(#b>0 and b or '<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet">フォルダ</div><div class="mdl-cell mdl-cell--6-col">－</div></div>\n'
                    ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet">出力PlugIn</div><div class="mdl-cell mdl-cell--6-col">－</div></div>\n'
                    ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet">ファイル名PlugIn</div><div class="mdl-cell mdl-cell--6-col">－</div></div>')
    ..'</div>'
    ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing"><div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet mdl-cell--middle">部分受信サービス</div>\n'
    ..'<div class="mdl-cell--middle"><label for="partial" class="mdl-checkbox mdl-js-checkbox"><input id="partial" class="mdl-checkbox__input" type="checkbox" name="partialRecFlag" value="1"'..(rs.partialRecFlag~=0 and ' checked' or '')..'><span class="mdl-checkbox__label">別ファイルに同時出力する</span></label></div></div>\n'

  b=''
  for i,v in ipairs(rs.partialRecFolder) do
    recName,recName2,recName3=string.match(v.recNamePlugIn, '^(.+%.dll)(%?(.*))??')
    b=b..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet">フォルダ</div><div class="mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop">'..v.recFolder..'</div></div>\n'
      ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet">出力PlugIn</div><div class="mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop">'..v.writePlugIn..'</div></div>\n'
      ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet">ファイル名PlugIn</div><div class="mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop">'..(option and recName or v.recNamePlugIn=='' and '－' or v.recNamePlugIn)..'</div></div>\n'
      ..(option and v.recNamePlugIn~='' and '<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet mdl-cell--middle">オプション</div>\n'
                                          ..'<div class="mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop mdl-textfield mdl-js-textfield"><input class="mdl-textfield__input" type="text" name="partialrecName" value="'..(recName3 or '')..'" id="partialrecName'..i..'"><label class="mdl-textfield__label" for="partialrecName'..i..'">ファイル名オプション</label></div></div>\n' or '')
      ..'<input class="recFolderList" type=hidden name="partialrecFolder" value="'..v.recFolder..'"><input class="recFolderList" type=hidden name="partialwritePlugIn" value="'..v.writePlugIn..'"><input class="recFolderList" type=hidden name="partialrecNamePlugIn" value="'..(option and recName or v.recNamePlugIn)..'">'
  end
  s=s..'<div id="partialpreset" class="preset partial mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing"'..(rs.partialRecFlag==0 and ' style="display: none;"' or '')..'>\n'
    ..'<div>※プリセットによる変更のみ</div>\n'
    ..(#b>0 and b or '<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet">フォルダ</div><div class="mdl-cell mdl-cell--6-col">－</div></div>\n'
      ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet">出力PlugIn</div><div class="mdl-cell mdl-cell--6-col">－</div></div>\n'
      ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet">ファイル名PlugIn</div><div class="mdl-cell mdl-cell--6-col">－</div></div>')..'</div>\n'
  return s
end

--検索フォームのテンプレート
function SerchTemplate(si)
  local s='<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet mdl-cell--middle">検索キーワード</div>\n'
    ..'<div class="mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop mdl-textfield mdl-js-textfield"><input class="andKey mdl-textfield__input" type="text" name="andKey" value="'..(si.disableFlag and si.disableFlag or si.andKey)..'" size="25" id="andKey"><label class="mdl-textfield__label" for="andKey"></label></div></div>\n'

    ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet">NOTキーワード</div>\n'
    ..'<div class="mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop mdl-grid mdl-grid--no-spacing"><div class="mdl-cell--12-col mdl-textfield mdl-js-textfield"><input class="mdl-textfield__input" type="text" name="notKey" value="'..si.notKey..'" size="25" id="notKey"><label class="mdl-textfield__label" for="notKey"></label></div>\n'
    ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n'
    ..'<div><label for="reg" class="mdl-checkbox mdl-js-checkbox"><input id="reg" class="mdl-checkbox__input" type="checkbox" name="regExpFlag" value="1"'..(si.regExpFlag and ' checked="checked"' or '')..'><span class="mdl-checkbox__label">正規表現</span></label></div><div class="mdl-layout-spacer"></div>\n'
    ..'<div><label for="aimai" class="mdl-checkbox mdl-js-checkbox"><input id="aimai" class="mdl-checkbox__input" type="checkbox" name="aimaiFlag" value="1"'..(si.aimaiFlag and ' checked="checked"' or '')..'><span class="mdl-checkbox__label">あいまい検索</span></label></div><div class="mdl-layout-spacer"></div>\n'
    ..'<div><label for="titleOnly" class="mdl-checkbox mdl-js-checkbox"><input id="titleOnly" class="mdl-checkbox__input" type="checkbox" name="titleOnlyFlag" value="1"'..(si.titleOnlyFlag and ' checked="checked"' or '')..'><span class="mdl-checkbox__label">番組名のみ</span></label></div><div class="mdl-layout-spacer mdl-cell--hide-phone"></div>\n'
    ..'</div></div></div>\n'

    ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet">'..(si.search and '対象ジャンル' or 'ジャンル絞り込み')..'</div>\n'
    ..'<div class="mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop"><div class="has-button'..(si.search and ' advanced' or '')..'"><div class="pulldown mdl-layout-spacer"><select id="content">\n'
    ..'<option value="all">すべて表示\n'
  for i=0,15 do
    nibble1=edcb.GetGenreName(i*256+255)
    if nibble1~='' then
      s=s..'<option value=".g'..(i*256+255)..'">'..nibble1..'\n'
    end
  end
  s=s..'</select></div>\n'
   ..'<div><button class="g_celar'..(si.search and ' advanced ' or '')..' mdl-button mdl-js-button mdl-button--raised mdl-button--colored" type="button">クリア</button></div></div>\n'
   ..'<div class="has-button"><div class="multiple mdl-layout-spacer"><select id="contentList" name="contentList" multiple size="5">\n'
  for i=0,15 do
    nibble1=edcb.GetGenreName(i*256+255)
    if nibble1~='' then
      s=s..'<option class="g'..(i*256+255)..'" value="'..(i*256+255)..'"'
      for j,v in ipairs(si.contentList) do
        if v.content_nibble==i*256+255 then
          s=s..' selected'
          break
        end
      end
      s=s..'>'..nibble1..'\n'
      for j=0,15 do
        nibble2=edcb.GetGenreName(i*256+j)
        if nibble2~='' then
          s=s..'<option class="g'..(i*256+255)..' subGenre" value="'..(i*256+j)..'"'
          for k,v in ipairs(si.contentList) do
            if v.content_nibble==i*256+j then
              s=s..' selected'
              break
            end
          end
          s=s..'>　'..nibble2..'\n'
        end
      end
    end
  end
  s=s..'</select></div>\n'
    ..(si.search and '<div><button class="g_celar mdl-button mdl-js-button mdl-button--raised mdl-button--colored" type="button">クリア</button></div>' or '')..'</div>\n'
    ..'<div class="mdl-grid mdl-grid--no-spacing"><div><label for="notcontet" class="mdl-checkbox mdl-js-checkbox"><input id="notcontet" class="mdl-checkbox__input" type="checkbox" name="notContetFlag" value="1"'..(si.notContetFlag and ' checked' or '')..'><span class="mdl-checkbox__label">NOT扱い</span></label></div><div class="mdl-layout-spacer"></div>\n'
    ..'<div><label for="subGenre" class="mdl-checkbox mdl-js-checkbox"><input id="subGenre" class="mdl-checkbox__input" type="checkbox"'..((subGenreoption=='ALL' or (subGenreoption=='EPG'and not si.search)) and ' checked' or '')..'><span class="mdl-checkbox__label">サブジャンル表示</span></label></div><div class="mdl-layout-spacer"></div>\n'
    ..'</div></div>\n'
    ..'<input type="hidden" name="serviceList"></div>\n'

--[=[
  if si.search then
    s=s..'<div class="network mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet mdl-cell--middle">対象ネットワーク</div>\n'
      ..'<div class="mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop mdl-grid mdl-grid--no-spacing">\n'
      ..'<div><label class="mdl-checkbox mdl-js-checkbox" for="DTV"><input id="DTV" class="network mdl-checkbox__input" type="checkbox" name="network" value="1"'..(bit32.band(key.network,1)==1 and ' checked' or '')..'><span class="mdl-checkbox__label">地上波</span></label></div><div class="mdl-layout-spacer"></div>\n'
      ..'<div><label class="mdl-checkbox mdl-js-checkbox" for="BS"><input id="BS" class="network mdl-checkbox__input" type="checkbox" name="network" value="2"'..(bit32.band(key.network,2)==2 and ' checked' or '')..'><span class="mdl-checkbox__label">BS</span></label></div><div class="mdl-layout-spacer"></div>\n'
      ..'<div><label class="mdl-checkbox mdl-js-checkbox" for="CS"><input id="CS" class="network mdl-checkbox__input" type="checkbox" name="network" value="4"'..(bit32.band(key.network,4)==4 and ' checked' or '')..'><span class="mdl-checkbox__label">CS</span></label></div><div class="mdl-layout-spacer"></div>\n'
      ..'<div><label class="mdl-checkbox mdl-js-checkbox" for="other"><input id="other" class="network mdl-checkbox__input" type="checkbox" name="network" value="8"'..(bit32.band(key.network,8)==8 and ' checked' or '')..'><span class="mdl-checkbox__label">その他</span></label></div><div class="mdl-layout-spacer"></div>\n'
      ..'<input type="hidden" name="network" value="0">\n'
      ..'</div></div>\n'
  end
--]=]

  s=s..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet">'..(si.search and '対象サービス' or 'サービス絞り込み')..'</div>\n'
    ..'<div class="mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop">\n'
    ..'<div class="has-button"><div class="multiple mdl-layout-spacer"><select id="service" name="serviceList" multiple size="5">\n'

  a=edcb.GetChDataList()
  st={}
  table.sort(a, function(a,b) return a.sid<b.sid end)
  for i,v in ipairs(a or {}) do
    if 0x7880<=v.onid and v.onid<=0x7FE8 then
      table.insert(st, v)
    end
  end
  for i,v in ipairs(a or {}) do
    if (v.onid==4) then
      table.insert(st, v)
    end
  end
  for i,v in ipairs(a or {}) do
    if (v.onid~=4 and v.onid<0x7880 or 0x7FE8<v.onid) then
      table.insert(st, v)
    end
  end

  for i,v in ipairs(st) do
      s=s..'<option class="'..(
        v.onid==4 and 'BS'..(v.serviceType==0x01 and '' or ' data hide') or
        (v.onid==6 or v.onid==7) and 'CS'..(v.serviceType==0x01 and '' or ' data hide') or
        v.onid==10 and 'HD'..(v.serviceType==0x01 and ' image' or ' hide data') or
        (v.onid==1 or v.onid==3) and 'SD'..(v.serviceType==0x01 and '' or ' data hide') or
        (0x7880<=v.onid and v.onid<=0x7FE8) and (v.partialFlag and 'SEG hide' or 'DTV'..(v.serviceType==0x01 and '' or ' data hide')) or 'S-other')
      ..'" value="'..v.onid..'-'..v.tsid..'-'..v.sid..'"'
      for j,w in ipairs(si.serviceList) do
        if w.onid==v.onid and w.tsid==v.tsid and w.sid==v.sid then
          s=s..' selected'
          break
        end
      end
      s=s..'>'..v.serviceName..'\n'
  end

  s=s..'</select></div>\n'
    ..'<div><button class="all_select mdl-button mdl-js-button mdl-button--raised mdl-button--colored" type="button">全選択</button></div>'
    ..'</div>\n'

    ..'<div class="mdl-grid mdl-grid--no-spacing">\n'
    ..'<div class="mdl-cell--4-col-phone"><label for="image" class="mdl-checkbox mdl-js-checkbox"><input id="image" class="mdl-checkbox__input" type="checkbox" checked><span class="mdl-checkbox__label">映像のみ</span></label></div><div class="mdl-layout-spacer"></div>\n'
    ..'<div><label class="mdl-checkbox mdl-js-checkbox" for="EXT_DTV"><input id="EXT_DTV" class="extraction mdl-checkbox__input" type="checkbox" value=".DTV" checked><span class="mdl-checkbox__label">地上波</span></label></div><div class="mdl-layout-spacer"></div>\n'
    ..'<div><label class="mdl-checkbox mdl-js-checkbox" for="EXT_SEG"><input id="EXT_SEG" class="extraction mdl-checkbox__input" type="checkbox" value=".SEG"><span class="mdl-checkbox__label">ワンセグ</span></label></div><div class="mdl-layout-spacer"></div>\n'
    ..'<div><label class="mdl-checkbox mdl-js-checkbox" for="EXT_BS"><input id="EXT_BS" class="extraction mdl-checkbox__input" type="checkbox" value=".BS" checked><span class="mdl-checkbox__label">BS</span></label></div><div class="mdl-layout-spacer"></div>\n'
    ..'<div><label class="mdl-checkbox mdl-js-checkbox" for="EXT_CS"><input id="EXT_CS" class="extraction mdl-checkbox__input" type="checkbox" value=".CS" checked><span class="mdl-checkbox__label">CS</span></label></div><div class="mdl-layout-spacer mdl-cell--hide-phone"></div>\n'
--    ..'<div><label class="mdl-checkbox mdl-js-checkbox" for="EXT_HD"><input id="EXT_HD" class="extraction mdl-checkbox__input" type="checkbox" value=".HD" checked><span class="mdl-checkbox__label">スカパー!プレミアム</span></label></div><div class="mdl-layout-spacer"></div>\n'
--    ..'<div><label class="mdl-checkbox mdl-js-checkbox" for="EXT_other"><input id="EXT_other" class="extraction mdl-checkbox__input" type="checkbox" value=".S-other" checked><span class="mdl-checkbox__label">その他</span></label></div><div class="mdl-layout-spacer"></div>\n'
    ..'</div>\n'
    ..'</div></div>\n'

    ..'<div class="'..(si.search and 'advanced ' or '')..'mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet">時間絞り込み</div>\n'
    ..'<div class="mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop mdl-grid mdl-grid--no-spacing"><div id="dateList" class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n'
    ..'<div id="dateList_main"><div class="multiple"><select id="dateList_select" multiple size="6">\n'
  for i,v in ipairs(si.dateList) do
    value=({'日','月','火','水','木','金','土',})[v.startDayOfWeek%7+1]..'-'..v.startHour..':'..v.startMin..'-'
      ..({'日','月','火','水','木','金','土',})[v.endDayOfWeek%7+1]..'-'..v.endHour..':'..v.endMin

    list=({'日','月','火','水','木','金','土',})[v.startDayOfWeek%7+1]..' '..(v.startHour<10 and 0 or '')..v.startHour..':'..(v.startMin<10 and 0 or '')..v.startMin..' ～ '
      ..({'日','月','火','水','木','金','土',})[v.endDayOfWeek%7+1]..' '..(v.endHour<10 and 0 or '')..v.endHour..':'..(v.endMin<10 and 0 or '')..v.endMin

    s=s..'<option value="'..value..'">'..list..'\n'
    dateListValue=(dateListValue and dateListValue..',' or '' )..value
    dateList_SP=(dateList_SP and dateList_SP or '')..'<li class="mdl-list__item" data-count="'..(i-1)..'"><span class="mdl-list__item-primary-content">'..list..'</span></li>\n'

  end
  s=s..'</select></div>\n'
    ..'<div class="touch"><ul id="dateList_touch" class="mdl-list">\n'..(dateList_SP and dateList_SP or '')..'</ul></div>\n'
    ..''
    ..'<div><button id="add_dateList" class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" type="button">追加</button>'
    ..'<button id="del_dateList" class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" type="button">削除</button></div>\n'

    ..'<button id="edit_dateList" class="mdl-button mdl-js-button mdl-button--icon" type="button"><i class="material-icons">expand_more</i></button>\n'

    ..'</div>\n<div id="dateList_edit">'
    ..'<div><label class="mdl-radio mdl-js-radio" for="dayList"><input id="dayList" class="mdl-radio__button" name="dayList" type="radio" checked><span class="mdl-radio__label">\n'
    ..'<span><span class="pulldown">\n'
    ..'<select id="startDayOfWeek"><option value="日" selected>日<option value="月">月<option value="火">火<option value="水">水<option value="木">木<option value="金">金<option value="土">土</select>\n'
    ..'</span><span class="tilde">～</span><span class="pulldown">\n'
    ..'<select id="endDayOfWeek"><option value="日">日<option value="月">月<option value="火">火<option value="水">水<option value="木">木<option value="金">金<option value="土" selected>土</select>\n'
    ..'</span>\n'
    ..'</span></span></label></div>\n'

    ..'<div><label class="mdl-radio mdl-js-radio" for="DayOfWeek"><input id="DayOfWeek" class="mdl-radio__button" name="dayList" type="radio"><span class="mdl-radio__label">\n'
    ..'<label class="mdl-checkbox mdl-js-checkbox" for="sun"><input id="sun" class="DayOfWeek mdl-checkbox__input" value="日" type="checkbox" disabled><span class="mdl-checkbox__label">日</span></label>\n'
    ..'<label class="mdl-checkbox mdl-js-checkbox" for="mon"><input id="mon" class="DayOfWeek mdl-checkbox__input" value="月" type="checkbox" disabled><span class="mdl-checkbox__label">月</span></label>\n'
    ..'<label class="mdl-checkbox mdl-js-checkbox" for="tue"><input id="tue" class="DayOfWeek mdl-checkbox__input" value="火" type="checkbox" disabled><span class="mdl-checkbox__label">火</span></label>\n'
    ..'<label class="mdl-checkbox mdl-js-checkbox" for="wen"><input id="wen" class="DayOfWeek mdl-checkbox__input" value="水" type="checkbox" disabled><span class="mdl-checkbox__label">水</span></label>\n'
    ..'<label class="mdl-checkbox mdl-js-checkbox" for="thu"><input id="thu" class="DayOfWeek mdl-checkbox__input" value="木" type="checkbox" disabled><span class="mdl-checkbox__label">木</span></label>\n'
    ..'<label class="mdl-checkbox mdl-js-checkbox" for="fri"><input id="fri" class="DayOfWeek mdl-checkbox__input" value="金" type="checkbox" disabled><span class="mdl-checkbox__label">金</span></label>\n'
    ..'<label class="mdl-checkbox mdl-js-checkbox" for="sat"><input id="sat" class="DayOfWeek mdl-checkbox__input" value="土" type="checkbox" disabled><span class="mdl-checkbox__label">土</span></label>\n'
    ..'</span></label></div>\n'

    ..'<div class="time">\n<div><span class="pulldown"><select id="startHour" data-margin="1">\n'
  for i=0,23 do
    s=s..'<option value="'..(i<10 and '0' or '')..i..'">'..(i<10 and '0' or '')..i
  end
  s=s..'</select>\n</span>：<span class="pulldown"><select id="startMin">\n'
  for i=0,59 do
    s=s..'<option value="'..(i<10 and '0' or '')..i..'">'..(i<10 and '0' or '')..i
  end
  s=s..'</select></span>\n</div><div><span class="tilde">～</span><span class="pulldown"><select id="endHour">\n'
  for i=0,23 do
    s=s..'<option value="'..(i<10 and '0' or '')..i..'"'..(i==1 and ' selected' or '')..'>'..(i<10 and '0' or '')..i
  end
  s=s..'</select>\n</span>：<span class="pulldown"><select id="endMin">\n'
  for i=0,59 do
    s=s..'<option value="'..(i<10 and '0' or '')..i..'">'..(i<10 and '0' or '')..i
  end
  s=s..'</select></span>\n</div></div>\n'
    ..'</div></div>\n'

    ..'<div><label class="mdl-checkbox mdl-js-checkbox" for="notdate"><input id="notdate" class="mdl-checkbox__input" type="checkbox" name="notDateFlag" value="1"'..(si.notDateFlag and ' checked' or '')..'><span class="mdl-checkbox__label">NOT扱い</span></label></div>\n'
    ..'</div><input type="hidden" name="dateList" value="'..(dateListValue and dateListValue or '')..'"></div>\n'

    ..'<div class="'..(si.search and 'advanced ' or '')..'mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet">スクランブル放送</div>\n'
    ..'<div class="pulldown mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop mdl-grid mdl-grid--no-spacing"><select name="freeCAFlag">\n'
    ..'<option value="0"'..(si.freeCAFlag==0 and ' selected' or '')..'>無料、有料番組を対象とする\n'
    ..'<option value="1"'..(si.freeCAFlag==1 and ' selected' or '')..'>無料番組を対象とする\n'
    ..'<option value="2"'..(si.freeCAFlag==2 and ' selected' or '')..'>有料番組を対象とする\n'
    ..'</select></div></div>\n'
    ..(tkntrec and '<div class="'..(si.search and 'advanced ' or '')..'mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet mdl-cell--middle">番組長で絞り込み</div>\n'
      ..'<div class="number mdl-cell--6-col mdl-cell--9-col-desktop mdl-grid mdl-grid--no-spacing">\n'
      ..'<div class="textfield-container mdl-cell--4-col-tablet mdl-cell--3-col-desktop">\n<div class="text-right mdl-textfield mdl-js-textfield"><input id="DurationMin" class="mdl-textfield__input" type="number" name="chkDurationMin" value="'..si.chkDurationMin..'" min="0"><label class="mdl-textfield__label" for="DurationMin"></label><span class="mdl-textfield__error">Input is not a number!</span></div>分以上</div>\n'
      ..'<div class="mdl-layout-spacer mdl-cell--hide-desktop mdl-cell--hide-tablet"></div>\n'
      ..'<div class="textfield-container mdl-cell--4-col-tablet mdl-cell--3-col-desktop">\n<div class="text-right mdl-textfield mdl-js-textfield"><input id="DurationMax" class="mdl-textfield__input" type="number" name="chkDurationMax" value="'..si.chkDurationMax..'" min="0"><label class="mdl-textfield__label" for="DurationMax"></label><span class="mdl-textfield__error">Input is not a number!</span></div>分以下</div>\n'
      ..'<div class="mdl-layout-spacer mdl-cell--hide-desktop mdl-cell--hide-tablet"></div></div>\n'
      ..'<span class="mdl-tooltip" for="DurationMin">0分で絞り込み無し</span><span class="mdl-tooltip" for="DurationMax">0分で絞り込み無し</span></div>\n' or '')

  if si.search then
    s=s..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet mdl-cell--middle">対象期間</div>\n'
      ..'<div class="number textfield-container"><div id="tt-days" class="text-right mdl-textfield mdl-js-textfield"><input class="mdl-textfield__input" type="number" name="days" value="'..key.days..'" min="0" id="days"><label class="mdl-textfield__label" for="days"></label><span class="mdl-textfield__error">Input is not a number!</span></div>×24時間以内</div>\n'
      ..'<span class="mdl-tooltip" for="tt-days">0で無期限</span></div>\n'
  else
    s=s..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet mdl-cell--middle">無効対象</div>\n'
      ..'<div class="checkbox-textfield mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop mdl-grid mdl-grid--no-spacing mdl-cell--middle"><div><label for="chkRecEnd" class="mdl-checkbox mdl-js-checkbox"><input id="chkRecEnd" class="mdl-checkbox__input" type="checkbox" name="chkRecEnd" value="1"'..(si.chkRecEnd and ' checked' or '')..'><span class="textfield-container mdl-checkbox__label"><div class="mdl-textfield mdl-js-textfield"><input class="mdl-textfield__input" type="number" name="chkRecDay" value="'..si.chkRecDay..'" min="0" id="chkRecDay"><label class="mdl-textfield__label" for="chkRecDay"></label><span class="mdl-textfield__error">Input is not a number!</span></div>日前までの録画結果</span></label></div></div></div>\n'
  end

  return s
end


--可能ならコンテンツをzlib圧縮する(lua-zlib(zlib.dll)が必要)
function Deflate(ct)
  local zl
  local trim
  for k,v in pairs(mg.request_info.http_headers) do
    if not zl and k:match('^[Aa]ccept%-[Ee]ncoding$') and v:find('deflate') then
      local status, zlib = pcall(require, 'zlib')
      if status then
        zl=zlib.deflate()(ct, 'finish')
      end
    elseif k:match('^[Uu]ser%-[Aa]gent$') and (v:find(' MSIE ') or v:find(' Trident/7%.') or v:find(' Edge/')) then
      --RFC2616非準拠のブラウザはzlibヘッダを取り除く
      trim=true
    end
  end
  if trim and zl and #zl >= 6 then
    zl=zl:sub(3, #zl-4)
  end
  return zl
end
