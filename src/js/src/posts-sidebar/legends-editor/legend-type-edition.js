import { Fragment } from '@wordpress/element';
import CircleEditor from './editors/circle';
import BarscaleEditor from './editors/barscale';
import SimplecolorEditor from './editors/simplecolor';
import IconsEditor from './editors/icons';

function LegendTypeEdition( { legendObject, hasChanged } ) {
	const legendType = legendObject?.legendSlug || 'barscale';
	const typesEditorComponents = {
		circles: <CircleEditor legendObject={ legendObject } hasChanged={ hasChanged } />,
		barscale: <BarscaleEditor legendObject={ legendObject } hasChanged={ hasChanged } />,
		icons: <IconsEditor legendObject={ legendObject } hasChanged={ hasChanged } />,
		'simple-color': <SimplecolorEditor legendObject={ legendObject } hasChanged={ hasChanged } />,
	};

	return <Fragment>{ typesEditorComponents[ legendType ] || null }</Fragment>;
}

export default LegendTypeEdition;
