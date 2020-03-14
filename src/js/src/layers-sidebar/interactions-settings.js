import { Modal } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import InteractionSettings from './interaction-settings';
import './interactions-settings.css';

export default function InteractionsSettings( {
	onCloseModal,
	layers,
} ) {
	const interactiveLayers = useMemo( () => {
		if ( ! layers ) {
			return [];
		}
		return layers.filter( ( layer ) => {
			return layer.fields && Object.keys( layer.fields ).length > 0;
		} );
	}, [ layers ] );

	return (
		<Modal className="jeo-interactions-settings__modal" title={ __( 'Interactions', 'jeo' ) } onRequestClose={ onCloseModal }>
			<table className="jeo-interactions-settings">
				{ ( interactiveLayers.length > 0 ) && (
					<tr>
						<th>{ __( 'Layer', 'jeo' ) }</th>
						<th>{ __( 'Popup', 'jeo' ) }</th>
						<th>{ __( 'Title' ) }</th>
						<th colSpan={ 2 }>{ __( 'Fields', 'jeo' ) }</th>
					</tr>
				) }
				{ interactiveLayers.map( ( layer ) => (
					<InteractionSettings
						key={ layer.id }
						layer={ layer }
					/>
				) ) }
			</table>
		</Modal>
	);
}
