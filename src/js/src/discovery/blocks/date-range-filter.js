import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export function createLegacyDateRangePickerValue( startDate, endDate ) {
	const wrapDate = ( date ) => ( {
		toDate: () => date,
		toISOString: () => date.toISOString(),
	} );

	return {
		startDate: wrapDate( startDate ),
		endDate: wrapDate( endDate ),
	};
}

export function formatDateRangeValue( startDate, endDate ) {
	const dateOptions = [
		undefined,
		{ year: '2-digit', month: '2-digit', day: '2-digit' },
	];

	return (
		startDate.toLocaleDateString( ...dateOptions ) +
		' - ' +
		endDate.toLocaleDateString( ...dateOptions )
	);
}

function parseDateValue( value ) {
	if ( ! value ) {
		return null;
	}

	const date = new Date( value );
	return Number.isNaN( date.getTime() ) ? null : date;
}

export default function DateRangeFilter( {
	placeholder,
	value,
	startDate,
	endDate,
	localeInfo,
	onApply,
	onCancel,
} ) {
	const containerRef = useRef( null );
	const [ isOpen, setIsOpen ] = useState( false );
	const [ draftStartDate, setDraftStartDate ] = useState( parseDateValue( startDate ) );
	const [ draftEndDate, setDraftEndDate ] = useState( parseDateValue( endDate ) );

	useEffect( () => {
		if ( isOpen ) {
			return undefined;
		}

		setDraftStartDate( parseDateValue( startDate ) );
		setDraftEndDate( parseDateValue( endDate ) );
		return undefined;
	}, [ endDate, isOpen, startDate ] );

	useEffect( () => {
		if ( ! isOpen ) {
			return undefined;
		}

		const handlePointerDown = ( event ) => {
			if ( ! containerRef.current?.contains( event.target ) ) {
				setIsOpen( false );
				setDraftStartDate( parseDateValue( startDate ) );
				setDraftEndDate( parseDateValue( endDate ) );
			}
		};

		document.addEventListener( 'mousedown', handlePointerDown );

		return () => {
			document.removeEventListener( 'mousedown', handlePointerDown );
		};
	}, [ endDate, isOpen, startDate ] );

	const buttonLabel = useMemo( () => {
		return value || placeholder;
	}, [ placeholder, value ] );

	return (
		<div className="jeo-date-range-filter" ref={ containerRef }>
			<button
				type="button"
				className={ `jeo-date-range-filter__toggle${ value ? ' has-value' : '' }` }
				onClick={ () => setIsOpen( ( currentValue ) => ! currentValue ) }
			>
				{ buttonLabel }
			</button>

			{ isOpen && (
				<div className="jeo-date-range-filter__popover">
					<DatePicker
						inline
						selectsRange
						startDate={ draftStartDate }
						endDate={ draftEndDate }
						onChange={ ( [ nextStartDate, nextEndDate ] ) => {
							setDraftStartDate( nextStartDate );
							setDraftEndDate( nextEndDate );
						} }
					/>

					<div className="jeo-date-range-filter__actions">
						<button
							type="button"
							className="jeo-date-range-filter__action jeo-date-range-filter__action--secondary"
							onClick={ () => {
								setIsOpen( false );
								setDraftStartDate( null );
								setDraftEndDate( null );
								onCancel?.();
							} }
						>
							{ localeInfo?.cancelLabel || __( 'Clear', 'jeo' ) }
						</button>
						<button
							type="button"
							className="jeo-date-range-filter__action jeo-date-range-filter__action--primary"
							disabled={ ! draftStartDate || ! draftEndDate }
							onClick={ () => {
								setIsOpen( false );
								onApply?.(
									undefined,
									createLegacyDateRangePickerValue(
										draftStartDate,
										draftEndDate
									)
								);
							} }
						>
							{ localeInfo?.applyLabel || __( 'Apply', 'jeo' ) }
						</button>
					</div>
				</div>
			) }
		</div>
	);
}
