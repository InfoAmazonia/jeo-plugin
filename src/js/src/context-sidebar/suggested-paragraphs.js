import { Button } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { sanitizeHtml } from '../shared/html';
import { repairCorruptedText } from './text-repair';
import { isTextInContent } from './content-detection';
import { getLanguageMismatch } from './language-detection';
import { getAiGateFlags, getAiSettingsUrl } from '../shared/ai-gate';

/**
 * Normalize the AI `paragraphs` payload (BUG-R9-1).
 *
 * The provider may return plain strings instead of the documented
 * `{ text, relevance_score }` objects (observed intermittently on the first
 * generation). Every consumer downstream reads `paragraph.text` — normalize
 * at this boundary so a string becomes `{ text: string }`, valid objects pass
 * through untouched, and unusable items (null/undefined/empty text) are
 * discarded with a console warning.
 *
 * @param {Array} paragraphs Raw `paragraphs` payload.
 * @return {Array} Normalized paragraphs ({ text: string, ... }).
 */
export const normalizeSuggestionParagraphs = ( paragraphs ) => {
	if ( ! Array.isArray( paragraphs ) ) {
		return [];
	}

	return paragraphs.reduce( ( acc, item ) => {
		if ( typeof item === 'string' ) {
			if ( item.trim() ) {
				acc.push( { text: item } );
			}
			return acc;
		}

		if (
			item &&
			typeof item === 'object' &&
			typeof item.text === 'string' &&
			item.text.trim()
		) {
			acc.push( item );
			return acc;
		}

		// eslint-disable-next-line no-console
		console.warn(
			'[JEO] Discarded an invalid suggested paragraph (expected { text } or string):',
			item
		);
		return acc;
	}, [] );
};

/**
 * Insert a paragraph block into the editor at the end of the document.
 *
 * @param {string} html Paragraph HTML content.
 */
const insertParagraph = ( html ) => {
	const block = createBlock( 'core/paragraph', { content: html } );
	wp.data.dispatch( 'core/block-editor' ).insertBlocks( block );
};

/**
 * Show the language-mismatch warning through the global `core/notices`
 * store (snackbar). R3-G2: an inline Notice dies with the panel — inserting
 * auto-selects the new block, the sidebar switches Document→Block and the
 * panel unmounts in the same commit. The global snackbar survives the
 * remount, which is the whole point of the warning.
 *
 * The fixed `id` makes repeated inserts replace the previous warning
 * instead of stacking snackbars. Informational only — never blocking.
 *
 * @param {Object} mismatch               Language pair.
 * @param {string} mismatch.paragraphLang Detected suggestion language.
 * @param {string} mismatch.articleLang   Detected article language.
 */
const showLanguageMismatchNotice = ( mismatch ) => {
	const message = sprintf(
		/* translators: 1: suggestion language, 2: article language */
		__(
			'This suggestion appears to be in %1$s, but the article appears to be in %2$s. The paragraph was inserted anyway — review it before publishing.',
			'jeowp'
		),
		LANGUAGE_NAMES[ mismatch.paragraphLang ] || mismatch.paragraphLang,
		LANGUAGE_NAMES[ mismatch.articleLang ] || mismatch.articleLang
	);
	wp.data.dispatch( 'core/notices' ).createNotice( 'warning', message, {
		id: 'jeo-context-language-mismatch',
		type: 'snackbar',
		isDismissible: true,
	} );
};

const LANGUAGE_NAMES = {
	pt: __( 'Portuguese', 'jeowp' ),
	en: __( 'English', 'jeowp' ),
	es: __( 'Spanish', 'jeowp' ),
};

/**
 * SuggestedParagraphs component.
 *
 * Renders AI-suggested paragraphs with inline HTML support (bold, italic,
 * links). Paragraphs are repaired (broken `\n` escapes) and sanitized before
 * rendering/inserting/copying — the stored content is never modified.
 *
 * The "Inserted" state is derived from the article content (never a blind
 * flag): it survives reloads and reverts to "Insert into article" when the
 * user removes the paragraph.
 *
 * @param {Object}   props               Component props.
 * @param {Array}    props.paragraphs    Suggested paragraphs.
 * @param {Array}    props.references    Related article references (displayed separately).
 * @param {Function} props.onInsertBlock Optional callback when inserting.
 * @return {JSX.Element|null}
 */
