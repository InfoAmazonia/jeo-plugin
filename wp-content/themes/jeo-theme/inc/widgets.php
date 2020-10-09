<?php

/**
 * Register our sidebars, widgetized areas and widgets.
 *
 */
function widgets_areas() {

	register_sidebar(array(
		'name'          => 'Article below author info',
		'id'            => 'after_post_widget_area',
		'before_widget' => '<div class="widget-area-after-post">',
		'after_widget'  => '</div>',
		'before_title'  => '<h2 class="widget-title">',
		'after_title'   => '</h2>',
	));

	register_sidebar(array(
		'name'          => 'Category page sidebar',
		'id'            => 'category_page_sidebar',
		'before_widget' => '<div class="widget-category_page_sidebar">',
		'after_widget'  => '</div>',
		'before_title' => '<!--',
		'after_title' => '-->',
	));

	register_sidebar(array(
		'name'          => 'Author page sidebar',
		'id'            => 'author_page_sidebar',
		'before_widget' => '<div class="widget-author_page_sidebar">',
		'after_widget'  => '</div>',
		'before_title'  => '<h2 class="author_page_sidebar">',
		'after_title'   => '</h2>',
	));

	register_sidebar(array(
		'name'          => 'Republish modal bullets',
		'id'            => 'republish_modal_bullets',
		'before_widget' => '<div class="widget-area-after-post">',
		'after_widget'  => '</div>',
		'before_title'  => '<h2 class="widget-title">',
		'after_title'   => '</h2>',
	));
}
add_action('widgets_init', 'widgets_areas');


// Creates  widgets
class newsletter_widget extends WP_Widget {

	// The construct part  
	function __construct() {
		parent::__construct(
			'newsletter_widget',
			__('Newsletter', 'newsletter_widget_domain'),
			array('description' => __('Newsletter widget', 'newsletter_widget_domain'),)
		);
	}

	public function widget($args, $instance) {
?>
	<?php if ($instance) : ?>
		<div class="category-page-sidebar">
			<div class="newsletter <?= _e($instance['model_type'], 'jeo') ?> <?= $instance['custom_style'] ?>">
				<?= ($instance['model_type'] == 'horizontal') ? '<div>' : '' ?>
				<i class="fa fa-envelope fa-3x" aria-hidden="true"></i>
				<div class="newsletter-header">
					<p><?= _e($instance['title'], 'jeo') ?></p>
				</div>
				<p class="anchor-text">
				<?= _e($instance['subtitle'], 'jeo') ?>
					<?php if (!empty($instance['last_edition_link']) && $instance['model_type'] == 'horizontal') : ?>
						<?= empty($instance['last_edition_link']) ? '' :  '<a href="' . $instance['last_edition_link'] . '">' . __('SEE LAST EDITION', 'jeo') . '</a>' ?>
					<?php endif; ?>
				</p>
				<?= ($instance['model_type'] == 'horizontal') ? '</div>' : '' ?>
				<?= ($instance['model_type'] == 'horizontal') ? '<div>' : '' ?>
				<?php if (!empty($instance['newsletter_shortcode'])) : ?>
					<?= do_shortcode($instance['newsletter_shortcode']) ?>
				<?php endif; ?>
				<?php if (!empty($instance['adicional_content'])) : ?>
					<p class="link-add"><?= _e($instance['adicional_content'], 'jeo') ?></p>
				<?php endif; ?>
				<?php if (!empty($instance['last_edition_link']) && $instance['model_type'] == 'vertical') : ?>
					<p class="last-edition"><?= empty($instance['last_edition_link']) ? '' :  '<a href="' . $instance['last_edition_link'] . '">'. __('SEE LAST EDITION', 'jeo'). '</a>' ?></p>
				<?php endif; ?>
				<?= ($instance['model_type'] == 'horizontal') ? '</div>' : '' ?>
			</div>
		</div>
	<?php endif; ?>
	<?php
	}

