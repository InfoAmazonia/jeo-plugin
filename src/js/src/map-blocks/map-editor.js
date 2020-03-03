import { PanelBody, PanelRow, Spinner, TextControl } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { Fragment, useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import Autosuggest from 'react-autosuggest';

import './map-editor.css';

const MapEditor = ( {
	attributes,
	setAttributes,
	loadedMaps,
	loadingMaps,
} ) => {
	const [ value, setValue ] = useState( '' );
	const [ suggestions, setSuggestions ] = useState( [] );

	const onSuggestionsFetchRequested = useCallback( _.debounce( ( { value: val } ) => {
		const input = val.trim().toLowerCase();
		if ( input.length === 0 ) {
			setSuggestions( [] );
		}
		setSuggestions( loadedMaps.filter( ( map ) => {
			return map.title.rendered.toLowerCase().includes( input ) || map.content.rendered.toLowerCase().includes( input );
		} ) );
	}, 500 ), [ loadedMaps, setSuggestions ] );

	const onSuggestionsClearRequested = useCallback( () => setSuggestions( [] ), [ setSuggestions ] );

	const onSuggestionSelected = useCallback( ( e, { suggestion } ) => {
		setAttributes( { ...attributes, map_id: suggestion.id } );
	}, [ attributes, setAttributes ] );

	const getSuggestionValue = useCallback( ( map ) => map.title.rendered, [] );

	const inputProps = {
		placeholder: __( 'Type a map name', 'jeo' ),
		value,
		onChange: useCallback( ( e, { newValue } ) => setValue( newValue ), [ setValue ] ),
	};

	let currentMap = '';
	if ( loadedMaps && attributes.map_id ) {
		currentMap = loadedMaps.find( ( map ) => map.id == attributes.map_id );
		if ( value === '' ) {
			setValue( currentMap.title.rendered );
		}
	}

	const setSize = useCallback( ( key ) => ( size ) => {
		setAttributes( { ...attributes, [ key ]: size } );
	}, [ attributes, setAttributes ] );

	const { InspectorControls } = wp.editor;

	return (
		<Fragment>
			{ currentMap && currentMap.title.rendered }
			{ loadingMaps ?
				<Spinner /> :
				<Autosuggest
					suggestions={ suggestions }
					onSuggestionsFetchRequested={ onSuggestionsFetchRequested }
					onSuggestionsClearRequested={ onSuggestionsClearRequested }
					onSuggestionSelected={ onSuggestionSelected }
					getSuggestionValue={ getSuggestionValue }
					renderSuggestion={ ( map ) => <span>{ map.title.rendered }</span> }
					inputProps={ inputProps }
				/>
			}
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

export default withSelect( ( select ) => {
	return {
		loadedMaps: select( 'core' ).getEntityRecords(
			'postType',
			'map',
		),
		loadingMaps: select( 'core/data' ).isResolving( 'core', 'getEntityRecords', [
			'postType',
			'map',
		] ),
	};
} )( MapEditor );
