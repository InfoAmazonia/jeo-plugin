<?php

namespace Jeo;

use WP_Post;

/**
 * Register and manage map posts.
 */
class Maps {

	use Singleton;
	use Rest_Validate_Meta;

	public $post_type = 'map';

	protected function init() {
		add_action( 'init', array( $this, 'register_post_type' ) );
		add_action( 'init', array( $this, 'register_shortcode' ) );
		add_filter( 'single_template', array( $this, 'override_template' ) );
		add_filter( 'the_content', array( $this, 'the_content_filter' ) );
		add_action( 'admin_init', array( $this, 'add_capabilities' ) );
		$this->register_rest_meta_validation();
	}

	public function register_post_type() {

		$labels = array(
			'name'                     => __( 'Maps', 'jeo' ),
			'singular_name'            => __( 'Map', 'jeo' ),
			'add_new'                  => __( 'Add new map', 'jeo' ),
			'add_new_item'             => __( 'Add new map', 'jeo' ),
			'edit_item'                => __( 'Edit map', 'jeo' ),
			'new_item'                 => __( 'New map', 'jeo' ),
			'view_item'                => __( 'View map', 'jeo' ),
			'view_items'               => __( 'View maps', 'jeo' ),
			'search_items'             => __( 'Search maps', 'jeo' ),
			'not_found'                => __( 'No map found', 'jeo' ),
			'not_found_in_trash'       => __( 'No map found in the trash', 'jeo' ),
			'menu_name'                => __( 'Maps', 'jeo' ),
			'item_published'           => __( 'Map published.', 'jeo' ),
			'item_published_privately' => __( 'Map published privately.', 'jeo' ),
			'item_reverted_to_draft'   => __( 'Map reverted to draft.', 'jeo' ),
			'item_scheduled'           => __( 'Map scheduled.', 'jeo' ),
			'item_updated'             => __( 'Map updated.', 'jeo' ),
		);

		$args = array(
			'labels'              => $labels,
			'hierarchical'        => true,
			'description'         => __( 'JEO Maps', 'jeo' ),
			'supports'            => array( 'author', 'title', 'editor', 'excerpt', 'thumbnail', 'page-attributes', 'custom-fields', 'newspack_blocks', 'revisions' ),
			'rewrite'             => array( 'slug' => 'maps' ),
			'public'              => true,
			'show_in_menu'        => 'jeo-main-menu',
			'show_in_rest'        => true,
			'menu_position'       => 4,
			'menu_icon'           => 'data:image/svg+xml;base64,' . base64_encode( file_get_contents( JEO_BASEPATH . '/js/src/icons/map.svg' ) ),
			'has_archive'         => true,
			'exclude_from_search' => true,
			'capabilities'        => array(
				'edit_post'          => 'edit_map',
				'edit_posts'         => 'edit_maps',
				'edit_others_posts'  => 'edit_others_maps',

				'publish_posts'      => 'publish_maps',
				'read_post'          => 'read_map',
				'read_private_posts' => 'read_private_maps',

				'delete_post'        => 'delete_map',
			),
			// 'map_meta_cap' => true,
			// 'capability_type' => 'post',
		);

		register_post_type( $this->post_type, $args );

		register_post_meta(
			$this->post_type,
			'initial_zoom',
			array(
				'revisions_enabled' => true,
				'show_in_rest'      => true,
				'single'            => true,
				'auth_callback'     => '__return_true',
				'sanitize_callback' => array( $this, 'sanitize_meta_initial_zoom' ),
				'type'              => 'number',
				'description'       => __( 'The map initial zoom level', 'jeo' ),
			)
		);

		register_post_meta(
			$this->post_type,
			'center_lat',
			array(
				'revisions_enabled' => true,
				'show_in_rest'      => true,
				'single'            => true,
				'auth_callback'     => '__return_true',
				'type'              => 'number',
				'description'       => __( 'The map initial latitude', 'jeo' ),
			)
		);

		register_post_meta(
			$this->post_type,
			'center_lon',
			array(
				'revisions_enabled' => true,
				'show_in_rest'      => true,
				'single'            => true,
				'auth_callback'     => '__return_true',
				'type'              => 'number',
				'description'       => __( 'The map initial longitude', 'jeo' ),
			)
		);

		register_post_meta(
			$this->post_type,
			'layers',
			array(
				'revisions_enabled' => true,
				'show_in_rest'      => array(
					'schema' => array(
						'items' => array(
							'type'       => 'object',
							'properties' => array(
								'id'            => array(
									'description' => __( 'The Layer ID', 'jeo' ),
									'type'        => 'integer',
								),
								'use'           => array(
									'description' => __( 'How this layer is used in this map. Can be fixed, switchable or swappable', 'jeo' ),
									'type'        => 'string',
								),
								'load_as_style' => array(
									'description' => __( 'If the layer is loaded into the mapbox as a style (setStyle) or layer (addLayer)', 'jeo' ),
									'type'        => 'boolean',
								),
								'style_layers'  => array(
									'description' => __( 'Mapbox style layers', 'jeo' ),
									'type'        => 'array',
									'items'       => array(
										'type'       => 'object',
										'properties' => array(
											'id'   => array(
												'description' => __( 'The Layer ID', 'jeo' ),
												'type' => 'string',
											),
											'show' => array(
												'description' => __( 'If the style should render the layer', 'jeo' ),
												'type' => 'boolean',
											),
										),
									),
								),
								'default'       => array(
									'description' => __( 'Indicates whether this layer is visible by default', 'jeo' ),
									'type'        => 'boolean',
								),
								'show_legend'   => array(
									'description' => __( 'Indicates if the legend of this layer should be displayed or not', 'jeo' ),
									'type'        => 'boolean',
								),
							),
							'required'   => array( 'id', 'use' ),
						),

					),
				),
				'single'            => true,
				'auth_callback'     => '__return_true',
				'type'              => 'array',
				'description'       => __( 'The map Layers', 'jeo' ),
			)
		);

		register_post_meta(
			$this->post_type,
			'pan_limits',
			array(
				'revisions_enabled' => true,
				'show_in_rest'      => array(
					'schema' => array(
						'properties' => array(
							'east'  => array(
								'description' => __( 'East pan limit', 'jeo' ),
								'type'        => 'number',
							),
							'north' => array(
								'description' => __( 'North pan limit', 'jeo' ),
								'type'        => 'number',
							),
							'south' => array(
								'description' => __( 'South pan limit', 'jeo' ),
								'type'        => 'number',
							),
							'west'  => array(
								'description' => __( 'West pan limit', 'jeo' ),

								'type'        => 'number',
							),
						),
					),
				),
				'single'            => true,
				'auth_callback'     => '__return_true',
				'type'              => 'object',
				'description'       => __( 'Map pan limits', 'jeo' ),
			)
		);

		register_post_meta(
			$this->post_type,
			'related_posts',
			array(
				'revisions_enabled' => true,
				'show_in_rest'      => array(
					'schema' => array(
						'properties' => array(
							'categories' => array(
								'description' => __( 'List of category IDs related posts must have', 'jeo' ),
								'type'        => 'array',
								'items'       => array(
									'type' => 'integer',
								),
							),
							'tags'       => array(
								'description' => __( 'List of tag IDs related posts must have', 'jeo' ),
								'type'        => 'array',
								'items'       => array(
									'type' => 'integer',
								),
							),
							'before'     => array(
								'description' => __( 'Maximum date for related posts', 'jeo' ),
								'type'        => 'string',
							),
							'after'      => array(
								'description' => __( 'Minimum date for related posts', 'jeo' ),
								'type'        => 'string',
							),
							'meta_query' => array(
								'description' => __( 'List of meta values related posts must have', 'jeo' ),
								'type'        => 'array',
								'items'       => array(
									'type'       => 'object',
									'properties' => array(
										'key'     => array(
											'type' => 'string',
										),
										'compare' => array(
											'type' => 'string',
										),
										'value'   => array(
											'type' => 'string',
										),
									),
								),
							),
						),
					),

				),
				'single'            => true,
				'auth_callback'     => '__return_true',
				'type'              => 'object',
				'description'       => __( 'The map criteria to get related posts', 'jeo' ),
			)
		);

		register_post_meta(
			$this->post_type,
			'disable_scroll_zoom',
			array(
				'revisions_enabled' => true,
				'show_in_rest'      => true,
				'single'            => true,
				'auth_callback'     => '__return_true',
				'type'              => 'boolean',
				'description'       => __( 'Disable scroll zoom', 'jeo' ),
			)
		);

		register_post_meta(
			$this->post_type,
			'disable_drag_pan',
			array(
				'revisions_enabled' => true,
				'show_in_rest'      => true,
				'single'            => true,
				'auth_callback'     => '__return_true',
				'type'              => 'boolean',
				'description'       => __( 'Disable drag pan', 'jeo' ),
			)
		);

		register_post_meta(
			$this->post_type,
			'disable_drag_rotate',
			array(
				'revisions_enabled' => true,
				'show_in_rest'      => true,
				'single'            => true,
				'auth_callback'     => '__return_true',
				'type'              => 'boolean',
				'description'       => __( 'Disable drag rotation', 'jeo' ),
			)
		);

		register_post_meta(
			$this->post_type,
			'enable_fullscreen',
			array(
				'revisions_enabled' => true,
				'show_in_rest'      => true,
				'single'            => true,
				'auth_callback'     => '__return_true',
				'type'              => 'boolean',
				'description'       => __( 'Enable fullscreen button', 'jeo' ),
			)
		);

		register_post_meta(
			$this->post_type,
			'relate_posts',
			array(
				'revisions_enabled' => true,
				'show_in_rest'      => true,
				'single'            => true,
				'auth_callback'     => '__return_true',
				'type'              => 'boolean',
				'description'       => __( 'Show all posts on map', 'jeo' ),
			)
		);

		register_post_meta(
			$this->post_type,
			'min_zoom',
			array(
				'revisions_enabled' => true,
				'show_in_rest'      => true,
				'single'            => true,
				'auth_callback'     => '__return_true',
				'type'              => 'number',
				'description'       => __( 'Minimum Zoom level', 'jeo' ),
			)
		);

		register_post_meta(
			$this->post_type,
			'max_zoom',
			array(
				'revisions_enabled' => true,
				'show_in_rest'      => true,
				'single'            => true,
				'auth_callback'     => '__return_true',
				'type'              => 'number',
				'description'       => __( 'Maximum zoom level', 'jeo' ),
			)
		);

		register_post_meta(
			$this->post_type,
			'hide_in_discovery',
			array(
				'revisions_enabled' => true,
				'show_in_rest'      => true,
				'single'            => true,
				'auth_callback'     => '__return_true',
				'type'              => 'boolean',
				'description'       => __( 'Hide in discovery', 'jeo' ),
			)
		);

		register_post_meta(
			$this->post_type,
			'disable_embed',
			array(
				'revisions_enabled' => true,
				'show_in_rest'      => true,
				'single'            => true,
				'auth_callback'     => '__return_true',
				'type'              => 'boolean',
				'description'       => __( 'Disable embed', 'jeo' ),
			)
		);
	}

