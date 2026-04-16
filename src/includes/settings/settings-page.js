(function($) {
	$(document).ready(function() {
		
		console.log('JEO Settings JS loaded.');

		// ------------------------------------
		// Debug Console Logic
		// ------------------------------------
		$('#jeo-ai-debug-header').click(function() {
			var $body = $('#jeo-ai-debug-body');
			var $toggle = $('#jeo-ai-debug-toggle');
			if ($body.is(':visible')) {
				$body.slideUp('fast');
				$toggle.text('▲');
			} else {
				$body.slideDown('fast');
				$toggle.text('▼');
			}
		});

		$('#jeo-ai-debug-clear').click(function(e) {
			e.stopPropagation();
			$('#jeo-ai-debug-log-container').empty().append('<div style="color: #8c8f94; font-style: italic;">[System] Console cleared.</div>');
		});

		function logToConsole(label, type, payload) {
			var $container = $('#jeo-ai-debug-log-container');
			if (!$container.length) return;

			var timestamp = new Date().toLocaleTimeString();
			
			// Anonymize API Key in logs
			var displayPayload = $.extend(true, {}, payload);
			if (displayPayload.api_key && typeof displayPayload.api_key === 'string') {
				var key = displayPayload.api_key;
				if (key.length > 8) {
					displayPayload.api_key = key.substring(0, 5) + '*****' + key.substring(key.length - 5);
				} else {
					displayPayload.api_key = '*****';
				}
			}

			var payloadStr = (typeof displayPayload === 'string') ? displayPayload : JSON.stringify(displayPayload, null, 2);
			
			var entryHtml = '<div class="jeo-debug-entry">' +
				'<span class="jeo-debug-label ' + (type === 'req' ? 'jeo-debug-request' : (type === 'err' ? 'jeo-debug-error' : 'jeo-debug-response')) + '">' + 
				'[' + timestamp + '] ' + label + ' (' + (type === 'req' ? 'REQUEST' : (type === 'err' ? 'ERROR' : 'RESPONSE')) + ')</span>' +
				'<pre class="jeo-debug-payload">' + 
				(payloadStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')) + 
				'</pre></div>';
			
			$container.append(entryHtml);
			var body = document.getElementById('jeo-ai-debug-body');
			if(body) body.scrollTop = body.scrollHeight;
		}

		// Helper wrapper for apiFetch with logging
		function loggedApiFetch(options) {
			logToConsole(options.path, 'req', options.data || {});
			return wp.apiFetch(options).then(function(response) {
				logToConsole(options.path, 'res', response);
				return response;
			}).catch(function(error) {
				logToConsole(options.path, 'err', error);
				throw error;
			});
		}

		// ------------------------------------
		// AI API Key Validation Logic
		// ------------------------------------
		function runApiKeyTest($btn) {
			if (!$btn || !$btn.length) return;
			
			var provider = $btn.closest('tr').data('provider') || $('#ai_default_provider').val();
			var $row = $btn.closest('tr');
			var $input = $row.find('.jeo-ai-key-input');
			var key = $input.val();
			var model = $('#' + provider + '_model_hidden').val();
			var $badge = $row.find('.jeo-ai-key-status-badge');
			var $detail = $row.find('.jeo-ai-key-test-detail');

			console.log('Testing key for provider:', provider);

			// Security: Don't send masked keys via AJAX
			var isMasked = key && key.indexOf('********') !== -1;
			var apiData = { 
				provider: provider, 
				model: model
			};

			if (!isMasked) {
				apiData.api_key = key;
			}

			if (!key && !isMasked) {
				$badge.text('Missing Config').css({ 'background': '#fcf0f1', 'color': '#d63638' });
				return;
			}

			$badge.text('Checking...').css({ 'background': '#f0f0f1', 'color': '#646970' });
			$btn.prop('disabled', true);
			$detail.hide().empty();

			loggedApiFetch({
				path: '/jeo/v1/ai-test-key',
				method: 'POST',
				data: apiData
			}).then(function(res) {
				if (res && res.success) {
					$badge.text('Active').css({ 'background': '#edfaef', 'color': '#008a20' });
					$detail.html('<span style="color: #46b450;">✅ ' + res.message + '</span>').show();
				} else {
					var msg = res.message || 'Error';
					$badge.text('Invalid').css({ 'background': '#fcf0f1', 'color': '#d63638' });
					$detail.html('<span style="color: #d63638;">❌ ' + msg + '</span>').show();
				}
			}).catch(function(err) {
				var msg = (err.responseJSON && err.responseJSON.message) ? err.responseJSON.message : 'Request Failed';
				$badge.text('Failed').css({ 'background': '#fcf0f1', 'color': '#d63638' });
				$detail.html('<span style="color: #d63638;">❌ ' + msg + '</span>').show();
			}).finally(function() {
				$btn.prop('disabled', false);
			});
		}

		// Initial provider visibility and test
		if ($('#ai_default_provider').length) {
			var initialProvider = $('#ai_default_provider').val();
			$('.jeo-ai-provider-settings').hide();
			$('.jeo-ai-provider-settings[data-provider="' + initialProvider + '"]').show();
			
			// Auto test on load if on provider tab
			if (window.location.search.includes('tab=provider') || window.location.hash === '#tab-ai') {
				var $initBtn = $('.jeo-ai-provider-settings[data-provider="' + initialProvider + '"]').find('.jeo-ai-test-key-btn');
				runApiKeyTest($initBtn);
			}
		}

		$('#ai_default_provider').on('change', function() {
			var provider = $(this).val();
			$('.jeo-ai-provider-settings').hide();
			$('.jeo-ai-provider-settings[data-provider="' + provider + '"]').show();
			
			var $activeBtn = $('.jeo-ai-provider-settings[data-provider="' + provider + '"]').find('.jeo-ai-test-key-btn');
			runApiKeyTest($activeBtn);
		});

		$(document).on('click', '.jeo-ai-test-key-btn', function(e) {
			e.preventDefault();
			runApiKeyTest($(this));
		});

		// Unlock Key Logic
		$(document).on('click', '.jeo-ai-unlock-key-btn', function(e) {
			e.preventDefault();
			console.log('Unlock key clicked');
			var $btn = $(this);
			var $container = $btn.closest('.jeo-ai-key-container');
			var $input = $container.find('.jeo-ai-key-input');

			$input.prop('readonly', false)
				  .prop('type', 'password')
				  .val('')
				  .focus()
				  .css({ 'background': '#fff', 'cursor': 'text' });
			
			$btn.fadeOut(200);
		});

		// Fetch Dynamic Models Logic
		$(document).on('click', '.jeo-ai-fetch-models-btn', function(e) {
			e.preventDefault();
			var $btn = $(this);
			var provider = $btn.data('provider');
			var $row = $btn.closest('tr');
			
			// Find the key in the PREVIOUS row (the one with the key input)
			var $keyRow = $row.prev('tr');
			var $keyInput = $keyRow.find('.jeo-ai-key-input');
			var key = $keyInput.val();

			console.log('Fetching models for:', provider);

			// Security: Don't send masked keys via AJAX
			var isMasked = key && key.indexOf('********') !== -1;
			var apiData = { provider: provider };
			if (!isMasked) {
				apiData.api_key = key;
			}

			if (!key && !isMasked) {
				alert('Please enter an API Key first.');
				return;
			}

			$btn.prop('disabled', true).text('Loading...');

			loggedApiFetch({
				path: '/jeo/v1/ai-fetch-models',
				method: 'POST',
				data: apiData
			}).then(function(res) {
				if (res && res.success && res.models) {
					var $modelContainer = $btn.closest('.jeo-ai-model-container');
					var $readOnly = $modelContainer.find('input[type="text"]');
					var $hidden = $modelContainer.find('input[type="hidden"]');
					
					// Convert input to Select2
					var $select = $('<select class="jeo-ai-model-select" style="width: 300px;"></select>');
					res.models.forEach(function(m) {
						$select.append($('<option></option>').val(m.id).text(m.name + (m.is_chat ? '' : ' (Non-chat)')));
					});

					$readOnly.hide();
					$btn.hide();
					$readOnly.after($select);

					$select.select2({
						tags: true,
						placeholder: "Select or type a model..."
					}).on('change', function() {
						$hidden.val($(this).val());
					});

					// Set current value
					$select.val($hidden.val()).trigger('change');

				} else {
					alert('Failed to fetch models: ' + (res.message || 'Unknown error'));
				}
			}).catch(function(err) {
				alert('Error fetching models. Check your API key and connection.');
			}).finally(function() {
				$btn.prop('disabled', false).text('Change Model');
			});
		});

		// ------------------------------------
		// AI Prompt Generator & Validator Logic
		// ------------------------------------
		$('#ai_use_custom_prompt').change(function() {
			if ($(this).is(':checked')) {
				$('#ai_system_prompt_wrapper').slideDown();
			} else {
				$('#ai_system_prompt_wrapper').slideUp();
			}
		}).trigger('change');

		$('#jeo-ai-clear-prompt-btn').click(function(e) {
			e.preventDefault();
			$('#ai_system_prompt').val('').focus();
			$('#jeo-ai-validate-status').text('');
		});

		$('#jeo-ai-chat-input').keydown(function(e) {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				$('#jeo-ai-generate-prompt-btn').click();
			}
		});

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

			var provider = $('#ai_default_provider').val();
			var $container = $('.jeo-ai-provider-settings[data-provider="' + provider + '"]');
			var $input_key = $container.find('.jeo-ai-key-input');
			var key = $input_key.val();
			var model = $('#' + provider + '_model_hidden').val();
			var lang = $('#jeo-ai-chat-lang').val();

			var isMasked = key && key.indexOf('********') !== -1;
			var apiData = { context: context, provider: provider, model: model, lang: lang };
			if (!isMasked) apiData.api_key = key;

			$btn.prop('disabled', true).text('Generating...');
			$status.text('Asking LLM...').css('color', '#007cba');

			loggedApiFetch({
				path: '/jeo/v1/ai-chat-prompt-generator',
				method: 'POST',
				data: apiData
			}).then(function(res) {
				if (res && res.prompt) {
					$('#ai_system_prompt').val(res.prompt);
					$status.text('✨ Applied above.').css('color', 'green');
				}
			}).catch(function(err) {
				$status.text('Error generating prompt.').css('color', 'red');
			}).finally(function() {
				$btn.prop('disabled', false).text('Generate Prompt');
			});
		});

		$('#jeo-ai-validate-prompt-btn').click(function(e) {
			e.preventDefault();
			var $btn = $(this);
			var $status = $('#jeo-ai-validate-status');
			var prompt = $('#ai_system_prompt').val() || $('#ai_system_prompt').attr('placeholder');

			var provider = $('#ai_default_provider').val();
			var $container = $('.jeo-ai-provider-settings[data-provider="' + provider + '"]');
			var $input_key = $container.find('.jeo-ai-key-input');
			var key = $input_key.val();
			var model = $('#' + provider + '_model_hidden').val();

			var isMasked = key && key.indexOf('********') !== -1;
			var apiData = { prompt: prompt, provider: provider, model: model };
			if (!isMasked) apiData.api_key = key;

			$btn.prop('disabled', true).text('Testing...');
			loggedApiFetch({
				path: '/jeo/v1/ai-validate-prompt',
				method: 'POST',
				data: apiData
			}).then(function(res) {
				$status.text(res.success ? '✅ Valid' : '❌ Invalid').css('color', res.success ? 'green' : 'red');
			}).finally(function() {
				$btn.prop('disabled', false).text('Validate Prompt');
			});
		});

		// ------------------------------------
		// Tabs and Navigation
		// ------------------------------------
		function showTab(target, isInitialLoad) {
			$('.tabs-content').hide();
			$('#tab-' + target).show();
			$('#tabs .nav-tab').removeClass('nav-tab-active');
			$('#tabs .nav-tab[data-target="' + target + '"]').addClass('nav-tab-active');
			if (!isInitialLoad) window.location.hash = 'tab-' + target;
		}

		$('#tabs .nav-tab').on('click', function(e) {
			e.preventDefault();
			var target = $(this).data('target');
			showTab(target, false);
			if (history.replaceState) history.replaceState(null, null, '#tab-' + target);
		});

		// Trigger initial tab for general settings page
		if ($('#tabs').length && !window.location.search.includes('page=jeo-ai-settings')) {
			var hash = window.location.hash;
			var initialTab = hash ? hash.replace('#tab-', '') : $('#tabs .nav-tab').first().data('target');
			showTab(initialTab, true);
		}

		// ------------------------------------
		// RAG and Bulk Logic
		// ------------------------------------
		function fetchBackups() {
			var $container = $('#jeo-ai-backups-list');
			if (!$container.length) return;
			$container.html('<p>Loading backups...</p>');
			loggedApiFetch({ path: '/jeo/v1/ai-list-backups', method: 'GET' }).then(function(res) {
				if (res && res.length > 0) {
					var html = '<table class="wp-list-table widefat fixed striped"><thead><tr><th>File</th><th>Date</th><th>Size</th><th>Actions</th></tr></thead><tbody>';
					res.forEach(function(b) {
						html += '<tr><td><code>' + b.filename + '</code></td><td>' + b.date + '</td><td>' + b.size + '</td>';
						html += '<td><a href="' + b.url + '" class="button button-small" download>Download</a> ';
						html += '<button type="button" class="button button-small button-link-delete jeo-ai-delete-backup-btn" data-filename="' + b.filename + '">Delete</button></td></tr>';
					});
					html += '</tbody></table>';
					$container.html(html);
					$('.jeo-ai-delete-backup-btn').click(function() {
						if (!confirm('Delete?')) return;
						loggedApiFetch({ path: '/jeo/v1/ai-delete-backup', method: 'DELETE', data: { filename: $(this).data('filename') } }).then(fetchBackups);
					});
				} else { $container.html('<p>No backups.</p>'); }
			});
		}

		if ($('#tab-knowledge').length || window.location.search.includes('tab=knowledge')) fetchBackups();

		$('#jeo-ai-rag-manual-btn').click(function(e) {
			e.preventDefault();
			var $btn = $(this).prop('disabled', true).text('Vectorizing...');
			loggedApiFetch({ path: '/jeo/v1/ai-rag-run-manual', method: 'POST' }).then(function(res) {
				alert(res.message); location.reload();
			}).finally(function() { $btn.prop('disabled', false).text('Vectorize Now'); });
		});

		$('#jeo-ai-backup-store-btn').click(function(e) {
			e.preventDefault();
			var $btn = $(this).prop('disabled', true);
			loggedApiFetch({ path: '/jeo/v1/ai-backup-store', method: 'POST' }).then(function(res) {
				alert(res.message); setTimeout(fetchBackups, 2000);
			}).finally(function() { $btn.prop('disabled', false); });
		});

		$('.jeo-ai-clear-store-btn').click(function(e) {
			e.preventDefault();
			if (!confirm('Clear store?')) return;
			var $btn = $(this).prop('disabled', true);
			loggedApiFetch({ path: '/jeo/v1/ai-clear-store', method: 'POST', data: { store: $(this).data('store') } }).then(function(res) {
				alert(res.message); location.reload();
			});
		});

		if ($.fn.select2) $('#ai_embedding_model').select2({ tags: true, width: '100%' });

		// ------------------------------------
		// Embedded Data Preview Logic
		// ------------------------------------
		$(document).on('click', '.jeo-ai-preview-dict-btn', function(e) {
			e.preventDefault();
			var dictId = $(this).data('dict-id');
			var $modal = $('#' + dictId);
			if ($modal.length) {
				if ($modal[0].showModal) {
					$modal[0].showModal();
				} else {
					$modal.show();
				}
			}
		});

		$(document).on('click', '.jeo-ai-close-modal-btn', function(e) {
			e.preventDefault();
			var $modal = $(this).closest('dialog');
			if ($modal.length) {
				if ($modal[0].close) {
					$modal[0].close();
				} else {
					$modal.hide();
				}
			}
		});

		// ------------------------------------
		// RAG Retrieval Test Logic
		// ------------------------------------
		var $retrievalModal = $('#rag-retrieval-modal');

		$(document).on('click', '#jeo-ai-test-retrieval-btn', function(e) {
			e.preventDefault();
			if ($retrievalModal.length) {
				if ($retrievalModal[0].showModal) {
					$retrievalModal[0].showModal();
				} else {
					$retrievalModal.show();
				}
			}
		});

		$(document).on('click', '.jeo-ai-close-retrieval-modal-btn', function(e) {
			e.preventDefault();
			if ($retrievalModal.length) {
				if ($retrievalModal[0].close) {
					$retrievalModal[0].close();
				} else {
					$retrievalModal.hide();
				}
			}
		});

		// Skeleton
		setTimeout(function() {
			$('#jeo-skeleton').fadeOut('fast', function() { $('.jeo-settings-submit').fadeIn('fast'); });
		}, 300);

		// Other handlers
		$('#active_geocoder_select').change(function () {
			$('tr.geocoder_options').hide();
			$('#geocoder_options_' + $(this).val()).show();
		}).change();

		$('#map_runtime').change(function() {
			$('.mapbox_options').toggle($(this).val() === 'mapboxgl');
		}).change();
	});
})(jQuery);