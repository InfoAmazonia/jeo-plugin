import {
	htmlToPlainText,
	normalizeForMatch,
	isTextInContent,
} from './content-detection';
import { repairCorruptedText } from './text-repair';

describe( 'htmlToPlainText', () => {
	it( 'strips tags and keeps text', () => {
		expect(
			htmlToPlainText( 'The <strong>Amazon</strong> is <em>vast</em>.' )
		).toBe( 'The Amazon is vast.' );
	} );

	it( 'converts <br> and closing block tags to newlines (repaired text shape)', () => {
		// The repaired suggestion serializes \n\n as <br><br> in the article.
		expect( htmlToPlainText( 'support.<br><br>All three stay' ) ).toBe(
			'support.\n\nAll three stay'
		);
		expect( htmlToPlainText( '<p>One.</p><p>Two.</p>' ) ).toBe( 'One.\nTwo.\n' );
	} );

	it( 'returns empty string for empty/non-string input', () => {
		expect( htmlToPlainText( '' ) ).toBe( '' );
		expect( htmlToPlainText( null ) ).toBe( '' );
	} );
} );

describe( 'normalizeForMatch', () => {
	it( 'collapses whitespace runs', () => {
		expect( normalizeForMatch( 'a  b\n\tc   d' ) ).toBe( 'a b c d' );
	} );

	it( 'casefolds for case-insensitive matching', () => {
		expect( normalizeForMatch( 'The Amazon' ) ).toBe( 'the amazon' );
	} );
} );

describe( 'isTextInContent (K-6 durable "Inserted")', () => {
	const suggestion =
		'The <strong>Amazon</strong> faces <a href="https://example.com">new pressures</a> this year.';

	it( 'detects a paragraph inserted as a block (sanitized HTML in content)', () => {
		const content = `<!-- wp:paragraph -->
<p>Intro paragraph.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The <strong>Amazon</strong> faces <a href="https://example.com" target="_blank" rel="noreferrer noopener">new pressures</a> this year.</p>
<!-- /wp:paragraph -->`;
		expect( isTextInContent( suggestion, content ) ).toBe( true );
	} );

	it( 'returns false after the user removes the paragraph', () => {
		const content = `<!-- wp:paragraph -->
<p>Intro paragraph.</p>
<!-- /wp:paragraph -->`;
		expect( isTextInContent( suggestion, content ) ).toBe( false );
	} );

	it( 'ignores whitespace and case differences between suggestion and content', () => {
		const content = '<p>the   Amazon\nfaces new pressures   this year.</p>';
		expect( isTextInContent( suggestion, content ) ).toBe( true );
	} );

	it( 'returns false for empty suggestion or empty content', () => {
		expect( isTextInContent( '', '<p>text</p>' ) ).toBe( false );
		expect( isTextInContent( suggestion, '' ) ).toBe( false );
		expect( isTextInContent( suggestion, undefined ) ).toBe( false );
	} );

	describe( 'BUG-B2 — repaired needle matches the repaired text in the article', () => {
		const corrupted =
			'logistical support.nnAll three stay strictly within what the post itself states, without invented numbers';

		it( 'matches the article holding the repaired text (<br><br> serialized)', () => {
			const content = `<!-- wp:paragraph -->
<p>Intro about logistics.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>logistical support.<br><br>All three stay strictly within what the post itself states, without invented numbers</p>
<!-- /wp:paragraph -->`;
			expect(
				isTextInContent( repairCorruptedText( corrupted ), content )
			).toBe( true );
		} );

		it( 'the raw corrupted needle would NOT match (regression documentation)', () => {
			const content =
				'<p>logistical support.<br><br>All three stay strictly within what the post itself states, without invented numbers</p>';
			expect( isTextInContent( corrupted, content ) ).toBe( false );
		} );
	} );

	describe( 'BUG-B1 — tolerant anchor match after user edits', () => {
		const longSuggestion =
			'The Amazon region faces mounting pressure this year as municipalities report record deforestation alerts while federal enforcement budgets remain frozen.';
		const inserted =
			'<p>The Amazon region faces mounting pressure this year as municipalities report record deforestation alerts while federal enforcement budgets remain frozen.</p>';

		it( 'stays "Inserted" when the user edits a word in the MIDDLE', () => {
			const edited =
				'<p>The Amazon region faces mounting pressure this year as municipalities report record deforestation alerts while state enforcement budgets remain frozen.</p>';
			expect( isTextInContent( longSuggestion, edited ) ).toBe( true );
		} );

		it( 'reverts when the user edits the BEGINNING (conservative)', () => {
			const edited =
				'<p>Brazil\'s Amazon region faces mounting pressure this year as municipalities report record deforestation alerts while federal enforcement budgets remain frozen.</p>';
			expect( isTextInContent( longSuggestion, edited ) ).toBe( false );
		} );

		it( 'reverts when the user edits the END (conservative)', () => {
			const edited =
				'<p>The Amazon region faces mounting pressure this year as municipalities report record deforestation alerts while federal enforcement budgets were cut.</p>';
			expect( isTextInContent( longSuggestion, edited ) ).toBe( false );
		} );

		it( 'does not produce false positives from a shared prefix alone', () => {
			const other =
				'<p>The Amazon region faces mounting pressure this year from an entirely different angle, with new satellite imagery revealing expanding cattle ranching frontiers.</p>';
			expect( isTextInContent( longSuggestion, other ) ).toBe( false );
		} );

		it( 'requires exact match for short paragraphs (no weak anchors)', () => {
			const short = 'Deforestation hit a record high this year.';
			const editedShort =
				'<p>Deforestation hit a record level this year.</p>';
			expect( isTextInContent( short, editedShort ) ).toBe( false );
		} );

		it( 'still matches the unedited inserted paragraph', () => {
			expect( isTextInContent( longSuggestion, inserted ) ).toBe( true );
		} );
	} );
} );
