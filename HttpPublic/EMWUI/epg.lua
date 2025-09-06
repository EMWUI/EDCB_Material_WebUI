dofile(mg.script_name:gsub('[^\\/]*$','')..'util.lua')

ONESEG=tonumber(edcb.GetPrivateProfile('GUIDE','oneseg',false,INI))~=0
HOVER=tonumber(edcb.GetPrivateProfile('GUIDE','hover',false,INI))~=0
ONE_MIN_PX=edcb.GetPrivateProfile('GUIDE','ONE_MIN_PX','4',INI)
MARGIN_HOUR=edcb.GetPrivateProfile('GUIDE','MARGIN_HOUR','1',INI)
MARGIN_MIN=edcb.GetPrivateProfile('GUIDE','MARGIN_MIN','30',INI)
DEF_CH_COUNT=tonumber(edcb.GetPrivateProfile('GUIDE','CH_COUNT','0',INI))
DEF_INTERVAL=25

utc9Now=os.time()+9*3600

function EpgCssTemplate()
  local paint=tonumber(edcb.GetPrivateProfile('BACKGROUND','paint',false,INI))~=0
  return '<style>'
    ..'main{background:'..edcb.GetPrivateProfile('BACKGROUND','background','#EEEEEE',INI)
    ..';}.station{--width:'..edcb.GetPrivateProfile('GUIDE','service','210',INI)
    ..'px;}.hour-container{width:'..edcb.GetPrivateProfile('GUIDE','hour','22',INI)
    ..'px;}#tv-guide{--ONE_MIN_PX:'..ONE_MIN_PX
    ..';}'

    ..'.content-wrap.reserve{'..(paint and 'border-color:transparent;background:' or 'border-color:')..edcb.GetPrivateProfile('BACKGROUND','reserved','#FF3D00',INI)
    ..';}.content-wrap.disabled{'..(paint and 'border-color:transparent;background:' or 'border-color:')..edcb.GetPrivateProfile('BACKGROUND','disable','#757575',INI)
    ..';}.content-wrap.partially{background:'..edcb.GetPrivateProfile('BACKGROUND','partially','#FFFF00',INI)..';border-color:'..edcb.GetPrivateProfile('BACKGROUND','partially_border','#FF3D00',INI)
    ..';}.content-wrap.shortage{background:'..edcb.GetPrivateProfile('BACKGROUND','shortage','#FF5252',INI)..';border-color:'..edcb.GetPrivateProfile('BACKGROUND','shortage_border','#FFEA00',INI)
    ..';}'

    ..'@media screen and (max-width:479px){.station{--width:'..edcb.GetPrivateProfile('GUIDE','service_sp','125',INI)
    ..'px;}.hour-container{width:'..edcb.GetPrivateProfile('GUIDE','hour_sp','16',INI)
    ..'px;}}'
    ..'</style>\n'
end

function EpgJsTemplate(baseTime,NOW,date,lastTime)
  local titleControl=tonumber(edcb.GetPrivateProfile('GUIDE','titleControl',1+4+2+32,INI))
  return '<script src="js/tvguide.js'..Version('tvguide')..'"></script>\n'
    ..'<script>new TvGuide('
    ..ONE_MIN_PX..','
    ..baseTime..','
    ..MARGIN_MIN..','
    ..(lastTime and lastTime or 'null')..','
    ..titleControl..','
    ..(HOVER and 'true,' or 'false,')
    ..(NOW and 'true,' or 'false,')
    ..(date and 'true,' or 'false,')
    ..');const ctok=\''..CsrfToken('setreserve')
    ..'\';</script>\n'
end

