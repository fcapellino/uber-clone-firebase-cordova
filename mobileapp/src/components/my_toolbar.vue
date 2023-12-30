<template>
    <div>
        <v-navigation-drawer v-model="drawer" app>
            <myContentDrawer />
        </v-navigation-drawer>
        <v-app-bar class="indigo" clipped-left app>
            <v-app-bar-nav-icon dark v-on:click.stop="drawer=!drawer" v-bind:disabled="tripCreated"></v-app-bar-nav-icon>
            <v-toolbar-title v-on:click.stop="goHome" class="white--text">
                {{ $t("title") }}
            </v-toolbar-title>
        </v-app-bar>
    </div>
</template>

<script>
    import myContentDrawer from "@/components/drawer"

    export default {
        name: "myToolbar",
        components: { myContentDrawer },
        data: function () {
            return {
                drawer: false
            }
        },
        mounted: function () {
            // listen for event opendrawer (triggered by other component, like the button in the home)
            document.addEventListener("toggleDrawer", this.toggleDrawer);
        },
        beforeDestroy: function () {
            // if the component is unmount, unlisten the event.
            document.removeEventListener("toggleDrawer", this.toggleDrawer);
        },
        computed: {
            tripCreated: function () {
                const self = this;
                return Boolean(self.utils.tryGet(() => self.$store.getters.getCurrentTrip));
            }
        },
        methods: {
            toggleDrawer() {
                this.drawer = !this.drawer;
            },
            goHome() {
                window.location.hash = "/";
            }
        }
    }
</script>
