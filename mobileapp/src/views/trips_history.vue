<template>
    <v-container text-center>
        <div class="home">
            <loader v-if="isLoading" />
            <v-row align="center" justify="center">
                <div class="text-center" style="width: -webkit-fill-available;">
                    <v-card class="mx-auto" flat>
                        <v-card-title style="text-align: left; padding: 10px 10px 0px 10px;">
                            <v-text-field v-model.trim="searchTerm"
                                          label="SEARCH"
                                          outlined filled
                                          style="margin-bottom: -20px;"
                                          clearable>
                            </v-text-field>
                        </v-card-title>
                        <v-divider></v-divider>
                        <v-card-text class="text--primary" style="padding: 0px;min-height:525px;">
                            <div style="overflow-y: scroll; max-height: 75vh;">
                                <v-list>
                                    <template v-for="(item, index) in filteredTripsList">
                                        <v-list-item :key="item.key">
                                            <template>
                                                <v-list-item-content style="text-align: start;">
                                                    <v-list-item-title> {{ item.dateString }} </v-list-item-title>
                                                    <v-list-item-subtitle class="text-wrap" style="word-break: break-word;"> ORIGIN: {{ item.originAddress }} </v-list-item-subtitle>
                                                    <v-list-item-subtitle class="text-wrap" style="word-break: break-word;"> DESTINATION: {{ item.destinationAddress }} </v-list-item-subtitle>
                                                    <v-list-item-subtitle>
                                                        <small> {{ item.distance }} - {{ item.duration }} </small>
                                                    </v-list-item-subtitle>
                                                </v-list-item-content>
                                            </template>
                                        </v-list-item>
                                        <v-divider v-if="index < filteredTripsList?.length" :key="index"></v-divider>
                                    </template>
                                    <div v-if="!filteredTripsList?.length">
                                        <small>NO DATA AVAILABLE</small>
                                    </div>
                                </v-list>
                            </div>
                        </v-card-text>
                    </v-card>
                </div>
            </v-row>
        </div>
    </v-container>
</template>

<script>
    import 'firebase/compat/auth';
    import loader from "@/components/loader"
    import { roles, trip_states } from "../libs/index";
    import { equalTo, get, getDatabase, orderByChild, query, ref } from "firebase/database";

    export default {
        name: 'user_profile',
        components: { loader },
        data() {
            return {
                searchTerm: null,
                tripsList: []
            }
        },
        mounted: async function () {
            const self = this;
            await self.getAllTripsAsync();
        },
        computed: {
            filteredTripsList: function () {
                const self = this;
                return self.tripsList.filter(function (item) {
                    if (item.state === trip_states.FINISHED) {
                        if (!self.utils.isNullOrEmpty(self.searchTerm)) {
                            let text = JSON.stringify(item).toLowerCase();
                            return text.includes(self.searchTerm.toLowerCase());
                        }
                        else {
                            return true;
                        }
                    }
                });
            }
        },
        methods: {
            openMenu: function () {
                // when user tap the button dispatch an event into the dom.
                // its will trigger the drawer open event in (componnents/drawer.vue)
                document.dispatchEvent(new CustomEvent("toggleDrawer", {}));
            },
            getAllTripsAsync: async function () {
                const self = this;
                try {
                    self.startLoader();
                    let tList = [];

                    let uid = self.userProfile?.uid;
                    let role = self.userProfile?.role === roles.RIDER
                        ? 'riderKey' : 'driverKey';

                    let database = getDatabase();
                    let newquery = query(ref(database, 'trips/'), orderByChild(role), equalTo(uid));
                    let snapshot = await get(newquery);
                    let val = snapshot.val();
                    if (val) {
                        Object.entries(val).forEach(entry => {
                            const [key, value] = entry;
                            let trip_entry = {
                                key: key.toString(),
                                originAddress: value.originAddress,
                                destinationAddress: value.destinationAddress,
                                distance: value.distance,
                                duration: value.duration,
                                state: value.state,
                                timestamp: value.timestamp,
                                dateString: new Date(value.timestamp).toLocaleDateString()
                            };
                            tList.push(trip_entry);
                        });
                        self.tripsList = tList.sort((x, y) => y.timestamp - x.timestamp);
                    }
                }
                catch ({ name, message }) {
                    let errormsg = message || 'Error. The operation cannot be completed.';
                    self.$error(errormsg);
                }
                finally {
                    self.stopLoader();
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
