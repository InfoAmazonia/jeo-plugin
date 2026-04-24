<div class="wrap jeo-dashboard-wrap">
	
	<style>
		/* Full height logic specific for WP Admin */
		html.wp-toolbar { padding-top: 32px; }
		#wpcontent { padding-left: 0; }
		#wpbody { padding-top: 0; }
		#wpbody-content { padding-bottom: 0; }
		#wpfooter { display: none; } /* Hide WP footer on dashboard to prevent scroll */
		
		.jeo-dashboard-wrap {
			margin: 0;
			padding: 0;
			width: 100%;
			height: calc(100vh - 32px);
			position: relative;
			background: #f0f0f1;
			overflow: hidden;
		}

		/* Loading Overlay */
		.jeo-dashboard-loader {
			position: absolute;
			top: 0; left: 0; width: 100%; height: 100%;
			background: #ffffff;
			z-index: 9999;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			transition: opacity 0.8s ease-in-out;
		}
		.jeo-dashboard-loader.hidden {
			opacity: 0;
			pointer-events: none;
		}

		.jeo-pulse-icon {
			width: 80px; height: 80px;
			background: url('<?php echo esc_url( JEO_BASEURL . "/js/src/icons/jeo.svg" ); ?>') center center no-repeat;
			background-size: contain;
			animation: jeo-pulse-scale 1.5s infinite ease-in-out;
			margin-bottom: 20px;
		}

		.jeo-loading-text {
			font-size: 18px;
			color: #3c434a;
			font-weight: 500;
		}

		@keyframes jeo-pulse-scale {
			0% { transform: scale(0.9); opacity: 0.7; }
			50% { transform: scale(1.1); opacity: 1; }
			100% { transform: scale(0.9); opacity: 0.7; }
		}

		/* Map Container */
		#jeo-dashboard-map {
			width: 100%;
			height: 100%;
			opacity: 0;
			transition: opacity 1s ease-in-out;
		}

		/* Map Markers / Pins Animation */
		.jeo-pin-marker {
			width: 24px;
			height: 24px;
			background-color: #007cba;
			border: 3px solid #fff;
			border-radius: 50%;
			box-shadow: 0 4px 6px rgba(0,0,0,0.3);
			cursor: pointer;
			opacity: 0;
			transform: scale(0.1) translateY(50px);
			transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
		}
		
		.jeo-pin-marker.drop {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
		
		/* Dashboard Header / Bottom Panel */
		.jeo-dashboard-header {
			position: absolute;
			bottom: 30px; left: 20px; right: 20px;
			background: rgba(255,255,255,0.98);
			border-radius: 12px;
			box-shadow: 0 8px 30px rgba(0,0,0,0.2);
			z-index: 100;
			display: flex;
			flex-direction: column;
			overflow: hidden;
			transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
			width: calc(100% - 40px);
			padding: 20px 25px;
			box-sizing: border-box;
			max-height: 500px;
			opacity: 1;
			transform: translateY(0);
		}

		.jeo-dashboard-header.minimized {
			width: 60px;
			height: 60px;
			padding: 15px;
			cursor: pointer;
			border-radius: 50%;
			bottom: 30px;
			left: 20px;
			right: auto;
			max-height: 60px;
			transform: translateY(0);
			background: #1d2327;
		}

		.jeo-dashboard-header.minimized .jeo-dashboard-logo {
			filter: brightness(0) invert(1);
			width: 30px; height: 30px;
		}
		
		.jeo-dashboard-logo {
			width: 30px; height: 30px;
			background: url('<?php echo esc_url( JEO_BASEURL . "/js/src/icons/jeo.svg" ); ?>') center center no-repeat;
			background-size: contain;
			flex-shrink: 0;
			cursor: pointer;
			transition: all 0.3s ease;
		}

		.jeo-dashboard-header-main {
			display: flex;
			align-items: center;
			justify-content: space-between;
			width: 100%;
			transition: opacity 0.3s ease;
		}
		
		.jeo-dashboard-header-content {
			margin-left: 15px;
			white-space: nowrap;
			flex-grow: 1;
			display: flex;
			align-items: center;
			justify-content: space-between;
			transition: all 0.3s ease;
		}

		.jeo-dashboard-header.minimized .jeo-dashboard-header-content,
		.jeo-dashboard-header.minimized .jeo-dashboard-filters {
			opacity: 0;
			pointer-events: none;
			display: none;
		}
		
		.jeo-dashboard-header h1 {
			margin: 0; padding: 0; font-size: 18px; color: #1d2327; font-weight: 600;
		}
		.jeo-dashboard-header p {
			margin: 0; color: #646970; font-size: 13px; font-weight: 500;
		}
		.jeo-dashboard-header-toggle {
			margin-left: 20px;
			color: #a7aaad;
			cursor: pointer;
			font-size: 22px;
			line-height: 1;
			padding: 5px;
			transition: color 0.2s ease;
		}
		.jeo-dashboard-header-toggle:hover { color: #d63638; }

		/* Filters Styling */
		.jeo-dashboard-filters {
			margin-top: 20px;
			padding-top: 20px;
			border-top: 1px solid #eee;
			display: flex;
			flex-direction: column;
			gap: 20px;
			transition: opacity 0.4s ease;
		}

		.jeo-filter-row {
			display: flex;
			gap: 15px;
			align-items: flex-end;
			flex-wrap: wrap;
		}

		.jeo-filter-group {
			display: flex;
			flex-direction: column;
			gap: 8px;
		}

		.jeo-filter-group label {
			font-size: 10px;
			font-weight: 700;
			text-transform: uppercase;
			color: #8c8f94;
			letter-spacing: 0.5px;
		}

		.jeo-dashboard-filters input, .jeo-dashboard-filters select {
			border: 1px solid #ddd;
			border-radius: 6px;
			padding: 8px 12px;
			font-size: 13px;
			background: #fff;
			box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
		}

		#jeo-search-filter { width: 280px; }
		#jeo-post-type-filter, #jeo-taxonomy-filter { width: 160px; }
		#jeo-term-filter { width: 200px; }

		/* DUAL RANGE SLIDER CSS */
		.jeo-range-slider-container {
			position: relative;
			width: 100%;
			max-width: 900px;
			height: 40px;
			margin-top: 10px;
		}
		.jeo-range-slider-track {
			position: absolute;
			width: 100%;
			height: 6px;
			background: #e2e4e7;
			border-radius: 3px;
			top: 50%;
			transform: translateY(-50%);
		}
		.jeo-range-slider-active-track {
			position: absolute;
			height: 6px;
			background: #007cba;
			border-radius: 3px;
			top: 50%;
			transform: translateY(-50%);
			z-index: 1;
		}
		.jeo-range-input {
			position: absolute;
			width: 100%;
			top: 50%;
			transform: translateY(-50%);
			background: none;
			pointer-events: none;
			-webkit-appearance: none;
			appearance: none;
			margin: 0;
			z-index: 2;
		}
		.jeo-range-input::-webkit-slider-thumb {
			height: 20px;
			width: 20px;
			border-radius: 50%;
			background: #fff;
			border: 2px solid #007cba;
			cursor: pointer;
			pointer-events: auto;
			-webkit-appearance: none;
			box-shadow: 0 2px 5px rgba(0,0,0,0.2);
		}
		.jeo-range-input::-moz-range-thumb {
			height: 18px;
			width: 18px;
			border-radius: 50%;
			background: #fff;
			border: 2px solid #007cba;
			cursor: pointer;
			pointer-events: auto;
			box-shadow: 0 2px 5px rgba(0,0,0,0.2);
		}

		.jeo-date-labels {
			display: flex;
			justify-content: space-between;
			font-size: 12px;
			font-weight: 600;
			color: #1d2327;
			margin-top: 5px;
			max-width: 900px;
		}
		.jeo-date-labels span {
			background: #f0f0f1;
			padding: 2px 8px;
			border-radius: 4px;
		}

	</style>

	<div id="jeo-dashboard-map"></div>
	
	<div class="jeo-dashboard-header" id="jeo-header-box">
		<div class="jeo-dashboard-header-main">
			<div class="jeo-dashboard-logo" id="jeo-header-logo" title="<?php esc_attr_e( 'Toggle panel', 'jeo' ); ?>"></div>
			<div class="jeo-dashboard-header-content">
				<h1><?php esc_html_e( 'JEO Platform', 'jeo' ); ?></h1>
				<p id="jeo-pin-count"><?php esc_html_e( 'Loading geodata...', 'jeo' ); ?></p>
				<div class="jeo-dashboard-header-toggle" id="jeo-header-collapse" title="<?php esc_attr_e( 'Minimize Dashboard', 'jeo' ); ?>">&times;</div>
			</div>
		</div>

		<div class="jeo-dashboard-filters">
			<div class="jeo-filter-row">
				<div class="jeo-filter-group">
					<label for="jeo-search-filter"><?php esc_html_e( 'Search terms', 'jeo' ); ?></label>
					<input type="text" id="jeo-search-filter" placeholder="<?php esc_attr_e( 'Title or content...', 'jeo' ); ?>">
				</div>

				<div class="jeo-filter-group">
					<label for="jeo-post-type-filter"><?php esc_html_e( 'Post Type', 'jeo' ); ?></label>
					<select id="jeo-post-type-filter">
						<option value=""><?php esc_html_e( 'All Types', 'jeo' ); ?></option>
					</select>
				</div>

				<div class="jeo-filter-group" id="jeo-tax-group" style="display:none;">
					<label for="jeo-taxonomy-filter"><?php esc_html_e( 'Taxonomy', 'jeo' ); ?></label>
					<select id="jeo-taxonomy-filter"></select>
				</div>

				<div class="jeo-filter-group" id="jeo-term-group" style="display:none;">
					<label for="jeo-term-filter"><?php esc_html_e( 'Term', 'jeo' ); ?></label>
					<select id="jeo-term-filter"></select>
				</div>

				<button type="button" class="button button-primary" id="jeo-apply-filters" style="height:37px;">
					<?php esc_html_e( 'Apply Filters', 'jeo' ); ?>
				</button>
			</div>

			<div class="jeo-filter-group">
				<label><?php esc_html_e( 'Timeline Range', 'jeo' ); ?></label>
				<div class="jeo-range-slider-container">
					<div class="jeo-range-slider-track"></div>
					<div class="jeo-range-slider-active-track" id="jeo-range-active-track"></div>
					<input type="range" class="jeo-range-input" id="jeo-range-min" min="0" max="100" value="0">
					<input type="range" class="jeo-range-input" id="jeo-range-max" min="0" max="100" value="100">
				</div>
				<div class="jeo-date-labels">
					<span id="jeo-date-from-label">...</span>
					<span id="jeo-date-to-label">...</span>
				</div>
			</div>
		</div>
	</div>

	<div class="jeo-dashboard-loader" id="jeo-dashboard-loader">
		<div class="jeo-pulse-icon"></div>
		<div class="jeo-loading-text"><?php esc_html_e( 'Gathering geodata and initializing JEO Engine...', 'jeo' ); ?></div>
	</div>

	<?php
		$map_runtime = \jeo_settings()->get_option( 'map_runtime' );
		if ( ! in_array( $map_runtime, array( 'mapboxgl' ) ) ) {
			$map_runtime = 'maplibregl';
		}
		$mapbox_key  = \jeo_settings()->get_option( 'mapbox_key' );
		$default_lat = \jeo_settings()->get_option( 'map_default_lat' ) ?: -23.549985;
		$default_lon = \jeo_settings()->get_option( 'map_default_lon' ) ?: -46.633519;
		$default_zoom = \jeo_settings()->get_option( 'map_default_zoom' ) ?: 4;
		$rest_url = rest_url('jeo/v1');
	?>

	<script>
		document.addEventListener('DOMContentLoaded', function() {

			// UI Toggle Logic
			var headerBox = document.getElementById('jeo-header-box');
			document.getElementById('jeo-header-collapse').addEventListener('click', function(e) {
				e.stopPropagation();
				headerBox.classList.add('minimized');
			});
			document.getElementById('jeo-header-logo').addEventListener('click', function() {
				headerBox.classList.toggle('minimized');
			});
			headerBox.addEventListener('click', function() {
				if (this.classList.contains('minimized')) {
					this.classList.remove('minimized');
				}
			});

			// Configuration
			var apiUrl     = '<?php echo esc_url_raw( $rest_url ); ?>';
			var wpNonce    = '<?php echo wp_create_nonce("wp_rest"); ?>';

			// State
			var markers = [];
			var map = null;
			var glObject = null;
			var dashboardData = null;
			var minTimestamp = 0;
			var maxTimestamp = new Date().getTime();

			// Elements
			var rangeMinInput = document.getElementById('jeo-range-min');
			var rangeMaxInput = document.getElementById('jeo-range-max');
			var activeTrack = document.getElementById('jeo-range-active-track');
			var dateFromLabel = document.getElementById('jeo-date-from-label');
			var dateToLabel = document.getElementById('jeo-date-to-label');
			
			var postTypeSelect = document.getElementById('jeo-post-type-filter');
			var taxSelect = document.getElementById('jeo-taxonomy-filter');
			var termSelect = document.getElementById('jeo-term-filter');
			var taxGroup = document.getElementById('jeo-tax-group');
			var termGroup = document.getElementById('jeo-term-group');

			function updateRangeUI() {
				var minVal = parseInt(rangeMinInput.value);
				var maxVal = parseInt(rangeMaxInput.value);

				if (minVal > maxVal) {
					var temp = minVal;
					rangeMinInput.value = maxVal;
					rangeMaxInput.value = temp;
					minVal = parseInt(rangeMinInput.value);
					maxVal = parseInt(rangeMaxInput.value);
				}

				activeTrack.style.left = minVal + '%';
				activeTrack.style.width = (maxVal - minVal) + '%';

				var fromTs = minTimestamp + ( (maxTimestamp - minTimestamp) * (minVal / 100) );
				var toTs = minTimestamp + ( (maxTimestamp - minTimestamp) * (maxVal / 100) );
				
				dateFromLabel.innerText = new Date(fromTs).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
				dateToLabel.innerText = new Date(toTs).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
			}

			rangeMinInput.addEventListener('input', updateRangeUI);
			rangeMaxInput.addEventListener('input', updateRangeUI);

			// Init
			initGLMaps();

			function initGLMaps() {
				var mapRuntime = '<?php echo esc_js( $map_runtime ); ?>';
				var mapboxKey  = '<?php echo esc_js( $mapbox_key ); ?>';
				var isMapbox = (mapRuntime === 'mapboxgl');
				var mapStyle = (isMapbox && mapboxKey) ? 'mapbox://styles/mapbox/streets-v11' : {
					version: 8,
					sources: {
						osm: {
							type: 'raster',
							tiles: [
								'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
								'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
							],
							tileSize: 256,
							attribution: '© OpenStreetMap Contributors',
							maxzoom: 19,
						},
					},
					layers: [
						{
							id: 'osm',
							type: 'raster',
							source: 'osm',
						},
					],
				};
				if(isMapbox && mapboxKey) mapboxgl.accessToken = mapboxKey;

				glObject = (typeof maplibregl !== 'undefined') ? maplibregl : (typeof mapboxgl !== 'undefined' ? mapboxgl : null);
				if (!glObject) return;

				map = new glObject.Map({
					container: 'jeo-dashboard-map',
					style: mapStyle,
					center: [<?php echo (float)$default_lon; ?>, <?php echo (float)$default_lat; ?>],
					zoom: <?php echo (int)$default_zoom; ?>,
					attributionControl: false
				});

				map.addControl(new glObject.NavigationControl(), 'top-right');

				map.on('load', function() {
					fetch(apiUrl + '/dashboard-stats', { headers: { 'X-WP-Nonce': wpNonce } })
					.then(res => res.json())
					.then(data => {
						dashboardData = data;
						setupFilters(data);
						fetchPins();
					});
					
					document.getElementById('jeo-apply-filters').addEventListener('click', fetchPins);
				});
			}

			function setupFilters(data) {
				minTimestamp = new Date(data.min_date).getTime();
				
				// Pre-select last 3 months
				var threeMonthsAgo = new Date();
				threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
				var minPct = Math.max(0, Math.min(100, ( (threeMonthsAgo.getTime() - minTimestamp) / (maxTimestamp - minTimestamp) ) * 100 ));
				
				rangeMinInput.value = Math.round(minPct);
				rangeMaxInput.value = 100;
				updateRangeUI();

				data.post_types.forEach(pt => {
					var opt = document.createElement('option');
					opt.value = pt.slug;
					opt.innerText = pt.label;
					postTypeSelect.appendChild(opt);
				});

				postTypeSelect.addEventListener('change', function() {
					var pt = data.post_types.find(t => t.slug === this.value);
					taxSelect.innerHTML = '<option value="">Select Taxonomy...</option>';
					if (pt && pt.taxonomies.length > 0) {
						pt.taxonomies.forEach(tax => {
							var opt = document.createElement('option');
							opt.value = tax.slug;
							opt.innerText = tax.label;
							taxSelect.appendChild(opt);
						});
						taxGroup.style.display = 'block';
					} else {
						taxGroup.style.display = 'none';
						termGroup.style.display = 'none';
					}
				});

				taxSelect.addEventListener('change', function() {
					var pt = data.post_types.find(t => t.slug === postTypeSelect.value);
					var tax = pt ? pt.taxonomies.find(x => x.slug === this.value) : null;
					termSelect.innerHTML = '<option value="">Select Term...</option>';
					if (tax && tax.terms.length > 0) {
						tax.terms.forEach(term => {
							var opt = document.createElement('option');
							opt.value = term.id;
							opt.innerText = term.name;
							termSelect.appendChild(opt);
						});
						termGroup.style.display = 'block';
					} else {
						termGroup.style.display = 'none';
					}
				});
			}

			function fetchPins() {
				var search = document.getElementById('jeo-search-filter').value;
				var pt = postTypeSelect.value;
				var tax = taxSelect.value;
				var term = termSelect.value;
				
				var minTs = minTimestamp + ( (maxTimestamp - minTimestamp) * (parseInt(rangeMinInput.value) / 100) );
				var maxTs = minTimestamp + ( (maxTimestamp - minTimestamp) * (parseInt(rangeMaxInput.value) / 100) );

				var url = new URL(apiUrl + '/all-pins');
				if (search) url.searchParams.append('search', search);
				if (pt) url.searchParams.append('post_type', pt);
				if (tax && term) {
					url.searchParams.append('taxonomy', tax);
					url.searchParams.append('term_id', term);
				}
				url.searchParams.append('after', new Date(minTs).toISOString().split('T')[0]);
				url.searchParams.append('before', new Date(maxTs).toISOString().split('T')[0]);

				var loader = document.getElementById('jeo-dashboard-loader');
				if (loader) loader.classList.remove('hidden');

				fetch(url, { headers: { 'X-WP-Nonce': wpNonce } })
				.then(res => res.json())
				.then(pins => {
					renderPins(pins);
					if (loader) loader.classList.add('hidden');
					document.getElementById('jeo-dashboard-map').style.opacity = '1';
				});
			}

			function renderPins(pins) {
				markers.forEach(m => m.remove());
				markers = [];
				document.getElementById('jeo-pin-count').innerText = pins.length + ' locations found.';
				if (pins.length > 0) {
					var bounds = new glObject.LngLatBounds();
					pins.forEach((pin, index) => {
						var lat = Number(pin.lat), lon = Number(pin.lon);
						if (isNaN(lat) || isNaN(lon)) return;
						bounds.extend([lon, lat]);
						var el = document.createElement('div');
						el.className = 'jeo-pin-marker';
						var popupHTML = '<div class="jeo-dashboard-popup" style="padding:10px;min-width:200px;">' +
							'<h3 style="margin:0 0 8px 0;font-size:15px;border-bottom:1px solid #eee;padding-bottom:5px;">' + (pin.title || 'Untitled') + '</h3>' +
							'<p style="margin:0 0 10px 0;font-size:12px;color:#1d2327;"><strong>' + pin.name + '</strong></p>';
						if (pin.quote) popupHTML += '<blockquote style="margin:0 0 15px 0;padding:8px 12px;border-left:3px solid #007cba;background:#f0f7ff;font-style:italic;font-size:12px;line-height:1.4;color:#2c3338;">"' + pin.quote + '"</blockquote>';
						popupHTML += '<div style="display:flex;gap:10px;margin-top:10px;"><a href="' + pin.view_url + '" class="button button-small" target="_blank">View Post</a><a href="' + pin.edit_url + '" class="button button-small" target="_blank">Edit Post</a></div></div>';
						var marker = new glObject.Marker({ element: el }).setLngLat([lon, lat]).setPopup(new glObject.Popup({ offset: 25 }).setHTML(popupHTML)).addTo(map);
						markers.push(marker);
						setTimeout(() => el.classList.add('drop'), 100 + (index * 20));
					});
					map.fitBounds(bounds, { padding: 100, maxZoom: 12, duration: 2000 });
				}
			}
		});
	</script>
</div>