import React from 'react';
import styled, { keyframes } from 'styled-components';
import PropTypes from 'prop-types';
import LazyLoad from 'react-lazyload';

const ImageWrapper = styled.div`

`;

const loadingAnimation = keyframes`
	0%{
		background-position: -468px 0
	}
	100%{
		background-position: 468px 0
	}
`;

const Placeholder = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	object-fit: cover;
	animation-duration: 1s;
	animation-fill-mode: forwards;
	animation-iteration-count: infinite;
	animation-name: ${ loadingAnimation };
	animation-timing-function: linear;
	background: #f6f7f8;
	background: linear-gradient(to right, #eeeeee 8%, #dddddd 18%, #eeeeee 33%);
	background-size: 800px 104px;
`;

const StyledImage = styled.img`
	position: absolute;
	left: 0;
	width: 100%;
	height: 100%;
	object-fit: cover;
`;

const Wrapper = styled.div`
	position: relative;
	padding-top: 56.25%;
	height: 0;
	overflow: hidden;
`;

const LazyImage = ( { src, alt } ) => {
	const refPlaceholder = React.useRef();

	const removePlaceholder = () => {
		refPlaceholder.current.remove();
	};

	return (
		<Wrapper>
			<Placeholder ref={ refPlaceholder } />

			<LazyLoad>
				<StyledImage
					onLoad={ removePlaceholder }
					onError={ removePlaceholder }
					src={ src }
					alt={ alt }
				/>
			</LazyLoad>
		</Wrapper>
	);
};

LazyImage.propTypes = {
	src: PropTypes.string.isRequired,
	alt: PropTypes.string.isRequired,
};

export default LazyImage;
