import { withSelect } from '@wordpress/data';
import { Fragment, useState } from '@wordpress/element';

import MapEditorModal from './map-editor-modal';
import LayersTable from './layers-table';
import './onetime-map-editor.css';

const OnetimeMapEditor = ( {
	attributes,
	setAttributes,
	loadedLayers,
	loadingLayers,
} ) => {
	const [ modal, setModal ] = useState( false );

	return (
		<Fragment>
			{ modal && (
				<MapEditorModal
					modal={ modal }
					setModal={ setModal }
					attributes={ attributes }
					setAttributes={ setAttributes }
					loadedLayers={ loadedLayers }
					loadingLayers={ loadingLayers }
				/>
			) }

			<LayersTable
				loadedLayers={ loadedLayers }
				loadingLayers={ loadingLayers }
				selectedLayers={ attributes.layers }
				onButtonClick={ () => setModal( 'map' ) }
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
} )( OnetimeMapEditor );
