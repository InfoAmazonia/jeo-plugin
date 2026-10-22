import { useBlockProps } from '@wordpress/block-editor';
import { Button, Spinner } from '@wordpress/components';
import { useEntityRecord } from '@wordpress/core-data';
import { useEffect, useId, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { Map } from '../lib/mapgl-react';
import { renderLayer } from './map-preview-layer';
import {
	applyStyleLayerFiltering,
	findStyleLayer,
	styleLayerMapProps,
} from './use-style-layer';
import JeoAutosuggest from './jeo-autosuggest';
import { decodeHtmlEntity } from '../shared/html';
import { useRecordsByIds } from '../shared/rest-records';
import {
	applyComposedVisibilityFromSettings,
	handleEditorMapPreviewError,
	hasMapboxStyleLayers,
	useComposedMapPreviewStyle,
	useEditorMapboxTransformRequest,
} from './mapbox-style-preview';
import './map-editor.css';

const { map_defaults: mapDefaults } = window.jeo_settings;

export default function MapEditor ( {attributes, setAttributes } ) {
	const blockProps = useBlockProps( { className: 'jeo-mapblock' } );
	const instanceId = useId();
	const [ key, setKey ] = useState( 0 );
	useEffect( () => {
		setKey( ( currentKey ) => currentKey + 1 );
	}, [ attributes.align, window.screen.width ] );

	const mapRef = useRef( undefined );

	const { record: loadedMap, isResolving: loadingMap } = useEntityRecord( 'postType', 'map', attributes.map_id, {
		enabled: Boolean( attributes.map_id ),
	} );

	const layerIds = useMemo( () => {
		if ( ! loadedMap?.meta.layers ) {
			return [];
		}
		return loadedMap.meta.layers.map( ( layer ) => layer.id );
	}, [ loadedMap?.meta.layers ] );
	const layerSettingsKey = useMemo(
		() => JSON.stringify( loadedMap?.meta.layers || [] ),
		[ loadedMap?.meta.layers ]
	);

	const {
		records: loadedLayers = [],
		isLoading: loadingLayers,
		hasResolved: hasResolvedLayers,
	} = useRecordsByIds( {
		path: '/jeo/v1/map-layer',
		ids: layerIds,
		enabled: layerIds.length > 0,
		query: { context: 'edit' },
	} );
	const hasMapboxLayers = hasMapboxStyleLayers( loadedLayers );
	const composedPreview = useComposedMapPreviewStyle( {
		enabled: hasMapboxLayers,
		mapId: attributes.map_id,
		refreshKey: layerSettingsKey,
	} );
	const useComposedPreview = Boolean(
		hasMapboxLayers && composedPreview.style
	);
	const isPreparingLayerPreview = Boolean(
		layerIds.length > 0 && ( loadingLayers || ! hasResolvedLayers )
	);
	const isPreparingComposedPreview = Boolean(
		! isPreparingLayerPreview &&
			hasMapboxLayers &&
			! composedPreview.style &&
			! composedPreview.error
	);
	const shouldRenderMap = ! isPreparingLayerPreview && ! isPreparingComposedPreview;
	const transformRequest = useEditorMapboxTransformRequest( loadedLayers );

	const applyComposedVisibility = () => {
		if ( useComposedPreview ) {
			applyComposedVisibilityFromSettings(
				mapRef.current,
				composedPreview.manifest,
				loadedMap?.meta?.layers || []
			);
		}
	};

	useEffect( () => {
		applyComposedVisibility();
	}, [ useComposedPreview, composedPreview.manifest, layerSettingsKey ] );

	const styleBase = useMemo(
		() => loadedMap?.meta?.layers ? findStyleLayer( loadedLayers, loadedMap.meta.layers ) : null,
		[ loadedLayers, loadedMap?.meta?.layers ]
	);

	return (
		<div { ...blockProps }>
			{ attributes.map_id && ( loadingMap || !loadedMap ) && <Spinner /> }
			{ attributes.map_id && ! loadingMap && loadedMap && (
				<>
					<div className="jeo-preview-area">
						{ ! shouldRenderMap && <Spinner /> }
						{ shouldRenderMap && (
							<Map
								key={ `${ key }:${ layerSettingsKey }:${ composedPreview.metadata?.hash || 'default' }` }
								ref={ mapRef }
								mapStyle={ useComposedPreview ? composedPreview.style : undefined }
								transformRequest={ transformRequest }
								onError={ handleEditorMapPreviewError }
								onStyleData={ () => {
									const { current: map } = mapRef;
									if ( map ) {
										if ( loadedMap.meta.disable_scroll_zoom ) {
											map.scrollZoom?.disable();
										}

										if ( loadedMap.meta.disable_drag_pan ) {
											map.dragPan.disable();
											map.touchZoomRotate?.disable();
										}

										if ( loadedMap.meta.disable_drag_rotate ) {
											map.dragRotate?.disable();
										}
									}
									applyComposedVisibility();
								} }
								style={ { height: '100%', width: '100%' } }
								latitude={ loadedMap.meta.center_lat || mapDefaults.lat }
								longitude={ loadedMap.meta.center_lon || mapDefaults.lng }
								zoom={ loadedMap.meta.initial_zoom || mapDefaults.zoom }
							>
								{ ! useComposedPreview && loadedLayers &&
									loadedMap.meta.layers.map( ( layer ) => {
										const layerOptions = loadedLayers.find(
											( { id } ) => id === layer.id
										);
										if ( layerOptions ) {
											return renderLayer( {
												layer: layerOptions.meta,
												instance: layer,
											} );
										}
									} ) }
							</Map>
						) }
					</div>
					<div className="jeo-preview-controls">
						<p>
							<strong>{ decodeHtmlEntity( loadedMap.title.rendered ) }</strong>
						</p>
						<Button
							className="select-another-map"
							variant="secondary"
							isLarge
							onClick={ () => {
								const previous_map = attributes.map_id;
								setAttributes( {
									...attributes,
									map_id: undefined,
									previous_map,
								} );
							} }
						>
							<em>{ __( '(Select another map)', 'jeowp' ) }</em>
						</Button>
					</div>
				</>
			) }
			{ ! attributes.map_id && (
				<>
					<label htmlFor={ `jeo-map-autosuggest-${ instanceId }` }>
						{ __( 'Insert a map from the library', 'jeowp' ) + ':' }
					</label>
					<JeoAutosuggest
						inputProps={ {
							placeholder: __( 'Type a map name', 'jeowp' ),
							id: `jeo-map-autosuggest-${ instanceId }`,
						} }
						postType="map"
						onSuggestionSelected={ ( e, { suggestion } ) =>
							setAttributes( { ...attributes, map_id: suggestion.id } )
						}
					/>
					{ attributes.previous_map && (
						<Button
							className="select-another-map"
							isLarge
							variant="primary"
							style={ { marginTop: '10px' } }
							onClick={ () => {
								const previous_map = attributes.previous_map;
								setAttributes( { ...attributes, map_id: previous_map } );
							} }
						>
							{ __( 'Cancel', 'jeowp' ) }
						</Button>
					) }
				</>
			) }
		</div>
	);
};
