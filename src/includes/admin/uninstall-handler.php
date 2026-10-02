<?php
/**
 * JEO Uninstall Handler
 *
 * Replaces the default "Delete" plugin link with a confirmation page
 * and registers the admin screen that lists all data to be removed.
 *
 * @package Jeo
 */

add_filter( 'plugin_action_links', 'jeo_modify_delete_link', 10, 2 );

/**
 * Replace the Delete link for JEO with a link to the confirmation page.
 *
 * @param array  $actions     Plugin action links.
 * @param string $plugin_file Path to the plugin file relative to plugins dir.
 * @return array
 */
function jeo_modify_delete_link( $actions, $plugin_file ) {
	$jeo_basename = plugin_basename( JEO_BASEPATH . 'jeo.php' );
	if ( $plugin_file !== $jeo_basename ) {
		return $actions;
	}

	if ( isset( $actions['delete'] ) ) {
		$actions['delete'] = sprintf(
			'<a href="%s" class="delete" aria-label="%s">%s</a>',
			esc_url( admin_url( 'admin.php?page=jeo-uninstall-confirm' ) ),
			esc_attr__( 'Uninstall JEO', 'jeowp' ),
			esc_html__( 'Uninstall', 'jeowp' )
		);
	}

	return $actions;
}

add_action( 'admin_menu', 'jeo_register_uninstall_page' );

/**
 * Register the hidden uninstall confirmation admin page.
 *
 * @return void
 */
function jeo_register_uninstall_page() {
	add_submenu_page(
		null, // No parent menu — hidden page.
		__( 'Uninstall JEO', 'jeowp' ),
		__( 'Uninstall JEO', 'jeowp' ),
		'activate_plugins',
		'jeo-uninstall-confirm',
		'jeo_render_uninstall_page'
	);
}

/**
 * Render the uninstall confirmation page.
 *
 * @return void
 */
function jeo_render_uninstall_page() {
	if ( ! current_user_can( 'activate_plugins' ) ) {
		wp_die( esc_html__( 'You do not have permission to uninstall plugins.', 'jeowp' ) );
	}

	require_once __DIR__ . '/uninstall-page.php';
}
