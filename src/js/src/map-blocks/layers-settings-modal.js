import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import LayersSettings from './layers-settings';

import './modals.css';

export default function LayersSettingsModal( {
	attributes,
	setAttributes,
	closeModal,
	loadedLayers,
	loadingLayers,
} ) {
	return (
		<Modal
			className="jeo-layers-modal"
			overlayClassName="jeo-opaque-overlay"
			title={ __( 'Layers settings', 'jeowp' ) }
			onRequestClose={ closeModal }
		>
			<LayersSettings
				attributes={ attributes }
				setAttributes={ setAttributes }
				loadedLayers={ loadedLayers }
				loadingLayers={ loadingLayers }
				closeModal={ closeModal }
			/>
		</Modal>
	);
}
