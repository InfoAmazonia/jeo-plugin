import { Button } from '@wordpress/components';
import { PluginPrePublishPanel } from '@wordpress/editor';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import {
	getAiGateFlags,
	getGateCopy,
	goToAiSettings,
} from '../shared/ai-gate';

/**
 * AI-not-configured gate for the minimap block (W2 2.1/K-3; W4 §1).
 *
 * Thin shell: the block canvas keeps the native `Placeholder` wrapper (the
 * caller renders it) — this component provides the gate body. Flags, copy
 * and navigation behavior come from the single source
 * `shared/ai-gate.js` (W4 unification); the CTA saves the draft before
 * navigating (`saveFirst: true`, block-canvas rule). The gate never blocks
 * saving the post.
 */

const FEATURE = __( 'the AI-Assisted Map block', 'jeowp' );

/**
 * The gate body rendered inside the block's native `Placeholder`.
 */
export function MinimapAiGate() {
	const { canConfigureAi } = getAiGateFlags();
	const [ navigating, setNavigating ] = useState( false );
	const copy = getGateCopy( FEATURE );

	return (
		<>
			{ /* G4b (Manager rule): the native gate pattern requires the
			     title — icon → title → instructions → controls. */ }
			<h3 className="jeo-minimap-gate__title">{ copy.title }</h3>
			<p className="jeo-minimap-placeholder__description">
				{ canConfigureAi ? copy.messageAdmin : copy.messageNonAdmin }
			</p>
			{ canConfigureAi && (
				<Button
					variant="primary"
					isBusy={ navigating }
					disabled={ navigating }
					className="jeo-minimap-placeholder__generate"
					onClick={ async () => {
						if ( navigating ) {
							return;
						}
						setNavigating( true );
						try {
							await goToAiSettings( { saveFirst: true } );
						} finally {
							setNavigating( false );
						}
					} }
				>
					{ copy.ctaLabel }
				</Button>
			) }
		</>
	);
}

/**
 * Warning shown in the standard WordPress pre-publish panel while the block
 * holds no generated map because AI is not configured. Advisory only — it
 * never blocks saving or publishing.
 */
export function MinimapPrePublishGateWarning() {
	return (
		<PluginPrePublishPanel
			name="jeo-minimap-ai-gate"
			title={ __( 'AI-Assisted Map', 'jeowp' ) }
			initialOpen
			className="jeo-minimap-gate-prepublish"
		>
			<p>
				{ __(
					'This post contains an AI-Assisted Map block without a generated map: no AI provider is configured. The block renders nothing on the published post until an administrator configures one — remove the block or configure the provider before publishing.',
					'jeowp'
				) }
			</p>
		</PluginPrePublishPanel>
	);
}
