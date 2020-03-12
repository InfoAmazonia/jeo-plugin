import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import './interaction-settings.css';

export default function InteractionSettings( {
	layer,
} ) {
	return (
		<div className="jeo-interaction-settings">
			<span>{ layer.id }</span>
			<SelectControl
				label={ __( 'Show on', 'jeo' ) }
				options={ [
					{ label: 'none', value: 'none' },
					{ label: 'click', value: 'click' },
					{ label: 'mouseover', value: 'hover' },
				] }
			/>
		</div>
	);
}
