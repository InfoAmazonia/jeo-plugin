import { Button, ClipboardButton } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';

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
 * Sanitize HTML to only allow basic inline tags.
 *
 * Uses the browser's DOM parser for accuracy. Only <strong>, <b>, <em>,
 * <i>, <br>, and <a> (with href) are preserved. All other tags are
 * stripped but their text content is kept.
 *
 * @param {string} rawHtml Raw HTML string.
 * @return {string} Sanitized HTML string.
 */
const ALLOWED_TAGS = new Set( [ 'strong', 'b', 'em', 'i', 'br', 'a' ] );

const sanitizeHtml = ( rawHtml ) => {
	const div = document.createElement( 'div' );
	div.innerHTML = rawHtml;

	const walk = ( node ) => {
		if ( node.nodeType === Node.TEXT_NODE ) {
			return node.textContent;
		}

		if ( node.nodeType === Node.ELEMENT_NODE ) {
			const tag = node.tagName.toLowerCase();

			if ( ! ALLOWED_TAGS.has( tag ) ) {
				return Array.from( node.childNodes )
					.map( walk )
					.join( '' );
			}

			if ( tag === 'br' ) {
				return '<br>';
			}

			const inner = Array.from( node.childNodes )
				.map( walk )
				.join( '' );

			if ( tag === 'a' ) {
				const href = node.getAttribute( 'href' ) || '';
				const safeHref = href.replace( /"/g, '&quot;' );
				return `<a href="${ safeHref }" target="_blank" rel="noopener noreferrer">${ inner }</a>`;
			}

			return `<${ tag }>${ inner }</${ tag }>`;
		}

		return '';
	};

	return Array.from( div.childNodes )
		.map( walk )
		.join( '' );
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

	if ( ! paragraphs || paragraphs.length === 0 ) {
		return null;
	}

	const handleInsert = ( html ) => {
		const safe = sanitizeHtml( html );
		insertParagraph( safe );
		if ( onInsertBlock ) {
			onInsertBlock( safe );
		}
	};

	const handleCopy = ( html, index ) => {
		const safe = sanitizeHtml( html );
		const plain = document.createElement( 'div' );
		plain.innerHTML = safe;
		const plainText = plain.textContent || plain.innerText || '';

		if ( navigator.clipboard.write ) {
			const blobHtml = new Blob( [ safe ], { type: 'text/html' } );
			const blobText = new Blob( [ plainText ], { type: 'text/plain' } );
			const data = new ClipboardItem( {
				'text/html': blobHtml,
				'text/plain': blobText,
			} );
			navigator.clipboard.write( [ data ] ).then( () => {
				setCopiedIndex( index );
				setTimeout( () => setCopiedIndex( null ), 2000 );
			} ).catch( () => {
				navigator.clipboard.writeText( plainText ).then( () => {
					setCopiedIndex( index );
					setTimeout( () => setCopiedIndex( null ), 2000 );
				} );
			} );
		} else {
			navigator.clipboard.writeText( plainText ).then( () => {
				setCopiedIndex( index );
				setTimeout( () => setCopiedIndex( null ), 2000 );
			} );
		}
	};

	return (
		<div className="jeo-context-suggestions">
			<h4 className="jeo-context-suggestions__title">
				{ __( 'Suggested Paragraphs', 'jeo' ) }
			</h4>
			{ paragraphs.map( ( paragraph, index ) => {
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
								onClick={ () => handleInsert( paragraph.text ) }
								className="jeo-context-suggestion__insert"
							>
								{ __( 'Insert into article', 'jeo' ) }
							</Button>
							<ClipboardButton
								variant="tertiary"
								size="small"
								text={ safeHtml }
								onCopy={ () => handleCopy( paragraph.text, index ) }
								className="jeo-context-suggestion__copy"
							>
								{ copiedIndex === index ? __( 'Copied!', 'jeo' ) : __( 'Copy', 'jeo' ) }
							</ClipboardButton>
						</div>
					</div>
				);
			} ) }
		</div>
	);
};

export default SuggestedParagraphs;
