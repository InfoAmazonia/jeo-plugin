import { render } from 'react-dom';
import { Component, Fragment } from '@wordpress/element';
import { Modal, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
//import { useSelect } from '@wordpress/data';

const JeoPartnersPreviewButton = class JeoPartnersPreviewButton extends Component {
	constructor() {
		super();

        let btnDisabled = true;
        window.JeoPartnersPreviewButtonObj = this;
        this.siteURLInput = document.querySelector( 'input[name="_partners_sites_site_url"]' );
        if ( this.siteURLInput && this.siteURLInput.value && this.siteURLInput.value != '' ) {
            btnDisabled = false;
        }
		this.state = {
			isOpen: false,
            btnDisabled: btnDisabled,
            btnText: __( 'Preview Import', 'jeo' ),
            html: '',
            httpResponse: false,
            responseData: false,
		};
        this.siteURLInput.addEventListener( 'change', () => { JeoPartnersPreviewButtonObj.changeURL() } );
    }
    isValidHttpURL( siteURL ) {
        let testURL;
  
        try {
            testURL = new URL(siteURL);
        } catch (_) {
            alert( _ );
            return false;  
        }

        return testURL.protocol === "http:" || testURL.protocol === "https:";
      
    }
    changeURL() {
        window.JeoPartnersPreviewButtonObj.setState( { btnDisabled: false } );

    }
    loadTest() {
        this.setState( { btnText: __( 'Loading..', 'jeo' ), btnDisabled: true } );
        let URL = this.siteURLInput.value;
        if ( ! this.isValidHttpURL( URL ) ) {
            this.setState( { btnDisabled: false, httpResponse: __( 'This Site URL is not valid. Check it and try again.', 'jeo' ), isOpen: true, btnText: __( 'Preview Import', 'jeo' ) } );
            return;
        }
        if ( URL.substr(URL.length - 1) == '/' ) {
            URL = URL.slice(0, -1);
        }

        URL = URL + '/wp-json/wp/v2/posts/?per_page=1&_embed';

        fetch( URL )
        .then( (response) => {
            if( ! response.ok) {
                this.setState( { btnDisabled: false, httpResponse: __( 'The request for that partner is not ok', 'jeo' ), isOpen: true, btnText: __( 'Preview Import', 'jeo' ) } );
                return;
            }
            return response.json();
          })
        .then( ( data ) =>{
            console.log( data[0]['_embedded']['wp:featuredmedia'][0]['source_url'] );
            this.setState( { btnDisabled: false, httpResponse: false, isOpen: true, btnText: __( 'Preview Import', 'jeo' ), responseData: data } );
        } )
        .catch( (error) => {
            this.setState( { btnDisabled: false, httpResponse: __( 'The request for that partner is not ok: ' ) + error.message, isOpen: true, btnText: __( 'Preview Import', 'jeo' ) } );
        });
          
    }
    componentDidMount() {

    }
    componentDidUpdate() {
    }
	render() {
		const isOpen = this.state.isOpen;
		const btnDisabled = this.state.btnDisabled;
		const httpResponse = this.state.httpResponse;
		const responseData = this.state.responseData;
        console.log( this.state );

        const siteURL = false;

		return (
			<Fragment>
                {btnDisabled && (
				    <Button isPrimary disabled>
					    { this.state.btnText }
				    </Button>
                ) }
                { btnDisabled == false && (
				    <Button isPrimary disable onClick={ () => this.loadTest()  }>
					    { this.state.btnText }
				    </Button>
                ) }

				{ isOpen && (
					<Modal
						title={ __( 'Preview Import - Last Post', 'jeo' ) }
						onRequestClose={ () => this.setState( { isOpen: false } ) }
					>   
                        { httpResponse && (
                            <div dangerouslySetInnerHTML={{ __html: httpResponse }} />
                        ) }
                        { responseData && (
                            <div className="preview-post">
                                { responseData.map(item => (
                                    <Fragment>
                                        <div className="preview-post__title">
                                            <h4>{ __( 'Title', 'jeo' ) }</h4>
                                            <p>{item.title.rendered}</p>
                                        </div>
                                        <div className="preview-post__image" style={{width:'100%',textAlign:'center'}}>
                                            <h4>{ __( 'Featured Image', 'jeo' ) }</h4>
                                            <img style={{width:'20vw', display:'inline'}} src={ item['_embedded']['wp:featuredmedia'][0]['source_url'] } />
                                        </div>
                                    </Fragment>
                                )) }
                            </div>
                        )}

					</Modal>
				) }
			</Fragment>
		);
	}
};
document.addEventListener("DOMContentLoaded", () => {
    let metabox = document.querySelector( '#_partners_sites_test_api .inside' );

    render(<JeoPartnersPreviewButton />, metabox )
});