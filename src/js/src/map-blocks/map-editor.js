export default ( props ) => {
	const { attributes, setAttributes } = props;

	return (
		<form>
			<div>
				<label htmlFor="center-lat">Latitude Center:</label>
				<input
					id="center-lat"
					name="center-lat"
					value={ attributes.centerLat }
					onChange={ ( e ) => setAttributes( { centerLat: Number( e.target.value ) } ) }
				/>
			</div>
			<div>
				<label htmlFor="center-lon">Longitude Center:</label>
				<input
					id="center-lon"
					name="center-lon"
					value={ attributes.centerLon }
					onChange={ ( e ) => setAttributes( { centerLon: Number( e.target.value ) } ) }
				/>
			</div>
			<div>
				<label htmlFor="initial-zoom">Initial Zoom:</label>
				<input
					id="initial-zoom"
					name="initial-zoom"
					value={ attributes.initialZoom }
					onChange={ ( e ) =>
						setAttributes( { initialZoom: Number( e.target.value ) } )
					}
				/>
			</div>
		</form>
	);
};
