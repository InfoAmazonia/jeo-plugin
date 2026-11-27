import { Button } from '@wordpress/components';
import { Component, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import './preview-error.css';

const SETTINGS_PAGE_URL = '/wp-admin/admin.php?page=jeo-settings';

/**
 * Extract the humanized error payload produced by the server-side error
 * translation layer (shape: { message, action, detail }) from a REST error.
 *
 * `action` may be a plain label string or an object { label, url }. Returns
 * null when the error carries no humanized payload.
 *
 * @param {Error|Object} error Error rejected by apiFetch/fetchJson.
 * @return {Object|null} Normalized { message, actionLabel, actionUrl, detail }.
 */
export function getServerErrorPayload( error ) {
	const data = error?.data;
	if ( ! data || typeof data !== 'object' ) {
		return null;
	}

	// WP REST errors put the HTTP status in data.status; the humanized
	// payload lives in the remaining data keys.
	const message =
		typeof data.message === 'string' && data.message ? data.message : null;
	if ( ! message && ! data.action && ! data.detail ) {
		return null;
	}

	let actionLabel = null;
	let actionUrl = null;
	if ( typeof data.action === 'string' && data.action ) {
		actionLabel = data.action;
	} else if ( data.action && typeof data.action === 'object' ) {
		actionLabel = data.action.label || null;
		actionUrl = data.action.url || null;
	}

	return {
		message: message || null,
		actionLabel,
		actionUrl,
		detail:
			typeof data.detail === 'string' && data.detail ? data.detail : null,
	};
}

function parseStatusFromMessage( message ) {
	const match = /^(\d{3})\b/.exec( String( message || '' ).trim() );
	return match ? Number.parseInt( match[ 1 ], 10 ) : null;
}

/**
 * Build the technical detail block shown collapsed under "Technical details".
 *
 * @param {Error|Object} error
 * @return {string} Multi-line technical detail, never empty.
 */
export function buildPreviewErrorDetail( error ) {
	const lines = [];
	const status = error?.status ?? parseStatusFromMessage( error?.message );

	if ( status ) {
		lines.push( `HTTP ${ status }` );
	}
	if ( error?.url ) {
		lines.push( `URL: ${ error.url }` );
	}
	if ( error?.code ) {
		lines.push( `Code: ${ error.code }` );
	}
	if ( error?.message ) {
		lines.push( String( error.message ) );
	}
	if ( ! lines.length ) {
		lines.push( String( error ) );
	}

	return lines.join( '\n' );
}

/**
 * Translate a preview loading failure into the single error pattern:
 * cause in one sentence + action + collapsed technical detail.
 *
 * Server payloads ({ message, action, detail }) win; otherwise the error is
 * classified client-side by HTTP status / failure kind.
 *
 * @param {Error|Object} error        The caught failure.
 * @param {Object}       options
 * @param {string}       options.kind 'style' when the failed resource is the
 *                                    base style itself (mapbox/style-json layers).
 * @return {Object} { message, actionLabel, actionUrl, detail }
 */
export function getPreviewErrorInfo( error, { kind = 'source' } = {} ) {
	const serverPayload = getServerErrorPayload( error );
	const detail = serverPayload?.detail || buildPreviewErrorDetail( error );

	if ( serverPayload?.message ) {
		return {
			message: serverPayload.message,
			actionLabel: serverPayload.actionLabel,
			actionUrl: serverPayload.actionUrl,
			detail,
		};
	}

	const status = error?.status ?? parseStatusFromMessage( error?.message );

	if ( status === 401 || status === 403 ) {
		return {
			message: __(
				'The preview could not be loaded: the access token is missing or invalid.',
				'jeowp'
			),
			actionLabel: __(
				'Check the access token in the plugin settings',
				'jeowp'
			),
			actionUrl: SETTINGS_PAGE_URL,
			detail,
		};
	}

	if ( status === 404 ) {
		return {
			message:
				kind === 'style'
					? __(
							'The preview could not be loaded: the style was not found (404). Review the Style ID field.',
							'jeowp'
					  )
					: __(
							'The preview could not be loaded: the layer source was not found (404). Review the layer fields.',
							'jeowp'
					  ),
			actionLabel: null,
			actionUrl: null,
			detail,
		};
	}

	if (
		error?.name === 'TypeError' ||
		/failed to fetch|networkerror|network request failed/i.test(
			String( error?.message || '' )
		)
	) {
		return {
			message: __(
				'The preview could not be loaded: the map server could not be reached. Check your connection.',
				'jeowp'
			),
			actionLabel: null,
			actionUrl: null,
			detail,
		};
	}

	return {
		message:
			kind === 'style'
				? __(
						'The preview could not be loaded: the style is invalid or unavailable.',
						'jeowp'
				  )
				: __(
						'The preview could not be loaded: the layer source is invalid or unavailable.',
						'jeowp'
				  ),
		actionLabel: null,
		actionUrl: null,
		detail,
	};
}

export async function copyToClipboard( text ) {
	try {
		await navigator.clipboard.writeText( text );
		return true;
	} catch {
		// Fallback for contexts where the async clipboard API is blocked
		// (e.g. the block editor iframe without clipboard permissions).
		try {
			const textarea = document.createElement( 'textarea' );
			textarea.value = text;
			textarea.style.position = 'fixed';
			textarea.style.opacity = '0';
			document.body.appendChild( textarea );
			textarea.select();
			const ok = document.execCommand( 'copy' );
			document.body.removeChild( textarea );
			return ok;
		} catch {
			return false;
		}
	}
}

/**
 * The single preview error state used by the layer editor, the map editor and
 * the minimap: cause in one sentence + action + collapsed technical detail
 * with a "Copy details" button. Rendered in place of the map preview — never
 * alongside a courtesy base map.
 *
 * @param {Object}       props
 * @param {Error|Object} props.error     The caught failure.
 * @param {Object}       [props.info]    Pre-computed { message, actionLabel, actionUrl, detail } override.
 * @param {string}       [props.kind]    Forwarded to getPreviewErrorInfo ('source'|'style').
 * @param {Function}     [props.onRetry] When provided, renders a "Try again" button.
 */
export default function PreviewErrorState( {
	error,
	info,
	kind = 'source',
	onRetry,
} ) {
	const [ copied, setCopied ] = useState( false );
	const resolved = info || getPreviewErrorInfo( error, { kind } );

	return (
		<div className="jeo-preview-error" role="alert">
			<p className="jeo-preview-error__message">{ resolved.message }</p>
			<p className="jeo-preview-error__hint">
				{ __(
					'You can still save a draft, but the map will not render until this is fixed.',
					'jeowp'
				) }
			</p>
			<div className="jeo-preview-error__actions">
				{ onRetry && (
					<Button variant="primary" onClick={ onRetry }>
						{ __( 'Try again', 'jeowp' ) }
					</Button>
				) }
				{ resolved.actionUrl && resolved.actionLabel && (
					<Button
						variant="secondary"
						href={ resolved.actionUrl }
						target="_blank"
						rel="noopener noreferrer"
					>
						{ resolved.actionLabel }
					</Button>
				) }
				{ ! resolved.actionUrl && resolved.actionLabel && (
					<span className="jeo-preview-error__action-text">
						{ resolved.actionLabel }
					</span>
				) }
			</div>
			{ resolved.detail && (
				<details className="jeo-preview-error__details">
					<summary>{ __( 'Technical details', 'jeowp' ) }</summary>
					<pre>{ resolved.detail }</pre>
					<Button
						variant="tertiary"
						className="jeo-preview-error__copy"
						onClick={ async () => {
							const ok = await copyToClipboard( resolved.detail );
							if ( ok ) {
								setCopied( true );
								setTimeout( () => setCopied( false ), 2000 );
							}
						} }
					>
						{ copied
							? __( 'Copied!', 'jeowp' )
							: __( 'Copy details', 'jeowp' ) }
					</Button>
				</details>
			) }
		</div>
	);
}

/**
 * Compose a fixed error info for failures detected before any request is
 * made (e.g. invalid inline style JSON).
 *
 * @param {string} message Human cause in one sentence (already translated).
 * @param {string} detail  Technical detail.
 * @return {Object} Error info { message, actionLabel, actionUrl, detail }.
 */
export function buildPreviewErrorInfo( message, detail ) {
	return { message, actionLabel: null, actionUrl: null, detail };
}

/**
 * Render-error boundary for the preview maps (Gate r3b — GAP-A, defense in
 * depth): a synchronous GL/render crash (e.g. a malformed source spec that
 * slipped past the renderer guards) must surface as the single error
 * pattern, never leak into the core block boundary ("This block has
 * encountered an error…"), which is sticky and unexplained.
 *
 * The boundary reports through `onCatch` — the surfaces replace the map
 * with `PreviewErrorState`, so the boundary itself renders nothing on
 * error and unmounts together with the map (a retry remounts it fresh).
 */
export class PreviewErrorBoundary extends Component {
	constructor( props ) {
		super( props );
		this.state = { crashed: false };
	}

	static getDerivedStateFromError() {
		return { crashed: true };
	}

	componentDidCatch( error ) {
		this.props.onCatch?.( error );
	}

	render() {
		if ( this.state.crashed ) {
			return null;
		}
		return this.props.children;
	}
}