	public function form($instance) {
		$title = !empty($instance['title']) ? $instance['title'] : esc_html__('', 'jeo');
		$subtitle = !empty($instance['subtitle']) ? $instance['subtitle'] : esc_html__('', 'jeo');
		$newsletter_shortcode = !empty($instance['newsletter_shortcode']) ? $instance['newsletter_shortcode'] : esc_html__('', 'jeo');
		$last_edition_link = !empty($instance['last_edition_link']) ? $instance['last_edition_link'] : esc_html__('', 'jeo');
		$adicional_content = !empty($instance['adicional_content']) ? $instance['adicional_content'] : esc_html__('', 'jeo');
		$model_type = !empty($instance['model_type']) ? $instance['model_type'] : esc_html__('vertical', 'jeo');
		$custom_style = !empty($instance['custom_style']) ? $instance['custom_style'] : esc_html__('', 'jeo');
	?>
		<p>
			<?= _e('You are not allowed to add HTML in any of those fields', 'jeo') ?>
		</p>
		<p>
			<label for="<?php echo esc_attr($this->get_field_id('model_type')); ?>"><?php esc_attr_e('Model type:', 'jeo'); ?></label>
			<select class="widefat" id="<?php echo esc_attr($this->get_field_id('model_type')); ?>" name="<?php echo esc_attr($this->get_field_name('model_type')); ?>">
				<option value="horizontal" <?= $model_type == 'horizontal' ? 'selected' : '' ?>><?php _e('Horizontal', 'jeo') ?></option>
				<option value="vertical" <?= $model_type == 'vertical' ? 'selected' : '' ?>><?php _e('Vertical', 'jeo') ?></option>
			</select>
		</p>

		<p>
			<label for="<?php echo esc_attr($this->get_field_id('title')); ?>"><?php esc_attr_e('Title:', 'jeo'); ?></label>
			<input class="widefat" id="<?php echo esc_attr($this->get_field_id('title')); ?>" name="<?php echo esc_attr($this->get_field_name('title')); ?>" type="text" value="<?php echo esc_attr($title); ?>">
		</p>

		<p>
			<label for="<?php echo esc_attr($this->get_field_id('subtitle')); ?>"><?php esc_attr_e('Subtitle:', 'jeo'); ?></label>
			<input class="widefat" id="<?php echo esc_attr($this->get_field_id('subtitle')); ?>" name="<?php echo esc_attr($this->get_field_name('subtitle')); ?>" type="text" value="<?php echo esc_attr($subtitle); ?>">
		</p>

		<p>
			<label for="<?php echo esc_attr($this->get_field_id('newsletter_shortcode')); ?>"><?php esc_attr_e('Newsletter form shortcode:', 'jeo'); ?></label>
			<input class="widefat" id="<?php echo esc_attr($this->get_field_id('newsletter_shortcode')); ?>" name="<?php echo esc_attr($this->get_field_name('newsletter_shortcode')); ?>" type="text" value="<?php echo esc_attr($newsletter_shortcode); ?>">
		</p>

		<p>
			<label for="<?php echo esc_attr($this->get_field_id('last_edition_link')); ?>"><?php esc_attr_e('Last edition link:', 'jeo'); ?></label>
			<input class="widefat" id="<?php echo esc_attr($this->get_field_id('last_edition_link')); ?>" name="<?php echo esc_attr($this->get_field_name('last_edition_link')); ?>" type="text" value="<?php echo esc_attr($last_edition_link); ?>">
		</p>

		<p>
			<label for="<?php echo esc_attr($this->get_field_id('adicional_content')); ?>"><?php esc_attr_e('Adicional Content:', 'jeo'); ?></label>
			<textarea class="widefat" id="<?php echo esc_attr($this->get_field_id('adicional_content')); ?>" name="<?php echo esc_attr($this->get_field_name('adicional_content')); ?>"><?php echo $adicional_content; ?></textarea>
		</p>

		<p>
			<label for="<?php echo esc_attr($this->get_field_id('custom_style')); ?>"><?php esc_attr_e('Container style:', 'jeo'); ?></label>
			<textarea class="widefat" id="<?php echo esc_attr($this->get_field_id('custom_style')); ?>" name="<?php echo esc_attr($this->get_field_name('custom_style')); ?>"><?php echo $custom_style; ?></textarea>
		</p>


	<?php
	}
}

