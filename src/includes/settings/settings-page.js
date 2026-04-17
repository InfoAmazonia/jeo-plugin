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
			$('#jeo-ai-debug-log-container').empty().append('<div style="color: #8c8f94; font-style: italic;">' + (jeo_settings.i18n ? jeo_settings.i18n.console_cleared : '[System] Console cleared.') + '</div>');
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
			var i18n = jeo_settings.i18n || {};

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
				$badge.text(i18n.missing_config || 'Missing Config').css({ 'background': '#fcf0f1', 'color': '#d63638' });
				return;
			}

			$badge.text(i18n.checking || 'Checking...').css({ 'background': '#f0f0f1', 'color': '#646970' });
			$btn.prop('disabled', true);
			$detail.hide().empty();

			loggedApiFetch({
				path: '/jeo/v1/ai-test-key',
				method: 'POST',
				data: apiData
			}).then(function(res) {
				if (res && res.success) {
					$badge.text(i18n.active || 'Active').css({ 'background': '#edfaef', 'color': '#008a20' });
					$detail.html('<span style="color: #46b450;">✅ ' + res.message + '</span>').show();
				} else {
					var msg = res.message || 'Error';
					$badge.text(i18n.invalid || 'Invalid').css({ 'background': '#fcf0f1', 'color': '#d63638' });
					$detail.html('<span style="color: #d63638;">❌ ' + msg + '</span>').show();
				}
			}).catch(function(err) {
				var msg = (err.responseJSON && err.responseJSON.message) ? err.responseJSON.message : (i18n.request_failed || 'Request Failed');
				$badge.text(i18n.failed || 'Failed').css({ 'background': '#fcf0f1', 'color': '#d63638' });
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
			var i18n = jeo_settings.i18n || {};

			console.log('Fetching models for:', provider);

			// Security: Don't send masked keys via AJAX
			var isMasked = key && key.indexOf('********') !== -1;
			var apiData = { provider: provider };
			if (!isMasked) {
				apiData.api_key = key;
			}

			if (!key && !isMasked) {
				alert(i18n.enter_api_key || 'Please enter an API Key first.');
				return;
			}

			$btn.prop('disabled', true).text(i18n.loading || 'Loading...');

			loggedApiFetch({
				path: '/jeo/v1/ai-get-models',
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
						if (typeof m === 'string') {
							$select.append($('<option></option>').val(m).text(m));
						} else {
							$select.append($('<option></option>').val(m.id).text(m.name + (m.is_chat ? '' : (i18n.non_chat || ' (Non-chat)'))));
						}
					});

					$readOnly.hide();
					$btn.hide();
					$readOnly.after($select);

					$select.select2({
						tags: true,
						placeholder: i18n.select_model || "Select or type a model..."
					}).on('change', function() {
						$hidden.val($(this).val());
					});

					// Set current value
					$select.val($hidden.val()).trigger('change');

				} else {
					alert((i18n.failed_fetch_models || 'Failed to fetch models: ') + (res.message || (i18n.unknown_error || 'Unknown error')));
				}
			}).catch(function(err) {
				alert(i18n.error_fetching || 'Error fetching models. Check your API key and connection.');
			}).finally(function() {
				$btn.prop('disabled', false).text(i18n.change_model || 'Change Model');
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
		// RAG and Bulk Logic
		// ------------------------------------
		function fetchBackups() {
			var $container = $('#jeo-ai-backups-list');
			var i18n = jeo_settings.i18n || {};
			if (!$container.length) return;
			$container.html('<p>' + (i18n.loading_backups || 'Loading backups...') + '</p>');
			loggedApiFetch({ path: '/jeo/v1/ai-list-backups', method: 'GET' }).then(function(res) {
				if (res && res.length > 0) {
					var html = '<table class="wp-list-table widefat fixed striped"><thead><tr><th>' + (i18n.file || 'File') + '</th><th>' + (i18n.date || 'Date') + '</th><th>' + (i18n.size || 'Size') + '</th><th>' + (i18n.actions || 'Actions') + '</th></tr></thead><tbody>';
					res.forEach(function(b) {
						html += '<tr><td><code>' + b.filename + '</code></td><td>' + b.date + '</td><td>' + b.size + '</td>';
						html += '<td><a href="' + b.url + '" class="button button-small" download>' + (i18n.download || 'Download') + '</a> ';
						html += '<button type="button" class="button button-small button-link-delete jeo-ai-delete-backup-btn" data-filename="' + b.filename + '">' + (i18n.delete || 'Delete') + '</button></td></tr>';
					});
					html += '</tbody></table>';
					$container.html(html);
					$('.jeo-ai-delete-backup-btn').click(function() {
						if (!confirm(i18n.confirm_delete || 'Delete?')) return;
						loggedApiFetch({ path: '/jeo/v1/ai-delete-backup', method: 'DELETE', data: { filename: $(this).data('filename') } })
							.then(fetchBackups)
							.catch(function(err) {
								var msg = (err.responseJSON && err.responseJSON.message) ? err.responseJSON.message : (err.message || i18n.unknown_error || 'Unknown error');
								alert((i18n.error || 'Error') + ': ' + msg);
							});
					});
				} else { $container.html('<p>' + (i18n.no_backups || 'No backups.') + '</p>'); }
			}).catch(function(err) {
				$container.html('<p style="color: red;">' + (i18n.error || 'Error') + ': ' + (err.message || i18n.unknown_error || 'Unknown error') + '</p>');
			});
		}

		if ($('#tab-knowledge').length || window.location.search.includes('tab=knowledge')) fetchBackups();

		$('#jeo-ai-rag-manual-btn').click(function(e) {
			e.preventDefault();
			var i18n = jeo_settings.i18n || {};
			var $btn = $(this).prop('disabled', true).text(i18n.vectorizing || 'Vectorizing...');
			loggedApiFetch({ path: '/jeo/v1/ai-rag-run-manual', method: 'POST' }).then(function(res) {
				alert(res.message || (i18n.success || 'Success!')); 
				location.reload();
			}).catch(function(err) {
				var msg = (err.responseJSON && err.responseJSON.message) ? err.responseJSON.message : (err.message || i18n.unknown_error || 'Unknown error');
				alert((i18n.error || 'Error') + ': ' + msg);
			}).finally(function() { 
				$btn.prop('disabled', false).text(i18n.vectorize_now || 'Vectorize Now'); 
			});
		});

		$('#jeo-ai-backup-store-btn').click(function(e) {
			e.preventDefault();
			var $btn = $(this).prop('disabled', true);
			var i18n = jeo_settings.i18n || {};
			loggedApiFetch({ path: '/jeo/v1/ai-backup-store', method: 'POST' }).then(function(res) {
				alert(res.message); setTimeout(fetchBackups, 2000);
			}).catch(function(err) {
				var msg = (err.responseJSON && err.responseJSON.message) ? err.responseJSON.message : (err.message || i18n.unknown_error || 'Unknown error');
				alert((i18n.error || 'Error') + ': ' + msg);
			}).finally(function() { $btn.prop('disabled', false); });
		});

		$('.jeo-ai-clear-store-btn').click(function(e) {
			e.preventDefault();
			var i18n = jeo_settings.i18n || {};
			if (!confirm(i18n.confirm_clear_store || 'Clear store?')) return;
			var $btn = $(this).prop('disabled', true);
			loggedApiFetch({ path: '/jeo/v1/ai-clear-store', method: 'POST', data: { store: $(this).data('store') } }).then(function(res) {
				alert(res.message); location.reload();
			}).catch(function(err) {
				var msg = (err.responseJSON && err.responseJSON.message) ? err.responseJSON.message : (err.message || i18n.unknown_error || 'Unknown error');
				alert((i18n.error || 'Error') + ': ' + msg);
			}).finally(function() { $btn.prop('disabled', false); });
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

		$('#jeo-ai-test-embedding-btn').click(function(e) {
			e.preventDefault();
			var $btn = $(this);
			var $status = $('#jeo-ai-test-embedding-status');
			var $results = $('#jeo-ai-test-embedding-results');
			var i18n = jeo_settings.i18n || {};

			$btn.prop('disabled', true).text(i18n.loading || 'Generating...');
			$status.text(i18n.fetching_post || 'Fetching post and generating vector embeddings...').css('color', '#646970');
			$results.hide().empty();

			loggedApiFetch({
				path: '/jeo/v1/ai-test-embedding',
				method: 'POST'
			}).then(function(res) {
				if (res && res.success) {
					$status.text(i18n.success || 'Success!').css('color', '#008a20');
					var html = '<h4 style="margin-top:0;">' + res.message + '</h4>';
					html += '<p><strong>' + (i18n.post_extracted || 'Post Extracted:') + '</strong> ' + res.details.post_title + ' (ID: ' + res.details.post_id + ')</p>';
					html += '<p><strong>' + (i18n.vector_dimensions || 'Vector Dimensions:') + '</strong> ' + res.details.dimensions + '</p>';
					html += '<p><strong>' + (i18n.text_snippet || 'Text Snippet:') + '</strong> <em>"' + (res.details.content_snippet || '') + '"</em></p>';
					html += '<p><strong>' + (i18n.vector_preview || 'Vector Preview:') + '</strong> <code>[' + res.details.vector_start.join(', ') + '...]</code></p>';
					$results.html(html).slideDown();
				} else {
					$status.text((i18n.failed || 'Failed') + ': ' + (res.message || res.error || (i18n.unknown_error || 'Unknown error'))).css('color', 'red');
				}
			}).catch(function(err) {
				$status.text('Error: ' + (err.message || err.error || 'API call failed')).css('color', 'red');
			}).finally(function() {
				$btn.prop('disabled', false).text(i18n.run_test || 'Run Test on Random Post');
			});
		});

		$('#rag-search-submit').click(function(e) {
			e.preventDefault();
			var $btn = $(this);
			var query = $('#rag-search-input').val();
			var store = $('#rag-search-store').val();
			var $resultsContainer = $('#rag-search-results');
			var i18n = jeo_settings.i18n || {};

			if (!query) return;

			$btn.prop('disabled', true).text(i18n.searching || 'Searching...');
			$resultsContainer.html('<p>' + (i18n.searching_store || 'Searching the ') + store + ' vector store...</p>');

			loggedApiFetch({
				path: '/jeo/v1/ai-test-retrieval',
				method: 'POST',
				data: { query: query, store: store }
			}).then(function(res) {
				if (res && res.success) {
					if (!res.documents || res.documents.length === 0) {
						$resultsContainer.html('<p style="color: #d63638;">' + (res.message || (i18n.no_docs_found || 'No documents found. Did you run the vectorize CLI command?')) + '</p>');
						return;
					}

					var html = '<table class="wp-list-table widefat fixed striped" style="margin-top: 15px;">';
					html += '<thead><tr><th style="width: 15%;">' + (i18n.score || 'Score / Relevance') + '</th><th style="width: 25%;">' + (i18n.metadata || 'Metadata') + '</th><th>' + (i18n.text_snippet || 'Content Snippet') + '</th></tr></thead><tbody>';

					res.documents.forEach(function(doc) {
						var metaHtml = '';
						if (doc.metadata) {
							metaHtml += '<strong>' + (doc.metadata.title || (i18n.untitled || 'Untitled')) + '</strong><br>';
							metaHtml += 'ID: ' + (doc.metadata.post_id || 'N/A') + '<br>';
							metaHtml += 'Type: ' + (doc.metadata.post_type || 'N/A');
						}

						// Calculate percentage for score (simplified)
						var scoreLabel = typeof doc.score === 'number' ? doc.score.toFixed(4) : doc.score;

						html += '<tr>';
						html += '<td><span style="background:#e0f0fa; color:#005a9e; padding:3px 6px; border-radius:3px; font-weight:bold;">' + scoreLabel + '</span></td>';
						html += '<td>' + metaHtml + '</td>';
						html += '<td style="font-size: 13px;">' + (doc.content || '') + '</td>';
						html += '</tr>';
					});
					html += '</tbody></table>';

					$resultsContainer.html(html);
				} else {
					$resultsContainer.html('<p style="color: #d63638;">' + (res.message || res.error || (i18n.unknown_error || 'Unknown error')) + '</p>');
				}
			}).catch(function(err) {
				$resultsContainer.html('<p style="color: #d63638;">' + (err.message || err.error || 'API call failed') + '</p>');
			}).finally(function() {
				$btn.prop('disabled', false).text(i18n.searching ? i18n.searching.replace('...', '') : 'Search');
			});
		});

		$('#rag-search-input').keydown(function(e) {
			if (e.key === 'Enter') {
				e.preventDefault();
				$('#rag-search-submit').click();
			}
		});

		// Other handlers
		$('#active_geocoder_select').change(function () {
			$('tr.geocoder_options').hide();
			$('#geocoder_options_' + $(this).val()).show();
		}).change();

		$('#map_runtime').change(function() {
			$('.mapbox_options').toggle($(this).val() === 'mapboxgl');
		}).change();

		// ------------------------------------
		// Skeleton & Tab Auto-test
		// ------------------------------------
		setTimeout(function() {
			$('#jeo-skeleton').fadeOut('fast', function() { 
				$('.jeo-tab-content-wrapper').fadeIn('fast');
				$('.jeo-settings-submit').fadeIn('fast'); 

				// Auto test on load if on provider tab (after skeleton is gone)
				var isProviderTab = window.location.search.includes('tab=provider') || 
								   (!window.location.search.includes('tab=') && window.location.search.includes('page=jeo-ai-settings'));
				
				if (isProviderTab && $('#ai_default_provider').length) {
					var activeProvider = $('#ai_default_provider').val();
					var $initBtn = $('.jeo-ai-provider-settings[data-provider="' + activeProvider + '"]').find('.jeo-ai-test-key-btn');
					runApiKeyTest($initBtn);
				}
			});
		}, 400);
	});
})(jQuery);