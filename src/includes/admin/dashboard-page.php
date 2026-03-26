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
		
		/* Collapsible Title Overlay (Full Width to Icon) */
		.jeo-dashboard-header {
			position: absolute;
			top: 20px; left: 20px; right: 20px;
			background: rgba(255,255,255,0.98);
			border-radius: 8px;
			box-shadow: 0 4px 15px rgba(0,0,0,0.15);
			z-index: 100;
			display: flex;
			align-items: center;
			overflow: hidden;
			transition: width 0.4s cubic-bezier(0.25, 1, 0.5, 1), padding 0.4s ease, border-radius 0.4s ease;
			width: calc(100% - 40px); /* 100% minus the left and right margins */
			padding: 15px 20px;
			box-sizing: border-box;
		}
		.jeo-dashboard-header.minimized {
			width: 50px;
			padding: 10px;
			cursor: pointer;
			border-radius: 50%;
		}
		
		.jeo-dashboard-logo {
			width: 30px; height: 30px;
			background: url('<?php echo esc_url( JEO_BASEURL . "/js/src/icons/jeo.svg" ); ?>') center center no-repeat;
			background-size: contain;
			flex-shrink: 0;
			cursor: pointer;
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
		.jeo-dashboard-header.minimized .jeo-dashboard-header-content {
			opacity: 0;
			pointer-events: none;
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
	</style>

	<div id="jeo-dashboard-map"></div>
	
	<div class="jeo-dashboard-header" id="jeo-header-box">
		<div class="jeo-dashboard-logo" id="jeo-header-logo" title="<?php esc_attr_e( 'Toggle panel', 'jeo' ); ?>"></div>
		<div class="jeo-dashboard-header-content">
			<h1><?php esc_html_e( 'JEO Platform', 'jeo' ); ?></h1>
			<p id="jeo-pin-count"><?php esc_html_e( 'Loading geodata...', 'jeo' ); ?></p>
			<div class="jeo-dashboard-header-toggle" id="jeo-header-collapse" title="<?php esc_attr_e( 'Minimize Dashboard Header', 'jeo' ); ?>">&times;</div>
		</div>
	</div>

	<div class="jeo-dashboard-loader" id="jeo-dashboard-loader">
		<div class="jeo-pulse-icon"></div>
		<div class="jeo-loading-text"><?php esc_html_e( 'Gathering geodata and initializing JEO Engine...', 'jeo' ); ?></div>
	</div>

	<?php
		// Fetch Map Settings directly for inline use (safe for admin page)
		// Forcing MapLibre on Dashboard to avoid missing token errors unless user specifically wants Mapbox
		$map_runtime = \jeo_settings()->get_option( 'map_runtime' ) === 'mapboxgl' ? 'mapboxgl' : 'maplibregl';
		$mapbox_key  = \jeo_settings()->get_option( 'mapbox_key' );
		$default_lat = \jeo_settings()->get_option( 'map_default_lat' ) ?: -23.549985;
		$default_lon = \jeo_settings()->get_option( 'map_default_lon' ) ?: -46.633519;
		$default_zoom = \jeo_settings()->get_option( 'map_default_zoom' ) ?: 4;
		$rest_url = rest_url('jeo/v1/all-pins');
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
			var apiPinsUrl = '<?php echo esc_url_raw( $rest_url ); ?>';
			var wpNonce    = '<?php echo wp_create_nonce("wp_rest"); ?>';
			var isMapbox = (mapRuntime === 'mapboxgl');

			// Standard mapbox/maplibre style if nothing custom is present
			var mapStyle = (isMapbox && mapboxKey) ? 'mapbox://styles/mapbox/light-v11' : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

			if(isMapbox && mapboxKey) {
				mapboxgl.accessToken = mapboxKey;
			}

			// Initialize the Map object safely based on what is loaded
			var glObject = (typeof maplibregl !== 'undefined') ? maplibregl : (typeof mapboxgl !== 'undefined' ? mapboxgl : null);

			if (!glObject) {
				console.error('JEO: No map library loaded.');
				return;
			}

			var map = new glObject.Map({
				container: 'jeo-dashboard-map',
				style: mapStyle,
				center: [defaultLon, defaultLat],
				zoom: defaultZoom,
				attributionControl: false
			});

			map.addControl(new glObject.NavigationControl(), 'top-right');

			// Wait for the map style to load and for our AJAX to finish
			Promise.all([
				new Promise(resolve => map.on('load', resolve)),
				fetch(apiPinsUrl, {
					headers: { 'X-WP-Nonce': wpNonce }
				}).then(res => res.json())
			]).then(function(values) {
				
				var pins = values[1]; // The JSON array from /all-pins
				
				// Update Title
				document.getElementById('jeo-pin-count').innerText = pins.length + ' locations mapped across your site.';

				// Hide Loader & Show Map
				document.getElementById('jeo-dashboard-loader').classList.add('hidden');
				document.getElementById('jeo-dashboard-map').style.opacity = '1';

				// Remove Loader from DOM after animation
				setTimeout(function() {
					var l = document.getElementById('jeo-dashboard-loader');
					if(l) l.remove();
				}, 1000);

				// Bounds object to fit all pins
				if (pins.length > 0) {
					var bounds = new glObject.LngLatBounds();
					
					// Add markers with delay (staggered animation)
					pins.forEach(function(pin, index) {
						var lat = Number(pin.lat);
						var lng = Number(pin.lng);
						if (isNaN(lat) || isNaN(lng)) return;

						// Extend bounds to include this pin
						bounds.extend([lng, lat]);

						var el = document.createElement('div');
						el.className = 'jeo-pin-marker';
						el.style.display = 'block';

						var popupHTML = '<div class="jeo-dashboard-popup" style="padding: 10px; min-width: 200px;">';
						popupHTML += '<h3 style="margin:0 0 8px 0; font-size:15px; border-bottom:1px solid #eee; padding-bottom:5px;">' + (pin.title || 'Untitled Post') + '</h3>';
						popupHTML += '<p style="margin:0 0 10px 0; font-size:12px; color:#1d2327;"><strong>' + pin.name + '</strong></p>';
						if (pin.quote) {
							popupHTML += '<blockquote style="margin:0 0 15px 0; padding:8px 12px; border-left:3px solid #007cba; background:#f0f7ff; font-style:italic; font-size:12px; line-height: 1.4; color: #2c3338;">"' + pin.quote + '"</blockquote>';
						}
						popupHTML += '<div style="display:flex; gap:10px; margin-top:10px;">';
						popupHTML += '<a href="' + pin.view_url + '" class="button button-small" target="_blank">View Post</a>';
						popupHTML += '<a href="' + pin.edit_url + '" class="button button-small" target="_blank">Edit Post</a>';
						popupHTML += '</div></div>';

						var popup = new glObject.Popup({ offset: 25, closeButton: true }).setHTML(popupHTML);

						new glObject.Marker({ element: el })
							.setLngLat([lng, lat])
							.setPopup(popup)
							.addTo(map);

						setTimeout(function() {
							el.classList.add('drop');
						}, 100 + (index * 30));
					});

					// Transition to show all pins globally
					setTimeout(function() {
						map.fitBounds(bounds, {
							padding: 100,
							maxZoom: 12,
							duration: 2500 // 2.5 seconds smooth transition
						});
					}, 800);
				}

			}).catch(function(err) {
				console.error('JEO Map Dashboard Error:', err);
				document.querySelector('.jeo-loading-text').innerText = "Oops! Could not load geodata. Check console.";
			});

		});
	</script>
</div>