import vue from 'vue';
import vuex from 'vuex';

vue.use(vuex)

const state = {
    currentUser: null,
    currentTrip: null
};
const mutations = {
    SET_USER: function (state, user) {
        state.currentUser = user
    },
    SET_USER_DISPLAY_NAME: function (state, displayName) {
        state.currentUser.displayName = displayName
    },
    SET_USER_SCORE: function (state, score) {
        state.currentUser.userScore = score
    },
    SET_USER_ONLINE_STATUS: function (state, online) {
        state.currentUser.online = online
    },
    SET_TRIP: function (state, trip) {
        state.currentTrip = trip
    },
    RESET_STORE: function (state) {
        const self = this;
        self.replaceState(Object.assign(state, null));
    }
};
const actions = {
    setUser: function (state, user) {
        state.commit('SET_USER', user)
    },
    setUserDisplayName: function (state, displayName) {
        state.commit('SET_USER_DISPLAY_NAME', displayName)
    },
    setUserScore: function (state, score) {
        state.commit('SET_USER_SCORE', score)
    },
    setUserOnlineStatus: function (state, online) {
        state.commit('SET_USER_ONLINE_STATUS', online)
    },
    setTrip: function (state, trip) {
        state.commit('SET_TRIP', trip)
    }
};
const getters = {
    getCurrentUser: function () {
        return state.currentUser
    },
    getCurrentTrip: function () {
        return state.currentTrip
    }
};

const store = new vuex.Store({
    state, mutations, actions, getters
});
export default store;
