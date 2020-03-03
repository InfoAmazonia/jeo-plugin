import React from 'react';
import { Fragment } from '@wordpress/element';

class SimplecolorEditor extends React.Component {
	render() {
		console.log(this.props.legendObject);
		return (
			<Fragment>
				{ ' Simplecolor ' }
			</Fragment>

		);
	}
}

export default SimplecolorEditor;
