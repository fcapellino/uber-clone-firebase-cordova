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
                        REGISTER AND START USING OUR PLATFORM
                    </v-card-title>
                    <v-card-text class="text--primary">
                        <v-form ref="newUserAccountForm" lazy-validation v-bind:disabled="isLoading">
                            <v-text-field v-model.trim="newUserAccount.fullName"
                                          label="FULL NAME"
                                          :rules="[v => (Boolean(v) && !utils.isNullOrEmpty(v)) || 'This field is required']">
                            </v-text-field>
                            <v-text-field v-model.trim="newUserAccount.email"
                                          label="EMAIL"
                                          :rules="[v => (Boolean(v) && utils.validateEmail(v)) || 'This field is required']">
                            </v-text-field>
                            <v-text-field v-model.trim="newUserAccount.password"
                                          label="PASSWORD"
                                          type="password"
                                          autocomplete="off"
                                          :rules="[v => (Boolean(v) && !utils.isNullOrEmpty(v)) || 'This field is required', v => (v && v.length >= 8) || 'The password must have at least eight characters']">
                            </v-text-field>
                        </v-form>
                    </v-card-text>
                    <v-divider></v-divider>
                    <v-card-actions style="padding:15px;">
                        <v-spacer></v-spacer>
                        <v-btn depressed
                               color="primary"
                               v-bind:disabled="isLoading"
                               v-on:click.stop="createNewUserAccountAsync()">
                            CREATE ACCOUNT
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
    import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } from "firebase/auth";
    import { getDatabase, ref, set } from "firebase/database";

    export default {
        name: 'register',
        components: { loader },
        data() {
            return {
                newUserAccount: {
                    fullName: null,
                    email: null,
                    password: null
                }
            }
        },
        mounted() {
            const self = this;
            self.$refs.newUserAccountForm.reset();
        },
        methods: {
            createNewUserAccountAsync: async function () {
                const self = this;
                try {
                    self.startLoader();
                    if (self.$refs.newUserAccountForm.validate()) {
                        let newUserAccount = {
                            fullName: self.utils.tryGet(() => self.newUserAccount.fullName.toUpperCase().trim()),
                            email: self.utils.tryGet(() => self.newUserAccount.email.toLowerCase().trim()),
                            password: self.utils.tryGet(() => self.newUserAccount.password)
                        };

                        const auth = getAuth();
                        await createUserWithEmailAndPassword(auth, newUserAccount.email, newUserAccount.password);
                        await updateProfile(auth.currentUser, { displayName: newUserAccount.fullName });

                        let database = getDatabase();
                        let currentUser = auth.currentUser;
                        let usersRef = ref(database, `users/${currentUser.uid}`);

                        let userProfile = {
                            uid: self.utils.tryGet(() => currentUser.uid),
                            displayName: self.utils.tryGet(() => currentUser.displayName),
                            email: self.utils.tryGet(() => currentUser.email),
                            userScore: null
                        };
                        await set(usersRef, userProfile);
                        await signOut(auth);
                        await new Promise(resolve => setTimeout(resolve, 1500));

                        self.$alert("Thanks for signing up. Your account has been successfully created.");

                        self.$refs.newUserAccountForm.reset();
                        self.$router.push({ path: '/welcome' });
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
