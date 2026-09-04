import { decodeHtmlEntity, decodeHtmlEntities, sanitizeHtml } from './html';

describe( 'decodeHtmlEntity', () => {
	it( 'decodes numeric entities to their code points', () => {
		expect( decodeHtmlEntity( '&#169; 2026' ) ).toBe( '© 2026' );
	} );
} );

describe( 'decodeHtmlEntities', () => {
	it( 'decodes named and numeric entities', () => {
		expect( decodeHtmlEntities( '&copy; &amp; &#169;' ) ).toBe( '© & ©' );
	} );
} );

describe( 'sanitizeHtml', () => {
	it( 'keeps allowed link markup and forces safe target/rel', () => {
		expect(
			sanitizeHtml(
				'&copy; <a href="https://openfreemap.org/" onclick="alert(1)">OpenFreeMap</a>'
			)
		).toBe(
			'© <a href="https://openfreemap.org/" target="_blank" rel="noopener noreferrer">OpenFreeMap</a>'
		);
	} );

	it( 'keeps multiple links and inline emphasis (layer attribution shape)', () => {
		expect(
			sanitizeHtml(
				'&copy; <a href="https://openfreemap.org/">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
			)
		).toBe(
			'© <a href="https://openfreemap.org/" target="_blank" rel="noopener noreferrer">OpenFreeMap</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'
		);
	} );

	it( 'passes plain URLs through unchanged', () => {
		expect( sanitizeHtml( 'http://www.ibge.gov.br/' ) ).toBe(
			'http://www.ibge.gov.br/'
		);
	} );

	it( 'strips disallowed tags but keeps their text', () => {
		expect( sanitizeHtml( '<div>Source: <span>IBGE</span></div>' ) ).toBe(
			'Source: <span>IBGE</span>'
		);
	} );

	it( 'keeps anchors without an href as empty links', () => {
		expect( sanitizeHtml( '<a>OpenFreeMap</a>' ) ).toBe(
			'<a href="" target="_blank" rel="noopener noreferrer">OpenFreeMap</a>'
		);
	} );

	it( 'keeps br tags', () => {
		expect( sanitizeHtml( 'one<br>two' ) ).toBe( 'one<br>two' );
	} );
} );
