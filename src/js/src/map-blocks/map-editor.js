import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { Fragment, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import MapEditorModal from './map-editor-modal';
import LayersTable from './layers-table';
import './map-editor.css';

const layerColumns = [
	{ property: 'type', header: { label: __( 'Layer Type' ) } },
	{ property: 'title', header: { label: __( 'Layer Name' ) } },
	{ property: 'url', header: { label: __( 'Layer Source' ) } },
	{ property: 'use', header: { label: __( 'Layer Options' ) } },
];

export default ( props ) => {
	const { attributes, setAttributes } = props;
	const layers = useSelect( ( select ) => select( 'jeo-layers' ).getLayers() );
	const [ modal, setModal ] = useState( false );

	return (
		<Fragment>
			{ modal && (
				<MapEditorModal modal={ modal } setModal={ setModal }>
					{ ( tab ) => {
						switch ( tab.name ) {
							case 'map':
								return <p>Map Settings</p>;
							case 'layers':
								return <p>Edit Layers</p>;
							case 'library':
								return <p>Add From Library</p>;
							case 'new-layer':
								return <p>New layer</p>;
						}
					} }
				</MapEditorModal>
			) }

			<LayersTable
				columns={ layerColumns }
				rows={ attributes.layers }
				emptyMessage={ __( 'No layers have been selected for this map.' ) }
			>
				<Button isPrimary isLarge onClick={ () => setModal( 'layers' ) }>
					{ __( 'Add a new layer' ) }
				</Button>
			</LayersTable>
		</Fragment>
	);
};
