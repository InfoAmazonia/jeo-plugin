export function decodeHtmlEntity ( str ) {
	return str.replaceAll( /&#(\d+);/g, ( match, dec ) => {
		return String.fromCodePoint( dec );
	} );
}

export function decodeHtmlEntities ( input ) {
	const textarea = document.createElement( 'textarea' );
	textarea.innerHTML = input;
	return textarea.value;
}

const SANITIZE_ALLOWED_TAGS = new Set( [ 'strong', 'b', 'em', 'i', 'br', 'a', 'span' ] );

export function sanitizeHtml ( rawHtml ) {
	const decoded = decodeHtmlEntities( rawHtml );
	const div = document.createElement( 'div' );
	div.innerHTML = decoded;

	const walk = ( node ) => {
		if ( node.nodeType === Node.TEXT_NODE ) {
			return node.textContent;
		}

		if ( node.nodeType === Node.ELEMENT_NODE ) {
			const tag = node.tagName.toLowerCase();

			if ( ! SANITIZE_ALLOWED_TAGS.has( tag ) ) {
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

			if ( tag === 'span' ) {
				const attrs = Array.from( node.attributes )
					.filter( ( attr ) => ! attr.name.toLowerCase().startsWith( 'on' ) )
					.map( ( attr ) => `${ attr.name }="${ attr.value.replace( /"/g, '&quot;' ) }"` )
					.join( ' ' );
				return attrs ? `<span ${ attrs }>${ inner }</span>` : `<span>${ inner }</span>`;
			}

			return `<${ tag }>${ inner }</${ tag }>`;
		}

		return '';
	};

	return Array.from( div.childNodes )
		.map( walk )
		.join( '' );
}
