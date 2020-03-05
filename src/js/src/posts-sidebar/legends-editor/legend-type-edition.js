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
		};

		this.inicialLegendType = this.state.legendObject.legendSlug;

	}

	static getDerivedStateFromProps( nextProps ) {
		return {
			legendObject: nextProps.legendObject,
		};
	}

	render() {
		console.log(this.state.legendObject);

		const typesEditorComponents = {
			circles: <CircleEditor legendObject={ this.state.legendObject } initialType={ this.inicialLegendType }></CircleEditor>,
			barscale: <BarscaleEditor legendObject={ this.state.legendObject } initialType={ this.inicialLegendType }></BarscaleEditor>,
			icons: <IconsEditor legendObject={ this.state.legendObject } initialType={ this.inicialLegendType }></IconsEditor>,
			'simple-color': <SimplecolorEditor legendObject={ this.state.legendObject } initialType={ this.inicialLegendType } ></SimplecolorEditor>,
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
