import { compileEtaTemplate } from './template-compiler';

describe( 'compileEtaTemplate', () => {
	it( 'renders a simple template with Eta', () => {
		const template = compileEtaTemplate( 'Hello <%= it.name %>' );

		expect( template( { name: 'JEO' } ) ).toBe( 'Hello JEO' );
	} );

	it( 'supports the functionHeader contract used by the map templates', () => {
		const template = compileEtaTemplate( '<%= post.title %> - <%= read_more %>', {
			functionHeader: 'const { post, read_more } = it;',
		} );

		expect(
			template( {
				post: { title: 'Map title' },
				read_more: 'Read more',
			} )
		).toBe( 'Map title - Read more' );
	} );
} );
