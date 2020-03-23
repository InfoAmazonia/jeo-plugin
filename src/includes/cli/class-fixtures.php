<?php

namespace Jeo;

/**
 * Class used while developing, allow to create a bunch of layers and maps while the admin is not ready yet
 */
class Fixtures {

	private function get_fixtures_schema() {

		/**
		 * Schema of posts to be created / upated
		 *
		 * Once a post was created and the meta schema is changed, it will be updated when you call wp jeo fixtures update
		 */
		$posts = [


			/**
			 * Layers
			 */

			[
				'post_type' => 'map-layer',
				'post_title' => 'Layer1',
				'post_status' => 'publish',
				'meta' => [
					'type' => 'mapbox',
					'attribution' => 'Sample attribution for this layer',
					'layer_type_options' => [
						'style_id' => 'infoamazonia/cjvwvumyx5i851coa874sx97e',
						'interactions' => [
							[
								'id' => 'Imazon_Frigorificos_ativo-dvt5tp',
								'on' => 'click', // click or mouseover
								'title' => 'RAZAO_SOCI',
								'fields' => [
									[
										'field' => 'MUNIC',
										'label' => 'Município'
									],
									[
										'field' => 'UF',
										'label' => 'UF'
									],
									[
										'field' => 'STATUS',
										'label' => 'Status'
									],


								]
							]
						]
					],
					'legend_type' => 'barscale',
					'legend_type_options' => [
						'left_label' => '0',
						'right_label' => '1000',
						'colors' => [
							'#9fa498',
							'#858b7d',
							'#5f645a',
							'#474a42',
							'#313629',
						]
					],
				]
			],
			[
				'post_type' => 'map-layer',
				'post_title' => 'Switchable',
				'post_status' => 'publish',
				'meta' => [
					'type' => 'tilelayer',
					'attribution' => 'Copyright the whole world',
					'source_url' => 'http://domain.com/source.csv',
					'layer_type_options' => [
						'url' => 'https://stamen-tiles.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg'
					],
					'legend_type' => 'simple-color',
					'legend_type_options' => [
						'left_label' => '0',
						'right_label' => '1000',
						'colors' => [
							[
								'label' => '10',
								'color' => '#ff0909',
							],
							[
								'label' => '20',
								'color' => '#ff09f8',
							],
							[
								'label' => '30',
								'color' => '#0c09ff',
							],
							[
								'label' => '40',
								'color' => '#09ffe9',
							],
							[
								'label' => '50',
								'color' => '#ffe709',
							],

						]
					],
				]
			],
			[
				'post_type' => 'map-layer',
				'post_title' => 'Swapable 1',
				'post_status' => 'publish',
				'meta' => [
					'type' => 'tilelayer',
					'attribution' => 'Sample veryu long super extra large  super extra large  super extra large  super extra large  super extra large  super extra large  super extra large  super extra large  super extra large  super extra large  super extra large  super extra large  super extra large  super extra large  super extra large  super extra large  attribution for this layer',
					'source_url' => 'http://domain.com/source.csv',
					'layer_type_options' => [
						'url' => 'https://wri-tiles.s3.amazonaws.com/glad_prod/tiles/{z}/{x}/{y}.png'
					],
					'legend_type' => 'none',
					'legend_type' => 'icons',
					'legend_type_options' => [
						'icons' => [
							[
								'label' => 'Label 1',
								'icon' => 'http://via.placeholder.com/20x20',
							],
							[
								'label' => 'Label 20',
								'icon' => 'http://via.placeholder.com/20x20',
							],

						]
					],
				]
			],
			[
				'post_type' => 'map-layer',
				'post_title' => 'Swapable 2',
				'post_status' => 'publish',
				'meta' => [
					'type' => 'mapbox',
					'attribution' => 'Sample attribution for <a href="http://jeo.com">this layer with a link</a>',
					'source_url' => 'http://domain.com/source.csv',
					'layer_type_options' => [
						'style_id' => 'infoamazonia/ck33yfty30o0s1dqpien3edi4'
					],
					'legend_type' => 'circles',
					'legend_type_options' => [
						'color' => '#0c09ff',
						'circles' => [
							[
								'label' => '3',
								'radius' => 4,
							],
							[
								'label' => '6',
								'radius' => 8,
							],
							[
								'label' => '12',
								'radius' => 15,
							],
							[
								'label' => '24',
								'radius' => 20,
							],
							[
								'label' => '48',
								'radius' => 30,
							],

						]
					],
				]
			],


			/**
			 * Posts
			 */

			[
				'post_type' => 'post',
				'post_title' => 'Post 1',
				'post_status' => 'publish',
				'meta' => [
					/**
					 * We cant have two elements with the same key int the array, so we add a __%d pattern at the beginning
					 * the update method will igrnore this and add many entries for the same meta
					 */
					'__1_related_point' => [
						'relevance' => 'primary',
						'_geocode_lat' => '-22.888889',
						'_geocode_lon' => '-47.081944',
						'_geocode_full_address' => 'Jardim Chapadão, Campinas, Região Imediata de Campinas, Região Metropolitana de Campinas, Região Intermediária de Campinas, São Paulo, Região Sudeste, 13069-901, Brasil',
						'_geocode_country' => 'Brasil',
						'_geocode_country_code' => '',
						'_geocode_city' => 'Campinas',
						'_geocode_region_level_2' => 'São Paulo',
						'_geocode_region_level_3' => 'Região Intermediária de Campinas',
						'_geocode_city_level_1' => 'Jardim Chapadão',
					],
					'__2_related_point' => [
						'relevance' => 'primary',
						'_geocode_lat' => '-23.57458535',
						'_geocode_lon' => '-46.628883891755',
						'_geocode_full_address' => 'Parque da Aclimação, Aclimação, Liberdade, São Paulo, Região Imediata de São Paulo, Região Metropolitana de São Paulo, Região Intermediária de São Paulo, São Paulo, Região Sudeste, 01534-001, Brasil',
						'_geocode_country' => 'Brasil',
						'_geocode_country_code' => '',
						'_geocode_city' => 'São Paulo',
						'_geocode_region_level_2' => 'São Paulo',
						'_geocode_region_level_3' => 'Região Intermediária de São Paulo',
						'_geocode_city_level_1' => 'Aclimação',
					]
				],
				'category' => [
					'category 1',
					'category 2'
				]
			],
			[
				'post_type' => 'post',
				'post_title' => 'Post 2',
				'post_status' => 'publish',
				'meta' => [
					'__1_related_point' => [
						'relevance' => 'primary',
						'_geocode_lat' => '-23.54659435',
						'_geocode_lon' => '-46.644533061712',
						'_geocode_full_address' => 'Edifício Copan, Rua Araújo, Vila Buarque, República, São Paulo, Região Imediata de São Paulo, Região Metropolitana de São Paulo, Região Intermediária de São Paulo, São Paulo, Região Sudeste, 01046-010, Brasil',
						'_geocode_country' => 'Brasil',
						'_geocode_country_code' => '',
						'_geocode_city' => 'São Paulo',
						'_geocode_region_level_2' => 'São Paulo',
						'_geocode_region_level_3' => 'Região Intermediária de São Paulo',
						'_geocode_city_level_1' => 'Vila Buarque',
					],
					'__2_related_point' => [
						'relevance' => 'secondary',
						'_geocode_lat' => '-23.183525102463',
						'_geocode_lon' => '-46.898231506348',
						'_geocode_full_address' => 'Rua Jorge Gebran, Parque do Colégio, Chácara Urbana, Jundiaí, Região Imediata de Jundiaí, Região Intermediária de Campinas, São Paulo, Região Sudeste, 13209-090, Brasil',
						'_geocode_country' => 'Brasil',
						'_geocode_country_code' => '',
						'_geocode_city' => 'Jundiaí',
						'_geocode_region_level_2' => 'São Paulo',
						'_geocode_region_level_3' => 'Região Intermediária de Campinas',
						'_geocode_city_level_1' => 'Parque do Colégio',
					]
				],
				'category' => [
					'category 2',
					'category 3'
				]
			],
			[
				'post_type' => 'post',
				'post_title' => 'Post 3',
				'post_status' => 'publish',
				'meta' => [
					'__1_related_point' => [
						'relevance' => 'primary',
						'_geocode_lat' => '-22.939108160587',
						'_geocode_lon' => '-46.542205810547',
						'_geocode_full_address' => 'Rua Belmiro Ramos Franco, Jardim São Lourenço, Bragança Paulista, Região Imediata de Bragança Paulista, Região Intermediária de Campinas, São Paulo, Região Sudeste, 12908-040, Brasil',
						'_geocode_country' => 'Brasil',
						'_geocode_country_code' => '',
						'_geocode_city' => 'Bragança Paulista',
						'_geocode_region_level_2' => 'São Paulo',
						'_geocode_region_level_3' => 'Região Intermediária de Campinas',
						'_geocode_city_level_1' => 'Jardim São Lourenço',
					],
					'__2_related_point' => [
						'relevance' => 'secondary',
						'_geocode_lat' => '-23.118574871158',
						'_geocode_lon' => '-46.564693450928',
						'_geocode_full_address' => 'Rua Clóvis Soares, Vila Lixão, Alvinópolis, Atibaia, Região Imediata de Bragança Paulista, Região Intermediária de Campinas, São Paulo, Região Sudeste, 12942-560, Brasil',
						'_geocode_country' => 'Brasil',
						'_geocode_country_code' => '',
						'_geocode_city' => 'Atibaia',
						'_geocode_region_level_2' => 'São Paulo',
						'_geocode_region_level_3' => 'Região Intermediária de Campinas',
						'_geocode_city_level_1' => 'Vila Lixão',
					]
				],
				'category' => [
					'category 3'
				]
			],

			// MAP
			[
				'post_type' => 'map',
				'post_title' => 'Map 1', // do not change it. This name is used in update method
				'post_status' => 'publish',
				'meta' => [
					'initial_zoom' => 2,
					'center_lat' => 0,
					'center_lon' => 0,
					'disable_scroll_zoom' => false,
					'disable_drag_rotate' => false,

					// Brazil
					// 'max_bounds_sw' => ['-85.728760', '-38.721678'],
					// 'max_bounds_ne' => ['-37.301025', '13.707702'],

					// South America & Europe
					'max_bounds_sw' => ['-73.248291', '-43.867948'],
					'max_bounds_ne' => ['33.714600', '61.958488'],

					'max_zoom' => 10,
					'min_zoom' => 2,

					// layers and related_posts are dynamically set in the update method
				]
			],



		];

		return $posts;

	}

