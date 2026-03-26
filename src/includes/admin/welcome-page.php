<div class="wrap jeo-welcome-wrap">
	
	<style>
		.jeo-welcome-container {
			max-width: 900px;
			margin: 40px auto;
			background: #fff;
			padding: 40px;
			border-radius: 8px;
			box-shadow: 0 5px 20px rgba(0,0,0,0.05);
			border: 1px solid #ccd0d4;
			min-height: 400px;
			position: relative;
		}

		/* Markdown Basic Styling */
		#jeo-readme-content h1 { font-size: 2.5em; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 0; color: #1d2327; }
		#jeo-readme-content h2 { font-size: 1.8em; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 30px; color: #1d2327; }
		#jeo-readme-content h3 { font-size: 1.4em; margin-top: 25px; }
		#jeo-readme-content p { line-height: 1.6; font-size: 15px; color: #3c434a; }
		#jeo-readme-content ul { list-style: disc; margin-left: 25px; }
		#jeo-readme-content li { margin-bottom: 8px; font-size: 15px; }
		#jeo-readme-content code { background: #f0f0f1; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; }
		#jeo-readme-content pre { background: #2c3338; color: #fff; padding: 20px; border-radius: 6px; overflow-x: auto; }
		#jeo-readme-content pre code { background: transparent; color: inherit; padding: 0; }
		#jeo-readme-content a { color: #007cba; text-decoration: none; }
		#jeo-readme-content a:hover { text-decoration: underline; }
		#jeo-readme-content blockquote { border-left: 4px solid #007cba; padding-left: 20px; font-style: italic; color: #50575e; margin: 20px 0; }

		/* Loader (Same as Dashboard) */
		.jeo-welcome-loader {
			position: absolute;
			top: 0; left: 0; width: 100%; height: 100%;
			background: #ffffff;
			border-radius: 8px;
			z-index: 100;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			transition: opacity 0.5s ease-in-out;
		}
		.jeo-welcome-loader.hidden { opacity: 0; pointer-events: none; }

		.jeo-pulse-icon {
			width: 60px; height: 60px;
			background: url('<?php echo esc_url( JEO_BASEURL . "/js/src/icons/jeo.svg" ); ?>') center center no-repeat;
			background-size: contain;
			animation: jeo-pulse-scale 1.5s infinite ease-in-out;
			margin-bottom: 20px;
		}
		@keyframes jeo-pulse-scale {
			0% { transform: scale(0.9); opacity: 0.7; }
			50% { transform: scale(1.1); opacity: 1; }
			100% { transform: scale(0.9); opacity: 0.7; }
		}
	</style>

	<div class="jeo-welcome-container">
		<nav id="jeo-readme-tabs" class="nav-tab-wrapper" style="margin-bottom: 30px; display: none;">
			<!-- Tabs injected here -->
		</nav>

		<div id="jeo-readme-content"></div>

		<div class="jeo-welcome-loader" id="jeo-welcome-loader">
			<div class="jeo-pulse-icon"></div>
			<p>Initializing JEO Documentation...</p>
		</div>
	</div>

	<script>
		document.addEventListener('DOMContentLoaded', function() {
			var readmeUrl = '<?php echo rest_url("jeo/v1/readme"); ?>';
			var wpNonce = '<?php echo wp_create_nonce("wp_rest"); ?>';
			var allDocs = [];

			function simpleMarkdown(md) {
				var html = md
					// Headers
					.replace(/^# (.*$)/gm, '<h1>$1</h1>')
					.replace(/^## (.*$)/gm, '<h2>$1</h2>')
					.replace(/^### (.*$)/gm, '<h3>$1</h3>')
					// Bold / Italic
					.replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
					.replace(/\*(.*)\*/g, '<em>$1</em>')
					// Links
					.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
					// Blockquotes
					.replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
					// Code blocks (simple)
					.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
					.replace(/`([^`]+)`/g, '<code>$1</code>')
					// Lists
					.replace(/^\* (.*$)/gm, '<li>$1</li>')
					.replace(/^- (.*$)/gm, '<li>$1</li>');

				// Wrap lists
				html = html.replace(/(<li>.*<\/li>)+/g, '<ul>$&</ul>');
				
				// Paragraphs (anything not a tag)
				return html.split('\n\n').map(p => {
					if (!p.trim()) return '';
					if (p.trim().startsWith('<')) return p;
					return '<p>' + p.replace(/\n/g, '<br>') + '</p>';
				}).join('');
			}

			function switchDoc(index) {
				var container = document.getElementById('jeo-readme-content');
				container.innerHTML = simpleMarkdown(allDocs[index].content);
				
				// Update active tab
				document.querySelectorAll('#jeo-readme-tabs .nav-tab').forEach((tab, i) => {
					tab.classList.toggle('nav-tab-active', i === index);
				});
			}

			fetch(readmeUrl, {
				headers: { 'X-WP-Nonce': wpNonce }
			})
			.then(res => res.json())
			.then(data => {
				if (data && Array.isArray(data)) {
					allDocs = data;
					var tabsContainer = document.getElementById('jeo-readme-tabs');
					
					if (allDocs.length > 1) {
						tabsContainer.style.display = 'flex';
						allDocs.forEach((doc, i) => {
							var tab = document.createElement('a');
							tab.href = '#';
							tab.className = 'nav-tab';
							tab.innerText = doc.label;
							tab.onclick = function(e) {
								e.preventDefault();
								switchDoc(i);
							};
							tabsContainer.appendChild(tab);
						});
					}

					// Load first doc by default
					switchDoc(0);
				}
				
				// Hide loader after a small delay for smoothness
				setTimeout(function() {
					document.getElementById('jeo-welcome-loader').classList.add('hidden');
				}, 600);
			})
			.catch(err => {
				console.error('Welcome Page Error:', err);
				document.getElementById('jeo-readme-content').innerHTML = '<p>Error loading documentation.</p>';
				document.getElementById('jeo-welcome-loader').classList.add('hidden');
			});
		});
	</script>
</div>