function CellTemplate(v,op,id,custom)
  local category=v.contentInfoList and #v.contentInfoList>0 and math.floor(v.contentInfoList[1].content_nibble/256)%16+1 or 16	--背景色
  local title=v.shortInfo and ConvertTitle(v.shortInfo.event_name) or ''									--番組タイトル
  local info=v.shortInfo and '<div class="shortInfo mdl-typography--caption-color-contrast">'..DecorateUri(v.shortInfo.text_char):gsub('\r?\n', '<br>')..'</div>' or ''						--番組詳細
  local search=v.shortInfo and SearchConverter(v, op.service_name) or ''									--検索

  local r=nil
  local rid=not v.past and rt[v.onid..'-'..v.tsid..'-'..v.sid..'-'..v.eid] or nil
  if rid then
    r=edcb.GetReserveData(rid)
  end
  local rs=r and r.recSetting or nil

  local mark=r and '<span class="mark reserve">'..(rs.recMode==5 and '無' or r.overlapMode==1 and '部' or r.overlapMode==2 and '不' or rs.recMode==4 and '視'or '録')..'</span>' or ''	--録画マーク
  local recmode=r and ' reserve'..(rs.recMode==5 and ' disabled' or r.overlapMode==1 and ' partially' or r.overlapMode==2 and ' shortage' or rs.recMode==4 and ' view' or '') or ''	--録画モード

  return '<div '..(id or '')..'class="cell eid_'..v.eid..(startTime<utc9Now and utc9Now<endTime and ' now ' or ' ')..(custom and 'custom'or '')..'" data-endtime="'..(endTime-9*3600)..'" style="'..(left and left>0 and '--l:'..(left..'/'..column)..';--t:'..lastPx..';' or '')..'--h:'..(endPx-lastPx)..';'..(width~=column and '--w:'..width..'/'..column..';' or '')..'">\n'
    ..'<div class="content-wrap cont-'..category..recmode..(NOW and date==0 and endTime<=utc9Now and ' end' or '')..'"><div class="content">\n'

    ..'<div class="sub_cont">'..(custom and '<img src="'..PathToRoot()..'api/logo?onid='..v.onid..'&amp;sid='..v.sid..'">' or '')..'<div class="startTime">'..('%02d'):format(v.startTime.min)..'</div>'..mark..'</div>'

    ..'<div class="main_cont"><span class="mdl-typography--body-1-force-preferred-font">'..title..'</span>'..(v.durationSecond and v.durationSecond>=30*60 and info..'<div class="popup">' or '<div class="popup">'..info)
    ..'<span class="links"><a class="notify_'..v.eid..' notification notify hidden mdl-button mdl-button--icon" data-onid="'..v.onid..'" data-tsid="'..v.tsid..'" data-sid="'..v.sid..'" data-eid="'..v.eid..'" data-startTime="'..((startTime-9*3600)*1000)..'"'..(startTime-30<=utc9Now and ' disabled' or '')..'><i class="material-icons">'..(startTime-30<=utc9Now and 'notifications' or 'add_alert')..'</i></a>'..search..'</span>\n'

    ..'<p class="tool mdl-typography--caption-color-contrast">'
    ..'<a class="mdl-button mdl-button--raised'
      ..(SIDE_PANEL and ' open_info" data-onid="'..v.onid..'" data-tsid="'..v.tsid..'" data-sid="'..v.sid..'" data-'..(v.past and 'startTime="'..startTime or 'eid="'..v.eid)
                    or '" href="'..op.url)..'">番組詳細</a>'
    ..(endTime~=startTime and utc9Now<endTime and '<a class="addreserve mdl-button mdl-button--raised" data-onid="'..v.onid..'" data-tsid="'..v.tsid..'" data-sid="'..v.sid..'" data-eid="'..v.eid								--終了前
      ..(r and '" data-toggle="'..(rs.recMode==5 and 1 or 0)..'" data-id="'..rid..'">'..(rs.recMode==5 and '有効' or '無効')										--予約あり有効無効
            or '" data-oneclick="1">録画予約')..'</a>' or '')		--なし新規追加
    ..'<a class="autoepg mdl-button mdl-button--raised" data-andkey="'..(v.shortInfo and v.shortInfo.event_name or '')..'">EPG予約</a>'
    ..'</p>'

    ..'</div></div></div></div></div>\n'
end

function EpgMenuTemplate()
  return  '<li class="api_tools mdl-menu__item" data-epgcap="y" data-ctok="'..CsrfToken('common')..'">EPG取得</li>\n'
    ..'<li class="api_tools mdl-menu__item" data-epgreload="y" data-ctok="'..CsrfToken('common')..'">EPG再読み込み</li>\n'
end
