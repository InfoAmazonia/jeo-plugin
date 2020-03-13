import { SelectControl } from '@wordpress/components';
import { Fragment, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import './interaction-settings.css';

export default function InteractionSettings( {
	layer,
} ) {
	const titleOptions = useMemo( () => {
		return Object.keys( layer.fields ).map( ( field ) => {
			return { label: field, value: field };
		} );
	}, [ layer.fields ] );

	return (
		<Fragment>
			<tr className="jeo-interaction-settings">
				<td>{ layer.id }</td>
				<td>
					<SelectControl
						options={ [
							{ label: __( 'Disabled', 'jeo' ), value: 'none' },
							{ label: __( 'Show on click', 'jeo' ), value: 'click' },
							{ label: __( 'Show on hover', 'jeo' ), value: 'mouseover' },
						] }
					/>
				</td>
				<td>
					<SelectControl
						options={ titleOptions }
					/>
				</td>
			</tr>
			<tr>
				<td colSpan="3">TODO</td>
			</tr>
		</Fragment>
	);
}
