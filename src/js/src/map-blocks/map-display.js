import classNames from 'classnames';

export default ( { attributes, className } ) => {
	const style = {};

	if ( className.includes( 'alignfull' ) ) {
		style.width = '100vw';
	}

	return (
		<div
			className={ classNames( [ 'jeomap', className ] ) }
			data-map_id={ attributes.map_id }
			style={ style }
		/>
	);
};
