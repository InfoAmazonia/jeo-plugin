import { MediaUpload, RichText } from "@wordpress/block-editor";
import { Button } from "@wordpress/components";
import { __ } from "@wordpress/i18n";

wp.blocks.registerBlockType('jeo-theme/custom-image-gallery-block', {
    title: __('Image Gallery'),
    icon: 'format-gallery',
    category: 'common',
    keywords: [
        __('materialtheme'),
        __('photos'),
        __('images')
    ],
    attributes: {
        galleryTitle: {
            type: 'string',
        },

        images: {
            type: 'array',
        },

        imagesDescriptions: {
            type: 'array',
        },

        imagesCredits: {
            type: 'array',
        }
    },

    edit({ attributes, className, setAttributes }) {
        const { galleryTitle = "", images = [], imagesDescriptions = [], imagesCredits = [] } = attributes;
        console.log(attributes);

        images.forEach((element, index) => {
            if (!imagesDescriptions[index]) {
                imagesDescriptions[index] = "";
            }

            if (!imagesCredits[index]) {
                imagesCredits[index] = "";
            }
        });

        const removeImage = (removeImageIndex) => {
            const newImages = images.filter((image, index) => {
                if (index != removeImageIndex) {
                    return image;
                }
            });

            imagesDescriptions.splice(removeImageIndex, 1);
            imagesCredits.splice(removeImageIndex, 1);

            setAttributes({
                images: newImages,
                imagesDescriptions,
                imagesCredits,
            })
        }

        const displayImages = (images) => {

            //console.log(external_link_api); 
            return (
                images.map((image, index) => {
                    //console.log(image);
                    return (
                        <div className="gallery-item-container">
                            <img className='gallery-item' src={image.url} key={image.id} />
                            <RichText
                                tagName="span"
                                className="description-field"
                                value={imagesDescriptions[index]}
                                formattingControls={['bold', 'italic']}
                                onChange={(content) => {
                                    setAttributes({
                                        imagesDescriptions: imagesDescriptions.map((item, i) => {
                                            if (i == index) {
                                                return content;
                                            } else {
                                                return item;
                                            }
                                        })
                                    })
                                }}
                                placeholder={__('Type here your description')}
                            />

                            <RichText
                                tagName="span"
                                className="credit-field"
                                value={imagesCredits[index]}
                                formattingControls={['bold', 'italic']}
                                onChange={(content) => {
                                    setAttributes({
                                        imagesCredits: imagesCredits.map((item, i) => {
                                            if (i == index) {
                                                return content;
                                            } else {
                                                return item;
                                            }
                                        })
                                    })
                                }}
                                placeholder={__('Type the credits here')}
                            />
                            <div className='remove-item' onClick={() => removeImage(index)}><span class="dashicons dashicons-trash"></span></div>
                        </div>
                    )
                })

            )
        }

        return (
            <div className="image-gallery">
                <RichText
                    tagName="h2"
                    className="gallery-title"
                    value={galleryTitle}
                    formattingControls={['bold', 'italic']}
                    onChange={(galleryTitle) => {
                        setAttributes({ galleryTitle })
                    }}
                    placeholder={__('Type a title')}
                />
                <div className="gallery-grid">
                    {displayImages(images)}
                    <MediaUpload
                        onSelect={(media) => { setAttributes({ images: [...images, ...media] }); }}
                        type="image"
                        multiple={true}
                        value={images}
                        render={({ open }) => (
                            <div className="select-images-button is-button is-default is-large" onClick={open}>
                                <span class="dashicons dashicons-plus"></span>
                            </div>
                        )}
                    />
                </div>

            </div>

        );
    },

    save: ({ attributes }) => {
        const { galleryTitle = "", images = [], imagesDescriptions = [], imagesCredits = [] } = attributes;
        //console.log(imagesDescriptions);

        const displayImages = (images) => {
            return (
                images.map((image, index) => {

                    return (
                        <div className="gallery-item-container">
                            <img
                                className='gallery-item'
                                key={images.id}
                                src={image.url}
                                alt={image.alt}
                            />

                            <div class="image-meta">
                                <div class="image-description"> <RichText.Content tagName="span" value={imagesDescriptions[index]} /></div>
                                <i class="fas fa-camera"></i>
                                <div class="image-credit"> <RichText.Content tagName="span" value={imagesCredits[index]} /></div>
                            </div>

                        </div>
                    )
                })
            )
        }

        return (
            <div className="image-gallery">
                <div className="image-gallery-wrapper">
                    <div className="gallery-title">
                        <RichText.Content tagName="h2" value={galleryTitle} />
                    </div>
                    <div className="actions">
                        <button action="display-grid">
                            <i class="fas fa-th"></i>
                        </button>

                        <button action="fullsreen">
                            <i class="fas fa-expand"></i>
                        </button>
                    </div>

                    <div className="gallery-grid" data-total-slides={images.length}>
                        {displayImages(images)}
                    </div>
                </div>
            </div>
        );

    },
});