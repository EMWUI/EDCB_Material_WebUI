Param( $onid, $tsid, $sid, $UDP )

$epgTimerExePath = Join-Path (Split-Path $MyInvocation.MyCommand.Path -Parent) ..\EpgTimer.exe
[void][Reflection.Assembly]::LoadFile($epgTimerExePath)
$cmd = New-Object EpgTimer.CtrlCmdUtil

if ($onid){
	if ($UDP){
		$cmd.SendNwTVMode(1)	#UDP
	}else{
		$cmd.SendNwTVMode(2)	#TCP
	}

	$ch = New-Object EpgTimer.SetChInfo
	$ch.useSID = 1
	$ch.ONID= $onid
	$ch.TSID= $tsid
	$ch.SID = $sid

	$cmd.SendNwTVSetCh($ch)
}else{
	$cmd.SendNwTVClose()
}
