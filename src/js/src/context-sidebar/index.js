import { registerPlugin } from '@wordpress/plugins';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';
import ContextChatPanel from './context-chat-panel';
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

		return (
			<PluginDocumentSettingPanel
				title={ wp.i18n.__( 'AI Context', 'jeowp' ) }
				className="jeo-context-sidebar-panel"
			>
				<ContextChatPanel
					postId={ postData.postId }
					title={ postData.title }
					content={ postData.content }
				/>
			</PluginDocumentSettingPanel>
		);
	},
} );
