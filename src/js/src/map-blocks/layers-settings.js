import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import { List, arrayMove } from 'react-movable';
import LayerSettings from './layer-settings';
import { layerLoader } from './utils';

const anySwapDefault = ( settings ) =>
	settings.some( ( s ) => s.use === 'swappable' && s.default );

export default ( { attributes, setAttributes, loadingLayers, loadedLayers } ) => {
	if ( loadingLayers ) {
		// @TODO: proper loading spinner
		return <p>Loading</p>;
	}

	if ( ! attributes.layers.length ) {
		return <p>{ __( 'No layers have been attributes.layers for this map.' ) } </p>;
	}

	const setLayers = ( layers ) => setAttributes( { ...attributes, layers } );
	const loadLayer = layerLoader( loadedLayers );
	let widths = [];

	return (
		<List
			values={ attributes.layers }
			beforeDrag={ ( { elements, index } ) => {
				const cells = Array.from( elements[ index ].children );
				widths = cells.map( ( cell ) => window.getComputedStyle( cell ).width );
			} }
			onChange={ ( { oldIndex, newIndex } ) =>
				setLayers( arrayMove( attributes.layers, oldIndex, newIndex ) )
			}
			renderList={ ( { children, isDragged, props } ) => (
				<table className={ classNames( [ 'jeo-layers-list', { isDragged } ] ) }>
					<tbody { ...props }>{ children }</tbody>
				</table>
			) }
			renderItem={ ( { value, props, ...meta } ) => {
				const switchDefault = ( def ) =>
					setLayers(
						attributes.layers.map( ( settings ) =>
							settings.id === value.id ?
								{ ...settings, default: def } :
								settings
						)
					);
				const swapDefault = ( def ) =>
					def && // radio-like behavior: can only be turned on.
					setLayers(
						attributes.layers.map( ( settings ) => ( {
							...settings,
							default:
								settings.use === 'swappable' ? // update only the swappable layers
									settings.id === value.id : // radio-like behavior: turn off all other swappable layers
									settings.default,
						} ) )
					);
				const updateUse = ( use ) =>
					setLayers(
						attributes.layers.map( ( settings ) => {
							if ( settings.id !== value.id ) {
								return settings;
							}
							return {
								...settings,
								use,
								default:
									use === 'swappable' ?
										! anySwapDefault( attributes.layers ) :
										settings.default,
							};
						} )
					);
				const removeLayer = () =>
					setLayers(
						attributes.layers.filter( ( settings ) => settings.id !== value.id )
					);
				const row = (
					<LayerSettings
						removeLayer={ removeLayer }
						settings={ loadLayer( value ) }
						switchDefault={ switchDefault }
						swapDefault={ swapDefault }
						updateUse={ updateUse }
						widths={ widths }
						{ ...meta } // includes isDragged
						{ ...props }
					/>
				);
				return meta.isDragged ? (
					<table className="jeo-layers-list dragging" style={ props.style }>
						<tbody>{ row }</tbody>
					</table>
				) : (
					row
				);
			} }
		/>
	);
};
