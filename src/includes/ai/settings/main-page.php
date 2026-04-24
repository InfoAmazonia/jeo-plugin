<div class="wrap">
	<h1><?php esc_html_e( 'JEO AI Configuration', 'jeo' ); ?></h1>

	<nav class="nav-tab-wrapper wp-clearfix">
		<?php foreach ( $tabs as $slug => $label ) : ?>
			<a href="<?php echo esc_url( admin_url( 'admin.php?page=' . $this->page_slug . '&tab=' . $slug ) ); ?>" class="nav-tab <?php echo $current_tab === $slug ? 'nav-tab-active' : ''; ?>">
				<?php echo esc_html( $label ); ?>
			</a>
		<?php endforeach; ?>
	</nav>

	<form action="options.php" method="post" class="clear prepend-top">
		<?php settings_fields( 'jeo-settings' ); ?>
		
		<style>
			/* Esconde conteúdo inicialmente para o Skeleton Loader */
			.jeo-tab-content-wrapper { display: none; }
			
			.jeo-skeleton-container { padding: 20px; background: #fff; border: 1px solid #ccd0d4; border-top: 0; }
			.jeo-skeleton-line { height: 12px; background: #f0f0f1; margin-bottom: 10px; border-radius: 4px; }
			.jeo-skeleton-pulse { animation: jeo-pulse 1.5s infinite ease-in-out; }
			
			@keyframes jeo-pulse {
				0% { opacity: 0.5; }
				50% { opacity: 1; }
				100% { opacity: 0.5; }
			}

			/* Modal Styles (Improved) */
			.jeo-ai-modal {
				border: none;
				border-radius: 8px;
				box-shadow: 0 5px 30px rgba(0,0,0,0.3);
				padding: 0;
				max-height: 85vh;
				width: 80vw;
				max-width: 1000px;
				overflow: hidden;
				/* Remove display:flex here to avoid overriding dialog default hidden state */
			}
			.jeo-ai-modal::backdrop {
				background: rgba(0,0,0,0.5);
			}
			.jeo-ai-modal[open] {
				display: flex;
				flex-direction: column;
			}
			.jeo-dict-content {
				padding: 20px 30px;
				overflow-y: auto;
				flex: 1;
			}
		</style>

		<div id="jeo-skeleton" class="jeo-skeleton-container jeo-skeleton-pulse">
			<div class="jeo-skeleton-line" style="width: 30%;"></div>
			<div class="jeo-skeleton-line" style="width: 100%;"></div>
			<div class="jeo-skeleton-line" style="width: 100%;"></div>
			<div class="jeo-skeleton-line" style="width: 80%;"></div>
			<div class="jeo-skeleton-line" style="width: 100%; margin-top: 30px;"></div>
			<div class="jeo-skeleton-line" style="width: 90%;"></div>
		</div>

		<div class="jeo-tab-content-wrapper" style="background: #fff; border: 1px solid #ccd0d4; border-top: 0; padding: 20px 30px;">
			<input type="hidden" name="<?php echo esc_html( \jeo_settings()->get_field_name( 'current_tab' ) ); ?>" value="<?php echo esc_attr( $current_tab ); ?>">
			<?php
			switch ( $current_tab ) {
				case 'provider':
					include 'tab-provider.php';
					break;
				case 'knowledge':
					include 'tab-knowledge.php';
					break;
				case 'embedded':
					include 'tab-embedded.php';
					break;
				case 'bulk':
					include 'tab-bulk.php';
					break;
			}
			?>
		</div>

		<div class="jeo-settings-submit" style="margin-top: 20px;">
			<input type="submit" class="button-primary" value="<?php esc_attr_e( 'Save AI Settings', 'jeo' ); ?>" />
		</div>
	</form>
</div>

<div id="jeo-ai-debug-console" style="position: fixed; bottom: 0; right: 20px; width: 450px; background: #1d2327; color: #fff; border: 1px solid #3c434a; border-bottom: 0; border-radius: 6px 6px 0 0; z-index: 99999; font-family: monospace; display: flex; flex-direction: column; box-shadow: 0 -2px 10px rgba(0,0,0,0.3); transition: transform 0.3s ease;">
	<div id="jeo-ai-debug-header" style="padding: 8px 15px; background: #2c3338; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-radius: 6px 6px 0 0;">
		<span style="font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">📡 <?php esc_html_e( 'JEO AI API Debugger', 'jeo' ); ?></span>
		<div style="display: flex; gap: 10px; align-items: center;">
			<span id="jeo-ai-debug-clear" title="<?php esc_attr_e( 'Clear logs', 'jeo' ); ?>" style="cursor:pointer; font-size: 14px;">🧹</span>
			<span id="jeo-ai-debug-toggle" style="font-size: 12px;">▲</span>
		</div>
	</div>
	<div id="jeo-ai-debug-body" style="height: 300px; overflow-y: auto; padding: 15px; display: none; background: #1d2327;">
		<div id="jeo-ai-debug-log-container">
			<div style="color: #8c8f94; font-style: italic;"><?php esc_html_e( '[System] Console initialized. Awaiting API activity...', 'jeo' ); ?></div>
		</div>
	</div>
</div>

<style>
	.jeo-debug-entry { border-bottom: 1px solid #3c434a; padding-bottom: 8px; margin-bottom: 8px; }
	.jeo-debug-label { font-weight: bold; margin-bottom: 3px; display: block; }
	.jeo-debug-request { color: #72aee6; }
	.jeo-debug-response { color: #46b450; }
	.jeo-debug-error { color: #d63638; }
	.jeo-debug-payload { background: #000; padding: 5px; border-radius: 3px; overflow-x: auto; margin-top: 5px; white-space: pre; }
	.jeo-settings-submit input { padding: 6px 24px; }
</style>
