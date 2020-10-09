<?php


/**
 * Prints HTML with meta information for the current post-date/time.
 */
function newspack_posted_on()
{
	$time_string = '<time class="entry-date published abc updated" datetime="%1$s">%2$s</time>';
	if (get_the_time('U') !== get_the_modified_time('U')) {
		$time_string = '<time class="entry-date published" datetime="%1$s">%2$s</time><time class="updated" datetime="%3$s">%4$s</time>';
	}

	$time_string = sprintf(
		$time_string,
		esc_attr(get_the_date(DATE_W3C)),
		esc_html(get_the_date()),
		esc_attr(get_the_modified_date(DATE_W3C)),
		esc_html(get_the_modified_date())
	);

	if (is_single()) { ?>
		<div class="post-date">
			<?php the_date('j F Y \a\\t G:i') ?>
			<?php if (get_the_date() != get_the_modified_date() || get_the_time() != get_the_modified_time()) : ?>
				<?php 
				$posted = new DateTime(get_the_date('c'));
				$then = new DateTime(get_the_modified_date('c')); 
				$diff = $posted->diff($then);
				$minutes = ($diff->format('%a') * 1440) + 
						($diff->format('%h') * 60) +   
							$diff->format('%i');       
				if ($minutes >= 30) { ?>
					<span class="hide-tablet-down"> (Updated on <?= the_modified_date("j F Y \a\\t G:i") ?>)</span>
				<?php 
				}

				if(get_post_meta(get_the_ID(), 'enable-post-erratum', true)): ?>
					<a href="#erratum">
						<i class="fas fa-exclamation-triangle"></i>
					</a>
				<?php endif ?>
			<?php endif ?>


		</div>


	<?php
	} else {
		printf(
			'<span class="posted-on"><a href="%1$s" rel="bookmark">%2$s</a></span>',
			esc_url(get_permalink()),
			wp_kses(
				$time_string,
				array(
					'time' => array(
						'class'    => array(),
						'datetime' => array(),
					),
				)
			)
		);
	}
}
/**
 * Prints HTML with meta information about theme author.
 */
function newspack_posted_by()
{
	if (function_exists('coauthors_posts_links')) :

		$authors      = get_coauthors();
		$author_count = count($authors);
		$i            = 1;

		foreach ($authors as $author) {
			if ('guest-author' === get_post_type($author->ID)) {
				if (get_post_thumbnail_id($author->ID)) {
					$author_avatar = coauthors_get_avatar($author, 80);
				} else {
					// If there is no avatar, force it to return the current fallback image.
					$author_avatar = get_avatar(' ');
				}
			} else {
				$author_avatar = coauthors_get_avatar($author, 80);
			}
		}
	?>
	<?php
		$parent_type_category = '';
		if(isset(get_category_by_slug('type')->cat_ID)) {
			$parent_type_category = get_category_by_slug('type')->cat_ID;
		} else {
			return;
		}

		$post_categories = get_the_category();
		$post_child_category = null;
		foreach ($post_categories as $post_cat) {
			if ($parent_type_category == $post_cat->parent) {
				$post_child_category = $post_cat;
				break;
			}
		}
		$isOpinionPost = isset($post_child_category->slug) && in_array ( $post_child_category->slug, ['opinion']);
		$showAuthorAvatar = $author_count === 1 && $isOpinionPost;

	?>
		<span class="<?php echo !$showAuthorAvatar ? 'byline' : 'byline single-author-opinion'; ?>">
			<span><?php echo esc_html__('By', 'newspack'); ?></span>
			<?php
			foreach ($authors as $author) {
				if ('guest-author' === get_post_type($author->ID)) {
					if (get_post_thumbnail_id($author->ID)) {
						$author_avatar = coauthors_get_avatar($author, 80);
					} else {
						// If there is no avatar, force it to return the current fallback image.
						$author_avatar = get_avatar(' ');
					}
				} else {
					$author_avatar = coauthors_get_avatar($author, 80);
				}

				if ($showAuthorAvatar):
					echo '<span class="author-avatar">' . wp_kses( $author_avatar, newspack_sanitize_avatars() ) . '</span>';
				endif;
				$i++;
				if ($author_count === $i) :
					/* translators: separates last two author names; needs a space on either side. */
					$sep = esc_html__(' and ', 'newspack');
				elseif ($author_count > $i) :
					/* translators: separates all but the last two author names; needs a space at the end. */
					$sep = esc_html__(', ', 'newspack');
				else :
					$sep = '';
				endif;

				printf(
					/* translators: 1: author link. 2: author name. 3. variable seperator (comma, 'and', or empty) */
					'<span class="author vcard"><a class="url fn n" href="%1$s">%2$s</a></span>%3$s ',
					esc_url(get_author_posts_url($author->ID, $author->user_nicename)),
					esc_html($author->display_name),
					esc_html($sep)
				);
			}
			?>
		</span><!-- .byline -->
	<?php
	else :
		printf(
			/* translators: 1: Author avatar. 2: post author, only visible to screen readers. 3: author link. */
			'<span class="author-avatar">%1$s</span><span class="byline"><span>%2$s</span> <span class="author vcard"><a class="url fn n" href="%3$s">%4$s</a></span></span>',
			get_avatar(get_the_author_meta('ID')),
			esc_html__('by', 'newspack'),
			esc_url(get_author_posts_url(get_the_author_meta('ID'))),
			esc_html(get_the_author())
		);

	endif;
}

