import { validateLayerFormData, validateMapFormData } from './form-validation';

describe( 'validateLayerFormData', () => {
	it( 'is incomplete without a layer type', () => {
		expect( validateLayerFormData( {} ).complete ).toBe( false );
		expect( validateLayerFormData( {} ).missing ).toContain( 'type' );
	} );

	it( 'is incomplete when a required option is empty (fallback schema)', () => {
		const result = validateLayerFormData( {
			type: 'tilelayer',
			layer_type_options: { url: '' },
		} );

		expect( result.complete ).toBe( false );
		expect( result.missing ).toEqual( [ 'url' ] );
	} );

	it( 'is complete when all required options are filled (fallback schema)', () => {
		const result = validateLayerFormData( {
			type: 'tilelayer',
			layer_type_options: {
				url: 'https://tiles.example.com/{z}/{x}/{y}.png',
			},
		} );

		expect( result.complete ).toBe( true );
		expect( result.missing ).toEqual( [] );
	} );

	it( 'treats unknown types as complete (server decides on publish)', () => {
		expect(
			validateLayerFormData( {
				type: 'unknown-type',
				layer_type_options: {},
			} ).complete
		).toBe( true );
	} );

	it( 'is deterministic: same input, same output', () => {
		const meta = {
			type: 'mapbox',
			layer_type_options: { style_id: '' },
		};

		expect( validateLayerFormData( meta ) ).toEqual(
			validateLayerFormData( meta )
		);
		expect( validateLayerFormData( meta ).complete ).toBe( false );
	} );
} );

describe( 'validateMapFormData', () => {
	it( 'accepts absent fields (map defaults apply)', () => {
		expect( validateMapFormData( {} ).complete ).toBe( true );
	} );

	it( 'accepts empty-string fields (map defaults apply, OBS-04)', () => {
		expect( validateMapFormData( { center_lat: '' } ).complete ).toBe(
			true
		);
		expect(
			validateMapFormData( {
				center_lat: '',
				center_lon: '',
				initial_zoom: '',
			} ).complete
		).toBe( true );
	} );

	it( 'rejects non-numeric or corrupted fields', () => {
		expect( validateMapFormData( { center_lon: 'abc' } ).complete ).toBe(
			false
		);
		expect( validateMapFormData( { initial_zoom: NaN } ).complete ).toBe(
			false
		);
	} );

	it( 'accepts valid numbers, including zero', () => {
		expect(
			validateMapFormData( {
				center_lat: 0,
				center_lon: -46.63,
				initial_zoom: 11,
			} ).complete
		).toBe( true );
	} );
} );
