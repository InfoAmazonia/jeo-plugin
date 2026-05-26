import { useState, useRef, useEffect } from '@wordpress/element';
import { Button, TextareaControl, Modal, Spinner, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import SuggestedParagraphs from './suggested-paragraphs';

/**
 * Generate a simple UUID v4.
 *
 * @return {string}
 */
const generateUUID = () => {
	if ( typeof crypto !== 'undefined' && crypto.randomUUID ) {
		return crypto.randomUUID();
	}
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, ( c ) => {
		const r = ( Math.random() * 16 ) | 0;
		const v = c === 'x' ? r : ( r & 0x3 ) | 0x8;
		return v.toString( 16 );
	} );
};

/**
 * ContextChatPanel component — compact sidebar panel and expanded modal.
 *
 * @param {Object} props         Component props.
 * @param {number} props.postId  Current post ID.
 * @return {JSX.Element}
 */
const ContextChatPanel = ( { postId } ) => {
	const [ conversationId, setConversationId ] = useState( '' );
	const [ messages, setMessages ] = useState( [] );
	const [ inputValue, setInputValue ] = useState( '' );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ isRestoring, setIsRestoring ] = useState( true );
	const [ error, setError ] = useState( null );
	const [ suggestedParagraphs, setSuggestedParagraphs ] = useState( [] );
	const [ references, setReferences ] = useState( [] );
	const [ isExpanded, setIsExpanded ] = useState( false );
	const [ hasStarted, setHasStarted ] = useState( false );
	const messagesEndRef = useRef( null );

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView( { behavior: 'smooth' } );
	};

	useEffect( () => {
		scrollToBottom();
	}, [ messages, isLoading ] );

	/**
	 * Load existing conversation state from the backend.
	 */
	const loadState = async () => {
		if ( ! postId ) {
			setIsRestoring( false );
			return;
		}
		setIsRestoring( true );

		try {
			const response = await apiFetch( {
				path: `jeo/v1/context/state?post_id=${ postId }`,
				method: 'GET',
			} );

			if ( response.success && response.has_started ) {
				setConversationId( response.conversation_id || '' );
				setMessages( response.messages || [] );
				setSuggestedParagraphs( response.paragraphs || [] );
				setReferences( response.references || [] );
				setHasStarted( true );
			} else {
				setConversationId( generateUUID() );
				setHasStarted( false );
			}
		} catch ( err ) {
			setConversationId( generateUUID() );
			setHasStarted( false );
		} finally {
			setIsRestoring( false );
		}
	};

	useEffect( () => {
		loadState();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ postId ] );

	/**
	 * Call the setup endpoint to generate initial suggestions.
	 */
	const runSetup = async () => {
		if ( ! postId || isLoading ) {
			return;
		}
		setIsLoading( true );
		setError( null );

		const newConversationId = conversationId || generateUUID();
		if ( ! conversationId ) {
			setConversationId( newConversationId );
		}

		try {
			const response = await apiFetch( {
				path: 'jeo/v1/context/setup',
				method: 'POST',
				data: {
					post_id: postId,
					conversation_id: newConversationId,
				},
			} );

			if ( response.success ) {
				setSuggestedParagraphs( response.paragraphs || [] );
				setReferences( response.references || [] );
				if ( response.assistant_message ) {
					setMessages( [
						{ role: 'assistant', content: response.assistant_message },
					] );
				}
				setHasStarted( true );
			} else {
				setError( response.message || __( 'Failed to generate suggestions.', 'jeo' ) );
			}
		} catch ( err ) {
			setError( err.message || __( 'Error contacting AI.', 'jeo' ) );
		} finally {
			setIsLoading( false );
		}
	};

	/**
	 * Send a chat message to refine suggestions.
	 *
	 * @param {string|null} explicitMessage Optional explicit message to send (used by retry).
	 */
	const sendMessage = async ( explicitMessage = null ) => {
		const userMessage = explicitMessage || inputValue.trim();
		if ( ! userMessage || isLoading ) {
			return;
		}

		if ( ! explicitMessage ) {
			setInputValue( '' );
		}
		setMessages( ( prev ) => [ ...prev, { role: 'user', content: userMessage } ] );
		setIsLoading( true );
		setError( null );

		try {
			const response = await apiFetch( {
				path: 'jeo/v1/context/chat',
				method: 'POST',
				data: {
					post_id: postId,
					conversation_id: conversationId,
					message: userMessage,
				},
			} );

			if ( response.success ) {
				setSuggestedParagraphs( response.paragraphs || [] );
				setReferences( response.references || [] );
				setMessages( ( prev ) => [
					...prev,
					{ role: 'assistant', content: response.assistant_message || response.message || '' },
				] );
				setHasStarted( true );
			} else {
				setError( response.message || __( 'Failed to process message.', 'jeo' ) );
			}
		} catch ( err ) {
			setError( err.message || __( 'Error contacting AI.', 'jeo' ) );
		} finally {
			setIsLoading( false );
		}
	};

	/**
	 * Retry: ask the AI to generate new suggestions without explicit user input.
	 */
	const handleRetry = () => {
		sendMessage( __( 'Generate new editorial suggestions based on the current post content.', 'jeo' ) );
	};

	/**
	 * Clear: reset the conversation and all suggestions.
	 */
	const handleClear = async () => {
		if ( ! postId || isLoading ) {
			return;
		}
		setIsLoading( true );
		setError( null );

		try {
			await apiFetch( {
				path: 'jeo/v1/context/clear',
				method: 'POST',
				data: { post_id: postId },
			} );

			setConversationId( generateUUID() );
			setMessages( [] );
			setSuggestedParagraphs( [] );
			setReferences( [] );
			setHasStarted( false );
		} catch ( err ) {
			setError( err.message || __( 'Failed to clear conversation.', 'jeo' ) );
		} finally {
			setIsLoading( false );
		}
	};

	const handleKeyDown = ( event ) => {
		if ( event.key === 'Enter' && ( event.ctrlKey || event.metaKey ) ) {
			event.preventDefault();
			sendMessage();
		}
	};

	/**
	 * Render the chat interface (shared between compact and expanded views).
	 *
	 * @param {boolean} isModal Whether rendering inside the expanded modal.
	 * @return {JSX.Element}
	 */
	const renderChat = ( isModal = false ) => (
		<div className={ `jeo-context-chat ${ isModal ? 'jeo-context-chat--modal' : 'jeo-context-chat--compact' }` }>
			{ isRestoring && (
				<div className="jeo-context-chat__loading">
					<Spinner />
					<span>{ __( 'Restoring conversation...', 'jeo' ) }</span>
				</div>
			) }

			{ ! isRestoring && ! hasStarted && messages.length === 0 && ! isLoading && (
				<div className="jeo-context-chat__intro">
					<p className="jeo-context-chat__placeholder">
						{ __( 'Use the AI Context Assistant to generate editorial suggestions based on your article and the site\'s knowledge base.', 'jeo' ) }
					</p>
					<Button
						variant="primary"
						onClick={ runSetup }
						disabled={ isLoading }
						isBusy={ isLoading }
						className="jeo-context-chat__start"
					>
						{ __( 'Generate Suggestions', 'jeo' ) }
					</Button>
				</div>
			) }

			{ ! isRestoring && (
				<SuggestedParagraphs
					paragraphs={ suggestedParagraphs }
					references={ references }
				/>
			) }

			<div className="jeo-context-chat__messages">
				{ ! isRestoring && messages.map( ( msg, index ) => (
					<div
						key={ index }
						className={ `jeo-context-chat__message jeo-context-chat__message--${ msg.role }` }
					>
						{ 'user' === msg.role && msg.username && (
							<span className="jeo-context-chat__user-badge">
								{ msg.username }
							</span>
						) }
						{ msg.content }
					</div>
				) ) }

				{ ! isRestoring && isLoading && (
					<div className="jeo-context-chat__loading">
						<Spinner />
						<span>{ __( 'Thinking...', 'jeo' ) }</span>
					</div>
				) }

				<div ref={ messagesEndRef } />
			</div>

			{ error && (
				<Notice
					status="error"
					isDismissible
					onRemove={ () => setError( null ) }
					className="jeo-context-chat__error"
				>
					{ error }
				</Notice>
			) }

			<div className="jeo-context-chat__input-area">
				<TextareaControl
					value={ inputValue }
					onChange={ setInputValue }
					onKeyDown={ handleKeyDown }
					placeholder={ __( 'Ask for changes or new paragraphs... (Ctrl+Enter to send)', 'jeo' ) }
					className="jeo-context-chat__textarea"
					disabled={ isLoading || isRestoring }
					rows={ isModal ? 4 : 3 }
				/>
				<div className="jeo-context-chat__actions">
					<Button
						variant="primary"
						onClick={ () => sendMessage() }
						disabled={ isLoading || isRestoring || ! inputValue.trim() }
						className="jeo-context-chat__send"
					>
						{ __( 'Send', 'jeo' ) }
					</Button>
					<div className="jeo-context-chat__secondary-actions">
						<Button
							variant="secondary"
							size="small"
							onClick={ handleRetry }
							disabled={ isLoading || isRestoring || ! hasStarted }
							className="jeo-context-chat__retry"
						>
							{ __( 'Retry', 'jeo' ) }
						</Button>
						<Button
							variant="tertiary"
							size="small"
							onClick={ handleClear }
							disabled={ isLoading || isRestoring }
							className="jeo-context-chat__clear"
						>
							{ __( 'Clear', 'jeo' ) }
						</Button>
					</div>
				</div>
			</div>
		</div>
	);

	return (
		<div className="jeo-context-panel">
			<div className="jeo-context-panel__header">
				<h3 className="jeo-context-panel__title">
					{ __( 'AI Context', 'jeo' ) }
				</h3>
				<Button
					variant="tertiary"
					size="small"
					onClick={ () => setIsExpanded( true ) }
					icon={
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M4 8V4M4 4H8M4 4L9 9M20 8V4M20 4H16M20 4L15 9M4 16V20M4 20H8M4 20L9 15M20 16V20M20 20H16M20 20L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
						</svg>
					}
					label={ __( 'Expand', 'jeo' ) }
					className="jeo-context-panel__expand"
				/>
			</div>

			{ renderChat( false ) }

			{ isExpanded && (
				<Modal
					title={ __( 'AI Context Assistant', 'jeo' ) }
					onRequestClose={ () => setIsExpanded( false ) }
					className="jeo-context-modal"
					isFullScreen={ false }
				>
					{ renderChat( true ) }
				</Modal>
			) }
		</div>
	);
};

export default ContextChatPanel;
