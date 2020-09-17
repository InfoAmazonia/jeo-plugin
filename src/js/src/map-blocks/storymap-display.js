import React, { Component } from 'react';

import mapboxgl from 'mapbox-gl';
import scrollama from 'scrollama';
import Map from './map';

import './storymap-display.css';

const layerTypes = {
    'fill': ['fill-opacity'],
    'line': ['line-opacity'],
    'circle': ['circle-opacity', 'circle-stroke-opacity'],
    'symbol': ['icon-opacity', 'text-opacity'],
    'raster': ['raster-opacity'],
    'fill-extrusion': ['fill-extrusion-opacity']
}

const alignments = {
    'left': 'lefty',
    'center': 'centered',
    'right': 'righty'
}

let config = null;

const { map_defaults: mapDefaults } = window.jeo_settings;

const scroller = scrollama();;


class StoryMapDisplay extends Component {
    constructor(props) {
		super(props);

		const slides = [];
		props.slides.map( ( slide, index ) => {
			slides.push( {
				id: slide.title || index,
				title: slide.title || '',
				image: '',
				description: slide.content || '',
				location: {
					center: [ slide.longitude || mapDefaults.lng, slide.latitude || mapDefaults.lat ],
					zoom: slide.zoom || mapDefaults.zoom,
					pitch: slide.pitch || 0,
					bearing: slide.bearing || 0,
				},
				onChapterEnter: [
					{
						layer: 'gnpglaciers-1998',
						opacity: 1
					},
					{
						layer: 'glaciernp-boundary',
						opacity: 1
					}
				],
				onChapterExit: [
				  {
					  layer: 'gnpglaciers-1998',
					  opacity: 1
				  },
				],
			} );
		} );

		config = {
			style: 'mapbox://styles/branigan/cjz37rcb003ib1cr3s8rnkt2d',
			accessToken: window.jeo_settings.mapbox_key,
			showMarkers: false,
			theme: 'light',
			alignment: 'left',
			title: props.title || '',
			subtitle: props.description || '',
			byline: '',
			footer: '',
			chapters: slides,
		}

        this.state = {
			currentChapter: config.chapters[0],
			map: null,
        };
        // this.setState = this.setState.bind(this);
    }

    componentDidMount() {
        mapboxgl.accessToken = config.accessToken;
        window.addEventListener('resize', scroller.resize);
    }

    render() {
		const mapStart = config.chapters[0].location;
        const theme = config.theme;
        const currentChapterID = this.state.currentChapter.id;
        return (
	<div>
		<Map
			zoom={ [ mapStart.zoom ] }
			pitch={ [ mapStart.pitch ] }
			bearing={ [ mapStart.bearing ] }
			style={ config.style }
			center={ mapStart.center }
			onStyleDataLoading={ ( map ) => {
				this.setState( { ...this.state, map } );
			} }
			onStyleLoad={ ( map ) => {
				const setState = this.setState.bind(this);
				const marker = new mapboxgl.Marker();
				if (config.showMarkers) {
					marker.setLngLat(mapStart.center).addTo(map);
				}

				scroller
					.setup({
						step: '.step',
						offset: 0.5,
						progress: true
					})
					.onStepEnter(response => {
						const chapter = config.chapters.find(chap => {
							return chap.id == response.element.id
						});
						
						setState({ ...this.state, currentChapter:chapter });
						map.flyTo(chapter.location);
						if (config.showMarkers) {
							marker.setLngLat(chapter.location.center);
						}
						
				})
			} }
		>
		</Map>
		<div id="story">
			{ config.title &&
			<div id="header" className={ theme }>
				<h1>{ config.title }</h1>
				{ config.subtitle &&
				<h2>{ config.subtitle }</h2>
                            }
				{ config.byline &&
				<p>{ config.byline }</p>
                            }
			</div>
                    }
			<div id="features" className={ alignments[config.alignment] }>
				{
                            config.chapters.map(chapter => 
	<Chapter key={ chapter.id } theme={ theme } { ...chapter } currentChapterID={ currentChapterID } />
                            )
                        }
			</div>
			{ config.footer &&
			<div id="footer" className={ theme }>
				<p>{ config.footer }</p>
			</div>
                    }
		</div>
	</div>
        );
    }

}

function Chapter({id, theme, title, image, description, currentChapterID}) {
    const classList = id === currentChapterID ? "step active" : "step";
    return (
	<div id={ id } className={ classList }>
		<div className={ theme }>
			{ title &&
			<h3 className="title">{ title }</h3>
                }
			{ image &&
			<img src={ image } alt={ title }></img>
                }
			{ description &&
			<p>{ description }</p>
                }
		</div>
	</div>
    )
}

const storyMapElement = document.getElementById('story-map');
let storyMapProps = null;
if(storyMapElement) {
	storyMapProps = JSON.parse(storyMapElement.getAttribute('data-properties'));
	wp.element.render(<StoryMapDisplay { ...storyMapProps } />, storyMapElement);
}