class bullet_widget extends WP_Widget {

	// The construct part  
	function __construct() {
		parent::__construct(
			'bullet_widget',
			__('Bullet', 'bullet_widget_domain'),
			array('description' => __('Bullet widget', 'bullet_widget_domain'),)
		);
	}

	public function widget($args, $instance) {
?>
	<?php if ($instance) : ?>
	<?php endif; ?>
	<?php
	}

	public function form($instance) {
		$title = !empty($instance['title']) ? $instance['title'] : esc_html__('', 'jeo');
		$description = !empty($instance['description']) ? $instance['description'] : esc_html__('', 'jeo');
	?>
		<p>
			<label for="<?php echo esc_attr($this->get_field_id('title')); ?>"><?php esc_attr_e('Title:', 'jeo'); ?></label>
			<input class="widefat" id="<?php echo esc_attr($this->get_field_id('title')); ?>" name="<?php echo esc_attr($this->get_field_name('title')); ?>" type="text" value="<?php echo esc_attr($title); ?>">
		</p>
		<p>
			<label for="<?php echo esc_attr($this->get_field_id('description')); ?>"><?php esc_attr_e('Description:', 'jeo'); ?></label>
			<input class="widefat" id="<?php echo esc_attr($this->get_field_id('description')); ?>" name="<?php echo esc_attr($this->get_field_name('description')); ?>" type="textarea" value="<?php echo esc_attr($description); ?>">
		</p>
	<?php
	}
}

class most_read_widget extends WP_Widget {

	// The construct part  
	function __construct() {
		parent::__construct(
			'most_read_widget',
			__('Most Read', 'most_read_widget_domain'),
			array('description' => __('Most Read Widget', 'most_read_widget_domain'),)
		);
	}

	public function widget($args, $instance) {
		$category = '';
		$tag = '';
		$author = '';
		$most_read = [];
		$ids = [];
		$posts_ids = [];
		$posts_query_args = [];

		if(is_category()) {
			$category = get_the_category()[0];
			$most_read = \PageViews::get_top_viewed(-1, ['post_type' => 'post', 'from' => '01-01-2001']);
			$posts_query_args['category__in'] = [$category->cat_ID];
		} else if(is_tag()) {
			$tag = get_queried_object();
			$most_read = \PageViews::get_top_viewed(-1, ['post_type' => 'post', 'from' => '01-01-2001']);
			$posts_query_args['tag__in'] = [$tag->term_id];
		} else if(is_author()) {
			$author = get_the_author_meta('ID');
			$most_read = \PageViews::get_top_viewed(-1, ['post_type' => 'post', 'from' => '01-01-2001']);
			$posts_query_args['author__in'] = [$author];

		}

		$ids = array();
		foreach ($most_read as $post => $value) {
			array_push($ids, $value->post_id);
		}

		$posts_query_args['post__in'] = $ids;
		$posts_query_args['orderby'] = 'post__in';
		$most_read_query = new \WP_Query($posts_query_args); 

		foreach ($most_read_query->posts as $post => $value) {
			array_push($posts_ids, $value->ID);
		}

		?>
			<?php if($instance): ?>
				<?php if(sizeof($posts_ids) >= $instance['min_posts']): ?>
					<div class="category-most-read">
						<div class="header">
							<p><?= $instance['title'] ?> </p>
						</div>
						<div class="posts">
							<?php foreach(array_slice($posts_ids, 0, $instance['max_posts']) as $key=>$value){ 
								$title = get_the_title($value);
								$author_id = get_post_field( 'post_author', $value );
								$author = get_the_author_meta('display_name', $author_id);
								$url = get_permalink($value);
							?>
								<div class="post">
									<a class="post-link" href="<?php echo $url; ?>">
										<?php if($instance['featured_image'] == 'show'): ?>
											<div class="post-thumbnail"><?php echo get_the_post_thumbnail($value); ?></div>
										<?php endif ?>
										<p class="post-title"><?php echo $title; ?></p>
										<p class="post-author">by <strong><?php echo $author; ?></strong></p>
									</a>
								</div>
							<?php } ?>
						</div>
					<?php endif ?>

				</div>
			<?php endif ?>
		<?php
	}

