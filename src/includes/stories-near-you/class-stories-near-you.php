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

require_once __DIR__ . '/trait-stories-near-you-gutenberg.php';
require_once __DIR__ . '/trait-stories-near-you-newspack.php';

/**
 * Registers and renders the Stories Near You block.
 *
 * Self-registering class that handles block registration, REST endpoint,
 * SQL geolocation query, and frontend asset enqueuing.
 * Rendering is delegated to the Gutenberg or Newspack trait based on context.
 */
class Stories_Near_You {

	use Singleton;
	use Stories_Near_You_Gutenberg;
	use Stories_Near_You_Newspack;

	const POST_LAYOUTS    = array( 'grid', 'list' );
	const MEDIA_POSITIONS = array( 'top', 'left', 'right', 'behind' );
	const IMAGE_SHAPES    = array( 'landscape', 'portrait', 'square', 'uncropped' );
	const ORDER_BY        = array( 'nearest', 'recent', 'relevance' );
	const MAX_AGE_DAYS    = 3650;

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
				'supports'        => array(
					'align' => true,
					'color' => array(
						'text'       => true,
						'custom'     => true,
						'background' => false,
						'gradients'  => false,
						'link'       => true,
					),
				),
				'attributes'      => array(
					'postsPerPage'       => array(
						'type'    => 'number',
						'default' => 6,
					),
					'postsPerRow'        => array(
						'type'    => 'number',
						'default' => 3,
					),
					'category'           => array(
						'type'    => 'number',
						'default' => 0,
					),
					'tag'                => array(
						'type'    => 'number',
						'default' => 0,
					),
					'cardLayout'         => array(
						'type'    => 'string',
						'default' => '',
					),
					'showThumbnail'      => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'showCategory'       => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'showDate'           => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'showExcerpt'        => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'showAuthor'         => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'lat'                => array(
						'type'    => 'number',
						'default' => 0,
					),
					'lng'                => array(
						'type'    => 'number',
						'default' => 0,
					),
					'postLayout'         => array(
						'type'    => 'string',
						'default' => 'grid',
					),
					'mediaPosition'      => array(
						'type'    => 'string',
						'default' => 'top',
					),
					'imageShape'         => array(
						'type'    => 'string',
						'default' => 'landscape',
					),
					'excerptLength'      => array(
						'type'    => 'number',
						'default' => 55,
					),
					'showReadMore'       => array(
						'type'    => 'boolean',
						'default' => false,
					),
					'readMoreLabel'      => array(
						'type'    => 'string',
						'default' => '',
					),
					'showAvatar'         => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'colGap'             => array(
						'type'    => 'number',
						'default' => 3,
					),
					'typeScale'          => array(
						'type'    => 'number',
						'default' => 4,
					),
					'imageScale'         => array(
						'type'    => 'number',
						'default' => 3,
					),
					'minHeight'          => array(
						'type'    => 'number',
						'default' => 0,
					),
					'categories'         => array(
						'type'    => 'string',
						'default' => '',
					),
					'tags'               => array(
						'type'    => 'string',
						'default' => '',
					),
					'categoryExclusions' => array(
						'type'    => 'string',
						'default' => '',
					),
					'tagExclusions'      => array(
						'type'    => 'string',
						'default' => '',
					),
					'customTaxonomies'   => array(
						'type'    => 'string',
						'default' => '',
					),
					'postType'           => array(
						'type'    => 'string',
						'default' => '',
					),
					'imageSize'          => array(
						'type'    => 'string',
						'default' => 'medium_large',
					),
					'imageAsLink'        => array(
						'type'    => 'boolean',
						'default' => false,
					),
					'radius'             => array(
						'type'    => 'number',
						'default' => 100,
					),
					'orderBy'            => array(
						'type'    => 'string',
						'default' => 'relevance',
					),
					'maxAgeDays'         => array(
						'type'    => 'number',
						'default' => 0,
					),
					'distanceWeight'     => array(
						'type'    => 'number',
						'default' => 1,
					),
					'dateWeight'         => array(
						'type'    => 'number',
						'default' => 1,
					),
				),
			)
		);
	}

	/**
	 * Sanitize and default block attributes.
	 *
	 * @param array $attributes Raw block attributes.
	 * @return array
	 */
	protected function sanitize_atts( $attributes ) {
		$atts = wp_parse_args(
			$attributes,
			array(
				'postsPerPage'       => 6,
				'postsPerRow'        => 3,
				'category'           => 0,
				'tag'                => 0,
				'cardLayout'         => '',
				'showThumbnail'      => true,
				'showCategory'       => true,
				'showDate'           => true,
				'showExcerpt'        => true,
				'showAuthor'         => true,
				'lat'                => 0,
				'lng'                => 0,
				'postLayout'         => 'grid',
				'mediaPosition'      => 'top',
				'imageShape'         => 'landscape',
				'excerptLength'      => 55,
				'showReadMore'       => false,
				'readMoreLabel'      => '',
				'showAvatar'         => true,
				'colGap'             => 3,
				'typeScale'          => 4,
				'imageScale'         => 3,
				'minHeight'          => 0,
				'categories'         => '',
				'tags'               => '',
				'categoryExclusions' => '',
				'tagExclusions'      => '',
				'customTaxonomies'   => '',
				'postType'           => '',
				'imageSize'          => 'medium_large',
				'imageAsLink'        => false,
				'radius'             => 100,
				'orderBy'            => 'relevance',
				'maxAgeDays'         => 0,
				'distanceWeight'     => 1,
				'dateWeight'         => 1,
			)
		);

		if ( ! empty( $atts['cardLayout'] ) && empty( $atts['postLayout'] ) && 'top' === $atts['mediaPosition'] ) {
			$migration = array(
				'grid'         => array(
					'postLayout'    => 'grid',
					'mediaPosition' => 'top',
				),
				'list'         => array(
					'postLayout'    => 'list',
					'mediaPosition' => 'left',
				),
				'list-reverse' => array(
					'postLayout'    => 'list',
					'mediaPosition' => 'right',
				),
				'featured'     => array(
					'postLayout'    => 'list',
					'mediaPosition' => 'behind',
				),
			);
			if ( isset( $migration[ $atts['cardLayout'] ] ) ) {
				$atts['postLayout']    = $migration[ $atts['cardLayout'] ]['postLayout'];
				$atts['mediaPosition'] = $migration[ $atts['cardLayout'] ]['mediaPosition'];
			}
		}

		if ( ! in_array( $atts['postLayout'], self::POST_LAYOUTS, true ) ) {
			$atts['postLayout'] = 'grid';
		}
		if ( ! in_array( $atts['mediaPosition'], self::MEDIA_POSITIONS, true ) ) {
			$atts['mediaPosition'] = 'top';
		}
		if ( ! in_array( $atts['imageShape'], self::IMAGE_SHAPES, true ) ) {
			$atts['imageShape'] = 'landscape';
		}
		if ( ! in_array( $atts['imageSize'], $this->get_available_image_sizes(), true ) ) {
			$atts['imageSize'] = 'medium_large';
		}

		$atts['typeScale']      = max( 1, min( 10, (int) $atts['typeScale'] ) );
		$atts['imageScale']     = max( 1, min( 4, (int) $atts['imageScale'] ) );
		$atts['colGap']         = max( 1, min( 3, (int) $atts['colGap'] ) );
		$atts['minHeight']      = max( 0, min( 100, (int) $atts['minHeight'] ) );
		$atts['radius']         = max( 1, min( 2000, (float) $atts['radius'] ) );
		$atts['maxAgeDays']     = max( 0, min( self::MAX_AGE_DAYS, (int) $atts['maxAgeDays'] ) );
		$atts['distanceWeight'] = max( 0, min( 10, (float) $atts['distanceWeight'] ) );
		$atts['dateWeight']     = max( 0, min( 10, (float) $atts['dateWeight'] ) );

		if ( ! in_array( $atts['orderBy'], self::ORDER_BY, true ) ) {
			$atts['orderBy'] = 'relevance';
		}

		if ( empty( $atts['categories'] ) && ! empty( $atts['category'] ) ) {
			$atts['categories'] = (string) (int) $atts['category'];
		}
		if ( empty( $atts['tags'] ) && ! empty( $atts['tag'] ) ) {
			$atts['tags'] = (string) (int) $atts['tag'];
		}

		return $atts;
	}

	/**
	 * Parse a comma-separated string of IDs into a sanitized array.
	 *
	 * @param string $raw Comma-separated IDs.
	 * @return int[] Sanitized IDs.
	 */
	protected function parse_id_list( $raw ) {
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
	 * Render the block on the frontend.
	 *
	 * @param array $attributes Block attributes.
	 * @return string
	 */
	public function render_callback( $attributes ) {
		static $rendered_ids = array();

		// Guarantee frontend assets load even when has_block() fails to detect the
		// block (reusable blocks, template parts, widgets, Newspack, etc.).
		$this->ensure_frontend_assets();

		$atts = $this->sanitize_atts( $attributes );

		$use_preview_coords = ! empty( $atts['lat'] ) || ! empty( $atts['lng'] );

		$wrapper_classes = 'wp-block-jeo-stories-near-you';
		if ( $this->is_newspack_active() ) {
			$wrapper_classes .= ' ' . $this->build_newspack_wrapper_classes( $atts );
		}

		$wrapper_attrs = get_block_wrapper_attributes( array( 'class' => $wrapper_classes ) );

		if ( $use_preview_coords ) {
			$lat          = (float) $atts['lat'];
			$lng          = (float) $atts['lng'];
			$filters      = $this->build_filters( $atts );
			$post_ids     = $this->get_nearby_posts( $lat, $lng, $atts['postsPerPage'], $atts['radius'], $rendered_ids, $filters );
			$rendered_ids = array_merge( $rendered_ids, $post_ids );

			ob_start();
			?>
			<div <?php echo $wrapper_attrs; // phpcs:ignore WordPress.Security.EscapeOutput ?>>
				<?php if ( empty( $post_ids ) ) : ?>
					<?php echo $this->render_empty_state( $atts['radius'] ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
				<?php else : ?>
					<?php echo $this->render_posts( $post_ids, $atts ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
				<?php endif; ?>
			</div>
			<?php
			return ob_get_clean();
		}

		ob_start();
		$skeleton_classes = 'wp-block-latest-posts__list jeo-stories-near-you__skeleton';
		if ( 'grid' === $atts['postLayout'] ) {
			$skeleton_classes .= ' is-grid columns-' . (int) $atts['postsPerRow'];
		}
		?>
		<div <?php echo $wrapper_attrs; // phpcs:ignore WordPress.Security.EscapeOutput ?>>
			<ul class="<?php echo esc_attr( $skeleton_classes ); ?>">
				<?php for ( $i = 0; $i < (int) $atts['postsPerPage']; $i++ ) : ?>
				<li class="jeo-stories-near-you__skeleton-card">
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
				</li>
				<?php endfor; ?>
			</ul>
			<div class="jeo-stories-near-you__error hidden">
				<p><?php esc_html_e( 'Unable to load stories near you.', 'jeowp' ); ?></p>
			</div>
			<script type="application/json" class="jeo-stories-near-you-attrs"><?php echo wp_json_encode( array_merge( $atts, array( 'excludeIds' => $rendered_ids ) ) ); ?></script>
		</div>
		<?php
		return ob_get_clean();
	}

	/**
	 * Build filter array from block attributes for get_nearby_posts().
	 *
	 * @param array $atts Sanitized block attributes.
	 * @return array
	 */
	protected function build_filters( $atts ) {
		$filters = array();

		$filters['categories']          = $this->parse_id_list( $atts['categories'] );
		$filters['tags']                = $this->parse_id_list( $atts['tags'] );
		$filters['category_exclusions'] = $this->parse_id_list( $atts['categoryExclusions'] );
		$filters['tag_exclusions']      = $this->parse_id_list( $atts['tagExclusions'] );
		$filters['order_by']            = ! empty( $atts['orderBy'] ) ? $atts['orderBy'] : 'relevance';
		$filters['max_age_days']        = ! empty( $atts['maxAgeDays'] ) ? (int) $atts['maxAgeDays'] : 0;
		$filters['distance_weight']     = isset( $atts['distanceWeight'] ) ? (float) $atts['distanceWeight'] : 1;
		$filters['date_weight']         = isset( $atts['dateWeight'] ) ? (float) $atts['dateWeight'] : 1;

		if ( ! empty( $atts['postType'] ) ) {
			$filters['post_type'] = array_map( 'sanitize_key', explode( ',', $atts['postType'] ) );
		}

		if ( ! empty( $atts['customTaxonomies'] ) ) {
			$decoded = json_decode( $atts['customTaxonomies'], true );
			if ( is_array( $decoded ) ) {
				$filters['custom_taxonomies'] = array_filter(
					$decoded,
					function ( $tax ) {
						return ! empty( $tax['slug'] ) && ! empty( $tax['terms'] ) && is_array( $tax['terms'] );
					}
				);
			}
		}

		return $filters;
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
					'lat'                => array(
						'type'     => 'number',
						'required' => false,
					),
					'lng'                => array(
						'type'     => 'number',
						'required' => false,
					),
					'postsPerPage'       => array(
						'type'    => 'integer',
						'default' => 6,
						'minimum' => 1,
						'maximum' => 36,
					),
					'postsPerRow'        => array(
						'type'    => 'integer',
						'default' => 3,
						'minimum' => 1,
						'maximum' => 6,
					),
					'showThumbnail'      => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'showCategory'       => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'showDate'           => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'showExcerpt'        => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'showAuthor'         => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'excludeIds'         => array(
						'type'    => 'string',
						'default' => '',
					),
					'postLayout'         => array(
						'type'    => 'string',
						'default' => 'grid',
						'enum'    => self::POST_LAYOUTS,
					),
					'mediaPosition'      => array(
						'type'    => 'string',
						'default' => 'top',
						'enum'    => self::MEDIA_POSITIONS,
					),
					'imageShape'         => array(
						'type'    => 'string',
						'default' => 'landscape',
						'enum'    => self::IMAGE_SHAPES,
					),
					'excerptLength'      => array(
						'type'    => 'integer',
						'default' => 55,
						'minimum' => 5,
						'maximum' => 200,
					),
					'showReadMore'       => array(
						'type'    => 'boolean',
						'default' => false,
					),
					'readMoreLabel'      => array(
						'type'    => 'string',
						'default' => '',
					),
					'showAvatar'         => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'colGap'             => array(
						'type'    => 'integer',
						'default' => 3,
						'minimum' => 1,
						'maximum' => 3,
					),
					'typeScale'          => array(
						'type'    => 'integer',
						'default' => 4,
						'minimum' => 1,
						'maximum' => 10,
					),
					'imageScale'         => array(
						'type'    => 'integer',
						'default' => 3,
						'minimum' => 1,
						'maximum' => 4,
					),
					'minHeight'          => array(
						'type'    => 'integer',
						'default' => 0,
						'minimum' => 0,
						'maximum' => 100,
					),
					'categories'         => array(
						'type'    => 'string',
						'default' => '',
					),
					'tags'               => array(
						'type'    => 'string',
						'default' => '',
					),
					'categoryExclusions' => array(
						'type'    => 'string',
						'default' => '',
					),
					'tagExclusions'      => array(
						'type'    => 'string',
						'default' => '',
					),
					'customTaxonomies'   => array(
						'type'    => 'string',
						'default' => '',
					),
					'postType'           => array(
						'type'    => 'string',
						'default' => '',
					),
					'imageSize'          => array(
						'type'    => 'string',
						'default' => 'medium_large',
						'enum'    => $this->get_available_image_sizes(),
					),
					'imageAsLink'        => array(
						'type'    => 'boolean',
						'default' => false,
					),
					'radius'             => array(
						'type'    => 'number',
						'default' => 100,
						'minimum' => 1,
						'maximum' => 2000,
					),
					'orderBy'            => array(
						'type'    => 'string',
						'default' => 'relevance',
						'enum'    => self::ORDER_BY,
					),
					'maxAgeDays'         => array(
						'type'    => 'integer',
						'default' => 0,
						'minimum' => 0,
						'maximum' => self::MAX_AGE_DAYS,
					),
					'distanceWeight'     => array(
						'type'    => 'number',
						'default' => 1,
						'minimum' => 0,
						'maximum' => 10,
					),
					'dateWeight'         => array(
						'type'    => 'number',
						'default' => 1,
						'minimum' => 0,
						'maximum' => 10,
					),
				),
			)
		);
	}

	/**
	 * Get all registered image size slugs including 'full'.
	 *
	 * @return string[] Image size slugs.
	 */
	protected function get_available_image_sizes() {
		$sizes   = get_intermediate_image_sizes();
		$sizes[] = 'full';
		return $sizes;
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

		$asset_file = file_exists( JEO_BASEPATH . '/js/build/storiesNearYou.asset.php' ) ? include JEO_BASEPATH . '/js/build/storiesNearYou.asset.php' : array(
			'dependencies' => array(),
			'version'      => JEO_VERSION,
		);

		wp_register_script(
			'jeo-stories-near-you',
			JEO_BASEURL . '/js/build/storiesNearYou.js',
			$asset_file['dependencies'] ?? array(),
			$asset_file['version'] ?? JEO_VERSION,
			true
		);

		wp_localize_script(
			'jeo-stories-near-you',
			'jeo_snu_config',
			array(
				'geolocationPrecision' => absint( \jeo_settings()->get_option( 'geolocation_precision', 2 ) ),
			)
		);
	}

	/**
	 * Enqueue frontend CSS and JS when the block is present on the page.
	 *
	 * Runs on wp_enqueue_scripts as an early/head enqueue when has_block() detects
	 * the block in the main content. This detection is unreliable for blocks nested
	 * in reusable blocks, template parts, widgets or Newspack contexts, so
	 * render_callback() also calls ensure_frontend_assets() as a guaranteed fallback.
	 *
	 * @return void
	 */
	public function enqueue_frontend_assets() {
		if ( ! has_block( 'jeo/stories-near-you' ) ) {
			return;
		}

		$this->ensure_frontend_assets();
	}

	/**
	 * Idempotently enqueue the block's frontend assets. Safe to call multiple times
	 * and from within render_callback(), which is the most reliable signal that the
	 * block is actually on the page.
	 *
	 * @return void
	 */
	public function ensure_frontend_assets() {
		if ( wp_script_is( 'jeo-stories-near-you', 'enqueued' ) ) {
			return;
		}

		// Ensure handles exist even if register_assets() didn't run (defensive).
		if ( ! wp_script_is( 'jeo-stories-near-you', 'registered' ) ) {
			$this->register_assets();
		}

		if ( $this->is_newspack_active() ) {
			$this->enqueue_newspack_styles();
		} elseif ( wp_style_is( 'wp-block-latest-posts', 'registered' ) ) {
			// The native path renders core/latest-posts dynamically via render_block(),
			// so WordPress doesn't auto-enqueue that block's stylesheet. Without it the
			// featured images and grid/list layout render broken. Enqueue it explicitly.
			wp_enqueue_style( 'wp-block-latest-posts' );
		}

		wp_enqueue_style( 'jeo-stories-near-you' );
		wp_enqueue_script( 'jeo-stories-near-you' );
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
			'postsPerPage'       => (int) $request->get_param( 'postsPerPage' ),
			'postsPerRow'        => (int) $request->get_param( 'postsPerRow' ),
			'showThumbnail'      => filter_var( $request->get_param( 'showThumbnail' ), FILTER_VALIDATE_BOOLEAN ),
			'showCategory'       => filter_var( $request->get_param( 'showCategory' ), FILTER_VALIDATE_BOOLEAN ),
			'showDate'           => filter_var( $request->get_param( 'showDate' ), FILTER_VALIDATE_BOOLEAN ),
			'showExcerpt'        => filter_var( $request->get_param( 'showExcerpt' ), FILTER_VALIDATE_BOOLEAN ),
			'showAuthor'         => filter_var( $request->get_param( 'showAuthor' ), FILTER_VALIDATE_BOOLEAN ),
			'postLayout'         => $request->get_param( 'postLayout' ),
			'mediaPosition'      => $request->get_param( 'mediaPosition' ),
			'imageShape'         => $request->get_param( 'imageShape' ),
			'excerptLength'      => (int) $request->get_param( 'excerptLength' ),
			'showReadMore'       => filter_var( $request->get_param( 'showReadMore' ), FILTER_VALIDATE_BOOLEAN ),
			'readMoreLabel'      => $request->get_param( 'readMoreLabel' ),
			'showAvatar'         => filter_var( $request->get_param( 'showAvatar' ), FILTER_VALIDATE_BOOLEAN ),
			'colGap'             => (int) $request->get_param( 'colGap' ),
			'typeScale'          => (int) $request->get_param( 'typeScale' ),
			'imageScale'         => (int) $request->get_param( 'imageScale' ),
			'minHeight'          => (int) $request->get_param( 'minHeight' ),
			'categories'         => $request->get_param( 'categories' ),
			'tags'               => $request->get_param( 'tags' ),
			'categoryExclusions' => $request->get_param( 'categoryExclusions' ),
			'tagExclusions'      => $request->get_param( 'tagExclusions' ),
			'customTaxonomies'   => $request->get_param( 'customTaxonomies' ),
			'postType'           => $request->get_param( 'postType' ),
			'imageSize'          => $request->get_param( 'imageSize' ),
			'imageAsLink'        => filter_var( $request->get_param( 'imageAsLink' ), FILTER_VALIDATE_BOOLEAN ),
			'radius'             => (float) $request->get_param( 'radius' ),
			'orderBy'            => $request->get_param( 'orderBy' ),
			'maxAgeDays'         => (int) $request->get_param( 'maxAgeDays' ),
			'distanceWeight'     => (float) $request->get_param( 'distanceWeight' ),
			'dateWeight'         => (float) $request->get_param( 'dateWeight' ),
		);

		$atts        = $this->sanitize_atts( $atts );
		$exclude_ids = $this->parse_id_list( $request->get_param( 'excludeIds' ) );
		$filters     = $this->build_filters( $atts );
		$post_ids    = $this->get_nearby_posts( $lat, $lng, $atts['postsPerPage'], $atts['radius'], $exclude_ids, $filters );

		if ( empty( $post_ids ) ) {
			return new \WP_REST_Response(
				array(
					'html'    => $this->render_empty_state( $atts['radius'] ),
					'postIds' => array(),
				),
				200
			);
		}

		$html = $this->render_posts( $post_ids, $atts );

		return new \WP_REST_Response(
			array(
				'html'    => $html,
				'postIds' => $post_ids,
			),
			200
		);
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
	 * @param int   $limit       Maximum number of posts to return.
	 * @param float $radius      Search radius in kilometers.
	 * @param int[] $exclude_ids Post IDs to exclude from results.
	 * @param array $filters     Taxonomy/post type filters.
	 * @return int[] Post IDs ordered by descending date, filtered by radius.
	 */
	protected function get_nearby_posts( $lat, $lng, $limit, $radius, $exclude_ids = array(), $filters = array() ) {
		global $wpdb;

		$limit = max( 1, min( 36, (int) $limit ) );
		$lat   = (float) $lat;
		$lng   = (float) $lng;

		$coord_precision = absint( \jeo_settings()->get_option( 'geolocation_precision', 2 ) );
		$coord_precision = max( 1, min( 5, $coord_precision ) ) + 1;

		$enabled = array_map( 'sanitize_key', \jeo_settings()->get_option( 'enabled_post_types', array( 'post' ) ) );
		$enabled = array_filter( $enabled );
		if ( empty( $enabled ) ) {
			$enabled = array( 'post' );
		}

		if ( ! empty( $filters['post_type'] ) ) {
			$types = array_intersect( array_map( 'sanitize_key', $filters['post_type'] ), $enabled );
		} else {
			$types = $enabled;
		}

		if ( empty( $types ) ) {
			return array();
		}

		$types_placeholders = implode( ',', array_fill( 0, count( $types ), '%s' ) );

		$wpml_join  = '';
		$wpml_where = '';
		if ( defined( 'ICL_SITEPRESS_VERSION' ) || class_exists( 'SitePress' ) ) {
			$current_lang = apply_filters( 'wpml_current_language', null );
			if ( $current_lang ) {
				$wpml_join  = " INNER JOIN {$wpdb->prefix}icl_translations icl ON p.ID = icl.element_id AND icl.element_type = CONCAT('post_', p.post_type)";
				$wpml_where = $wpdb->prepare( ' AND icl.language_code = %s', $current_lang );
			}
		}

		$taxonomy_join  = '';
		$taxonomy_where = '';

		if ( ! empty( $filters['categories'] ) ) {
			$cat_ids         = implode( ',', array_map( 'absint', $filters['categories'] ) );
			$taxonomy_join  .= " INNER JOIN {$wpdb->term_relationships} tr_cat ON p.ID = tr_cat.object_id";
			$taxonomy_join  .= " INNER JOIN {$wpdb->term_taxonomy} tt_cat ON tr_cat.term_taxonomy_id = tt_cat.term_taxonomy_id";
			$taxonomy_where .= " AND tt_cat.taxonomy = 'category' AND tt_cat.term_id IN ({$cat_ids})";
		}

		if ( ! empty( $filters['tags'] ) ) {
			$tag_ids         = implode( ',', array_map( 'absint', $filters['tags'] ) );
			$taxonomy_join  .= " INNER JOIN {$wpdb->term_relationships} tr_tag ON p.ID = tr_tag.object_id";
			$taxonomy_join  .= " INNER JOIN {$wpdb->term_taxonomy} tt_tag ON tr_tag.term_taxonomy_id = tt_tag.term_taxonomy_id";
			$taxonomy_where .= " AND tt_tag.taxonomy = 'post_tag' AND tt_tag.term_id IN ({$tag_ids})";
		}

		$tx_idx = 0;
		if ( ! empty( $filters['custom_taxonomies'] ) ) {
			foreach ( $filters['custom_taxonomies'] as $tax ) {
				if ( empty( $tax['slug'] ) || empty( $tax['terms'] ) ) {
					continue;
				}
				$idx      = ++$tx_idx;
				$tr_alias = "tr_ctx{$idx}";
				$tt_alias = "tt_ctx{$idx}";
				$slug     = sanitize_key( $tax['slug'] );
				$terms    = implode( ',', array_map( 'absint', $tax['terms'] ) );

				$taxonomy_join  .= " INNER JOIN {$wpdb->term_relationships} {$tr_alias} ON p.ID = {$tr_alias}.object_id";
				$taxonomy_join  .= " INNER JOIN {$wpdb->term_taxonomy} {$tt_alias} ON {$tr_alias}.term_taxonomy_id = {$tt_alias}.term_taxonomy_id";
				$taxonomy_where .= " AND {$tt_alias}.taxonomy = '{$slug}' AND {$tt_alias}.term_id IN ({$terms})";
			}
		}

		$exclude_clause = '';
		if ( ! empty( $exclude_ids ) ) {
			$exclude_list   = implode( ',', array_map( 'absint', $exclude_ids ) );
			$exclude_clause = " AND p.ID NOT IN ({$exclude_list})";
		}

		if ( ! empty( $filters['category_exclusions'] ) ) {
			$exc_ids         = implode( ',', array_map( 'absint', $filters['category_exclusions'] ) );
			$exclude_clause .= " AND p.ID NOT IN ( SELECT tr_exc.object_id FROM {$wpdb->term_relationships} tr_exc INNER JOIN {$wpdb->term_taxonomy} tt_exc ON tr_exc.term_taxonomy_id = tt_exc.term_taxonomy_id WHERE tt_exc.taxonomy = 'category' AND tt_exc.term_id IN ({$exc_ids}) )";
		}

		if ( ! empty( $filters['tag_exclusions'] ) ) {
			$exc_ids         = implode( ',', array_map( 'absint', $filters['tag_exclusions'] ) );
			$exclude_clause .= " AND p.ID NOT IN ( SELECT tr_exc.object_id FROM {$wpdb->term_relationships} tr_exc INNER JOIN {$wpdb->term_taxonomy} tt_exc ON tr_exc.term_taxonomy_id = tt_exc.term_taxonomy_id WHERE tt_exc.taxonomy = 'post_tag' AND tt_exc.term_id IN ({$exc_ids}) )";
		}

		$radius_meters = (float) $radius * 1000;

		$date_clause = '';
		if ( ! empty( $filters['max_age_days'] ) ) {
			$date_clause = ' AND p.post_date >= DATE_SUB(NOW(), INTERVAL %d DAY)';
		}

		$order_by     = ! empty( $filters['order_by'] ) && in_array( $filters['order_by'], self::ORDER_BY, true ) ? $filters['order_by'] : 'recent';
		$order_by_sql = 'post_date DESC';
		if ( 'nearest' === $order_by ) {
			$order_by_sql = 'distance ASC';
		} elseif ( 'relevance' === $order_by ) {
			$distance_weight = ! empty( $filters['distance_weight'] ) ? (float) $filters['distance_weight'] : 1;
			$date_weight     = ! empty( $filters['date_weight'] ) ? (float) $filters['date_weight'] : 1;
			$order_by_sql    = "( (distance / {$radius_meters}) * {$distance_weight} ) + ( (DATEDIFF(NOW(), p.post_date) / 365) * {$date_weight} ) ASC";
		}

		// Discard rows with invalid or sentinel coordinates (out of range, or the
		// (0,0) placeholder left by failed/empty geocoding). Without this guard,
		// posts with bad coordinates surface as bogus "nearby" results.
		$lon_expr    = "CAST(tlon.meta_value AS DECIMAL(10,{$coord_precision}))";
		$lat_expr    = "CAST(tlat.meta_value AS DECIMAL(10,{$coord_precision}))";
		$coord_guard = "
				AND {$lon_expr} BETWEEN -180 AND 180
				AND {$lat_expr} BETWEEN -90 AND 90
				AND NOT ( {$lon_expr} = 0 AND {$lat_expr} = 0 )";

		$primary_template = "
			SELECT p.ID, p.post_date,
				ST_Distance_Sphere(POINT(%f, %f), POINT(CAST(tlon.meta_value AS DECIMAL(10,{$coord_precision})), CAST(tlat.meta_value AS DECIMAL(10,{$coord_precision})))) AS distance
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
			{$wpml_join}
			WHERE p.post_status = 'publish'
				AND p.post_type IN ({$types_placeholders})
				{$taxonomy_where}
				{$wpml_where}
				{$exclude_clause}
				{$date_clause}
				{$coord_guard}
			HAVING distance <= %f";

		$secondary_template = str_replace(
			array( '_geocode_lon_p', '_geocode_lat_p' ),
			array( '_geocode_lon_s', '_geocode_lat_s' ),
			$primary_template
		);

		$union_sql  = $primary_template . ' UNION ' . $secondary_template . ' ORDER BY ' . $order_by_sql . ' LIMIT %d';
		$all_params = array_merge( array( $lng, $lat ), $types, array( $radius_meters ), array( $lng, $lat ), $types, array( $radius_meters ), array( $limit ) );

		if ( ! empty( $filters['max_age_days'] ) ) {
			$max_age_days = max( 1, (int) $filters['max_age_days'] );
			$all_params   = array_merge( array( $max_age_days ), $all_params, array( $max_age_days ) );
		}

		$prepared_sql = $wpdb->prepare( $union_sql, $all_params ); // phpcs:ignore WordPress.DB.PreparedSQL
		$results      = $wpdb->get_results( $prepared_sql ); // phpcs:ignore WordPress.DB.PreparedSQL

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
	 * Route rendering to the appropriate context.
	 *
	 * @param int[] $post_ids Ordered post IDs.
	 * @param array $atts     Block attributes.
	 * @return string
	 */
	protected function render_posts( $post_ids, $atts ) {
		if ( $this->is_newspack_active() ) {
			return $this->render_posts_newspack( $post_ids, $atts );
		}
		return $this->render_posts_gutenberg( $post_ids, $atts );
	}

	/**
	 * Render the empty state when no posts are found within the radius.
	 *
	 * @param float $radius Search radius in kilometers.
	 * @return string
	 */
	protected function render_empty_state( $radius = 100 ) {
		ob_start();
		?>
		<div class="jeo-stories-near-you__empty">
			<p>
			<?php
			printf(
				/* translators: %s: search radius in kilometers */
				esc_html__( 'No stories found within %s km of your location.', 'jeowp' ),
				esc_html( number_format_i18n( $radius ) )
			);
			?>
			</p>
		</div>
		<?php
		return ob_get_clean();
	}
}
