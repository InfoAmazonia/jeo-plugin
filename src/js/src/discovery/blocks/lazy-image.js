import { useRef } from '@wordpress/element';
import styled, { keyframes } from 'styled-components';

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
	top: 0;
`;

const Wrapper = styled.div`
	position: relative;
	padding-top: 56.25%;
	height: 0;
	overflow: hidden;
`;

const LazyImage = ( { src, alt } ) => {
	const refPlaceholder = useRef( undefined );

	const removePlaceholder = () => {
		refPlaceholder.current.remove();
	};

	return (
		<Wrapper>
			<Placeholder ref={ refPlaceholder } />
			<StyledImage
				onLoad={ removePlaceholder }
				onError={ removePlaceholder }
				src={ src }
				alt={ alt }
				loading="lazy"
			/>
		</Wrapper>
	);
};

export default LazyImage;
