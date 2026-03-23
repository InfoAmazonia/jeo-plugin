import { useBlockProps } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { useDebounce } from 'use-debounce';

import { Map } from '../lib/mapgl-react';
import { MemoizedRenderLayer } from './map-preview-layer';
import { getEditorLayerTypeSchema } from '../layers-sidebar/layer-type-definitions';

const mapDefaults = {
	initial_zoom: jeo_settings.map_defaults.zoom,
	center_lat: jeo_settings.map_defaults.lat,
	center_lon: jeo_settings.map_defaults.lng,
	min_zoom: 0,
	max_zoom: 20,
};

export default function LayerEditorPreview() {
	const blockProps = useBlockProps();

	const postMeta = useSelect( ( select ) =>
		select( 'core/editor' ).getEditedPostAttribute( 'meta' ), [] );
	const [ viewState, setViewState ] = useState( {
		latitude: mapDefaults.center_lat,
		longitude: mapDefaults.center_lon,
		zoom: mapDefaults.initial_zoom,
	} );

	const [ key, setKey ] = useState( 0 );
	const [ renderControl, setRenderControl ] = useState( { status: 'incomplete_form' } );
	const [ debouncedPostMeta ] = useDebounce( postMeta, 1500 );
	const prevPostMeta = useRef( {} );

	useEffect( () => {
		if ( ! postMeta.type ) {
			return;
		}
		const schema = getEditorLayerTypeSchema( postMeta );
		if ( ! schema || ! schema.properties ) {
			return;
		}

		const opts = debouncedPostMeta.layer_type_options || {};
		const prevOpts = prevPostMeta.current.layer_type_options;
		const optionsKeys = Object.keys( schema.properties );
		let anyEmpty = false;

		optionsKeys.some( ( k ) => {
			const val = opts[ k ];
			if (
				( val === undefined || val === null || val === '' ) &&
				schema.required?.includes( k )
			) {
				anyEmpty = true;
				setRenderControl( { status: 'incomplete_form' } );
				return true;
			}
			return false;
		} );

		if ( ! anyEmpty && JSON.stringify( opts ) !== JSON.stringify( prevOpts ) ) {
			setRenderControl( { status: 'ready' } );
			setKey( ( prev ) => prev + 1 );
		}
		prevPostMeta.current = debouncedPostMeta;
	}, [ debouncedPostMeta.layer_type_options, postMeta.type ] );

	// Stop mouse events from propagating to the block editor's selection
	// handler so the map remains draggable inside the block.
	const stopPropagation = useCallback( ( e ) => e.stopPropagation(), [] );

	return (
		<div { ...blockProps }>
			{ /* eslint-disable-next-line jsx-a11y/no-static-element-interactions */ }
			<div
				className="jeo-preview-area"
				onPointerDown={ stopPropagation }
				onMouseDown={ stopPropagation }
				onTouchStart={ stopPropagation }
			>
				<Map
					key={ key }
					onError={ () => {
						setRenderControl( { status: 'request_error', statusCode: 400 } );
					} }
					onSourceData={ () => {
						setRenderControl( { status: 'loaded' } );
					} }
					style={ { height: '500px', width: '100%' } }
					latitude={ viewState.latitude || 0 }
					longitude={ viewState.longitude || 0 }
					zoom={ viewState.zoom || 0 }
					onMove={ ( { viewState } ) => {
						setViewState( {
							latitude: viewState.latitude,
							longitude: viewState.longitude,
							zoom: Math.round( viewState.zoom * 10 ) / 10,
						} );
					} }
				>
					{ [ 'ready', 'loaded' ].includes( renderControl.status ) && (
						<MemoizedRenderLayer
							layer={ debouncedPostMeta }
							instance={ { id: 1, use: 'fixed' } }
						/>
					) }
				</Map>
			</div>
		</div>
	);
}
