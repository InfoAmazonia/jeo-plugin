import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import InteractionSettings from './interaction-settings';
import './interactions-settings.css';

export default function InteractionsSettings( {
	onCloseModal,
	layers,
} ) {
	return (
		<Modal title={ __( 'Interactions', 'jeo' ) } onRequestClose={ onCloseModal }>
			{ layers.map( ( layer ) => (
				<InteractionSettings
					key={ layer.id }
					layer={ layer }
				/>
			) ) }
		</Modal>
	);
}
