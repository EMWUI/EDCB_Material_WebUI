function ConvertTitle(title)
  local MARK='mark mdl-color--accent mdl-color-text--accent-contrast'
  local title=title:gsub('%[(新)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(終)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(再)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(交)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(映)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(手)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(声)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(多)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(字)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(二)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(Ｓ)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(Ｂ)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(SS)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(無)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(Ｃ)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(S1)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(S2)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(S3)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(MV)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(双)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(デ)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(Ｄ)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(Ｎ)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(Ｗ)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(Ｐ)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(HV)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(SD)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(天)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(解)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(料)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(前)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(後)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(初)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(生)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(販)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(吹)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(PPV)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(演)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(移)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(他)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('%[(収)%]', '<span class="'..MARK..'">%1</span>')
    :gsub('　', ' ')
  return title
end


function ConvertSearch(v, service_name)
  local title=mg.url_encode(v.shortInfo.event_name:gsub('＜.-＞', ''):gsub('【.-】', ''):gsub('%[.-%]', ''):gsub('（.-版）', '') or '')
  local startTime=os.time(v.startTime)
  local endTime=v.durationSecond and startTime+v.durationSecond or startTime
  local text_char=v.shortInfo.text_char:gsub('%%', '%%%%')
  local search='<a class="mdl-button mdl-js-button mdl-button--icon" href="search.html?andkey='..title..'"><i class="material-icons">search</i></a>'
    ..'<a class="mdl-button mdl-js-button mdl-button--icon" href="https://www.google.co.jp/search?q='..title..'" target="_blank"><img class="material-icons" src="'..(ct.path or '')..'img/google.png" alt="Google検索"></a>'
    ..'<a class="mdl-button mdl-js-button mdl-button--icon" href="https://www.google.co.jp/search?q='..title..'&btnI=Im+Feeling+Lucky" target="_blank"><i class="material-icons">sentiment_satisfied</i></a>'
    ..'<a class="mdl-button mdl-js-button mdl-button--icon mdl-cell--hide-phone mdl-cell--hide-tablet" href="https://www.google.com/calendar/render?action=TEMPLATE&text='..title..'&location='..mg.url_encode(service_name)..'&dates='..os.date('%Y%m%dT%H%M%S', startTime)..'/'..os.date('%Y%m%dT%H%M%S', endTime)..'&details='..mg.url_encode(details:gsub('%%text_char%%', text_char):gsub('%%br%%', '\n') or '')..'&authuser='..authuser..'" target="_blank"><i class="material-icons">event</i></a>'
  return search
end
