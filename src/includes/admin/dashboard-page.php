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
			height: calc(100vh - 32px); /* 100% minus the admin bar */
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
			opacity: 0; /* starts hidden until loaded */
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
			opacity: 0; /* starts hidden */
			transform: scale(0.1) translateY(50px);
			transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
		}
		
		/* Drop animation class added via JS */
		.jeo-pin-marker.drop {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
		
		/* Collapsible Title Overlay (MOVED TO BOTTOM) */
		.jeo-dashboard-header {
			position: absolute;
			bottom: 30px; left: 20px; right: 20px;
			background: rgba(255,255,255,0.98);
			border-radius: 8px;
			box-shadow: 0 4px 15px rgba(0,0,0,0.15);
			z-index: 100;
			display: flex;
			flex-direction: column;
			overflow: hidden;
			transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
			width: calc(100% - 40px);
			padding: 15px 20px;
			box-sizing: border-box;
		}
		.jeo-dashboard-header.minimized {
			width: 50px;
			height: 50px;
			padding: 10px;
			cursor: pointer;
			border-radius: 50%;
			bottom: 20px;
			left: 20px;
		}
		
		.jeo-dashboard-logo {
			width: 30px; height: 30px;
			background: url('<?php echo esc_url( JEO_BASEURL . "/js/src/icons/jeo.svg" ); ?>') center center no-repeat;
			background-size: contain;
			flex-shrink: 0;
			cursor: pointer;
		}
		.jeo-dashboard-header-main {
			display: flex;
			align-items: center;
			justify-content: space-between;
			width: 100%;
		}
		.jeo-dashboard-header-content {
			margin-left: 15px;
			white-space: nowrap;
			transition: opacity 0.3s;
			opacity: 1;
			flex-grow: 1;
			display: flex;
			align-items: center;
			justify-content: space-between;
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
			font-size: 20px;
			line-height: 1;
			padding: 5px;
		}
		.jeo-dashboard-header-toggle:hover { color: #007cba; }
		.jeo-dashboard-header.minimized .jeo-dashboard-header-toggle { display: none; }

		/* Filters Styling */
		.jeo-dashboard-filters {
			margin-top: 15px;
			padding-top: 15px;
			border-top: 1px solid #eee;
			display: flex;
			flex-direction: column;
			gap: 15px;
		}
		.jeo-filter-row {
			display: flex;
			gap: 20px;
			align-items: flex-end;
			flex-wrap: wrap;
		}
		.jeo-filter-group {
			display: flex;
			flex-direction: column;
			gap: 5px;
		}
		.jeo-filter-group label {
			font-size: 11px;
			font-weight: 600;
			text-transform: uppercase;
			color: #8c8f94;
		}
		.jeo-dashboard-filters input, .jeo-dashboard-filters select {
			border: 1px solid #ddd;
			border-radius: 4px;
			padding: 5px 10px;
			font-size: 13px;
			background: #fff;
		}
		#jeo-search-filter { width: 250px; }
		#jeo-post-type-filter { width: 150px; }
		#jeo-taxonomy-filter { width: 150px; }
		#jeo-term-filter { width: 200px; }
		#jeo-date-range { width: 100%; max-width: 800px; }
		.jeo-date-labels {
			display: flex;
			justify-content: space-between;
			font-size: 11px;
			color: #646970;
			max-width: 800px;
		}
	</style>

	<div id="jeo-dashboard-map"></div>
	
	<div class="jeo-dashboard-header" id="jeo-header-box">
		<div class="jeo-dashboard-header-main">
			<div class="jeo-dashboard-logo" id="jeo-header-logo" title="<?php esc_attr_e( 'Toggle panel', 'jeo' ); ?>"></div>
			<div class="jeo-dashboard-header-content">
				<h1><?php esc_html_e( 'JEO Platform', 'jeo' ); ?></h1>
				<p id="jeo-pin-count"><?php esc_html_e( 'Loading geodata...', 'jeo' ); ?></p>
				<div class="jeo-dashboard-header-toggle" id="jeo-header-collapse" title="<?php esc_attr_e( 'Minimize Dashboard Header', 'jeo' ); ?>">&times;</div>
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

				<button type="button" class="button button-primary" id="jeo-apply-filters">
					<?php esc_html_e( 'Apply Filters', 'jeo' ); ?>
				</button>
			</div>

			<div class="jeo-filter-group">
				<label><?php esc_html_e( 'Date Range', 'jeo' ); ?></label>
				<input type="range" id="jeo-date-range" min="0" max="100" value="100">
				<div class="jeo-date-labels">
					<span id="jeo-date-from">...</span>
					<span id="jeo-date-to"><?php esc_html_e( 'Today', 'jeo' ); ?></span>
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
			document.getElementById('jeo-header-collapse').addEventListener('click', function() {
				headerBox.classList.add('minimized');
			});
			document.getElementById('jeo-header-logo').addEventListener('click', function() {
				headerBox.classList.toggle('minimized');
			});

			// Configuration
			var mapRuntime = '<?php echo esc_js( $map_runtime ); ?>';
			var mapboxKey  = '<?php echo esc_js( $mapbox_key ); ?>';
			var defaultLat = parseFloat( '<?php echo esc_js( $default_lat ); ?>' );
			var defaultLon = parseFloat( '<?php echo esc_js( $default_lon ); ?>' );
			var defaultZoom = parseFloat( '<?php echo esc_js( $default_zoom ); ?>' );
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
			var dateRangeInput = document.getElementById('jeo-date-range');
			var dateFromLabel = document.getElementById('jeo-date-from');
			var postTypeSelect = document.getElementById('jeo-post-type-filter');
			var taxSelect = document.getElementById('jeo-taxonomy-filter');
			var termSelect = document.getElementById('jeo-term-filter');
			var taxGroup = document.getElementById('jeo-tax-group');
			var termGroup = document.getElementById('jeo-term-group');

			function updateDateLabel() {
				var val = parseInt(dateRangeInput.value);
				var currentTs = minTimestamp + ( (maxTimestamp - minTimestamp) * (val / 100) );
				var date = new Date(currentTs);
				dateFromLabel.innerText = date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
			}
			dateRangeInput.addEventListener('input', updateDateLabel);

			// Init
			initGLMaps();

			function initGLMaps() {
				var isMapbox = (mapRuntime === 'mapboxgl');
				var mapStyle = (isMapbox && mapboxKey) ? 'mapbox://styles/mapbox/light-v11' : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
				if(isMapbox && mapboxKey) mapboxgl.accessToken = mapboxKey;

				glObject = (typeof maplibregl !== 'undefined') ? maplibregl : (typeof mapboxgl !== 'undefined' ? mapboxgl : null);
				if (!glObject) return;

				map = new glObject.Map({
					container: 'jeo-dashboard-map',
					style: mapStyle,
					center: [defaultLon, defaultLat],
					zoom: defaultZoom,
					attributionControl: false
				});

				map.addControl(new glObject.NavigationControl(), 'top-right');

				map.on('load', function() {
					// Load initial stats and pins
					fetch(apiUrl + '/dashboard-stats', { headers: { 'X-WP-Nonce': wpNonce } })
					.then(res => res.json())
					.then(data => {
						dashboardData = data;
						setupFilters(data);
						fetchPins(true); // Initial fetch with 3 months default
					});
					
					document.getElementById('jeo-apply-filters').addEventListener('click', () => fetchPins(false));
				});
			}

			function setupFilters(data) {
				// Setup Date Range
				var minDate = new Date(data.min_date);
				minTimestamp = minDate.getTime();
				
				// Calculate default 3 months ago percentage
				var threeMonthsAgo = new Date();
				threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
				var defaultPct = Math.max(0, Math.min(100, ( (threeMonthsAgo.getTime() - minTimestamp) / (maxTimestamp - minTimestamp) ) * 100 ));
				dateRangeInput.value = Math.round(defaultPct);
				updateDateLabel();

				// Setup Post Types
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

			function fetchPins(isInitial) {
				var search = document.getElementById('jeo-search-filter').value;
				var pt = postTypeSelect.value;
				var tax = taxSelect.value;
				var term = termSelect.value;
				
				var val = parseInt(dateRangeInput.value);
				var afterTs = minTimestamp + ( (maxTimestamp - minTimestamp) * (val / 100) );
				var afterDate = new Date(afterTs).toISOString().split('T')[0];

				var url = new URL(apiUrl + '/all-pins');
				if (search) url.searchParams.append('search', search);
				if (pt) url.searchParams.append('post_type', pt);
				if (tax && term) {
					url.searchParams.append('taxonomy', tax);
					url.searchParams.append('term_id', term);
				}
				url.searchParams.append('after', afterDate);

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
						var lat = Number(pin.lat), lng = Number(pin.lng);
						if (isNaN(lat) || isNaN(lng)) return;
						bounds.extend([lng, lat]);
						var el = document.createElement('div');
						el.className = 'jeo-pin-marker';
						var popupHTML = '<div class="jeo-dashboard-popup" style="padding:10px;min-width:200px;">' +
							'<h3 style="margin:0 0 8px 0;font-size:15px;border-bottom:1px solid #eee;padding-bottom:5px;">' + (pin.title || 'Untitled') + '</h3>' +
							'<p style="margin:0 0 10px 0;font-size:12px;color:#1d2327;"><strong>' + pin.name + '</strong></p>';
						if (pin.quote) popupHTML += '<blockquote style="margin:0 0 15px 0;padding:8px 12px;border-left:3px solid #007cba;background:#f0f7ff;font-style:italic;font-size:12px;line-height:1.4;color:#2c3338;">"' + pin.quote + '"</blockquote>';
						popupHTML += '<div style="display:flex;gap:10px;margin-top:10px;"><a href="' + pin.view_url + '" class="button button-small" target="_blank">View Post</a><a href="' + pin.edit_url + '" class="button button-small" target="_blank">Edit Post</a></div></div>';
						var marker = new glObject.Marker({ element: el }).setLngLat([lng, lat]).setPopup(new glObject.Popup({ offset: 25 }).setHTML(popupHTML)).addTo(map);
						markers.push(marker);
						setTimeout(() => el.classList.add('drop'), 100 + (index * 20));
					});
					map.fitBounds(bounds, { padding: 100, maxZoom: 12, duration: 2000 });
				}
			}
		});
	</script>
</div>