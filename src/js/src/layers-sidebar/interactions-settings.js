import { Modal, Panel, SelectControl, Button } from '@wordpress/components';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import InteractionSettings from './interaction-settings';

function defaultInteraction( id ) {
	return { id, on: 'none', fields: [] };
}

export default function InteractionsSettings( {
	interactions,
	setInteractions,
	sources,
	styleDefinition,
	onCloseModal,
} ) {
	const [ localInteractions, setLocalInteractions ] = useState( interactions );
	// console.log(styleDefinition.layers.filter(item => item.source));
	// layers = styleDefinition.layers;

	const interactiveLayers = useMemo( () => {
		if ( ! sources ) {
			return [];
		}

		let layersWithSource = styleDefinition.layers.filter( ( layer ) => {
			return layer.source && layer['source-layer'];
		} );

		// console.log("1", layersWithSource);

		layersWithSource = layersWithSource.map( ( layer ) => {
			const source = sources.find(( sourceLayer ) => sourceLayer.id === layer[ 'source-layer' ]);
			layer.fields = source.fields;
			layer.source = source;
			return layer;
		} );

		//console.log(layersWithSource);


		return layersWithSource;
	}, [ sources, styleDefinition ] );


	const onInsert = useCallback(
		( newInteraction ) => {
			setLocalInteractions( [ ...localInteractions, newInteraction ] );
		},
		[ localInteractions, setLocalInteractions ]
	);

	const onUpdate = useCallback(
		( interactionId, newInteraction ) => {
			//console.log( interactionId, newInteraction );
			setLocalInteractions(
				localInteractions.map( ( interaction ) => {
					return interaction.id === interactionId
						? newInteraction
						: interaction;
				} )
			);
		},
		[ localInteractions, setLocalInteractions ]
	);

	const onDelete = useCallback(
		( interactionId ) => {
			setLocalInteractions(
				localInteractions.filter(
					( interaction ) => interaction.id !== interactionId
				)
			);
		},
		[ localInteractions, setLocalInteractions ]
	);

	const onDone = useCallback( () => {
		setInteractions( localInteractions );
		onCloseModal();
	}, [ localInteractions, setLocalInteractions ] );

	return (
		<Modal
			className="jeo-interactions-settings__modal"
			title={ __( 'Interactions', 'jeo' ) }
			onRequestClose={ onDone }
		>
			<Panel className="jeo-interactions-settings">
				{ interactiveLayers.map( ( layer ) => {
					const index = localInteractions.findIndex(
						( x ) => x.id === layer.id
					);
					const interaction = localInteractions[ index ];
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
					// }
				} ) }
			</Panel>
			<Button
				style={ { float: 'left', margin: '8px 0' } }
				isPrimary
				onClick={ onDone }
			>
				{ __( 'Done', 'jeo' ) }
			</Button>
		</Modal>
	);
}
