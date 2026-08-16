app='260816'
tsloader='260726'
beer='5.0.3'
mdc='1.1.4'
alpine='3.15.12'
hls='v1.5.20'
aribb24='v1.11.5'
bml='288052c'
danmaku='6c13364'

--Windowsかどうか
WIN32=not package.config:find('^/')

--OSのディレクトリ区切りとなる文字集合
DIR_SEPS=WIN32 and '\\/' or '/'

--OSの標準ディレクトリ区切り
DIR_SEP=WIN32 and '\\' or '/'

dofile(mg.document_root:gsub('['..DIR_SEPS..']*$',DIR_SEP)..'api'..DIR_SEP..'util.lua')

function GetAppConfig()
  local minTime, maxTime = nil, nil
  for i,v in ipairs(SelectChDataList(edcb.GetChDataList())) do
    local mmt=edcb.GetEventMinMaxTime(v.onid, v.tsid, v.sid)
    if mmt then
      maxTime=math.max(maxTime or 0,TimeWithZone(mmt.maxTime))
      minTime=math.min(minTime or maxTime,TimeWithZone(mmt.minTime))
    end
    mmt=edcb.GetEventMinMaxTimeArchive and edcb.GetEventMinMaxTimeArchive(v.onid, v.tsid, v.sid)
    if mmt then
      maxTime=math.max(maxTime or 0,TimeWithZone(mmt.maxTime))
      minTime=math.min(minTime or maxTime,TimeWithZone(mmt.minTime))
    end
  end

  local useSsePort=tonumber(edcb.GetPrivateProfile('E3','useSsePort',false,INI))~=0 and 'true' or 'false'
  local rsdef=((edcb.GetReserveData(0x7FFFFFFF) or {}).recSetting or {})

  local function EdcbFindFilePlain(path)
    return edcb.FindFile and edcb.FindFile(path, 1) or edcb.FindFilePlain and edcb.FindFilePlain(path)
  end

  local edcbnosuspend=edcb.GetPrivateProfile('SET','ModulePath','','Common.ini')..'\\Tools\\edcbnosuspend.exe'
  local hasNosuspend=WIN32 and EdcbFindFilePlain(edcbnosuspend)
  local nosuspendActive=false
  if hasNosuspend then
    local onstat, stat, code=edcb.os.execute('tasklist /fi "imagename eq edcbnosuspend.exe" /fo csv /nh | find /i "edcbnosuspend.exe"')
    nosuspendActive=(onstat and stat=='exit' and code==0)
  end

  return '{root: \''..PathToRoot()
    ..'\', useSsePort: '..useSsePort
    ..', epgTimeRange: { min: '..(minTime or 0)..', max: '..(maxTime or 0)..' },'
    ..' rsdef: {'
    ..' serviceMode: '..(rsdef.serviceMode or 0)
    ..', startMargin: '..(rsdef.startMargin or 0)
    ..', endMargin: '..(rsdef.endMargin or 0)
    ..' },'
    ..' hasNosuspend: '..(hasNosuspend and 'true' or 'false')..','
    ..' nosuspendActive: '..(nosuspendActive and 'true' or 'false')..','
    ..' enableSuspend: '..(INDEX_ENABLE_SUSPEND and 'true' or 'false')..','
    ..' suspendMode: \''..(INDEX_SUSPEND_USE_HIBERNATE and 'hibernate' or 'suspend')..'\','
    ..'}'
end

-- ナビゲーション項目の定義
navList={
  {hash='#epg', icon='calendar_view_month', title='番組表', bottom=true},
  {hash='#epgweek', icon='view_week', title='週間', full='週間番組表'},
  {hash='#onair', icon='live_tv', title='放送中'},
  {hash='#watch', icon='cast_connected', title='リモート', full='リモート視聴'},
  {hash='#reserve', icon='event_upcoming', title='予約一覧', bottom=true},
  {hash='#tunerreserve', icon='settings_input_component', title='ﾁｭｰﾅｰ別', full='チューナー別予約'},
  {hash='#autoaddepg', icon='published_with_changes', title='EPG予約'},
  {hash='#autoaddmanual', icon='more_time', title='プロ予約', full='プログラム自動予約'},
  {hash='#library', icon='video_library', title='ﾗｲﾌﾞﾗﾘ', full='ライブラリ'},
  {hash='#recinfo', icon='history', title='録画結果', bottom=true},
  {hash='#search', icon='search', title='検索'},
  {space=true},
  {hash='#setting', icon='settings', title='設定'},
  {hash='#dashboard', icon='info', title='情報', bottom=true}
}

