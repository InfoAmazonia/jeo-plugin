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
	const [ suggestionHistory, setSuggestionHistory ] = useState( [] );
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
				setSuggestionHistory( response.history || [] );
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
				archiveVersion(
					__( 'Initial suggestions', 'jeowp' ),
					response.paragraphs,
					response.references
				);
				if ( response.assistant_message ) {
					setMessages( [
						{ role: 'assistant', content: response.assistant_message },
					] );
				}
				setHasStarted( true );
			} else {
				setError( response.message || __( 'Failed to generate suggestions.', 'jeowp' ) );
			}
		} catch ( err ) {
			setError( err.message || __( 'Error contacting AI.', 'jeowp' ) );
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
					current_state: {
						paragraphs: suggestedParagraphs,
						references,
					},
				},
			} );

			if ( response.success ) {
				setSuggestedParagraphs( response.paragraphs || [] );
				setReferences( response.references || [] );
				archiveVersion( userMessage, response.paragraphs, response.references );
				setMessages( ( prev ) => [
					...prev,
					{ role: 'assistant', content: response.assistant_message || response.message || '' },
				] );
				setHasStarted( true );
			} else {
				setError( response.message || __( 'Failed to process message.', 'jeowp' ) );
			}
		} catch ( err ) {
			setError( err.message || __( 'Error contacting AI.', 'jeowp' ) );
		} finally {
			setIsLoading( false );
		}
	};

	/**
	 * Archive a generated suggestion version locally so the editor can revisit it
	 * after further refinement. Only versions with paragraphs are kept. The backend
	 * keeps the authoritative copy; this mirrors it for the live session.
	 *
	 * @param {string} label      Short label (initial / user message).
	 * @param {Array}  paragraphs Suggested paragraphs.
	 * @param {Array}  refs       References.
	 */
	const archiveVersion = ( label, paragraphs, refs ) => {
		if ( ! paragraphs || paragraphs.length === 0 ) {
			return;
		}
		setSuggestionHistory( ( prev ) => [
			...prev,
			{
				label,
				paragraphs,
				references: refs || [],
				timestamp: new Date().toLocaleString(),
			},
		] );
	};

	/**
	 * Restore a previous suggestion version into the current view.
	 *
	 * @param {Object} version Archived version entry.
	 */
	const restoreVersion = ( version ) => {
		setSuggestedParagraphs( version.paragraphs || [] );
		setReferences( version.references || [] );
	};

	/**
	 * Retry: ask the AI to generate new suggestions without explicit user input.
	 */
	const handleRetry = () => {
		sendMessage( __( 'Generate new editorial suggestions based on the current post content.', 'jeowp' ) );
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
			setSuggestionHistory( [] );
			setHasStarted( false );
		} catch ( err ) {
			setError( err.message || __( 'Failed to clear conversation.', 'jeowp' ) );
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
					<span>{ __( 'Restoring conversation...', 'jeowp' ) }</span>
				</div>
			) }

			{ ! isRestoring && ! hasStarted && messages.length === 0 && ! isLoading && (
				<div className="jeo-context-chat__intro">
					<p className="jeo-context-chat__placeholder">
						{ __( 'Use the AI Context Assistant to generate editorial suggestions based on your article and the site\'s knowledge base.', 'jeowp' ) }
					</p>
					<Button
						variant="primary"
						onClick={ runSetup }
						disabled={ isLoading }
						isBusy={ isLoading }
						className="jeo-context-chat__start"
					>
						{ __( 'Generate Suggestions', 'jeowp' ) }
					</Button>
				</div>
			) }

			{ ! isRestoring && (
				<SuggestedParagraphs
					paragraphs={ suggestedParagraphs }
					references={ references }
				/>
			) }

			{ ! isRestoring && isModal && suggestionHistory.length > 1 && (
				<details className="jeo-context-history">
					<summary className="jeo-context-history__summary">
						{ __( 'Previous suggestions', 'jeowp' ) } ({ suggestionHistory.length })
					</summary>
					<ul className="jeo-context-history__list">
						{ suggestionHistory
							.map( ( version, index ) => ( { version, index } ) )
							.reverse()
							.map( ( { version, index } ) => {
								const firstText =
									version.paragraphs?.[ 0 ]?.text?.replace( /<[^>]+>/g, '' ) || '';
								const preview =
									firstText.length > 120
										? firstText.slice( 0, 120 ) + '…'
										: firstText;
								return (
									<li key={ index } className="jeo-context-history__item">
										<div className="jeo-context-history__meta">
											<span className="jeo-context-history__label">
												{ version.label }
											</span>
											{ version.timestamp && (
												<span className="jeo-context-history__timestamp">
													{ version.timestamp }
												</span>
											) }
										</div>
										{ preview && (
											<p className="jeo-context-history__preview">{ preview }</p>
										) }
										<Button
											variant="secondary"
											size="small"
											onClick={ () => restoreVersion( version ) }
											className="jeo-context-history__restore"
										>
											{ __( 'View this version', 'jeowp' ) }
										</Button>
									</li>
								);
							} ) }
					</ul>
				</details>
			) }

			<div className="jeo-context-chat__messages">
				{ ! isRestoring && messages.map( ( msg, index ) => (
					<div
						key={ index }
						className={ `jeo-context-chat__message jeo-context-chat__message--${ msg.role }` }
					>
						<div className="jeo-context-chat__message-content">
							{ msg.content }
						</div>
						<div className="jeo-context-chat__message-meta">
							{ msg.timestamp && (
								<span className="jeo-context-chat__timestamp">
									{ msg.timestamp }
								</span>
							) }
							{ 'user' === msg.role && msg.username && (
								<span className="jeo-context-chat__user-badge">
									{ msg.username }
								</span>
							) }
						</div>
					</div>
				) ) }

				{ ! isRestoring && isLoading && (
					<div className="jeo-context-chat__loading">
						<Spinner />
						<span>{ __( 'Thinking...', 'jeowp' ) }</span>
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
					placeholder={ __( 'Ask for changes or new paragraphs... (Ctrl+Enter to send)', 'jeowp' ) }
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
						{ __( 'Send', 'jeowp' ) }
					</Button>
					<div className="jeo-context-chat__secondary-actions">
						<Button
							variant="secondary"
							size="small"
							onClick={ handleRetry }
							disabled={ isLoading || isRestoring || ! hasStarted }
							className="jeo-context-chat__retry"
						>
							{ __( 'Retry', 'jeowp' ) }
						</Button>
						<Button
							variant="tertiary"
							size="small"
							onClick={ handleClear }
							disabled={ isLoading || isRestoring }
							className="jeo-context-chat__clear"
						>
							{ __( 'Clear', 'jeowp' ) }
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
					{ __( 'AI Context', 'jeowp' ) }
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
					label={ __( 'Expand', 'jeowp' ) }
					className="jeo-context-panel__expand"
				/>
			</div>

			{ renderChat( false ) }

			{ isExpanded && (
				<Modal
					title={ __( 'AI Context Assistant', 'jeowp' ) }
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
