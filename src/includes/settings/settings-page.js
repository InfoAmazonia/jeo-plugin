(function ($) {
	$(function () {
		var isAnimating = false; // Flag to prevent multiple rapid clicks

		// Inicializa o state das tabs PRINCIPAIS (com Skeleton e Hash)
		$('#tabs > .nav-tab').click(function (ev, isInitialLoad) {
			ev.preventDefault();
			var target = $(this).data('target');

			// Proteção contra cliques em abas que não são do Settings (como as do modal)
			if (!target) return;

			// Bloqueia se já estiver animando ou se clicar na aba já ativa (e não for o load inicial)
			if (isAnimating || (!isInitialLoad && $(this).hasClass('nav-tab-active'))) {
				return;
			}

			isAnimating = true;

			// Esconde abas e botão de salvar, mostra o Skeleton Loader
			$('.tabs-content').hide();
			$('.jeo-settings-submit').hide();
			$('#tabs > .nav-tab').removeClass('nav-tab-active');
			$(this).addClass('nav-tab-active');
			$('#jeo-skeleton').show();

			if (!isInitialLoad) {
				// Atualiza a URL silenciosamente (Task 3)
				if (history.pushState) {
					history.pushState(null, null, '#tab-' + target);
				} else {
					location.hash = '#tab-' + target;
				}
			}

			// Simula o tempo de carregamento suave com 1s proposital (FOUC Prevention & V4 Easter Egg)
			var delay = isInitialLoad ? 1200 : 1000;
			setTimeout(function() {
				$('#jeo-skeleton').hide();
				$('#tab-' + target).fadeIn(200, function() {
					$('.jeo-settings-submit').fadeIn(200);
					isAnimating = false; // Libera os cliques novamente

					// Auto-teste ao entrar na aba AI
					if (target === 'ai') {
						runApiKeyTest();
					}
				});
			}, delay);
		});

		// ------------------------------------
		// AI API Key Validation Logic
		// ------------------------------------
		$('#ai_default_provider').on('change', function() {
			var provider = $(this).val();

			// Hide all provider specific rows
			$('.jeo-ai-provider-settings').hide();
			// Show specific rows
			$('.jeo-ai-provider-settings[data-provider="' + provider + '"]').show();
			
			runApiKeyTest();
		});

		function runApiKeyTest() {
			var provider = $('#ai_default_provider').val();
			var keyInputId = provider === 'ollama' ? '#ollama_url' : '#' + provider + '_api_key';
			var key = $(keyInputId).val();
			var $badge = $('#jeo-ai-key-status-badge');
			var $btn = $('#jeo-ai-test-key-btn');

			if (!key) {
				$badge.text('Missing Config').css({ 'background': '#fcf0f1', 'color': '#d63638' });
				return;
			}

			$badge.text('Checking...').css({ 'background': '#f0f0f1', 'color': '#646970' });
			$btn.prop('disabled', true);

			wp.apiFetch({
				path: '/jeo/v1/ai-test-key',
				method: 'POST',
				data: { provider: provider, api_key: key }
			}).then(function(res) {
				if (res && res.success) {
					$badge.text('Active').css({ 'background': '#edfaef', 'color': '#008a20' });
				} else {
					$badge.text('Error').css({ 'background': '#fcf0f1', 'color': '#d63638' });
				}
			}).catch(function(err) {
				$badge.text('Request Failed').css({ 'background': '#fcf0f1', 'color': '#d63638' });
			}).finally(function() {
				$btn.prop('disabled', false);
			});
		}

		$('#jeo-ai-test-key-btn').click(function(e) {
			e.preventDefault();
			runApiKeyTest();
		});

		// Lê o Hash da URL para abrir na mesma aba salva (acione com flag isInitialLoad)
		var hash = window.location.hash;
		if (hash && hash.indexOf('tab-') !== -1) {
			var tabName = hash.replace('#tab-', '');
			$('#tabs .nav-tab[data-target="' + tabName + '"]').trigger('click', [true]);
		} else {
			$('#tabs .nav-tab:first').trigger('click', [true]);
		}

		// voltam para a mesma tab usando o form 'options.php' nativo
		$('form').on('submit', function(e) {
			// Validação de Chave de API ao salvar (Task: não salvar sem chave)
			var currentHash = window.location.hash;
			if (currentHash === '#tab-ai') {
				var provider = $('#ai_default_provider').val();
				var keyInputId = provider === 'ollama' ? '#ollama_url' : '#' + provider + '_api_key';
				var key = $(keyInputId).val();
				
				if (!key) {
					e.preventDefault();
					alert('Please enter an API Key (or URL) for the selected provider before saving.');
					$(keyInputId).focus();
					return false;
				}
			}

			var $form = $(this);
			var action = $form.attr('action') || '';
			// Strip qualquer hash antigo se houver na action ou referer e coloca o atual
			var currentHash = window.location.hash;
			
			// Atualiza a URL do redirect (_wp_http_referer) que o WordPress usa nativamente
			var $referer = $form.find('input[name="_wp_http_referer"]');
			if ($referer.length > 0 && currentHash) {
				var refVal = $referer.val();
				refVal = refVal.split('#')[0] + currentHash;
				$referer.val(refVal);
			}
		});

		$('#active_geocoder_select').change(function () {
			$('tr.geocoder_options').hide();
			$('#geocoder_options_' + $(this).val()).show();
		}).change();

		$('#map_runtime').change(function() {
			var runtime = $(this).val();
			$('.mapbox_options, .googlemaps_options').hide();
			if (runtime === 'mapboxgl') {
				$('.mapbox_options').show();
			} else if (runtime === 'googlemaps') {
				$('.googlemaps_options').show();
			}
		}).change();


		var mediaUploader;
		$('#upload_image_button').click(function (e) {
			e.preventDefault();
			if (mediaUploader) {
				mediaUploader.open();
				return;
			}
			mediaUploader = wp.media.frames.file_frame = wp.media({
				title: 'Choose Image',
				button: {
					text: 'Choose Image'
				}, multiple: false
			});
			mediaUploader.on('select', function () {
				var attachment = mediaUploader.state().get('selection').first().toJSON();
				$('#background_image').val(attachment.url);
			});
			mediaUploader.open();
		});

		// ------------------------------------
		// AI Prompt Generator & Validator Logic
		// ------------------------------------
		var restUrl = (typeof wp !== 'undefined' && wp.apiFetch) ? '' : '/wp-json/jeo/v1'; // fallback

		// Toggle Checkbox
		$('#ai_use_custom_prompt').change(function() {
			if ($(this).is(':checked')) {
				$('#ai_system_prompt_wrapper').slideDown();
			} else {
				$('#ai_system_prompt_wrapper').slideUp();
			}
		});

		// Clear Prompt Button
		$('#jeo-ai-clear-prompt-btn').click(function(e) {
			e.preventDefault();
			$('#ai_system_prompt').val('').focus();
			$('#jeo-ai-validate-status').text('');
		});

		// Enter Interception on Assistant
		$('#jeo-ai-chat-input').keydown(function(e) {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault(); // Impede pular linha ou submeter form inteiro
				$('#jeo-ai-generate-prompt-btn').click();
			}
		});

		// Auto-save: Restaura e Salva o contexto do usuário no LocalStorage
		var savedChatContext = localStorage.getItem('jeo_ai_assistant_context');
		if (savedChatContext) {
			$('#jeo-ai-chat-input').val(savedChatContext);
		}
		
		$('#jeo-ai-chat-input').on('input', function() {
			localStorage.setItem('jeo_ai_assistant_context', $(this).val());
		});

		$('#jeo-ai-generate-prompt-btn').click(function(e) {
			e.preventDefault();
			var $btn = $(this);
			var $status = $('#jeo-ai-chat-status');
			var $input = $('#jeo-ai-chat-input');
			var context = $input.val();

			if (!context) {
				$status.text('Please type a description first.').css('color', 'red');
				return;
			}

			// Capture dynamic provider configuration to allow generating prompts with an unsaved key
			var provider = $('#ai_default_provider').val();
			var keyInputId = provider === 'ollama' ? '#ollama_url' : '#' + provider + '_api_key';
			var key = $(keyInputId).val();
			var model = $('#' + provider + '_model').val();

			$btn.prop('disabled', true).text('Generating...');
			$status.text('Asking the active LLM to generate an optimized prompt...').css('color', '#007cba');

			wp.apiFetch({
				path: '/jeo/v1/ai-chat-prompt-generator',
				method: 'POST',
				data: { 
					context: context,
					provider: provider,
					api_key: key,
					model: model
				}
			}).then(function(res) {
				if (res && res.prompt) {
					$('#ai_system_prompt').val(res.prompt);
					$status.text('✨ Success! The new prompt has been applied above. (Save changes to persist)').css('color', 'green');
					$input.val('');
				}
			}).catch(function(err) {
				$status.text('Error: ' + (err.message || err.error || 'Unknown API failure')).css('color', 'red');
			}).finally(function() {
				$btn.prop('disabled', false).text('Generate Prompt');
			});
		});

		$('#jeo-ai-validate-prompt-btn').click(function(e) {
			e.preventDefault();
			var $btn = $(this);
			var $status = $('#jeo-ai-validate-status');
			var prompt = $('#ai_system_prompt').val();

			// Se vazio, vai testar o fallback (default system prompt) ou avisa o user
			if (!prompt) {
				prompt = $('#ai_system_prompt').attr('placeholder');
			}

			var provider = $('#ai_default_provider').val();
			var keyInputId = provider === 'ollama' ? '#ollama_url' : '#' + provider + '_api_key';
			var key = $(keyInputId).val();
			var model = $('#' + provider + '_model').val();

			$btn.prop('disabled', true).text('Testing...');
			$status.text('Running a simulation against the LLM...').css('color', '#007cba');

			wp.apiFetch({
				path: '/jeo/v1/ai-validate-prompt',
				method: 'POST',
				data: { 
					prompt: prompt,
					provider: provider,
					api_key: key,
					model: model
				}
			}).then(function(res) {
				if (res && res.success) {
					$status.text('✅ ' + res.message).css('color', 'green');
				} else {
					$status.text('❌ ' + (res.message || 'Validation failed.')).css('color', 'red');
				}
			}).catch(function(err) {
				$status.text('❌ Request Error: ' + (err.message || err.error || 'Check console')).css('color', 'red');
			}).finally(function() {
				$btn.prop('disabled', false).text('Validate Custom Prompt');
			});
		});

		// Lógica do Modal de Dicionários (Preview) - Usando delegação para maior resiliência
		$(document).on('click', '.jeo-ai-preview-dict-btn', function(e) {
			e.preventDefault();
			var targetId = $(this).data('dict-id');
			var dialog = document.getElementById(targetId);
			if (dialog) {
				dialog.showModal();
			}
		});

		$(document).on('click', '.jeo-ai-close-modal-btn', function(e) {
			e.preventDefault();
			var dialog = this.closest('dialog');
			if (dialog) dialog.close();
		});

		// Também adicionar delegate para o botão de Log da outra página se necessário
		$(document).on('click', '.jeo-ai-view-log-btn', function(e) {
			e.preventDefault();
			var targetId = $(this).data('log-id');
			var dialog = document.getElementById(targetId);
			if (dialog) dialog.showModal();
		});
	});

}(jQuery));
