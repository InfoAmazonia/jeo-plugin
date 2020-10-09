<?php
require __DIR__ . '/inc/generic-css-injection.php';
require __DIR__ . '/inc/template-tags.php';
require __DIR__ . '/inc/api.php';
require __DIR__ . '/inc/post-types.php';
require __DIR__ . '/inc/newspack-functions-overwrites.php';
require __DIR__ . '/inc/widgets.php';
require __DIR__ . '/inc/metaboxes.php';
require __DIR__ . '/inc/gutenberg-blocks.php';
require __DIR__ . '/inc/menus.php';
require __DIR__ . '/classes/ajax-pv.php';
require __DIR__ . '/classes/library_related-posts.php';



add_filter('post_link', 'custom_get_permalink', 10, 3);

function custom_get_permalink($url, $post, $leavename = false) {
	$external_source_link = get_post_meta($post->ID, 'external-source-link', true);
	if ($external_source_link) {
		return $external_source_link;
	}

	return $url;
}

add_action( 'after_setup_theme', 'jeo_setup' );

function jeo_setup() {
	load_theme_textdomain( 'jeo', get_stylesheet_directory() . '/lang' );
}

add_filter('pre_get_posts', '_search_pre_get_posts', 1);

function _search_pre_get_posts($query) {
	global $wp_query;
	//var_dump();

	if (is_admin() || !$query->is_main_query()) {
		return $query;
	}

	if (isset($query->query['p']) && strpos($query->query['p'], ':redirect') > 0) {
		$query->query['p'] = intval($query->query['p']);
		$query->is_404 = false;
		$query->is_page = true;
		$query->is_home = false;
	}


	if ($query->is_search() && $query->is_main_query()) {
		//$query->set('post_type', [$query->query['post_type']]);
		// Date filter
		if (isset($_GET['daterange'])) {
			$date_range = explode(' - ', $_GET['daterange'], 2);
			if (sizeof($date_range) == 2) {
				$from_date = date_parse($date_range[0]);
				$to_date   = date_parse($date_range[1]);
				$after  = null;
				$before = null;

				if ($from_date && checkdate($from_date['month'], $from_date['day'], $from_date['year'])) {
					$after = array(
						'year'  => $from_date['year'],
						'month' => $from_date['month'],
						'day'   => $from_date['day'],
					);
				}
				// Same for the "to" date.
				if ($to_date && checkdate($to_date['month'], $to_date['day'], $to_date['year'])) {
					$before = array(
						'year'  => $to_date['year'],
						'month' => $to_date['month'],
						'day'   => $to_date['day'],
					);
				}


				$date_query = array();
				if ($after) {
					$date_query['after'] = $after;
				}
				if ($before) {
					$date_query['before'] = $before;
				}
				if ($after || $before) {
					$date_query['inclusive'] = true;
				}

				if (!empty($date_query)) {
					$query->set('date_query', $date_query);
				}
			}
		}

		if (isset($_GET['order'])) {
			$order_option = $_GET['order'];
			$query->set('orderby', 'date');

			if ($order_option == 'ASC' || $order_option == 'DESC') {
				$query->set('order', $_GET['order']);
			}
			//var_dump($query);
		} else {
			$query->set('orderby', 'date');
			$query->set('order', 'DESC');
		}

		$categories = "";


		if (isset($_GET['topic']) && !empty($_GET['topic'])) {
			$categories .= implode(",", $_GET['topic']);
		}

		if(!empty($categories)) {
			$categories .= ",";
		}

		if(isset($_GET['region']) && !empty($_GET['region'])) {
			$categories .= implode(",", $_GET['region']);
		}

		// echo $categories;

		if(!empty($categories)) {
			$query->set('category_name', $categories);
		}

		//var_dump($query);

	}

	return $query;
}

add_filter('pre_get_posts', 'feed_rss_filter', 2);
function feed_rss_filter($query) {
	if ($query->is_feed) {
		$query->set('meta_query', array(
			'relation' => 'OR',
			array(
				'key'     => 'external-source-link',
				'compare' => 'NOT EXISTS',
			),

			array(
				'key'     => 'external-source-link',
				'value'   => '',
				'compare' => '=',
			),
		));
	}

	return $query;
}



function ns_filter_avatar($avatar, $id_or_email, $size, $default, $alt, $args) {
	$headers = @get_headers($args['url']);
	if (!preg_match("|200|", $headers[0])) {
		return;
	}
	return $avatar;
}
add_filter('get_avatar', 'ns_filter_avatar', 10, 6);

if (!function_exists('jeo_comment_form')) {
	function jeo_comment_form() {
		comment_form([
			'logged_in_as' => null,
			'title_reply' => null,
		]);
	}
}

function remove_website_field($fields) {
	unset($fields['url']);
	return $fields;
}
add_filter('comment_form_default_fields', 'remove_website_field');


// its suppose to fix (https://github.com/WordPress/gutenberg/issues/18098)
global $wp_embed;
add_filter('the_content', array($wp_embed, 'autoembed'), 9);

add_filter('comment_form_fields', 'move_comment_field');
function move_comment_field($fields) {
	$comment_field = $fields['comment'];
	unset($fields['comment']);
	$fields['comment'] = $comment_field;
	return $fields;
}


function wpseo_no_show_article_author_facebook( $facebook ) {
    if ( is_single() ) {
        return false;
    }
    return $facebook;
}
add_filter( 'wpseo_opengraph_author_facebook', 'wpseo_no_show_article_author_facebook', 10, 1 );

function get_term_for_default_lang( $term, $taxonomy ) {
	global $icl_adjust_id_url_filter_off;

	$term_id = is_int( $term ) ? $term : $term->term_id;

	$default_term_id = (int) icl_object_id( $term_id, $taxonomy, true, 'en' );

	$orig_flag_value = $icl_adjust_id_url_filter_off;

	$icl_adjust_id_url_filter_off = true;
	$term = get_term( $default_term_id, $taxonomy );
	$icl_adjust_id_url_filter_off = $orig_flag_value;

	return $term;
}