	/**
	 * Return the list of map metadata keys used in frontend previews.
	 *
	 * @return string[]
	 */
	private function get_preview_meta_keys() {
		return array(
			'initial_zoom',
			'center_lat',
			'center_lon',
			'layers',
			'pan_limits',
			'related_posts',
			'disable_scroll_zoom',
			'disable_drag_pan',
			'disable_drag_rotate',
			'enable_fullscreen',
			'relate_posts',
			'min_zoom',
			'max_zoom',
			'hide_in_discovery',
			'disable_embed',
		);
	}

	/**
	 * Read post meta without letting WordPress' preview meta filter rewrite the
	 * response for the parent post.
	 *
	 * @param int    $post_id Post ID.
	 * @param string $meta_key Meta key.
	 * @return mixed
	 */
	private function get_unfiltered_post_meta_value( int $post_id, string $meta_key ) {
		$preview_meta_filter_priority = has_filter( 'get_post_metadata', '_wp_preview_meta_filter' );

		if ( false !== $preview_meta_filter_priority ) {
			remove_filter( 'get_post_metadata', '_wp_preview_meta_filter', $preview_meta_filter_priority );
		}

		$meta_value = get_post_meta( $post_id, $meta_key, true );

		if ( false !== $preview_meta_filter_priority ) {
			add_filter( 'get_post_metadata', '_wp_preview_meta_filter', $preview_meta_filter_priority, 4 );
		}

		return $meta_value;
	}

