ver='0.2.1'

--Windowsかどうか
WIN32=not package.config:find('^/')

--OSのディレクトリ区切りとなる文字集合
DIR_SEPS=WIN32 and '\\/' or '/'

--OSの標準ディレクトリ区切り
DIR_SEP=WIN32 and '\\' or '/'

dofile(mg.document_root:gsub('['..DIR_SEPS..']*$',DIR_SEP)..'api'..DIR_SEP..'util.lua')

rsdef=(edcb.GetReserveData(0x7FFFFFFF) or {}).recSetting

-- ナビゲーション項目の定義
navList={
  {hash='#epg', icon='calendar_view_month', title='番組表', bottom=true},
  {hash='#epgweek', icon='view_week', title='週間', full='週間番組表'},
  {hash='#onair', icon='live_tv', title='放送中'},
  {hash='#tvcast', icon='cast_connected', title='リモート', full='リモート視聴'},
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
      <i>%s</i><span x-show="!sidebarActive">%s</span><span x-show="sidebarActive">%s</span>
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

function GetGenreChip()
  local s=''
  for _i,i in ipairs({0,1,2,3,4,5,6,7,8,9,10,11,12,13,0x60,0x61,0x62,0x63,0x64,0x65,0x66,0x67,0x70,0x71,0x72,0x73,0x74,0x75,0x76,0x77,15,255}) do
    local nibble1=edcb.GetGenreName(i*256+255)
    if nibble1~='' then
      s=s..string.format([[
                  <div class="chip" :class="(set.genreMask & (1 << %d)) ? 'primary' : ''" @click="set.genreMask ^= (1 << %d)">%s</div>
]], _i-1, _i-1, nibble1)
    end
  end
  return s
end

function GetGenreOption()
  local s=''
  for _i,i in ipairs({0,1,2,3,4,5,6,7,8,9,10,11,12,13,0x60,0x61,0x62,0x63,0x64,0x65,0x66,0x67,0x70,0x71,0x72,0x73,0x74,0x75,0x76,0x77,15,255}) do
    local nibble1=edcb.GetGenreName(i*256+255)
    if nibble1~='' then
      s=s..string.format([[
                  <option value="%d" x-show="set.genreMask & (1 << %d)">%s
]], i*256+255, _i-1, nibble1)
      for j=0,15 do
        local nibble2=edcb.GetGenreName(i*256+j)
        if nibble2~='' then
          s=s..string.format([[
                    <option value="%d" x-show="(set.subGenre && set.genreMask & (1 << %d))">　%s
]], i*256+j, _i-1, nibble2)
        end
      end
    end
  end

  return s
end

function GetServiceOption()
  local s=''
  for i,v in ipairs(SortServiceListInplace(SelectChDataList(edcb.GetChDataList()))) do
    s=s..string.format([[
      <option value="%d-%d-%d"%s>(%s)%s
]],v.onid, v.tsid, v.sid, (v.searchFlag and ' class="def"' or ''), NetworkType()[NetworkIndex(v.onid, v.partialFlag, true)], v.serviceName)
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

function GetTunerIDOption()
  local a=edcb.GetTunerReserveAll()
  local s='<option value="0">自動</option>\n'
  for i=1,#a-1 do
    s=s..string.format([[
                <option value="%d">ID:%08X(%s)
]], a[i].tunerID, a[i].tunerID, a[i].tunerName)
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
  return s..'                </datalist>\n'
end

minTime=nil
maxTime=nil
for i,v in ipairs(SelectChDataList(edcb.GetChDataList())) do
  local mmt=edcb.GetEventMinMaxTime(v.onid, v.tsid, v.sid)
  if mmt then
    maxTime=math.max(maxTime or 0,TimeWithZone(mmt.maxTime))
    minTime=math.min(minTime or maxTime,TimeWithZone(mmt.minTime))
    minTime_=math.min(minTime_ or maxTime,TimeWithZone(mmt.minTime))
  end
  mmt=edcb.GetEventMinMaxTimeArchive and edcb.GetEventMinMaxTimeArchive(v.onid, v.tsid, v.sid)
  if mmt then
    maxTime=math.max(maxTime or 0,TimeWithZone(mmt.maxTime))
    minTime=math.min(minTime or maxTime,TimeWithZone(mmt.minTime))
  end
end
