import React, { Component } from 'react';
import Map from './map';

class StoryMapDisplay extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			currentChapter: this.props.attributes.slides[ 0 ],
		}
	}

    render() {
		return(
			<Map
				onStyleLoad={ ( map ) => {
					map.scrollZoom.disable();
					map.dragPan.disable();
					map.touchZoomRotate.disable();
					map.dragRotate.disable();
				} }
				style="mapbox://styles/mapbox/streets-v11"
				zoom={ [ this.state.currentChapter.zoom ] }
				center={ [
					this.state.currentChapter.longitude,
					this.state.currentChapter.latitude,
				] }
				containerStyle={ { height: '50vh' } }
			>
			</Map>
		)
	}
}

export default StoryMapDisplay;