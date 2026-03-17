import {
	coerceEnumOptionValue,
	mergeSchemaFormData,
	promoteSchemaEnumNamesToUiSchema,
} from './schema-form';

describe( 'mergeSchemaFormData', () => {
	it( 'preserves unrelated meta while merging nested schema updates', () => {
		expect(
			mergeSchemaFormData(
				{
					type: 'mvt',
					layer_type_options: {
						url: 'https://example.com/{z}/{x}/{y}.pbf',
						source_layer: 'districts',
					},
					attribution: 'https://example.com',
				},
				{
					type: 'mvt',
					layer_type_options: {
						source_layer: 'states',
					},
				}
			)
		).toEqual( {
			type: 'mvt',
			layer_type_options: {
				url: 'https://example.com/{z}/{x}/{y}.pbf',
				source_layer: 'states',
			},
			attribution: 'https://example.com',
		} );
	} );
} );

describe( 'promoteSchemaEnumNamesToUiSchema', () => {
	it( 'moves schema enumNames into the ui schema for rjsf', () => {
		expect(
			promoteSchemaEnumNamesToUiSchema( {
				type: 'object',
				properties: {
					type: {
						type: 'string',
						enum: [ 'mapbox', 'mvt' ],
						enumNames: [ 'Mapbox', 'Vector tiles' ],
					},
					layer_type_options: {
						type: 'object',
						properties: {
							scheme: {
								type: 'string',
								enum: [ 'xyz', 'tms' ],
								enumNames: [ 'XYZ', 'TMS' ],
							},
						},
					},
				},
			} )
		).toEqual( {
			type: {
				'ui:enumNames': [ 'Mapbox', 'Vector tiles' ],
			},
			layer_type_options: {
				scheme: {
					'ui:enumNames': [ 'XYZ', 'TMS' ],
				},
			},
		} );
	} );
} );

describe( 'coerceEnumOptionValue', () => {
	it( 'returns the original enum value type for a select change', () => {
		expect(
			coerceEnumOptionValue( 'false', [
				{ label: 'Enabled', value: true },
				{ label: 'Disabled', value: false },
			] )
		).toBe( false );
	} );
} );
