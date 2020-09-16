import React, { Component } from 'react';
import Map from './map';

class StoryMapDisplay extends Component {
	constructor( props ) {
		super( props );


		this.state = {
			currentChapter: this.props.slides[ 0 ],
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
				zoom={ [ this.state.currentChapter.zoom || 1 ] }
				center={ [
					this.state.currentChapter.longitude,
					this.state.currentChapter.latitude,
				] }
				containerStyle={ { width: '100%', height: '300px', marginLeft: 'auto', marginRight: 'auto' } }
			>
			</Map>
		)
	}
}

const storyMapElement = document.getElementById('story-map');
const storyMapProps = JSON.parse(storyMapElement.getAttribute('data-properties'));

wp.element.render(<StoryMapDisplay { ...storyMapProps } />, storyMapElement);
