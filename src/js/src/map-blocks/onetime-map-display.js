export default ( { attributes } ) => {
	return (
		<div
			className="jeomap"
			data-center_lat={ attributes.center_lat }
			data-center_lon={ attributes.center_lon }
			data-initial_zoom={ attributes.initial_zoom }
			data-min_zoom={ attributes.min_zoom }
			data-max_zoom={ attributes.max_zoom }
			data-layers={ JSON.stringify( attributes.layers ) }
		>
			Map goes here.
		</div>
	);
};
