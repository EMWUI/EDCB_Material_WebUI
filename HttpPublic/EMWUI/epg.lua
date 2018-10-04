dofile(mg.script_name:gsub('[^\\/]*$','')..'util.lua')

oneseg=tonumber(edcb.GetPrivateProfile('GUIDE','oneseg',false,ini))~=0
hover=tonumber(edcb.GetPrivateProfile('GUIDE','hover',false,ini))~=0
ONE_MIN_PX=edcb.GetPrivateProfile('GUIDE','ONE_MIN_PX','4',ini)
MARGIN_HOUR=edcb.GetPrivateProfile('GUIDE','MARGIN_HOUR','1',ini)
MARGIN_MIN=edcb.GetPrivateProfile('GUIDE','MARGIN_MIN','30',ini)
DEF_CH_COUNT=tonumber(edcb.GetPrivateProfile('GUIDE','CH_COUNT','0',ini))

local sp=UserAgentSP()
DEF_CH_COUNT=sp and 15 or DEF_CH_COUNT
DEF_interval=sp and  8 or 25

now=os.time()
timezone=now-os.time(os.date('!*t',now))

CATEGORY={
  'news',
  'sports',
  'information',
  'drama',
  'music',
  'variety',
  'movie',
  'anime',
  'documentary',
  'theater',
  'education',
  'welfare',
  'extension',
  'extension',
  'extension',
  'other',
}

function background(key, def)
  return '.'..key..'{background:'..edcb.GetPrivateProfile('BACKGROUND',key,def,ini)..';}'
end

function epgcss()
  local paint=tonumber(edcb.GetPrivateProfile('BACKGROUND','paint',false,ini))~=0
  return '<style>'
    ..'main{background:'..edcb.GetPrivateProfile('BACKGROUND','background','#EEEEEE',ini)
    ..';}.station{--width:'..edcb.GetPrivateProfile('GUIDE','service','210',ini)
    ..'px;}.hour-container{width:'..edcb.GetPrivateProfile('GUIDE','hour','22',ini)
    ..'px;}.hour{height:'..(ONE_MIN_PX*60)
    ..'px;}'

    ..background('news', '#B3E5FC')
    ..background('sports', '#FFF9C4')
    ..background('information', '#BBDEFB')
    ..background('drama', '#FFCDD2')
    ..background('music', '#FFECB3')
    ..background('variety', '#E1BEE7')
    ..background('movie', '#FFE0B2')
    ..background('anime', '#F8BBD0')
    ..background('documentary', '#C5CAE9')
    ..background('theater', '#DCEDC8')
    ..background('education', '#C8E6C9')
    ..background('welfare', '#B2DFDB')
    ..background('extension', '#FFFFFF')
    ..background('other', '#F5F5F5')
    ..background('none', '#E0E0E0')
    ..background('nothing', '#9E9E9E')

    ..'.content-wrap.reserve{'..(paint and 'border-color:transparent;background:' or 'border-color:')..edcb.GetPrivateProfile('BACKGROUND','reserved','#FF3D00',ini)
    ..';}.content-wrap.disabled{'..(paint and 'border-color:transparent;background:' or 'border-color:')..edcb.GetPrivateProfile('BACKGROUND','disable','#757575',ini)
    ..';}.content-wrap.partially{background:'..edcb.GetPrivateProfile('BACKGROUND','partially','#FFFF00',ini)..';border-color:'..edcb.GetPrivateProfile('BACKGROUND','partially_border','#FF3D00',ini)
    ..';}.content-wrap.shortage{background:'..edcb.GetPrivateProfile('BACKGROUND','shortage','#FF5252',ini)..';border-color:'..edcb.GetPrivateProfile('BACKGROUND','shortage_border','#FFEA00',ini)
    ..';}'

    ..'@media screen and (max-width:479px){.station{--width:'..edcb.GetPrivateProfile('GUIDE','service_sp','125',ini)
    ..'px;}.hour-container{width:'..edcb.GetPrivateProfile('GUIDE','hour_sp','16',ini)
    ..'px;}}'
    ..'</style>\n'
end

function epgjs(baseTime,option,lastTime)
  local titleControl=tonumber(edcb.GetPrivateProfile('GUIDE','titleControl',1+4+2+32,ini))
  return '<script>'
    ..'var oneminpx='..ONE_MIN_PX
    ..';var baseTime='..baseTime
    ..';var lastTime'..(lastTime and '='..lastTime or '')
    ..';var titleControl='..titleControl
    ..';var marginmin='..MARGIN_MIN
    ..';var hover='..(hover and 'true;' or 'false;')
    ..(option or '')
    ..'</script>\n<script src="js/tvguide.js"></script>\n'
