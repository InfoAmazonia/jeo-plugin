import { Button } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import { sanitizeHtml } from '../shared/html';

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
 * SuggestedParagraphs component.
 *
 * Renders AI-suggested paragraphs with inline HTML support (bold, italic,
 * links). Paragraphs are sanitized before rendering to prevent XSS.
 *
 * @param {Object}   props                 Component props.
 * @param {Array}    props.paragraphs      Suggested paragraphs.
 * @param {Array}    props.references      Related article references (displayed separately).
 * @param {Function} props.onInsertBlock   Optional callback when inserting.
 * @return {JSX.Element|null}
 */
const SuggestedParagraphs = ( { paragraphs, references, onInsertBlock } ) => {
	const [ copiedIndex, setCopiedIndex ] = useState( null );
	const [ insertedIndices, setInsertedIndices ] = useState( new Set() );

	const hasParagraphs = paragraphs && paragraphs.length > 0;
	const hasReferences = references && references.length > 0;

	if ( ! hasParagraphs && ! hasReferences ) {
		return null;
	}

	const handleInsert = ( html, index ) => {
		if ( insertedIndices.has( index ) ) {
			return;
		}
		const safe = sanitizeHtml( html );
		insertParagraph( safe );
		setInsertedIndices( ( prev ) => new Set( prev ).add( index ) );
		if ( onInsertBlock ) {
			onInsertBlock( safe );
		}
	};

	const handleCopy = ( html, index ) => {
		const safe = sanitizeHtml( html );
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
			copyViaClipboardItem().then( markCopied ).catch( () => {
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
			{ hasParagraphs && paragraphs.map( ( paragraph, index ) => {
				const safeHtml = sanitizeHtml( paragraph.text );
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
								onClick={ () => handleInsert( paragraph.text, index ) }
								disabled={ insertedIndices.has( index ) }
								className="jeo-context-suggestion__insert"
							>
								{ insertedIndices.has( index ) ? __( 'Inserted', 'jeowp' ) : __( 'Insert into article', 'jeowp' ) }
							</Button>
							<Button
								variant="tertiary"
								size="small"
								onClick={ () => handleCopy( paragraph.text, index ) }
								className="jeo-context-suggestion__copy"
							>
								{ copiedIndex === index ? __( 'Copied!', 'jeowp' ) : __( 'Copy', 'jeowp' ) }
							</Button>
						</div>
					</div>
				);
			} ) }

			{ hasReferences && (
				<div className="jeo-context-references">
					<h4 className="jeo-context-references__title">
						{ __( 'References used', 'jeowp' ) }
					</h4>
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
				</div>
			) }
		</div>
	);
};

export default SuggestedParagraphs;
