import { utilities } from "../libs/index";
import BASEMAP from './gmap';

class DRIVER_MAP extends BASEMAP {
    constructor(id) {
        super(id);
    }

    async setPickUpLocationMarkerAsync(pickUpLocation, pickUpLocationAddress) {
        const self = this;
        self.setOriginMarker(pickUpLocation.lat, pickUpLocation.lng, pickUpLocationAddress);
    }

    async setRouteToPickUpLocationAsync() {
        const self = this;
        if (self.directionsRenderer) {
            self.directionsRenderer.setMap(null);
            self.directionsRenderer = null;
            self.route = null;
        }

        if (self.originMarker) {
            let currentPosition = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    maximumAge: 50000, timeout: 10000, enableHighAccuracy: true
                });
            });
            let coords = currentPosition.coords;
            let driverStartingPoint = new google.maps.LatLng(coords.latitude, coords.longitude);
            let pickUpLocation = self.originMarker.getPosition();

            let directionsService = new google.maps.DirectionsService();
            self.directionsRenderer = new google.maps.DirectionsRenderer({
                map: self.userMap,
                suppressMarkers: true,
                routeIndex: 0,
                polylineOptions: { strokeColor: 'red', strokeWeight: 5 }
            });

            directionsService.route({
                origin: driverStartingPoint, destination: pickUpLocation, avoidTolls: true, travelMode: google.maps.TravelMode.DRIVING
            }, function (response, status) {
                if (status === google.maps.DirectionsStatus.OK) {
                    let route = utilities.tryGet(() => response.routes[0]);
                    if (route) {
                        self.directionsRenderer.setDirections(response);
                    }
                }
            });
        }
    }
}

export default DRIVER_MAP;
