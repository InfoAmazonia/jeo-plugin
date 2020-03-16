import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import LayersSettings from './layers-settings';

export default function LayersModal( {
	attributes,
	setAttributes,
	closeModal,
	loadedLayers,
	loadingLayers,
} ) {
	return (
		<Modal
			className="jeo-layers-modal"
			title={ __( 'Map Editor' ) }
			onRequestClose={ closeModal }
		>
			<LayersSettings
				attributes={ attributes }
				setAttributes={ setAttributes }
				loadedLayers={ loadedLayers }
				loadingLayers={ loadingLayers }
			/>
		</Modal>
	);
}
