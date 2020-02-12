import React from 'react';
import classNames from 'classnames';
import { TabPanel } from '@wordpress/components';
import './tab-panel.css';

export default function( { children, className, ...props } ) {
	return (
		<TabPanel
			className={ classNames( [ 'jeo-tab-panel', className ] ) }
			{ ...props }
		>
			{ children }
		</TabPanel>
	);
}
