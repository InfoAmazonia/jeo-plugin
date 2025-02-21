import { withSelect } from '@wordpress/data';
import { useCallback, useId, useState } from '@wordpress/element';
import { debounce } from 'lodash-es';
import Autosuggest from 'react-autosuggest';

const GutenbergAutosuggest = withSelect( ( select, { query, postType } ) => ( {
	entityRecords: select( 'core' ).getEntityRecords(
		'postType',
		postType,
		query
	),
	loading: select( 'core/data' ).isResolving( 'core', 'getEntityRecords', [
		'postType',
		postType,
		query,
	] ),
} ) )( ( { entityRecords, filterSuggestions, ...props } ) => (
	<Autosuggest
		suggestions={ ( entityRecords || [] ).filter( filterSuggestions ) }
		{ ...props }
	/>
) );

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

export default function JeoAutosuggest ( {
	inputProps,
	postType,
	onSuggestionSelected,
	filterSuggestions = _filterSuggestions,
	getSuggestionValue = _getSuggestionValue,
	handleFetchRequest = _handleFetchRequest,
	renderSuggestion = _renderSuggestion,
} ) {
	const instanceId = useId();
	const [ query, setQuery ] = useState( {} );
	const [ value, setValue ] = useState( '' );
	const onChange = useCallback(
		( e, { newValue } ) => {
			setValue( newValue );
		},
		[ setValue ]
	);
	const onSuggestionsFetchRequested = useCallback(
		debounce( ( request ) => {
			setQuery( handleFetchRequest( request ) );
		}, 500 ),
		[ setQuery, handleFetchRequest ]
	);
	const onSuggestionsClearRequested = useCallback( () => {
		setQuery( {} );
	}, [ setQuery ] );

	return (
		<GutenbergAutosuggest
			id={ `jeo-autosuggest-${ instanceId }` }
			query={ query }
			postType={ postType }
			inputProps={ { ...inputProps, value, onChange } }
			filterSuggestions={ filterSuggestions }
			getSuggestionValue={ getSuggestionValue }
			renderSuggestion={ renderSuggestion }
			onSuggestionsFetchRequested={ onSuggestionsFetchRequested }
			onSuggestionsClearRequested={ onSuggestionsClearRequested }
			onSuggestionSelected={ onSuggestionSelected }
		/>
	);
};
