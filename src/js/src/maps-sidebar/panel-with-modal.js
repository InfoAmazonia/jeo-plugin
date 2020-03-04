import { Button, Modal } from '@wordpress/components';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { useCallback } from '@wordpress/element';

import './panel-with-modal.css';

export default function SettingPanelWithModal( {
	buttonLabel,
	checked,
	children,
	onChange,
	title,
	value,
} ) {
	const openModal = useCallback( () => {
		onChange( value );
	}, [ value, onChange ] );

	const closeModal = useCallback( () => {
		onChange( false );
	}, [ onChange ] );

	return (
		<PluginDocumentSettingPanel title={ title }>
			<Button isPrimary isLarge onClick={ openModal }>
				{ buttonLabel }
			</Button>

			{ checked && (
				<Modal
					className="jeo-map-editor-modal"
					title={ title }
					onRequestClose={ closeModal }
				>
					<div className="jeo-map-editor-modal__content">
						{ children }
					</div>
				</Modal>
			) }
		</PluginDocumentSettingPanel>
	);
}