const SuggestedParagraphs = ( { paragraphs, references, onInsertBlock } ) => {
	const [ copiedIndex, setCopiedIndex ] = useState( null );

	// BUG-R9-1: normalize at the boundary — the provider intermittently
	// returns plain strings instead of { text } objects on the first
	// generation (rendered/inserted as "undefined" before this guard).
	const normalizedParagraphs = normalizeSuggestionParagraphs( paragraphs );

	// K-6: watch the article content so the "Inserted" state is durable and
	// honest — derived from content detection, not from a local flag.
	const postContent = useSelect(
		( select ) =>
			select( 'core/editor' ).getEditedPostAttribute( 'content' ) || '',
		[]
	);

	const hasParagraphs = normalizedParagraphs.length > 0;
	const hasReferences = references && references.length > 0;

	if ( ! hasParagraphs && ! hasReferences ) {
		return null;
	}

	const { canConfigureAi } = getAiGateFlags();

	const handleInsert = ( html ) => {
		// BUG-R9-1 final guard: never insert an empty/undefined paragraph —
		// a malformed payload must degrade to "no suggestion", never to an
		// article paragraph reading "undefined". Checked BEFORE the repair
		// pipeline so a non-string can never reach it.
		if (
			typeof html !== 'string' ||
			! html.trim() ||
			'undefined' === html.trim()
		) {
			// eslint-disable-next-line no-console
			console.warn( '[JEO] Blocked inserting an empty suggestion.' );
			return;
		}

		// Repair broken escapes BEFORE the text can reach the article (G-E).
		const safe = sanitizeHtml( repairCorruptedText( html ) );
		insertParagraph( safe );

		// 3.4: non-blocking language-mismatch warning. The insert always
		// proceeds — the notice is informational only.
		const mismatch = getLanguageMismatch( html, postContent );
		if ( mismatch ) {
			showLanguageMismatchNotice( mismatch );
		}

		if ( onInsertBlock ) {
			onInsertBlock( safe );
		}
	};

	const handleCopy = ( html, index ) => {
		const safe = sanitizeHtml( repairCorruptedText( html ) );
		const plain = document.createElement( 'div' );
		plain.innerHTML = safe;
		const plainText = plain.textContent || plain.innerText || '';

		const markCopied = () => {
			setCopiedIndex( index );
			setTimeout( () => setCopiedIndex( null ), 2000 );
		};

		/**
		 * Copy rich text using the native DOM selection + execCommand method.
		 * This is the most reliable cross-browser way to copy HTML to the
		 * clipboard with both text/html and text/plain formats.
		 *
		 * @return {boolean} Whether the copy command was successful.
		 */
		const copyViaSelection = () => {
			const el = document.createElement( 'div' );
			el.innerHTML = safe;
			el.style.position = 'fixed';
			el.style.left = '-9999px';
			el.style.top = '0';
			el.style.width = '1px';
			el.style.height = '1px';
			el.style.overflow = 'hidden';
			el.setAttribute( 'aria-hidden', 'true' );
			document.body.appendChild( el );

			// Force reflow so the browser registers the element.
			// eslint-disable-next-line no-unused-expressions
			el.offsetHeight;

			window.focus();

			const selection = window.getSelection();
			const range = document.createRange();
			range.selectNodeContents( el );
			selection.removeAllRanges();
			selection.addRange( range );

			let success = false;
			try {
				success = document.execCommand( 'copy' );
			} catch ( err ) {
				success = false;
			}

			selection.removeAllRanges();
			document.body.removeChild( el );
			return success;
		};

		/**
		 * Copy rich text using the modern ClipboardItem API.
		 *
		 * @return {Promise<void>}
		 */
		const copyViaClipboardItem = () => {
			const blobHtml = new Blob( [ safe ], { type: 'text/html' } );
			const blobText = new Blob( [ plainText ], { type: 'text/plain' } );
			const data = new ClipboardItem( {
				'text/html': blobHtml,
				'text/plain': blobText,
			} );
			return navigator.clipboard.write( [ data ] );
		};

		/**
		 * Copy plain text only.
		 *
		 * @return {Promise<void>}
		 */
		const copyPlain = () => {
			return navigator.clipboard.writeText( plainText );
		};

		// Try ClipboardItem first (modern, clean API).
		if ( navigator.clipboard && navigator.clipboard.write ) {
			copyViaClipboardItem()
				.then( markCopied )
				.catch( () => {
					// Fallback to DOM selection + execCommand (most reliable for rich text).
					if ( copyViaSelection() ) {
						markCopied();
					} else {
						// Final fallback to plain text.
						copyPlain().then( markCopied );
					}
				} );
		} else if ( copyViaSelection() ) {
			markCopied();
		} else if ( navigator.clipboard && navigator.clipboard.writeText ) {
			copyPlain().then( markCopied );
		}
	};

	return (
		<div className="jeo-context-suggestions">
			{ hasParagraphs && (
				<h4 className="jeo-context-suggestions__title">
					{ __( 'Suggested Paragraphs', 'jeowp' ) }
				</h4>
			) }
			{ hasParagraphs &&
				normalizedParagraphs.map( ( paragraph, index ) => {
					const safeHtml = sanitizeHtml(
						repairCorruptedText( paragraph.text )
					);
					// K-6: "Inserted" is derived from the article content — durable
					// across reloads, reverted when the user removes the paragraph.
					// BUG-B2: the needle is the REPAIRED text — the same text that
					// reaches the article on insert — never the raw stored one.
					const isInserted = isTextInContent(
						repairCorruptedText( paragraph.text ),
						postContent
					);
					return (
						<div key={ index } className="jeo-context-suggestion">
							<p
								className="jeo-context-suggestion__text"
								dangerouslySetInnerHTML={ { __html: safeHtml } }
							/>
							<div className="jeo-context-suggestion__actions">
								<Button
									variant="secondary"
									size="small"
									onClick={ () =>
										handleInsert( paragraph.text )
									}
									disabled={ isInserted }
									className="jeo-context-suggestion__insert"
								>
									{ isInserted
										? __( 'Inserted', 'jeowp' )
										: __( 'Insert into article', 'jeowp' ) }
								</Button>
								<Button
									variant="tertiary"
									size="small"
									onClick={ () =>
										handleCopy( paragraph.text, index )
									}
									className="jeo-context-suggestion__copy"
								>
									{ copiedIndex === index
										? __( 'Copied!', 'jeowp' )
										: __( 'Copy', 'jeowp' ) }
								</Button>
							</div>
						</div>
					);
				} ) }

			{ /* 3.1 (K-5): the references section is ALWAYS present once
				suggestions render — with an explanatory empty state instead of
				silently disappearing. */ }
			<div className="jeo-context-references">
				<h4 className="jeo-context-references__title">
					{ __( 'References used', 'jeowp' ) }
				</h4>
				{ hasReferences ? (
					<ul className="jeo-context-references__list">
						{ references.map( ( reference, index ) => (
							<li key={ index } className="jeo-context-reference">
								{ reference.url ? (
									<a
										href={ reference.url }
										target="_blank"
										rel="noopener noreferrer"
									>
										{ reference.title || reference.url }
									</a>
								) : (
									reference.title
								) }
							</li>
						) ) }
					</ul>
				) : (
					<div className="jeo-context-references__empty">
						<p className="jeo-context-references__empty-message">
							{ __(
								"No references available — the knowledge base is empty or disabled, so these suggestions are not grounded in your site's articles.",
								'jeowp'
							) }
						</p>
						{ canConfigureAi && (
							<p className="jeo-context-references__empty-action">
								<a
									href={ getAiSettingsUrl().replace(
										'tab=provider',
										'tab=knowledge'
									) }
									target="_blank"
									rel="noopener noreferrer"
								>
									{ __(
										'Index your content in AI Settings → Knowledge Base to enable references.',
										'jeowp'
									) }
								</a>
							</p>
						) }
					</div>
				) }
			</div>
		</div>
	);
};

export default SuggestedParagraphs;
