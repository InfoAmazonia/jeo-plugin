import { repairCorruptedText } from './text-repair';

describe( 'repairCorruptedText', () => {
	it( 'returns non-string and empty input untouched', () => {
		expect( repairCorruptedText( '' ) ).toBe( '' );
		expect( repairCorruptedText( null ) ).toBe( null );
		expect( repairCorruptedText( undefined ) ).toBe( undefined );
	} );

	it( 'repairs the exact artifact captured in the audit ("support.nnAll")', () => {
		// Real captured content (j2/11b): broken \n\n escape — backslashes
		// stripped, only the n's survived between "." and "All".
		expect(
			repairCorruptedText(
				'logistical support.nnAll three stay strictly within what the post itself states'
			)
		).toBe(
			'logistical support.\n\nAll three stay strictly within what the post itself states'
		);
	} );

	it( 'converts literal \\n escape sequences to real newlines', () => {
		expect( repairCorruptedText( 'First line.\\n\\nSecond line.' ) ).toBe(
			'First line.\n\nSecond line.'
		);
		expect( repairCorruptedText( 'a\\nb' ) ).toBe( 'a\nb' );
		expect( repairCorruptedText( 'a\\r\\nb' ) ).toBe( 'a\nb' );
	} );

	it( 'repairs single stripped n between punctuation and uppercase', () => {
		expect( repairCorruptedText( 'Done.nNext sentence.' ) ).toBe(
			'Done.\n\nNext sentence.'
		);
	} );

	it( 'does not touch legitimate words containing nn', () => {
		expect(
			repairCorruptedText(
				'The running back scored. Pennsylvania is large. Innovation matters.'
			)
		).toBe(
			'The running back scored. Pennsylvania is large. Innovation matters.'
		);
	} );

	it( 'does not touch normal sentence punctuation', () => {
		expect(
			repairCorruptedText( 'First sentence. Second one! Third? Yes.' )
		).toBe( 'First sentence. Second one! Third? Yes.' );
	} );

	it( 'does not alter legitimate text with newlines already present', () => {
		const clean =
			'Paragraph one.\n\nParagraph two with <strong>bold</strong>.';
		expect( repairCorruptedText( clean ) ).toBe( clean );
	} );

	it( 'handles accented uppercase after the artifact (PT-BR content)', () => {
		expect( repairCorruptedText( 'fim.nnÁrvores crescem.' ) ).toBe(
			'fim.\n\nÁrvores crescem.'
		);
	} );
} );
