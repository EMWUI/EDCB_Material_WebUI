function getTime(time){
	var date = new Date(time);
	return ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2)
}

function updateEPG(obj){
	var time = obj.data('end') - new Date().getTime();
	setTimeout(function(){getEPG(obj);}, time);
}

function getEvent(event){
	var title = event.children('event_name').text().replace(/　/g,' ').replace(/\[(新|終|再|交|映|手|声|多|字|二|Ｓ|Ｂ|SS|無|Ｃ|S1|S2|S3|MV|双|デ|Ｄ|Ｎ|Ｗ|Ｐ|HV|SD|天|解|料|前|後|初|生|販|吹|PPV|演|移|他|収)\]/g,'<span class="mark mdl-color--accent mdl-color-text--accent-contrast">$1</span>');
	var textTime = event.children('startTime').text();
	var startTime = new Date(event.children('startDate').text()+' '+textTime).getTime();
	var duration = Number(event.children('duration').text());
 	return {
		eid: event.children('eventID').text(),
		title: title,
		textTime: textTime.match(/(\d+:\d+):\d+/)[1],
		startTime: startTime,
		endTime: startTime+duration*1000,
		duration: duration
	}
}

function getEPG(obj){
	var data = obj.data();
	$.get(root + 'api/EnumEventInfo?onair=&onid=' + data.onid + '&tsid=' + data.tsid + '&sid=' + data.sid).done(function(xhr){
		var event,  next, data;
		if ($(xhr).find('eventinfo').length > 0){
			event=getEvent( $($(xhr).find('eventinfo')[0]) );
			next=getEvent( $($(xhr).find('eventinfo')[1]) );
			data = {
				eid: event.eid,
		    	nexteid: next.eid,
				duration: event.duration,
		    	start: event.startTime/1000,
		    	end: event.endTime
			};
			obj.data(data).find('.startTime').text(event.textTime).next('.endTime').text('～' + getTime(event.endTime));
			obj.find('.title').html(event.title);
			obj.find('.nextstartTime').text(next.textTime).next('.nextendTime').text('～' + getTime(next.endTime));
			obj.find('.nexttitle').html(next.title);
			updateEPG(obj);
		}
	});
}

setInterval(function(){
	$('.mdl-layout__tab-panel.is-active>.mdl-list__item').each(function(){
		var data = $(this).data();
		if (data.end < Date.now()){
			updateEPG($(this));
		}else{
			var progress = (Date.now()/1000 - data.start) / data.duration  * 100;
			$(this).children('.mdl-progress').get(0).MaterialProgress.setProgress(progress);
		}
	});
},1000);

$(function(){
	$('.mdl-layout__tab-panel.is-active>.mdl-list__item').each(function(){
		updateEPG($(this));
	});

	$('span.epginfo').click(function(){
		var data = $(this).parents('li').clone(true).data();
		if ($(this).hasClass('next')) data.eid = data.nexteid;

		if ($(this).hasClass('panel')){
			getEpgInfo($(this).parents('li'), data);
		}else{
			window.open('epginfo.html?onid=' + data.onid + '&tsid=' + data.tsid + '&sid=' + data.sid + '&eid=' + data.eid, '_blank');
		}
	});
});

