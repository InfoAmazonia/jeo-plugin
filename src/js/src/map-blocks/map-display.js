export default ( { attributes } ) => {
	return (
		<div
			className="jeomap"
			data-map_id={ attributes.map_id }
			data-height={ attributes.height }
			data-width={ attributes.width }
		/>
	);
};
