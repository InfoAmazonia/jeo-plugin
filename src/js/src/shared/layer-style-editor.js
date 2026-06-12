import { useState } from '@wordpress/element';
import { CheckboxControl, Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { RangeControl, TextControl } from './wp-form-controls';

const COLOR_FIELDS = {
	fill: [
		{ key: 'fill-color', label: __( 'Fill Color', 'jeowp' ), default: '#000000' },
		{ key: 'fill-outline-color', label: __( 'Outline Color', 'jeowp' ), default: '#000000' },
	],
	line: [
		{ key: 'line-color', label: __( 'Line Color', 'jeowp' ), default: '#000000' },
	],
	circle: [
		{ key: 'circle-color', label: __( 'Circle Color', 'jeowp' ), default: '#000000' },
		{ key: 'circle-stroke-color', label: __( 'Stroke Color', 'jeowp' ), default: '#000000' },
	],
};

const OPACITY_FIELDS = {
	fill: [
		{ key: 'fill-opacity', label: __( 'Fill Opacity', 'jeowp' ), min: 0, max: 1, step: 0.05, default: 0.6 },
	],
	line: [
		{ key: 'line-opacity', label: __( 'Line Opacity', 'jeowp' ), min: 0, max: 1, step: 0.05, default: 1 },
	],
	circle: [
		{ key: 'circle-opacity', label: __( 'Circle Opacity', 'jeowp' ), min: 0, max: 1, step: 0.05, default: 1 },
	],
};

const NUMERIC_FIELDS = {
	line: [
		{ key: 'line-width', label: __( 'Line Width', 'jeowp' ), min: 0, max: 20, step: 0.5, default: 1 },
	],
	circle: [
		{ key: 'circle-radius', label: __( 'Circle Radius', 'jeowp' ), min: 0, max: 50, step: 0.5, default: 5 },
		{ key: 'circle-stroke-width', label: __( 'Stroke Width', 'jeowp' ), min: 0, max: 20, step: 0.5, default: 0 },
	],
};

const SUPPORTED_TYPES = [ 'fill', 'line', 'circle' ];

export function isStyleableLayerType( type ) {
	return SUPPORTED_TYPES.includes( type );
}

function getNestedValue( obj, path ) {
	return path.split( '.' ).reduce( ( acc, part ) => acc?.[ part ], undefined );
}

function setNestedValue( obj, path, value ) {
	const parts = path.split( '.' );
	const result = { ...obj };
	let current = result;
	for ( let i = 0; i < parts.length - 1; i++ ) {
		current[ parts[ i ] ] = { ...( current[ parts[ i ] ] || {} ) };
		current = current[ parts[ i ] ];
	}
	current[ parts[ parts.length - 1 ] ] = value;
	return result;
}

function ColorPickerField( { label, value, onChange, disabled } ) {
	return (
		<div className="jeo-style-editor-field" style={ { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' } }>
			<label style={ { minWidth: '120px', fontWeight: 500 } }>{ label }</label>
			<input
				type="color"
				value={ value || '#000000' }
				onChange={ ( e ) => onChange( e.target.value ) }
				disabled={ disabled }
				style={ { width: 44, height: 30, border: '1px solid #ddd', borderRadius: 4, padding: 1, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 } }
			/>
			<TextControl
				value={ value || '' }
				onChange={ onChange }
				placeholder="#000000"
				disabled={ disabled }
				style={ { flex: 1 } }
			/>
		</div>
	);
}

export default function LayerStyleEditor( { style, layerType, defaultStyle, onChange, onClose } ) {
	const [ useDefault, setUseDefault ] = useState( !! ( defaultStyle && style?.use_default ) );

	const paint = style?.paint || {};

	const handleToggleDefault = ( checked ) => {
		setUseDefault( checked );
		if ( checked ) {
			onChange( { use_default: true } );
		} else {
			onChange( {} );
		}
	};

	const updatePaint = ( key, value ) => {
		const next = { ...style, use_default: false, paint: { ...paint, [ key ]: value } };
		onChange( next );
	};

	const removePaint = ( key ) => {
		const { [ key ]: _, ...rest } = paint;
		const nextStyle = { ...style, use_default: false, paint: rest };
		if ( Object.keys( rest ).length === 0 ) {
			delete nextStyle.paint;
		}
		onChange( nextStyle );
	};

	const resetField = ( key, defaultValue ) => {
		updatePaint( key, defaultValue );
	};

	if ( ! isStyleableLayerType( layerType ) ) {
		return (
			<Modal
				className="jeo-style-editor-modal"
				title={ __( 'Layer Style', 'jeowp' ) }
				onRequestClose={ onClose }
			>
				<p>{ __( 'Styling is only supported for fill, line, and circle layer types.', 'jeowp' ) }</p>
			</Modal>
		);
	}

	const colorFields = COLOR_FIELDS[ layerType ] || [];
	const opacityFields = OPACITY_FIELDS[ layerType ] || [];
	const numericFields = NUMERIC_FIELDS[ layerType ] || [];

	return (
		<Modal
			className="jeo-style-editor-modal"
			title={ __( 'Layer Style', 'jeowp' ) }
			onRequestClose={ onClose }
		>
			<div style={ { minWidth: 360, maxWidth: 480 } }>
				{ defaultStyle && (
					<fieldset style={ { border: '1px solid #007cba', borderRadius: 6, padding: '12px 16px', marginBottom: 16 } }>
						<legend style={ { fontWeight: 600, padding: '0 8px' } }>
							{ __( 'AI Default Style', 'jeowp' ) }
						</legend>
						<CheckboxControl
							label={ __( 'Use AI-suggested default style', 'jeowp' ) }
							checked={ useDefault }
							onChange={ handleToggleDefault }
						/>
						{ useDefault && (
							<div style={ { marginTop: 8, fontSize: '0.85em', color: '#666' } }>
								{ defaultStyle.filter && (
									<p style={ { margin: '4px 0' } }>
										{ __( 'Filter:', 'jeowp' ) } <code>{ JSON.stringify( defaultStyle.filter ) }</code>
									</p>
								) }
								{ defaultStyle.paint && (
									<p style={ { margin: '4px 0' } }>
										{ __( 'Paint:', 'jeowp' ) } <code>{ JSON.stringify( defaultStyle.paint ) }</code>
									</p>
								) }
							</div>
						) }
					</fieldset>
				) }

				{ colorFields.length > 0 && (
					<fieldset style={ { border: '1px solid #e0e0e0', borderRadius: 6, padding: '12px 16px', marginBottom: 16 } }>
						<legend style={ { fontWeight: 600, padding: '0 8px' } }>{ __( 'Colors', 'jeowp' ) }</legend>
						{ colorFields.map( ( field ) => (
							<ColorPickerField
								key={ field.key }
								label={ field.label }
								value={ paint[ field.key ] }
								onChange={ ( v ) => updatePaint( field.key, v ) }
								disabled={ useDefault }
							/>
						) ) }
					</fieldset>
				) }

				{ opacityFields.length > 0 && (
					<fieldset style={ { border: '1px solid #e0e0e0', borderRadius: 6, padding: '12px 16px', marginBottom: 16 } }>
						<legend style={ { fontWeight: 600, padding: '0 8px' } }>{ __( 'Opacity', 'jeowp' ) }</legend>
						{ opacityFields.map( ( field ) => (
							<RangeControl
								key={ field.key }
								label={ field.label }
								value={ paint[ field.key ] ?? field.default }
								min={ field.min }
								max={ field.max }
								step={ field.step }
								onChange={ ( v ) => updatePaint( field.key, v ) }
								disabled={ useDefault }
							/>
						) ) }
					</fieldset>
				) }

				{ numericFields.length > 0 && (
					<fieldset style={ { border: '1px solid #e0e0e0', borderRadius: 6, padding: '12px 16px', marginBottom: 16 } }>
						<legend style={ { fontWeight: 600, padding: '0 8px' } }>{ __( 'Size', 'jeowp' ) }</legend>
						{ numericFields.map( ( field ) => (
							<RangeControl
								key={ field.key }
								label={ field.label }
								value={ paint[ field.key ] ?? field.default }
								min={ field.min }
								max={ field.max }
								step={ field.step }
								onChange={ ( v ) => updatePaint( field.key, v ) }
								disabled={ useDefault }
							/>
						) ) }
					</fieldset>
				) }
			</div>
		</Modal>
	);
}
