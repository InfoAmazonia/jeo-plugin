import { compose, ifCondition } from '@wordpress/compose';
import { registerFormatType, toggleFormat } from '@wordpress/rich-text';
import { RichTextToolbarButton } from '@wordpress/block-editor';
import { withSelect } from '@wordpress/data';

const CustomTooltip = props => {
    return <RichTextToolbarButton
        icon='format-quote'
        title='Tooltip'
        onClick={ () => {
            props.onChange( toggleFormat(
                props.value,
                { type: 'jeotheme/tooltip' }
            ) );
        } }
        isActive={ props.isActive }
    />
};
 
const ConditionalButton = compose(
    withSelect( function( select ) {
        return {
            selectedBlock: select( 'core/editor' ).getSelectedBlock()
        }
    } ),
    ifCondition( function( props ) {
        return (
            props.selectedBlock &&
            props.selectedBlock.name === 'core/paragraph'
        );
    } )
)( CustomTooltip );
 
registerFormatType(
    'jeotheme/tooltip', {
        title: 'Tooltip',
        tagName: 'span',
        className: 'tooltip-block',
        edit: ConditionalButton,
    }
);