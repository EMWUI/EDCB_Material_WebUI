$(function(){
	//背景色連動
	$('.bgset').change(function(){
		$($(this).attr('for')).not('.paint').css('background', $(this).val());
	});
	//予約済み
	$('.reserveset').change(function(){
		if ($('#paint').prop('checked')){
			$($(this).attr('for')).css('background', $(this).val());
		}else{
			$($(this).attr('for')).css('border-color', $(this).val());
		}
	});
	//一部録画・チューナー不足枠
	$('.border').change(function(){
			$($(this).attr('for')).css('border-color', $(this).val());
	});
	//塗潰し
	$('#paint').change(function(){
		if ($(this).prop('checked')){
			$('#reserve').addClass('paint').css('background', $('#reserve .reserveset').val()).css('border-color', 'transparent');
			$('#disabled').addClass('paint').css('background', $('#disabled .reserveset').val()).css('border-color', 'transparent');
		}else{
			$('#reserve').removeClass('paint').css('background', '').css('border-color', $('#reserve .reserveset').val());
			$('#disabled').removeClass('paint').css('background', '').css('border-color', $('#disabled .reserveset').val());
		}
	});
	if ($('#paint').prop('checked')){
			$('#reserve').addClass('paint').css('background', $('#reserve .reserveset').val());
			$('#disabled').addClass('paint').css('background', $('#disabled .reserveset').val());
	}

	//並び替え
	$('#sort ul').sortable({handle: '.handle'});
	//初期値保存
	$('#sort .mdl-list').each(function(){
		$(this).data('sort', $(this).sortable('toArray').join(','));
	});

	$('.switch').change(function(){
		if ($(this).prop('checked')){
			$($(this).attr('for')).prop('checked', false);
		}else{
			$($(this).attr('for')).prop('checked', true);
		}
	});

	//元に戻す
	$('#reinstate').click(function(){
		//設定
		$('#set')[0].reset();
		//見た目
		$('.mdl-cell').css('background', '').css('border-color', '');
		if ($('#paint').prop('checked')){
				$('#reserve').addClass('paint').css('background', $('#reserve .reserveset').val());
				$('#disabled').addClass('paint').css('background', $('#disabled .reserveset').val());
		}
		$('input').each(function(){
			if ($(this).prop('checked')){
				$(this).not('.hidden').parent().addClass('is-checked');
			}else{
				$(this).not('.hidden').parent().removeClass('is-checked');
			}
		});
		//並び替え
		$('#sort .mdl-list').each(function(){
			var obj = $(this);
			$.each(obj.data('sort').split(','), function(index, value){
				$('#'+value).appendTo(obj);
			});
		});
		document.querySelector('.mdl-js-snackbar').MaterialSnackbar.showSnackbar({message: '元に戻しました'});
	});

	$('.mdl-layout__tab').click(function(){
		var val = $(this).data('val');
		$('.init').hide().data('text', $(this).text());
		$('.'+val).show();
		$('[name=reset]').val(val);
	});

	//初期化
	var dialog = document.querySelector('dialog');
	if (!dialog.showModal) dialogPolyfill.registerDialog(dialog);
	$('.init').click(function(){
		$('.mdl-dialog__content').text('"' + $(this).data('text') + '"を初期化しますか?');
	    dialog.showModal();
	});
});