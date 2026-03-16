import { PanelRow } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import classNames from 'classnames';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import { toPickerDate } from './date-range';

import './interval-selector.css';

export function IntervalSelector( {
	startDate: _startDate,
	startLabel,
	endDate: _endDate,
	endLabel,
	onStartChange,
	onEndChange,
} ) {
	const startDate = useMemo( () => {
		return toPickerDate( _startDate );
	}, [ _startDate ] );

	const endDate = useMemo( () => {
		return toPickerDate( _endDate );
	}, [ _endDate ] );
	return (
		<div className="jeo-interval-selector">
			<PanelRow>
				<label className={ classNames( [ _startDate || 'empty-selector' ] ) }>
					{ startLabel }
					<DatePicker
						dateFormat="yyyy-MM-dd"
						selected={ startDate }
						selectsStart
						startDate={ startDate }
						endDate={ endDate }
						onChange={ onStartChange }
					/>
				</label>
			</PanelRow>

			<PanelRow>
				<label className={ classNames( [ _endDate || 'empty-selector' ] ) }>
					{ endLabel }
					<DatePicker
						dateFormat="yyyy-MM-dd"
						selected={ endDate }
						selectsEnd
						startDate={ startDate }
						endDate={ endDate }
						onChange={ onEndChange }
					/>
				</label>
			</PanelRow>
		</div>
	);
}
