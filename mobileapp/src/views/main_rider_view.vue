<template>
    <v-container text-center>
        <div class="home" v-if="userProfile?.role==='rider'">
            <loader v-if="isLoading" />
            <v-dialog value="true" v-if="driverSearch" persistent max-width="200">
                <v-card>
                    <v-divider></v-divider>
                    <v-card-text class="text-center pa-10">
                        <v-progress-circular :size="50" color="primary" indeterminate>
                        </v-progress-circular>
                    </v-card-text>
                    <v-divider></v-divider>
                    <v-card-actions>
                        <v-btn style="width:100%;"
                               depressed
                               color="error"
                               v-bind:disabled="isLoading"
                               v-on:click.stop="cancelDriverSearchAsync()">
                            CANCEL
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
            <v-row align="center" justify="center">
                <div class="text-center" style="width: -webkit-fill-available;">
                    <v-card class="mx-auto" flat>
                        <v-card-title style="text-align: left; padding: 10px 10px 0px 10px;">
                            <v-text-field id="search-input-origin"
                                          v-model.trim="inputOriginText"
                                          dense
                                          label="ORIGIN"
                                          placeholder=""
                                          outlined filled
                                          clearable
                                          append-icon="mdi-map-marker"
                                          v-bind:disabled="inputOriginDisabled"
                                          v-on:click:append="setCurrentPositionAsOriginAsync()"
                                          style="height:50px;">
                            </v-text-field>
                            <v-text-field id="search-input-destination"
                                          v-model.trim="inputDestinationText"
                                          dense
                                          label="DESTINATION"
                                          placeholder=""
                                          outlined filled
                                          clearable
                                          append-icon="grade"
                                          v-bind:disabled="inputDestinationDisabled"
                                          v-on:click:append="addToFavoritesAsync()"
                                          style="height:50px;">
                            </v-text-field>
                        </v-card-title>
                        <v-divider></v-divider>
                        <v-card-text class="text--primary" style="height:60vh;padding:0px;">
                            <div id="riderMapDiv" style="height:inherit;">
                                <h2>MAP</h2>
                            </div>
                        </v-card-text>
                        <v-divider></v-divider>
                        <v-card-actions style="padding-right: 15px;">
                            <v-btn style="width:50%;"
                                   depressed
                                   color="primary"
                                   v-bind:disabled="buttonFavoritesDisabled"
                                   v-on:click.stop="openFavoritesModal()">
                                FAVORITES
                            </v-btn>
                            <v-btn style="width:50%;"
                                   depressed
                                   color="error"
                                   v-bind:disabled="buttonRequestOrCancelDisabled"
                                   v-on:click.stop="requestOrCancelTrip()">
                                {{ buttonRequestOrCancelText }}
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </div>
            </v-row>
            <v-dialog v-model="showFavorites" fullscreen hide-overlay transition="dialog-bottom-transition">
                <v-card tile>
                    <v-toolbar dark color="primary">
                        <v-btn icon dark v-on:click="closeFavoritesModal()">
                            <v-icon>mdi-close</v-icon>
                        </v-btn>
                        <v-toolbar-title>FAVORITES</v-toolbar-title>
                        <v-spacer></v-spacer>
                    </v-toolbar>
                    <v-list flat>
                        <v-list-item-group>
                            <template v-for="(item, index) in favoritesList">
                                <v-list-item :key="item.key" v-on:click.stop="selectDestinationFromFavorites(item)">
                                    <v-list-item-content style="text-align: start;">
                                        <v-list-item-subtitle class="text-wrap"> ADDRESS: {{ item.address }} </v-list-item-subtitle>
                                    </v-list-item-content>
                                    <v-list-item-action>
                                        <v-btn icon v-on:click.stop="deleteFromFavoritesAsync(item)">
                                            <v-icon color="grey lighten-1">mdi-delete-forever-outline</v-icon>
                                        </v-btn>
                                    </v-list-item-action>
                                </v-list-item>
                                <v-divider v-if="index < favoritesList?.length" :key="index"></v-divider>
                            </template>
                            <div v-if="!favoritesList?.length" style="text-align: center;">
                                <small>NO DATA AVAILABLE</small>
                            </div>
                        </v-list-item-group>
                    </v-list>
                </v-card>
            </v-dialog>
            <v-dialog value="true" v-if="rateDriverModal.show" persistent max-width="300">
                <v-card>
                    <v-card-title style="padding: 15px;">
                        <v-list-item-content style="text-align: start;">
                            <div class="text-h7" style="margin-bottom: 5px;">RATE THE DRIVER</div>
                        </v-list-item-content>
                    </v-card-title>
                    <v-divider></v-divider>
                    <v-card-text>
                        <v-select :items="[1,2,3,4,5,6,7,8,9,10]"
                                  v-model.number="rateDriverModal.score"
                                  label="SCORE"
                                  style="padding-top:25px;">
                        </v-select>
                    </v-card-text>
                    <v-divider></v-divider>
                    <v-card-actions>
                        <v-btn style="width:100%;"
                               depressed
                               color="primary"
                               v-on:click.stop="rateDriverAsync()">
                            ACCEPT
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </div>
    </v-container>
