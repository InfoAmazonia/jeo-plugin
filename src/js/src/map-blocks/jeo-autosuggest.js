import { useSelect } from '@wordpress/data';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { debounce } from 'lodash-es';

import AsyncComboboxControl from '../shared/async-combobox-control';

const decodeHtmlEntity = function ( str ) {
	return str.replace( /&#(\d+);/g, function ( match, dec ) {
		return String.fromCharCode( dec );
	} );
};

const _filterSuggestions = () => true;
const _getSuggestionValue = ( entityRecord ) =>
	decodeHtmlEntity( entityRecord.title.rendered );
const _renderSuggestion = ( entityRecord ) => (
	<span>{ decodeHtmlEntity( entityRecord.title.rendered ) }</span>
);
const _handleFetchRequest = ( { value } ) => {
	const input = value.trim().toLowerCase();
	return input ? { search: input } : {};
};

export default function JeoAutosuggest( {
	inputProps,
	postType,
	onSuggestionSelected,
	filterSuggestions = _filterSuggestions,
	getSuggestionValue = _getSuggestionValue,
	handleFetchRequest = _handleFetchRequest,
	renderSuggestion = _renderSuggestion,
} ) {
	const [ query, setQuery ] = useState( {} );
	const [ inputValue, setInputValue ] = useState( '' );
	const [ selectedValue, setSelectedValue ] = useState( null );

	const entityRecords = useSelect(
		( select ) => {
			return select( 'core' ).getEntityRecords( 'postType', postType, query );
		},
		[ postType, query ]
	);

	const loading = useSelect(
		( select ) => {
			return select( 'core/data' ).isResolving(
				'core',
				'getEntityRecords',
				[ 'postType', postType, query ]
			);
		},
		[ postType, query ]
	);

	const suggestions = useMemo( () => {
		return ( entityRecords || [] ).filter( filterSuggestions );
	}, [ entityRecords, filterSuggestions ] );

	const debouncedFetchRequest = useMemo( () => {
		return debounce( ( nextValue ) => {
			setQuery( handleFetchRequest( { value: nextValue } ) );
		}, 500 );
	}, [ handleFetchRequest ] );

	useEffect( () => {
		return () => {
			debouncedFetchRequest.cancel();
		};
	}, [ debouncedFetchRequest ] );

	return (
		<AsyncComboboxControl
			className="jeo-map-autosuggest"
			items={ suggestions }
			inputValue={ inputValue }
			selectedValue={ selectedValue }
			isLoading={ loading }
			placeholder={ inputProps?.placeholder }
			ariaLabel={ inputProps?.placeholder }
			getOptionLabel={ getSuggestionValue }
			getOptionValue={ ( suggestion ) => suggestion.id }
			onInputValueChange={ ( nextValue ) => {
				setInputValue( nextValue );
				setSelectedValue( null );

				if ( ! nextValue.trim() ) {
					debouncedFetchRequest.cancel();
					setQuery( {} );
					return;
				}

				debouncedFetchRequest( nextValue );
			} }
			onOptionSelect={ ( suggestion ) => {
				const suggestionValue = getSuggestionValue( suggestion );
				const suggestionIndex = suggestions.findIndex(
					( item ) => item.id === suggestion.id
				);

				setInputValue( suggestionValue );
				setSelectedValue( String( suggestion.id ) );
				onSuggestionSelected?.( undefined, {
					suggestion,
					suggestionValue,
					suggestionIndex,
					sectionIndex: null,
					method: 'select',
				} );
			} }
			renderItem={ renderSuggestion }
			allowReset={ false }
		/>
	);
}
