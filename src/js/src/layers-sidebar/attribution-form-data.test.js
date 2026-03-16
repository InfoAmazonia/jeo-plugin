import { normalizeAttributionFormData } from './attribution-form-data';

describe( 'normalizeAttributionFormData', () => {
	it( 'adds https and preserves the broader form data contract', () => {
		expect(
			normalizeAttributionFormData( {
				type: 'tilelayer',
				attribution: 'example.com/credits',
				attribution_name: 'Example Source',
				source_url: 'downloads.example.com/data.csv',
			} )
		).toEqual( {
			type: 'tilelayer',
			attribution: 'https://example.com/credits',
			attribution_name: 'Example Source',
			source_url: 'https://downloads.example.com/data.csv',
		} );
	} );

	it( 'normalizes empty fields to empty strings', () => {
		expect(
			normalizeAttributionFormData( {
				attribution: undefined,
				attribution_name: undefined,
				source_url: undefined,
			} )
		).toEqual( {
			attribution: '',
			attribution_name: '',
			source_url: '',
		} );
	} );

	it( 'keeps fully qualified URLs untouched', () => {
		expect(
			normalizeAttributionFormData( {
				attribution: 'https://example.com/credits',
				attribution_name: '',
				source_url: 'http://example.com/data.csv',
			} )
		).toEqual( {
			attribution: 'https://example.com/credits',
			attribution_name: '',
			source_url: 'http://example.com/data.csv',
		} );
	} );
} );
