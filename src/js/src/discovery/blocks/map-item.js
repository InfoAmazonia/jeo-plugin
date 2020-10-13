import { Component } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

class MapItem extends Component {
	constructor(props) {
		super(props);

		this.state = {
			displayLayers: false,
		}

		this.clearAllLayers = this.clearAllLayers.bind(this);
		this.applyAllLayers = this.applyAllLayers.bind(this);
	}

	clearAllLayers() {
		const map = this.props.map;
		const selectedLayers = this.props.selectedLayers;

		const layersBatch = Object.keys(selectedLayers).map( layerId => selectedLayers[layerId] ).filter(layer => selectedLayers[ layer.id ].map.id === map.id)
		this.props.toggleLayersBatch(layersBatch)
	}

	applyAllLayers() {
		const { queriedLayers } = this.props.map;
		this.props.toggleLayersBatch(queriedLayers)
	}

	render() {
		const map = this.props.map;
		const selectedLayers = this.props.selectedLayers;

		const isCurrentMapLayer = ( layer ) => {
			return selectedLayers[ layer.id ].map.id === map.id;
		};

		const layerToggleClassName = ( layer ) => {
			const defaultClasses = "layer-toggle";

			if(selectedLayers.hasOwnProperty( layer.id )) {
				return isCurrentMapLayer( layer )? `${defaultClasses} current-map-layer` : `${defaultClasses} no-current-map-layer`;
			}

			return defaultClasses;
		}

		const layersToggle = map.queriedLayers? map.queriedLayers.map( ( layer, index ) => {
			return (
				<button key={ index } className={ layerToggleClassName( layer ) } onClick={ ( ) => this.props.toggleLayer(layer) }>
					{ !selectedLayers.hasOwnProperty( layer.id )?
						 <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="toggle-off" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" class="svg-inline--fa fa-toggle-off fa-w-18 fa-3x"><path fill="currentColor" d="M384 64H192C85.961 64 0 149.961 0 256s85.961 192 192 192h192c106.039 0 192-85.961 192-192S490.039 64 384 64zM64 256c0-70.741 57.249-128 128-128 70.741 0 128 57.249 128 128 0 70.741-57.249 128-128 128-70.741 0-128-57.249-128-128zm320 128h-48.905c65.217-72.858 65.236-183.12 0-256H384c70.741 0 128 57.249 128 128 0 70.74-57.249 128-128 128z"></path></svg> :
						 <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="toggle-on" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" class="svg-inline--fa fa-toggle-on fa-w-18 fa-3x"><path fill="currentColor" d="M384 64H192C86 64 0 150 0 256s86 192 192 192h192c106 0 192-86 192-192S490 64 384 64zm0 320c-70.8 0-128-57.3-128-128 0-70.8 57.3-128 128-128 70.8 0 128 57.3 128 128 0 70.8-57.3 128-128 128z"></path></svg>
					}

					<span> { decodeEntities(layer.title.rendered) } </span>
				</button>
			)
		}): []

		const applyRemoveButton = map.queriedLayers.some( ( layer ) => Object.keys(selectedLayers).map( layerId => parseInt(layerId) ).includes( layer.id ) );

		if(!map.queriedLayers.length) {
			return "";
		}

		return (
			<div className="map-item">
				<div className="title">
					{ decodeEntities(map.title.rendered) }
				</div>

				<div className="description" dangerouslySetInnerHTML={ {"__html": map.excerpt.rendered } }></div>

				<button className="layers-toggle" onClick={ () => this.setState( ( state ) => ({
					displayLayers: !state.displayLayers,
				} ) ) }>
					<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" viewBox="0 0 40 40">
						<path d="M 4,13 20,4 36,13 20,22 Z" fill="#555D66" />
						<path d="M 8.1777,24.65 4,27 20,36 36,27 31.8222,24.65 20,31.3 Z" fill="#a0a5aa" />
						<path d="M 8.1777,17.65 4,20 20,29 36,20 31.8222,17.65 20,24.3 Z" fill="#a0a5aa" />
					</svg>

					{  map.queriedLayers? map.queriedLayers.length + " " : "" }
					{ __("layers", "jeo") }
					{ this.state.displayLayers? " ▴" : " ▾" }

				</button>

				<button className={ "apply-remove-all" + (applyRemoveButton? " clear" : "" ) } onClick={  applyRemoveButton? this.clearAllLayers : this.applyAllLayers  }>
					{  applyRemoveButton?  <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="minus" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M416 208H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h384c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"></path></svg>	: <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="plus" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z" class=""></path></svg>  }
					{  applyRemoveButton?  __("Clear", "jeo")	: __("Apply", "jeo")  }
				</button>

				<div className="layers-toggles">
					{ this.state.displayLayers? layersToggle : null }
				</div>


			</div>
		)
	}

}

export default MapItem;
