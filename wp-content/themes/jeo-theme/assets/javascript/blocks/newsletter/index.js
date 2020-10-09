import {
  RichText,
  InnerBlocks,
} from "@wordpress/block-editor";

import { __ } from "@wordpress/i18n";
import { Button, SelectControl, TextControl } from "@wordpress/components";
//const {  } = wp.editor;

wp.blocks.registerBlockType("jeo-theme/custom-newsletter-block", {
  title: "Newsletter",
  icon: "email",
  category: "common",
  supports: {
    align: true,
  },
  attributes: {
    title: {
      type: "string",
    },

    typeNews: {
      type: "string",
    },
    subtitle: {
      type: "string",
    },

    newsletterShortcode: {
      type: "string",
    },

    lastEditionLink: {
      type: "string",
    },

    adicionalContent: {
      type: "string",
    },

    customStyle: {
      type: "string",
    },
  },

  edit: (props) => {
    const {
      className,
      isSelected,
      attributes: {
        title,
        subtitle,
        newsletterShortcode,
        adicionalContent,
        customStyle,
        typeNews,
      },
      setAttributes,
    } = props;

    return (
      <>
        <div className="newsletter-wrapper" key="container">
          <div class="category-page-sidebar">
          <SelectControl
              label={ __( 'Select newsletter type:' ) }
              value={ typeNews }
              onChange={ (value) => {setAttributes( { typeNews: value } ) } }
              options={ [
                  { value: null, label: 'Select a type', disabled: true },
                  { value: 'horizontal', label: 'Horizontal' },
                  { value: 'vertical', label: 'Vertical' },
              ] }
          />
          <TextControl
            label={ __( 'Add custom css:' ) }
            value={ customStyle }
            onChange={ ( value ) => {setAttributes( { customStyle: value } ) } }
          />
            <div class="newsletter">
              <div>
                <i class="fa fa-envelope fa-3x" aria-hidden="true"></i>
                <div class="newsletter-header">
                  
                    <RichText
                      tagName="p"
                      placeholder={__("Title")}
                      value={title}
                      onChange={(value) => setAttributes({ title: value })}
                    />
                  
                </div>

                <div class="customized-content">
                    <RichText
                        tagName="p"
                        className="anchor-text"
                        placeholder={__("Subtitle")}
                        value={subtitle}
                        onChange={(value) => setAttributes({ subtitle: value })}
                    />
                </div>

              </div>

              <div>
                <InnerBlocks
                    allowedBlocks={['core/shortcode']}
                    template={[['core/shortcode', {placeholder: 'Newsletter shortcode'}]]}
			    />
                <RichText
                        tagName="p"
                        className="link-add"
                        placeholder={__("Adicional Information")}
                        value={adicionalContent}
                        onChange={(value) => setAttributes({ adicionalContent: value })}
                />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  },

  save: (props) => {
    const {
      className,
      isSelected,
      attributes: {
        title,
        subtitle,
        newsletterShortcode,
        adicionalContent,
        align,
        typeNews,
        customStyle,
      },
      setAttributes,
    } = props;

    return (
        <>
            <div className="newsletter-wrapper" key="container">
                <div class="category-page-sidebar">
                    <div class={`newsletter ${typeNews} ${customStyle}`} >
                    <div>
                        <i class="fa fa-envelope fa-3x" aria-hidden="true"></i>
                        <div class="newsletter-header">
                            <p><RichText.Content value={title}/></p> 
                        </div>

                        <p class="anchor-text"><RichText.Content value={subtitle}/></p>
                    </div>

                    <div>
                        <InnerBlocks.Content />
                        <RichText.Content
                                tagName="p"
                                className="link-add"
                                value={adicionalContent}
                        />
                    </div>
                    </div>
                </div>
            </div>
            
        </>);
  },
});

// [mc4wp_form id="65"]
