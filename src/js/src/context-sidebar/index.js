import { registerPlugin } from '@wordpress/plugins';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';
import ContextChatPanel from './context-chat-panel';
import ContextGate from './context-gate';
import { getAiGateFlags } from '../shared/ai-gate';
import './context-sidebar.css';

registerPlugin( 'jeo-context-sidebar', {
	icon: null,
	render: () => {
		const postData = useSelect( ( select ) => {
			const editor = select( 'core/editor' );
			return {
				postId: editor.getCurrentPostId(),
				title: editor.getEditedPostAttribute( 'title' ),
				content: editor.getEditedPostAttribute( 'content' ),
				postType: editor.getCurrentPostType(),
			};
		}, [] );

		if ( ! postData.postType ) {
			return null;
		}

		// 2.1-contexto: when no AI provider is configured the panel renders the
		// gate pattern (Knowledge Base tone) instead of the chat UI. The gate
		// never blocks saving the post. Contract D: flags read defensively.
		const { aiConfigured, canConfigureAi } = getAiGateFlags();

		return (
			<PluginDocumentSettingPanel
				title={ wp.i18n.__( 'AI Context', 'jeowp' ) }
				className="jeo-context-sidebar-panel"
			>
				{ aiConfigured ? (
					<ContextChatPanel
						postId={ postData.postId }
						title={ postData.title }
						content={ postData.content }
					/>
				) : (
					<ContextGate canConfigureAi={ canConfigureAi } />
				) }
			</PluginDocumentSettingPanel>
		);
	},
} );
