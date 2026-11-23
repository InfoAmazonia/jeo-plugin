import { __ } from '@wordpress/i18n';

/**
 * Layer origin badge (W4 — spec §5, Contrato O).
 *
 * Discreet TEXTUAL badge — never icon+color as the only signal (a11y rule).
 * "AI-generated" always renders when the origin is `ai`; "Manual" only
 * renders when the caller passes `showManual` (i.e. the list contains at
 * least one AI layer — the distinction matters only then).
 */

/**
 * Resolve a layer instance's origin. The instance-level `provenance` (map
 * meta, post-1.1) wins; the layer record's `layer_origin` (Contrato O,
 * top-level in the REST payload) is the fallback; default 'manual'.
 *
 * @param {Object} args
 * @param {Object} args.instance Layer instance (`{ id, provenance, … }`).
 * @param {Object} args.record   Loaded layer record (REST payload).
 * @return {string} 'ai' | 'manual'
 */
export function getLayerOrigin( { instance = {}, record = {} } = {} ) {
	const provenance = instance?.provenance;
	if ( provenance === 'ai' || provenance === 'manual' ) {
		return provenance;
	}
	return record?.layer_origin === 'ai' ? 'ai' : 'manual';
}

/**
 * Whether the "Manual" badge should render for this list (spec §5.1: only
 * when at least one AI layer is present — otherwise everything is manual
 * and the badge is noise).
 *
 * @param {Array} origins Resolved origins of the list.
 * @return {boolean}
 */
export function shouldShowManualBadge( origins = [] ) {
	return origins.includes( 'ai' );
}

export default function LayerOriginBadge( { origin, showManual = false } ) {
	if ( origin === 'ai' ) {
		return (
			<span className="jeo-layer-origin-badge">
				{ __( 'AI-generated', 'jeowp' ) }
			</span>
		);
	}
	if ( showManual ) {
		return (
			<span className="jeo-layer-origin-badge">
				{ __( 'Manual', 'jeowp' ) }
			</span>
		);
	}
	return null;
}
