import { Button, Spinner, SelectControl, TextControl, Card, CardBody, CardHeader, CardDivider, CardFooter } from '@wordpress/components';
import { withInstanceId } from '@wordpress/compose';
import { Fragment, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { select } from '@wordpress/data';

import classNames from 'classnames';
import { List, arrayMove } from 'react-movable';

import LayerSettings from './layer-settings';
import { layerLoader } from './utils';

import './layers-settings.css';

const setLayer = ( id ) => ( { id, use: 'fixed', default: false } );

const anySwapDefault = ( settings ) =>
	settings.some( ( s ) => s.use === 'swappable' && s.default );

const LayersSettings = ( {
	instanceId,
	attributes,
	setAttributes,
	loadingLayers,
	loadedLayers,
	closeModal,
} ) => {
	const setLayers = ( layers ) => setAttributes( { ...attributes, layers } );
	const loadLayer = layerLoader( loadedLayers );
	let widths = [];

	const [ allLayers, setAllLayers ] = useState([]);
	const [ filteredLayers, setFilteredLayers ] = useState([]);

	useEffect( () => {
		const allLayersData = select( 'core' ).getEntityRecords( 'postType', 'map-layer' );
		if ( ! allLayersData ) {
			setAllLayers( [] );
		} else {
			setAllLayers( allLayersData );
		}
	});

	allLayers.sort( function( a, b ) {
		if ( a.title.rendered.toLowerCase() < b.title.rendered.toLowerCase() ) {
			return -1;
		}
		if ( a.title.rendered.toLowerCase() > b.title.rendered.toLowerCase() ) {
			return 1;
		}
		return 0;
	} );

	const [ layerTypeFilter, setLayerTypeFilter ] = useState( null );
	const [ layerLegendFilter, setLayerLegendFilter ] = useState( null );
	const [ layerNameFilter, setLayerNameFilter ] = useState('');

	const layerTypeOptions = [
		{ label: 'Select a layer type', value: '' },
		{ label: 'Mapbox', value: 'mapbox' },
		{ label: 'Mapbox-tileset', value: 'mapbox-tileset' },
		{ label: 'Tilelayer', value: 'tilelayer' },
		{ label: 'MVT', value: 'mvt' },
	];

	const legendTypeOptions = [
		{ label: 'Select a legend type', value: '' },
		{ label: 'Barscale', value: 'barscale' },
		{ label: 'Simple-color', value: 'simple-color' },
		{ label: 'Icons', value: 'icons' },
		{ label: 'Circles', value: 'circles' },
	];

	useEffect( () => {
		const [ firstLayer, ...otherLayers ] = attributes.layers;
		if ( firstLayer && firstLayer.use !== 'fixed' ) {
			setLayers( [ { ...firstLayer, use: 'fixed', default: false }, ...otherLayers ] );
		}
	}, [ attributes, setAttributes ] );

	const decodeHtmlEntity = function( str ) {
		return str.replace( /&#(\d+);/g, function( match, dec ) {
			return String.fromCharCode( dec );
		} );
	};

	function filterLayers() {
		const layers = []

		allLayers.map( ( layer ) => {
			if ( layerTypeFilter && layerTypeFilter !== layer.meta.type ) {
				return;
			}

			/* TODO: Make layers that don't use legend to not be shown when filtering by legend
			if ( layerLegendFilter && layerLegendFilter !== layer.meta.legend_type ) {
				return;
			}
			*/

			if ( layerNameFilter && ! layer.title.raw.toLowerCase().includes( layerNameFilter.toLowerCase() ) ) {
				return;
			}

			return layers.push( layer );
		} );
		setFilteredLayers( layers );
	}

	return (
		<Fragment>
			<div className="jeo-layers-library-controls">
				<div className="left">
					<TextControl
						placeholder="Enter keywords to search layers"
						value={ layerNameFilter }
						onChange={ ( value ) => {
							setLayerNameFilter( value );
						} }
					/>
					<SelectControl
						className="jeo-layers-library-filters"
						hideLabelFromVision={ true }
						label={ __( 'Layer type' ) }
						options={ layerTypeOptions }
						value={ layerTypeFilter }
						onChange={ ( value ) => {
							setLayerTypeFilter( value )
						} }
					/>
					{
						/* TODO: Make layers that don't use legend to not be shown when filtering by legend
							<SelectControl
								className="jeo-layers-library-filters"
								hideLabelFromVision={ true }
								label={ __( 'Legend type' ) }
								options={ legendTypeOptions }
								value={ layerLegendFilter }
								onChange={ ( value ) => {
									setLayerLegendFilter( value )
								} }
							/>
						*/
					}
					<Button
						className="jeo-layers-library-filters-button-filter"
						isPrimary
						isLarge
						onClick={ filterLayers }
					>
						{ __( 'Filter' ) }
					</Button>
					<Button
						className="jeo-layers-library-filters-button-clear"
						isPrimary
						isLarge
						onClick={ () => { setFilteredLayers([]); } }
					>
						{ __( 'Clear' ) }
					</Button>
				</div>
				<div className="right">
					<Button
						className="create-layer-button"
						isPrimary
						isLarge
						href="/wp-admin/post-new.php?post_type=map-layer"
						target="_blank"
						rel="noopener noreferrer"
					>
						{ __( 'New Layer' ) }
					</Button>
				</div>
			</div>
			<div name="map-layers" className="jeo-layers-panel">
				<ul className="jeo-layers-list">
					{ filteredLayers.map( ( layer, i ) => {
						let inUse = false;
						attributes.layers.map( ( l ) => {
							if ( layer.id === l.id ) {
								inUse = true;
							}
						} );

						if ( ! layer.meta.type ) {
							return;
						}

						let background;
						if ( i % 2 !== 0 ) {
							background = '#white';
						} else {
							background = '#f9f9f9';
						}

						return (
							<Card
								key={ layer.id }
								style={ { background } }
								size="small"
								className="layer-card"
							>
								<CardBody>
									<li className="jeo-setting-layer all-layers-list">
										<div className="layer-info">
											<p className="layer-info__single-row">
												<a
													className="all-layers-list-link"
													href={ `/wp-admin/post.php?post=${ layer.id }&action=edit` }
													target="_blank"
													rel="noopener noreferrer"
												>
													<strong className="layer-title">{ decodeHtmlEntity( layer.title.rendered ) }</strong> | { layer.meta.type }
												</a>
											</p>
											<div className="layer-buttons">
												{ ! inUse && (
													<p
														onClick={ () => {
															setAttributes( {
																...attributes,
																layers: [ ...attributes.layers, setLayer( layer.id ) ],
															} );
														} }
														className="add-button"
													>
														Add to map
													</p>
												) }
												{ inUse && (
													<p
														onClick={ () => {
															const confirmation = confirm( __( 'Do you really want to delete this layer?' ) );

															if ( confirmation ) {
																return setLayers(
																	attributes.layers.filter( ( settings ) => settings.id !== layer.id )
																);
															}
														} }
														className="remove-button"
													>
														Remove from map
													</p>
												) }
											</div>
										</div>
									</li>
								</CardBody>
							</Card>
						);
					} ) }
				</ul>
			</div>
			<h2 className="selected-layers-title" >{ __( 'Selected layers' ) }</h2>
			{ loadingLayers && <Spinner /> }
			{ ! loadingLayers && ! attributes.layers.length && (
				<p className="jeo-layers-list">
					{ __( 'No layers have been added to this map.' ) }
				</p>
			) }
			{ ! loadingLayers && attributes.layers.length > 0 && (
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
					renderItem={ ( { value, props, index, ...meta } ) => {
						const switchDefault = ( def ) =>
							setLayers(
								attributes.layers.map( ( settings ) =>
									settings.id === value.id ?
										{ ...settings, default: def } :
										settings
								)
							);
						const switchShowLegend = ( def ) => {
							setLayers(
								attributes.layers.map( ( settings ) =>
									settings.id === value.id ?
										{ ...settings, show_legend: def } :
										settings
								)
							);
						};
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
						const removeLayer = () => {
							const confirmation = confirm( __( 'Do you really want to delete this layer?' ) );

							if ( confirmation ) {
								return setLayers(
									attributes.layers.filter( ( settings ) => settings.id !== value.id )
								);
							}
						};
						const row = (
							<LayerSettings
								index={ index }
								removeLayer={ removeLayer }
								settings={ loadLayer( value ) }
								switchDefault={ switchDefault }
								switchShowLegend={ switchShowLegend }
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
			<Button
				className="done-button"
				isPrimary
				isLarge
				target="_blank"
				rel="noopener noreferrer"
				onClick={ closeModal }
			>
				{ __( 'Done' ) }
			</Button>
		</Fragment>
	);
};

export default withInstanceId( LayersSettings );
