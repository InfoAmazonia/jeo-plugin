import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { debounce } from 'lodash-es';

import AsyncComboboxControl from '../shared/async-combobox-control';

import './geo-auto-complete.css';

export default function JeoGeoAutoComplete( {
	className,
	onChange,
	onSelect,
	value,
} ) {
	const [ suggestions, setSuggestions ] = useState( [] );
	const [ isLoading, setIsLoading ] = useState( false );
	const latestRequestRef = useRef( 0 );

	const debouncedLoadSuggestions = useMemo( () => {
			return debounce( ( nextValue ) => {
				const requestId = latestRequestRef.current + 1;
				latestRequestRef.current = requestId;
				setIsLoading( true );
				const requestUrl = new URL( jeo.ajax_url );
				requestUrl.searchParams.set( 'action', 'jeo_geocode' );
				requestUrl.searchParams.set( 'nonce', jeo.geocode_nonce );
				requestUrl.searchParams.set( 'search', nextValue );

				window
					.fetch( requestUrl )
					.then( ( response ) => {
						if ( ! response.ok ) {
							throw new Error( 'Unable to load geocoding suggestions.' );
						}

						return response.json();
					} )
					.then( ( result ) => {
						if ( latestRequestRef.current === requestId ) {
							setSuggestions( result );
					}
				} )
				.catch( () => {
					if ( latestRequestRef.current === requestId ) {
						setSuggestions( [] );
					}
				} )
				.finally( () => {
					if ( latestRequestRef.current === requestId ) {
						setIsLoading( false );
					}
				} );
		}, 500 );
	}, [] );

	useEffect( () => {
		return () => {
			debouncedLoadSuggestions.cancel();
		};
	}, [ debouncedLoadSuggestions ] );

	const currentValue = value || '';

	return (
		<AsyncComboboxControl
			className={ className }
			items={ suggestions }
			inputValue={ currentValue }
			selectedValue={ currentValue || null }
			isLoading={ isLoading }
			placeholder={ __( 'Search address', 'jeo' ) }
			ariaLabel={ __( 'Search address', 'jeo' ) }
			getOptionLabel={ ( suggestion ) => suggestion.full_address }
			getOptionValue={ ( suggestion ) => suggestion.full_address }
			onInputValueChange={ ( nextValue ) => {
				onChange?.( nextValue );

				if ( nextValue.trim().length <= 2 ) {
					debouncedLoadSuggestions.cancel();
					setSuggestions( [] );
					setIsLoading( false );
					return;
				}

				debouncedLoadSuggestions( nextValue );
			} }
			onOptionSelect={ ( suggestion ) => {
				if ( ! suggestion ) {
					return;
				}

				onChange?.( suggestion.full_address );
				onSelect?.( suggestion );
			} }
			renderItem={ ( suggestion ) => (
				<div className="jeo-geo-autocomplete">{ suggestion.full_address }</div>
			) }
			allowReset={ false }
		/>
	);
}