	/**
	 * Resolve preview metadata using the autosave revision when available, while
	 * safely falling back to the published post value.
	 *
	 * @param int     $post_id Parent post ID.
	 * @param WP_Post $preview_post Preview post or autosave revision.
	 * @param string  $meta_key Meta key.
	 * @return mixed
	 */
	private function get_preview_meta_value( int $post_id, WP_Post $preview_post, string $meta_key ) {
		if ( $preview_post->ID !== $post_id && metadata_exists( 'post', $preview_post->ID, $meta_key ) ) {
			return get_post_meta( $preview_post->ID, $meta_key, true );
		}

		return $this->get_unfiltered_post_meta_value( $post_id, $meta_key );
	}

	/**
	 * Build a preview-aware map payload for the single map template.
	 *
	 * @param int $post_id Map post ID.
	 * @return array|null
	 */
	public function get_preview_map_payload( int $post_id ) {
		$preview_post = \jeo()->get_preview_post( $post_id );
		if ( ! $preview_post instanceof WP_Post ) {
			return null;
		}

		$meta = array();
		foreach ( $this->get_preview_meta_keys() as $meta_key ) {
			$meta[ $meta_key ] = $this->get_preview_meta_value( $post_id, $preview_post, $meta_key );
		}

		$the_content_filter_priority = has_filter( 'the_content', array( $this, 'the_content_filter' ) );
		if ( false !== $the_content_filter_priority ) {
			remove_filter( 'the_content', array( $this, 'the_content_filter' ), $the_content_filter_priority );
		}

		$rendered_content = apply_filters( 'the_content', $preview_post->post_content );

		if ( false !== $the_content_filter_priority ) {
			add_filter( 'the_content', array( $this, 'the_content_filter' ), $the_content_filter_priority );
		}

		return array(
			'id'      => $post_id,
			'slug'    => get_post_field( 'post_name', $post_id ),
			'title'   => array(
				'rendered' => $preview_post->post_title,
			),
			'content' => array(
				'rendered' => $rendered_content,
			),
			'meta'    => $meta,
		);
	}

