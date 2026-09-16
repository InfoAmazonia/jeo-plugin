import { handleChatKeyDown } from './chat-input-keys';

const keydownEvent = ( {
	key = 'Enter',
	shiftKey = false,
	ctrlKey = false,
	metaKey = false,
	altKey = false,
	isComposing = false,
} = {} ) => ( {
	key,
	shiftKey,
	ctrlKey,
	metaKey,
	altKey,
	preventDefault: jest.fn(),
	nativeEvent: { isComposing },
} );

describe( 'handleChatKeyDown', () => {
	it( 'submits on plain Enter', () => {
		const submit = jest.fn();
		const event = keydownEvent();

		handleChatKeyDown( event, submit );

		expect( submit ).toHaveBeenCalledTimes( 1 );
		expect( event.preventDefault ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'lets Shift+Enter insert a line break', () => {
		const submit = jest.fn();
		const event = keydownEvent( { shiftKey: true } );

		handleChatKeyDown( event, submit );

		expect( submit ).not.toHaveBeenCalled();
		expect( event.preventDefault ).not.toHaveBeenCalled();
	} );

	it( 'ignores Ctrl, Cmd, and Alt+Enter', () => {
		for ( const modifiers of [ { ctrlKey: true }, { metaKey: true }, { altKey: true } ] ) {
			const submit = jest.fn();
			const event = keydownEvent( modifiers );

			handleChatKeyDown( event, submit );

			expect( submit ).not.toHaveBeenCalled();
			expect( event.preventDefault ).not.toHaveBeenCalled();
		}
	} );

	it( 'ignores non-Enter keys', () => {
		const submit = jest.fn();
		const event = keydownEvent( { key: 'a' } );

		handleChatKeyDown( event, submit );

		expect( submit ).not.toHaveBeenCalled();
		expect( event.preventDefault ).not.toHaveBeenCalled();
	} );

	it( 'ignores Enter while IME is composing', () => {
		const submit = jest.fn();
		const event = keydownEvent( { isComposing: true } );

		handleChatKeyDown( event, submit );

		expect( submit ).not.toHaveBeenCalled();
		expect( event.preventDefault ).not.toHaveBeenCalled();
	} );

	it( 'tolerates events without a nativeEvent', () => {
		const submit = jest.fn();
		const event = {
			key: 'Enter',
			shiftKey: false,
			ctrlKey: false,
			metaKey: false,
			altKey: false,
			preventDefault: jest.fn(),
		};

		handleChatKeyDown( event, submit );

		expect( submit ).toHaveBeenCalledTimes( 1 );
		expect( event.preventDefault ).toHaveBeenCalledTimes( 1 );
	} );
} );
