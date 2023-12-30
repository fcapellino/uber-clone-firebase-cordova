export const cities = Object.freeze({
    SAN_FRANCISCO_CORDOBA_ARGENTINA: { lat: -31, lng: -64 }
});
export const distances = Object.freeze({
    METERS_100: 100,
    METERS_500: 500
});
export const roles = Object.freeze({
    RIDER: 'rider', DRIVER: 'driver'
});
export const trip_states = Object.freeze({
    WAITING: 'waiting', ACCEPTED: 'accepted', IN_PROGRESS: 'in_progress', CANCELLED: 'cancelled', FINISHED: 'finished'
});
export const utilities = Object.freeze({
    isNullOrEmpty: function (text) {
        return (text) ? (text.toString().match(/^ *$/) !== null) : true;
    },
    tryGet: function (func) {
        try {
            return func() || void 0;
        } catch ({ name, message }) {
            return;
        }
    },
    tryGetNumber: function (func) {
        try {
            let e = func();
            return e && !isNaN(e) ? e : 0;
        } catch ({ name, message }) {
            return 0;
        }
    },
    validateEmail: function (text) {
        return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(String(text).toLowerCase());
    }
});
