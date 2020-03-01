import { __ } from '@wordpress/i18n';
import { Fragment, useState } from '@wordpress/element';
import { Button, TextControl } from '@wordpress/components';
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

	const setLayers = ( layers ) => setAttributes( { ...attributes, layers } );
	const [ search, setSearch ] = useState( '' );
	const loadLayer = layerLoader( loadedLayers );
	let widths = [];

	return (
		<Fragment>
			<div className="jeo-layers-library-controls">
				<TextControl
					type="search"
					label={ __( 'Search for layers ' ) }
					placeholder={ __( 'Search layers' ) }
					value={ search }
					onChange={ setSearch }
				/>
				<span>{ __( 'or' ) }</span>
				<Button
					isPrimary
					isLarge
					href="/wp-admin/post-new.php?post_type=map-layer"
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
