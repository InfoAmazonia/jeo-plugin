export default function RadioControl( { checked, label, value, onChange } ) {
	return (
		<div className="components-radio-control__option">
			<label>
				<input
					type="radio"
					value={ value }
					checked={ checked }
					onChange={ onChange }
				/>
				<span>{ label }</span>
			</label>
		</div>
	);
}
