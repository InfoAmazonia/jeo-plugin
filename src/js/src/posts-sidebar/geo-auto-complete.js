import { Button } from '@wordpress/components';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import AsyncComboboxControl from '../shared/async-combobox-control';

import './geo-auto-complete.css';

function shouldSubmitSearchOnEnter( event ) {
	const targetTagName = event?.target?.tagName;

	if (
		event?.key !== 'Enter' ||
		event?.defaultPrevented ||
		event?.altKey ||
		event?.ctrlKey ||
		event?.metaKey ||
		event?.shiftKey ||
		typeof targetTagName !== 'string' ||
		targetTagName.toUpperCase() !== 'INPUT'
	) {
		return false;
	}

	return true;
}

export default function JeoGeoAutoComplete( {
	className,
	onChange,
	onSelect,
	onSearchRequest,
	value,
} ) {
	const [ inputValue, setInputValue ] = useState( value || '' );
	const [ suggestions, setSuggestions ] = useState( [] );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ hasSearched, setHasSearched ] = useState( false );
	const containerRef = useRef( null );
	const latestRequestRef = useRef( 0 );

	useEffect( () => {
		setInputValue( value || '' );
	}, [ value ] );

	const currentValue = inputValue;
	const searchValue = currentValue.trim();
	const isSearchDisabled = isLoading || searchValue.length <= 2;

	const loadSuggestions = ( nextValue ) => {
		const trimmedValue = nextValue.trim();
		if ( trimmedValue.length <= 2 ) {
			setSuggestions( [] );
			setIsLoading( false );
			setHasSearched( false );
			return;
		}

		onSearchRequest?.( trimmedValue );

		const requestId = latestRequestRef.current + 1;
		latestRequestRef.current = requestId;
		setHasSearched( true );
		setSuggestions( [] );
		setIsLoading( true );

		const requestUrl = new URL( jeo.ajax_url );
		requestUrl.searchParams.set( 'action', 'jeo_geocode' );
		requestUrl.searchParams.set( 'nonce', jeo.geocode_nonce );
		requestUrl.searchParams.set( 'search', trimmedValue );

		window
			.fetch( requestUrl )
			.then( ( response ) => {
				if ( ! response.ok ) {
					throw new Error(
						__( 'Unable to load address suggestions.', 'jeo' )
					);
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
	};

	useEffect( () => {
		const inputElement = containerRef.current?.querySelector(
			'input[role="combobox"]'
		);

		if ( ! inputElement ) {
			return undefined;
		}

		const handleInputKeyDown = ( event ) => {
			if (
				! shouldSubmitSearchOnEnter( event ) ||
				isSearchDisabled ||
				suggestions.length > 0
			) {
				return;
			}

			event.preventDefault();
			event.stopPropagation();
			loadSuggestions( inputElement.value || currentValue );
		};

		inputElement.addEventListener( 'keydown', handleInputKeyDown, true );

		return () => {
			inputElement.removeEventListener( 'keydown', handleInputKeyDown, true );
		};
	}, [ currentValue, isSearchDisabled, suggestions.length ] );

	return (
		<div
			ref={ containerRef }
			className={ [ 'jeo-geo-autocomplete__controls', className ]
				.filter( Boolean )
				.join( ' ' ) }
		>
			<div className="jeo-geo-autocomplete__field">
				<AsyncComboboxControl
					items={ suggestions }
					inputValue={ currentValue }
					selectedValue={ currentValue || null }
					isLoading={ isLoading }
					placeholder={ __( 'Search address', 'jeo' ) }
					ariaLabel={ __( 'Search address', 'jeo' ) }
					getOptionLabel={ ( suggestion ) => suggestion.full_address }
					getOptionValue={ ( suggestion ) => suggestion.full_address }
					onInputValueChange={ ( nextValue ) => {
						latestRequestRef.current += 1;
						setInputValue( nextValue );
						onChange?.( nextValue );
						setSuggestions( [] );
						setIsLoading( false );
						setHasSearched( false );
					} }
					onOptionSelect={ ( suggestion ) => {
						if ( ! suggestion ) {
							return;
						}

						setInputValue( suggestion.full_address );
						onChange?.( suggestion.full_address );
						onSelect?.( suggestion );
					} }
					renderItem={ ( suggestion ) => (
						<div className="jeo-geo-autocomplete">{ suggestion.full_address }</div>
					) }
					allowReset={ false }
					persistFreeText={ false }
					suppressEmptyState={ ! hasSearched }
				/>
			</div>
			<Button
				className="jeo-geo-autocomplete__button"
				variant="secondary"
				type="button"
				onMouseDown={ ( event ) => event.preventDefault() }
				onClick={ () => loadSuggestions( currentValue ) }
				disabled={ isSearchDisabled }
			>
				{ __( 'Search', 'jeo' ) }
			</Button>
		</div>
	);
}
