<?php
/**
 * Stories Near You block — displays geolocated posts sorted by proximity.
 *
 * @package Jeo
 */

namespace Jeo;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers and renders the Stories Near You block.
 *
 * Self-registering class that handles block registration, REST endpoint,
 * SQL geolocation query, and frontend asset enqueuing.
 */
class Stories_Near_You {

	use Singleton;

	/**
	 * Initialize hooks.
	 *
	 * @return void
	 */
	protected function init() {
		add_action( 'init', array( $this, 'register_assets' ) );
		add_action( 'init', array( $this, 'register_block_type' ) );
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_frontend_assets' ) );
		add_action( 'enqueue_block_assets', array( $this, 'enqueue_editor_assets' ) );
	}

	/**
	 * Register the Stories Near You block type.
	 *
	 * @return void
	 */
	public function register_block_type() {
		register_block_type(
			'jeo/stories-near-you',
			array(
				'api_version'     => 3,
				'render_callback' => array( $this, 'render_callback' ),
				'editor_script'   => 'jeo-map-blocks',
				'editor_style'    => 'jeo-map-blocks',
				'attributes'      => array(
					'postsPerPage'  => array(
						'type'    => 'number',
						'default' => 6,
					),
					'postsPerRow'   => array(
						'type'    => 'number',
						'default' => 3,
					),
					'category'      => array(
						'type'    => 'number',
						'default' => 0,
					),
					'tag'           => array(
						'type'    => 'number',
						'default' => 0,
					),
					'showThumbnail' => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'showCategory'  => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'showDate'      => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'showExcerpt'   => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'showAuthor'    => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'lat'           => array(
						'type'    => 'number',
						'default' => 0,
					),
					'lng'           => array(
						'type'    => 'number',
						'default' => 0,
					),
				),
			)
		);
	}

	/**
	 * Render the block on the frontend — outputs skeleton placeholder + data attributes.
	 *
	 * @param array $attributes Block attributes.
	 * @return string
	 */
	public function render_callback( $attributes ) {
		static $rendered_ids = array();

		$atts = wp_parse_args(
			$attributes,
			array(
				'postsPerPage'  => 6,
				'postsPerRow'   => 3,
				'category'      => 0,
				'tag'           => 0,
				'showThumbnail' => true,
				'showCategory'  => true,
				'showDate'      => true,
				'showExcerpt'   => true,
				'showAuthor'    => true,
				'lat'           => 0,
				'lng'           => 0,
			)
		);

		$use_preview_coords = ! empty( $atts['lat'] ) || ! empty( $atts['lng'] );

		if ( $use_preview_coords ) {
			$lat          = (float) $atts['lat'];
			$lng          = (float) $atts['lng'];
			$post_ids     = $this->get_nearby_posts( $lat, $lng, $atts['category'], $atts['tag'], $atts['postsPerPage'], $rendered_ids );
			$rendered_ids = array_merge( $rendered_ids, $post_ids );

			$wrapper_attrs = get_block_wrapper_attributes(
				array(
					'class' => 'wp-block-jeo-stories-near-you',
				)
			);

			ob_start();
			?>
			<div <?php echo $wrapper_attrs; // phpcs:ignore WordPress.Security.EscapeOutput -- get_block_wrapper_attributes() returns escaped HTML. ?>>
				<?php if ( empty( $post_ids ) ) : ?>
					<?php echo $this->render_empty_state(); // phpcs:ignore WordPress.Security.EscapeOutput -- internal method uses escaping. ?>
				<?php else : ?>
					<?php echo $this->render_posts( $post_ids, $atts ); // phpcs:ignore WordPress.Security.EscapeOutput -- internal method uses escaping. ?>
				<?php endif; ?>
			</div>
			<?php
			return ob_get_clean();
		}

		$wrapper_attrs = get_block_wrapper_attributes(
			array(
				'class' => 'wp-block-jeo-stories-near-you',
			)
		);

		ob_start();
		?>
		<div <?php echo $wrapper_attrs; // phpcs:ignore WordPress.Security.EscapeOutput -- get_block_wrapper_attributes() returns escaped HTML. ?>>
			<div class="jeo-stories-near-you__skeleton jeo-stories-near-you__grid jeo-stories-near-you__grid--cols-<?php echo (int) $atts['postsPerRow']; ?>">
				<?php for ( $i = 0; $i < (int) $atts['postsPerPage']; $i++ ) : ?>
				<article class="jeo-stories-near-you__skeleton-card">
					<?php if ( $atts['showThumbnail'] ) : ?>
					<div class="jeo-stories-near-you__skeleton-thumb"></div>
					<?php endif; ?>
					<div class="jeo-stories-near-you__skeleton-content">
						<?php if ( $atts['showCategory'] ) : ?>
						<div class="jeo-stories-near-you__skeleton-line jeo-stories-near-you__skeleton-line--short"></div>
						<?php endif; ?>
						<div class="jeo-stories-near-you__skeleton-line jeo-stories-near-you__skeleton-line--title"></div>
						<div class="jeo-stories-near-you__skeleton-line jeo-stories-near-you__skeleton-line--title jeo-stories-near-you__skeleton-line--narrow"></div>
						<?php if ( $atts['showDate'] ) : ?>
						<div class="jeo-stories-near-you__skeleton-line jeo-stories-near-you__skeleton-line--medium"></div>
						<?php endif; ?>
						<?php if ( $atts['showAuthor'] ) : ?>
						<div class="jeo-stories-near-you__skeleton-line jeo-stories-near-you__skeleton-line--short"></div>
						<?php endif; ?>
						<?php if ( $atts['showExcerpt'] ) : ?>
						<div class="jeo-stories-near-you__skeleton-line"></div>
						<div class="jeo-stories-near-you__skeleton-line"></div>
						<div class="jeo-stories-near-you__skeleton-line jeo-stories-near-you__skeleton-line--short"></div>
						<?php endif; ?>
					</div>
				</article>
				<?php endfor; ?>
			</div>
			<div class="jeo-stories-near-you__error hidden">
				<p><?php esc_html_e( 'Unable to load stories near you.', 'jeo' ); ?></p>
			</div>
			<script type="application/json" class="jeo-stories-near-you-attrs"><?php echo wp_json_encode( array_merge( $atts, array( 'excludeIds' => $rendered_ids ) ) ); ?></script>
		</div>
		<?php
		return ob_get_clean();
	}

