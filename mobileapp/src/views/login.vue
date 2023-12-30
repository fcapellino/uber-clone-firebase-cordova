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
                    <v-card-title style="text-align: left;word-break: break-word;">
                        {{ cardTitle }}
                    </v-card-title>
                    <v-card-text class="text--primary">
                        <v-form ref="loginForm" lazy-validation v-bind:disabled="isLoading">
                            <v-text-field v-model.trim="credentials.email"
                                          label="EMAIL"
                                          :rules="[v => (Boolean(v) && utils.validateEmail(v)) || 'This field is required']">
                            </v-text-field>
                            <v-text-field v-model.trim="credentials.password"
                                          label="PASSWORD"
                                          type="password"
                                          autocomplete="off"
                                          :rules="[v => (Boolean(v) && !utils.isNullOrEmpty(v)) || 'This field is required']">
                            </v-text-field>
                        </v-form>
                    </v-card-text>
                    <v-divider></v-divider>
                    <v-card-actions style="padding:15px;">
                        <v-spacer></v-spacer>
                        <v-btn depressed
                               color="primary"
                               v-bind:disabled="isLoading"
                               v-on:click.stop="loginAsync()">
                            SIGN IN
                        </v-btn>
                        <v-btn depressed
                               color="error"
                               v-bind:disabled="isLoading"
                               v-on:click.stop="returnToWelcomeScreen()">
                            CANCEL
                        </v-btn>
                    </v-card-actions>
                </v-row>
            </v-container>
        </v-main>
    </v-app>
</template>

<script>
    import 'firebase/compat/auth';
    import loader from "@/components/loader"
    import { get, getDatabase, ref } from "firebase/database";
    import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
    import { roles } from "../libs/index";

    export default {
        name: 'login',
        components: { loader },
        data() {
            return {
                credentials: {
                    email: null,
                    password: null
                }
            }
        },
        mounted() {
            const self = this;
            self.$refs.loginForm.reset();
        },
        computed: {
            routeParams: function () {
                const self = this;
                return self.$route.params;
            },
            cardTitle: function () {
                const self = this;
                return self.routeParams.role === roles.RIDER
                    ? 'SIGN IN AS A RIDER' : 'SIGN IN AS A DRIVER'
            }
        },
        methods: {
            loginAsync: async function () {
                const self = this;
                try {
                    self.startLoader();
                    if (self.$refs.loginForm.validate()) {
                        let userCredentials = {
                            email: self.utils.tryGet(() => self.credentials.email.toLowerCase().trim()),
                            password: self.utils.tryGet(() => self.credentials.password)
                        };

                        const auth = getAuth();
                        const userCredential = await signInWithEmailAndPassword(auth, userCredentials.email, userCredentials.password);

                        let database = getDatabase();
                        let usersRef = ref(database, `users/${userCredential.user.uid}`);
                        let snapshot = await get(usersRef);

                        let user = snapshot.val();
                        if (user) {
                            let userProfile = {
                                uid: self.utils.tryGet(() => user.uid),
                                displayName: self.utils.tryGet(() => user.displayName),
                                email: self.utils.tryGet(() => user.email),
                                role: self.utils.tryGet(() => self.routeParams.role),
                                userScore: self.utils.tryGet(() => user.userScore)
                            };
                            self.$store.commit('SET_USER', userProfile);
                            self.returnToHomeScreen();
                        }
                        else {
                            throw new Error('User credentials are not valid.');
                        }
                    }
                }
                catch ({ name, message }) {
                    let errormsg = message || 'Error. The operation cannot be completed.';
                    self.$error(errormsg);
                }
                finally {
                    self.stopLoader();
                }
            },
            returnToWelcomeScreen: function () {
                const self = this;
                self.$router.push({ path: '/welcome' });
            }
        }
    }
</script>
