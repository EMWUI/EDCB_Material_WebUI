$(function(){
	//ストレージ容量
	$('.mdl-js-progress:first').on('mdl-componentupgraded', () => {
		$.get(`${ROOT}api/Common`, {storage: 1}).done(xml => {
			$(xml).find('storage').each((i, e) => {
				const id = $(e).txt('id');
				$(`#d_${id} .text`).text($(e).txt('text'));
				$(`#d_${id} .mdl-progress`).removeClass('mdl-progress__indeterminate').get(0).MaterialProgress.setProgress($(e).txt('free'));
			})
		});
	});
	//背景色連動
	$('.bgset').change(e => $($(e.currentTarget).attr('for')).not('.paint').css('background', $(e.currentTarget).val()));
	//予約済み
	$('.reserveset').change(e => $($(e.currentTarget).attr('for')).css($('#paint').prop('checked') ? 'background' : 'border-color', $(e.currentTarget).val()));
	//一部録画・チューナー不足枠
	$('.border').change(e => $($(e.currentTarget).attr('for')).css('border-color', $(e.currentTarget).val()));
	//塗潰し
	$('#paint').change(e => {
		$('#reserve').toggleClass('paint', $(e.currentTarget).prop('checked')).css('background', $(e.currentTarget).prop('checked') ? $('#reserve .reserveset').val() : '').css('border-color', $(e.currentTarget).prop('checked') ? 'transparent' : $('#reserve .reserveset').val());
		$('#disabled').toggleClass('paint', $(e.currentTarget).prop('checked')).css('background', $(e.currentTarget).prop('checked') ? $('#disabled .reserveset').val() : '').css('border-color', $(e.currentTarget).prop('checked') ? 'transparent' : $('#disabled .reserveset').val());
	});
	if ($('#paint').prop('checked')){
		$('#reserve').addClass('paint').css('background', $('#reserve .reserveset').val());
		$('#disabled').addClass('paint').css('background', $('#disabled .reserveset').val());
	}

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
		$('.mdl-cell').css('background', '').css('border-color', '');
		if ($('#paint').prop('checked')){
			$('#reserve').addClass('paint').css('background', $('#reserve .reserveset').val());
			$('#disabled').addClass('paint').css('background', $('#disabled .reserveset').val());
		}
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

	//初期化
	const dialog = document.querySelector('dialog');
	if (!dialog.showModal) dialogPolyfill.registerDialog(dialog);
	$('.init').click(e => {
		$('.mdl-dialog__content').text(`"${$(e.currentTarget).data('text')}"を初期化しますか?`);
	    dialog.showModal();
	});
});