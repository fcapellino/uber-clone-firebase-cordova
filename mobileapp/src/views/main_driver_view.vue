<template>
    <v-container text-center>
        <div class="home" v-if="userProfile?.role==='driver'">
            <loader v-if="isLoading" />
            <v-dialog value="true" v-if="tripRequestModal.show" persistent max-width="300">
                <v-card>
                    <v-card-title style="padding: 15px;">
                        <v-list-item-content style="text-align: start;">
                            <div class="text-h7" style="margin-bottom: 5px;"> NEW TRIP REQUEST</div>
                            <v-list-item-subtitle class="text-wrap" style="font-weight: normal; word-break: break-word;">
                                ORIGIN: {{ tripRequestModal.tripData?.originAddress }}
                            </v-list-item-subtitle>
                            <v-list-item-subtitle class="text-wrap" style="font-weight: normal; word-break: break-word;">
                                DESTINATION: {{ tripRequestModal.tripData?.destinationAddress }}
                            </v-list-item-subtitle>
                            <v-list-item-subtitle style="font-weight: normal;">
                                <small> {{ tripRequestModal.tripData?.distance }} - {{ tripRequestModal.tripData?.duration }} </small>
                            </v-list-item-subtitle>
                        </v-list-item-content>
                    </v-card-title>
                    <v-card-text style="padding: 10px 0px 10px 0px;">
                        <v-progress-linear v-model="tripRequestModal.progress" height="20">
                            <strong>{{ tripRequestModal.progress/20 }}</strong>
                        </v-progress-linear>
                    </v-card-text>
                    <v-divider></v-divider>
                    <v-card-actions style="padding-left: 10px;">
                        <v-btn style="width:50%;"
                               depressed
                               color="primary"
                               v-bind:disabled="buttonAcceptRejectDisabled"
                               v-on:click.stop="acceptTripRequestAsync()">
                            ACCEPT
                        </v-btn>
                        <v-btn style="width:50%;"
                               depressed
                               color="error"
                               v-bind:disabled="buttonAcceptRejectDisabled"
                               v-on:click.stop="rejectTripRequestAsync()">
                            REJECT
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
            <v-row align="center" justify="center">
                <div class="text-center" style="width: -webkit-fill-available;">
                    <v-card class="mx-auto" flat>
                        <v-card-title style="text-align: left; padding: 10px 10px 0px 10px;">
                            <v-text-field label="ORIGIN"
                                          v-model.trim="inputOriginText"
                                          outlined filled
                                          disabled
                                          dense
                                          style="height:50px;">
                            </v-text-field>
                            <v-text-field label="DESTINATION"
                                          v-model.trim="inputDestinationText"
                                          outlined filled
                                          disabled
                                          dense
                                          style="height:50px;">
                            </v-text-field>
                        </v-card-title>
                        <v-divider></v-divider>
                        <v-card-text class="text--primary" style="height:60vh;padding:0px;">
                            <div id="driverMapDiv" style="height:inherit;">
                                <h2>MAP</h2>
                            </div>
                        </v-card-text>
                        <v-divider></v-divider>
                        <v-card-actions style="padding-right: 15px;">
                            <v-btn style="width:50%;"
                                   depressed
                                   v-bind:color="isUserOnline()===true? 'error' : 'success'"
                                   v-bind:disabled="buttonGoOfflineOnlineDisabled"
                                   v-on:click.stop="changeOnlineStatusAsync()">
                                GO {{ isUserOnline()===true? 'OFFLINE' : 'ONLINE'  }}
                            </v-btn>
                            <v-btn style="width:50%;"
                                   depressed
                                   color="error"
                                   v-bind:disabled="buttonCancelTripDisabled"
                                   v-on:click.stop="cancelTripAsync()">
                                CANCEL TRIP
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </div>
            </v-row>
        </div>
    </v-container>
</template>

