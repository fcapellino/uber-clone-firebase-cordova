<template>
    <v-container text-center>
        <div class="home">
            <loader v-if="isLoading" />
            <v-row align="center" justify="center">
                <v-card-title style="text-align: left;word-break: break-word;">
                    UPDATE USER ACCOUNT INFORMATION
                </v-card-title>
                <v-card-text class="text--primary">
                    <v-form ref="userAccountForm" lazy-validation v-bind:disabled="isLoading">
                        <v-text-field v-model.trim="userAccount.fullName"
                                      label="FULL NAME"
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
                           v-on:click.stop="updateUserAccountAsync()">
                        UPDATE
                    </v-btn>
                    <v-btn depressed
                           color="error"
                           v-bind:disabled="isLoading"
                           v-on:click.stop="returnToHomeScreen()">
                        CANCEL
                    </v-btn>
                </v-card-actions>
            </v-row>
        </div>
    </v-container>
</template>

<script>
    import 'firebase/compat/auth';
    import loader from "@/components/loader"
    import { getAuth, updateProfile } from "firebase/auth";
    import { getDatabase, ref, update } from "firebase/database";

    export default {
        name: 'user_profile',
        components: { loader },
        data() {
            return {
                userAccount: {
                    fullName: null
                }
            }
        },
        mounted() {
            const self = this;
            self.$refs.userAccountForm.reset();
        },
        methods: {
            updateUserAccountAsync: async function () {
                const self = this;
                try {
                    self.startLoader();
                    if (self.$refs.userAccountForm.validate()) {
                        let userAccount = {
                            fullName: self.utils.tryGet(() => self.userAccount.fullName.toUpperCase().trim())
                        };

                        const auth = getAuth();
                        const currentUser = auth.currentUser;
                        await updateProfile(currentUser, { displayName: userAccount.fullName });

                        let database = getDatabase();
                        let usersRef = ref(database, `users/${currentUser.uid}`);
                        await update(usersRef, { displayName: userAccount.fullName });
                        await new Promise(resolve => setTimeout(resolve, 2500));

                        self.$store.commit('SET_USER_DISPLAY_NAME', userAccount.fullName);
                        self.$alert("Your user profile has been successfully updated.");
                        self.$refs.userAccountForm.reset();
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