	/**
	 * Sanitize a map-center coordinate.
	 *
	 * @param mixed $meta_value Raw coordinate value.
	 * @return int
	 */
	public function sanitize_meta_center( $meta_value ) {
		return intval( $meta_value );
	}

	/**
	 * Validates the zoom metadata value
	 *
	 * @param  mixed $value The value to be validated
	 * @return void|\WP_Error Returns a \WP_Error object in case the value is invalid
	 */
	public function validate_meta_initial_zoom( $value ) {
		// WordPress is already validating if it is a number

		$val = intval( $value );
		if ( $val < 1 || $val > 14 ) {
			return new \WP_Error( 'rest_invalid_field', __( 'Map zoom must be between 1 and 14', 'jeo' ), array( 'status' => 400 ) );
		}
	}

	public function register_shortcode() {
		\add_shortcode( 'jeo-map', array( $this, 'map_shortcode' ) );
	}

	public function map_shortcode( $atts ) {

		$atts = \shortcode_atts(
			array(
				'map_id' => 0,
				'width'  => '',
				'height' => '',
			),
			$atts
		);

		$map_id = (int) $atts['map_id'];

		if ( $atts['map_id'] < 1 ) {
			return '';
		}

		$div = '<div class="jeomap map_id_"' . $map_id . '" ';

		$w     = $atts['width'];
		$h     = $atts['height'];
		$style = '';

		if ( ! empty( $w ) ) {
			$style .= 'style="width: ' . $atts['width'] . '; ';
		}

		if ( ! empty( $h ) ) {
			$style .= 'height: ' . $atts['height'] . ';"';
		}

		if ( ! empty( $tyle ) ) {
			$div .= 'style="' . $style . '"';
		}

		$div .= '></div>';

		return $div;
	}

