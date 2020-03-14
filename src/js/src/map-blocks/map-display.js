import classNames from 'classnames'

export default ( { attributes, className } ) => {
	return (
		<div
			className={ classNames( [ 'jeomap', className ] ) }
			data-map_id={ attributes.map_id }
			style={ {
				height: attributes.height,
				width: attributes.width,
			} }
		/>
	);
};
