import React from 'react';
import { Fragment, useEffect } from '@wordpress/element';
import CircleEditor from './editors/circle';
import BarscaleEditor from './editors/barscale';
import SimplecolorEditor from './editors/simplecolor';
import IconsEditor from './editors/icons';

class LegendTypeEdition extends React.Component {
	constructor( props ) {
		super( props );

		this.legendTypes = Object.keys( JeoLegendTypes.legendTypes );
		this.state = {
			legendObject: props.legendObject,
			updatedLegendType: props.updatedLegendType,
		};
	}

	static getDerivedStateFromProps( nextProps ) {
		return {
			updatedLegendType: nextProps.updatedLegendType,
		};
	}

	render() {
		//console.log(this.state.updatedLegendType, this.state.legendObject.legendSlug);

		const typesEditorComponents = {
			circles: <CircleEditor legendObject={ this.state.legendObject } ></CircleEditor>,
			barscale: <BarscaleEditor legendObject={ this.state.legendObject } ></BarscaleEditor>,
			icons: <IconsEditor legendObject={ this.state.legendObject } ></IconsEditor>,
			'simple-color': <SimplecolorEditor legendObject={ this.state.legendObject } ></SimplecolorEditor>,
		};

		const legendTypeEdition = typesEditorComponents[ this.state.updatedLegendType ];

		return (
			<Fragment>
				{ legendTypeEdition }
			</Fragment>
		);
	}
}

export default LegendTypeEdition;
