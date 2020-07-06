import {
	Button,
	PanelRow,
	SelectControl,
	TextControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import './meta-selector.css';

const comparators =
	'=,!=,>,>=,<,<=,LIKE,NOT LIKE,IN,NOT IN,BETWEEN,NOT BETWEEN,NOT EXISTS,REGEXP,NOT REGEXP,RLIKE';
const compareOptions = comparators.split( ',' ).map( ( comp ) => {
	return { label: comp, value: comp };
} );

function replace( arr, i, added = [] ) {
	return [ ...arr.slice( 0, i ), ...added, ...arr.slice( i + 1 ) ];
}

export function MetaSelector( { label, onChange, value: _metas } ) {
	const metas = _metas || [];

	return (
		<PanelRow className="jeo-meta-selector">
			<label>{ label }</label>

			{ metas.map( ( meta, i ) => (
				<fieldset key={ i }>
					<PanelRow>
						<TextControl
							label={ __( 'Key' ) }
							value={ meta.key }
							onChange={ ( key ) => {
								onChange( replace( metas, i, [ { ...metas[ i ], key } ] ) );
							} }
						/>
					</PanelRow>

					<PanelRow>
						<SelectControl
							label={ __( 'Comparator' ) }
							options={ compareOptions }
							value={ meta.compare }
							onChange={ ( compare ) => {
								onChange( replace( metas, i, [ { ...metas[ i ], compare } ] ) );
							} }
						/>
					</PanelRow>

					<PanelRow>
						<TextControl
							label={ __( 'Value' ) }
							value={ meta.value }
							onChange={ ( value ) => {
								onChange( replace( metas, i, [ { ...metas[ i ], value } ] ) );
							} }
						/>
					</PanelRow>

					<Button
						isPrimary
						isDestructive
						onClick={ () => {
							onChange( replace( metas, i ) );
						} }
					>
						{ __( 'Remove' ) }
					</Button>
				</fieldset>
			) ) }

			<div>
				<Button
					isPrimary
					onClick={ () => {
						onChange( [ ...metas, { key: '', value: '', compare: '=' } ] );
					} }
				>
					{ __( 'Add' ) }
				</Button>
			</div>
		</PanelRow>
	);
}
