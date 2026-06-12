import { useEffect, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

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

const normalizeTagIds = ( value ) => {
	const values = Array.isArray( value )
		? value
		: String( value ?? '' ).split( ',' );

	return Array.from(
		new Set(
			values
				.map( ( termId ) => Number.parseInt( termId, 10 ) )
				.filter( ( termId ) => Number.isFinite( termId ) && termId > 0 )
		)
	);
};

export default function TagFilterControl( { value, onChange, onSelectedLabelChange } ) {
	const [ searchValue, setSearchValue ] = useState( '' );
	const selectedIds = normalizeTagIds( value );
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
	const selectedLabel = selectedTerms.map( ( term ) => term.name ).join( ', ' );
	const availableTerms = useMemo(
		() =>
			searchedTerms.filter(
				( term ) => ! selectedIds.includes( Number.parseInt( term.id, 10 ) )
			),
		[ searchedTerms, selectedIds ]
	);
	const commitSelection = ( nextIds, nextTerms = selectedTerms ) => {
		const normalizedNextIds = normalizeTagIds( nextIds );
		const labels = normalizedNextIds
			.map( ( termId ) =>
				nextTerms.find(
					( term ) => Number.parseInt( term.id, 10 ) === termId
				)?.name
			)
			.filter( Boolean )
			.join( ', ' );

		onChange( normalizedNextIds, labels );
	};

	useEffect( () => {
		onSelectedLabelChange?.( selectedLabel );
	}, [ onSelectedLabelChange, selectedLabel ] );

	return (
		<div className="discovery-tag-filter">
			<AsyncComboboxControl
				className="discovery-tag-filter__combobox"
				items={ availableTerms }
				inputValue={ searchValue }
				selectedValue={ null }
				isLoading={ isLoading }
				placeholder={ __( 'Tags', 'jeowp' ) }
				ariaLabel={ __( 'Filter stories by tag', 'jeowp' ) }
				getOptionLabel={ ( suggestion ) => suggestion.name }
				getOptionValue={ ( suggestion ) => suggestion.id }
				onInputValueChange={ ( nextValue ) => {
					setSearchValue( nextValue );
				} }
				onOptionSelect={ ( suggestion ) => {
					if ( ! suggestion ) {
						setSearchValue( '' );
						return;
					}

					const nextIds = [ ...selectedIds, suggestion.id ];
					const nextTerms = mergeTerms( knownTerms, [ suggestion ] );
					setSearchValue( '' );
					commitSelection( nextIds, nextTerms );
				} }
				renderItem={ ( suggestion ) => (
					<div className="discovery-tag-filter__item">{ suggestion.name }</div>
				) }
				persistFreeText={ false }
			/>

			{ selectedTerms.length ? (
				<div className="discovery-tag-filter__tokens">
					{ selectedTerms.map( ( term ) => (
						<span className="discovery-tag-filter__token" key={ term.id }>
							<span>{ term.name }</span>
							<button
								type="button"
								aria-label={ sprintf(
									/* translators: %s: selected tag name. */
									__( 'Remove tag %s', 'jeowp' ),
									term.name
								) }
								onClick={ () =>
									commitSelection(
										selectedIds.filter(
											( termId ) =>
												termId !== Number.parseInt( term.id, 10 )
										)
									)
								}
							>
								<svg
									aria-hidden="true"
									focusable="false"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
								>
									<path
										fill="currentColor"
										d="M12 10.94l3.71-3.71 1.06 1.06L13.06 12l3.71 3.71-1.06 1.06L12 13.06l-3.71 3.71-1.06-1.06L10.94 12 7.23 8.29l1.06-1.06L12 10.94z"
									/>
								</svg>
							</button>
						</span>
					) ) }
				</div>
			) : null }
		</div>
	);
}
