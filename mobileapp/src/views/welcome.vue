<template>
    <v-app toolbar id="inspire">
        <v-app-bar class="indigo" clipped-left app>
            <v-app-bar-nav-icon dark v-on:click.stop=""></v-app-bar-nav-icon>
            <v-toolbar-title v-on:click.stop="" class="white--text">MY-UBER-CLONE</v-toolbar-title>
        </v-app-bar>
        <v-main>
            <v-container fill-height fluid>
                <loader v-if="isLoading" />
                <v-row align="center" justify="center">
                    <div class="text-center">
                        <div style="width:320px;text-align:center;">
                            <v-btn color="primary"
                                   width="150" height="100"
                                   class="ma-1 white--text"
                                   v-bind:disabled="buttonDisabled"
                                   v-on:click.stop="redirectToLoginScreen(userRoles.RIDER)">
                                <span class="text-wrap" style="width: 75%;">SIGN IN AS A RIDER</span>
                            </v-btn>
                            <v-btn color="error"
                                   width="150" height="100"
                                   class="ma-1 white--text"
                                   v-bind:disabled="buttonDisabled"
                                   v-on:click.stop="redirectToLoginScreen(userRoles.DRIVER)">
                                <span class="text-wrap" style="width: 75%;">SIGN IN AS A DRIVER</span>
                            </v-btn>
                        </div>
                    </div>
                </v-row>
                <v-row align="center" justify="center">
                    <div class="text-center">
                        <div style="width:320px;text-align:center;">
                            <v-btn color="blue-grey"
                                   class="ma-2 white--text"
                                   style="width: 305px;"
                                   v-bind:disabled="buttonDisabled"
                                   v-on:click.stop="redirectToRegisterScreen()">
                                REGISTER NEW ACCOUNT
                            </v-btn>
                        </div>
                    </div>
                </v-row>
            </v-container>
        </v-main>
    </v-app>
</template>

<script>
    import loader from "@/components/loader"
    import { roles } from "../libs/index";

    export default {
        name: 'welcome',
        components: { loader },
        data() {
            return {
                buttonDisabled: true,
                userRoles: roles
            }
        },
        mounted: async function () {
            const self = this;
            try {
                self.startLoader();
                await self.checkGeolocationAsync();
            }
            catch ({ name, message }) {
                self.$error(message);
            }
            finally {
                self.stopLoader();
            }
        },
        methods: {
            checkGeolocationAsync: async function () {
                const self = this;
                try {
                    let currentPosition = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            maximumAge: 50000, timeout: 20000, enableHighAccuracy: true
                        });
                    });
                    await new Promise(resolve => setTimeout(resolve, 500));

                    let coords = self.utils.tryGet(() => currentPosition.coords);
                    if (coords) {
                        self.buttonDisabled = false;
                    }
                }
                catch ({ name, message }) {
                    self.$error(message.toUpperCase());
                }
            },
            redirectToLoginScreen: function (userRol) {
                const self = this;
                self.$router.push({ name: 'login', params: { role: userRol } });
            },
            redirectToRegisterScreen: function () {
                const self = this;
                self.$router.push({ path: '/register' });
            }
        }
    }
</script>
