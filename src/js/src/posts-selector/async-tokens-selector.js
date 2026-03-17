import { useCallback, useMemo, useState } from '@wordpress/element';

import { FormTokenField } from '../shared/wp-form-controls';
import {
	usePaginatedRecords,
	useRecordsByIds,
} from '../shared/rest-records';

const mergeTerms = ( primaryTerms, secondaryTerms ) => {
	const termsById = new Map();

	[ ...primaryTerms, ...secondaryTerms ].forEach( ( term ) => {
		if ( Number.isFinite( Number.parseInt( term?.id, 10 ) ) ) {
			termsById.set( Number.parseInt( term.id, 10 ), term );
		}
	} );

	return Array.from( termsById.values() );
};

export function AsyncTokensSelector( {
	path,
	label,
	onChange: _onChange,
	value,
} ) {
	const [ searchValue, setSearchValue ] = useState( '' );
	const { records: selectedTerms = [] } = useRecordsByIds( {
		path,
		ids: value,
		enabled: value.length > 0,
	} );
	const { records: searchedTerms = [] } = usePaginatedRecords( {
		path,
		enabled: searchValue.trim().length > 0,
		pageSize: 20,
		query: {
			search: searchValue.trim(),
			hide_empty: false,
			order: 'asc',
			orderby: 'name',
		},
	} );
	const knownTerms = useMemo(
		() => mergeTerms( selectedTerms, searchedTerms ),
		[ searchedTerms, selectedTerms ]
	);
	const suggestions = useMemo(
		() => searchedTerms.map( ( item ) => item.name ),
		[ searchedTerms ]
	);

	const displayTransform = useCallback(
		( item ) => {
			const found = knownTerms.find(
				( term ) => term.id === Number.parseInt( item, 10 )
			);
			return found ? found.name : item;
		},
		[ knownTerms ]
	);

	const saveTransform = useCallback(
		( item ) => {
			const found = knownTerms.find(
				( term ) => term.name.toLowerCase() === item.trim().toLowerCase()
			);
			return String( found ? found.id : item );
		},
		[ knownTerms ]
	);

	const onChange = useCallback(
		( nextValue ) => {
			const normalizedValues = nextValue
				.filter( ( id ) => ! Number.isNaN( Number.parseInt( id, 10 ) ) )
				.map( Number );

			_onChange( normalizedValues );
		},
		[ _onChange ]
	);

	return (
		<FormTokenField
			label={ label }
			value={ value }
			suggestions={ suggestions }
			displayTransform={ displayTransform }
			saveTransform={ saveTransform }
			onInputChange={ setSearchValue }
			onChange={ onChange }
		/>
	);
}
