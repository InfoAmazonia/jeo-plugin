import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getDateFnsLocale, normalizeLocaleCode } from '../../shared/locale';

const DEFAULT_MIN_YEAR = 1900;
const DEFAULT_MAX_YEAR_OFFSET = 1;

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
		normalizeLocaleCode(),
		{ year: '2-digit', month: '2-digit', day: '2-digit' },
	];

	return (
		startDate.toLocaleDateString( ...dateOptions ) +
		' - ' +
		endDate.toLocaleDateString( ...dateOptions )
	);
}

export function getDateRangeYearOptions(
	date,
	{
		minYear = DEFAULT_MIN_YEAR,
		maxYear = new Date().getFullYear() + DEFAULT_MAX_YEAR_OFFSET,
	} = {}
) {
	const selectedYear = date?.getFullYear?.();
	const years = [];
	const firstYear = Math.min(
		minYear,
		Number.isFinite( selectedYear ) ? selectedYear : minYear
	);
	const lastYear = Math.max(
		maxYear,
		Number.isFinite( selectedYear ) ? selectedYear : maxYear
	);

	for ( let year = lastYear; year >= firstYear; year-- ) {
		years.push( year );
	}

	return years;
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
	const datePickerLocale = useMemo( () => getDateFnsLocale(), [] );
	const monthNames = localeInfo?.monthNames || [
		__( 'January', 'jeowp' ),
		__( 'February', 'jeowp' ),
		__( 'March', 'jeowp' ),
		__( 'April', 'jeowp' ),
		__( 'May', 'jeowp' ),
		__( 'June', 'jeowp' ),
		__( 'July', 'jeowp' ),
		__( 'August', 'jeowp' ),
		__( 'September', 'jeowp' ),
		__( 'October', 'jeowp' ),
		__( 'November', 'jeowp' ),
		__( 'December', 'jeowp' ),
	];
	const minYear = Number.parseInt( localeInfo?.minYear, 10 );
	const maxYear = Number.parseInt( localeInfo?.maxYear, 10 );
	const yearOptionsConfig = {
		...( Number.isFinite( minYear ) ? { minYear } : {} ),
		...( Number.isFinite( maxYear ) ? { maxYear } : {} ),
	};
	const renderDatePickerHeader = ( {
		date,
		changeYear,
		changeMonth,
		decreaseMonth,
		increaseMonth,
		prevMonthButtonDisabled,
		nextMonthButtonDisabled,
	} ) => (
		<div className="jeo-date-range-filter__header">
			<button
				type="button"
				className="jeo-date-range-filter__navigation"
				aria-label={ __( 'Previous month', 'jeowp' ) }
				disabled={ prevMonthButtonDisabled }
				onClick={ decreaseMonth }
			>
				<svg
					aria-hidden="true"
					focusable="false"
					viewBox="0 0 24 24"
				>
					<path
						fill="currentColor"
						d="M14.7 6.7 10.4 12l4.3 5.3-1.4 1.4L8.6 12l4.7-6.7z"
					/>
				</svg>
			</button>
			<select
				className="jeo-date-range-filter__month-select"
				aria-label={ __( 'Month', 'jeowp' ) }
				value={ date.getMonth() }
				onChange={ ( event ) => changeMonth( Number( event.target.value ) ) }
			>
				{ monthNames.map( ( monthName, monthIndex ) => (
					<option key={ monthName } value={ monthIndex }>
						{ monthName }
					</option>
				) ) }
			</select>
			<select
				className="jeo-date-range-filter__year-select"
				aria-label={ __( 'Year', 'jeowp' ) }
				value={ date.getFullYear() }
				onChange={ ( event ) => changeYear( Number( event.target.value ) ) }
			>
				{ getDateRangeYearOptions( date, yearOptionsConfig ).map( ( year ) => (
					<option key={ year } value={ year }>
						{ year }
					</option>
				) ) }
			</select>
			<button
				type="button"
				className="jeo-date-range-filter__navigation"
				aria-label={ __( 'Next month', 'jeowp' ) }
				disabled={ nextMonthButtonDisabled }
				onClick={ increaseMonth }
			>
				<svg
					aria-hidden="true"
					focusable="false"
					viewBox="0 0 24 24"
				>
					<path
						fill="currentColor"
						d="M9.3 18.7 13.6 12 9.3 6.7l1.4-1.4 4.7 6.7-4.7 6.7z"
					/>
				</svg>
			</button>
		</div>
	);

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
				aria-expanded={ isOpen }
				aria-haspopup="dialog"
				onClick={ () => setIsOpen( ( currentValue ) => ! currentValue ) }
			>
				{ buttonLabel }
			</button>

			{ isOpen && (
				<div className="jeo-date-range-filter__popover">
					<DatePicker
						inline
						selectsRange
						locale={ datePickerLocale }
						startDate={ draftStartDate }
						endDate={ draftEndDate }
						renderCustomHeader={ renderDatePickerHeader }
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
							{ localeInfo?.cancelLabel || __( 'Clear', 'jeowp' ) }
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
							{ localeInfo?.applyLabel || __( 'Apply', 'jeowp' ) }
						</button>
					</div>
				</div>
			) }
		</div>
	);
}
