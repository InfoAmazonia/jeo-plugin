export default ( { attributes } ) => {
	return (
		<div
			className="map"
			data-center-lat={ attributes.centerLat }
			data-center-lon={ attributes.centerLon }
			data-initial-zoom={ attributes.initialZoom }
			data-layers={ JSON.stringify( attributes.layers ) }
		>
			Map goes here.
		</div>
	);
};
