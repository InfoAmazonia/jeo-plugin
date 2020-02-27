import { PanelRow } from '@wordpress/components';
import { Fragment, useMemo } from '@wordpress/element';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export function IntervalSelector( {
	startDate: _startDate,
	startLabel,
	endDate: _endDate,
	endLabel,
	onStartChange,
	onEndChange,
} ) {
	const startDate = useMemo( () => {
		return _startDate ? new Date( _startDate ) : new Date();
	}, [ _startDate ] );

	const endDate = useMemo( () => {
		return _endDate ? new Date( _endDate ) : new Date();
	}, [ _endDate ] );

	return (
		<Fragment>
			<PanelRow>
				<label>
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
				<label>
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
		</Fragment>
	);
}
