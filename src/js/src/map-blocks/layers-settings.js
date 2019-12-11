import { __ } from '@wordpress/i18n';
import { forwardRef } from '@wordpress/element';
import classNames from 'classnames';
import { List, arrayMove } from 'react-movable';

const LayerSettings = forwardRef( ( { layer, ...props }, ref ) => {
	return (
		<div { ...props } ref={ ref }>
			{ layer.title.rendered } | { layer.meta.type }
		</div>
	);
} );

const loader = ( layers ) => {
	const layersMap = Object.fromEntries( layers.map( ( l ) => [ l.id, l ] ) );
	return ( id ) => layersMap[ id ];
};

export default ( { loadingLayers, layers, selected, setLayers } ) => {
	if ( loadingLayers ) {
		return <p>Loading</p>;
	}
	if ( ! selected.length ) {
		return <p>{ __( 'No layers have been selected for this map.' ) } </p>;
	}

	const loadLayer = loader( layers );

	return (
		<List
			values={ selected }
			onChange={ ( { oldIndex, newIndex } ) =>
				setLayers( arrayMove( selected, oldIndex, newIndex ) )
			}
			renderList={ ( { children, isDragged, props } ) => (
				<div className={ classNames( [ 'layers-list', { isDragged } ] ) } { ...props }>
					{ children }
				</div>
			) }
			renderItem={ ( { value, isDragged, isSelected, isOutOfBounds, props } ) => (
				<LayerSettings layer={ loadLayer( value ) } { ...props } />
			) }
		/>
	);
};
