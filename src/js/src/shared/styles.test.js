import { resolveTileUrl } from './styles';

describe( 'resolveTileUrl', () => {
	it( 'tolerates non-string input (GAP-A: transient form sync frames)', () => {
		expect( resolveTileUrl( undefined ) ).toBe( '' );
		expect( resolveTileUrl( null ) ).toBe( '' );
	} );

	it( 'resolves the {r} token', () => {
		const url = resolveTileUrl( 'https://t.example.com/{z}/{x}/{y}{r}.png' );
		expect( url ).toMatch(
			/^https:\/\/t\.example\.com\/\{z\}\/\{x\}\/\{y\}(@2x)?\.png$/
		);
	} );
} );
