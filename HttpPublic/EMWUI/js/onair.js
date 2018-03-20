function getTime(time){
	var date = new Date(time);
	return ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2)
}

function getEvent(event){
	var startTime = event.children('startTime').text();
	var start = new Date(event.children('startDate').text()+' '+startTime).getTime();
	var duration = Number(event.children('duration').text());
 	return {
		eid: event.children('eventID').text(),
		title: ConvertTitle(event.children('event_name').text()),
		start: (duration==0 ? Date.now() : start),
		end: (duration==0 ? Date.now()+5*60*1000 : start+duration*1000) ,
		startTime: startTime.match(/(\d+:\d+):\d+/)[1],
		endTime: (duration==0 ? '未定' : getTime(start+duration*1000)),
		duration: (duration==0 ? 5*60 : duration)
	}
}

function getEPG(obj){
	var data = obj.data();
	$.get(root + 'api/EnumEventInfo?onair=&onid=' + data.onid + '&tsid=' + data.tsid + '&sid=' + data.sid).done(function(xhr){
		if ($(xhr).find('eventinfo').length > 0){
			var x=getEvent( $($(xhr).find('eventinfo')[0]) );
			var y=getEvent( $($(xhr).find('eventinfo')[1]) );
			var data = {
				eid: x.eid,
		    	nexteid: y.eid,
				duration: x.duration,
		    	start: x.start,
		    	end: x.end
			};
			obj.data(data).find('.startTime').text(x.startTime).next('.endTime').text('～' + x.endTime);
			obj.find('.title').html(x.title);
			obj.find('.nextstartTime').text(y.startTime).next('.nextendTime').text('～' + y.endTime);
			obj.find('.nexttitle').html(y.title);
		}
	});
}

$(function(){
    $('.mdl-progress').first().on('mdl-componentupgraded', function() {
		setInterval(function(){
			$('.is-active>.onair').each(function(){
				var data = $(this).data();
				if (data.end < Date.now()){
					getEPG($(this));
				}else{
					var progress = (Date.now() - data.start) / data.duration / 10;
					$(this).children('.mdl-progress').get(0).MaterialProgress.setProgress(progress);
				}
			});
		},1000);
    });

	$('span.epginfo').click(function(){
		var data = $(this).parents('li').clone(true).data();
		if ($(this).hasClass('next')){
			data.next = true;
			data.id = data.nextid;
			data.eid = data.nexteid;
		}

		if (data.eid!=0){
			if ($(this).hasClass('panel')){
				getEpgInfo($(this).parents('li'), data);
			}else{
				window.open('epginfo.html?onid=' + data.onid + '&tsid=' + data.tsid + '&sid=' + data.sid + '&eid=' + data.eid, '_blank');
			}
		}else{
			$('.mdl-js-snackbar').get(0).MaterialSnackbar.showSnackbar({message: 'この時間帯の番組情報がありません'});
			$('#sidePanel, .open').removeClass('is-visible open');
		}
	});
});

