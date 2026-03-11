import classNames from 'classnames';
import { useBlockProps } from '@wordpress/block-editor';

// Legacy save component – kept for deprecated block migration
export default ( { attributes, className } ) => {
	const style = {};

	return (
		<div
			// creating map_id_{id} as a class instead as an element of dataset
			// bypassing wp unfiltered_html permission
			className={ classNames( [ 'jeomap', className, 'map_id_'+attributes.map_id ] ) }
			// this element block validation error with roles without unfiltered_html capability
			// data-map_id={ attributes.map_id }
			style={ style }
		/>
	);
};

// New save component with useBlockProps.save() for API v2+
export const MapSave = ( { attributes } ) => {
	const blockProps = useBlockProps.save( {
		className: classNames( [ 'jeomap', 'map_id_'+attributes.map_id ] ),
	} );

	return (
		<div { ...blockProps } />
	);
};
