import { Modal, Panel } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import InteractionSettings from './interaction-settings';

function defaultInteraction( id ) {
	return { id, on: 'none', fields: [] };
}

export default function InteractionsSettings( {
	interactions,
	setInteractions,
	layers,
	onCloseModal,
} ) {
	const interactiveLayers = useMemo( () => {
		if ( ! layers ) {
			return [];
		}
		return layers.filter( ( layer ) => {
			return layer.fields && Object.keys( layer.fields ).length > 0;
		} );
	}, [ layers ] );

	const onInsert = useCallback( ( newInteraction ) => {
		setInteractions( [ ...interactions, newInteraction ] );
	}, [ interactions, setInteractions ] );

	const onUpdate = useCallback( ( interactionId, newInteraction ) => {
		setInteractions( interactions.map( ( interaction ) => {
			return interaction.id === interactionId ? newInteraction : interaction;
		} ) );
	}, [ interactions, setInteractions ] );

	const onDelete = useCallback( ( interactionId ) => {
		setInteractions( interactions.filter( ( interaction ) => interaction.id !== interactionId ) );
	}, [ interactions, setInteractions ] );

	return (
		<Modal className="jeo-interactions-settings__modal" title={ __( 'Interactions', 'jeo' ) } onRequestClose={ onCloseModal }>
			<Panel className="jeo-interactions-settings">
				{ interactiveLayers.map( ( layer ) => {
					const index = interactions.findIndex( ( x ) => x.id === layer.id );
					const interaction = interactions[ index ];

					return (
						<InteractionSettings
							key={ layer.id }
							interactionIndex={ index }
							interaction={ interaction || defaultInteraction( layer.id ) }
							layer={ layer }
							onInsert={ onInsert }
							onUpdate={ onUpdate }
							onDelete={ onDelete }
						/>
					);
				} ) }
			</Panel>
		</Modal>
	);
}
