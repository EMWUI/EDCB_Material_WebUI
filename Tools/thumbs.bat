@echo off

setlocal

rem サムネフォルダ
set OUT=%~dp0\..\HttpPublic\thumbs

rem ffmpeg.exe
set FFM=%~dp0\ffmpeg.exe

if not exist "%OUT%" mkdir "%OUT%"

:loop

if "%~1" == "" goto end

"%FFM%" -i "%~1" -ss 15 -vframes 1 -f image2 -s 480x270 "%OUT%\%~n1.jpg"

shift /1

goto loop

:end

endlocal
