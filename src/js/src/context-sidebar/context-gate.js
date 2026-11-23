import { Button } from '@wordpress/components';
import { Icon, plugins } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { getGateCopy, goToAiSettings } from '../shared/ai-gate';

/**
 * ContextGate component (2.1-contexto; W4 §1 shell).
 *
 * Rendered inside the native panel when no AI provider is configured. Thin
 * shell: flags, copy and navigation behavior come from the single source
 * `shared/ai-gate.js` (W4 unification) — the panel-card wrapper (icon →
 * title → one-sentence cause → action) stays idiomatic to the document
 * panel. The CTA opens a new tab (`saveFirst: false`, panel rule) so the
 * editor state is never lost; the gate never blocks saving the post.
 *
 * @param {Object}  props                Component props.
 * @param {boolean} props.canConfigureAi Whether the user can configure AI.
 * @return {JSX.Element} The gate panel content.
 */
const ContextGate = ( { canConfigureAi } ) => {
	const copy = getGateCopy( __( 'the AI Context Assistant', 'jeowp' ) );

	return (
		<div className="jeo-context-gate">
			<Icon
				icon={ plugins }
				size={ 36 }
				className="jeo-context-gate__icon"
			/>
			<h4 className="jeo-context-gate__title">{ copy.title }</h4>
			<p className="jeo-context-gate__message">
				{ canConfigureAi ? copy.messageAdmin : copy.messageNonAdmin }
			</p>
			{ canConfigureAi && (
				<Button
					variant="primary"
					className="jeo-context-gate__cta"
					onClick={ () => goToAiSettings( { saveFirst: false } ) }
				>
					{ copy.ctaLabel }
				</Button>
			) }
		</div>
	);
};

export default ContextGate;
