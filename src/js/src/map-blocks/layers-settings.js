import { Button, Spinner, Dashicon, CheckboxControl } from '@wordpress/components';
import { withInstanceId } from '@wordpress/compose';
import { Fragment, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { select } from '@wordpress/data';

import classNames from 'classnames';
import { List, arrayMove } from 'react-movable';

import JeoAutosuggest from './jeo-autosuggest';
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

	const allLayers = select( 'core' ).getEntityRecords( 'postType', 'map-layer' );
	allLayers.sort( function( a, b ) {
		if ( a.title.rendered.toLowerCase() < b.title.rendered.toLowerCase() ) {
			return -1;
		}
		if ( a.title.rendered.toLowerCase() > b.title.rendered.toLowerCase() ) {
			return 1;
		}
		return 0;
	} );

	const [ showAllLayers, setShowAllLayers ] = useState( false );

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
					filterSuggestions={ ( suggestion ) => {
							if ( suggestion.meta.type ) {
								return ! attributes.layers.map( ( l ) => { 
									return l.id 
								} ).includes( suggestion.id )
							}
						}
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
					className="create-layer-button"
					isPrimary
					isLarge
					href="/wp-admin/post-new.php?post_type=map-layer"
					target="_blank"
					rel="noopener noreferrer"
				>
					{ __( 'Create New Layer' ) }
				</Button>
			</div>
			<div style={ { marginLeft: '15px' } }>
				<CheckboxControl
					label={ __( 'Show all layers' ) }
					checked={ showAllLayers }
					onChange={ () => setShowAllLayers( ! showAllLayers ) }
					className="jeo-layers-panel"
				/>
			</div>

			{ showAllLayers && (
				<div name="map-layers" className="jeo-layers-panel">
					<ul className="jeo-layers-list">
						{ allLayers.map( ( layer ) => {
							let inUse = false;
							attributes.layers.map( ( l ) => {
								if ( layer.id === l.id ) {
									inUse = true;
								}
							} );

							if ( ! layer.meta.type ) {
								return;
							}

							return (
								<li className="jeo-setting-layer all-layers-list" key={ layer.id }>
									<p>
										<a
											className="all-layers-list-link"
											href={ `/wp-admin/post.php?post=${ layer.id }&action=edit` }
											target="_blank"
											rel="noopener noreferrer"
										>
											<strong>{ decodeHtmlEntity( layer.title.rendered ) }</strong> | { layer.meta.type }
										</a>
									</p>
									{ inUse && (
										<>
											<Button
												disabled
												className="all-layers-list-button"
											>
												<Dashicon icon="plus" />
											</Button>
											<p> (already added) </p>
										</>
									) }
									{ ! inUse && (
										<Button
											className="all-layers-list-button"
											onClick={ () => {
												setAttributes( {
													...attributes,
													layers: [ ...attributes.layers, setLayer( layer.id ) ],
												} );
											} }
										>
											<Dashicon icon="plus" />
										</Button>
									) }
								</li>
							);
						} ) }
					</ul>
				</div>
			) }

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
