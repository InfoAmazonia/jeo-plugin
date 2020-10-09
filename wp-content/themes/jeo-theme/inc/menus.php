<?php
function custom_menus() {
    register_nav_menu('more-menu', __('More', 'jeo'));
}

add_action('init', 'custom_menus');
