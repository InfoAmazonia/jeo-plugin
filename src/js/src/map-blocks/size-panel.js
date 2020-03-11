import { __ } from '@wordpress/i18n';
import { PanelRow, TextControl } from '@wordpress/components';

export default ( { attributes, setAttributes, panel: Panel } ) => {
	const setSize = ( key ) => ( size ) => {
		setAttributes( { ...attributes, [ key ]: size } );
	};

	return (
		<Panel title={ __( 'Size' ) }>
			<PanelRow>
				<TextControl
					label={ __( 'Height' ) }
					value={ attributes.height }
					onChange={ setSize( 'height' ) }
				/>
			</PanelRow>
			<PanelRow>
				<TextControl
					label={ __( 'Width' ) }
					value={ attributes.width }
					onChange={ setSize( 'width' ) }
				/>
			</PanelRow>
		</Panel>
	);
};
