$(function(){
	//ストレージ容量
	$('.mdl-js-progress:first').on('mdl-componentupgraded', () => {
		$.get(`${ROOT}api/Common`, {storage: 1, json: 1}).done(d => {
			d.forEach(d => {
				$(`#d_${d.id} .text`).text(d.text);
				$(`#d_${d.id} .mdl-progress`).removeClass('mdl-progress__indeterminate').get(0).MaterialProgress.setProgress(100-(d.free/d.total*100));
			})
		});
	});
	//背景色連動
	$('.bgset').change(e => $($(e.currentTarget).attr('for')).css(`--color`, $(e.currentTarget).val()));
	//予約済み
	$('.reserveset').change(e => $(`#${$(e.currentTarget).attr('for')}`).css(`--${$(e.currentTarget).attr('for')}`, $(e.currentTarget).val()));
	//一部録画・チューナー不足枠
	$('.border').change(e => $(`#${$(e.currentTarget).attr('for')}`).css(`--${$(e.currentTarget).attr('for')}_sub`, $(e.currentTarget).val()));
	//塗潰し
	$('#paint').change(e => $('.background').toggleClass('bg-paint'));
	$('#cb-line').change(e => $('.background').toggleClass('bg-line'));

	//並び替え
	$('#sort ul').sortable({handle: '.handle'});
	//初期値保存
	$('#sort .mdl-list').each((i, e) => $(e).data('sort', $(e).sortable('toArray').join(',')));

	$('.switch').change(e => $($(e.currentTarget).attr('for')).prop('checked', !$(e.currentTarget).prop('checked')));

	//元に戻す
	$('#reinstate').click(e => {
		//設定
		$('#set')[0].reset();
		//見た目
		$('[class*=cont-],.background').removeAttr('style');
		$('.background').toggleClass('bg-paint', $('#paint').prop('checked'));
		$('.background').toggleClass('bg-line', $('#cb-line').prop('checked'));
		$('#set input').not('.hidden').each((i, e) => $(e).parent().toggleClass('is-checked', $(e).prop('checked')));
		//並び替え
		$('#sort .mdl-list').each((i, e) => $(e).data('sort').split(',').forEach(v => $(`#${v}`).appendTo(e)) );
		Snackbar('元に戻しました');
	});

	$('.mdl-layout__tab').click(e => {
		const val = $(e.currentTarget).data('val');
		$('.init').hide().data('text', $(e.currentTarget).text());
		$(`.${val}`).show();
		$('[name=reset]').val(val);
	});

	$('#reset').submit(e => {
		e.preventDefault();
		fetch('setting.html', {
			method: 'POST',
			body: new URLSearchParams(new FormData(e.currentTarget))
		}).then(r=>r.json()).then(r=>{
			Snackbar(r.messege);
			location.reload();
		});
	});
	$('#set').submit(e => {
		e.preventDefault();
		fetch('setting.html', {
			method: 'POST',
			body: new URLSearchParams(new FormData(e.currentTarget))
		}).then(r=>r.json()).then(r=>Snackbar(r.messege));
	});

	//初期化
	const dialog = document.querySelector('dialog');
	if (!dialog.showModal) dialogPolyfill.registerDialog(dialog);
	$('.init').click(e => {
		$('.mdl-dialog__content').text(`"${$(e.currentTarget).data('text')}"を初期化しますか?`);
	    dialog.showModal();
	});
});