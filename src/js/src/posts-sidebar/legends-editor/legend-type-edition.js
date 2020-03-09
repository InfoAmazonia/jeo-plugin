import { Component, Fragment, useEffect } from '@wordpress/element';
import CircleEditor from './editors/circle';
import BarscaleEditor from './editors/barscale';
import SimplecolorEditor from './editors/simplecolor';
import IconsEditor from './editors/icons';

class LegendTypeEdition extends Component {
	constructor( props ) {
		super( props );

		this.hasChanged = this.hasChanged.bind( this );
		this.legendTypes = Object.keys( JeoLegendTypes.legendTypes );
		this.state = {
			legendObject: props.legendObject,
		};
	}

	static getDerivedStateFromProps( nextProps ) {
		return {
			legendObject: nextProps.legendObject,
		};
	}

	hasChanged( legendObject ) {
		this.props.hasChanged( legendObject );
	}

	render() {
		const typesEditorComponents = {
			circles: <CircleEditor legendObject={ this.state.legendObject } hasChanged={ this.hasChanged } ></CircleEditor>,
			barscale: <BarscaleEditor legendObject={ this.state.legendObject } ></BarscaleEditor>,
			icons: <IconsEditor legendObject={ this.state.legendObject } hasChanged={ this.hasChanged } ></IconsEditor>,
			'simple-color': <SimplecolorEditor legendObject={ this.state.legendObject } hasChanged={ this.hasChanged } ></SimplecolorEditor>,
		};

		const legendTypeEdition = typesEditorComponents[ this.state.legendObject.legendSlug ];

		return (
			<Fragment>
				{ legendTypeEdition }
			</Fragment>
		);
	}
}

export default LegendTypeEdition;
