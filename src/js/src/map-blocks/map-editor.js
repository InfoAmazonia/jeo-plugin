import { InspectorControls } from '@wordpress/block-editor';
import {
	Button,
	PanelBody,
	PanelRow,
	Spinner,
	TextControl,
} from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { Fragment, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import Map from './map';
import JeoAutosuggest from './jeo-autosuggest';
import './map-editor.css';

const { map_defaults: mapDefaults } = window.jeo_settings;

const MapEditor = ( { attributes, setAttributes, map, loading } ) => {
	const setSize = useCallback(
		( key ) => ( size ) => {
			setAttributes( { ...attributes, [ key ]: size } );
		},
		[ attributes, setAttributes ]
	);

	return (
		<Fragment>
			{ attributes.map_id && loading && <Spinner /> }
			{ attributes.map_id && ! loading && (
				<Fragment>
					<div className="jeo-preview-area">
						<Map
							style="mapbox://styles/mapbox/streets-v11"
							zoom={ [ map.meta.initial_zoom || mapDefaults.zoom ] }
							center={ [
								map.meta.center_lon || mapDefaults.lng,
								map.meta.center_lat || mapDefaults.lat,
							] }
							containerStyle={ { height: '20vh' } }
						/>
					</div>

					<div className="jeo-preview-controls">
						<Button
							isLink
							isLarge
							onClick={ () =>
								setAttributes( { ...attributes, map_id: undefined } )
							}
						>
							{ __( 'Select another map' ) }
						</Button>
					</div>
				</Fragment>
			) }
			{ ! attributes.map_id && (
				<JeoAutosuggest
					placeholder={ __( 'Type a map name', 'jeo' ) }
					postType={ 'map' }
					onSuggestionSelected={ ( e, { suggestion } ) =>
						setAttributes( { ...attributes, map_id: suggestion.id } )
					}
					handleFetchRequest={ ( { value } ) => {
						const input = value.trim().toLowerCase();
						return input ? {} : { title: input };
					} }
				/>
			) }
			<InspectorControls key={ 'inspector' }>
				<PanelBody title={ __( 'Size' ) } initialOpen={ true }>
					<PanelRow>
						<TextControl
							label={ __( 'Height' ) }
							value={ attributes.height }
							onChange={ setSize( 'height' ) }
						/>
					</PanelRow>
					<PanelRow>
						<TextControl
							label={ __( 'Width' ) }
							value={ attributes.width }
							onChange={ setSize( 'width' ) }
						/>
					</PanelRow>
				</PanelBody>
			</InspectorControls>
		</Fragment>
	);
};

export default withSelect( ( select, { attributes } ) =>
	attributes.map_id ?
		{
			map: select( 'core' ).getEntityRecord(
				'postType',
				'map',
				attributes.map_id
			),
			loading: select( 'core/data' ).isResolving( 'core', 'getEntityRecord', [
				'postType',
				'map',
				attributes.map_id,
			] ),
		  } :
		{}
)( MapEditor );
