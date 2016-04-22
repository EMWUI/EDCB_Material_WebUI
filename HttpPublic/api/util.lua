--POSTメッセージボディをすべて読む
function ReadPost()
  local post, s
  if mg.request_info.request_method=='POST' then
    post=''
    repeat
      s=mg.read()
      post=post..(s or '')
    until not s
    if #post~=mg.request_info.content_length then
      post=nil
    end
  end
  return post
end

--CSRFトークンを取得する
--※このトークンを含んだコンテンツを圧縮する場合はBEAST攻撃に少し気を配る
function CsrfToken()
  return edcb.serverRandom and edcb.serverRandom:sub(1,16) or ''
end

--CSRFトークンを検査する
--※サーバに変更を加える要求(POSTに限らない)を処理する前にこれを呼ぶべき
function AssertCsrf(qs)
  if edcb.serverRandom and mg.get_var(qs,'ctok')~=edcb.serverRandom:sub(1,16) then
    error('failed')
  end
end