	/**
	 * Register the REST endpoint for fetching nearby posts.
	 *
	 * @return void
	 */
	public function register_rest_routes() {
		register_rest_route(
			'jeo/v1',
			'/stories-near-you',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'api_get_posts' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'lat'           => array(
						'type'     => 'number',
						'required' => false,
					),
					'lng'           => array(
						'type'     => 'number',
						'required' => false,
					),
					'postsPerPage'  => array(
						'type'    => 'integer',
						'default' => 6,
						'minimum' => 1,
						'maximum' => 36,
					),
					'postsPerRow'   => array(
						'type'    => 'integer',
						'default' => 3,
						'minimum' => 1,
						'maximum' => 6,
					),
					'category'      => array(
						'type'    => 'integer',
						'default' => 0,
					),
					'tag'           => array(
						'type'    => 'integer',
						'default' => 0,
					),
					'showThumbnail' => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'showCategory'  => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'showDate'      => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'showExcerpt'   => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'showAuthor'    => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'excludeIds'    => array(
						'type'    => 'string',
						'default' => '',
					),
				),
			)
		);
	}

	/**
	 * Register the Stories Near You stylesheet.
	 *
	 * @return void
	 */
	public function register_assets() {
		wp_register_style(
			'jeo-stories-near-you',
			JEO_BASEURL . '/css/stories-near-you.css',
			array(),
			JEO_VERSION
		);
	}

	/**
	 * Enqueue frontend CSS and JS when the block is present on the page.
	 *
	 * @return void
	 */
	public function enqueue_frontend_assets() {
		if ( ! has_block( 'jeo/stories-near-you' ) ) {
			return;
		}

		$asset_file = file_exists( JEO_BASEPATH . '/js/build/storiesNearYou.asset.php' ) ? include JEO_BASEPATH . '/js/build/storiesNearYou.asset.php' : array(
			'dependencies' => array(),
			'version'      => JEO_VERSION,
		);

		wp_enqueue_style( 'jeo-stories-near-you' );

		wp_enqueue_script(
			'jeo-stories-near-you',
			JEO_BASEURL . '/js/build/storiesNearYou.js',
			$asset_file['dependencies'] ?? array(),
			$asset_file['version'] ?? JEO_VERSION,
			true
		);
	}

	/**
	 * Enqueue editor CSS for both iframe (WP 7.x) and non-iframe (WP 6.x) contexts.
	 *
	 * @return void
	 */
	public function enqueue_editor_assets() {
		if ( ! is_admin() ) {
			return;
		}

		wp_enqueue_style( 'jeo-stories-near-you' );
	}

	/**
	 * REST callback: resolve location, query nearby posts, return rendered HTML.
	 *
	 * @param \WP_REST_Request $request Current REST request.
	 * @return \WP_REST_Response
	 */
	public function api_get_posts( \WP_REST_Request $request ) {
		$lat = $request->get_param( 'lat' );
		$lng = $request->get_param( 'lng' );

		if ( null === $lat || null === $lng ) {
			$location = $this->resolve_server_location();
			$lat      = $location['lat'];
			$lng      = $location['lng'];
		}

		$atts = array(
			'postsPerPage'  => (int) $request->get_param( 'postsPerPage' ),
			'postsPerRow'   => (int) $request->get_param( 'postsPerRow' ),
			'category'      => (int) $request->get_param( 'category' ),
			'tag'           => (int) $request->get_param( 'tag' ),
			'showThumbnail' => filter_var( $request->get_param( 'showThumbnail' ), FILTER_VALIDATE_BOOLEAN ),
			'showCategory'  => filter_var( $request->get_param( 'showCategory' ), FILTER_VALIDATE_BOOLEAN ),
			'showDate'      => filter_var( $request->get_param( 'showDate' ), FILTER_VALIDATE_BOOLEAN ),
			'showExcerpt'   => filter_var( $request->get_param( 'showExcerpt' ), FILTER_VALIDATE_BOOLEAN ),
			'showAuthor'    => filter_var( $request->get_param( 'showAuthor' ), FILTER_VALIDATE_BOOLEAN ),
		);

		$exclude_ids = $this->parse_exclude_ids( $request->get_param( 'excludeIds' ) );
		$post_ids    = $this->get_nearby_posts( $lat, $lng, $atts['category'], $atts['tag'], $atts['postsPerPage'], $exclude_ids );

		if ( empty( $post_ids ) ) {
			return new \WP_REST_Response(
				array(
					'html' => $this->render_empty_state(),
				),
				200
			);
		}

		$html = $this->render_posts( $post_ids, $atts );

		return new \WP_REST_Response(
			array(
				'html' => $html,
			),
			200
		);
	}

	/**
	 * Parse a comma-separated string of post IDs into a sanitized array.
	 *
	 * @param string $raw Comma-separated post IDs.
	 * @return int[] Sanitized post IDs.
	 */
	protected function parse_exclude_ids( $raw ) {
		if ( empty( $raw ) || ! is_string( $raw ) ) {
			return array();
		}
		$parts = explode( ',', $raw );
		$ids   = array();
		foreach ( $parts as $part ) {
			$val = absint( trim( $part ) );
			if ( $val > 0 ) {
				$ids[] = $val;
			}
		}
		return array_unique( $ids );
	}

	/**
	 * Resolve server-side location using JEO map center defaults.
	 *
	 * @return array{lat: float, lng: float}
	 */
	protected function resolve_server_location() {
		$lat = \jeo_settings()->get_option( 'map_default_lat' );
		$lng = \jeo_settings()->get_option( 'map_default_lng' );

		return array(
			'lat' => $lat ? (float) $lat : -23.549985,
			'lng' => $lng ? (float) $lng : -46.633519,
		);
	}

	/**
	 * Query geolocated posts sorted by distance using ST_Distance_Sphere.
	 *
	 * @param float $lat         Latitude of the reference point.
	 * @param float $lng         Longitude of the reference point.
	 * @param int   $category_id Optional category term ID to filter by.
	 * @param int   $tag_id      Optional tag term ID to filter by.
	 * @param int   $limit       Maximum number of posts to return.
	 * @param int[] $exclude_ids Post IDs to exclude from results.
	 * @return int[] Post IDs ordered by ascending distance.
	 */
	protected function get_nearby_posts( $lat, $lng, $category_id, $tag_id, $limit, $exclude_ids = array() ) {
		global $wpdb;

		$limit   = max( 1, min( 36, (int) $limit ) );
		$lat     = (float) $lat;
		$lng     = (float) $lng;
		$enabled = \jeo_settings()->get_option( 'enabled_post_types', array( 'post' ) );
		$types   = array_map( 'sanitize_key', $enabled );
		$types   = array_filter( $types );

		if ( empty( $types ) ) {
			$types = array( 'post' );
		}

		$types_placeholders = implode( ',', array_fill( 0, count( $types ), '%s' ) );

		$taxonomy_join  = '';
		$taxonomy_where = '';

		if ( ! empty( $category_id ) ) {
			$taxonomy_join  .= " INNER JOIN {$wpdb->term_relationships} tr_cat ON p.ID = tr_cat.object_id";
			$taxonomy_join  .= " INNER JOIN {$wpdb->term_taxonomy} tt_cat ON tr_cat.term_taxonomy_id = tt_cat.term_taxonomy_id";
			$taxonomy_where .= " AND tt_cat.taxonomy = 'category' AND tt_cat.term_id = " . (int) $category_id;
		}

		if ( ! empty( $tag_id ) ) {
			$taxonomy_join  .= " INNER JOIN {$wpdb->term_relationships} tr_tag ON p.ID = tr_tag.object_id";
			$taxonomy_join  .= " INNER JOIN {$wpdb->term_taxonomy} tt_tag ON tr_tag.term_taxonomy_id = tt_tag.term_taxonomy_id";
			$taxonomy_where .= " AND tt_tag.taxonomy = 'post_tag' AND tt_tag.term_id = " . (int) $tag_id;
		}

		$exclude_clause = '';
		if ( ! empty( $exclude_ids ) ) {
			$exclude_list   = implode( ',', array_map( 'absint', $exclude_ids ) );
			$exclude_clause = " AND p.ID NOT IN ({$exclude_list})";
		}

		$primary_template = "
			SELECT p.ID,
				ST_Distance_Sphere(POINT(%f, %f), POINT(CAST(tlon.meta_value AS DECIMAL(10,6)), CAST(tlat.meta_value AS DECIMAL(10,6)))) AS distance
			FROM {$wpdb->posts} p
			INNER JOIN (
				SELECT post_id, meta_value
				FROM {$wpdb->postmeta}
				WHERE meta_key = '_geocode_lon_p'
				GROUP BY post_id
			) tlon ON p.ID = tlon.post_id
			INNER JOIN (
				SELECT post_id, meta_value
				FROM {$wpdb->postmeta}
				WHERE meta_key = '_geocode_lat_p'
				GROUP BY post_id
			) tlat ON p.ID = tlat.post_id
			{$taxonomy_join}
			WHERE p.post_status = 'publish'
				AND p.post_type IN ({$types_placeholders})
				{$taxonomy_where}
				{$exclude_clause}";

		$secondary_template = str_replace(
			array( '_geocode_lon_p', '_geocode_lat_p' ),
			array( '_geocode_lon_s', '_geocode_lat_s' ),
			$primary_template
		);

		$union_sql    = $primary_template . ' UNION ' . $secondary_template . ' ORDER BY distance ASC LIMIT %d';
		$all_params   = array_merge( array( $lng, $lat ), $types, array( $lng, $lat ), $types, array( $limit ) );
		$prepared_sql = $wpdb->prepare( $union_sql, $all_params ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared -- Template uses %f/%s/%d placeholders; interpolated vars are table identifiers and sanitized ints.
		$results      = $wpdb->get_results( $prepared_sql ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared

		if ( empty( $results ) ) {
			return array();
		}

		$seen = array();
		$ids  = array();
		foreach ( $results as $row ) {
			$pid = (int) $row->ID;
			if ( ! isset( $seen[ $pid ] ) ) {
				$seen[ $pid ] = true;
				$ids[]        = $pid;
			}
		}

		return $ids;
	}

	/**
	 * Render the post grid container with all post cards.
	 *
	 * @param int[] $post_ids Ordered post IDs.
	 * @param array $atts     Block attributes.
	 * @return string
	 */
	protected function render_posts( $post_ids, $atts ) {
		$cols = (int) $atts['postsPerRow'];
		ob_start();
		?>
		<div class="jeo-stories-near-you__grid jeo-stories-near-you__grid--cols-<?php echo esc_attr( $cols ); ?>">
			<?php
			foreach ( $post_ids as $post_id ) {
				echo $this->render_post_card( $post_id, $atts ); // phpcs:ignore WordPress.Security.EscapeOutput -- render_post_card() uses escaping internally.
			}
			?>
		</div>
		<?php
		return ob_get_clean();
	}

	/**
	 * Render a single post card as an HTML article element.
	 *
	 * @param int   $post_id Post ID.
	 * @param array $atts    Block attributes (display toggles).
	 * @return string
	 */
	protected function render_post_card( $post_id, $atts ) {
		$post      = get_post( $post_id );
		$title     = get_the_title( $post_id );
		$permalink = get_permalink( $post_id );
		$excerpt   = has_excerpt( $post_id ) ? get_the_excerpt( $post_id ) : wp_trim_words( wp_strip_all_tags( $post->post_content ), 20 );
		$date      = get_the_date( '', $post_id );

		ob_start();
		?>
		<article class="jeo-stories-near-you__post" data-post-id="<?php echo (int) $post_id; ?>">
			<?php if ( $atts['showThumbnail'] && has_post_thumbnail( $post_id ) ) : ?>
			<figure class="jeo-stories-near-you__post-featured-image">
				<a href="<?php echo esc_url( $permalink ); ?>">
					<?php
					echo get_the_post_thumbnail(
						$post_id,
						'medium_large',
						array(
							'alt'   => esc_attr( $title ),
							'class' => 'jeo-stories-near-you__post-image',
						)
					);
					?>
				</a>
			</figure>
			<?php elseif ( $atts['showThumbnail'] ) : ?>
			<div class="jeo-stories-near-you__post-featured-image jeo-stories-near-you__post-featured-image--placeholder"></div>
			<?php endif; ?>

			<div class="jeo-stories-near-you__post-content">
				<?php if ( $atts['showCategory'] ) : ?>
					<?php $cats = get_the_category( $post_id ); ?>
					<?php if ( ! empty( $cats ) ) : ?>
					<span class="jeo-stories-near-you__post-terms">
						<?php foreach ( $cats as $cat ) : ?>
						<span class="jeo-stories-near-you__post-term"><?php echo esc_html( $cat->name ); ?></span>
						<?php endforeach; ?>
					</span>
					<?php endif; ?>
				<?php endif; ?>

				<h3 class="jeo-stories-near-you__post-title">
					<a href="<?php echo esc_url( $permalink ); ?>"><?php echo esc_html( $title ); ?></a>
				</h3>

				<?php if ( $atts['showDate'] ) : ?>
				<time class="jeo-stories-near-you__post-date" datetime="<?php echo esc_attr( get_the_date( 'c', $post_id ) ); ?>">
					<?php echo esc_html( $date ); ?>
				</time>
				<?php endif; ?>

			<?php if ( $atts['showAuthor'] ) : ?>
				<span class="jeo-stories-near-you__post-author">
					<?php
					$author_names = array();
					if ( function_exists( 'get_coauthors' ) ) {
						$coauthors = get_coauthors( $post_id );
						foreach ( $coauthors as $coauthor ) {
							if ( ! empty( $coauthor->display_name ) ) {
								$author_names[] = $coauthor->display_name;
							}
						}
					}
					if ( empty( $author_names ) ) {
						$author_names[] = get_the_author_meta( 'display_name', $post->post_author );
					}
					echo esc_html( implode( ', ', $author_names ) );
					?>
				</span>
			<?php endif; ?>

				<?php if ( $atts['showExcerpt'] ) : ?>
				<p class="jeo-stories-near-you__post-excerpt"><?php echo esc_html( $excerpt ); ?></p>
				<?php endif; ?>
			</div>
		</article>
		<?php
		return ob_get_clean();
	}

	/**
	 * Render the empty state when no posts are found.
	 *
	 * @return string
	 */
	protected function render_empty_state() {
		ob_start();
		?>
		<div class="jeo-stories-near-you__empty">
			<p><?php esc_html_e( 'No stories found near you.', 'jeo' ); ?></p>
		</div>
		<?php
		return ob_get_clean();
	}
}
