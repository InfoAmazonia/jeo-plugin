import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import * as Table from 'reactabular-table';

const layerColumns = [
	{ property: 'type', header: { label: __( 'Layer Type' ) } },
	{ property: 'title', header: { label: __( 'Layer Name' ) } },
];

const loadLayers = ( layers ) => ( settings ) =>
	layers.find( ( l ) => l.id === settings.id );

const layerToRow = ( layer ) => ( {
	id: layer.id,
	type: layer.meta.type,
	title: layer.title.rendered,
} );

export default ( {
	loadedLayers,
	loadingLayers,
	selectedLayers,
	className,
	onButtonClick,
} ) => {
	if ( loadingLayers ) {
		return <p>{ __( 'Loading Layers Data' ) }</p>;
	}

	const emptyMessage = __( 'No layers have been selected for this map.' );
	const loadLayer = loadLayers( loadedLayers );

	return (
		<Table.Provider columns={ layerColumns } className={ className }>
			<Table.Header />
			<Table.Body
				rows={ selectedLayers.map( loadLayer ).map( layerToRow ) }
				rowKey="id"
			/>
			<tfoot>
				<tr>
					<td colSpan={ layerColumns.length }>
						{ ! ( loadedLayers && loadedLayers.length ) && (
							<p className="empty">{ emptyMessage }</p>
						) }
						{ ! loadingLayers && (
							<Button isPrimary isLarge onClick={ onButtonClick }>
								{ __( 'Add a new layer' ) }
							</Button>
						) }
					</td>
				</tr>
			</tfoot>
		</Table.Provider>
	);
};
