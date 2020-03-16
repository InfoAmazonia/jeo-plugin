import classNames from 'classnames';

export default ( { className, attributes } ) => {
	let width = undefined;

	if ( className.includes( 'alignfull' ) ) {
		width = screen.width;
	}

	return (
		<div
			className={ classNames( [ 'jeomap', className ] ) }
			data-map_id={ attributes.map_id }
			style={ {
				height: attributes.height, //undefined
				width,
			} }
		/>
	);
};
