-- 局ロゴを転送するスクリプト
dofile(mg.script_name:gsub('[^\\/]*$','')..'util.lua')

-- LogoData.iniが見つからないとき局ロゴは公開フォルダ下の"img/logo/ONIDSID{.png|.bmp}"と仮定
TVTest_DIR=edcb.GetPrivateProfile('SET','ModulePath','','Common.ini'):gsub('[^\\/]*$','')..'TVTest'
LOGO_INI=edcb.GetPrivateProfile('SET','LOGO_INI',TVTest_DIR..'\\LogoData.ini',ini)
LOGO_DIR=edcb.GetPrivateProfile('SET','LOGO_DIR',TVTest_DIR..'\\Logo',ini)


onid=GetVarInt(mg.request_info.query_string,'onid',0,65535) or 0
sid=GetVarInt(mg.request_info.query_string,'sid',0,65535) or 0

if edcb.FindFile(LOGO_INI,1) then
  f=edcb.io.open(LOGO_INI,'rb')
  if f then
    -- ダウンロードデータ識別とServiceIDとの対応を調べる
    ddid=tonumber(f:read('*a'):upper():match(('\n%04X%04X=(%%d+)'):format(onid,sid)))
    f:close()
    if ddid then
      ff=edcb.FindFile(LOGO_DIR..('\\%04X_%03X_*'):format(onid,ddid),12) or {}
      -- ファイル名の末尾2桁はロゴタイプ(STD-B21)であると期待
      for i,v in ipairs({'05%.png','05%.bmp','02%.png','02%.bmp','04%.png','04%.bmp','01%.png','01%.bmp','03%.png','03%.bmp','00%.png','00%.bmp'}) do
        for j,w in ipairs(ff) do
          if w.name:lower():find(v..'$') then
            fname=w.name
            break
          end
        end
        if fname then
          f=edcb.io.open(LOGO_DIR..'\\'..fname,'rb')
          if f then
            logo=f:read('*a')
            f:close()
          end
          break
        end
      end
    end
  end
else
  fname=('%04X%04X.png'):format(onid,sid)
  f=edcb.io.open(DocumentToNativePath('img/logo/'..fname),'rb')
  if not f then
    fname=('%04X%04X.bmp'):format(onid,sid)
    f=edcb.io.open(DocumentToNativePath('img/logo/'..fname),'rb')
  end
  if f then
    logo=f:read('*a')
    f:close()
  end
end

if logo then
  mg.write(Response(200,mg.get_mime_type(fname),nil,#logo)..'ETag: '..mg.md5(logo)..'\r\nCache-Control: max-age=3600\r\n\r\n'..logo)
else
  -- 1x1gif
  mg.write(Response(200,'image/gif',nil,42)..'ETag: 0\r\nCache-Control: max-age=3600\r\n\r\nGIF89a\1\0\1\0\x80\0\0\0\0\0\xFF\xFF\xFF\x21\xF9\4\1\0\0\0\0\x2C\0\0\0\0\1\0\1\0\0\2\1\x44\0\x3B')
end