/**
 * Displays an optional post thumbnail.
 *
 * Wraps the post thumbnail in an anchor element on index views, or a div
 * element when on single views.
 */
function newspack_post_thumbnail()
{
	if (!newspack_can_show_post_thumbnail()) {
		return;
	}

	if (is_singular()) : ?>

		<figure class="post-thumbnail">

			<?php

			// If using the behind or beside image styles, add the object-fit argument for AMP.
			if (in_array(newspack_featured_image_position(), array('behind', 'beside'))) :

				if (class_exists('Newspack_Image_Credits')) {
					$image_meta = Newspack_Image_Credits::get_media_credit(get_post_thumbnail_id());

					the_post_thumbnail(
						'newspack-featured-image',
						array(
							'object-fit' => 'cover',
							'data-description' => get_post(get_post_thumbnail_id())->post_excerpt,
							'data-credit' => $image_meta['credit'],
							'data-credit-url' => $image_meta['credit_url'],
						)
					);
				} else {
					the_post_thumbnail(
						'newspack-featured-image',
						array(
							'object-fit' => 'cover',
							'data-description' => get_post(get_post_thumbnail_id())->post_excerpt,
						)
					);
				}

			else :
				the_post_thumbnail('newspack-featured-image');

				$caption = get_the_excerpt(get_post_thumbnail_id());
				// Check the existance of the caption separately, so filters -- like ones that add ads -- don't interfere.
				$caption_exists = get_post(get_post_thumbnail_id())->post_excerpt;

				if ($caption_exists) :
			?>
					<figcaption><?php echo wp_kses_post($caption); ?></figcaption>
			<?php
				endif;
			endif;
			?>

		</figure><!-- .post-thumbnail -->

	<?php else : ?>

		<figure class="post-thumbnail">
			<a class="post-thumbnail-inner" href="<?php the_permalink(); ?>" aria-hidden="true" tabindex="-1">
				<?php the_post_thumbnail('newspack-archive-image'); ?>
			</a>
		</figure>

<?php
	endif; // End is_singular().
}


/**
 * Prints HTML with the current post's categories.
 */
function newspack_categories()
{
	$categories_list = '';

	// Only display Yoast primary category if set.
	if (class_exists('WPSEO_Primary_Term')) {
		// $primary_term = new WPSEO_Primary_Term('category', get_the_ID());
		$category_id = get_post_meta(get_the_ID(), '_yoast_wpseo_primary_category', true);

		// var_dump(get_term());

		$parent_type_category = get_category_by_slug('type');
		if($parent_type_category) {
			$parent_type_category = $parent_type_category->cat_ID;
		}

		$post_categories = get_the_category();
		$post_child_category = null;
		foreach ( $post_categories as $post_cat ) {
			if ( $parent_type_category == $post_cat->parent ) {
				$post_child_category = $post_cat;
			}
		}

		$post_child_category;

		if($post_child_category) {
			$categories_list .= '<a href="' . esc_url(get_category_link($post_child_category->term_id)) . '" rel="category tag">' . $post_child_category->name . '</a> <span class="custom-separator"> / </span>';
		}

				
		if ($category_id) {
			$category = get_term($category_id);
			if ($category) {
				$categories_list .= '<a href="' . esc_url(get_category_link($category->term_id)) . '" rel="category tag">' . $category->name . '</a>';
			}
		}
	}

	if (!$categories_list) {
		/* translators: used between list items; followed by a space. */
		$categories_list = get_the_category_list('<span class="sep">' . esc_html__(',', 'newspack') . '&nbsp;</span>');
	}

	if ($categories_list) {
		printf(
			/* translators: 1: posted in label, only visible to screen readers. 2: list of categories. */
			'<span class="cat-links"><span class="screen-reader-text">%1$s</span>%2$s</span>',
			esc_html__('Posted in', 'newspack'),
			$categories_list,

		); // WPCS: XSS OK.
	}
}

/**
 * Prints HTML with meta information for the tags and comments.
 */
function newspack_entry_footer() {

	// Hide author, post date, category and tag text for pages.
	if ( 'post' === get_post_type() || 'project' === get_post_type() ) {
		/* translators: used between list items; followed by a space. */
		$tags_list = get_the_tag_list( '', '<span class="sep">' . esc_html__( ',', 'newspack' ) . '&nbsp;</span>' );
		if ( $tags_list ) {
			printf(
				/* translators: 1: posted in label, only visible to screen readers. 2: list of tags. */
				'<span class="tags-links"><span>%1$s </span>%2$s</span>',
				esc_html__( 'Tagged:', 'newspack' ),
				$tags_list
			); // WPCS: XSS OK.
		}
	}

	// Edit post link.
	edit_post_link(
		sprintf(
			wp_kses(
				/* translators: %s: Name of current post; only visible to screen readers. */
				__( 'Edit <span class="screen-reader-text">%s</span>', 'newspack' ),
				array(
					'span' => array(
						'class' => array(),
					),
				)
			),
			get_the_title()
		),
		'<span class="edit-link">' . newspack_get_icon_svg( 'edit', 16 ),
		'</span>'
	);
}