<script>
    import DRIVER_MAP from "../viewmodels/driver_map"
    import TRIP from "../viewmodels/trip"
    import loader from "@/components/loader"
    import { distances, trip_states } from "../libs";
    import { get, getDatabase, off, onValue, ref, set, remove, serverTimestamp, update } from "firebase/database";

    export default {
        name: 'main_driver_view',
        components: { loader },
        data() {
            return {
                currentTrip: null,
                currentTripRef: null,
                inputDestinationText: null,
                inputOriginText: null,
                tripRequestModal: {
                    show: false,
                    tripData: null,
                    progress: 0
                },
                userMap: null
            }
        },
        mounted: async function () {
            const self = this;
            try {
                self.startLoader();
                await self.initializeUserMapAsync();
                self.startTrackingCurrentPositionAsync();
                self.setTripRequestListener();
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
            buttonAcceptRejectDisabled: function () {
                const self = this;
                return Boolean(self.utils.tryGet(() => self.tripRequestModal.progress <= 0));
            },
            buttonCancelTripDisabled: function () {
                const self = this;
                return Boolean(self.utils.tryGet(() => self.tripRequestModal.show || self.currentTrip === null));
            },
            buttonGoOfflineOnlineDisabled: function () {
                const self = this;
                return Boolean(self.utils.tryGet(() => self.tripRequestModal.show || self.currentTrip));
            }
        },
        methods: {
            acceptTripRequestAsync: async function () {
                const self = this;
                try {
                    self.startLoader();
                    let key = self.utils.tryGet(() => {
                        return JSON.parse(JSON.stringify(self.tripRequestModal.tripData.key));
                    });
                    self.closeTripRequestModal();

                    let currentUser = self.userProfile;
                    let database = getDatabase();
                    let tripsRef = ref(database, `trips/${key}`);
                    let snapshot = await get(tripsRef);
                    let tripData = snapshot.val();

                    if (tripData.state !== trip_states.WAITING) {
                        self.rejectTripRequestAsync();
                        throw new Error('This trip is not available anymore.');
                    }

                    await update(tripsRef, {
                        driverKey: currentUser.uid, driverName: currentUser.displayName, state: trip_states.ACCEPTED
                    });

                    let newTrip = new TRIP({
                        key: key.toString(),
                        origin: {
                            lat: tripData.origin.lat, lng: tripData.origin.lng
                        },
                        originAddress: tripData.originAddress,
                        destination: {
                            lat: tripData.destination.lat, lng: tripData.destination.lng
                        },
                        destinationAddress: tripData.destinationAddress,
                        riderKey: tripData.riderKey,
                        riderName: tripData.riderName,
                        driverKey: tripData.driverKey,
                        driverName: tripData.driverName,
                        distance: tripData.distance,
                        duration: tripData.duration,
                        state: trip_states.WAITING,
                        timestamp: serverTimestamp()
                    });

                    self.setTripListener(newTrip.key);
                    self.currentTrip = newTrip;
                    self.inputOriginText = newTrip.originAddress;
                    self.inputDestinationText = newTrip.destinationAddress;

                    let pickUpLocation = self.currentTrip.origin;
                    let pickUpLocationAddress = self.currentTrip.originAddress;
                    self.userMap.setPickUpLocationMarkerAsync(pickUpLocation, pickUpLocationAddress);
                    self.userMap.setRouteToPickUpLocationAsync();
                    self.$alert('You have accepted the request. Please proceed to pick up location.');
                }
                catch ({ name, message }) {
                    clearInterval(window.requestModalInterval);
                    self.$error(message);
                }
                finally {
                    self.stopLoader();
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
                        self.rejectTripRequestAsync();
                        await update(tripsRef, { state: trip_states.CANCELLED });

                        self.$alert('The trip has been cancelled!');
                    }
                }
                catch ({ name, message }) {
                    self.$error(message);
                }
                finally {
                    self.stopLoader();
                }
            },
            changeOnlineStatusAsync: async function () {
                const self = this;
                try {
                    self.startLoader();
                    let database = getDatabase();
                    let currentUser = self.userProfile;
                    let driversRef = ref(database, `drivers/${currentUser.uid}`);

                    if (self.isUserOnline()) {
                        self.$store.commit('SET_USER_ONLINE_STATUS', Boolean(0));
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        await remove(driversRef);
                    }
                    else {
                        let driverInfo = {
                            timestamp: serverTimestamp(), position: null, tripRequest: null
                        };
                        self.$store.commit('SET_USER_ONLINE_STATUS', Boolean(1));
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        await set(driversRef, driverInfo);
                    }
                }
                catch ({ name, message }) {
                    self.$error(message);
                }
                finally {
                    self.stopLoader();
                }
            },
            checkProximityToDestinationAsync: async function (currentPosition) {
                const self = this;
                try {
                    if (self.currentTrip && self.currentTrip.state === trip_states.IN_PROGRESS) {
                        let my_latlng = new google.maps.LatLng(currentPosition.latitude, currentPosition.longitude);
                        let destination = self.currentTrip.destination;
                        let destination_latlng = new google.maps.LatLng(destination.lat, destination.lng);

                        let distanceToDestination = Math.abs(google.maps.geometry.spherical.computeDistanceBetween(my_latlng, destination_latlng));
                        if (distanceToDestination <= distances.METERS_100) {
                            let currentUser = self.userProfile;
                            let database = getDatabase();

                            let tripsRef = ref(database, `trips/${self.currentTrip.key}`);
                            await update(tripsRef, { state: trip_states.FINISHED });

                            let driversRef = ref(database, `drivers/${currentUser.uid}`);
                            await update(driversRef, { tripRequest: null });

                            self.resetInterface();
                            self.$alert('The trip is complete. You have reached the destination!');
                        }
                    }
                }
                catch ({ name, message }) {
                    self.$error(message);
                }
            },
            checkProximityToPickUpLocationAsync: async function (currentPosition) {
                const self = this;
                try {
                    if (self.currentTrip && self.currentTrip.state === trip_states.ACCEPTED) {
                        let my_latlng = new google.maps.LatLng(currentPosition.latitude, currentPosition.longitude);
                        let origin = self.currentTrip.origin;
                        let pickuplocation_latlng = new google.maps.LatLng(origin.lat, origin.lng);

                        let distanceToPickUpLocation = Math.abs(google.maps.geometry.spherical.computeDistanceBetween(my_latlng, pickuplocation_latlng));
                        if (distanceToPickUpLocation <= distances.METERS_100) {
                            let database = getDatabase();
                            let tripsRef = ref(database, `trips/${self.currentTrip.key}`);
                            await update(tripsRef, { state: trip_states.IN_PROGRESS });

                            let destination = self.currentTrip.destination;
                            let destinationAddress = self.currentTrip.destinationAddress;

                            self.userMap.removeAllRoutes();
                            self.userMap.setDestinationMarker(destination.lat, destination.lng, destinationAddress);
                            self.$alert('You have arrived at the pickup location!');
                        }
                    }
                }
                catch ({ name, message }) {
                    self.$error(message);
                }
            },
            closeTripRequestModal: function () {
                const self = this;
                clearInterval(window.requestModalInterval);
                self.tripRequestModal.show = false;
                self.tripRequestModal.tripData = null;
                self.tripRequestModal.progress = 100;
            },
            initializeUserMapAsync: async function () {
                const self = this;
                self.userMap = new DRIVER_MAP('driverMapDiv');
                await new Promise(resolve => setTimeout(resolve, 1500));
            },
            isUserOnline: function () {
                const self = this;
                return Boolean(self.utils.tryGet(() => self.userProfile.online));
            },
            openTripRequestModalAsync: async function (tripKey) {
                const self = this;
                try {
                    let database = getDatabase();
                    let tripsRef = ref(database, `trips/${tripKey}`);
                    let snapshot = await get(tripsRef);
                    let tripData = snapshot.val();

                    if (tripData) {
                        tripData.key = tripKey;
                        self.tripRequestModal.show = true;
                        self.tripRequestModal.tripData = tripData;
                        self.tripRequestModal.progress = 100;

                        window.requestModalInterval = setInterval(() => {
                            if (self.tripRequestModal.show && self.tripRequestModal.progress > 0) {
                                self.tripRequestModal.progress -= 20;
                            }
                            else if (self.tripRequestModal.tripData) {
                                self.rejectTripRequestAsync();
                            }
                        }, 1000);
                    }
                }
                catch ({ name, message }) {
                    clearInterval(window.requestModalInterval);
                    self.$error(message);
                }
            },
            rejectTripRequestAsync: async function () {
                const self = this;
                try {
                    let database = getDatabase();
                    let currentUser = self.userProfile;
                    let usersRef = ref(database, `drivers/${currentUser.uid}`);

                    self.closeTripRequestModal();
                    await update(usersRef, { tripRequest: null });
                }
                catch ({ name, message }) {
                    self.$error(message);
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
                    self.$error(message);
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
            setTripRequestListener: function () {
                const self = this;
                let database = getDatabase();
                let currentUser = self.userProfile;
                let driversRef = ref(database, `drivers/${currentUser.uid}/tripRequest`);

                onValue(driversRef, (snapshot) => {
                    let tripKey = snapshot.val();
                    if (tripKey) {
                        if (self.isUserOnline() && !self.tripRequestModal.tripData && !self.currentTrip) {
                            self.openTripRequestModalAsync(tripKey);
                        }
                    }
                });
            },
            startTrackingCurrentPositionAsync: async function () {
                const self = this;
                try {
                    while (navigator.geolocation) {
                        let currentPosition = await new Promise((resolve, reject) => {
                            navigator.geolocation.getCurrentPosition(resolve, reject, {
                                maximumAge: 50000, timeout: 10000, enableHighAccuracy: true
                            });
                        });
                        let coords = currentPosition.coords;

                        self.userMap.setCenter(coords.latitude, coords.longitude);
                        self.userMap.setCurrentPositionMarker(coords.latitude, coords.longitude);
                        self.userMap.setZoom();

                        if (self.isUserOnline()) {
                            await self.updateCurrentPositionAsync(coords);
                            await self.checkProximityToPickUpLocationAsync(coords);
                            await self.checkProximityToDestinationAsync(coords);
                        }
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
                catch ({ name, message }) {
                    self.$error(message);
                }
            },
            updateCurrentPositionAsync: async function (currentPosition) {
                const self = this;
                let database = getDatabase();
                let currentUser = self.userProfile;
                let driversRef = ref(database, `drivers/${currentUser.uid}`);
                let snapshot = await get(driversRef);
                let val = snapshot.val();
                if (val) {
                    await update(driversRef, {
                        timestamp: serverTimestamp(),
                        position: {
                            lat: currentPosition.latitude, lng: currentPosition.longitude
                        }
                    });
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
                            if (self.currentTrip.state === trip_states.CANCELLED) {
                                self.cancelTripAsync();
                            }
                        }
                    }
                },
                deep: true
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
