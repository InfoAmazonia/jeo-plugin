import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import AsyncComboboxControl from '../../shared/async-combobox-control';
import {
	usePaginatedRecords,
	useRecordsByIds,
} from '../../shared/rest-records';

const mergeTerms = ( primaryTerms, secondaryTerms ) => {
	const recordsById = new Map();

	[ ...primaryTerms, ...secondaryTerms ].forEach( ( term ) => {
		if ( Number.isFinite( Number.parseInt( term?.id, 10 ) ) ) {
			recordsById.set( Number.parseInt( term.id, 10 ), term );
		}
	} );

	return Array.from( recordsById.values() );
};

export default function TagFilterControl( { value, onChange } ) {
	const [ searchValue, setSearchValue ] = useState( '' );
	const selectedIds = value ? [ value ] : [];
	const { records: selectedTerms = [] } = useRecordsByIds( {
		path: '/wp/v2/tags',
		ids: selectedIds,
		enabled: selectedIds.length > 0,
	} );
	const { records: searchedTerms = [], isLoading } = usePaginatedRecords( {
		path: '/wp/v2/tags',
		enabled: searchValue.trim().length > 0,
		pageSize: 20,
		query: {
			search: searchValue.trim(),
			hide_empty: false,
			order: 'desc',
			orderby: 'count',
		},
	} );
	const knownTerms = useMemo(
		() => mergeTerms( selectedTerms, searchedTerms ),
		[ searchedTerms, selectedTerms ]
	);
	const selectedTerm = selectedTerms[ 0 ] || null;

	return (
		<AsyncComboboxControl
			className="discovery-tag-filter"
			items={ searchedTerms }
			inputValue={ searchValue }
			selectedValue={ selectedTerm?.id ?? null }
			isLoading={ isLoading }
			placeholder={ __( 'Tags', 'jeo' ) }
			ariaLabel={ __( 'Filter stories by tag', 'jeo' ) }
			getOptionLabel={ ( suggestion ) => suggestion.name }
			getOptionValue={ ( suggestion ) => suggestion.id }
			onInputValueChange={ ( nextValue ) => {
				setSearchValue( nextValue );

				if ( value ) {
					onChange( '' );
				}
			} }
			onOptionSelect={ ( suggestion ) => {
				if ( ! suggestion ) {
					setSearchValue( '' );
					onChange( '' );
					return;
				}

				setSearchValue( suggestion.name );
				onChange( suggestion.id );
			} }
			renderItem={ ( suggestion ) => (
				<div className="discovery-tag-filter__item">{ suggestion.name }</div>
			) }
			allowReset
			persistFreeText={ false }
		/>
	);
}