link=''
link_bottom=''
link_drawer=''

for i, v in ipairs(navList) do
  -- PC用サイドバー
  link=link..(v.space and '    <div class="max"></div>\n' or string.format([[
    <a href='%s' :class="page === '%s' ? 'active' : ''">
      <i>%s</i><span x-show="!set.sidebar">%s</span><span x-show="set.sidebar">%s</span>
    </a>
]], v.hash, v.hash, v.icon, v.title, v.full or v.title))

  if (v.bottom) then
    link_bottom=link_bottom..string.format([[
    <a href='%s' :class="page === '%s' ? 'active' : ''">
      <i>%s</i><span>%s</span>
    </a>
]], v.hash, v.hash, v.icon, v.title)
  end

  -- スマホ用ドロワー
  link_drawer=link_drawer..(v.space and '' or string.format([[
      <li class="wave round" :class="page === '%s' ? 'secondary-container' : ''">
        <a href='%s' :class="page === '%s' ? 'active' : ''" data-ui="#drawer">
          <i>%s</i>
          <div>%s</div>
        </a>
      </li>
]], v.hash, v.hash, v.hash, v.icon, v.full or v.title))
end

function GetCredit(sidebar)
  return [=[    <hr class="medium"]=]..(sidebar and ' x-show="set.sidebar"' or '') .. [=[>
    <div class="horizontal-padding"]=]..(sidebar and ' x-show="set.sidebar"' or '') .. [=[>
      <nav class="no-space">
        <span class="right-margin small-margin"><i class="small right-margin tiny-margin">copyright</i><span>EMWUI</span></span>
        <a class="button transparent circle tiny" href="https://github.com/EMWUI/EDCB_Material_WebUI" target="_blank" rel="noreferrer"><i class="link tiny">feedback</i></a>
        <a class="button transparent circle tiny" href="https://www.amazon.jp/hz/wishlist/ls/1FFBR5ZLZK8EY" target="_blank" rel="noreferrer"><i class="link tiny">featured_seasonal_and_gifts</i></a>
      </nav>
]=]..((SHOW_DEBUG_LOG or SHOW_NOTIFY_LOG) and '      <nav class="no-margin">\n'
  ..(SHOW_NOTIFY_LOG and '        <span class="link small-text" @click="log.show()">情報通知ログ</span>\n' or '')
  ..(SHOW_DEBUG_LOG and '        <span class="link small-text" @click="log.show(true)">デバッグ出力</span>\n' or '')
  ..'      </nav>\n' or '')..[=[
    </div>
]=]
end

function GetServiceOption()
  local s=''
  for i,v in ipairs(SortServiceListInplace(SelectChDataList(edcb.GetChDataList()))) do
    s=s..string.format([[
      <option value="%d-%d-%d"%s x-show="%s || set.oneseg">(%s)%s
]],v.onid, v.tsid, v.sid, (v.searchFlag and ' class="def"' or ''), not v.partialFlag, NetworkType()[NetworkIndex(v.onid, v.partialFlag, true)], v.serviceName)
  end
  return s
end

function GetPlugInFileNameOption(a)
  local s=''
  for i,v in ipairs(EnumPlugInFileName(a)) do
    s=s..string.format([[
                    <option value="%s">%s
]], v, v)
  end
  return s
end

function GetBatFilePathOption()
  local CurrentDir=edcb.GetPrivateProfile('SET','ModulePath','','Common.ini')
  local batDir=edcb.GetPrivateProfile('SET','batPath',PathAppend(CurrentDir,'bat'),INI)
  local s=''
  for i,v in ipairs(edcb.FindFile(PathAppend(batDir,'*'), 0) or {}) do
    if not v.isdir and (v.name:find('%.[Bb][Aa][Tt]$') or v.name:find('%.[Pp][Ss]1$') or v.name:find('%.[Ll][Uu][Aa]$')) or v.name:find('%.[Ss][Hh]$') then
      local batPath=PathAppend(batDir,v.name)
      s=s..string.format([[
                    <option value="%s">%s
]], batPath, v.name)
    end
  end
  return s
