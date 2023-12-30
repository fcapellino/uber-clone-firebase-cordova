import config from '../appsettings.json';

import './plugins/vuetify-extra';
import '@babel/polyfill';
import 'firebase/compat/auth';
import App from './App.vue';
import Vue from 'vue';
import VuetifyDialogPromise from "vuetify-dialog-promise";
import firebase from 'firebase/compat/app';
import i18n from './i18n';
import router from './router/index';
import store from './store/index';
import vuetify from './plugins/vuetify';
import { Loader } from '@googlemaps/js-api-loader';
import { getAuth, inMemoryPersistence, setPersistence, signOut } from "firebase/auth";
import { roles, utilities } from "./libs/index";

const firebaseConfig = config.firebase;
firebase.initializeApp(firebaseConfig);
window.firebase = firebase;

Vue.config.productionTip = false;
Vue.use(VuetifyDialogPromise, {
    locale: "en", snackbarX: "left", snackbarY: "bottom"
});
Vue.mixin({
    data: function () {
        return {
            isLoading: false,
            utils: utilities
        }
    },
    computed: {
        userProfile: function () {
            const self = this;
            return self.$store.getters.getCurrentUser;
        }
    },
    methods: {
        returnToHomeScreen: function () {
            const self = this;
            self.$router.push({
                path: self.userProfile?.role === roles.RIDER
                    ? '/home/main_rider_view' : '/home/main_driver_view'
            });
        },
        startLoader() {
            const self = this;
            self.isLoading = true;
        },
        stopLoader() {
            const self = this;
            self.isLoading = false;
        }
    },
});

const init = async () => {
    new Vue({
        vuetify,
        router,
        store,
        i18n,
        render: h => h(App)
    }).$mount('#app');
};

// wait for the deviceready event to start the render
document.addEventListener("deviceready", async () => {
    // eslint-disable-next-line
    try {
        const auth = getAuth();
        await setPersistence(auth, inMemoryPersistence);
        await signOut(auth);
        const gmloader = new Loader({
            apiKey: firebaseConfig.apiKey, libraries: ['geometry', 'places']
        });
        await gmloader.load();
    }
    catch ({ name, message }) {
        return;
    }
    finally {
        await init();
    }
});

const previousPreventDefault = TouchEvent.prototype.preventDefault;
TouchEvent.prototype.preventDefault = function () {
    if (this.cancelable) {
        previousPreventDefault.call(this);
    }
}

// if we are not in cordova, manually trigger the deviceready event
const isCordovaApp = (typeof window.cordova !== "undefined");
if (!isCordovaApp) {
    document.dispatchEvent(new CustomEvent("deviceready", {}));
}
