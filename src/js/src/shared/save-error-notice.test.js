import {
	buildEnrichedSaveNotice,
	escapeNoticeHtml,
	getSaveFailureHeadline,
} from './save-error-notice';

jest.mock( './save-error-notice.css', () => ( {} ) );
jest.mock( '../map-blocks/preview-error.css', () => ( {} ) );

describe( 'getSaveFailureHeadline', () => {
	it( 'mirrors the core logic for publish intent on drafts', () => {
		expect(
			getSaveFailureHeadline( {
				isPublished: false,
				targetStatus: 'publish',
			} )
		).toBe( 'Publishing failed.' );
		expect(
			getSaveFailureHeadline( {
				isPublished: false,
				targetStatus: 'future',
			} )
		).toBe( 'Scheduling failed.' );
	} );

	it( 'falls back to "Updating failed." for published posts and plain updates', () => {
		expect(
			getSaveFailureHeadline( {
				isPublished: true,
				targetStatus: 'publish',
			} )
		).toBe( 'Updating failed.' );
		expect(
			getSaveFailureHeadline( {
				isPublished: false,
				targetStatus: 'draft',
			} )
		).toBe( 'Updating failed.' );
	} );
} );

describe( 'escapeNoticeHtml', () => {
	it( 'escapes markup-significant characters', () => {
		expect( escapeNoticeHtml( '<b>&"x"</b>' ) ).toBe(
			'&lt;b&gt;&amp;&quot;x&quot;&lt;/b&gt;'
		);
	} );
} );

describe( 'buildEnrichedSaveNotice', () => {
	it( 'returns null without a Contract A payload (core notice untouched)', () => {
		expect( buildEnrichedSaveNotice( new Error( 'boom' ) ) ).toBeNull();
		expect(
			buildEnrichedSaveNotice( { message: 'plain', data: { status: 500 } } )
		).toBeNull();
	} );

	it( 'renders headline, cause, action and collapsed detail', () => {
		const error = {
			code: 'rest_invalid_param',
			message: 'The layers of this map could not be saved.',
			data: {
				status: 400,
				action: 'Fix the layer list and try again.',
				detail: 'layers[0].id: invalid <value>',
			},
		};
		const enriched = buildEnrichedSaveNotice( error, {
			isPublished: true,
			targetStatus: 'publish',
		} );

		expect( enriched ).not.toBeNull();
		expect( enriched.detail ).toBe( 'layers[0].id: invalid <value>' );
		expect( enriched.html ).toContain( 'Updating failed.' );
		expect( enriched.html ).toContain(
			'The layers of this map could not be saved.'
		);
		expect( enriched.html ).toContain(
			'Fix the layer list and try again.'
		);
		expect( enriched.html ).toContain( '<details' );
		expect( enriched.html ).toContain( 'Technical details' );
		// The detail must be escaped inside the HTML.
		expect( enriched.html ).toContain(
			'layers[0].id: invalid &lt;value&gt;'
		);
		expect( enriched.html ).not.toContain( '<value>' );
	} );

	it( 'uses the publish headline for drafts being published', () => {
		const error = {
			message: 'Rejected.',
			data: { status: 400, detail: 'raw detail' },
		};
		const enriched = buildEnrichedSaveNotice( error, {
			isPublished: false,
			targetStatus: 'publish',
		} );

		expect( enriched.html ).toContain( 'Publishing failed.' );
		expect( enriched.html ).toContain( 'Rejected.' );
	} );

	it( 'builds a fallback detail from the raw error when data.detail is absent', () => {
		const error = {
			message: 'Rejected.',
			data: { status: 400, action: 'Do this next.' },
		};
		const enriched = buildEnrichedSaveNotice( error );

		expect( enriched.html ).toContain( 'Do this next.' );
		expect( enriched.detail ).toContain( 'Rejected.' );
		expect( enriched.html ).toContain( '<details' );
	} );
} );
