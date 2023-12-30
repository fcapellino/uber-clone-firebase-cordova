import blue_dot from '../assets/blue-dot.png';
import { cities, utilities } from "../libs/index";

class BASEMAP {
    constructor(id) {
        const self = this;
        //#region INITIALIZATION
        self.id = id;
        self.userMap = null;
        //#endregion

        self.initializeMap();
    }

    initializeMap() {
        const self = this;
        self.userMap = new google.maps.Map(document.getElementById(self.id), {
            center: cities.SAN_FRANCISCO_CORDOBA_ARGENTINA,
            zoom: 17,
            fullscreenControl: false,
            mapTypeControl: false,
            streetViewControl: false,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            draggableCursor: "pointer"
        });
    }

    setCenter(latitude, longitude) {
        const self = this;
        self.userMap.setCenter({ lat: latitude, lng: longitude });
    }

    setViewport() {
        const self = this;
        if (self.originMarker && self.destinationMarker) {
            let bounds = new google.maps.LatLngBounds();
            bounds.extend(self.originMarker.getPosition());
            bounds.extend(self.destinationMarker.getPosition());
            self.userMap.fitBounds(bounds);
        }
        else {
            let marker = utilities.tryGet(() => self.originMarker || self.destinationMarker);
            if (marker) {
                let position = marker.getPosition();
                self.setCenter(position.lat(), position.lng());
                self.userMap.setZoom(15);
            }
        }
    }

    setZoom() {
        const self = this;
        self.userMap.setZoom(15);
    }

    setCurrentPositionMarker(latitude, longitude) {
        const self = this;

        if (!self.currentPositionMarker) {
            self.currentPositionMarker = new google.maps.Marker({
                map: self.userMap,
                position: {
                    lat: latitude, lng: longitude
                },
                icon: {
                    url: blue_dot
                }
            });
        }

        if (!self.currentPositionMarkerInfowindow) {
            self.currentPositionMarkerInfowindow = new google.maps.InfoWindow({ maxWidth: 200, content: 'YOU' });
            self.currentPositionMarkerInfowindow.open(self.userMap, self.currentPositionMarker)
        }

        let latlng = new google.maps.LatLng(latitude, longitude);
        self.currentPositionMarker.setPosition(latlng);
    }

    removeCurrentPositionMarker() {
        const self = this;

        if (self.currentPositionMarker) {
            self.currentPositionMarker.setMap(null);
        }

        if (self.currentPositionMarkerInfowindow) {
            self.currentPositionMarkerInfowindow.setMap(null);
            self.currentPositionMarkerInfowindow.close();
        }

        self.currentPositionMarker = null;
        self.currentPositionMarkerInfowindow = null;
    }

    setOriginMarker(latitude, longitude, message) {
        const self = this;

        if (!self.originMarker) {
            self.originMarker = new google.maps.Marker({
                map: self.userMap,
                position: {
                    lat: latitude, lng: longitude
                }
            });
        }

        if (!self.originMarkerInfowindow) {
            self.originMarkerInfowindow = new google.maps.InfoWindow({ maxWidth: 200, content: message });
            self.originMarkerInfowindow.open(self.userMap, self.originMarker);
        }

        if (!utilities.isNullOrEmpty(message)) {
            self.originMarkerInfowindow?.setContent(message);
        }

        let latlng = new google.maps.LatLng(latitude, longitude);
        self.originMarker.setPosition(latlng);

        self.setViewport();
        self.setRoute();
    }

    removeOriginMarker() {
        const self = this;

        if (self.originMarker) {
            self.originMarker.setMap(null);
        }

        if (self.originMarkerInfowindow) {
            self.originMarkerInfowindow.setMap(null);
            self.originMarkerInfowindow.close();
        }

        self.originMarker = null;
        self.originMarkerInfowindow = null;

        self.setViewport();
        self.setRoute();
    }

    setDestinationMarker(latitude, longitude, message) {
        const self = this;

        if (!self.destinationMarker) {
            self.destinationMarker = new google.maps.Marker({
                map: self.userMap,
                position: {
                    lat: latitude, lng: longitude
                }
            });
        }

        if (!self.destinationMarkerInfowindow) {
            self.destinationMarkerInfowindow = new google.maps.InfoWindow({ maxWidth: 200, content: message });
            self.destinationMarkerInfowindow.open(self.userMap, self.destinationMarker);
        }

        if (!utilities.isNullOrEmpty(message)) {
            self.destinationMarkerInfowindow?.setContent(message);
        }

        let latlng = new google.maps.LatLng(latitude, longitude);
        self.destinationMarker.setPosition(latlng);

        self.setViewport();
        self.setRoute();
    }

    removeDestinationMarker() {
        const self = this;

        if (self.destinationMarker) {
            self.destinationMarker.setMap(null);
        }

        if (self.destinationMarkerInfowindow) {
            self.destinationMarkerInfowindow.setMap(null);
            self.destinationMarkerInfowindow.close();
        }

        self.destinationMarker = null;
        self.destinationMarkerInfowindow = null;

        self.setViewport();
        self.setRoute();
    }

    setRoute() {
        const self = this;
        if (self.directionsRenderer) {
            self.directionsRenderer.setMap(null);
            self.directionsRenderer = null;
            self.route = null;
        }

        if (self.originMarker && self.destinationMarker) {
            let directionsService = new google.maps.DirectionsService();
            self.directionsRenderer = new google.maps.DirectionsRenderer({
                map: self.userMap,
                suppressMarkers: true,
                routeIndex: 0
            });

            let origin = self.originMarker.getPosition();
            let destination = self.destinationMarker.getPosition();

            directionsService.route({
                origin: origin,
                destination: destination,
                avoidTolls: true,
                travelMode: google.maps.TravelMode.DRIVING
            }, function (response, status) {
                if (status === google.maps.DirectionsStatus.OK) {
                    self.route = utilities.tryGet(() => response.routes[0]);
                    if (self.route) {
                        self.directionsRenderer.setDirections(response);
                    }
                }
            });
        }
    }

    removeAllRoutes() {
        const self = this;
        if (self.directionsRenderer) {
            self.directionsRenderer.setMap(null);
            self.directionsRenderer = null;
            self.route = null;
        }
    }

    setTopCenterMessage(message) {
        const self = this;
        let controlDiv = document.createElement('div');
        controlDiv.innerHTML = `<h1 style="margin-top: 20px;background-color: lightskyblue;padding: 7px;">${message}</h4>`;
        self.userMap.controls[google.maps.ControlPosition.TOP_CENTER].clear();
        self.userMap.controls[google.maps.ControlPosition.TOP_CENTER].push(controlDiv);
    }

    removeTopCenterMessage() {
        const self = this;
        self.userMap.controls[google.maps.ControlPosition.TOP_CENTER].clear();
    }

    clear() {
        const self = this;
        self.removeOriginMarker();
        self.removeDestinationMarker();
        self.removeAllRoutes();
        self.removeTopCenterMessage();
        self.setZoom();
    }
}

export default BASEMAP;