	/**
	 * Allow update to be used in other contexts, such as tests
	 */
	private function success_msg($msg) {
		if( class_exists('WP_CLI') ) {
			\WP_CLI::success( $msg );
		}
	}

	private function get_post_by_schema( $schema ) {

		return get_page_by_title($schema['post_title'], 'OBJECT', $schema['post_type']);

	}

	private function get_posts() {

		$schema = $this->get_fixtures_schema();

		$results = [];

		foreach ($schema as $item) {

			$post = $this->get_post_by_schema( $item );
			if ( $post ) {
				$results[] = array_merge( ['ID' => $post->ID ], $item );
			}

		}

		return $results;

	}


	/**
	 * List current fixtures
	 *
	 * searches for items in the schema that are present in the database
	 */
	public function list() {

		$posts = $this->get_posts();

		\WP_CLI\Utils\format_items( 'table', $posts, array( 'ID', 'post_type', 'post_title', 'meta' ) );

	}

	/**
	 * Updates fixtures in the database
	 *
	 * This command reads the fixtures_schema and updates the database, creating and/or updating posts as necessary
	 *
	 * Note: post title and post type can not be update. If they are changed, a new post will be created
	 *
	 */
	public function update() {

		$schema = $this->get_fixtures_schema();

		foreach ($schema as $item) {

			$post = $this->get_post_by_schema( $item );

			if ( $post ) {
				$post_id = $post->ID;
				$message = "Existing post found ($post_id): ";
			} else {
				$new = $item;
				unset($new['meta']);
				$post_id = wp_insert_post($new);
				$message = "New post created ($post_id): ";
			}

			$this->success_msg( $message );

			foreach ( $item['meta'] as $key => $value ) {
				$real_key = preg_replace( '/^__\d(.+)$/', '${1}', $key );
				delete_post_meta( $post_id, $real_key );
			}

			foreach ( $item['meta'] as $key => $value ) {
				$real_key = preg_replace( '/^__\d(.+)$/', '${1}', $key );
				if ( add_post_meta( $post_id, $real_key, $value ) ) {
					$this->success_msg( "$real_key metadata updated" );
				}
			}

		}

		$term1 = term_exists( 'category 1', 'category', 0 );
		$term2 = term_exists( 'category 2', 'category', 0 );
		$term3 = term_exists( 'category 3', 'category', 0 );

		if ( ! $term1 ) $term1 = wp_insert_term( 'category 1', 'category' );
		if ( ! $term2 ) $term2 = wp_insert_term( 'category 2', 'category' );
		if ( ! $term3 ) $term3 = wp_insert_term( 'category 3', 'category' );

		if ( isset($item['category']) ) {

			$cat_ids = [];

			foreach( $item['category'] as $cat ) {

				$term = get_term_by( 'name', $cat, 'category' );

				if ( ! $term ) $term = wp_insert_term( $cat, 'category' );

				$cat_ids[] = $term->term_id;

			}

			wp_set_post_categories( $post_id, $cat_ids );
		}

		// Create MAP post
		$map = get_page_by_title( 'Map 1', 'OBJECT', 'map');

		if ( $map ) {

			$map_id = $map->ID;
			$message = "Existing Map found ($map_id): ";

		} else {

			$map = [
				'post_type' => 'map',
				'post_title' => 'Map 1',
				'post_status' => 'publish',
				'post_content' => 'map content'
			];

			$map_id = wp_insert_post($map);

			$message = "New map created ($map_id): ";
		}
		$this->success_msg( $message );

		$map_layers = $this->get_map_layers();

		update_post_meta( $map_id, 'layers', $map_layers );

		$related = $this->get_map_related_posts();

		update_post_meta( $map_id, 'related_posts', (object) $related );

		global $wpdb;

		// Create MAP post
		$sample = get_page_by_title( 'Sample One-time Map', 'OBJECT', 'page');

		if ( $sample ) {

			$sample_1_id = $sample->ID;
			$message = "Existing One-time sample Map found ($sample_1_id): ";

		} else {

			$map = [
				'post_type' => 'page',
				'post_title' => 'Sample One-time Map',
				'post_status' => 'publish'
			];

			$sample_1_id = wp_insert_post($map);

			$message = "New map created ($sample_1_id): ";
		}

		$wpdb->update( $wpdb->posts, [ 'post_content' => $this->get_sample_onetime_map_div() ], [ 'ID' => $sample_1_id] );

		$this->success_msg( $message );

		$sample = get_page_by_title( 'Sample Map', 'OBJECT', 'page');

		if ( $sample ) {

			$sample_2_id = $sample->ID;
			$message = "Existing One-time sample Map found ($sample_2_id): ";

		} else {

			$map = [
				'post_type' => 'page',
				'post_title' => 'Sample Map',
				'post_status' => 'publish'
			];

			$sample_2_id = wp_insert_post($map);

			$message = "New map created ($sample_2_id): ";
		}

		$wpdb->update( $wpdb->posts, [ 'post_content' => $this->get_sample_map_div() ], [ 'ID' => $sample_2_id] );

		$this->success_msg( $message );


		$this->success_msg( '====================================================' );

		$this->success_msg( 'Sample Map: ' . \get_permalink($sample_2_id) );
		$this->success_msg( 'Sample One-time Map: ' . \get_permalink($sample_1_id) );



	}

