/**
 * Shared Enter-to-submit behavior for chat textareas.
 *
 * Plain Enter submits the message; Shift+Enter inserts a line break
 * (left to the browser default); Enter combined with Ctrl, Cmd, or Alt
 * is ignored; Enter during IME composition is left to the input method
 * editor.
 *
 * @param {KeyboardEvent} event  Keydown event from the textarea.
 * @param {Function}      submit Callback invoked on plain Enter.
 */
export function handleChatKeyDown( event, submit ) {
	if ( event.key !== 'Enter' ) {
		return;
	}

	if ( event.nativeEvent?.isComposing ) {
		return;
	}

	if ( event.shiftKey || event.ctrlKey || event.metaKey || event.altKey ) {
		return;
	}

	event.preventDefault();
	submit();
}
