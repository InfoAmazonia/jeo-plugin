<?php
/**
 * Embedded territories dictionary settings tab.
 *
 * @package Jeo
 */

?>
<div class="card" style="max-width: 100%; padding: 20px; border-radius: 8px;">
	<h3 style="margin-top: 0;">🇧🇷 <?php esc_html_e( 'Embedded Brazilian Territories', 'jeo' ); ?></h3>
	<p class="description"><?php esc_html_e( 'The following geographic dictionaries are available locally to improve AI precision:', 'jeo' ); ?></p>
	
	<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px; margin-top: 20px;">
		<?php
		$data_dir = JEO_BASEPATH . '/includes/ai/data/';

		$friendly_names = array(
			'biomes.json'                      => 'Biomas Brasileiros',
			'indigenous-territories.json'      => 'Terras Indígenas',
			'quilombola-territories.json'      => 'Territórios Quilombolas',
			'extractive-reserves.json'         => 'Reservas Extrativistas (Resex)',
			'conservation-units.json'          => 'Unidades de Conservação',
			'riverside-communities.json'       => 'Comunidades Ribeirinhas',
			'agrarian-reform-settlements.json' => 'Assentamentos de Reforma Agrária',
			'indigenous-peoples.json'          => 'Povos Indígenas (Etnias)',
			'legal-amazon.json'                => 'Amazônia Legal e Limites',
			'hydrographic-basins.json'         => 'Bacias Hidrográficas',
		);

		if ( is_dir( $data_dir ) ) {
			$files = scandir( $data_dir );
			foreach ( $files as $file ) {
				if ( strpos( $file, '.json' ) !== false ) {
					$json_path    = $data_dir . $file;
					$json_content = file_get_contents( $json_path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
					$data         = json_decode( $json_content, true );
					$count        = is_array( $data ) ? count( $data ) : 0;

					$file_slug    = str_replace( '.json', '', $file );
					$display_name = isset( $friendly_names[ $file ] ) ? $friendly_names[ $file ] : ucwords( str_replace( '-', ' ', $file_slug ) );
					?>
					<div style="background: #f6f7f7; border: 1px solid #dcdcde; padding: 15px; border-radius: 6px; display: flex; flex-direction: column; justify-content: space-between;">
						<div>
							<strong style="font-size: 14px; color: #1d2327;"><?php echo esc_html( $display_name ); ?></strong>
							<div style="font-size: 12px; color: #646970; margin-top: 5px; margin-bottom: 15px;">
								<span><?php esc_html_e( 'File:', 'jeo' ); ?> <code><?php echo esc_html( $file ); ?></code></span><br>
								<span><?php esc_html_e( 'Entries found:', 'jeo' ); ?> <strong><?php echo esc_html( $count ); ?></strong></span>
							</div>
						</div>

						<div style="display: flex; gap: 8px; border-top: 1px solid #eee; padding-top: 12px;">
							<button type="button" class="button button-secondary jeo-ai-preview-dict-btn" 
								data-dict-id="dict-modal-<?php echo esc_attr( $file_slug ); ?>">
								<?php esc_html_e( 'Preview', 'jeo' ); ?>
							</button>
							<a href="<?php echo esc_url( admin_url( 'admin-post.php?action=jeo_download_dict&file=' . $file ) ); ?>" class="button button-secondary">
								<?php esc_html_e( 'Download', 'jeo' ); ?>
							</a>
						</div>

						<!-- Modal Preview -->
						<dialog id="dict-modal-<?php echo esc_attr( $file_slug ); ?>" class="jeo-ai-modal jeo-dict-modal">
							<div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid #ccc; padding-bottom: 15px; margin-bottom: 20px; position: sticky; top: 0; background: #fff; z-index: 10;">
								<h2 style="margin:0;"><?php echo esc_html( $display_name ); ?></h2>
								<button type="button" class="button jeo-ai-close-modal-btn"><?php esc_html_e( 'Close', 'jeo' ); ?></button>
							</div>

							<div class="jeo-dict-content">
								<h3 style="margin-top: 0;"><?php esc_html_e( 'Item List', 'jeo' ); ?></h3>
								<table class="wp-list-table widefat fixed striped" style="margin-bottom: 30px;">
									<thead>
										<tr>
											<th><?php esc_html_e( 'Name', 'jeo' ); ?></th>
											<th><?php esc_html_e( 'Latitude', 'jeo' ); ?></th>
											<th><?php esc_html_e( 'Longitude', 'jeo' ); ?></th>
										</tr>
									</thead>
									<tbody>
										<?php foreach ( $data as $item ) : ?>
											<tr>
												<td><strong><?php echo esc_html( $item['name'] ); ?></strong></td>
												<td><code><?php echo esc_html( $item['lat'] ); ?></code></td>
												<td><code><?php echo esc_html( $item['lon'] ); ?></code></td>
											</tr>
										<?php endforeach; ?>
									</tbody>
								</table>

								<h3><?php esc_html_e( 'JSON Raw', 'jeo' ); ?></h3>
								<pre style="background: #000; color: #0F0; padding: 20px; border-radius: 4px; overflow-x: auto; font-family: 'Courier New', Courier, monospace; font-size: 13px; line-height: 1.4; border: 2px solid #333; margin-bottom: 20px;"><?php echo esc_html( wp_json_encode( $data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE ) ); ?></pre>
							</div>
						</dialog>
					</div>
					<?php
				}
			}
		}
		?>
	</div>
</div>
