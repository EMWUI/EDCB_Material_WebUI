cssVer='240702'
jsVer={
  common='240703',
  legacy='240623',
  datastream='240623',
  player='240623',
  tvguide='240623',
  onair='240623',
  library='240623',
  setting='240623',
}

dofile(mg.document_root..'\\api\\util.lua')

sidePanel=tonumber(edcb.GetPrivateProfile('GUIDE','sidePanel',true,ini))~=0

function template(temp)
  local esc=edcb.htmlEscape
  edcb.htmlEscape=0
  local path=temp.path or ''
  local Roboto=tonumber(edcb.GetPrivateProfile('SET','Roboto',false,ini))~=0
  local css=edcb.GetPrivateProfile('SET','css','<link rel="stylesheet" href="'..path..'css/material.min.css">',ini)..'\n'
  local Olympic=tonumber(edcb.GetPrivateProfile('SET','Olympic',false,ini))~=0
  local suspend=''
  local edcbnosuspend=edcb.GetPrivateProfile('SET','ModulePath','','Common.ini')..'\\Tools\\edcbnosuspend.exe'
  if WIN32 and EdcbFindFilePlain(edcbnosuspend) then
    local onstat,stat,code=edcb.os.execute('tasklist /fi "imagename eq edcbnosuspend.exe" /fo csv /nh | find /i "edcbnosuspend.exe"')
    onstat=onstat and stat=='exit' and code==0 and 'y'
    suspend=suspend..'<li id="nosuspend" class="mdl-menu__item'..(not INDEX_ENABLE_SUSPEND and temp.menu and ' mdl-menu__item--full-bleed-divider' or '')..(onstat=='y' and ' n' or ' y')..'" data-nosuspend="'..(onstat=='y' and 'n' or 'y')..'" data-ctok="'..CsrfToken('common')..'">録画後動作<span id="n">の抑制を*解除*</span><span id="y">を抑制</span></li>\n'
  end
  if INDEX_ENABLE_SUSPEND then
    temp.dialog=temp.dialog or {}
    table.insert(temp.dialog, {id='dialog',button='<button class="ok mdl-button">OK</button>'})
    if INDEX_SUSPEND_USE_HIBERNATE then
       suspend=suspend..'<li id="suspend" class="mdl-menu__item'..(temp.menu and ' mdl-menu__item--full-bleed-divider' or '')..'" data-hibernation="y" data-ctok="'..CsrfToken('common')..'">休止</li>\n'
    else
       suspend=suspend..'<li id="suspend" class="mdl-menu__item'..(temp.menu and ' mdl-menu__item--full-bleed-divider' or '')..'" data-suspend="y" data-ctok="'..CsrfToken('common')..'">スタンバイ</li>\n'
    end
  end
  edcb.htmlEscape=esc

  local s=CreateContentBuilder(GZIP_THRESHOLD_BYTE)
  s:Append([=[
<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=2">
<meta name="theme-color" content="]=]..edcb.GetPrivateProfile('SET','theme','#3f51b5',ini)..[=[">
<title>EpgTimer</title>
<link rel="icon" href="]=]..path..[=[img/EpgTimer.ico">
<link rel="apple-touch-icon" sizes="256x256" href="]=]..path..[=[img/apple-touch-icon.png">
<link rel="manifest" href="]=]..path..[=[manifest.json">
]=]
..css
..((temp.dialog or temp.progres) and '<link rel="stylesheet" href="'..path..'css/dialog-polyfill.css">\n' or '')..[=[
<link rel="stylesheet" href="]=]..path..[=[css/default.css?ver=]=]..cssVer..[=[">
<link rel="stylesheet" href="]=]..path..[=[css/user.css">
]=]
..(Roboto and '<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700">\n' or '')

-- css
..(temp.css or '')

-- javascript
..[=[
<script src="]=]..path..[=[js/jquery-3.3.1.min.js"></script>
<script src="]=]..path..[=[js/material.min.js"></script>
<script src="]=]..path..[=[js/hammer.min.js"></script>
<script src="]=]..path..[=[js/jquery.hammer.js"></script>
]=]
..((temp.dialog or temp.progres) and '<script src="'..path..'js/dialog-polyfill.js"></script>\n' or '')
..'<script>var path=\''..path..'\';var root=\''..PathToRoot()..(temp.searchlinks and '\';var calendar_op=\'&amp;authuser='..edcb.GetPrivateProfile('CALENDAR','authuser','0',ini)..'&amp;src='..edcb.GetPrivateProfile('CALENDAR','src','',ini) or '')..'\';</script>\n'
..(temp.js or '')
..'<script src="'..path..'js/common.js?ver='..jsVer.common..'"></script>\n'

..[=[
</head>
<body>
]=])

-- dialog
for i,v in ipairs(temp.dialog or {}) do
  s:Append('<dialog id="'..v.id..'" class="mdl-dialog">\n<div class="mdl-dialog__content">'
    ..(v.content or '')
    ..'</div>\n<div class="mdl-dialog__actions">\n'
    ..(v.button or '')
    ..'<button class="mdl-button close" data-dialog="#'..v.id..'">キャンセル</button>\n'
    ..'</div>\n</dialog>\n')
end

if temp.progres then
  local r=type(temp.progres)=='table' and temp.progres or nil
  local dur=r and r.startTime.hour*3600+r.startTime.min*60+r.startTime.sec+r.durationSecond or nil
  s:Append('<dialog id="dialog_progres" class="mdl-dialog">\n<div class="mdl-dialog__content">\n'
    ..'<form id="progres" class="api" method="POST'..(r and '" action="'..PathToRoot()..'api/setReserve?id='..r.reserveID or '')
    ..'"><div>\n'..(r and r.eid==65535 and '' or '<p>プログラム予約化は元に戻せません<br>番組を特定できなくなるため追従もできません。</p>\n')
    ..'予約日時\n<div class="textfield-container"><div class="has-icon mdl-textfield mdl-js-textfield"><i class="material-icons">calendar_today</i><input required class="mdl-textfield__input" type="date" name="startdate" id="startdate" min="1900-01-01" max="2999-12-31" value="'..(r and string.format('%d-%02d-%02d', r.startTime.year,r.startTime.month,r.startTime.day) or '2018-01-01')
    ..'"><label class="mdl-textfield__label" for="startdate"></label></div></div>\n<div class="textfield-container"><div class="textfield-container"><div class="mdl-textfield mdl-js-textfield"><input required class="mdl-textfield__input" type="time" name="starttime" step="1" id="starttime" value="'..(r and string.format('%02d:%02d:%02d', r.startTime.hour,r.startTime.min,r.startTime.sec) or '00:00:00')
    ..'"><label class="mdl-textfield__label" for="starttime"></label></div></div>\n<span class="tilde">～</span>\n'
    ..'<div class="textfield-container"><div class="mdl-textfield mdl-js-textfield"><input required class="mdl-textfield__input" type="time" name="endtime" step="1" id="endtime" value="'..(dur and string.format('%02d:%02d:%02d', math.floor(dur/3600)%24,math.floor(dur/60)%60,dur%60) or '00:00:00')
    ..'"><label class="mdl-textfield__label" for="endtime"></label></div></div></div>\n<input type="hidden" name="change" value="1">\n<input type="hidden" name="ctok" value="'..CsrfToken('setreserve')
    ..'">\n</div></form></div>\n<div class="mdl-dialog__actions">\n'
    ..'<button id="progres_button" class="submit mdl-button" data-dialog="#dialog_progres" data-form="#progres">変更</button>\n'
    ..'<button class="mdl-button close" data-dialog="#dialog_progres">キャンセル</button>\n'
    ..'</div>\n</dialog>\n')
end