	public function sample_maps() {



		\WP_CLI::line( 'Sample One time use' );
		\WP_CLI::line( $this->get_sample_onetime_map_div() );
		\WP_CLI::line( 'Sanple Map' );
		\WP_CLI::line( $this->get_sample_map_div() );

	}

	private function get_sample_onetime_map_div() {
		$specs = $this->get_map_layers();

		$div = "<div class=\"jeomap\" data-center_lat=\"0\" data-center_lon=\"0\" data-initial_zoom=\"1\" data-layers='" . json_encode($specs) . "' ";

		$related = $this->get_map_related_posts();

		$div .= "data-related_posts='" . json_encode($related) . "' ></div>";

		return $div;
	}

	private function get_sample_map_div() {
		$map = get_page_by_title( 'Map 1', 'OBJECT', 'map');

		$div = "<div class=\"jeomap\" data-map_id=\"" . $map->ID . "\"></div>";

		return $div;

	}

	private function get_map_layers() {

		$layers = $this->get_posts();

		$layers = array_filter( $layers, function($el) {
			return $el['post_type'] == 'map-layer';
		});

		$specs = [
			[
				'use' => 'fixed',
				'show_legend' => false,
			],
			[
				'use' => 'switchable',
				'default' => true,
				'show_legend' => true,
			],
			[
				'use' => 'swappable',
				'default' => true,
				'show_legend' => true,
			],
			[
				'use' => 'swappable',
				'default' => false,
				'show_legend' => false,
			]
		];

		$i = 0;

		foreach ( $layers as $layer ) {

			$specs[$i]['id'] = $layer['ID'];
			$i++;

		}

		return $specs;

	}

	private function get_map_related_posts() {
		$cat1 = get_term_by( 'name', 'category 1', 'category' );
		$cat2 = get_term_by( 'name', 'category 2', 'category' );
		$cat3 = get_term_by( 'name', 'category 3', 'category' );

		$related = [
			'categories' => [
				$cat1->term_id,
				$cat2->term_id,
				$cat3->term_id
			]
		];
		return $related;
	}
}
