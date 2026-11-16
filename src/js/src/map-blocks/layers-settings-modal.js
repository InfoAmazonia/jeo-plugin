import { Button, Modal } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';

import LayersSettings from './layers-settings';

import './modals.css';

/**
 * Layers settings modal. W4 §2.2/§3.3: the action footer is fixed at the
 * bottom — layer counter on the left (plain text), "Done" on the right as
 * the modal's single primary action, always visible while the body scrolls.
 */
export default function LayersSettingsModal( {
	attributes,
	setAttributes,
	closeModal,
	loadedLayers,
	loadingLayers,
} ) {
	const layerCount = ( attributes.layers || [] ).length;

	return (
		<Modal
			className="jeo-layers-modal"
			overlayClassName="jeo-opaque-overlay"
			title={ __( 'Layers settings', 'jeowp' ) }
			onRequestClose={ closeModal }
		>
			<div className="jeo-layers-modal__body">
				<LayersSettings
					attributes={ attributes }
					setAttributes={ setAttributes }
					loadedLayers={ loadedLayers }
					loadingLayers={ loadingLayers }
					closeModal={ closeModal }
				/>
			</div>
			<div className="jeo-layers-modal__footer">
				<span className="jeo-layers-modal__count">
					{ sprintf(
						/* translators: %d: number of selected layers. */
						_n(
							'%d layer selected',
							'%d layers selected',
							layerCount,
							'jeowp'
						),
						layerCount
					) }
				</span>
				<Button
					className="done-button"
					variant="primary"
					isLarge
					onClick={ closeModal }
				>
					{ __( 'Done', 'jeowp' ) }
				</Button>
			</div>
		</Modal>
	);
}
