path='Setting\\HttpPublic.ini'
Roboto=tonumber(edcb.GetPrivateProfile('SET','Roboto',false,path))~=0
css=edcb.GetPrivateProfile('SET','css',false,path)

authuser=edcb.GetPrivateProfile('CALENDAR','authuser','0',path)
details=edcb.GetPrivateProfile('CALENDAR','details','%text_char%',path)

--このサイズ以上のときページ圧縮する(nilのとき常に非圧縮)
GZIP_THRESHOLD_BYTE=4096

function template(temp)
  local path = temp.path or ''
  local s=CreateContentBuilder(GZIP_THRESHOLD_BYTE)
  s:Append([=[
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
..((temp.dialog or temp.progres) and '<link rel="stylesheet" href="'..path..'css/dialog-polyfill.css">\n' or '')..[=[
<link rel="stylesheet" href="]=]..path..[=[css/default.css">
<link rel="stylesheet" href="]=]..path..[=[css/user.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
]=]
..(Roboto and '<link rel="stylesheet" href="http://fonts.googleapis.com/css?family=Roboto:300,400,500,700">' or '')

-- css
..(temp.css or '')

..[=[
<script src="]=]..path..[=[js/jquery-3.3.1.min.js"></script>
<script src="]=]..path..[=[js/material.min.js"></script>
<script src="]=]..path..[=[js/hammer.min.js"></script>
<script src="]=]..path..[=[js/jquery.hammer.js"></script>
]=]
..((temp.dialog or temp.progres) and '<script src="'..path..'js/dialog-polyfill.js"></script>\n' or '')
..'<script>path=\''..path..'\';root=\''..PathToRoot()..'\';</script>\n'
..'<script src="'..path..'js/common.js"></script>\n'

-- javascript
..(temp.js or '')

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
    ..'予約日時\n<div class="textfield-container"><div class="text-right mdl-textfield mdl-js-textfield"><input class="mdl-textfield__input" type="date" name="startdate" id="startdate" min="1900-01-01" max="2999-12-31'..(r and '" value="'..string.format('%d-%02d-%02d', r.startTime.year,r.startTime.month,r.startTime.day) or '')
    ..'"><label class="mdl-textfield__label" for="startdate"></label></div></div>\n<div class="textfield-container"><div class="textfield-container"><div class="text-right mdl-textfield mdl-js-textfield"><input class="mdl-textfield__input" type="time" name="starttime" step="1" id="starttime"'..(r and '" value="'..string.format('%02d:%02d:%02d', r.startTime.hour,r.startTime.min,r.startTime.sec) or '')
    ..'"><label class="mdl-textfield__label" for="starttime"></label></div></div>\n<span class="tilde">～</span>\n'
    ..'<div class="textfield-container"><div class="text-right mdl-textfield mdl-js-textfield"><input class="mdl-textfield__input" type="time" name="endtime" step="1" id="endtime"'..(dur and '" value="'..string.format('%02d:%02d:%02d', math.floor(dur/3600)%24,math.floor(dur/60)%60,dur%60) or '')
    ..'"><label class="mdl-textfield__label" for="endtime"></label></div></div></div>\n<input type="hidden" name="change" value="1">\n<input type="hidden" name="ctok" value="'..CsrfToken()
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
]=]
..(temp.video and '<button id="menu_video" class="hidden mdl-button mdl-js-button mdl-button--icon mdl-cell--order-3"><i class="material-icons">more_vert</i></button>' or '')
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
      <a class="mdl-navigation__link" href="]=]..path..[=[epg.html"><i class="material-icons">dashboard</i>番組表</a>
      <a class="mdl-navigation__link" href="]=]..path..[=[epgweek.html"><i class="material-icons">view_week</i>週間番組表</a>
      <a class="mdl-navigation__link" href="]=]..path..[=[onair.html"><i class="material-icons">live_tv</i>放送中</a>
      <a class="mdl-navigation__link" href="]=]..path..[=[reserve.html"><i class="material-icons">schedule</i>予約一覧</a>
      <a class="mdl-navigation__link" href="]=]..path..[=[tunerreserve.html"><i class="material-icons">tune</i>チューナー別</a>
      <a class="mdl-navigation__link" href="]=]..path..[=[autoaddepg.html"><i class="material-icons">update</i>EPG予約</a>
      <a class="mdl-navigation__link" href="]=]..path..[=[library.html"><i class="material-icons">video_library</i>ライブラリ</a>
      <a class="mdl-navigation__link" href="]=]..path..[=[recinfo.html"><i class="material-icons">assignment</i>録画結果</a>
      <a class="mdl-navigation__link" href="]=]..path..[=[search.html"><i class="material-icons">search</i>検索</a>
      <a class="mdl-navigation__link" href="]=]..path..[=[setting.html"><i class="material-icons">settings</i>設定</a>
      <div class="mdl-layout-spacer"></div>
      <div class="navigation__footer">
        <p>by EMWUI<small> - <a href="https://github.com/EMWUI/EDCB_Material_WebUI" target="_blank">GitHub<i class="material-icons">launch</i></a></small></p>
        <ul>
          <li><a class="mdl-color-text--cyan" href="]=]..path..[=[notifylog.lua?c=8192">情報通知ログ</a></li>
          <li><a class="mdl-color-text--cyan" href="]=]..path..[=[debuglog.lua?c=8192">デバッグ出力</a></li>
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
]=] or ''))
if temp.video then
  s:Append([=[
  <div id="popup" class="window mdl-layout__obfuscator">
    <div class="mdl-card mdl-shadow--16dp">
      <div id="player" class="is-small">
        <div class="player-container">
          <video id="video"></video>
          <div id="titlebar" class="bar"></div>
          <div id="control" class="ext bar">
            <i id="playprev" class="ctl-button material-icons">skip_previous</i>
            <i id="play" class="ctl-button material-icons">play_arrow</i>
              <i id="playnext" class="ctl-button material-icons">skip_next</i>
              <div id="seek-container" class="mdl-layout-spacer">
              <span class="currentTime videoTime">0:00</span>
              <p class="mdl-layout-spacer"><input class="mdl-slider mdl-js-slider" type="range" id="seek" min="0" max="99" value="0" step="1"></p>
              <span class="duration videoTime">0:00</span>
            </div>
            <p class="mdl-layout-spacer small-only"></p>
            <i id="volume-icon" class="ctl-button material-icons">volume_up</i>
            <p id="volume-container" class="mdl-cell--hide-phone"><input class="mdl-slider mdl-js-slider" type="range" id="volume" min="0" max="1" value="0" step="0.01"></p>
            <i id="settings" class="ctl-button material-icons">settings</i>
            <ul class="mdl-menu mdl-menu--top-right mdl-js-menu" for="settings">
              <li class="mdl-menu__item" id="menu_autoplay"><label for="autoplay" class="mdl-layout-spacer">自動再生</label><span><label class="mdl-switch mdl-js-switch" for="autoplay"><input type="checkbox" id="autoplay" class="mdl-switch__input"></label></span></li>
              <button id="audio" class="mdl-menu__item"><span class="mdl-layout-spacer">音声</span><span><i class="material-icons">navigate_next</i></button>
              <li class="mdl-menu__item" id="quality"><span class="mdl-layout-spacer">画質</span><span><i class="material-icons">navigate_next</i></li>
              <li class="mdl-menu__item" id="rate-container"><span><i id="rewind" class="material-icons">fast_rewind</i></span><span id="rate" class="mdl-layout-spacer">1.0</span><span><i id="forward" class="material-icons">fast_forward</i></span></li>
            </ul>
            <ul class="mdl-menu mdl-menu--top-right mdl-js-menu" for="audio">
              <li class="multi mdl-menu__item"><input type="radio" id="multi1" name="audio" class="audio" value="1"><label for="multi1" class="mdl-layout-spacer"><i class="material-icons">check</i></label><label for="multi1">主音声</label></li>
              <li class="multi mdl-menu__item"><input type="radio" id="multi2" name="audio" class="audio" value="2"><label for="multi2" class="mdl-layout-spacer"><i class="material-icons">check</i></label><label for="multi2">副音声</label></li>
              <li class="dual mdl-menu__item"><input type="radio" id="dual1" name="audio" class="audio" value="10"><label for="dual1" class="mdl-layout-spacer"><i class="material-icons">check</i></label><label for="dual1">[二] 日本語</label></li>
              <li class="dual mdl-menu__item"><input type="radio" id="dual2" name="audio" class="audio" value="11"><label for="dual2" class="mdl-layout-spacer"><i class="material-icons">check</i></label><label for="dual2">[二] 英語</label></li>
              <li class="dual mdl-menu__item"><input type="radio" id="RAW" name="audio" class="audio" value="100"><label for="RAW" class="mdl-layout-spacer"><i class="material-icons">check</i></label><label for="RAW">RAW</label></li>
            </ul>
            <ul class="submenu mdl-menu mdl-menu--top-right mdl-js-menu" for="quality">
]=])
local list = edcb.GetPrivateProfile('set','quality','','Setting\\HttpPublic.ini')
if list=='' then
  s:Append('<li class="mdl-menu__item"><input type="checkbox" id="HD" class="quality"><label for="HD" class="mdl-layout-spacer"><i class="material-icons">check</i></label><label for="HD"><i class="material-icons">hd</i></label></span></li>')
