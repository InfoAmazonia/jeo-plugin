import { withSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import Autosuggest from 'react-autosuggest';

const getSuggestionValue = ( map ) => map.title.rendered;
const renderSuggestion = ( map ) => <span>{ map.title.rendered }</span>;

const mapStateToProps = ( select, { query, postType } ) => ( {
	entityRecords: select( 'core' ).getEntityRecords( 'postType', 'map', query ),
	loading: select( 'core/data' ).isResolving( 'core', 'getEntityRecords', [
		'postType',
		postType,
		query,
	] ),
} );

const GutenbergAutosuggest = withSelect(
	mapStateToProps
)( ( { entityRecords, query, ...props } ) => (
	<Autosuggest suggestions={ entityRecords || [] } { ...props } />
) );

export default ( {
	placeholder,
	postType,
	handleFetchRequest,
	onSuggestionSelected,
} ) => {
	const [ query, setQuery ] = useState( {} );
	const [ value, setValue ] = useState( '' );
	const onChange = ( e, { newValue } ) => setValue( newValue );
	const onSuggestionsFetchRequested = ( request ) =>
		setQuery( handleFetchRequest( request ) );
	const onSuggestionsClearRequested = () => setQuery( {} );

	return (
		<GutenbergAutosuggest
			query={ query }
			postType={ postType }
			inputProps={ { placeholder, value, onChange } }
			getSuggestionValue={ getSuggestionValue }
			renderSuggestion={ renderSuggestion }
			onSuggestionsFetchRequested={ onSuggestionsFetchRequested }
			onSuggestionsClearRequested={ onSuggestionsClearRequested }
			onSuggestionSelected={ onSuggestionSelected }
		/>
	);
};
