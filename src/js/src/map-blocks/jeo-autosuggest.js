import { useSelect } from '@wordpress/data';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { debounce } from 'lodash-es';

import AsyncComboboxControl from '../shared/async-combobox-control';
import { decodeHtmlEntity } from '../shared/html';

const PUBLIC_STATUSES = 'publish';
const PRIVATE_STATUSES = 'publish,private,future';

const _filterSuggestions = () => true;
const _getSuggestionValue = ( entityRecord ) =>
	decodeHtmlEntity( entityRecord.title.rendered );
const _renderSuggestion = ( entityRecord ) => (
	<span>{ decodeHtmlEntity( entityRecord.title.rendered ) }</span>
);

/**
 * Build the entity records query for the current input value.
 *
 * The `status` argument is always sent so the queried statuses are explicit.
 * Pass `PRIVATE_STATUSES` to also surface private and scheduled posts.
 *
 * @param {Object} args               Fetch arguments.
 * @param {string} args.value         Raw input value.
 * @param {string} [args.status]      Comma-separated list of post statuses.
 * @return {Object} Query for `getEntityRecords`.
 */
export const defaultHandleFetchRequest = ( {
	value,
	status = PUBLIC_STATUSES,
} ) => {
	const input = value.trim().toLowerCase();
	return input ? { search: input, status } : {};
};

export default function JeoAutosuggest( {
	inputProps,
	postType,
	showPrivate = false,
	onSuggestionSelected,
	filterSuggestions = _filterSuggestions,
	getSuggestionValue = _getSuggestionValue,
	handleFetchRequest = defaultHandleFetchRequest,
	renderSuggestion = _renderSuggestion,
} ) {
	const [ query, setQuery ] = useState( {} );
	const [ inputValue, setInputValue ] = useState( '' );
	const [ selectedValue, setSelectedValue ] = useState( null );

	const status = showPrivate ? PRIVATE_STATUSES : PUBLIC_STATUSES;

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

	const hasFinished = useSelect(
		( select ) => {
			return select( 'core/data' ).hasFinishedResolution(
				'core',
				'getEntityRecords',
				[ 'postType', postType, query ]
			);
		},
		[ postType, query ]
	);

	// Users without the `edit_posts` capability for the post type cannot query
	// non-public statuses. Fall back to a publish-only query so the autosuggest
	// keeps working for those users.
	useEffect( () => {
		if (
			hasFinished &&
			entityRecords === null &&
			query.status &&
			query.status !== PUBLIC_STATUSES
		) {
			setQuery( { ...query, status: PUBLIC_STATUSES } );
		}
	}, [ hasFinished, entityRecords, query ] );

	const suggestions = useMemo( () => {
		return ( entityRecords || [] ).filter( filterSuggestions );
	}, [ entityRecords, filterSuggestions ] );

	const debouncedFetchRequest = useMemo( () => {
		return debounce( ( nextValue ) => {
			setQuery( handleFetchRequest( { value: nextValue, status } ) );
		}, 500 );
	}, [ handleFetchRequest, status ] );

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
