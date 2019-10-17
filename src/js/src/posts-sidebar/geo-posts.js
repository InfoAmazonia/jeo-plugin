import React from 'react';
import ReactDOM from 'react-dom';
import { Map as LeafletMap, Marker, Popup, TileLayer } from 'react-leaflet';
import JeoGeoAutoComplete from './geo-auto-complete';
import { __ } from "@wordpress/i18n";

class JeoGeocodePosts extends React.Component {
    constructor() {
      super()
      this.state = {
        lat: 51.505,
        lng: -0.09,
        zoom: 13,
        marker: false
      }
      
      this.onLocationFound = this.onLocationFound.bind(this);
      this.onMarkerDragged = this.onMarkerDragged.bind(this);
      
      this.markerRef = React.createRef();
      
  };
    
    onLocationFound(location) {
        //console.log(location);
        this.setState({
            marker: [
                location.lat,
                location.lon
            ],
            lat: location.lat,
            lng: location.lon,
        });
    };
    
    onMarkerDragged() {
        const marker = this.markerRef.current;
        const latLng = marker.leafletElement.getLatLng();
        this.setState({
            marker: [
                latLng.lat,
                latLng.lng
            ],
            lat: latLng.lat,
            lng: latLng.lng,
        });
        
    }
    
  render() {
    const position = [this.state.lat, this.state.lng];
    return (
        <fragment>
            <p>{__('Search your location', 'jeo')}</p>
            <JeoGeoAutoComplete onSelect={this.onLocationFound} />
            <div id="geocode-map-container">
                <LeafletMap center={position} zoom={this.state.zoom}>
                <TileLayer
                  attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                  url='https://{s}.tile.osm.org/{z}/{x}/{y}.png'
                />
                {this.state.marker && (
                    
                    <Marker 
                        draggable={true} 
                        onDragend={this.onMarkerDragged} 
                        position={[this.state.marker[0], this.state.marker[1]]}
                        ref={this.markerRef}
                        >
                    </Marker>
                    
                )}
                
              </LeafletMap>
            </div>
        </fragment>
    );
   
}
}

export default JeoGeocodePosts;