import { Modal, Panel, SelectControl} from '@wordpress/components';
import { useCallback, useMemo, useState } from '@wordpress/element';
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

	const layersSources = useMemo(()=>{
		if( ! layers) {
			return [];
		}
		const uniqueSources = Array.from( new Set( layers.map( layer => layer.source ) ) )
			.map( source => {
				return layers.find( layer => layer.source === source )
		})
		let selectors = uniqueSources.map( u => { return { value: u.source, label: u.sourceName } } );
		if(selectors.length > 1){
			selectors.push( { value: 'all', label: __('All', 'jeo') } );
		}
		return selectors;
	}, [ layersSources ])

	const [ selectedSource, setSelectedSource ] = useState( layersSources.length > 1 ? 'all': layersSources[0].source );

	return (
		<Modal
			className="jeo-interactions-settings__modal"
			title={ __( 'Interactions', 'jeo' ) }
			onRequestClose={ onCloseModal }
		>
			<SelectControl
				label="selectedSource"
				value={ selectedSource }
				options={ layersSources }
				onChange={ ( selectedSource ) => { setSelectedSource( selectedSource ) } }
			/>
			<Panel className="jeo-interactions-settings">
				{ interactiveLayers.map( ( layer ) => {
					if (layer.source === selectedSource || selectedSource === 'all' || layersSources.length <= 1) {
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
					}
				} ) }
			</Panel>
		</Modal>
	);
}
