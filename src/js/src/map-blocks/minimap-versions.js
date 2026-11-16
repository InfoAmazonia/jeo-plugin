import { Button, PanelBody, Spinner } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

import { fetchMinimapVersions } from './minimap-api';
import { formatSiteDateTime } from '../shared/datetime';

/**
 * Version history panel for the minimap block (W3 — C2-01, Contrato G).
 *
 * Lists the server-side snapshots (`{ n, timestamp, label, is_current }`)
 * with a per-item Restore button. The confirmation states exactly what is
 * discarded and that the current version stays in the history (git-revert
 * semantics — a restore appends a new version, it never deletes).
 */

/**
 * Format a stored version timestamp for the list — W4 §6.1: the site's own
 * datetime format via the shared `formatSiteDateTime` (single format for
 * all JS-rendered timestamps).
 *
 * @param {string} timestamp Stored timestamp.
 * @return {string} Formatted timestamp.
 */
export function formatVersionTimestamp( timestamp ) {
	return formatSiteDateTime( timestamp );
}

/**
 * Build the restore confirmation message: what will be discarded and the
 * declared reversibility.
 *
 * @param {Object} version      The version to restore ({ n, label, timestamp }).
 * @param {Object} current      The current version ({ n, label }).
 * @return {string} Confirmation message.
 */
export function buildRestoreConfirmation( version, current ) {
	return sprintf(
		/* translators: 1: version number being restored, 2: its label, 3: current version number, 4: current version label. */
		__(
			'Restore version #%1$d ("%2$s")? The current map (#%3$d, "%4$s") will be replaced. Nothing is lost: the current version stays in the history and can be restored later.',
			'jeowp'
		),
		version.n,
		version.label || __( 'untitled', 'jeowp' ),
		current?.n || '?',
		current?.label || __( 'current map', 'jeowp' )
	);
}

/**
 * The "Versions" panel.
 *
 * @param {Object}   props
 * @param {number}   props.postId         Post ID.
 * @param {string}   props.conversationId Conversation UUID.
 * @param {Function} props.onRestore      Called with the version to restore;
 *                                        performs the confirm + request.
 * @param {*}        props.refreshKey     Bump to refetch (after AI turns).
 * @param {boolean}  props.busy           Disable actions while a request runs.
 */
/**
 * Accessible name for a Restore button (a11y C-5): each button must say
 * WHICH version it restores — identical "Restore" labels are ambiguous.
 *
 * @param {Object} version Version entry ({ n, label }).
 * @return {string} aria-label text.
 */
export function buildRestoreAriaLabel( version ) {
	return sprintf(
		/* translators: %d: version number, %s: version label. */
		__( 'Restore version %d (%s)', 'jeowp' ),
		version.n,
		version.label || __( 'no description', 'jeowp' )
	);
}

export default function MinimapVersionsPanel( {
	postId,
	conversationId,
	onRestore,
	refreshKey,
	busy,
} ) {
	const [ versions, setVersions ] = useState( null );
	const [ unavailable, setUnavailable ] = useState( false );

	useEffect( () => {
		if ( ! postId || ! conversationId ) {
			return undefined;
		}
		let cancelled = false;
		fetchMinimapVersions( postId, conversationId )
			.then( ( response ) => {
				if ( cancelled ) {
					return;
				}
				const list = Array.isArray( response?.versions )
					? response.versions
					: [];
				setVersions( list );
			} )
			.catch( () => {
				// Graceful degradation: the endpoint is delivered by the
				// parallel PHP track — while it is absent (404), hide the
				// panel instead of showing an error.
				if ( ! cancelled ) {
					setUnavailable( true );
				}
			} );
		return () => {
			cancelled = true;
		};
	}, [ postId, conversationId, refreshKey ] );

	if ( unavailable || ! postId || ! conversationId ) {
		return null;
	}

	return (
		<PanelBody
			name="minimap-versions"
			title={ __( 'Versions', 'jeowp' ) }
			className="jeo-minimap-versions-panel"
			initialOpen={ false }
		>
			{ versions === null && <Spinner /> }
			{ versions !== null && versions.length === 0 && (
				<p className="jeo-minimap-versions__empty">
					{ __(
						'No stored versions yet — each accepted AI result adds one.',
						'jeowp'
					) }
				</p>
			) }
			{ versions !== null && versions.length > 0 && (
				<ol className="jeo-minimap-versions">
					{ versions.map( ( version ) => (
						<li
							key={ version.n }
							className={ `jeo-minimap-version${
								version.is_current
									? ' jeo-minimap-version--current'
									: ''
							}` }
						>
							<div className="jeo-minimap-version__meta">
								<strong className="jeo-minimap-version__n">
									{ sprintf(
										/* translators: %d: version number. */
										__( '#%d', 'jeowp' ),
										version.n
									) }
								</strong>{ ' ' }
								<span className="jeo-minimap-version__date">
									{ formatVersionTimestamp(
										version.timestamp
									) }
								</span>
								{ version.is_current && (
									<span className="jeo-minimap-version__badge">
										{ __( 'current', 'jeowp' ) }
									</span>
								) }
							</div>
							<div className="jeo-minimap-version__label">
								{ version.label ||
									__( '(no description)', 'jeowp' ) }
							</div>
							{ ! version.is_current && (
								<Button
									variant="tertiary"
									isSmall
									disabled={ busy }
									aria-label={ buildRestoreAriaLabel( version ) }
									onClick={ () =>
									onRestore(
										version,
										versions.find( ( v ) => v.is_current )
									)
								}
								>
									{ __( 'Restore', 'jeowp' ) }
								</Button>
							) }
						</li>
					) ) }
				</ol>
			) }
		</PanelBody>
	);
}
