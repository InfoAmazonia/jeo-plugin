import classNames from 'classnames';

export default ( { attributes, className } ) => {
	const style = {};

	// if ( className.includes( 'alignfull' ) ) {
	// 	style.width = '100vw';
	// }

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
