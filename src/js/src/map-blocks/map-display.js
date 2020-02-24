export default ( { attributes } ) => {
	return (
		<div
			className="jeomap"
			data-map_id={ attributes.map_id }
			style={ {
				height: attributes.height,
				width: attributes.width,
			} }
		/>
	);
};
