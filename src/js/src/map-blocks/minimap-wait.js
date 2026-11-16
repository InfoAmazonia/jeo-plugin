import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Wait contract for AI states (W2 — item 2.2, criterion A5).
 *
 * Every AI wait (initial generation, chat turn, "Thinking…") shows the
 * current phase, the elapsed time and a recovery instruction. Cancel is
 * deliberately NOT offered for minimap requests: the server persists the
 * conversation turn as it processes, so a client-side abort would diverge
 * the block from the stored conversation — the safe contract is to wait,
 * with a clear recovery path (reload resumes from the last saved state).
 */

/**
 * Elapsed seconds while `active` is true (ticking every second, reset to
 * zero when inactive).
 *
 * @param {boolean} active Whether the wait is in progress.
 * @return {number} Elapsed seconds.
 */
export function useElapsedSeconds( active ) {
	const [ seconds, setSeconds ] = useState( 0 );

	useEffect( () => {
		if ( ! active ) {
			setSeconds( 0 );
			return undefined;
		}
		const started = Date.now();
		setSeconds( 0 );
		const timer = setInterval( () => {
			setSeconds( Math.floor( ( Date.now() - started ) / 1000 ) );
		}, 1000 );
		return () => clearInterval( timer );
	}, [ active ] );

	return seconds;
}

/**
 * Format the elapsed time for the wait note.
 *
 * @param {number} seconds Elapsed seconds.
 * @return {string} Human elapsed time (e.g. "12s", "2m 05s").
 */
export function formatElapsedTime( seconds ) {
	const total = Math.max( 0, Math.floor( seconds ) );
	if ( total < 60 ) {
		return sprintf(
			/* translators: %d: elapsed seconds. */
			__( '%ds', 'jeowp' ),
			total
		);
	}
	const minutes = Math.floor( total / 60 );
	const rest = String( total % 60 ).padStart( 2, '0' );
	return sprintf(
		/* translators: 1: elapsed minutes, 2: remaining seconds (zero-padded). */
		__( '%1$dm %2$ss', 'jeowp' ),
		minutes,
		rest
	);
}

/**
 * The wait note rendered under every AI waiting state: current phase +
 * elapsed time + recovery instruction. Rendered with `role="status"` so
 * screen readers announce the progress without interrupting.
 *
 * @param {Object} props
 * @param {string} props.phase    Current phase label (already translated).
 * @param {number} props.elapsed  Elapsed seconds.
 * @param {string} props.recovery Recovery instruction (already translated).
 */
export function MinimapWaitNote( { phase, elapsed, recovery } ) {
	return (
		<p className="jeo-minimap-wait" role="status">
			<span className="jeo-minimap-wait__phase">{ phase }</span>{ ' ' }
			<span className="jeo-minimap-wait__elapsed">
				{ formatElapsedTime( elapsed ) }
			</span>
			<span className="jeo-minimap-wait__recovery">{ recovery }</span>
		</p>
	);
}
