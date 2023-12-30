<template>
    <div>
        <v-toolbar class="indigo" flat />
        <v-list-item v-on:click.stop="">
            <v-list-item-icon>
                <v-icon>account_circle</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
                <v-list-item-title class="">{{ userProfile?.displayName }}</v-list-item-title>
                <v-list-item-title class="text-caption">{{ userProfile?.email }}</v-list-item-title>
                <v-list-item-title class="text-caption" v-if="userProfile?.role==='driver'">
                    SCORE: {{ userScoreAsNumber }}
                </v-list-item-title>
            </v-list-item-content>
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item v-for="(item, i) in items" :key="`item_${i}`" :to="item.action">
            <v-list-item-icon>
                <v-icon v-text="item.icon"></v-icon>
            </v-list-item-icon>
            <v-list-item-content>
                <v-list-item-title class="" v-text="item.text"></v-list-item-title>
            </v-list-item-content>
        </v-list-item>
        <v-list-item v-on:click.stop="logoutAsync()">
            <v-list-item-icon>
                <v-icon>logout</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
                <v-list-item-title class="">LOGOUT</v-list-item-title>
            </v-list-item-content>
        </v-list-item>
        <loader v-if="isLoading" />
    </div>
</template>

<script>
    import 'firebase/compat/auth';
    import loader from "@/components/loader"
    import { getAuth, signOut } from "firebase/auth";
    import { getDatabase, onValue, ref, remove, off, onDisconnect } from "firebase/database";
    import { roles } from "../libs/index";

    export default {
        name: "drawer",
        components: { loader },
        data: function () {
            return {
                currentUserRef: null
            }
        },
        mounted: async function () {
            const self = this;
            try {
                self.setOnUserDisconnectedListener();
                self.setUserProfileListener();
            }
            catch ({ name, message }) {
                self.$error(message);
            }
        },
        beforeDestroy: function () {
            const self = this;
            try {
                self.removeUserProfileListener();
            }
            catch ({ name, message }) {
                let errormsg = message || 'Error. The operation cannot be completed.';
                self.$error(errormsg);
            }
        },
        computed: {
            items: function () {
                const self = this;
                let menuItems = [];

                if (self.userProfile) {
                    let role = self.userProfile?.role;
                    menuItems = [
                        {
                            icon: 'home',
                            text: this.$t("drawer.home"),
                            action: (role === roles.RIDER)
                                ? 'main_rider_view' : 'main_driver_view'
                        },
                        {
                            icon: 'contacts',
                            text: this.$t('drawer.user_profile'),
                            action: 'user_profile'
                        },
                        {
                            icon: 'list',
                            text: this.$t('drawer.trips_history'),
                            action: 'trips_history'
                        }
                    ];
                }

                return self.utils.tryGet(() => menuItems);
            },
            userScoreAsNumber: function () {
                const self = this;
                let userScore = self.userProfile?.userScore;
                let sumOfVotes = self.utils.tryGetNumber(() => Number(userScore.split('|')[0]));
                let votes = self.utils.tryGetNumber(() => Number(userScore.split('|')[1]));
                return self.utils.tryGetNumber(() => Number((sumOfVotes / votes).toFixed(4)));
            }
        },
        methods: {
            logoutAsync: async function () {
                const self = this;
                try {
                    self.startLoader();
                    if (self.userProfile) {
                        if (self.userProfile.role === roles.DRIVER) {
                            self.$store.commit('SET_USER_ONLINE_STATUS', Boolean(0));
                            let database = getDatabase();
                            let driversRef = ref(database, `drivers/${self.userProfile.uid}`);
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            await remove(driversRef);
                        }
                    }

                    const auth = getAuth();
                    await signOut(auth);
                    self.$store.commit('RESET_STORE');
                    self.$router.push({ path: '/welcome' });
                }
                catch ({ name, message }) {
                    self.$error(message);
                }
                finally {
                    self.stopLoader();
                }
            },
            removeUserProfileListener: function () {
                const self = this;
                try {
                    if (self.currentUserRef) {
                        off(self.currentUserRef);
                        self.currentUserRef = null;
                    }
                }
                catch ({ name, message }) {
                    self.$error(message);
                }
            },
            setOnUserDisconnectedListener: function () {
                let self = this;
                if (self.userProfile) {
                    if (self.userProfile.role === roles.DRIVER) {
                        let database = getDatabase();
                        let driversRef = ref(database, `drivers/${self.userProfile.uid}`);
                        onDisconnect(driversRef).remove();
                    }
                }
            },
            setUserProfileListener: function () {
                const self = this;
                if (self.userProfile && !self.currentTripRef) {
                    let database = getDatabase();
                    self.currentUserRef = ref(database, `users/${self.userProfile.uid}`);
                    onValue(self.currentUserRef, (snapshot) => {
                        let user = snapshot.val();
                        if (user) {
                            self.$store.commit('SET_USER_DISPLAY_NAME', user.displayName);
                            self.$store.commit('SET_USER_SCORE', user.userScore);
                        }
                    });
                }
            }
        }
    }
</script>