	public function the_content_filter( $content ) {

		if ( get_post_type() !== 'map' ) {
			return $content;
		}

		// Only when visiting the Map single page
		if ( is_single( get_the_id() ) ) {
			$map_id  = get_the_ID();
			$div     = "<div class='jeomap map_id_'{$map_id}'";
			$content = $div . $content;
		}

		$layers_def = get_post_meta( get_the_ID(), 'layers', true );

		if ( is_array( $layers_def ) ) {

				$layers_ids = array_values(
					array_filter(
						array_map(
							function ( $layer_item ) {
								if ( is_array( $layer_item ) && isset( $layer_item['id'] ) ) {
									return (int) $layer_item['id'];
								}

								if ( is_object( $layer_item ) && isset( $layer_item->id ) ) {
									return (int) $layer_item->id;
								}

								return 0;
							},
							$layers_def
						)
					)
				);

			if ( empty( $layers_ids ) ) {
				return $content;
			}

			$layers = new \WP_Query(
				array(
					'post_type'        => 'map-layer',
					'post__in'         => $layers_ids,
					'orderby'          => 'post__in',
					'nopaging'         => true,
					'suppress_filters' => true,
				)
			);

			$template = \jeo_get_template( 'map-content-layers-list.php' );

			$return = '<div class="map-content-layers-list">';

			ob_start();

			while ( $layers->have_posts() ) {

				$layers->the_post();

				$source_url       = get_post_meta( get_the_ID(), 'source_url', true );
				$attribution      = get_post_meta( get_the_ID(), 'attribution', true );
				$attribution_name = get_post_meta( get_the_ID(), 'attribution_name', true );

				if ( $source_url || $attribution || $attribution_name ) {
					include $template;
				}
			}

			$return .= \ob_get_clean();

			\wp_reset_postdata();

			$return .= '</div>';

			$content .= $return;

		}

		return $content;
	}

	public function add_capabilities() {
		$roles = array( 'author', 'editor', 'administrator', 'contributor' );
		$types = array( 'map', 'map-layer', 'storymap' );
		foreach ( $roles as $role ) {
			$role_obj = get_role( $role );

			foreach ( $types as $type ) {
				$role_obj->add_cap( "edit_{$type}" );
				$role_obj->add_cap( "edit_{$type}s" );
				$role_obj->add_cap( "delete_{$type}" );
				$role_obj->add_cap( "read_{$type}" );
				$role_obj->add_cap( "read_{$type}s" );
				if ( 'contributor' !== $type ) {
					$role_obj->add_cap( "edit_others_{$type}s" );
					$role_obj->add_cap( "publish_{$type}s" );
					$role_obj->add_cap( "read_private_{$type}s" );
					$role_obj->add_cap( 'edit_published_blocks' );
				}
			}
		}
	}

	public function override_template( $template ) {
		global $post;

		if ( is_singular( 'map' ) ) {
			return JEO_BASEPATH . '/templates/single-map.php';
		}

		return $template;
	}
}