	public function form($instance) {
		$title = !empty($instance['title']) ? $instance['title'] : esc_html__('', 'jeo');
		$min_posts = !empty($instance['min_posts']) ? $instance['min_posts'] : 1;
		$max_posts = !empty($instance['max_posts']) ? $instance['max_posts'] : 3;
		$featured_image = !empty($instance['featured_image']) ? $instance['featured_image'] : esc_html__('show', 'jeo');

	?>
		<p>
			<label for="<?php echo esc_attr($this->get_field_id('title')); ?>"><?php esc_attr_e('Title:', 'jeo'); ?></label>
			<input class="widefat" id="<?php echo esc_attr($this->get_field_id('title')); ?>" name="<?php echo esc_attr($this->get_field_name('title')); ?>" type="text" value="<?php echo esc_attr($title); ?>">
		</p>
		<p>
			<label for="<?php echo esc_attr($this->get_field_id('min_posts')); ?>"><?php esc_attr_e('Mininum quantity of posts needed to show the widget:', 'jeo'); ?></label>
			<input class="widefat" id="<?php echo esc_attr($this->get_field_id('min_posts')); ?>" name="<?php echo esc_attr($this->get_field_name('min_posts')); ?>" type="number" value="<?php echo esc_attr($min_posts); ?>">
		</p>
		<p>
			<label for="<?php echo esc_attr($this->get_field_id('max_posts')); ?>"><?php esc_attr_e('Maximum quantity of posts shown in the widget:', 'jeo'); ?></label>
			<input class="widefat" id="<?php echo esc_attr($this->get_field_id('max_posts')); ?>" name="<?php echo esc_attr($this->get_field_name('max_posts')); ?>" type="number" value="<?php echo esc_attr($max_posts); ?>">
		</p>
		<p>
			<label for="<?php echo esc_attr($this->get_field_id('featured_image')); ?>"><?php esc_attr_e('Featured image setting:', 'jeo'); ?></label>
			<select class="widefat" id="<?php echo esc_attr($this->get_field_id('featured_image')); ?>" name="<?php echo esc_attr($this->get_field_name('featured_image')); ?>">
				<option value="show" <?= $featured_image == 'show' ? 'selected' : '' ?>>Show featured image</option>
				<option value="hide" <?= $featured_image == 'hide' ? 'selected' : '' ?>>Hide featured image</option>
			</select>
		</p>
	<?php
	}
}

class story_maps_widget extends WP_Widget {

	// The construct part  
	function __construct() {
		parent::__construct(
			'story_maps_widget',
			__('Story Maps', 'story_maps_widget_domain'),
			array('description' => __('Story Maps', 'story_maps_widget_domain'),)
		);
	}

	public function widget($args, $instance) {
	?>
		<div class="category-story-maps">
			<div class="header">
				<p>STORY MAPS</p>
			</div>
			<div class="maps">
				<p>Título do conteúdo que geralmente será um título grande</p>
				<p>Título do conteúdo que geralmente será um título grande</p>
				<p>Título do conteúdo que geralmente será um título grande</p>
			</div>
		</div>
<?php
	}
}

