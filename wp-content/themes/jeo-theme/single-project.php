<?php

/**
 * The template for displaying all single posts
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/#single-post
 *
 * @package Newspack
 */

get_header('single');
the_post();



get_template_part('template-parts/singles/single', 'project'); ?>

<?php
get_footer();
