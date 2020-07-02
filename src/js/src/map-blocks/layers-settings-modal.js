import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import LayersSettings from './layers-settings';

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
			title={ __( 'Layers settings', 'jeo' ) }
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