function my_post_gallery_widget($output, $attr) {
    global $post;

    if (isset($attr['orderby'])) {
        $attr['orderby'] = sanitize_sql_orderby($attr['orderby']);
        if (!$attr['orderby'])
            unset($attr['orderby']);
    }

    extract(shortcode_atts(array(
        'order' => 'ASC',
        'orderby' => 'menu_order ID',
        'id' => $post->ID,
        'itemtag' => 'dl',
        'icontag' => 'dt',
        'captiontag' => 'dd',
        'columns' => 3,
        'size' => 'thumbnail',
        'include' => '',
        'exclude' => ''
    ), $attr));

    $id = intval($id);
    if ('RAND' == $order) $orderby = 'none';

    if (!empty($include)) {
        $include = preg_replace('/[^0-9,]+/', '', $include);
        $_attachments = get_posts(array('include' => $include, 'post_status' => 'inherit', 'post_type' => 'attachment', 'post_mime_type' => 'image', 'order' => $order, 'orderby' => $orderby));

        $attachments = array();
        foreach ($_attachments as $key => $val) {
            $attachments[$val->ID] = $_attachments[$key];
        }
    }

    if (empty($attachments)) return '';

	$output .= "<div class=\"image-gallery\">";
	$output .= "<div class=\"image-gallery-header\"><p>";
	$output .= $attr['title'];
	$output .= "</p></div>";
    $output .= "<div class=\"image-gallery-content-block wp-block-gallery columns-3 is-cropped\"><div class=\"blocks-gallery-grid\">";

    foreach ($attachments as $id => $attachment) {
        $img = wp_get_attachment_image_src($id, 'full');

        $output .= "<div class=\"blocks-gallery-item\">\n";
        $output .= "<img src=\"{$img[0]}\"/>\n";
        $output .= "</div>\n";
    }

	$output .= "</div></div>\n";
	$output .= "<button><a target=\"blank\" href=\"";
	$output .= $attr['see_more_url'];
	$output .= "\">SEE MORE</a></button>\n";

	$output .= "</div>\n";


    return $output;
}

function newsletter_load_widget() {
	register_widget('newsletter_widget');
}

function most_read_load_widget() {
	register_widget('most_read_widget');
}

function story_maps_load_widget() {
	register_widget('story_maps_widget');
}

function bullet_load_widget() {
	register_widget('bullet_widget');
}

add_action( 'widgets_init', 'newsletter_load_widget' );
add_action( 'widgets_init', 'most_read_load_widget' );
add_action( 'widgets_init', 'story_maps_load_widget' );
add_action( 'widgets_init', 'bullet_load_widget' );
add_filter('post_gallery', 'my_post_gallery_widget', 10, 2);


// IMAGE GALLERY FORM
function image_gallery_form( $widget, $return, $instance ) {
 
    if ( 'media_gallery' == $widget->id_base ) {
 
        $see_more_url = isset( $instance['see_more_url'] ) ? $instance['see_more_url'] : '';
        ?>
            <p>
                <label for="<?php echo $widget->get_field_id('see_more_url'); ?>">
                    <?php _e( 'See more URL (requires https://)', 'image_gallery' ); ?>
                </label>
                <input class="text" value="<?php echo $see_more_url ?>" type="text" id="<?php echo $widget->get_field_id('see_more_url'); ?>" name="<?php echo $widget->get_field_name('see_more_url'); ?>" />
            </p>
        <?php
    }
}

function widget_save_form( $instance, $new_instance ) {
	
	$instance['see_more_url'] = $new_instance['see_more_url'];
	return $instance;
}

add_filter('in_widget_form', 'image_gallery_form', 10, 3 );
add_filter( 'widget_update_callback', 'widget_save_form', 10, 2 );
add_action('widgets_init', 'newsletter_load_widget');
add_action('widgets_init', 'most_read_load_widget');
add_action('widgets_init', 'story_maps_load_widget');

?>