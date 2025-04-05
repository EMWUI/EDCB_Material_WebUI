-- WebAssemblyスレッド対応のため特定のファイルにCOEP/COOPヘッダをつけて返すスクリプト
dofile(mg.script_name:gsub('js/[^\\/]*$','')..'util.lua')

t=mg.get_var(mg.request_info.query_string,'t')
f=nil
if t=='.js' or t=='.worker.js' or t=='.wasm' or t=='-misc.js' or t=='-misc.wasm' then
  f=edcb.io.open(mg.script_name:gsub('[^\\/]*$','')..'ts-live'..t,'rb')
end

if not f then
  mg.write(Response(404,nil,nil,0)..'\r\n')
else
  s=f:read('*a') or ''
  f:close()
  if t=='.js' then
    -- "ts-live.js"に含まれる文字列ts-live.{worker.js,wasm}を置換
    s=s:gsub('(ts%-live)(%.worker%.js["\'])','%1.lua?t=%2'):gsub('(ts%-live)(%.wasm["\'])','%1.lua?t=%2')
  elseif t=='-misc.js' then
    -- "ts-live-misc.js"に含まれる文字列ts-live-misc.wasmを置換
    s=s:gsub('(ts%-live)(%-misc%.wasm["\'])','%1.lua?t=%2')
  end
  ct=CreateContentBuilder(GZIP_THRESHOLD_BYTE)
  ct:Append(s)
  ct:Finish()
  mg.write(ct:Pop(Response(200,'application/'..(t:find('js$') and 'javascript' or 'wasm'),t:find('js$') and 'utf-8',ct.len,ct.gzip,3600)
    ..'Cross-Origin-Embedder-Policy: require-corp\r\n'
    ..'Cross-Origin-Opener-Policy: same-origin\r\n'
    ..'\r\n'))
end