else
  for v in list:gmatch('[^,]+') do
    s:Append('<li class="mdl-menu__item"><input type="radio" id="'..v..'" name="quality" class="quality"><label for="'..v..'" class="mdl-layout-spacer"><i class="material-icons">check</i></label><label for="'..v..'">'..v..'</label></li>\n')
  end
end
s:Append([=[
            </ul>
            <i id="fullscreen" class="ctl-button material-icons">fullscreen</i>
          </div>
        </div>
      </div>
      <span class="close icons mdl-badge" data-badge="&#xE5CD;"></span>
    </div>
  </div>
]=])
end

s:Append('<div class="menu">\n'..(temp.menu and temp.menu or '')..'<ul id="notifylist" class="mdl-menu mdl-menu--bottom-right mdl-js-menu mdl-list" for="notification">\n<li id="noNotify" class="mdl-list__item"></li>\n</ul>\n'
  ..(temp.video and
    '<ul class="ext submenu mdl-menu mdl-menu--bottom-right mdl-js-menu" for="menu_video">\n'
    ..'<li class="mdl-menu__item" id="menu_apk"><label for="apk" class="mdl-layout-spacer">アプリで開く</label><span><label class="mdl-switch mdl-js-switch" for="apk"><input type="checkbox" id="apk" class="mdl-switch__input"></label></span></li>'
    ..'<button id="menu_quality" class="mdl-menu__item" disabled><span class="mdl-layout-spacer">画質</span><span><i class="material-icons">navigate_next</i></button>'
    ..'</ul></div>\n'
    ..'<ul class="mdl-menu mdl-menu--bottom-right mdl-js-menu" for="menu_quality">\n</ul>\n' or '</div>\n')

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

--EPG情報をTextに変換(EpgTimerUtil.cppから移植)
function _ConvertEpgInfoText2(onidOrEpg, tsid, sid, eid)
  local s, v, End = '', (type(onidOrEpg)=='table' and onidOrEpg or edcb.SearchEpg(onidOrEpg, tsid, sid, eid)), true
  if v then
    local now, startTime = os.time(), os.time(v.startTime)
    End=v.durationSecond and startTime+v.durationSecond<now
    s='<div>\n<h4 class="mdl-typography--title'..(now<startTime-30 and ' start_'..math.floor(startTime/10) or '')..'">'
    if v.shortInfo then
      s=s..'<span class="title">'..ConvertTitle(v.shortInfo.event_name)..'</span>'
    end
    s=s..'<span class="mdl-typography--subhead mdl-grid mdl-grid--no-spacing"><span class="date">'..(v.startTime and FormatTimeAndDuration(v.startTime, v.durationSecond)..(v.durationSecond and '' or '～未定') or '未定')..'</span>'
    for i,w in ipairs(edcb.GetServiceList() or {}) do
      if w.onid==v.onid and w.tsid==v.tsid and w.sid==v.sid then
        service_name=w.service_name
        s=s..'<span class="service">'..service_name..'</span>'
        break
      end
    end
    s=s..'</span>\n'
      ..'<a class="notify_'..v.eid..' notification notify hidden mdl-button mdl-js-button mdl-button--icon" data-onid="'..v.onid..'" data-tsid="'..v.tsid..'" data-sid="'..v.sid..'" data-eid="'..v.eid..'" data-start="'..startTime..'" data-name="'..service_name..'"'..(startTime-30<=now and ' disabled' or '')..'><i class="material-icons">'..(startTime-30<=now and 'notifications' or 'add_alert')..'</i></a>'
      ..ConvertSearch(v, service_name)..'</h4>\n'
    if v.shortInfo then
      s=s..'<p>'..DecorateUri(v.shortInfo.text_char):gsub('\r?\n', '<br>\n')..'</p>\n'
    end

    s=s..'</div>\n'

      ..'<div><section class="mdl-layout__tab-panel is-active" id="detail">\n'

    if v.extInfo then
      s=s..'<div class="mdl-typography--body-1">\n'..DecorateUri(v.extInfo.text_char):gsub('\r?\n', '<br>\n')..'</div>\n'

    end
    s=s..'<ul>\n'
    if v.contentInfoList then
      s=s..'<li>ジャンル\n<ul>'
      for i,w in ipairs(v.contentInfoList) do
        --0x0E01はCS拡張用情報
        nibble=w.content_nibble==0x0E01 and w.user_nibble+0x7000 or w.content_nibble
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
      ..string.format('<li>OriginalNetworkID:%d(0x%04X)</li>\n', v.onid, v.onid)
      ..string.format('<li>TransportStreamID:%d(0x%04X)</li>\n', v.tsid, v.tsid)
      ..string.format('<li>ServiceID:%d(0x%04X)</li>\n', v.sid, v.sid)
      ..string.format('<li>EventID:%d(0x%04X)</li>\n', v.eid, v.eid)
    s=s..'</ul></li>\n</ul>\n'
      ..'</section>\n'
  end
  return s, {multi=#v.audioInfoList>=2, dual=v.audioInfoList[1].component_type==2}, End
end

--録画設定フォームのテンプレート
function RecSettingTemplate(rs)
  local s='<input type="hidden" name="ctok" value="'..CsrfToken()..'">\n'
    ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet mdl-cell--middle">録画モード</div>\n'
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
    ..'<div class="textfield-container mdl-cell--4-col-tablet mdl-cell--4-col-desktop">\n<div class="text-right mdl-textfield mdl-js-textfield mdl-textfield--floating-label"><input class="mdl-textfield__input" type="number" name="startMargin" value="'..(rs.startMargin or 0)..'"'..(rs.startMargin and '' or ' disabled')..' id="startMargin"><label class="mdl-textfield__label" for="startMargin">開始</label><span class="mdl-textfield__error">Input is not a number!</span></div><span>秒前</span></div>\n'
    ..'<div class="mdl-layout-spacer mdl-cell--hide-desktop mdl-cell--hide-tablet"></div>\n'
    ..'<div class="textfield-container mdl-cell--4-col-tablet mdl-cell--4-col-desktop">\n<div class="text-right mdl-textfield mdl-js-textfield mdl-textfield--floating-label"><input class="mdl-textfield__input" type="number" name="endMargin" value="'..(rs.endMargin or 0)..'"'..(rs.startMargin and '' or ' disabled')..' id="endMargin"><label class="mdl-textfield__label" for="endMargin">終了</label><span class="mdl-textfield__error">Input is not a number!</span></div><span>秒後</span></div>\n'
    ..'<div class="mdl-layout-spacer mdl-cell--hide-desktop mdl-cell--hide-tablet"></div>\n'
    ..'</div></div></div>\n'

    ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet">指定サービス対象データ</div>\n'
    ..'<div class="mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop mdl-grid mdl-grid--no-spacing">\n<div><label for="smode" class="mdl-checkbox mdl-js-checkbox"><input id="smode" class="mdl-checkbox__input" type="checkbox" name="serviceMode" value="1"'..(rs.serviceMode%2==0 and ' checked' or '')..'><span class="mdl-checkbox__label">デフォルト設定で使用</span></label></div>\n'
    ..'<div class="smode mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n'
    ..'<div><label for="mode1" class="mdl-checkbox mdl-js-checkbox"><input id="mode1" class="mdl-checkbox__input" type="checkbox" name="serviceMode_1" value="1"'..(rs.serviceMode%2~=0 and math.floor(rs.serviceMode/16)%2~=0 and ' checked' or '')..(rs.serviceMode%2==0 and ' disabled' or '')..'><span class="mdl-checkbox__label">字幕データを含める</span></label></div>\n<div class="mdl-layout-spacer"></div>\n'
    ..'<div><label for="mode2" class="mdl-checkbox mdl-js-checkbox"><input id="mode2" class="mdl-checkbox__input" type="checkbox" name="serviceMode_2" value="1"'..(rs.serviceMode%2~=0 and math.floor(rs.serviceMode/32)%2~=0 and ' checked' or '')..(rs.serviceMode%2==0 and ' disabled' or '')..'><span class="mdl-checkbox__label">データカルーセルを含める</span></label></div>\n<div class="mdl-layout-spacer"></div>\n'
    ..'</div></div></div>\n'

    ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet">ファイル出力'


  local CurrentDir=edcb.GetPrivateProfile('SET','ModulePath','','Common.ini')
  local WriteDir=edcb.FindFile(CurrentDir..'\\Write\\*.dll', 0) or {}
  local RecNameDir=edcb.FindFile(CurrentDir..'\\RecName\\*.dll', 0) or {}
  s=s..'</div>\n<div id="preset" class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n'
  if #rs.recFolderList>0 then
    for i,v in ipairs(rs.recFolderList) do
      local recNameDll, recNameOp=v.recNamePlugIn:match('^(.+%.dll)%?(.*)')
      s=s..'<div class="preset mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">'
        ..'<div class="delPreset mdl-button mdl-button--icon mdl-button--mini-icon mdl-js-button"><i class="material-icons">delete</i></div>'
        ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell">フォルダ</div><div class="mdl-cell">'..v.recFolder..'</div></div>\n'
        ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--middle">出力PlugIn</div>\n'
        ..'<div class="pulldown mdl-cell mdl-grid mdl-grid--no-spacing"><select name="writePlugIn">\n'
      for j,w in ipairs(WriteDir) do
        s=s..'<option value="'..w.name..'"'..(v.writePlugIn==w.name and ' selected' or '')..'>'..w.name..'\n'
      end
      s=s..'</select></div></div>\n'
        ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--middle">ファイル名PlugIn</div>\n'
        ..'<div class="pulldown mdl-cell mdl-grid mdl-grid--no-spacing"><select name="recNamePlugIn">\n<option value=""'..((recNameDll or v.recNamePlugIn)=='' and ' selected' or '')..'>なし\n'
      for j,w in ipairs(RecNameDir) do
        s=s..'<option value="'..w.name..'"'..((recNameDll or v.recNamePlugIn)==w.name and ' selected' or '')..'>'..w.name..'\n'
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
      for j,w in ipairs(WriteDir) do
        s=s..'<option value="'..w.name..'"'..(v.writePlugIn==w.name and ' selected' or '')..'>'..w.name..'\n'
      end
      s=s..'</select></div></div>\n'
        ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--middle">ファイル名PlugIn</div>\n'
        ..'<div class="pulldown mdl-cell mdl-grid mdl-grid--no-spacing"><select name="partialrecNamePlugIn">\n<option value=""'..((recNameDll or v.recNamePlugIn)=='' and ' selected' or '')..'>なし\n'
      for j,w in ipairs(RecNameDir) do
        s=s..'<option value="'..w.name..'"'..((recNameDll or v.recNamePlugIn)==w.name and ' selected' or '')..'>'..w.name..'\n'
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
  for j,w in ipairs(WriteDir) do
    s=s..'<option value="'..w.name..'">'..w.name..'\n'
  end
  s=s..'</select>\n<select id="RecName" class="hidden">\n<option value="">なし\n'
  for j,w in ipairs(RecNameDir) do
    s=s..'<option value="'..w.name..'">'..w.name..'\n'
  end
  s=s..'</select>\n'

  s=s..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet mdl-cell--middle">連続録画動作</div>\n'
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
    ..'<option value="0"'..(rs.suspendMode==0 and ' selected' or '')..'>デフォルト設定を使用\n'
    ..'<option value="1"'..(rs.suspendMode==1 and ' selected' or '')..'>スタンバイ\n'
    ..'<option value="2"'..(rs.suspendMode==2 and ' selected' or '')..'>休止\n'
    ..'<option value="3"'..(rs.suspendMode==3 and ' selected' or '')..'>シャットダウン\n'
    ..'<option value="4"'..(rs.suspendMode==4 and ' selected' or '')..'>何もしない\n</select></div>\n'
    ..'<div><label for="reboot" class="mdl-checkbox mdl-js-checkbox"><input id="reboot" class="mdl-checkbox__input" type="checkbox" name="rebootFlag" value="1"'..(rs.rebootFlag and ' checked' or '')..'><span class="mdl-checkbox__label">復帰後再起動する</span></label></div></div></div>\n'

    ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet mdl-cell--middle">録画後実行bat</div>\n'
    ..'<div class="pulldown mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop mdl-grid mdl-grid--no-spacing"><select name="batFilePath">\n<option value=""'..(rs.batFilePath=='' and ' selected' or '')..'>なし\n'

  local batPath=edcb.GetPrivateProfile('SET','batPath',CurrentDir..'\\bat',path)..'\\'
  if rs.batFilePath:gsub('[^\\/]*$','')~=batPath and rs.batFilePath~='' then
    s=s..'<option value="'..rs.batFilePath..'" selected>'..rs.batFilePath..'\n'
  end
  for j,w in ipairs(edcb.FindFile(batPath..'*', 0) or {}) do
    if not w.isdir and w.name:find('%.bat$') or w.name:find('%.ps1$') then
      s=s..'<option value="'..batPath..w.name..'"'..(rs.batFilePath==batPath..w.name and ' selected' or '')..'>'..w.name..'\n'
    end
  end
  s=s..'</select></div></div>\n'

  return s
end

--検索フォームのテンプレート
function SerchTemplate(si)
  local s='<input type="hidden" name="ctok" value="'..CsrfToken()..'">\n'
    ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet mdl-cell--middle">検索キーワード</div>\n'
    ..'<div class="mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop mdl-textfield mdl-js-textfield"><input class="andKey mdl-textfield__input" type="text" name="andKey" value="'..(si.caseFlag or si.disableFlag or si.andKey)..'" size="25" id="andKey"><label class="mdl-textfield__label" for="andKey"></label></div></div>\n'

    ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n<div class="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet">NOTキーワード</div>\n'
    ..'<div class="mdl-cell mdl-cell--6-col mdl-cell--9-col-desktop mdl-grid mdl-grid--no-spacing"><div class="mdl-cell--12-col mdl-textfield mdl-js-textfield"><input class="mdl-textfield__input" type="text" name="notKey" value="'..si.notKey..'" size="25" id="notKey"><label class="mdl-textfield__label" for="notKey"></label></div>\n'
    ..'<div class="mdl-cell mdl-cell--12-col mdl-grid mdl-grid--no-spacing">\n'
    ..'<div><label for="reg" class="mdl-checkbox mdl-js-checkbox"><input id="reg" class="mdl-checkbox__input" type="checkbox" name="regExpFlag" value="1"'..(si.regExpFlag and ' checked' or '')..'><span class="mdl-checkbox__label">正規表現</span></label></div><div class="mdl-layout-spacer"></div>\n'
    ..'<div><label for="aimai" class="mdl-checkbox mdl-js-checkbox"><input id="aimai" class="mdl-checkbox__input" type="checkbox" name="aimaiFlag" value="1"'..(si.aimaiFlag and ' checked' or '')..'><span class="mdl-checkbox__label">あいまい検索</span></label></div><div class="mdl-layout-spacer"></div>\n'
    ..'<div><label for="titleOnly" class="mdl-checkbox mdl-js-checkbox"><input id="titleOnly" class="mdl-checkbox__input" type="checkbox" name="titleOnlyFlag" value="1"'..(si.titleOnlyFlag and ' checked' or '')..'><span class="mdl-checkbox__label">番組名のみ</span></label></div><div class="mdl-layout-spacer"></div>\n'
    ..'<div><label for="caseFlag" class="mdl-checkbox mdl-js-checkbox"><input id="caseFlag" class="mdl-checkbox__input" type="checkbox" name="caseFlag" value="1"'..(si.caseFlag and ' checked' or '')..'><span class="mdl-checkbox__label">大小文字区別</span></label></div><div class="mdl-layout-spacer"></div>\n'
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
  for _i,i in ipairs({0,1,2,3,4,5,6,7,8,9,10,11,12,13,0x70,0x71,0x72,0x73,0x74,0x75,0x76,0x77,15}) do
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

  for i,v in ipairs(SelectChDataList(edcb.GetChDataList())) do
      s=s..'<option class="'..(
        NetworkType(v.onid)=='BS' and 'BS' or
        NetworkType(v.onid)=='CS3' and 'HD' or
        NetworkType(v.onid):find('^CS')  and 'CS' or
        NetworkType(v.onid)=='地デジ' and (v.partialFlag and 'SEG hide' or 'DTV') or 'S-other')
        ..((v.partialFlag or v.serviceType==0x01 or v.serviceType==0xA5) and '' or ' data hide')
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

    ..'<div class="mdl-grid mdl-grid--no-spacing">表示絞り込み：'
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
<div class="sidePanel_headder"><i class="material-icons">info_outline</i><span class="sidePanel_title">番組情報</span><div class="mdl-layout-spacer"></div><a id="epginfo" class="mdl-button mdl-js-button mdl-button--icon" target="_blank"><i class="material-icons">open_in_new</i></a><button class="close_info mdl-button mdl-js-button mdl-button--icon"><i class="material-icons">close</i></button></div>
<div class="sidePanel-content">
<div id="summary"><h4 class="mdl-typography--title"><span id="title"></span><span class="mdl-typography--subhead mdl-grid mdl-grid--no-spacing"><span id="sidePanel_date" class="date"></span><span id="service" class="service"></span></span><span id="links"></span></h4><p></p></div>
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
  s=s..'<option id="reserved" value="65535">予約時\n</select></div></div>\n'

    ..'<input type="hidden" name="onid">\n'
    ..'<input type="hidden" name="tsid">\n'
    ..'<input type="hidden" name="sid">\n'
    ..'<input type="hidden" name="eid">\n'
    ..'<input type="hidden" id="action">\n'
    ..RecSettingTemplate(rs)..'</div></div></form>\n'
    ..'</section>\n</div>\n'

    ..'<div class="mdl-card__actions">\n'
    ..'<button id="toprogres" class="show_dialog mdl-button mdl-js-button mdl-button--primary" data-dialog="#dialog_progres">プログラム予約化</button>\n'
    ..'<div class="mdl-layout-spacer"></div>\n'
    ..'<form id="del" method="POST" data-action="del"><input type="hidden" name="del" value="1"><input type="hidden" name="ctok" value="'..CsrfToken()..'"></form>\n<button id="delreseved" class="submit mdl-button mdl-js-button mdl-button--primary" data-form="#del">削除</button>\n'
    ..'<button id="reserve" class="submit mdl-button mdl-js-button mdl-button--primary" data-form="#set">予約追加</button>\n'
    ..'</div>\n'

    ..'</div>\n<div class="close_info mdl-layout__obfuscator mdl-layout--small-screen-only"></div>\n'

  return s
end

--プレイヤー
function player(video, audio, xcode)
  local list = edcb.GetPrivateProfile('set','quality','',path)
  local s='<div id="player" class="is-small">\n'
..video..[=[
<div id="control" class="ext bar is-visible">
<i id="play" class="ctl-button material-icons">play_arrow</i>
<div id="seek-container" class="mdl-layout-spacer">
<span class="currentTime videoTime">0:00</span>
<p class="mdl-layout-spacer"><input class="mdl-slider mdl-js-slider" type="range" id="seek" min="0" max="99" value="0" step="1"></p>
<span class="duration videoTime">0:00</span>
</div>
<i id="volume-icon" class="ctl-button material-icons">volume_up</i>
<p id="volume-container"><input class="mdl-slider mdl-js-slider" type="range" id="volume" min="0" max="1" value="0" step="0.01"></p>
<p class="mdl-layout-spacer small-only"></p>
<i id="settings" class="ctl-button material-icons">settings</i>
<ul class="mdl-menu mdl-menu--top-right mdl-js-menu" for="settings">
<button id="audio" class="mdl-menu__item"]=]..((audio.multi or audio.dual) and '' or ' disabled')..[=[><span class="mdl-layout-spacer">音声</span><span><i class="material-icons">navigate_next</i></button>
<li class="mdl-menu__item" id="quality"]=]..(xcode and ' disabled' or '')..[=[><span class="mdl-layout-spacer">画質</span><span><i class="material-icons">navigate_next</i></li>
<li class="mdl-menu__item" id="rate-container"><span><i id="rewind" class="material-icons">fast_rewind</i></span><span id="rate" class="mdl-layout-spacer">1.0</span><span><i id="forward" class="material-icons">fast_forward</i></span></li>
</ul>
<ul class="submenu mdl-menu mdl-menu--top-right mdl-js-menu" for="audio">
]=]..(audio.multi and [=[
<li class="multi mdl-menu__item"><input type="radio" id="multi1" name="audio" class="audio" value="1" checked><label for="multi1" class="mdl-layout-spacer"><i class="material-icons">check</i></label><label class="m" for="multi1">主音声</label></li>
<li class="multi mdl-menu__item"><input type="radio" id="multi2" name="audio" class="audio" value="2"><label for="multi2" class="mdl-layout-spacer"><i class="material-icons">check</i></label><label class="m" for="multi2">副音声</label></li>
]=] or '')..(audio.dual and [=[
<li class="dual mdl-menu__item"><input type="radio" id="dual1" name="audio" class="audio" value="10" checked><label for="dual1" class="mdl-layout-spacer"><i class="material-icons">check</i></label><label class="m" for="dual1">[二] 日本語</label></li>
<li class="dual mdl-menu__item"><input type="radio" id="dual2" name="audio" class="audio" value="11"><label for="dual2" class="mdl-layout-spacer"><i class="material-icons">check</i></label><label class="m" for="dual2">[二] 英語</label></li>
<li class="dual mdl-menu__item"><input type="radio" id="RAW" name="audio" class="audio" value="100"><label for="RAW" class="mdl-layout-spacer"><i class="material-icons">check</i></label><label class="m" for="RAW">[二] 日本語+英語</label></li>
]=] or '')..'</ul>'
  if not xcode then
    s=s..'<ul class="mdl-menu mdl-menu--top-right mdl-js-menu" for="quality">'
    if list=='' then
      s=s..'<li class="mdl-menu__item"><input type="checkbox" id="HD" class="quality"><label for="HD" class="mdl-layout-spacer"><i class="material-icons">check</i></label><label for="HD"><i class="material-icons">hd</i></label></span></li>'
    else
      for v in list:gmatch('[^,]+') do
        s=s..'<li class="mdl-menu__item"><input type="checkbox" id="'..v..'" class="quality"><label for="'..v..'" class="mdl-layout-spacer"><i class="material-icons">check</i></label><label for="'..v..'">'..v..'</label></li>\n'
      end
    end
    s=s..'</ul>'
  end
  s=s..[=[
<i id="fullscreen" class="ctl-button material-icons">fullscreen</i>
</div>
</div>
]=]
  return s
end

function RecModeTextList()
  return {'全サービス','指定サービスのみ','全サービス（デコード処理なし）','指定サービスのみ（デコード処理なし）','視聴','無効'}
end

function NetworkType(onid)
  return not onid and {'地デジ','BS','CS1','CS2','CS3','その他'}
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

function ServiceList()
  local a=edcb.GetServiceList() or {}
  local HIDE_SERVICES={}
  local count=tonumber(edcb.GetPrivateProfile('HIDE','count',0,path))
  if count>0 then
    for i=0,count do
      HIDE_SERVICES[''..edcb.GetPrivateProfile('HIDE','hide'..i,0,path)]=true
    end
  end

  local sort={}
  count=tonumber(edcb.GetPrivateProfile('SORT','count',0,path))
  if count>0 then
    local GetServiceList={}
    for i,v in ipairs(a) do
      GetServiceList[v.onid..'-'..v.tsid..'-'..v.sid]=v
    end
    for i=0,count do
      local key=edcb.GetPrivateProfile('SORT','sort'..i,0,path)
      local v=GetServiceList[key]
      if v then
        if HIDE_SERVICES[key] then v.hide=true end
        if show or not v.hide then
          table.insert(sort, v)
        end
      end
    end
  else
    table.sort(a, function(a,b) return
      ('%04X%04X'):format(a.remote_control_key_id, a.sid)<
      ('%04X%04X'):format(b.remote_control_key_id, b.sid)
    end)
    local n,m=0,0
    for i,v in ipairs(a) do
      if v.service_type==1 then
        --地デジ優先ソート
        if NetworkType(v.onid)=='地デジ' then
          n=n+1
          table.insert(sort,n,v)
        elseif NetworkType(v.onid)=='BS' then
          m=m+1
          table.insert(sort,n+m,v)
        else
          table.insert(sort,v)
        end
      end
    end
  end
  return sort
end

--URIをタグ装飾する
function DecorateUri(s)
  local i=1
  while i<=#s do
    if s:find('^http',i) or s:find('^ｈｔｔｐ',i) then
      local hw='&/:;%#$?()~.=+-_0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
      local fw='＆／：；％＃＄？（）￣．＝＋－＿０１２３４５６７８９ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ'
      local j,href=i,''
      while j<=#s do
        local k=hw:find(s:sub(j,j),1,true)
        if k then
          href=href..hw:sub(k,k)
          j=j+1
        else
          k=fw:find(s:sub(j,j+2),1,true)
          if j+2<=#s and k and k%3==1 then
            href=href..hw:sub((k+2)/3,(k+2)/3)..(k==1 and 'amp;' or '')
            j=j+3
          else
            break
          end
        end
      end
      if href:find('^https?://.') then
        href='<a href="'..href..'" target="_blank">'..s:sub(i,j-1)..'</a>'
        s=s:sub(1,i-1)..href..s:sub(j)
        i=i+#href-(j-i)
      end
    end
    i=i+1
  end
  return s
end

--時間の文字列を取得する
function FormatTimeAndDuration(t,dur)
  dur=dur and (t.hour*3600+t.min*60+t.sec+dur)
  return string.format('%d/%02d/%02d(%s) %02d:%02d',t.year,t.month,t.day,({'日','月','火','水','木','金','土',})[t.wday],t.hour,t.min)
    ..(t.sec~=0 and string.format('<small>:%02d</small>',t.sec) or '')
    ..(dur and string.format('～%02d:%02d',math.floor(dur/3600)%24,math.floor(dur/60)%60)..(dur%60~=0 and string.format('<small>:%02d</small>',dur%60) or '') or '')
end

--レスポンスを生成する
function Response(code,ctype,charset,cl)
  return 'HTTP/1.1 '..code..' '..mg.get_response_code_text(code)
    ..'\r\nX-Frame-Options: SAMEORIGIN'
    ..(ctype and '\r\nX-Content-Type-Options: nosniff\r\nContent-Type: '..ctype..(charset and '; charset='..charset or '') or '')
    ..(cl and '\r\nContent-Length: '..cl or '')
    ..(mg.keep_alive(not not cl) and '\r\n' or '\r\nConnection: close\r\n')
end

--コンテンツを連結するオブジェクトを生成する
function CreateContentBuilder(thresh)
  local self={ct={''},len=0,thresh_=thresh}
  function self:Append(s)
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
  function self:Finish()
    if self.gzip and self.stream_ then
      self.ct[#self.ct+1]=self.stream_()
      self.len=self.len+#self.ct[#self.ct]
    end
    self.stream_=nil
  end
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

--クエリパラメータを整数チェックして取得する
function GetVarInt(qs,n,ge,le,occ)
  n=tonumber(mg.get_var(qs,n,occ))
  if n and n==math.floor(n) and n>=(ge or -2147483648) and n<=(le or 2147483647) then
    return n
  end
  return nil
end
