import { defaultHandleFetchRequest } from './jeo-autosuggest';

describe( 'jeo autosuggest default fetch request', () => {
	it( 'queries published posts by default', () => {
		expect( defaultHandleFetchRequest( { value: 'Rio Grande' } ) ).toEqual( {
			search: 'rio grande',
			status: 'publish',
		} );
	} );

	it( 'passes the requested status list through', () => {
		expect(
			defaultHandleFetchRequest( {
				value: 'Rio Grande',
				status: 'publish,private,future',
			} )
		).toEqual( {
			search: 'rio grande',
			status: 'publish,private,future',
		} );
	} );

	it( 'returns an empty query for blank input', () => {
		expect( defaultHandleFetchRequest( { value: '   ' } ) ).toEqual( {} );
		expect(
			defaultHandleFetchRequest( {
				value: '',
				status: 'publish,private,future',
			} )
		).toEqual( {} );
	} );
} );
