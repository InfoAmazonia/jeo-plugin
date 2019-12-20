import { withSelect } from '@wordpress/data';
import { Fragment, useState } from '@wordpress/element';
import MapEditorModal from './map-editor-modal';
import LayerEditor from './layer-editor';
import LayersLibrary from './layers-library';
import LayersSettings from './layers-settings';
import LayersTable from './layers-table';
import './map-editor.css';

const MapEditor = ( {
	attributes,
	setAttributes,
	loadedLayers,
	loadingLayers,
} ) => {
	const [ modal, setModal ] = useState( false );
	const selectedLayers = attributes.layers;

	return (
		<Fragment>
			{ modal && (
				<MapEditorModal modal={ modal } setModal={ setModal }>
					{ ( tab ) => {
						switch ( tab.name ) {
							case 'map':
								return <p>Map Settings</p>;
							case 'layers':
								return (
									<LayersSettings
										loadedLayers={ loadedLayers }
										loadingLayers={ loadingLayers }
										selected={ selectedLayers }
										setLayers={ ( layers ) => setAttributes( { layers } ) }
									/>
								);
							case 'library':
								return (
									<LayersLibrary
										selected={ selectedLayers }
										setLayers={ ( layers ) => setAttributes( { layers } ) }
										onCreateLayer={ () => setModal( 'new-layer' ) }
									/>
								);
							case 'new-layer':
								return <LayerEditor></LayerEditor>;
						}
					} }
				</MapEditorModal>
			) }

			<LayersTable
				loadedLayers={ loadedLayers }
				loadingLayers={ loadingLayers }
				selectedLayers={ selectedLayers }
				onButtonClick={ () => setModal( 'new-layer' ) }
			/>
		</Fragment>
	);
};

export default withSelect( ( select, { attributes } ) => {
	const query = { include: attributes.layers.map( ( layer ) => layer.id ) };
	return {
		loadedLayers: select( 'core' ).getEntityRecords(
			'postType',
			'map-layer',
			query
		),
		loadingLayers: select( 'core/data' ).isResolving( 'core', 'getEntityRecords', [
			'postType',
			'map-layer',
			query,
		] ),
	};
} )( MapEditor );
