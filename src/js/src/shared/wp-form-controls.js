import {
	CheckboxControl as WPCheckboxControl,
	ComboboxControl as WPComboboxControl,
	FormTokenField as WPFormTokenField,
	RadioControl as WPRadioControl,
	RangeControl as WPRangeControl,
	SelectControl as WPSelectControl,
	TextControl as WPTextControl,
	TextareaControl as WPTextareaControl,
} from '@wordpress/components';

const nextInputControlProps = {
	__next40pxDefaultSize: true,
	__nextHasNoMarginBottom: true,
};

const nextCheckboxControlProps = {
	__nextHasNoMarginBottom: true,
};

export function CheckboxControl( props ) {
	return <WPCheckboxControl { ...nextCheckboxControlProps } { ...props } />;
}

export function ComboboxControl( props ) {
	return <WPComboboxControl { ...nextInputControlProps } { ...props } />;
}

export function SelectControl( props ) {
	return <WPSelectControl { ...nextInputControlProps } { ...props } />;
}

export function TextControl( props ) {
	return <WPTextControl { ...nextInputControlProps } { ...props } />;
}

export function RangeControl( props ) {
	return <WPRangeControl { ...nextInputControlProps } { ...props } />;
}

export function FormTokenField( props ) {
	return <WPFormTokenField { ...nextInputControlProps } { ...props } />;
}

export function RadioControl( props ) {
	return <WPRadioControl { ...nextCheckboxControlProps } { ...props } />;
}

export function TextareaControl( props ) {
	return <WPTextareaControl { ...nextInputControlProps } { ...props } />;
}
