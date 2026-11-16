/**
 * Unit tests for normalizeSuggestionParagraphs (BUG-R9-1).
 *
 * The provider intermittently returns plain strings instead of the
 * documented { text, relevance_score } objects on the first generation —
 * the boundary must normalize both shapes and discard unusable items.
 */
import { describe, expect, it, vi } from 'vitest';
import { normalizeSuggestionParagraphs } from './suggested-paragraphs';

describe( 'normalizeSuggestionParagraphs', () => {
	it( 'wraps plain strings as { text }', () => {
		expect(
			normalizeSuggestionParagraphs( [
				'The states hit hardest by the fires are…',
			] )
		).toEqual( [ { text: 'The states hit hardest by the fires are…' } ] );
	} );

	it( 'passes valid objects through untouched', () => {
		const input = [
			{ text: 'First paragraph.', relevance_score: 90 },
		];
		expect( normalizeSuggestionParagraphs( input ) ).toEqual( input );
	} );

	it( 'accepts mixed shapes in one payload', () => {
		expect(
			normalizeSuggestionParagraphs( [
				'Plain string',
				{ text: 'Object form', relevance_score: 50 },
			] )
		).toEqual( [
			{ text: 'Plain string' },
			{ text: 'Object form', relevance_score: 50 },
		] );
	} );

	it( 'discards null/undefined/empty items with a console warning', () => {
		const warn = vi.spyOn( console, 'warn' ).mockImplementation( () => {} );
		expect(
			normalizeSuggestionParagraphs( [
				null,
				undefined,
				'',
				'   ',
				{ text: '' },
				{ noTextHere: true },
				'Valid one',
			] )
		).toEqual( [ { text: 'Valid one' } ] );
		expect( warn ).toHaveBeenCalled();
		warn.mockRestore();
	} );

	it( 'returns an empty array for non-array payloads', () => {
		expect( normalizeSuggestionParagraphs( null ) ).toEqual( [] );
		expect( normalizeSuggestionParagraphs( undefined ) ).toEqual( [] );
		expect( normalizeSuggestionParagraphs( 'not an array' ) ).toEqual( [] );
	} );
} );
