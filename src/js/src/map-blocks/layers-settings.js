import { __ } from '@wordpress/i18n';
import { withInstanceId } from '@wordpress/compose';
import { Fragment } from '@wordpress/element';
import { Button } from '@wordpress/components';
import classNames from 'classnames';
import { List, arrayMove } from 'react-movable';
import LayerSettings from './layer-settings';
import { layerLoader } from './utils';
import JeoAutosuggest from './jeo-autosuggest';

const setLayer = ( id ) => ( { id, use: 'fixed', default: false } );

const anySwapDefault = ( settings ) =>
	settings.some( ( s ) => s.use === 'swappable' && s.default );

const LayersSettings = ( {
	instanceId,
	attributes,
	setAttributes,
	loadingLayers,
	loadedLayers,
} ) => {
	if ( loadingLayers ) {
		// @TODO: proper loading spinner
		return <p>Loading</p>;
	}

	const setLayers = ( layers ) => setAttributes( { ...attributes, layers } );
	const loadLayer = layerLoader( loadedLayers );
	let widths = [];

	return (
		<Fragment>
			<div className="jeo-layers-library-controls">
				<label
					className="jeo-layers-library-controls__label"
					htmlFor={ `jeo-layers-autosuggest-${ instanceId }` }
				>
					{ __( 'Search for layers' ) }
				</label>
				<JeoAutosuggest
					postType="map-layer"
					inputProps={ {
						id: `jeo-layers-autosuggest-${ instanceId }`,
						placeholder: __( 'Search by layer name', 'jeo' ),
					} }
					filterSuggestions={ ( suggestion ) =>
						! attributes.layers.map( ( l ) => l.id ).includes( suggestion.id )
					}
					onSuggestionSelected={ ( e, { suggestion } ) =>
						setAttributes( {
							...attributes,
							layers: [ ...attributes.layers, setLayer( suggestion.id ) ],
						} )
					}
				/>
				<span>{ __( 'or' ) }</span>
				<Button
					isPrimary
					isLarge
					href="/wp-admin/post-new.php?post_type=map-layer"
					target="_blank"
					rel="noopener noreferrer"
				>
					{ __( 'Create New Layer' ) }
				</Button>
			</div>

			{ ! attributes.layers.length ? (
				<p>{ __( 'No layers have been added to this map.' ) } </p>
			) : (
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
			) }
		</Fragment>
	);
};

export default withInstanceId( LayersSettings );
