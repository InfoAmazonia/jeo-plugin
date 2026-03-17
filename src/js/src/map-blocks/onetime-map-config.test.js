import { parse, registerBlockType, unregisterBlockType } from '@wordpress/blocks';

import {
	coerceOnetimeMapAttributes,
	onetimeMapAttributes,
} from './onetime-map-config';

describe( 'onetime map config', () => {
	const testBlockName = 'test/onetime-map-config';

	beforeAll( () => {
		registerBlockType( testBlockName, {
			apiVersion: 3,
			title: 'Test Onetime Map',
			category: 'widgets',
			attributes: onetimeMapAttributes,
			save: ( { attributes } ) => (
				<div
					className="wp-block-test-onetime-map-config jeomap"
					data-center_lat={ attributes.center_lat }
					data-center_lon={ attributes.center_lon }
					data-initial_zoom={ attributes.initial_zoom }
					data-min_zoom={ attributes.min_zoom }
					data-max_zoom={ attributes.max_zoom }
				/>
			),
		} );
	} );

	afterAll( () => {
		unregisterBlockType( testBlockName );
	} );

	it( 'rehydrates numeric map settings from saved html attributes', () => {
		const [ block ] = parse(
			'<!-- wp:test/onetime-map-config -->' +
				'<div class="wp-block-test-onetime-map-config jeomap" ' +
				'data-center_lat="-23.54998517" ' +
				'data-center_lon="-46.6559934" ' +
				'data-initial_zoom="11" ' +
				'data-min_zoom="0" ' +
				'data-max_zoom="20"></div>' +
				'<!-- /wp:test/onetime-map-config -->'
		);

		expect( block.attributes.center_lat ).toBe( '-23.54998517' );
		expect( block.attributes.center_lon ).toBe( '-46.6559934' );
		expect( block.attributes.initial_zoom ).toBe( '11' );
		expect( block.attributes.min_zoom ).toBe( '0' );
		expect( block.attributes.max_zoom ).toBe( '20' );

		expect(
			coerceOnetimeMapAttributes( block.attributes, {
				center_lat: 0,
				center_lon: 0,
				initial_zoom: 0,
				min_zoom: 0,
				max_zoom: 0,
			} )
		).toMatchObject( {
			center_lat: -23.54998517,
			center_lon: -46.6559934,
			initial_zoom: 11,
			min_zoom: 0,
			max_zoom: 20,
		} );
	} );
} );
