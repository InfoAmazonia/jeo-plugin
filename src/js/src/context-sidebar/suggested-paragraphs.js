import { Button, ExternalLink, ClipboardButton } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';

/**
 * Insert a paragraph block into the editor at the end of the document.
 *
 * @param {string} text Paragraph text (may contain HTML for links).
 */
const insertParagraph = ( text ) => {
	const block = createBlock( 'core/paragraph', { content: text } );
	wp.data.dispatch( 'core/block-editor' ).insertBlocks( block );
};

/**
 * Escape special regex characters in a string.
 *
 * @param {string} string String to escape.
 * @return {string}
 */
const escapeRegExp = ( string ) => {
	return string.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
};

/**
 * Build linkify terms from references, sorted by length (longest first).
 *
 * @param {Array} references Related article references.
 * @return {Array}
 */
const buildLinkifyTerms = ( references ) => {
	if ( ! references || references.length === 0 ) {
		return [];
	}
	return references
		.filter( ( ref ) => ref.title && ref.url )
		.map( ( ref ) => ( { term: ref.title, url: ref.url } ) )
		.sort( ( a, b ) => b.term.length - a.term.length );
};

/**
 * Render paragraph text with inline links for referenced articles (React version).
 *
 * @param {string} text        Paragraph text.
 * @param {Array}  terms       Linkify terms.
 * @return {JSX.Element}
 */
const LinkedParagraphText = ( { text, terms } ) => {
	if ( ! terms || terms.length === 0 ) {
		return <span>{ text }</span>;
	}

	const parts = [];
	let remaining = text;
	let keyIndex = 0;
	const usedTerms = new Set();

	while ( remaining.length > 0 ) {
		let bestMatch = null;
		let bestIndex = -1;

		for ( const { term, url } of terms ) {
			if ( usedTerms.has( term ) ) {
				continue;
			}
			const regex = new RegExp( escapeRegExp( term ), 'i' );
			const match = remaining.match( regex );
			if ( match && match.index !== undefined ) {
				if ( bestIndex === -1 || match.index < bestIndex ) {
					bestIndex = match.index;
					bestMatch = { text: match[ 0 ], url, length: match[ 0 ].length, term };
				}
			}
		}

		if ( bestMatch && bestIndex !== -1 ) {
			if ( bestIndex > 0 ) {
				parts.push( <span key={ keyIndex++ }>{ remaining.slice( 0, bestIndex ) }</span> );
			}
			parts.push(
				<ExternalLink
					key={ keyIndex++ }
					href={ bestMatch.url }
					className="jeo-context-suggestion__inline-link"
				>
					{ bestMatch.text }
				</ExternalLink>
			);
			remaining = remaining.slice( bestIndex + bestMatch.length );
			usedTerms.add( bestMatch.term );
		} else {
			parts.push( <span key={ keyIndex++ }>{ remaining }</span> );
			break;
		}
	}

	return <>{ parts }</>;
};

/**
 * Convert paragraph text to HTML with inline links for referenced articles.
 *
 * @param {string} text  Paragraph text.
 * @param {Array}  terms Linkify terms.
 * @return {string} HTML string.
 */
const linkifyTextToHtml = ( text, terms ) => {
	if ( ! terms || terms.length === 0 ) {
		return text;
	}

	let html = text;
	const usedTerms = new Set();

	for ( const { term, url } of terms ) {
		if ( usedTerms.has( term ) ) {
			continue;
		}
		const regex = new RegExp( escapeRegExp( term ), 'i' );
		const match = html.match( regex );
		if ( match ) {
			html = html.replace(
				regex,
				`<a href="${ url }" target="_blank" rel="noopener noreferrer">${ match[ 0 ] }</a>`
			);
			usedTerms.add( term );
		}
	}

	return html;
};

/**
 * SuggestedParagraphs component.
 *
 * @param {Object}   props                 Component props.
 * @param {Array}    props.paragraphs      Suggested paragraphs.
 * @param {Array}    props.references      Related article references.
 * @param {Function} props.onInsertBlock   Optional callback when inserting.
 * @return {JSX.Element|null}
 */
const SuggestedParagraphs = ( { paragraphs, references, onInsertBlock } ) => {
	const [ copiedIndex, setCopiedIndex ] = useState( null );
	const terms = buildLinkifyTerms( references );

	if ( ! paragraphs || paragraphs.length === 0 ) {
		return null;
	}

	const handleInsert = ( plainText ) => {
		const html = linkifyTextToHtml( plainText, terms );
		insertParagraph( html );
		if ( onInsertBlock ) {
			onInsertBlock( plainText );
		}
	};

	const handleCopy = ( plainText, index ) => {
		const html = linkifyTextToHtml( plainText, terms );
		// Try to copy as rich text (HTML) when possible, fallback to plain text.
		if ( navigator.clipboard.write ) {
			const blobHtml = new Blob( [ html ], { type: 'text/html' } );
			const blobText = new Blob( [ plainText ], { type: 'text/plain' } );
			const data = new ClipboardItem( {
				'text/html': blobHtml,
				'text/plain': blobText,
			} );
			navigator.clipboard.write( [ data ] ).then( () => {
				setCopiedIndex( index );
				setTimeout( () => setCopiedIndex( null ), 2000 );
			} ).catch( () => {
				// Fallback to plain text.
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
			{ paragraphs.map( ( paragraph, index ) => (
				<div key={ index } className="jeo-context-suggestion">
					<p className="jeo-context-suggestion__text">
						<LinkedParagraphText
							text={ paragraph.text }
							terms={ terms }
						/>
					</p>
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
							text={ paragraph.text }
							onCopy={ () => handleCopy( paragraph.text, index ) }
							className="jeo-context-suggestion__copy"
						>
							{ copiedIndex === index ? __( 'Copied!', 'jeo' ) : __( 'Copy', 'jeo' ) }
						</ClipboardButton>
					</div>
				</div>
			) ) }
		</div>
	);
};

export default SuggestedParagraphs;