end

function GetbatFileTagList()
  local s='<datalist id="batFileTagList">\n'
  for v in edcb.GetPrivateProfile('set','batFileTag','',INI):gmatch('[^,]+') do
    s=s..string.format([[
                    <option value="%s">
]], v)
  end
  return s..'                  </datalist>\n'
end

function GetPlayerOption(tslive)
  local zip = NVRAM_ZIP:match('^'..('[0-9]'):rep(7)..'$')
  local prefecture=math.floor(math.max(NVRAM_REGION<=50 and NVRAM_REGION or 0,0))
  return (tslive and (autoCinema and ' autoCinema' or '')..(deinterlace and ' deinterlace="'..deinterlace..'"' or '')
    or (ALWAYS_USE_HLS and ' alwaysUseHls' or '')..(USE_MP4_HLS and ' hls4="'..(USE_MP4_LLHLS and '2"' or '1"') or '')
      ..(ARIBB24_USE_SVG and ' data-aribb24-use-svg="1"' or '')..' data-aribb24-option-json="'..mg.url_encode(ARIBB24_OPTION_JSON))

    ..(zip and '" data-absent-zip="'..zip or '')
    ..(prefecture~=0 and '" data-absent-prefecture="'..prefecture or '')..(prefecture~=0 and '" data-absent-region="'..GetEwsRegionCode(prefecture) or '')

    ..((USE_LIVEJK or JKRDLOG_PATH) and '" data-comment-height="'..JK_COMMENT_HEIGHT..'" data-comment-duration="'..JK_COMMENT_DURATION..'" data-comment-ctok="'..CsrfToken('comment')..'" data-custom-replace-json="'..mg.url_encode(JK_CUSTOM_REPLACE_JSON)..'" data-comment-api="{'..mg.url_encode('"jklog":"'..PathToRoot()..'api/jklog","comment":"'..PathToRoot()..'api/comment"}') or '')
    ..'" data-ctok-view="'..CsrfToken('view')..'" data-ctok-xcode="'..CsrfToken('xcode')..'"'
end

function GetVideoOption()
  local s=''
  for i,v in ipairs(XCODE_OPTIONS) do
    if v.tslive or not ALLOW_HLS or not ALWAYS_USE_HLS or v.outputHls then
      if v.tslive then
        autoCinema=v.autoCinema
        deinterlace=v.deinterlace
      end
      s=s..'<li :class="{ active: set.quality === '..i..' }" @click=setQuality('..i..','..(v.tslive and 'true) x-show="window.isSecureContext && navigator.gpu"' or 'false)')..'>'..EdcbHtmlEscape(v.name)..'</li>\n'
    end
  end
  return s
end
function GetVideoRate()
  local has1=false
  local s=''
  for i,v in ipairs(XCODE_FAST_RATES) do
    if not has1 and v==1 then
      has1=true
      i=0
    end
    s=s..'<li :class="{ active: playbackRate === '..v..' }"  @click="setPlaybackRate('..v..','..i..')">'..(v==1 and '標準' or v..(math.fmod(v,1)==0 and '.0' or ''))..'</li>\n'
  end
  return s
end

function GetJkList()
  dofile(mg.document_root:gsub('['..DIR_SEPS..']*$',DIR_SEP)..'api'..DIR_SEP..'jkconst.lua')
  local jkList=GetChatStreamNameList()
  local s=''
  if jkList then
    for i,v in ipairs(jkList) do
      s=s..'<option value="'..v[1]..'">jk'..v[1]..' ('..EdcbHtmlEscape(v[2])..')\n'
    end
  end
  return s
end

function GetBonList()
  local bonList={}
  for i,v in ipairs(edcb.GetTunerReserveAll()) do
    if #bonList==0 or bonList[#bonList]~=v.tunerName then
      bonList[#bonList+1]=v.tunerName
    end
  end
  table.remove(bonList)
  local s=''
  for i,v in ipairs(bonList) do
    s=s..string.format([[    <option>%s</option>]], v)
  end
  return s
end
