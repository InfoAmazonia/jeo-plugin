(function($) {
	$(document).ready(function() {
		
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
				'[' + timestamp + '] ' + label + ' (' + (type === 'req' ? 'REQUEST' : 'RESPONSE') + ')</span>' +
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
			if (!provider) return;

			var keyInputId = provider === 'ollama' ? '#ollama_url' : '#' + provider + '_api_key';
			var key = $(keyInputId).val();
			var model = $('#' + provider + '_model_hidden').val();
			var $badge = $('#jeo-ai-key-status-badge');
			var $btn = $('#jeo-ai-test-key-btn');

			if (!key) {
				$badge.text('Missing Config').css({ 'background': '#fcf0f1', 'color': '#d63638' });
				return;
			}

			$badge.text('Checking...').css({ 'background': '#f0f0f1', 'color': '#646970' });
			$btn.prop('disabled', true);

			loggedApiFetch({
				path: '/jeo/v1/ai-test-key',
				method: 'POST',
				data: { 
					provider: provider, 
					api_key: key,
					model: model
				}
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

		// Fetch Dynamic Models Logic
		$('.jeo-ai-fetch-models-btn').click(function(e) {
			e.preventDefault();
			var $btn = $(this);
			var provider = $btn.data('provider');
			var $container = $btn.closest('.jeo-ai-model-container');
			var $readonlyWrapper = $container.find('.jeo-ai-model-readonly-wrapper');
			var $selectWrapper = $container.find('.jeo-ai-model-select-wrapper');
			var $modelSelect = $('#' + provider + '_model_select');
			var $hiddenInput = $('#' + provider + '_model_hidden');
			var $readonlyInput = $('#' + provider + '_model_readonly');
			
			var keyInputId = provider === 'ollama' ? '#ollama_url' : '#' + provider + '_api_key';
			var key = $(keyInputId).val();

			if (!key) {
				alert('Please enter an API Key first to fetch models.');
				return;
			}

			var originalText = $btn.text();
			$btn.prop('disabled', true).text('Loading...');

			loggedApiFetch({
				path: '/jeo/v1/ai-get-models',
				method: 'POST',
				data: { provider: provider, api_key: key }
			}).then(function(res) {
				if (res && res.success && res.models) {
					// Transform the UI
					$readonlyWrapper.hide();
					$selectWrapper.show();
					$btn.hide();

					var currentValue = $hiddenInput.val();
					$modelSelect.empty();
					
					var foundCurrent = false;
					res.models.forEach(function(modelName) {
						var isSelected = (modelName === currentValue);
						if (isSelected) foundCurrent = true;
						var option = new Option(modelName, modelName, isSelected, isSelected);
						$modelSelect.append(option);
					});

					if (currentValue && !foundCurrent) {
						var customOption = new Option(currentValue, currentValue, true, true);
						$modelSelect.append(customOption);
					}
					
					if ($.fn.select2) {
						$modelSelect.select2({ tags: true, width: '100%' });
						$modelSelect.trigger('change');
						$modelSelect.select2('open');
					}

					$modelSelect.on('change', function() {
						var selectedVal = $(this).val();
						$hiddenInput.val(selectedVal);
						$readonlyInput.val(selectedVal);
					});
				}
			}).catch(function(err) {
				alert('Error fetching models: ' + (err.message || err.error || 'Unknown error'));
				$btn.prop('disabled', false).text('Failed, Try Again');
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
			var keyInputId = provider === 'ollama' ? '#ollama_url' : '#' + provider + '_api_key';
			var key = $(keyInputId).val();
			var model = $('#' + provider + '_model_hidden').val();
			var lang = $('#jeo-ai-chat-lang').val();

			$btn.prop('disabled', true).text('Generating...');
			$status.text('Asking the active LLM to generate an optimized prompt...').css('color', '#007cba');

			loggedApiFetch({
				path: '/jeo/v1/ai-chat-prompt-generator',
				method: 'POST',
				data: { 
					context: context,
					provider: provider,
					api_key: key,
					model: model,
					lang: lang
				}
			}).then(function(res) {
				if (res && res.prompt) {
					$('#ai_system_prompt').val(res.prompt);
					$status.text('✨ Success! Applied above.').css('color', 'green');
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

			if (!prompt) {
				prompt = $('#ai_system_prompt').attr('placeholder');
			}

			var provider = $('#ai_default_provider').val();
			var keyInputId = provider === 'ollama' ? '#ollama_url' : '#' + provider + '_api_key';
			var key = $(keyInputId).val();
			var model = $('#' + provider + '_model_hidden').val();

			$btn.prop('disabled', true).text('Testing...');
			$status.text('Running simulation...').css('color', '#007cba');

			loggedApiFetch({
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
				$status.text('Error: ' + (err.message || err.error || 'Request failed')).css('color', 'red');
			}).finally(function() {
				$btn.prop('disabled', false).text('Validate Prompt');
			});
		});

		// ------------------------------------
		// Navigation and UI
		// ------------------------------------
		function showTab(target, isInitialLoad) {
			$('.tabs-content').hide();
			$('#tab-' + target).show();
			$('#tabs .nav-tab').removeClass('nav-tab-active');
			$('#tabs .nav-tab[data-target="' + target + '"]').addClass('nav-tab-active');

			if (!isInitialLoad) {
				window.location.hash = 'tab-' + target;
			}
			
			if (target === 'ai') {
				runApiKeyTest();
			}
		}

		$('#tabs .nav-tab').on('click', function(e) {
			e.preventDefault();
			var target = $(this).data('target');
			showTab(target, false);
		});

		// ------------------------------------
		// AI Embeddings Test Logic
		// ------------------------------------
		if ($.fn.select2) {
			$('#ai_embedding_model').select2({
				tags: true,
				width: '100%'
			});
		}

		$('#jeo-ai-test-embedding-btn').click(function(e) {
			e.preventDefault();
			var $btn = $(this);
			var $status = $('#jeo-ai-test-embedding-status');
			var $results = $('#jeo-ai-test-embedding-results');

			$btn.prop('disabled', true).text('Generating...');
			$status.text('Fetching post and generating vector embeddings...').css('color', '#646970');
			$results.hide().empty();

			loggedApiFetch({
				path: '/jeo/v1/ai-test-embedding',
				method: 'POST'
			}).then(function(res) {
				if (res && res.success) {
					$status.text('Success!').css('color', '#008a20');
					var html = '<h4 style="margin-top:0;">' + res.message + '</h4>';
					html += '<p><strong>Post Extracted:</strong> ' + res.details.post_title + ' (ID: ' + res.details.post_id + ')</p>';
					html += '<p><strong>Vector Dimensions:</strong> ' + res.details.dimensions + '</p>';
					html += '<p><strong>Text Snippet:</strong> <em>"' + (res.details.content_snippet || '') + '"</em></p>';
					html += '<p><strong>Vector Preview:</strong> <code>[' + res.details.vector_start.join(', ') + '...]</code></p>';
					$results.html(html).slideDown();
				} else {
					$status.text('Failed: ' + (res.message || res.error || 'Unknown error')).css('color', 'red');
				}
			}).catch(function(err) {
				$status.text('Error: ' + (err.message || err.error || 'API call failed')).css('color', 'red');
			}).finally(function() {
				$btn.prop('disabled', false).text('Run Test on Random Post');
			});
		});

		// ------------------------------------
		// RAG Backup & List Logic
		// ------------------------------------
		function fetchBackups() {
			var $container = $('#jeo-ai-backups-list');
			if (!$container.length) return;

			$container.html('<p>Loading backups...</p>');

			loggedApiFetch({
				path: '/jeo/v1/ai-list-backups',
				method: 'GET'
			}).then(function(res) {
				if (res && Array.isArray(res) && res.length > 0) {
					var html = '<table class="wp-list-table widefat fixed striped" style="margin-top:10px;">';
					html += '<thead><tr><th>File</th><th>Date</th><th>Size</th><th style="width:150px;">Actions</th></tr></thead>';
					html += '<tbody>';
					res.forEach(function(b) {
						html += '<tr>';
						html += '<td><code>' + b.filename + '</code></td>';
						html += '<td>' + b.date + '</td>';
						html += '<td>' + b.size + '</td>';
						html += '<td>';
						html += '<a href="' + b.url + '" class="button button-small" download>Download</a> ';
						html += '<button type="button" class="button button-small button-link-delete jeo-ai-delete-backup-btn" data-filename="' + b.filename + '">Delete</button>';
						html += '</td>';
						html += '</tr>';
					});
					html += '</tbody></table>';
					$container.html(html);

					$('.jeo-ai-delete-backup-btn').click(function() {
						var filename = $(this).data('filename');
						if (!confirm('Delete this backup?')) return;
						loggedApiFetch({
							path: '/jeo/v1/ai-delete-backup',
							method: 'DELETE',
							data: { filename: filename }
						}).then(function() {
							fetchBackups();
						});
					});
				} else {
					$container.html('<p style="color: #8c8f94; font-style: italic;">No backups found.</p>');
				}
			}).catch(function(err) {
				console.error('JEO: Error fetching backups', err);
				$container.html('<p style="color: #d63638;">Error loading backups list.</p>');
			});
		}

		if ($('#tab-knowledge').length) {
			fetchBackups();
		}

		$('#jeo-ai-backup-store-btn').click(function(e) {
			e.preventDefault();
			var $btn = $(this);
			$btn.prop('disabled', true).text('Scheduling...');

			loggedApiFetch({
				path: '/jeo/v1/ai-backup-store',
				method: 'POST'
			}).then(function(res) {
				alert(res.message);
				setTimeout(fetchBackups, 3000);
			}).catch(function(err) {
				alert('Backup error: ' + (err.message || 'Unknown error'));
			}).finally(function() {
				$btn.prop('disabled', false).text('Backup Store');
			});
		});

		// ------------------------------------
		// Store Cleanup Logic
		// ------------------------------------
		$('.jeo-ai-clear-store-btn').click(function(e) {
			e.preventDefault();
			var $btn = $(this);
			var store = $btn.data('store');

			if (store === 'production') {
				var confirm1 = confirm('Are you sure you want to clear the PRODUCTION vector store? This will delete all embeddings and require a full re-indexing via WP-CLI.');
				if (!confirm1) return;
				var confirm2 = confirm('WARNING: This action cannot be undone. You should probably create a backup first. Click OK to confirm or Cancel to abort.');
				if (!confirm2) return;
			} else {
				var confirmTest = confirm('Clear the test vector store?');
				if (!confirmTest) return;
			}

			var originalText = $btn.text();
			$btn.prop('disabled', true).text('Clearing...');

			loggedApiFetch({
				path: '/jeo/v1/ai-clear-store',
				method: 'POST',
				data: { store: store }
			}).then(function(res) {
				if (res && res.success) {
					alert('Success: ' + res.message);
					location.reload(); // Reload to refresh model lock UI
				} else {
					alert('Failed: ' + (res.message || 'Unknown error'));
				}
			}).catch(function(err) {
				alert('Error: ' + (err.message || err.error));
			}).finally(function() {
				$btn.prop('disabled', false).text(originalText);
			});
		});

		// ------------------------------------
		// RAG Retrieval Test Logic
		// ------------------------------------
		var $retrievalModal = $('#rag-retrieval-modal');

		$('#jeo-ai-test-retrieval-btn').click(function(e) {
			e.preventDefault();
			if ($retrievalModal.length && $retrievalModal[0].showModal) {
				$retrievalModal[0].showModal();
			} else {
				$retrievalModal.show(); // Fallback
			}
		});

		$('.jeo-ai-close-retrieval-modal-btn').click(function(e) {
			e.preventDefault();
			if ($retrievalModal.length && $retrievalModal[0].close) {
				$retrievalModal[0].close();
			} else {
				$retrievalModal.hide(); // Fallback
			}
		});

		$('#rag-search-submit').click(function(e) {
			e.preventDefault();
			var $btn = $(this);
			var query = $('#rag-search-input').val();
			var store = $('#rag-search-store').val();
			var $resultsContainer = $('#rag-search-results');

			if (!query) return;

			$btn.prop('disabled', true).text('Searching...');
			$resultsContainer.html('<p>Searching the ' + store + ' vector store...</p>');

			loggedApiFetch({
				path: '/jeo/v1/ai-test-retrieval',
				method: 'POST',
				data: { query: query, store: store }
			}).then(function(res) {
				if (res && res.success) {
					if (!res.documents || res.documents.length === 0) {
						$resultsContainer.html('<p style="color: #d63638;">' + (res.message || 'No documents found. Did you run the vectorize CLI command?') + '</p>');
						return;
					}

					var html = '<table class="wp-list-table widefat fixed striped" style="margin-top: 15px;">';
					html += '<thead><tr><th style="width: 15%;">Score / Relevance</th><th style="width: 25%;">Metadata</th><th>Content Snippet</th></tr></thead><tbody>';
					
					res.documents.forEach(function(doc) {
						var metaHtml = '';
						if (doc.metadata) {
							metaHtml += '<strong>' + (doc.metadata.title || 'Untitled') + '</strong><br>';
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
					$resultsContainer.html('<p style="color: red;">Error: ' + (res.message || 'Unknown error') + '</p>');
				}
			}).catch(function(err) {
				$resultsContainer.html('<p style="color: red;">Request failed: ' + (err.message || err.error) + '</p>');
			}).finally(function() {
				$btn.prop('disabled', false).text('Search');
			});
		});

		$('#rag-search-input').keydown(function(e) {
			if (e.key === 'Enter') {
				e.preventDefault();
				$('#rag-search-submit').click();
			}
		});

		// ------------------------------------
		// Skeleton Loader & Initial State
		// ------------------------------------
		setTimeout(function() {
			$('#jeo-skeleton').fadeOut('fast', function() {
				// Determine which tab to show
				var hash = window.location.hash;
				var initialTab = 'general';
				if (hash && hash.indexOf('tab-') !== -1) {
					initialTab = hash.replace('#tab-', '');
				}
				
				showTab(initialTab, true);
				$('.jeo-settings-submit').fadeIn('fast');
			});
		}, 500);

		$('form').on('submit', function(e) {
			var currentHash = window.location.hash;
			if (currentHash === '#tab-ai') {
				var provider = $('#ai_default_provider').val();
				var keyInputId = provider === 'ollama' ? '#ollama_url' : '#' + provider + '_api_key';
				var key = $(keyInputId).val();
				if (!key) {
					e.preventDefault();
					alert('Please enter an API Key before saving.');
					$(keyInputId).focus();
					return false;
				}
			}
			var $referer = $(this).find('input[name="_wp_http_referer"]');
			if ($referer.length > 0 && currentHash) {
				$referer.val($referer.val().split('#')[0] + currentHash);
			}
		});

		$('#active_geocoder_select').change(function () {
			$('tr.geocoder_options').hide();
			$('#geocoder_options_' + $(this).val()).show();
		}).change();

		$('#map_runtime').change(function() {
			var runtime = $(this).val();
			$('.mapbox_options').hide();
			if (runtime === 'mapboxgl') {
				$('.mapbox_options').show();
			}
		}).change();

		// Bulk manual run
		$('#jeo-bulk-run-manual-btn').on('click', function(e) {
			e.preventDefault();
			var $btn = $(this);
			$btn.prop('disabled', true).text('Processing...');

			$.ajax({
				url: jeo_settings.rest_url + '/bulk-ai-run',
				method: 'POST',
				beforeSend: function(xhr) {
					xhr.setRequestHeader('X-WP-Nonce', jeo_settings.nonce);
				},
				success: function(response) {
					alert(response.message);
					location.reload(); // Reload to show new logs and progress
				},
				error: function() {
					alert('Error triggering manual batch.');
					$btn.prop('disabled', false).text('Run 1 Batch Now');
				}
			});
		});

		// Bulk clear logs
		$('#jeo-bulk-clear-logs-btn').on('click', function(e) {
			e.preventDefault();
			if (!confirm('Are you sure you want to clear the logs?')) return;

			$.ajax({
				url: jeo_settings.rest_url + '/bulk-ai-clear-logs',
				method: 'POST',
				beforeSend: function(xhr) {
					xhr.setRequestHeader('X-WP-Nonce', jeo_settings.nonce);
				},
				success: function() {
					location.reload();
				}
			});
		});
	});
})(jQuery);