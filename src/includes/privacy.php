<?php
/**
 * Privacy compliance for JEO.
 *
 * Registers privacy policy content, personal data exporters, and erasers.
 *
 * @package Jeo
 */

/**
 * Register JEO privacy policy content via WordPress core helper.
 *
 * @return void
 */
function jeo_add_privacy_policy_content() {
	if ( ! function_exists( 'wp_add_privacy_policy_content' ) ) {
		return;
	}

	$content  = '<p>' . __( 'JEO collects and stores geolocation metadata for posts when authors explicitly geotag content. This may include latitude, longitude, and reverse-geocoded address components (city, region, country, postcode). This data is attached to the post and is available to anyone with access to the post.', 'jeowp' ) . '</p>';
	$content .= '<p>' . __( 'When the "Stories Near You" feature is enabled, visitors may opt in to share their browser geolocation. This location is sent to the site server solely to retrieve nearby posts and is not stored.', 'jeowp' ) . '</p>';
	$content .= '<p>' . __( 'If AI-powered georeferencing is enabled, post titles and content may be sent to external AI providers (e.g., OpenAI, Google Gemini). AI usage logs (provider name, token counts) are stored locally as private posts and are not shared externally.', 'jeowp' ) . '</p>';
	$content .= '<p>' . __( 'Geocoding requests may be sent to third-party services such as Nominatim (OpenStreetMap) or Mapbox, depending on the active geocoder.', 'jeowp' ) . '</p>';

	wp_add_privacy_policy_content(
		'JEO',
		wp_kses_post( $content )
	);
}
add_action( 'admin_init', 'jeo_add_privacy_policy_content' );

/**
 * Register a personal data exporter for JEO geolocation metadata.
 *
 * @param array $exporters Registered exporters.
 * @return array
 */
function jeo_register_personal_data_exporter( $exporters ) {
	$exporters['jeo-geolocation'] = array(
		'exporter_friendly_name' => __( 'JEO Geolocation Metadata', 'jeowp' ),
		'callback'               => 'jeo_geolocation_personal_data_exporter',
	);
	return $exporters;
}
add_filter( 'wp_privacy_personal_data_exporters', 'jeo_register_personal_data_exporter' );

/**
 * Export personal data related to JEO geolocation.
 *
 * @param string $email_address Email of the user whose data is being exported.
 * @param int    $page          Page number.
 * @return array
 */
function jeo_geolocation_personal_data_exporter( $email_address, $page = 1 ) {
	$user = get_user_by( 'email', $email_address );
	if ( ! $user ) {
		return array(
			'data' => array(),
			'done' => true,
		);
	}

	$export_items = array();
	$post_types   = \jeo_settings()->get_option( 'enabled_post_types', array( 'post' ) );

	$query = new \WP_Query(
		array(
			'author'         => $user->ID,
			'post_type'      => $post_types,
			'posts_per_page' => 50,
			'paged'          => $page,
			'post_status'    => 'any',
			'meta_query'     => array(
				array(
					'key'     => '_related_point',
					'compare' => 'EXISTS',
				),
			),
		)
	);

	foreach ( $query->posts as $post ) {
		$points = get_post_meta( $post->ID, '_related_point', false );
		if ( empty( $points ) || ! is_array( $points ) ) {
			continue;
		}

		$item_data = array();
		foreach ( $points as $index => $point ) {
			if ( ! is_array( $point ) ) {
				continue;
			}
			foreach ( $point as $key => $value ) {
				if ( is_array( $value ) ) {
					$value = wp_json_encode( $value );
				}
				$item_data[] = array(
					'name'  => sprintf( '[%d] %s', $index, sanitize_key( $key ) ),
					'value' => (string) $value,
				);
			}
		}

		$export_items[] = array(
			'group_id'    => 'jeo-geolocation',
			'group_label' => __( 'JEO Geolocation', 'jeowp' ),
			'item_id'     => 'post-' . $post->ID,
			'data'        => $item_data,
		);
	}

	return array(
		'data' => $export_items,
		'done' => ! $query->have_posts(),
	);
}

/**
 * Register a personal data eraser for JEO geolocation metadata.
 *
 * @param array $erasers Registered erasers.
 * @return array
 */
function jeo_register_personal_data_eraser( $erasers ) {
	$erasers['jeo-geolocation'] = array(
		'eraser_friendly_name' => __( 'JEO Geolocation Metadata', 'jeowp' ),
		'callback'             => 'jeo_geolocation_personal_data_eraser',
	);
	return $erasers;
}
add_filter( 'wp_privacy_personal_data_erasers', 'jeo_register_personal_data_eraser' );

/**
 * Erase personal data related to JEO geolocation.
 *
 * @param string $email_address Email of the user whose data is being erased.
 * @param int    $page          Page number.
 * @return array
 */
function jeo_geolocation_personal_data_eraser( $email_address, $page = 1 ) {
	$user = get_user_by( 'email', $email_address );
	if ( ! $user ) {
		return array(
			'items_removed'  => false,
			'items_retained' => false,
			'messages'       => array(),
			'done'           => true,
		);
	}

	$items_removed = 0;
	$post_types    = \jeo_settings()->get_option( 'enabled_post_types', array( 'post' ) );

	$query = new \WP_Query(
		array(
			'author'         => $user->ID,
			'post_type'      => $post_types,
			'posts_per_page' => 50,
			'paged'          => $page,
			'post_status'    => 'any',
			'meta_query'     => array(
				array(
					'key'     => '_related_point',
					'compare' => 'EXISTS',
				),
			),
		)
	);

	foreach ( $query->posts as $post ) {
		$points = get_post_meta( $post->ID, '_related_point', false );
		if ( ! empty( $points ) ) {
			delete_post_meta( $post->ID, '_related_point' );
			++$items_removed;
		}
	}

	return array(
		'items_removed'  => $items_removed > 0,
		'items_retained' => false,
		'messages'       => array(),
		'done'           => ! $query->have_posts(),
	);
}