s:Append([=[
<div class="mdl-layout mdl-js-layout mdl-layout--fixed-header]=]..(not temp.Scrollable and ' mdl-layout--fixed-tabs' or '')..[=[">
  <header class="mdl-layout__header">
    <div class="mdl-layout__header-row mdl-color--primary">
      <div class="search-box mdl-cell--order-2 mdl-textfield mdl-js-textfield mdl-textfield--expandable mdl-textfield--floating-label mdl-textfield--align-right">
        <label class="mdl-button mdl-js-button mdl-button--icon" for="header-andKey">
          <i class="material-icons">search</i>
        </label>
        <div class="mdl-textfield__expandable-holder">
          <form id="search-bar" method="GET" action="search.html">
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
      <button id="notification" class="notification hidden mdl-button mdl-js-button mdl-button--icon mdl-cell--order-3"><i class="material-icons mdl-badge--no-background mdl-badge--overlap" data-badge="0">notifications_none</i></button>
]=]..((#suspend>0 or temp.menu) and '      <button id="menu" class="mdl-button mdl-js-button mdl-button--icon mdl-cell--order-3"><i class="material-icons">more_vert</i></button>\n' or '')..[=[
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

..(Olympic and '      <a class="mdl-navigation__link" href="'..path..'epgcustom.html?Olympic="><i class="material-icons">sports</i>オリンピック</a>' or '')
..[=[
      <a class="mdl-navigation__link" href="]=]..path..[=[epg.html"><i class="material-icons">dashboard</i>番組表</a>
      <a class="mdl-navigation__link" href="]=]..path..[=[epgweek.html"><i class="material-icons">view_week</i>週間番組表</a>
      <a class="mdl-navigation__link" href="]=]..path..[=[onair.html"><i class="material-icons">tv</i>放送中</a>
      <a class="mdl-navigation__link" href="]=]..path..[=[tvcast.html"><i class="material-icons">live_tv</i>リモート視聴</a>
      <a class="mdl-navigation__link" href="]=]..path..[=[reserve.html"><i class="material-icons">schedule</i>予約一覧</a>
      <a class="mdl-navigation__link" href="]=]..path..[=[tunerreserve.html"><i class="material-icons">tune</i>チューナー別</a>
      <a class="mdl-navigation__link" href="]=]..path..[=[autoaddepg.html"><i class="material-icons">update</i>EPG予約</a>
      <a class="mdl-navigation__link" href="]=]..path..[=[library.html"><i class="material-icons">storage</i>ライブラリ</a>
      <a class="mdl-navigation__link" href="]=]..path..[=[recinfo.html"><i class="material-icons">history</i>録画結果</a>
      <a class="mdl-navigation__link" href="]=]..path..[=[search.html"><i class="material-icons">search</i>検索</a>
      <a class="mdl-navigation__link" href="]=]..path..[=[setting.html"><i class="material-icons">settings</i>設定</a>
      <div class="mdl-layout-spacer"></div>
      <div class="navigation__footer">
        <p>
          <i class="material-icons">copyright</i>
          <span class="">EMWUI</span>
          <a class="mdl-button mdl-js-button mdl-button--icon" href="https://github.com/EMWUI/EDCB_Material_WebUI" target="_blank"><i class="material-icons">feedback</i></a>
          <a class="mdl-button mdl-js-button mdl-button--icon" href="https://www.amazon.jp/hz/wishlist/ls/P4DSM5GQILMI" target="_blank"><i class="material-icons">thumb_down</i></a>
          <a class="mdl-color-text--accent mdl-button mdl-js-button mdl-button--icon" href="https://www.amazon.jp/hz/wishlist/ls/1FFBR5ZLZK8EY" target="_blank"><i class="material-icons">heart_plus</i></a>
        </p>
        <ul>
          <li><a class="mdl-color-text--cyan" href="]=]..PathToRoot()..[=[api/showlog?c=8192">情報通知ログ</a></li>
          <li><a class="mdl-color-text--cyan" href="]=]..PathToRoot()..[=[api/showlog?c=8192&amp;t=d">デバッグ出力</a></li>
        </ul>
      </div>
    </nav>
  </div>
  <div class="drawer-swipe"></div>
]=]

..(temp.macro and [=[
  <div id="macro" class="window mdl-layout__obfuscator">
    <div class="mdl-card mdl-shadow--16dp">
      <div class="mdl-card__title">
        <h2 class="mdl-card__title-text">マクロ一覧</h2>
      </div>
      <div class="macro-list">
        <div class="macro-list-container">
          <input type="checkbox" class="check-shrink-phone hidden" id="macro-start">
          <label class="drop-down " for="macro-start">開始時間</label>
          <ul class="shrink-phone">
            <li>
              <input type="checkbox" class="hidden" id="macro-start28">
              <label class="drop-down " for="macro-start28">28時間表記</label>
              <ul>
                <li class="macro-item" data-macro="$SDYYYY28$"><span>年 4桁</span><span class="mdl-layout-spacer"></span><span>$SDYYYY28$</span></li>
                <li class="macro-item" data-macro="$SDYY28$"><span>年 2桁</span><span class="mdl-layout-spacer"></span><span>$SDYY28$</span></li>
                <li class="macro-item" data-macro="$SDM28$"><span>月</span><span class="mdl-layout-spacer"></span><span>$SDM28$</span></li>
                <li class="macro-item" data-macro="$SDMM28$"><span>月 2桁</span><span class="mdl-layout-spacer"></span><span>$SDMM28$</span></li>
                <li class="macro-item" data-macro="$SDD28$"><span>日</span><span class="mdl-layout-spacer"></span><span>$SDD28$</span></li>
                <li class="macro-item" data-macro="$SDDD28$"><span>日 2桁</span><span class="mdl-layout-spacer"></span><span>$SDDD28$</span></li>
                <li class="macro-item" data-macro="$SDW28$"><span>曜日</span><span class="mdl-layout-spacer"></span><span>$SDW28$</span></li>
                <li class="macro-item" data-macro="$STH28$"><span>時</span><span class="mdl-layout-spacer"></span><span>$STH28$</span></li>
                <li class="macro-item" data-macro="$STHH28$"><span>時 2桁</span><span class="mdl-layout-spacer"></span><span>$STHH28$</span></li>
              </ul>
              <div class="drawer-separator"></div>
            </li>
            <li class="macro-item" data-macro="$SDYYYY$"><span>年 4桁</span><span class="mdl-layout-spacer"></span><span>$SDYYYY$</span></li>
            <li class="macro-item" data-macro="$SDYY$"><span>年 2桁</span><span class="mdl-layout-spacer"></span><span>$SDYY$</span></li>
            <li class="macro-item" data-macro="$SDM$"><span>月</span><span class="mdl-layout-spacer"></span><span>$SDM$</span></li>
            <li class="macro-item" data-macro="$SDMM$"><span>月 2桁</span><span class="mdl-layout-spacer"></span><span>$SDMM$</span></li>
            <li class="macro-item" data-macro="$SDD$"><span>日</span><span class="mdl-layout-spacer"></span><span>$SDD$</span></li>
            <li class="macro-item" data-macro="$SDDD$"><span>日 2桁</span><span class="mdl-layout-spacer"></span><span>$SDDD$</span></li>
            <li class="macro-item" data-macro="$SDW$"><span>曜日</span><span class="mdl-layout-spacer"></span><span>$SDW$</span></li>
            <li class="macro-item" data-macro="$STH$"><span>時</span><span class="mdl-layout-spacer"></span><span>$STH$</span></li>
            <li class="macro-item" data-macro="$STHH$"><span>時 2桁</span><span class="mdl-layout-spacer"></span><span>$STHH$</span></li>
            <li class="macro-item" data-macro="$STM$"><span>分</span><span class="mdl-layout-spacer"></span><span>$STM$</span></li>
            <li class="macro-item" data-macro="$STMM$"><span>分 2桁</span><span class="mdl-layout-spacer"></span><span>$STMM$</span></li>
            <li class="macro-item" data-macro="$STS$"><span>秒</span><span class="mdl-layout-spacer"></span><span>$STS$</span></li>
            <li class="macro-item" data-macro="$STSS$"><span>秒 2桁</span><span class="mdl-layout-spacer"></span><span>$STSS$</span></li>
          </ul>
        </div>
        <div class="macro-list-container">
          <input type="checkbox" class="check-shrink-phone hidden" id="macro-end">
          <label class="drop-down" for="macro-end">終了時間</label>
          <ul class="shrink-phone">
            <li>
              <input type="checkbox" class="hidden" id="macro-end24">
              <label class="drop-down" for="macro-end24">28時間表記</label>
              <ul>
                <li class="macro-item" data-macro="$EDYYYY28$"><span>年 4桁</span><span class="mdl-layout-spacer"></span><span>$EDYYYY28$</span></li>
                <li class="macro-item" data-macro="$EDYY28$"><span>年 2桁</span><span class="mdl-layout-spacer"></span><span>$EDYY28$</span></li>
                <li class="macro-item" data-macro="$EDM28$"><span>月</span><span class="mdl-layout-spacer"></span><span>$EDM28$</span></li>
                <li class="macro-item" data-macro="$EDMM28$"><span>月 2桁</span><span class="mdl-layout-spacer"></span><span>$EDMM28$</span></li>
                <li class="macro-item" data-macro="$EDD28$"><span>日</span><span class="mdl-layout-spacer"></span><span>$EDD28$</span></li>
                <li class="macro-item" data-macro="$EDDD28$"><span>日 2桁</span><span class="mdl-layout-spacer"></span><span>$EDDD28$</span></li>
                <li class="macro-item" data-macro="$EDW28$"><span>曜日</span><span class="mdl-layout-spacer"></span><span>$EDW28$</span></li>
                <li class="macro-item" data-macro="$ETH28$"><span>時</span><span class="mdl-layout-spacer"></span><span>$ETH28$</span></li>
                <li class="macro-item" data-macro="$ETHH28$"><span>時 2桁</span><span class="mdl-layout-spacer"></span><span>$ETHH28$</span></li>
              </ul>
              <div class="drawer-separator"></div>
            </li>
            <li class="macro-item" data-macro="$EDYYYY$"><span>年 4桁</span><span class="mdl-layout-spacer"></span><span>$EDYYYY$</span></li>
            <li class="macro-item" data-macro="$EDYY$"><span>年 2桁</span><span class="mdl-layout-spacer"></span><span>$EDYY$</span></li>
            <li class="macro-item" data-macro="$EDM$"><span>月</span><span class="mdl-layout-spacer"></span><span>$EDM$</span></li>
            <li class="macro-item" data-macro="$EDMM$"><span>月 2桁</span><span class="mdl-layout-spacer"></span><span>$EDMM$</span></li>
            <li class="macro-item" data-macro="$EDD$"><span>日</span><span class="mdl-layout-spacer"></span><span>$EDD$</span></li>
            <li class="macro-item" data-macro="$EDDD$"><span>日 2桁</span><span class="mdl-layout-spacer"></span><span>$EDDD$</span></li>
            <li class="macro-item" data-macro="$EDW$"><span>曜日</span><span class="mdl-layout-spacer"></span><span>$EDW$</span></li>
            <li class="macro-item" data-macro="$ETH$"><span>時</span><span class="mdl-layout-spacer"></span><span>$ETH$</span></li>
            <li class="macro-item" data-macro="$ETHH$"><span>時 2桁</span><span class="mdl-layout-spacer"></span><span>$ETHH$</span></li>
            <li class="macro-item" data-macro="$ETM$"><span>分</span><span class="mdl-layout-spacer"></span><span>$ETM$</span></li>
            <li class="macro-item" data-macro="$ETMM$"><span>分 2桁</span><span class="mdl-layout-spacer"></span><span>$ETMM$</span></li>
            <li class="macro-item" data-macro="$ETS$"><span>秒</span><span class="mdl-layout-spacer"></span><span>$ETS$</span></li>
            <li class="macro-item" data-macro="$ETSS$"><span>秒 2桁</span><span class="mdl-layout-spacer"></span><span>$ETSS$</span></li>
          </ul>
        </div>
        <div class="macro-list-container">
          <input type="checkbox" class="check-shrink-phone hidden"  id="macro-duration">
          <label class="drop-down" for="macro-duration">番組総時間</label>
          <ul class="shrink-phone">
            <li class="macro-item" data-macro="$DUH$"><span>時</span><span class="mdl-layout-spacer"></span><span>$DUH$</span></li>
            <li class="macro-item" data-macro="$DUHH$"><span>時 2桁</span><span class="mdl-layout-spacer"></span><span>$DUHH$</span></li>
            <li class="macro-item" data-macro="$DUM$"><span>分</span><span class="mdl-layout-spacer"></span><span>$DUM$</span></li>
            <li class="macro-item" data-macro="$DUMM$"><span>分 2桁</span><span class="mdl-layout-spacer"></span><span>$DUMM$</span></li>
            <li class="macro-item" data-macro="$DUS$"><span>秒</span><span class="mdl-layout-spacer"></span><span>$DUS$</span></li>
            <li class="macro-item" data-macro="$DUSS$"><span>秒 2桁</span><span class="mdl-layout-spacer"></span><span>$DUSS$</span></li>
          </ul>
        </div>
        <div class="macro-list-container2">
          <div class="mdl-layout-spacer"></div>
	      <div class="macro-list-container">
	        <div class="drawer-separator mdl-cell--hide-desktop"></div>
	        <ul>
	          <li class="macro-item" data-macro="$Title$"><span>番組名</span><span class="mdl-layout-spacer"></span><span>$Title$</span></li>
	          <li class="macro-item" data-macro="$Title2$"><span>番組名（[]削除）</span><span class="mdl-layout-spacer"></span><span>$Title2$</span></li>
	          <li class="macro-item" data-macro="$SubTitle$"><span>サブタイトル（番組内容）</span><span class="mdl-layout-spacer"></span><span>$SubTitle$</span></li>
	          <li class="macro-item" data-macro="$SubTitle2$"><span>話数が含まれるサブタイトル</span><span class="mdl-layout-spacer"></span><span>$SubTitle2$</span></li>
	          <li class="macro-item" data-macro="$Genre$"><span>番組のジャンル</span><span class="mdl-layout-spacer"></span><span>$Genre$</span></li>
	          <li class="macro-item" data-macro="$Genre2$"><span>番組の詳細ジャンル</span><span class="mdl-layout-spacer"></span><span>$Genre2$</span></li>
	          <li class="macro-item" data-macro="$ServiceName$"><span>サービス名</span><span class="mdl-layout-spacer"></span><span>$ServiceName$</span></li>
	          <li class="macro-item" data-macro="$SID10$"><span>サービスID</span><span class="mdl-layout-spacer"></span><span>$SID10$</span></li>
	          <li class="macro-item" data-macro="$ONID10$"><span>ネットワークID</span><span class="mdl-layout-spacer"></span><span>$ONID10$</span></li>
	          <li class="macro-item" data-macro="$TSID10$"><span>ストリームID</span><span class="mdl-layout-spacer"></span><span>$TSID10$</span></li>
	          <li class="macro-item" data-macro="$EID10$"><span>イベントID</span><span class="mdl-layout-spacer"></span><span>$EID10$</span></li>
	          <li class="macro-item" data-macro="$SID16$"><span>サービスID 16進数</span><span class="mdl-layout-spacer"></span><span>$SID16$</span></li>
	          <li class="macro-item" data-macro="$ONID16$"><span>ネットワークID 16進数</span><span class="mdl-layout-spacer"></span><span>$ONID16$</span></li>
	          <li class="macro-item" data-macro="$TSID16$"><span>ストリームID 16進数</span><span class="mdl-layout-spacer"></span><span>$TSID16$</span></li>
	          <li class="macro-item" data-macro="$EID16$"><span>イベントID 16進数</span><span class="mdl-layout-spacer"></span><span>$EID16$</span></li>
	        </ul>
	      </div>
	      <div class="macro-list-container">
	        <div class="drawer-separator mdl-cell--hide-desktop"></div>
	        <ul>
	          <li class="macro-item" data-macro="HtoZ()"><span>半角⇒全角</span><span class="mdl-layout-spacer"></span><span>HtoZ()</span></li>
	          <li class="macro-item" data-macro="ZtoH()"><span>全角⇒半角</span><span class="mdl-layout-spacer"></span><span>ZtoH()</span></li>
	          <li class="macro-item" data-macro="HtoZ&lt;alnum&gt;()"><span>英数半角⇒全角</span><span class="mdl-layout-spacer"></span><span>HtoZ&lt;alnum&gt;()</span></li>
	          <li class="macro-item" data-macro="ZtoH&lt;alnum&gt;()"><span>英数全角⇒半角</span><span class="mdl-layout-spacer"></span><span>ZtoH&lt;alnum&gt;()</span></li>
	          <li class="macro-item" data-macro="Tr///()"><span>文字置換</span><span class="mdl-layout-spacer"></span><span>Tr/置換文字リスト/置換後/()</span></li>
	          <li class="macro-item" data-macro="S///()"><span>文字列置換</span><span class="mdl-layout-spacer"></span><span>S/置換文字列/置換後/()</span></li>
	          <li class="macro-item" data-macro="Rm//()"><span>文字削除</span><span class="mdl-layout-spacer"></span><span>Rm/削除文字リスト/()</span></li>
	          <li class="macro-item" data-macro="Head()"><span>足切り</span><span class="mdl-layout-spacer"></span><span>Head文字数[省略記号]</span></li>
	        </ul>
	      </div>
          <div class="mdl-layout-spacer"></div>
        </div>
      </div>
      <div class="mdl-dialog__actions mdl-card__actions mdl-card--border">
        <button class="macro close mdl-button">キャンセル</button>
      </div>
    </div>
  </div>
]=] or '')

..(temp.video and [=[
  <div id="popup" class="window mdl-layout__obfuscator">
    <div class="mdl-card mdl-shadow--16dp">
]=]..player('<video id="video"></video>', temp.video=='live')..[=[
      <span class="close stop icons mdl-badge" data-badge="&#xE5CD;"></span>
    </div>
  </div>
]=] or '')

  ..'<div class="menu">\n'
  ..((#suspend>0 or temp.menu) and '<ul class="mdl-menu mdl-menu--bottom-right mdl-js-menu" for="menu">\n'..suspend..(temp.menu or '')..'</ul>' or '')
  ..'<ul id="notifylist" class="mdl-menu mdl-menu--bottom-right mdl-js-menu mdl-list" for="notification">\n<li id="noNotify" class="mdl-list__item"></li>\n</ul></div>\n'

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
</html>]=])
  s:Finish()
  return s
end

--EPG情報をTextに変換
function ConvertEpgInfoText2(onidOrEpg, tsidOrRecInfo, sid, eid)
  local s, v, End = '', (type(onidOrEpg)=='table' and onidOrEpg or edcb.SearchEpg(onidOrEpg, tsidOrRecInfo, sid, eid)), true
  if v then
    local now, startTime = os.time(), TimeWithZone(v.startTime, 9*3600)
    End=v.durationSecond and startTime+v.durationSecond<now
    s='<div>\n<h4 class="mdl-typography--title'..(now<startTime-30 and ' start_'..math.floor(startTime/10) or '')..'">'
    if v.shortInfo then
      s=s..'<span class="title">'..ConvertTitle(v.shortInfo.event_name)..'</span>'
    end
    s=s..'<span class="mdl-typography--subhead mdl-grid mdl-grid--no-spacing"><span class="date">'..(v.startTime and FormatTimeAndDuration(v.startTime, v.durationSecond)..(v.durationSecond and '' or '～未定') or '未定')..'</span>'
    local service_name=''
    for i,w in ipairs(edcb.GetServiceList() or {}) do
      if w.onid==v.onid and w.tsid==v.tsid and w.sid==v.sid then
        service_name=w.service_name
        s=s..'<span class="service">'..service_name..'</span>'
        break
      end
    end
    s=s..'</span>\n'
      ..'<a class="notify_'..v.eid..' notification notify hidden mdl-button mdl-js-button mdl-button--icon" data-onid="'..v.onid..'" data-tsid="'..v.tsid..'" data-sid="'..v.sid..'" data-eid="'..v.eid..'" data-startTime="'..(startTime*1000)..'" data-service="'..service_name..'"'..(startTime-30<=now and ' disabled' or '')..'><i class="material-icons">'..(startTime-30<=now and 'notifications' or 'add_alert')..'</i></a>'
      ..SearchConverter(v, service_name)..'</h4>\n'
    if v.shortInfo then
      s=s..'<p>'..DecorateUri(v.shortInfo.text_char):gsub('\r?\n', '<br>\n')..'</p>\n'
    end

    s=s..'</div>\n'

      ..'<div><section class="mdl-layout__tab-panel is-active" id="detail">\n'

    if v.extInfo then
      s=s..'<div class="mdl-typography--body-1">\n'..DecorateUri(v.extInfo.text_char):gsub('\r?\n', '<br>\n')..'</div>\n'

    end
    s=s..'<ul>\n'
      ..(type(tsidOrRecInfo)=='string' and tsidOrRecInfo or '')
    if v.contentInfoList then
      s=s..'<li>ジャンル\n<ul>'
      for i,w in ipairs(v.contentInfoList) do
        --0x0E00は番組付属情報、0x0E01はCS拡張用情報
        local nibble=w.content_nibble==0x0E00 and w.user_nibble+0x6000 or
                     w.content_nibble==0x0E01 and w.user_nibble+0x7000 or w.content_nibble
        s=s..'<li>'..edcb.GetGenreName(math.floor(nibble/256)*256+255)..' - '..edcb.GetGenreName(nibble)..'\n'..'</li>\n'
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
      ..(NetworkType(v.onid)=='地デジ' and '' or v.freeCAFlag and '<li>有料放送</li>\n' or '<li>無料放送</li>\n')
      ..('<li>OriginalNetworkID:%d(0x%04X)</li>\n'):format(v.onid,v.onid)
      ..('<li>TransportStreamID:%d(0x%04X)</li>\n'):format(v.tsid,v.tsid)
      ..('<li>ServiceID:%d(0x%04X)</li>\n'):format(v.sid,v.sid)
      ..('<li>EventID:%d(0x%04X)</li>\n'):format(v.eid,v.eid)
      ..'</ul></li>\n</ul>\n'
      ..'</section>\n'
  end
  return s, v and v.audioInfoList, End
end

--録画設定フォームのテンプレート
function RecSettingTemplate(rs)
  local rsdef=(edcb.GetReserveData(0x7FFFFFFF) or {}).recSetting
  local s='<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet mdl-cell--middle">録画モード</div>\n'
    ..'<div class="pulldown mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop mdl-grid mdl-grid--no-spacing"><select name="recMode">'
    for i=1,#RecModeTextList() do
      s=s..'\n<option value="'..(i-1)..'"'..(rs.recMode==i-1 and ' selected' or '')..'>'..RecModeTextList()[i]
    end
    s=s..'\n</select></div></div>\n'

    ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet mdl-cell--middle">イベントリレー追従</div>\n'
    ..'<div class="mdl-layout-spacer mdl-cell--hide-desktop mdl-cell--hide-tablet"></div>\n'
    ..'<div><label for="tuijyuuFlag" class="mdl-switch mdl-js-switch"><input id="tuijyuuFlag" type="checkbox" class="mdl-switch__input" name="tuijyuuFlag" value="1"'..(rs.tuijyuuFlag and ' checked' or '')..'><span class="mdl-switch__label"></span></label></div></div>\n'

    ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet mdl-cell--middle">優先度</div>\n'
    ..'<div class="mdl-layout-spacer mdl-cell--hide-desktop mdl-cell--hide-tablet"></div>\n'
    ..'<div class="pulldown mdl-cell mdl-cell--1-col mdl-grid mdl-grid--no-spacing"><select name="priority">'
    for i=1,5 do
      s=s..'\n<option value="'..i..'"'..(rs.priority==i and ' selected' or '')..'>'..i
    end
    s=s..'\n</select></div></div>\n'

    ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet mdl-cell--middle">ぴったり（？）録画</div>\n'
    ..'<div class="mdl-layout-spacer mdl-cell--hide-desktop mdl-cell--hide-tablet"></div>\n'
    ..'<div><label for="pittariFlag" class="mdl-switch mdl-js-switch"><input id="pittariFlag" class="mdl-switch__input" type="checkbox" name="pittariFlag" value="1"'..(rs.pittariFlag and ' checked' or '')..'><span class="mdl-switch__label"></span></label></div></div>\n'

    ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet">録画マージン</div>\n'
    ..'<div class="mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop mdl-grid mdl-grid--no-spacing">\n<div><label for="usedef" class="mdl-checkbox mdl-js-checkbox"><input id="usedef" class="mdl-checkbox__input" type="checkbox" name="useDefMarginFlag" value="1"'..(rs.startMargin and '' or ' checked')..'><span class="mdl-checkbox__label">デフォルト設定で使用</span></label></div>\n'
    ..'<div class="number recmargin mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing'..(rs.startMargin and '' or ' is-disabled')..'">\n'
    ..'<div class="textfield-container mdl-cell--4-col-tablet mdl-cell--4-col-desktop">\n<div class="text-right mdl-textfield mdl-js-textfield mdl-textfield--floating-label"><input class="mdl-textfield__input" type="number" name="startMargin" value="'..(rs.startMargin or rsdef and rsdef.startMargin or 0)..'"'..(rs.startMargin and '' or ' disabled')..' id="startMargin"><label class="mdl-textfield__label" for="startMargin">開始</label><span class="mdl-textfield__error">Input is not a number!</span></div><span>秒前</span></div>\n'
    ..'<div class="mdl-layout-spacer mdl-cell--hide-desktop mdl-cell--hide-tablet"></div>\n'
    ..'<div class="textfield-container mdl-cell--4-col-tablet mdl-cell--4-col-desktop">\n<div class="text-right mdl-textfield mdl-js-textfield mdl-textfield--floating-label"><input class="mdl-textfield__input" type="number" name="endMargin" value="'..(rs.endMargin or rsdef and rsdef.endMargin or 0)..'"'..(rs.startMargin and '' or ' disabled')..' id="endMargin"><label class="mdl-textfield__label" for="endMargin">終了</label><span class="mdl-textfield__error">Input is not a number!</span></div><span>秒後</span></div>\n'
    ..'<div class="mdl-layout-spacer mdl-cell--hide-desktop mdl-cell--hide-tablet"></div>\n'
    ..'</div></div></div>\n'

    ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet">指定サービス対象データ</div>\n'
    ..'<div class="mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop mdl-grid mdl-grid--no-spacing">\n<div><label for="smode" class="mdl-checkbox mdl-js-checkbox"><input id="smode" class="mdl-checkbox__input" type="checkbox" name="serviceMode" value="1"'..(rs.serviceMode%2==0 and ' checked' or '')..'><span class="mdl-checkbox__label">デフォルト設定で使用</span></label></div>\n'
    ..'<div class="smode mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n'
    ..'<div><label for="mode1" class="mdl-checkbox mdl-js-checkbox"><input id="mode1" class="mdl-checkbox__input" type="checkbox" name="serviceMode_1" value="1"'..(math.floor(rs.serviceMode%2~=0 and rs.serviceMode/16 or rsdef and rsdef.serviceMode/16 or 0)%2~=0 and ' checked' or '')..(rs.serviceMode%2==0 and ' disabled' or '')..'><span class="mdl-checkbox__label">字幕データを含める</span></label></div>\n<div class="mdl-layout-spacer"></div>\n'
    ..'<div><label for="mode2" class="mdl-checkbox mdl-js-checkbox"><input id="mode2" class="mdl-checkbox__input" type="checkbox" name="serviceMode_2" value="1"'..(math.floor(rs.serviceMode%2~=0 and rs.serviceMode/32 or rsdef and rsdef.serviceMode/32 or 0)%2~=0 and ' checked' or '')..(rs.serviceMode%2==0 and ' disabled' or '')..'><span class="mdl-checkbox__label">データカルーセルを含める</span></label></div>\n<div class="mdl-layout-spacer"></div>\n'
    ..'</div></div></div>\n'

    ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet">ファイル出力'


  local CurrentDir=edcb.GetPrivateProfile('SET','ModulePath','','Common.ini')
  s=s..'</div>\n<div id="preset" class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n'
  if #rs.recFolderList>0 then
    for i,v in ipairs(rs.recFolderList) do
      local recNameDll, recNameOp=v.recNamePlugIn:match('^(.+%.dll)%?(.*)')
      s=s..'<div class="preset mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">'
        ..'<div class="delPreset mdl-button mdl-button--icon mdl-button--mini-icon mdl-js-button"><i class="material-icons">delete</i></div>'
        ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell">フォルダ</div><div class="mdl-cell">'..v.recFolder..'</div></div>\n'
        ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--middle">出力PlugIn</div>\n'
        ..'<div class="pulldown mdl-cell mdl-grid mdl-grid--no-spacing"><select name="writePlugIn">\n'
      for j,w in ipairs(EnumPlugInFileName('Write')) do
        s=s..'<option value="'..w..'"'..(IsEqualPath(v.writePlugIn,w) and ' selected' or '')..'>'..w..'\n'
      end
      s=s..'</select></div></div>\n'
        ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--middle">ファイル名PlugIn</div>\n'
        ..'<div class="pulldown mdl-cell mdl-grid mdl-grid--no-spacing"><select name="recNamePlugIn">\n<option value=""'..((recNameDll or v.recNamePlugIn)=='' and ' selected' or '')..'>なし\n'
      for j,w in ipairs(EnumPlugInFileName('RecName')) do
        s=s..'<option value="'..w..'"'..(IsEqualPath((recNameDll or v.recNamePlugIn),w) and ' selected' or '')..'>'..w..'\n'
      end
      s=s..'</select></div></div>\n'
        ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--middle">オプション</div>\n'
        ..'<div class="mdl-cell mdl-textfield mdl-js-textfield"><input class="has-icon mdl-textfield__input" type="text" name="recName" value="'..(recNameOp or '')..'" id="recName'..i..'"><label class="mdl-textfield__label" for="recName'..i..'">ファイル名オプション</label><i class="addmacro material-icons">add</i></div></div>\n'
        ..'<input class="recFolderList" type=hidden name="recFolder" value="'..v.recFolder..'">'
        ..'</div>\n'
    end
  end

  s=s..'<div class="addPreset mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing"><i class="material-icons">add_circle_outline</i></div>\n'
    ..'</div>'
    ..'</div>'

    ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing"><div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet mdl-cell--middle">部分受信サービス</div>\n'
    ..'<div class="mdl-cell--middle"><label for="partial" class="mdl-checkbox mdl-js-checkbox"><input id="partial" class="mdl-checkbox__input" type="checkbox" name="partialRecFlag" value="1"'..(rs.partialRecFlag~=0 and ' checked' or '')..'><span class="mdl-checkbox__label">別ファイルに同時出力する</span></label></div></div>\n'

    ..'<div id="partialpreset" class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing"'..(rs.partialRecFlag==0 and ' style="display: none;"' or '')..'>\n'

  if #rs.partialRecFolder>0 then
    for i,v in ipairs(rs.partialRecFolder) do
      local recNameDll, recNameOp=v.recNamePlugIn:match('^(.+%.dll)%?(.*)')
      s=s..'<div class="preset mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">'
        ..'<div class="delPreset mdl-button mdl-button--icon mdl-button--mini-icon mdl-js-button"><i class="material-icons">delete</i></div>'
        ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell">フォルダ</div><div class="mdl-cell">'..v.recFolder..'</div></div>\n'
        ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--middle">出力PlugIn</div>\n'
        ..'<div class="pulldown mdl-cell mdl-grid mdl-grid--no-spacing"><select name="partialwritePlugIn">\n'
      for j,w in ipairs(EnumPlugInFileName('Write')) do
        s=s..'<option value="'..w..'"'..(IsEqualPath(v.writePlugIn,w) and ' selected' or '')..'>'..w..'\n'
      end
      s=s..'</select></div></div>\n'
        ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--middle">ファイル名PlugIn</div>\n'
        ..'<div class="pulldown mdl-cell mdl-grid mdl-grid--no-spacing"><select name="partialrecNamePlugIn">\n<option value=""'..((recNameDll or v.recNamePlugIn)=='' and ' selected' or '')..'>なし\n'
      for j,w in ipairs(EnumPlugInFileName('RecName')) do
        s=s..'<option value="'..w..'"'..(IsEqualPath((recNameDll or v.recNamePlugIn),w) and ' selected' or '')..'>'..w..'\n'
      end
      s=s..'</select></div></div>\n'
        ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--middle">オプション</div>\n'
        ..'<div class="mdl-cell mdl-textfield mdl-js-textfield"><input class="has-icon mdl-textfield__input" type="text" name="partialrecName" value="'..(recNameOp or '')..'" id="partialrecName'..i..'"><label class="mdl-textfield__label" for="partialrecName'..i..'">ファイル名オプション</label><i class="addmacro material-icons">add</i></div></div>\n'
        ..'<input class="recFolder" type=hidden name="partialrecFolder" value="'..v.recFolder..'">'
        ..'</div>\n'
    end
  end
  s=s..'<div class="addPreset partial mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing"><i class="material-icons">add_circle_outline</i></div>\n'
    ..'</div>'

    ..'<select id="Write" class="hidden">\n'
  for j,w in ipairs(EnumPlugInFileName('Write')) do
    s=s..'<option value="'..w..'">'..w..'\n'
  end
  s=s..'</select>\n<select id="RecName" class="hidden">\n<option value="">なし\n'
  for j,w in ipairs(EnumPlugInFileName('RecName')) do
    s=s..'<option value="'..w..'">'..w..'\n'
  end
  s=s..'</select>\n'

    ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet mdl-cell--middle">連続録画動作</div>\n'
    ..'<div class="mdl-cell--middle"><label for="continue" class="mdl-checkbox mdl-js-checkbox"><input id="continue" class="mdl-checkbox__input" type="checkbox" name="continueRecFlag" value="1"'..(rs.continueRecFlag and ' checked' or '')..'><span class="mdl-checkbox__label">後ろの予約を同一ファイルで出力する</span></label></div></div>\n'

    ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet mdl-cell--middle">使用チューナー強制指定</div>\n'
    ..'<div class="pulldown mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop mdl-grid mdl-grid--no-spacing"><select name="tunerID">\n<option value="0"'..(rs.tunerID==0 and ' selected' or '')..'>自動\n'
  local a=edcb.GetTunerReserveAll()
  for i=1,#a-1 do
    s=s..'<option value="'..a[i].tunerID..'"'..(a[i].tunerID==rs.tunerID and ' selected' or '')..string.format('>ID:%08X(', a[i].tunerID)..a[i].tunerName..')\n'
  end
  s=s..'</select></div></div>\n'

    ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet">録画後動作</div>\n'
    ..'<div class="mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop mdl-grid mdl-grid--no-spacing"><div class="pulldown mdl-cell mdl-cell--12-col"><select name="suspendMode">\n'
    ..'<option value="0"'..(rs.suspendMode==0 and ' selected' or '')..'>デフォルト（'..(rsdef and ({'スタンバイ','休止','シャットダウン','何もしない'})[rsdef.suspendMode] or '')..'）'
    ..'<option value="1"'..(rs.suspendMode==1 and ' selected' or '')..'>スタンバイ\n'
    ..'<option value="2"'..(rs.suspendMode==2 and ' selected' or '')..'>休止\n'
    ..'<option value="3"'..(rs.suspendMode==3 and ' selected' or '')..'>シャットダウン\n'
    ..'<option value="4"'..(rs.suspendMode==4 and ' selected' or '')..'>何もしない\n</select></div>\n'
    ..'<div><label for="reboot" class="reboot mdl-checkbox mdl-js-checkbox"><input id="reboot" class="mdl-checkbox__input" type="checkbox" name="rebootFlag" value="1"'..((rs.suspendMode==0 and rsdef and rsdef.rebootFlag or rs.suspendMode~=0 and rs.rebootFlag) and ' checked' or '')..(rs.suspendMode==0 and ' disabled' or '')..'><span class="mdl-checkbox__label">復帰後再起動する</span></label></div></div></div>\n'

  local batFilePath, batFileTag=rs.batFilePath:match('^([^*]*)%*?(.*)$')
  s=s..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet mdl-cell--middle">録画後実行bat</div>\n'
    ..'<div class="pulldown mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop mdl-grid mdl-grid--no-spacing"><select name="batFilePath">\n<option value=""'..(batFilePath=='' and ' selected' or '')..'>なし\n'

  local batPath=edcb.GetPrivateProfile('SET','batPath',CurrentDir..'\\bat',ini)..'\\'
  for j,w in ipairs(edcb.FindFile(PathAppend(batPath,'*'), 0) or {}) do
    if not w.isdir and (w.name:find('%.[Bb][Aa][Tt]$') or w.name:find('%.[Pp][Ss]1$') or w.name:find('%.[Ll][Uu][Aa]$')) then
      s=s..'<option value="'..batPath..w.name..'"'..(batFilePath==batPath..w.name and ' selected' or '')..'>'..w.name..'\n'
      batFilePath=(batFilePath==batPath..w.name and '' or batFilePath)
    end
  end
  if batFilePath~='' then
    s=s..'<option value="'..batFilePath..'" selected>'..batFilePath..'\n'
  end
  s=s..'</select></div></div>\n'
  if rsdef and rsdef.batFilePath=='*' then
    s=s..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet mdl-cell--middle">録画タグ</div>\n'
      ..'<div id="batFileTag_wrap" class="mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop mdl-textfield mdl-js-textfield"><input class="mdl-textfield__input" type="text" name="batFileTag" value="'..batFileTag..'" id="batFileTag" list="batFileTagList"><label class="mdl-textfield__label" for="batFileTag"></label></div></div>\n'
      ..'<datalist id="batFileTagList">'
    for v in edcb.GetPrivateProfile('set','batFileTag','',ini):gmatch('[^,]+') do
      s=s..'<option value="'..v..'">'
    end
    s=s..'</datalist>'
  end

  return s
end

--検索フォームのテンプレート
function SerchTemplate(si)
  local subGenreoption=edcb.GetPrivateProfile('SET','subGenreoption','ALL',ini)
  local oneseg=tonumber(edcb.GetPrivateProfile('GUIDE','oneseg',false,ini))~=0
  local s='<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet mdl-cell--middle">検索キーワード</div>\n'
    ..'<div class="mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop mdl-textfield mdl-js-textfield"><input class="andKey mdl-textfield__input" type="text" name="andKey" value="'..parseAndKey(si.andKey).andKey..'" size="25" id="andKey"><label class="mdl-textfield__label" for="andKey"></label></div></div>\n'

    ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet">NOTキーワード</div>\n'
    ..'<div class="mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop mdl-grid mdl-grid--no-spacing"><div class="mdl-cell--12-col mdl-textfield mdl-js-textfield"><input class="mdl-textfield__input" type="text" name="notKey" value="'..si.notKey..'" size="25" id="notKey"><label class="mdl-textfield__label" for="notKey"></label></div>\n'
    ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n'
    ..'<div><label for="reg" class="mdl-checkbox mdl-js-checkbox"><input id="reg" class="mdl-checkbox__input" type="checkbox" name="regExpFlag" value="1"'..(si.regExpFlag and ' checked' or '')..'><span class="mdl-checkbox__label">正規表現</span></label></div><div class="mdl-layout-spacer"></div>\n'
    ..'<div><label for="aimai" class="mdl-checkbox mdl-js-checkbox"><input id="aimai" class="mdl-checkbox__input" type="checkbox" name="aimaiFlag" value="1"'..(si.aimaiFlag and ' checked' or '')..'><span class="mdl-checkbox__label">あいまい検索</span></label></div><div class="mdl-layout-spacer"></div>\n'
    ..'<div><label for="titleOnly" class="mdl-checkbox mdl-js-checkbox"><input id="titleOnly" class="mdl-checkbox__input" type="checkbox" name="titleOnlyFlag" value="1"'..(si.titleOnlyFlag and ' checked' or '')..'><span class="mdl-checkbox__label">番組名のみ</span></label></div><div class="mdl-layout-spacer"></div>\n'
    ..'<div><label for="caseFlag" class="mdl-checkbox mdl-js-checkbox"><input id="caseFlag" class="mdl-checkbox__input" type="checkbox" name="caseFlag" value="1"'..(parseAndKey(si.andKey).caseFlag and ' checked' or '')..'><span class="mdl-checkbox__label">大小文字区別</span></label></div><div class="mdl-layout-spacer"></div>\n'
    ..'</div></div></div>\n'

    ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet">'..(si.search and '対象ジャンル' or 'ジャンル絞り込み')..'</div>\n'
    ..'<div class="mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop"><div class="has-button'..(si.search and ' advanced' or '')..'"><div class="pulldown mdl-layout-spacer"><select id="content">\n'
    ..'<option value="all">すべて表示\n'
  for i=0,15 do
    local nibble1=edcb.GetGenreName(i*256+255)
    if nibble1~='' then
      s=s..'<option value=".g'..(i*256+255)..'">'..nibble1..'\n'
    end
  end
  s=s..'</select></div>\n'
   ..'<div><button class="g_celar'..(si.search and ' advanced ' or '')..' mdl-button mdl-js-button mdl-button--raised mdl-button--colored" type="button">クリア</button></div></div>\n'
   ..'<div class="has-button"><div class="multiple mdl-layout-spacer"><select id="contentList" name="contentList" multiple size="5">\n'
  for _i,i in ipairs({0,1,2,3,4,5,6,7,8,9,10,11,12,13,0x60,0x61,0x62,0x63,0x64,0x65,0x66,0x67,0x70,0x71,0x72,0x73,0x74,0x75,0x76,0x77,15,255}) do
    local nibble1=edcb.GetGenreName(i*256+255)
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
        local nibble2=edcb.GetGenreName(i*256+j)
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

  s=s..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet">'..(si.search and '対象サービス' or 'サービス絞り込み')..'</div>\n'
    ..'<div class="mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop">\n'
    ..'<div class="has-button"><div class="multiple mdl-layout-spacer"><select id="service" name="serviceList" multiple size="5">'

  local NetworkList={}
  for i,v in ipairs(NetworkIndex()) do
    NetworkList[i]=false
  end
  for i,v in ipairs(SelectChDataList(edcb.GetChDataList())) do
    NetworkList[NetworkIndex(v)]=true
    s=s..'\n<option class="network'..NetworkIndex(v)..(not oneseg and NetworkIndex()[NetworkIndex(v)]=='ワンセグ' and ' hide' or '')..'" value="'..v.onid..'-'..v.tsid..'-'..v.sid..'"'
    for j,w in ipairs(si.serviceList) do
      if w.onid==v.onid and w.tsid==v.tsid and w.sid==v.sid then
        s=s..' selected'
        break
      end
    end
    s=s..'>('..NetworkIndex()[NetworkIndex(v)]..') '..v.serviceName
  end

  s=s..'\n</select></div>\n'
    ..'<div><button class="all_select mdl-button mdl-js-button mdl-button--raised mdl-button--colored" type="button">全選択</button></div>'
    ..'</div>\n'

    ..'<div class="mdl-grid mdl-grid--no-spacing">表示絞り込み：'
    ..'<div class="mdl-cell--4-col-phone"><label for="image" class="mdl-checkbox mdl-js-checkbox"><input id="image" class="mdl-checkbox__input" type="checkbox" checked><span class="mdl-checkbox__label">映像のみ</span></label></div><div class="mdl-layout-spacer"></div>\n'
  for i,v in ipairs(NetworkList) do
    if v then
      s=s..'<div><label class="mdl-checkbox mdl-js-checkbox" for="EXT'..i..'"><input id="EXT'..i..'" class="extraction mdl-checkbox__input" type="checkbox" value=".network'..i..'"'..(not oneseg and NetworkIndex()[i]=='ワンセグ' and '' or ' checked')..'><span class="mdl-checkbox__label">'..NetworkIndex()[i]..'</span></label></div><div class="mdl-layout-spacer"></div>\n'
    end
  end
  s=s..'</div>\n'
    ..'</div></div>\n'

    ..'<div class="'..(si.search and 'advanced ' or '')..'mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet">時間絞り込み</div>\n'
    ..'<div class="mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop mdl-grid mdl-grid--no-spacing"><div id="dateList" class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n'
    ..'<div id="dateList_main"><div class="multiple"><select id="dateList_select" multiple size="6">\n'
  local dateListValue, dateList_SP = '', ''
  for i,v in ipairs(si.dateList) do
    local value=({'日','月','火','水','木','金','土',})[v.startDayOfWeek%7+1]..'-'..v.startHour..':'..v.startMin..'-'
      ..({'日','月','火','水','木','金','土',})[v.endDayOfWeek%7+1]..'-'..v.endHour..':'..v.endMin

    local list=({'日','月','火','水','木','金','土',})[v.startDayOfWeek%7+1]..' '..(v.startHour<10 and 0 or '')..v.startHour..':'..(v.startMin<10 and 0 or '')..v.startMin..' ～ '
      ..({'日','月','火','水','木','金','土',})[v.endDayOfWeek%7+1]..' '..(v.endHour<10 and 0 or '')..v.endHour..':'..(v.endMin<10 and 0 or '')..v.endMin

    s=s..'<option value="'..value..'">'..list..'\n'
    dateListValue=dateListValue..(i==1 and '' or ',')..value
    dateList_SP=dateList_SP..'<li class="mdl-list__item" data-count="'..(i-1)..'"><span class="mdl-list__item-primary-content">'..list..'</span></li>\n'
  end
  s=s..'</select></div>\n'
    ..'<div class="touch"><ul id="dateList_touch" class="mdl-list">\n'..dateList_SP..'</ul></div>\n'
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

    ..'<div class="time">'
    ..'<div class="mdl-textfield mdl-js-textfield"><input id="startTime" class="mdl-textfield__input" type="time" name="startTime" value="00:00"><label class="mdl-textfield__label" for="startTime"></label></div>'
    ..'<div><span class="tilde">～</span><div class="mdl-textfield mdl-js-textfield"><input id="endTime" class="mdl-textfield__input" type="time" name="endTime" value="01:00"><label class="mdl-textfield__label" for="endTime"></label></div></div>'
    ..'</div></div></div>\n'

    ..'<div><label class="mdl-checkbox mdl-js-checkbox" for="notdate"><input id="notdate" class="mdl-checkbox__input" type="checkbox" name="notDateFlag" value="1"'..(si.notDateFlag and ' checked' or '')..'><span class="mdl-checkbox__label">NOT扱い</span></label></div>\n'
    ..'</div><input type="hidden" name="dateList" value="'..dateListValue..'"></div>\n'

    ..'<div class="'..(si.search and 'advanced ' or '')..'mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet">スクランブル放送</div>\n'
    ..'<div class="pulldown mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop mdl-grid mdl-grid--no-spacing"><select name="freeCAFlag">\n'
    ..'<option value="0"'..(si.freeCAFlag==0 and ' selected' or '')..'>無料、有料番組を対象とする\n'
    ..'<option value="1"'..(si.freeCAFlag==1 and ' selected' or '')..'>無料番組を対象とする\n'
    ..'<option value="2"'..(si.freeCAFlag==2 and ' selected' or '')..'>有料番組を対象とする\n'
    ..'</select></div></div>\n'
    ..'<div class="'..(si.search and 'advanced ' or '')..'mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet mdl-cell--middle">番組長で絞り込み</div>\n'
    ..'<div class="number mdl-cell--6-col mdl-cell--9-col-desktop mdl-grid mdl-grid--no-spacing">\n'
    ..'<div class="textfield-container mdl-cell--4-col-tablet mdl-cell--'..(si.side and 6 or 3)..'-col-desktop">\n<div class="text-right mdl-textfield mdl-js-textfield"><input id="DurationMin" class="mdl-textfield__input" type="number" name="chkDurationMin" value="'..si.chkDurationMin..'" min="0"><label class="mdl-textfield__label" for="DurationMin"></label><span class="mdl-textfield__error">Input is not a number!</span></div>分以上</div>\n'
    ..'<div class="mdl-layout-spacer mdl-cell--hide-desktop mdl-cell--hide-tablet"></div>\n'
    ..'<div class="textfield-container mdl-cell--4-col-tablet mdl-cell--'..(si.side and 6 or 3)..'-col-desktop">\n<div class="text-right mdl-textfield mdl-js-textfield"><input id="DurationMax" class="mdl-textfield__input" type="number" name="chkDurationMax" value="'..si.chkDurationMax..'" min="0"><label class="mdl-textfield__label" for="DurationMax"></label><span class="mdl-textfield__error">Input is not a number!</span></div>分以下</div>\n'
    ..'<div class="mdl-layout-spacer mdl-cell--hide-desktop mdl-cell--hide-tablet"></div></div>\n'
    ..'<span class="mdl-tooltip" for="DurationMin">0分で絞り込み無し</span><span class="mdl-tooltip" for="DurationMax">0分で絞り込み無し</span></div>\n'

  if si.search then
    s=s..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet mdl-cell--middle">対象期間</div>\n'
      ..'<div class="number textfield-container"><div id="tt-days" class="text-right mdl-textfield mdl-js-textfield"><input class="mdl-textfield__input" type="number" name="days" value="'..key.days..'" min="0" id="days"><label class="mdl-textfield__label" for="days"></label><span class="mdl-textfield__error">Input is not a number!</span></div>×24時間以内</div>\n'
      ..'<span class="mdl-tooltip" for="tt-days">0で無期限</span></div>\n'
  else
    s=s..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet">無効対象</div>\n'
      ..'<div><div><label for="chkRecEnd" class="mdl-checkbox mdl-js-checkbox"><input id="chkRecEnd" class="mdl-checkbox__input" type="checkbox" name="chkRecEnd" value="1"'..(si.chkRecEnd and ' checked' or '')..'><span class="mdl-checkbox__label">同一番組名の録画結果があれば無効で登録する</span></label></div>\n'
      ..'<div><label class="mdl-checkbox mdl-js-checkbox" for="chkRecNoService"><input id="chkRecNoService" class="mdl-checkbox__input" type="checkbox" name="chkRecNoService" value="1"'..(si.chkRecNoService and ' checked' or '')..'><span class="mdl-checkbox__label">全てのサービスで無効</span></label></div>\n'
      ..'<div class="number textfield-container">確認対象期間<div class="text-right mdl-textfield mdl-js-textfield"><input id="chkRecDay" class="mdl-textfield__input" type="number" name="chkRecDay" value="'..si.chkRecDay..'" min="0"><label class="mdl-textfield__label" for="chkRecDay"></label><span class="mdl-textfield__error">Input is not a number!</span></div>日前まで</div>\n'
      ..'</div></div>\n'
  end

  return s
end

function sidePanelTemplate(reserve)
  local s=[=[
<div id="sidePanel" class="sidePanel mdl-layout__drawer mdl-tabs mdl-js-tabs">
<div class="sidePanel_headder mdl-color--primary"><i class="material-icons">info</i><span class="sidePanel_title">番組情報</span><div class="mdl-layout-spacer"></div><a id="link_epginfo" class="mdl-button mdl-js-button mdl-button--icon"><i class="material-icons">open_in_new</i></a><button class="close_info mdl-button mdl-js-button mdl-button--icon"><i class="material-icons">close</i></button></div>
<div class="sidePanel-content">
<div id="summary"><h4 class="mdl-typography--title"><span id="title"></span><span class="mdl-typography--subhead mdl-grid mdl-grid--no-spacing"><span id="info_date" class="date"></span><span id="service" class="service"></span></span><span id="links"></span></h4><p></p></div>
<div class="tab-container"><div class="mdl-tabs__tab-bar"><a href="#detail" class="mdl-tabs__tab is-active">番組詳細</a><a href="#recset" class="mdl-tabs__tab">録画設定</a></div>
<section class="panel-swipe mdl-tabs__panel is-active" id="detail">
<div id="ext" class="mdl-typography--body-1"></div>
<ul>
<li>ジャンル<ul id="genreInfo"></ul></li>
<li>映像<ul id="videoInfo"></ul></li>
<li>音声<ul id="audioInfo"></ul></li>
<li>その他<ul id="otherInfo"></ul></li>
</ul>
</section>
<section class="panel-swipe mdl-tabs__panel" id="recset">
<form id="set" method="POST" data-action="]=]..(reserve and 'reserve' or 'add')..[=[">
<div class="form mdl-grid mdl-grid--no-spacing">
<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing"><div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet mdl-cell--middle">プリセット</div>
<div class="pulldown mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop mdl-grid mdl-grid--no-spacing"><select name="presetID">
]=]
  local rs
  for i,v in ipairs(edcb.EnumRecPresetInfo()) do
    if v.id==0 then
      rs=v.recSetting
      s=s..'<option value="'..v.id..'" selected>'..v.name..'\n'
    else
      s=s..'<option value="'..v.id..'">'..v.name..'\n'
    end
  end
  return s..'<option id="reserved" value="65535">予約時\n</select></div></div>\n'

    ..'<input type="hidden" name="onid">\n'
    ..'<input type="hidden" name="tsid">\n'
    ..'<input type="hidden" name="sid">\n'
    ..'<input type="hidden" name="eid">\n'
    ..'<input type="hidden" id="action">\n'
    ..'<input type="hidden" name="ctok" value="'..CsrfToken('setreserve')..'">\n'
    ..RecSettingTemplate(rs)..'</div></div></form>\n'
    ..'</section>\n</div>\n'

    ..'<div class="mdl-card__actions">\n'
    ..'<button id="toprogres" class="show_dialog mdl-button mdl-js-button mdl-button--primary" data-dialog="#dialog_progres">プログラム予約化</button>\n'
    ..'<div class="mdl-layout-spacer"></div>\n'
    ..'<form id="del" method="POST" data-action="del"><input type="hidden" name="del" value="1"><input type="hidden" name="ctok" value="'..CsrfToken('setreserve')..'"></form>\n<button id="delreseved" class="submit mdl-button mdl-js-button mdl-button--primary" data-form="#del">削除</button>\n'
    ..'<button id="reserve" class="submit mdl-button mdl-js-button mdl-button--primary" data-form="#set">予約追加</button>\n'
    ..'</div>\n'

    ..'</div>\n<div class="close_info mdl-layout__obfuscator mdl-layout--small-screen-only"></div>\n'
end

--プレイヤー
function player(video, liveOrAudio)
  local list = edcb.GetPrivateProfile('set','quality','',ini)
  local live = type(liveOrAudio)=='boolean' and liveOrAudio
  local audio = type(liveOrAudio)=='table' and liveOrAudio
  local s=[=[<div id="player">
<div class="player-container mdl-grid mdl-grid--no-spacing">
]=]..(USE_DATACAST and [=[<div class="remote-control disabled">
  <span class="navi">
    <span>
      <button id="key1" class="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--mini-fab" disabled><span class="material-icons">north</span></button>
    </span><span>
      <button id="key3" class="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--mini-fab" disabled><span class="material-icons">west</span></button>
      <button id="key18" class="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--primary" disabled><span class="fill material-icons">circle</span></button>
      <button id="key4" class="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--mini-fab" disabled><span class="material-icons">east</span></button>
    </span><span>
      <button id="key20" class="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--mini-fab" disabled><span class="material-icons">d</span></button>
      <button id="key2" class="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--mini-fab" disabled><span class="material-icons">south</span></button>
      <button id="key19" class="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--mini-fab" disabled><span class="material-icons">subdirectory_arrow_left</span></button>
      <label class="mdl-icon-toggle mdl-js-icon-toggle mdl-js-ripple-effect" for="num"><input type="checkbox" id="num" class="mdl-icon-toggle__input"><i class="mdl-icon-toggle__label material-icons">123</i></label>
    </span>
  </span><span class="color">
    <button id="key21" class="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--mini-fab" disabled></button>
    <button id="key22" class="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--mini-fab" disabled></button>
    <button id="key23" class="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--mini-fab" disabled></button>
    <button id="key24" class="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--mini-fab" disabled></button>
  </span>
  <span class="num">
    <span>
      <button id="key6" class="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--mini-fab" disabled>1</button>
      <button id="key7" class="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--mini-fab" disabled>2</button>
      <button id="key8" class="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--mini-fab" disabled>3</button>
    </span><span>
      <button id="key9" class="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--mini-fab" disabled>4</button>
      <button id="key10" class="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--mini-fab" disabled>5</button>
      <button id="key11" class="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--mini-fab" disabled>6</button>
    </span><span>
      <button id="key12" class="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--mini-fab" disabled>7</button>
      <button id="key13" class="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--mini-fab" disabled>8</button>
      <button id="key14" class="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--mini-fab" disabled>9</button>
    </span><span>
      <button id="key15" class="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--mini-fab" disabled>10</button>
      <button id="key16" class="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--mini-fab" disabled>11</button>
      <button id="key17" class="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--mini-fab" disabled>12</button>
    </span><span>
      <button id="key5" class="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--mini-fab" disabled>0</button>
    </span>
  </span>
  <div class="remote-control-indicator"></div>
</div>
<div class="remote-control-status-container">
<div class="remote-control-status remote-control-receiving-status" style="display: none;">データ取得中...</div>
<div class="remote-control-status remote-control-networking-status" style="display: none;">通信中...</div></div>
<div class="data-broadcasting-browser-container"><div class="data-broadcasting-browser-content"></div></div>
]=] or '')..(live and '<div id="comment-control" style="display:none"><div class="mdl-textfield mdl-js-textfield"><input class="mdl-textfield__input" type="text" id="comm"><label class="mdl-textfield__label" for="comm"></label></div><button id="commSend" class="mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab mdl-button--primary"><i class="material-icons">send</i></button></div>\n' or '')..[=[
<div id="playerUI" class="is-visible">
<div id="center" class="hidden"></div>
<div id="titlebar" class="bar"></div>
<div></div>
<div id="control" class="bar">
<div id="seek-container">]=]..(live and '<div class="progress mdl-slider__container"><div id="seek" class="mdl-progress mdl-js-progress"></div></div>' or '<input class="mdl-slider mdl-js-slider" type="range" id="seek" min="0" max="100" value="0" step="0.00001">')..[=[</div>
<button id="stop" class="stop ctl-button mdl-button mdl-js-button mdl-button--icon"><i class="material-icons fill">stop</i></button><span id="ctl-button"><button id="playprev" class="ctl-button mdl-button mdl-js-button mdl-button--icon"><i class="material-icons fill">skip_previous</i></button><button id="play" class="ctl-button mdl-button mdl-js-button mdl-button--icon"><i class="material-icons fill">play_arrow</i></button><button id="playnext" class="ctl-button mdl-button mdl-js-button mdl-button--icon"><i class="material-icons fill">skip_next</i></button></span>
<div id="volume-wrap"><button id="volume-icon" class="ctl-button mdl-button mdl-js-button mdl-button--icon fill"><i class="material-icons fill">volume_up</i></button><p id="volume-container" class="mdl-cell--hide-phone"><input class="mdl-slider mdl-js-slider" type="range" id="volume" min="0" max="1" value="0" step="0.01"></p></div>
<div class="Time-wrap"><span class="currentTime videoTime">0:00</span><span> / </span><span class="duration videoTime">0:00</span></div>
]=]..(live and '<div id="live">&#8226;</div>' or '')..[=[
<p class="mdl-layout-spacer"></p>
]=]..(USE_DATACAST and '<button id="remote" class="ctl-button mdl-button mdl-js-button mdl-button--icon"><i class="material-icons fill">settings_remote</i></button>\n' or '')
  ..(ALLOW_HLS and '<button id="subtitles" class="ctl-button marker mdl-button mdl-js-button mdl-button--icon"><i class="material-icons fill">subtitles</i></button>\n' or '')
  ..((live and USE_LIVEJK or not live and JKRDLOG_PATH~='') and '<button id="danmaku" class="ctl-button marker mdl-button mdl-js-button mdl-button--icon"><i class="material-icons fill">chat</i></button>\n' or '')..[=[
<button id="settings" class="ctl-button mdl-button mdl-js-button mdl-button--icon"><i class="material-icons fill">settings</i></button>
<ul class="mdl-menu mdl-menu--top-right mdl-js-menu" for="settings">
<li class="ext mdl-menu__item hidden" id="menu_autoplay"><label for="autoplay" class="mdl-layout-spacer">自動再生</label><span><label class="mdl-switch mdl-js-switch" for="autoplay"><input type="checkbox" id="autoplay" class="mdl-switch__input"></label></span></li>
<li class="ext mdl-menu__item audio" id="audio" disabled><button class="audio" disabled><span class="mdl-layout-spacer">音声</span><i class="material-icons">navigate_next</i></button>
<li class="ext mdl-menu__item quality" id="quality" disabled><button class="quality" disabled><span class="mdl-layout-spacer">画質</span><i class="material-icons">navigate_next</i></button></li>
<li class="ext mdl-menu__item" id="rate"><button><span class="mdl-layout-spacer">速度</span><i class="material-icons">navigate_next</i></button></li>
</ul><ul class="mdl-menu mdl-menu--top-right mdl-js-menu" for="audio">
]=]

if audio then
  for i,v in ipairs(audio) do
    s=s..'<li class="ext mdl-menu__item"><input type="radio" id="audio'..i..'" name="audio" value="0"'..(i==1 and ' checked' or '')..'><label for="audio'..i..'" class="mdl-layout-spacer"><i class="material-icons">check</i></label><label for="audio'..i..'">'..(v.text_char=='' and ({'主音声','副音声'})[i] or v.text_char)..'</label></li>\n'
  end
else
  s=s..[=[
<li class="ext mdl-menu__item"><input type="radio" id="audio1" name="audio" value="0" checked><label for="audio1" class="mdl-layout-spacer"><i class="material-icons">check</i></label><label for="audio1">主音声</label></li>
<li class="ext mdl-menu__item"><input type="radio" id="audio2" name="audio" value="1"><label for="audio2" class="mdl-layout-spacer"><i class="material-icons">check</i></label><label for="audio2">副音声</label></li>
]=]
end

s=s..[=[
</ul><ul class="mdl-menu mdl-menu--top-right mdl-js-menu" for="quality">
<li class="ext mdl-menu__item" id="menu_cinema"><label for="cinema" class="mdl-layout-spacer">逆テレシネ</label><span><label class="mdl-switch mdl-js-switch" for="cinema"><input type="checkbox" id="cinema" class="mdl-switch__input" value="1"></label></span></li>
]=]
  local checked
  for i,v in ipairs(XCODE_OPTIONS) do
    if not ALLOW_HLS or not ALWAYS_USE_HLS or v.outputHls then
      local id = 'q_'..mg.md5(v.name)
      s=s..'<li class="ext mdl-menu__item"><input type="radio" id="'..id..'" name="quality" value="'..i..'"'..(not checked and ' checked' or '')..'><label for="'..id..'" class="mdl-layout-spacer"><i class="material-icons">check</i></label><label for="'..id..'">'..EdcbHtmlEscape(v.name)..'</label></li>\n'
      checked = true
    end
  end
  s=s..'</ul><ul class="mdl-menu mdl-menu--top-right mdl-js-menu" for="rate">\n'
  for i,v in pairs({0.25, 0.5, 0.75, 1, 1.25, 1.5, 2}) do
    s=s..'<li class="ext mdl-menu__item"><input type="radio" id="rate'..i..'" name="rate" class="rate" value="'..v..'"'..(v==1 and ' checked' or '')..'><label for="rate'..i..'"><i class="material-icons">check</i></label><label for="rate'..i..'">'..(v==1 and '標準' or v)..'</label></li>\n'
  end
  return s..[=[
</ul>
<button id="PIP" class="hide-pip ctl-button mdl-button mdl-js-button mdl-button--icon"><i class="material-icons">picture_in_picture</i><span class="mdl-tooltip" data-mdl-for="PIP">ピクチャーインピクチャー</span></button>
<button id="PIP_exit" class="only-pip ctl-button mdl-button mdl-js-button mdl-button--icon"><i class="material-icons">pip_exit</i><span class="mdl-tooltip" data-mdl-for="PIP_exit">タブに戻る</span></button>
<button id="defult" class="player-mode ctl-button mdl-button mdl-js-button mdl-button--icon"><i class="material-icons mdl-cell--hide-phone">crop_7_5</i><span class="mdl-tooltip" data-mdl-for="defult">シアターモード</span></button>
<button id="theater" class="player-mode ctl-button mdl-button mdl-js-button mdl-button--icon"><i class="material-icons mdl-cell--hide-phone">crop_landscape</i><span class="mdl-tooltip" data-mdl-for="theater">デフォルト表示</span></button>
<button id="fullscreen" class="hide-pip ctl-button mdl-button mdl-js-button mdl-button--icon"><i class="material-icons">fullscreen</i></button>
</div>
</div>
<div class="arib-video-invisible-container"><div class="arib-video-container">]=]..video..[=[</div></div>
</div></div>
]=]
  ..((ALLOW_HLS or live) and '<script>'..(ALLOW_HLS and 'ALLOW_HLS=true;' or '')..'var ctok=\''..(live and CsrfToken('view') or CsrfToken('xcode'))..'\';'..'</script>\n' or '')
  ..'<script src="js/legacy.script.js?ver='..jsVer.legacy..'"></script>\n'

  ..((USE_DATACAST or live and USE_LIVEJK or not live and JKRDLOG_PATH~='') and '<script src="js/datastream.js?ver='..jsVer.datastream..'"></script>\n' or '')

  ..(USE_DATACAST and '<script src="js/web_bml_play_ts.js"></script>\n' or '')

  ..((live and USE_LIVEJK or not live and JKRDLOG_PATH~='') and '<link rel="stylesheet" href="css/jikkyo.css">\n'
    ..'<script>var ctokC=\''..CsrfToken('comment')..'\';function replaceTag(tag){'..JK_CUSTOM_REPLACE..'return tag;};var jk_comment_height='..JK_COMMENT_HEIGHT..';var jk_comment_durtion='..JK_COMMENT_DURATION..';</script>\n'
    ..'<script src="js/danmaku.js"></script>\n' or '')

  ..(ALLOW_HLS and '<script>var hls4=\''..(USE_MP4_HLS and '&hls4='..(USE_MP4_LLHLS and '2' or '1') or '')..'\';var aribb24UseSvg=\''..(ARIBB24_USE_SVG and 'true' or 'false')..'\';var aribb24Option={'..ARIBB24_JS_OPTION..'};\n</script>\n'
    ..(ALWAYS_USE_HLS and '<script src="js/hls.min.js"></script>\n' or '')
    ..'<script src="js/aribb24.js"></script>\n' or '')

  ..'<script src="js/player.js?ver='..jsVer.player..'"></script>\n'
end

--タイトルのマークを装飾
function ConvertTitle(title)
  --2か3バイトの[]で囲われた文字列
  return title:gsub('%[[^%]][^%]][^%]]?%]', function(a)
    if ('[新][終][再][交][映][手][声][多][字][二][Ｓ][Ｂ][SS][無][Ｃ][S1][S2][S3][MV][双][デ][Ｄ][Ｎ][Ｗ][Ｐ][HV][SD][天][解][料][前][後][初][生][販][吹][PPV][演][移][他][収]'):find(a, 1, true) then
      return '<span class="mark mdl-color--accent mdl-color-text--accent-contrast">'..a:sub(2, #a-1)..'</span>'
    end
    return nil
  end):gsub('　', ' ')
end

--検索等のリンクを派生
calendar_details=edcb.GetPrivateProfile('CALENDAR','details','%text_char%',ini)
SearchConverter=function(v, service_name)
  local title=(v.shortInfo and v.shortInfo.event_name or v.title or ''):gsub('＜.-＞', ''):gsub('【.-】', ''):gsub('%[.-%]', ''):gsub('（.-版）', '')
  local startTime=TimeWithZone(v.startTime)
  local endTime=v.durationSecond and startTime+v.durationSecond or startTime
  local text_char=v.shortInfo and v.shortInfo.text_char:gsub('\r?\n', '%%br%%'):gsub('%%', '%%%%') or ''
  --クライアントサイドで使う情報を置いておく
  return '<span class="search-links hidden" data-title="'..title
    ..'" data-service="'..service_name
    ..'" data-dates="'..os.date('!%Y%m%dT%H%M%S', startTime)..'/'..os.date('!%Y%m%dT%H%M%S', endTime)
    ..'" data-details="'..calendar_details:gsub('%%text_char%%', text_char)..'"></span>'
end

--スマホからのアクセスかどうか
function UserAgentSP()
  for hk,hv in pairs(mg.request_info.http_headers) do
    if hk:lower()=='user-agent' then
      for i,v in ipairs({'android','iphone','ipad'}) do
        if hv:lower():match(v) then
          return true
        end
      end
      return false
    end
  end
  return false
end

function RecModeTextList()
  return {'全サービス','指定サービス','全サービス（デコード処理なし）','指定サービス（デコード処理なし）','視聴','無効'}
end

function NetworkIndex(v)
  return not v and {'地デジ','ワンセグ','BS','CS','124/128度CS','その他'}
    or NetworkType(v.onid)=='地デジ' and ((v.service_type or v.serviceType)==0x01 and 1 or (v.partialReceptionFlag or v.partialFlag) and 2) or NetworkType(v.onid)=='BS' and 3 or NetworkType(v.onid):find('^110CS') and 4 or NetworkType(v.onid)=='124/128CS'and 5 or 6
end

function NetworkType(onid)
  return not onid and {'地デジ','BS','110CS1','110CS2','124/128CS','その他'}
    or NetworkType()[0x7880<=onid and onid<=0x7FE8 and 1 or onid==4 and 2 or onid==6 and 3 or onid==7 and 4 or onid==10 and 5 or 6]
end

function SelectChDataList(a)
  local n,m,r=0,0,{}
  table.sort(a, function(a,b) return a.sid<b.sid end)
  for i,v in ipairs(a) do
    --EPG取得対象サービスのみ
    if v.epgCapFlag then
      --地デジ優先ソート
      if NetworkType(v.onid)=='地デジ' then
        n=n+1
        table.insert(r,n,v)
      elseif NetworkType(v.onid)=='BS' then
        m=m+1
        table.insert(r,n+m,v)
      else
        table.insert(r,v)
      end
    end
  end
  return r
end

function CustomServiceList()
  local subch=mg.get_var(mg.request_info.query_string,'subch')
  local SubChConcat=tonumber(edcb.GetPrivateProfile('GUIDE','subChConcat',true,ini))~=0
  local NOT_SUBCH={
    --サブチャンネルでない、結合させないものを指定
    ['4-16626-202']=true, --スターチャンネル3
  }

  local function SubChanel(a,b)
    return not subch and SubChConcat and not NOT_SUBCH[a.onid..'-'..a.tsid..'-'..a.sid] and b and a.onid==b.onid and a.tsid==b.tsid
  end

  local a=edcb.GetServiceList() or {}
  local HIDE_SERVICES={}
  for i=0,1000 do
    local key=edcb.GetPrivateProfile('HIDE','hide'..i,false,ini)
    if key=='0' then break end
    HIDE_SERVICES[key]=true
  end

  local ServiceList={}
  if edcb.GetPrivateProfile('SORT','sort0',false,ini)~='0' then
    local GetServiceList={}
    for i,v in ipairs(a) do
      GetServiceList[v.onid..'-'..v.tsid..'-'..v.sid]=v
    end
    for i=0,1000 do
      local key=edcb.GetPrivateProfile('SORT','sort'..i,false,ini)
      if key=='0' then break end
      local v=GetServiceList[key]
      if v then
        v.hide=HIDE_SERVICES[key]
        if show or not v.hide then
          if NetworkType(v.onid)=='地デジ' or NetworkType(v.onid)=='BS' then
            v.subCh=SubChanel(v, ServiceList[#ServiceList])
          end
          table.insert(ServiceList, v)
        end
      end
    end
  else
    local epgCapFlag={}
    for i,v in ipairs(edcb.GetChDataList()) do
      epgCapFlag[v.onid..'-'..v.tsid..'-'..v.sid]=v.epgCapFlag
    end
    table.sort(a, function(a,b) return
      ('%04X%04X'):format(a.remote_control_key_id, a.sid)<
      ('%04X%04X'):format(b.remote_control_key_id, b.sid)
    end)
    local n,m=0,0
    for i,v in ipairs(a) do
      if epgCapFlag[v.onid..'-'..v.tsid..'-'..v.sid] and v.service_type==0x01 or v.service_type==0x02 or v.service_type==0xA5 or v.service_type==0xAD then
        --地デジ優先ソート
        if NetworkType(v.onid)=='地デジ' then
          v.subCh=SubChanel(v, ServiceList[n])
          n=n+1
          table.insert(ServiceList,n,v)
        elseif NetworkType(v.onid)=='BS' then
          v.subCh=SubChanel(v, ServiceList[n+m])
          m=m+1
          table.insert(ServiceList,n+m,v)
        else
          table.insert(ServiceList,v)
        end
      end
    end
  end
  return ServiceList
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
      while i-h>1 and hwhost:find(r:sub(i-h-1,i-h-1),1,true) do
        h=h+1
      end
    end
    if (h>0 and (i-h==1 or r:find('^[^/]',i-h-1))) or r:find('^https?://',i) then
      local j=i
      while j<=#r and hw:find(r:sub(j,j),1,true) do
        j=j+1
      end
      t=t..s:sub(spos(n),spos(i-h)-1)..'<a href="'..(h>0 and 'https://' or '')
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