</template>

<script>
    import RIDER_MAP from "../viewmodels/rider_map"
    import TRIP from "../viewmodels/trip"
    import loader from "@/components/loader"
    import ringing_message from '../assets/ringing_message.wav';
    import { distances, trip_states } from "../libs/index";
    import { equalTo, get, getDatabase, limitToFirst, onValue, orderByChild, push, query, ref, serverTimestamp, update, remove, off } from "firebase/database";

    export default {
        name: 'main_rider_view',
        components: { loader },
        data() {
            return {
                currentTrip: null,
                currentTripRef: null,
                driverSearch: false,
                favoritesList: [],
                inputDestination: null,
                inputDestinationText: null,
                inputOrigin: null,
                inputOriginText: null,
                rateDriverModal: {
                    show: false,
                    score: 0
                },
                showFavorites: false,
                userMap: null
            }
        },
        mounted: async function () {
            const self = this;
            try {
                self.startLoader();
                await self.initializeUserMapAsync();
                self.initializePlacesAutocomplete();
                self.startTrackingCurrentPositionAsync();
                self.loadFavoritesAsync();
            }
            catch ({ name, message }) {
                self.$error(message);
            }
            finally {
                self.stopLoader();
            }
        },
        beforeDestroy: function () {
            const self = this;
            try {
                self.removeTripListener();
            }
            catch ({ name, message }) {
                self.$error(message);
            }
        },
        computed: {
            buttonFavoritesDisabled: function () {
                const self = this;
                return Boolean(self.utils.tryGet(() => self.currentTrip || self.driverSearch));
            },
            buttonRequestOrCancelDisabled: function () {
                const self = this;
                return Boolean(self.utils.tryGet(() => self.inputOrigin === null || !self.inputDestination || self.driverSearch));
            },
            buttonRequestOrCancelText: function () {
                const self = this;
                return self.currentTrip ? 'CANCEL TRIP' : 'REQUEST DRIVER';
            },
            inputDestinationDisabled: function () {
                const self = this;
                return Boolean(self.utils.tryGet(() => self.currentTrip || self.driverSearch));
            },
            inputOriginDisabled: function () {
                const self = this;
                return Boolean(self.utils.tryGet(() => self.currentTrip || self.driverSearch));
            }
        },
        methods: {
            addToFavoritesAsync: async function () {
                const self = this;
                try {
                    if (self.userMap?.destinationMarker) {
                        let currentUser = self.userProfile;
                        let database = getDatabase();
                        let favoritesRef = ref(database, `users/${currentUser.uid}/favorites/`);

                        let destination = self.userMap.destinationMarker.getPosition();
                        let destinationAddress = self.userMap.destinationMarkerInfowindow.getContent();

                        let favExists = self.favoritesList.some((item) => item.address === destinationAddress);
                        if (favExists) {
                            throw new Error('The selected destination is already in your favorites list.');
                        }

                        let newFavorite = {
                            address: self.utils.tryGet(() => destinationAddress),
                            lat: self.utils.tryGet(() => destination.lat()),
                            lng: self.utils.tryGet(() => destination.lng())
                        };
                        await push(favoritesRef, newFavorite);
                        await self.loadFavoritesAsync();

                        self.$alert('The selected destination has been added to your favourites list!');
                    }
                }
                catch ({ name, message }) {
                    self.$error(message);
                }
            },
            cancelDriverSearchAsync: async function () {
                const self = this;
                try {
                    self.driverSearch = false;
                    if (self.currentTrip) {
                        let database = getDatabase();
                        let tripsRef = ref(database, `trips/${self.currentTrip.key}`);

                        self.currentTrip = null;
                        self.removeTripListener();
                        await update(tripsRef, { state: trip_states.CANCELLED });
                    }
                }
                catch ({ name, message }) {
                    self.$error(message);
                }
            },
            cancelTripAsync: async function () {
                const self = this;
                try {
                    self.startLoader();
                    if (self.currentTrip) {
                        let database = getDatabase();
                        let tripsRef = ref(database, `trips/${self.currentTrip.key}`);

                        self.resetInterface();
                        await update(tripsRef, { state: trip_states.CANCELLED });
                        self.$alert('Your trip has been cancelled!');
                    }
                }
                catch ({ name, message }) {
                    self.$error(message);
                }
                finally {
                    self.stopLoader();
                }
            },
            closeDriverSearchModal: function () {
                const self = this;
                self.driverSearch = false;
            },
            closeFavoritesModal: function () {
                const self = this;
                self.showFavorites = false;
            },
            deleteFromFavoritesAsync: async function (item) {
                const self = this;
                try {
                    let currentUser = self.userProfile;
                    let database = getDatabase();
                    let favoritesRef = ref(database, `users/${currentUser.uid}/favorites/${item.key}`);
                    await remove(favoritesRef);
                    await self.loadFavoritesAsync();
                }
                catch ({ name, message }) {
                    self.$error(message);
                }
            },
            generateTripRequestAsync: async function () {
                const self = this;
                try {
                    self.driverSearch = true;
                    if (!self.userMap.originMarker || self.utils.isNullOrEmpty(self.inputOriginText) ||
                        !self.userMap.destinationMarker || self.utils.isNullOrEmpty(self.inputDestinationText)) {
                        throw new Error('You must select origin and destination.');
                    }

                    if (!self.userMap.route) {
                        throw new Error('There are no routes available.');
                    }

                    let origin = self.userMap.originMarker.getPosition();
                    let originAddress = self.userMap.originMarkerInfowindow.getContent();
                    let destination = self.userMap.destinationMarker.getPosition();
                    let destinationAddress = self.userMap.destinationMarkerInfowindow.getContent();
                    let riderKey = self.userProfile.uid;
                    let riderName = self.userProfile.displayName;
                    let distance = self.userMap.route.legs[0].distance.text.toUpperCase();
                    let duration = self.userMap.route.legs[0].duration.text.toUpperCase();

                    let distanceOriginDestination = Math.abs(google.maps.geometry.spherical.computeDistanceBetween(origin, destination));
                    if (distanceOriginDestination <= distances.METERS_100) {
                        throw new Error('The distance between origin and destination is less than 100 meters.');
                    }

                    let newTrip = new TRIP({
                        key: null,
                        origin: {
                            lat: origin.lat(), lng: origin.lng()
                        },
                        originAddress: originAddress,
                        destination: {
                            lat: destination.lat(), lng: destination.lng()
                        },
                        destinationAddress: destinationAddress,
                        riderKey: riderKey,
                        riderName: riderName,
                        driverKey: null,
                        driverName: null,
                        distance: distance,
                        duration: duration,
                        state: trip_states.WAITING,
                        timestamp: serverTimestamp()
                    });

                    let database = getDatabase();
                    let tripsRef = ref(database, 'trips/');
                    let snapshot = await push(tripsRef, newTrip);

                    newTrip.key = snapshot.key;
                    self.currentTrip = newTrip;
                    self.setTripListener(newTrip.key);

                    let closestDrivers = await self.getTop3ClosestAvailableDriversAsync();
                    while (closestDrivers.length && self.currentTrip && !self.currentTrip?.driverKey) {
                        let driver = closestDrivers.shift();
                        await self.requestDriverAsync(driver.key, newTrip.key);
                        await new Promise(resolve => setTimeout(resolve, 10000));
                    }

                    if (self.currentTrip && self.utils.isNullOrEmpty(self.currentTrip?.driverKey)) {
                        self.$error('There are no drivers available at this time.');
                        await self.cancelDriverSearchAsync();
                    }
                }
                catch ({ name, message }) {
                    self.cancelDriverSearchAsync();
                    self.$error(message);
                }
                finally {
                    self.driverSearch = false;
                }
            },
            getDriverETAAsync: async function () {
                const self = this;
                try {
                    let directionsService = new google.maps.DirectionsService();
                    let database = getDatabase();
                    let driversRef = ref(database, `drivers/${self.currentTrip.driverKey}/position`);
                    let snapshot = await get(driversRef);

                    let position = snapshot.val();
                    let origin = new google.maps.LatLng(position.lat, position.lng);
                    let destination = self.userMap.originMarker.getPosition();

                    let routes = await new Promise((resolve, reject) => {
                        setTimeout(() => reject(new Error()), 350);
                        directionsService.route({
                            origin: origin,
                            destination: destination,
                            avoidTolls: true,
                            travelMode: google.maps.TravelMode.DRIVING
                        }, function (response, status) {
                            if (status === google.maps.DirectionsStatus.OK) {
                                resolve(self.utils.tryGet(() => response.routes));
                            }
                        });
                    });
                    return self.utils.tryGet(() => routes[0].legs[0].duration.text.toUpperCase());
                }
                catch ({ name, message }) {
                    return;
                }
            },
            getTop3ClosestAvailableDriversAsync: async function () {
                const self = this;
                let database = getDatabase();
                let newquery = query(ref(database, 'drivers/'), orderByChild('tripRequest'), equalTo(null), limitToFirst(100));
                let snapshot = await get(newquery);

                let driversList = [];
                let val = snapshot.val();
                if (val) {
                    Object.entries(val).forEach(entry => {
                        const [key, value] = entry;
                        if (value.timestamp && value.position) {
                            let activeMinutesAgo = Math.floor((Math.abs(new Date() - value.timestamp) / 1000) / 60);
                            if (activeMinutesAgo <= 5) {
                                let driver = { key: key.toString(), position: value.position, distanceToUs: null };
                                driversList.push(driver);
                            }
                        }
                    });
                }

                if (driversList.length) {
                    let currentPosition = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            maximumAge: 50000, timeout: 10000, enableHighAccuracy: true
                        });
                    });
                    let coords = currentPosition.coords;
                    let my_latlng = new google.maps.LatLng(coords.latitude, coords.longitude);

                    driversList.forEach(driver => {
                        let driver_latlng = new google.maps.LatLng(driver.position.lat, driver.position.lng);
                        driver.distanceToUs = Math.abs(google.maps.geometry.spherical.computeDistanceBetween(my_latlng, driver_latlng));
                    });
                    driversList = driversList.sort((x, y) => x.distanceToUs - y.distanceToUs);
                }

                return self.utils.tryGet(() => driversList.slice(0, 3));
            },
            initializePlacesAutocomplete: function () {
                const self = this;

                let inputOriginElement = document.getElementById('search-input-origin');
                self.inputOrigin = new google.maps.places.Autocomplete(inputOriginElement, { placeholder: undefined });
                google.maps.event.addListener(self.inputOrigin, "place_changed", self.inputOriginPlaceChanged);

                let inputDestinationElement = document.getElementById('search-input-destination');
                self.inputDestination = new google.maps.places.Autocomplete(inputDestinationElement, { placeholder: undefined });
                google.maps.event.addListener(self.inputDestination, "place_changed", self.inputDestinationPlaceChanged);

                self.inputOriginText = '';
                setTimeout(() => { self.inputOriginText = null; }, 300);
                self.inputDestinationText = '';
                setTimeout(() => { self.inputDestinationText = null; }, 300);
            },
            initializeUserMapAsync: async function () {
                const self = this;
                self.userMap = new RIDER_MAP('riderMapDiv');
                await new Promise(resolve => setTimeout(resolve, 1500));
            },
            inputDestinationPlaceChanged: function () {
                const self = this;
                let place = self.inputDestination.getPlace();
                let geometry = self.utils.tryGet(() => place.geometry);
                if (geometry) {
                    let location = place.geometry.location;
                    let adr_address = place.formatted_address;

                    self.inputDestinationText = place.formatted_address;
                    self.userMap.setDestinationMarker(location.lat(), location.lng(), adr_address);
                    self.userMap.removeCurrentPositionMarker();
                }
            },
            inputOriginPlaceChanged: function () {
                const self = this;
                let place = self.inputOrigin.getPlace();
                let geometry = self.utils.tryGet(() => place.geometry);
                if (geometry) {
                    let location = place.geometry.location;
                    let adr_address = place.formatted_address;

                    self.inputOriginText = place.formatted_address;
                    self.userMap.setOriginMarker(location.lat(), location.lng(), adr_address);
                    self.userMap.removeCurrentPositionMarker();
                }
            },
            isTrackingAllowed: function () {
                const self = this;
                if (self.currentTrip) {
                    return Boolean(self.utils.tryGet(() => self.currentTrip.state === trip_states.IN_PROGRESS));
                }
                else {
                    return Boolean(self.utils.tryGet(() => !self.userMap.originMarker && !self.userMap.destinationMarker));
                }
            },
            loadFavoritesAsync: async function () {
                const self = this;
                try {
                    self.favoritesList = [];
                    let tList = [];

                    let currentUser = self.userProfile;
                    let database = getDatabase();
                    let favoritesRef = ref(database, `users/${currentUser.uid}/favorites/`);
                    let snapshot = await get(favoritesRef);

                    let val = snapshot.val();
                    if (val) {
                        Object.entries(val).forEach(entry => {
                            const [key, value] = entry;
                            let trip_entry = {
                                key: key.toString(),
                                address: value.address,
                                lat: value.lat,
                                lng: value.lng
                            };
                            tList.push(trip_entry);
                        });
                        self.favoritesList = tList.sort((x, y) => x.address.localeCompare(y.address));
                    }
                }
                catch ({ name, message }) {
                    self.$error(message);
                }
            },
            openFavoritesModal: function () {
                const self = this;
                self.showFavorites = true;
            },
            openRateDriverModal: function () {
                const self = this;
                self.rateDriverModal.show = true;
                self.rateDriverModal.score = 0;
            },
            rateDriverAsync: async function () {
                const self = this;
                try {
                    self.startLoader();
                    if (!self.rateDriverModal.score) {
                        throw new Error('You must select a valid score.');
                    }

                    let database = getDatabase();
                    let usersRef = ref(database, `users/${self.currentTrip.driverKey}`);
                    let snapshot = await get(usersRef);
                    let user = snapshot.val();
                    if (user) {
                        let userScore = user.userScore;
                        let sumOfVotes = self.utils.tryGetNumber(() => Number(userScore.split('|')[0]));
                        let votes = self.utils.tryGetNumber(() => Number(userScore.split('|')[1]));
                        sumOfVotes += self.rateDriverModal.score;
                        votes += 1;

                        await update(usersRef, { userScore: `${sumOfVotes}|${votes}` });
                    }

                    self.resetInterface();
                    self.rateDriverModal.show = false;
                    self.rateDriverModal.score = 0;
                }
                catch ({ name, message }) {
                    self.$error(message);
                }
                finally {
                    self.stopLoader();
                }
            },
            removeTripListener: function () {
                const self = this;
                try {
                    if (self.currentTripRef) {
                        off(self.currentTripRef);
                        self.currentTripRef = null;
                    }
                }
                catch ({ name, message }) {
                    return;
                }
            },
            requestDriverAsync: async function (driverKey, tripKey) {
                let database = getDatabase();
                let driversRef = ref(database, `drivers/${driverKey}`);
                let snapshot = await get(driversRef);
                let val = snapshot.val();
                if (val) {
                    await update(driversRef, { tripRequest: tripKey });
                }
            },
            requestOrCancelTrip: function () {
                const self = this;
                if (self.currentTrip) {
                    self.cancelTripAsync();
                }
                else {
                    self.generateTripRequestAsync();
                }
            },
            resetInterface: function () {
                const self = this;
                self.inputOriginText = null;
                self.inputDestinationText = null;
                self.currentTrip = null;
                self.userMap.clear();
                self.removeTripListener();
            },
            selectDestinationFromFavorites: function (item) {
                const self = this;
                try {
                    let location = new google.maps.LatLng(item.lat, item.lng);
                    let adr_address = item.address;

                    self.inputDestinationText = item.address;
                    self.userMap.setDestinationMarker(location.lat(), location.lng(), adr_address);
                    self.userMap.removeCurrentPositionMarker();
                    self.closeFavoritesModal();
                }
                catch ({ name, message }) {
                    self.$error(message);
                }
            },
            setCurrentPositionAsOriginAsync: async function () {
                const self = this;
                try {
                    self.startLoader();
                    let geocoder = new google.maps.Geocoder();
                    let currentPosition = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            maximumAge: 50000, timeout: 10000, enableHighAccuracy: true
                        });
                    });
                    let coords = currentPosition.coords;
                    let latlng = new google.maps.LatLng(coords.latitude, coords.longitude);

                    let results = await new Promise(function (resolve, reject) {
                        geocoder.geocode({ 'latLng': latlng }, function (results, status) {
                            if (status === 'OK' && results?.length > 0) {
                                resolve(results);
                            } else {
                                reject(new Error('Your current location could not be determined.'));
                            }
                        })
                    })
                    if (results.length) {
                        let place = results[0];
                        let location = place.geometry.location;
                        let adr_address = place.formatted_address;

                        self.inputOriginText = place.formatted_address;
                        self.userMap.setOriginMarker(location.lat(), location.lng(), adr_address);
                        self.userMap.removeCurrentPositionMarker();
                    }
                }
                catch ({ name, message }) {
                    self.$error(message);
                }
                finally {
                    self.stopLoader();
                }
            },
            setTripListener: function (tripKey) {
                const self = this;
                let database = getDatabase();
                self.removeTripListener();
                self.currentTripRef = ref(database, `trips/${tripKey}`);

                onValue(self.currentTripRef, (snapshot) => {
                    let tripData = snapshot.val();
                    if (tripData && self.currentTrip) {
                        tripData.key = snapshot.key;
                        self.currentTrip = new TRIP(tripData);
                    }
                });
            },
            showDriverArrivalNotification: function () {
                const self = this;
                self.$alert('The driver has arrived!');
                new Audio(ringing_message).play();
            },
            showTripFinishedNotification: function () {
                const self = this;
                try {
                    self.openRateDriverModal();
                    self.$alert('You have arrived to your destination!');
                }
                catch ({ name, message }) {
                    let errormsg = message;
                    self.$error(errormsg);
                }
            },
            showTripRequestAcceptedNotificationAsync: async function () {
                const self = this;
                try {
                    let trip_request_accepted_msg = 'Your trip request has been accepted. The driver is on his way.';
                    let eta = await self.getDriverETAAsync();
                    if (eta) {
                        trip_request_accepted_msg = trip_request_accepted_msg.concat(` [ETA: ${eta}].`);
                    }

                    self.closeDriverSearchModal();
                    self.$alert(trip_request_accepted_msg);
                }
                catch ({ name, message }) {
                    let errormsg = message;
                    self.$error(errormsg);
                }
            },
            startTrackingCurrentPositionAsync: async function () {
                const self = this;
                try {
                    while (navigator.geolocation) {
                        if (self.isTrackingAllowed()) {
                            let currentPosition = await new Promise((resolve, reject) => {
                                navigator.geolocation.getCurrentPosition(resolve, reject, {
                                    maximumAge: 50000, timeout: 10000, enableHighAccuracy: true
                                });
                            });
                            let coords = currentPosition.coords;

                            self.userMap.setCenter(coords.latitude, coords.longitude);
                            self.userMap.setCurrentPositionMarker(coords.latitude, coords.longitude);
                            self.userMap.setZoom();
                        }
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
                catch ({ name, message }) {
                    self.$error(message);
                }
            }
        },
        watch: {
            currentTrip: {
                handler(newvalue, oldvalue) {
                    const self = this;
                    self.$store.commit('SET_TRIP', newvalue);
                    if (self.currentTrip) {
                        if (self.utils.tryGet(() => newvalue.state !== oldvalue.state)) {
                            switch (self.currentTrip.state) {
                                case trip_states.ACCEPTED:
                                    self.showTripRequestAcceptedNotificationAsync();
                                    break;
                                case trip_states.IN_PROGRESS:
                                    self.showDriverArrivalNotification();
                                    break;
                                case trip_states.CANCELLED:
                                    self.cancelTripAsync();
                                    break;
                                case trip_states.FINISHED:
                                    self.showTripFinishedNotification();
                                    break;
                            }
                        }
                    }
                },
                deep: true
            },
            inputDestinationText(value) {
                const self = this;
                if (self.utils.isNullOrEmpty(value)) {
                    self.userMap.removeDestinationMarker();
                }
            },
            inputOriginText(value) {
                const self = this;
                if (self.utils.isNullOrEmpty(value)) {
                    self.userMap.removeOriginMarker();
                }
            }
        }
    }
</script>

<style scoped>
    img.logo {
        display: inline-block;
        width: 90px;
        padding: 20px;
    }
</style>
