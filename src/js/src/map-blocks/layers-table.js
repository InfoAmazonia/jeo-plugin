import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const loadLayers = ( layers ) => ( settings ) => {
	return layers.find( ( l ) => l.id === settings.id );
};

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
		<table className={ className }>
			<thead>
				<tr>
					<th>{ __( 'Layer Type', 'jeo' ) }</th>
					<th>{ __( 'Layer Name', 'jeo' ) }</th>
				</tr>
			</thead>

			<tbody>
				{ selectedLayers.map( loadLayer ).map( ( layer ) => (
					<tr id={ layer.id } key={ layer.id }>
						<td>{ layer.meta.type }</td>
						<td>{ layer.title.rendered }</td>
					</tr>
				) ) }
			</tbody>

			<tfoot>
				<tr>
					<td colSpan="2">
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
		</table>
	);
};
