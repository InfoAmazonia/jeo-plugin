import { MediaUpload, RichText } from "@wordpress/block-editor";
import { Button } from "@wordpress/components";
import { __ } from "@wordpress/i18n";

wp.blocks.registerBlockType("jeo-theme/custom-image-block-editor", {
    title: "Credited Image",
    icon: "format-image",
    category: "common",
    supports: {
        align: true,
    },
    attributes: {
        title: {
            type: "string",
        },
        mediaID: {
            type: "number",
        },
        mediaURL: {
            type: "string",
        },

        mediaDescription: {
            type: "string",
        },
    },

    edit: (props) => {
        const {
            className,
            isSelected,
            attributes: {
                mediaID,
                mediaURL,
                title,
                mediaDescription,
            },
            setAttributes,
        } = props;

        const onChangeTitle = (value) => {
            setAttributes({ title: value });
        };

        const onChangeDescription = (value) => {
            setAttributes({ mediaDescription: value });
        };

        const onSelectImage = (media) => {
            setAttributes({
                mediaURL: media.url,
                mediaID: media.id,
            });
        };

        const [imageClasses, textClasses, wrapClass] = [
            "left",
            className,
            "image-block-container",
        ];

        return (
            <>
                <div className={wrapClass} key="container">
                    <div className={imageClasses}>
                        <div className="callout-image">
                            <MediaUpload
                                onSelect={onSelectImage}
                                type="image"
                                value={mediaID}
                                render={({ open }) => (
                                    <>
                                        <Button
                                            isSecondary
                                            className={
                                                mediaID
                                                    ? "image-button margin-auto"
                                                    : "image-button button-large margin-auto"
                                            }
                                            onClick={open}
                                        >
                                            {!mediaID ? __("Upload Image") : __("Replace image")}
                                        </Button>
                                        {mediaID ? (
                                            <div className="image-wrapper">
                                                <img src={mediaURL} />
                                                <div class="image-info-wrapper">
                                                    <span
                                                        class="dashicons image-icon dashicons-camera-alt"
                                                    ></span>
                                                    <RichText
                                                        tagName="span"
                                                        className="image-meta"
                                                        placeholder={__("Write a info here.")}
                                                        value={mediaDescription}
                                                        onChange={onChangeDescription}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                                ""
                                            )}
                                    </>
                                )}
                            />
                        </div>
                    </div>
                    <div className={textClasses}>
                        <RichText
                            tagName="span"
                            className="callout-title image-description margin-auto"
                            placeholder={__("Write a description here.")}
                            value={title}
                            onChange={onChangeTitle}
                        />
                    </div>
                </div>
            </>
        );
    },

    save: (props) => {
        const {
            className,
            attributes: {
                mediaID,
                mediaURL,
                title,
                mediaDescription,
                align,
            },
        } = props;

        return (
            <>
                <div className="vue-component image-block-container" key="container">
                    <image-block alignment={align} title={title} mediaurl={mediaURL} mediadescription={mediaDescription}></image-block>
                </div>
            </>

        );
    },
});