end

function epgcell(v, op, id)
  local category=v.contentInfoList and #v.contentInfoList>0 and CATEGORY[math.floor(v.contentInfoList[1].content_nibble/256)%16+1] or 'none'	--背景色
  local title=v.shortInfo and ConvertTitle(v.shortInfo.event_name) or ''									--番組タイトル
  local info=v.shortInfo and '<div class="shortInfo mdl-typography--caption-color-contrast">'..DecorateUri(v.shortInfo.text_char):gsub('\r?\n', '<br>')..'</div>' or ''						--番組詳細
  local search=v.shortInfo and ConvertSearch(v, op.service_name) or ''									--検索

  local r=nil
  local rid=not v.past and rt[v.onid..'-'..v.tsid..'-'..v.sid..'-'..v.eid] or nil
  if rid then
    r=edcb.GetReserveData(rid)
  end
  local rs=r and r.recSetting or nil

  local mark=r and '<span class="mark reserve">'..(rs.recMode==5 and '無' or r.overlapMode==1 and '部' or r.overlapMode==2 and '不' or rs.recMode==4 and '視'or '録')..'</span>' or ''	--録画マーク
  local recmode=r and ' reserve'..(rs.recMode==5 and ' disabled' or r.overlapMode==1 and ' partially' or r.overlapMode==2 and ' shortage' or rs.recMode==4 and ' view' or '') or ''	--録画モード

  return '<div '..(id or '')..'class="cell eid_'..v.eid..(startTime<now and now<endTime and ' now ' or ' ')..'" data-endtime="'..endTime..'" style="'..(left and left>0 and 'left:calc(100%*'..(left..'/'..column)..');top:'..lastPx..'px;' or '')..'height:'..(endPx-lastPx)..'px;'..(width~=column and 'width:calc(100%*'..width..'/'..column..');' or '')..'">\n'
    ..'<div class="content-wrap '..category..recmode..(NOW and date==0 and endTime<=now and ' end' or '')..'"><div class="content">\n'

    ..'<div class="sub_cont"><div class="startTime">'..('%02d'):format(v.startTime.min)..'</div>'..mark..'</div>'

    ..'<div class="main_cont"><span class="mdl-typography--body-1-force-preferred-font">'..title..'</span>'..(v.durationSecond and v.durationSecond>=30*60 and info..'<div class="popup">' or '<div class="popup">'..info)
    ..'<span class="links"><a class="notify_'..v.eid..' notification notify hidden mdl-button mdl-button--icon" data-onid="'..v.onid..'" data-tsid="'..v.tsid..'" data-sid="'..v.sid..'" data-eid="'..v.eid..'" data-start="'..startTime..'"'..(startTime-30<=now and ' disabled' or '')..'><i class="material-icons">'..(startTime-30<=now and 'notifications' or 'add_alert')..'</i></a>'..search..'</span>\n'

    ..'<p class="tool mdl-typography--caption-color-contrast">'
    ..'<a class="mdl-button mdl-button--raised'
      ..(sidePanel and ' open_info" data-onid="'..v.onid..'" data-tsid="'..v.tsid..'" data-sid="'..v.sid..'" data-'..(v.past and 'startTime="'..startTime+timezone or 'eid="'..v.eid)
                    or '" href="'..op.url)..'">番組詳細</a>'
    ..(endTime~=startTime and now<endTime and '<a class="addreserve mdl-button mdl-button--raised" data-ctok="'..CsrfToken()..'" data-onid="'..v.onid..'" data-tsid="'..v.tsid..'" data-sid="'..v.sid..'" data-eid="'..v.eid								--終了前
      ..(r and '" data-toggle="1" data-id="'..rid..'">'..(rs.recMode==5 and '有効' or '無効')										--予約あり有効無効
            or '" data-oneclick="1">録画予約')..'</a>' or '')		--なし新規追加
    ..'<a class="autoepg mdl-button mdl-button--raised" data-andkey="'..(v.shortInfo and v.shortInfo.event_name or '')..'">EPG予約</a>'
    ..'</p>'

    ..'</div></div></div></div></div>\n'
end
