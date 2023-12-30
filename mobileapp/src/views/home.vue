<template>
    <v-app toolbar id="inspire">
        <myToolbar />
        <v-main>
            <v-slide-y-transition mode="out-in">
                <v-container pa-0 fluid fill-height align-content-center align-center>
                    <router-view></router-view>
                </v-container>
            </v-slide-y-transition>
        </v-main>
    </v-app>
</template>

<script>
    import myToolbar from "@/components/my_toolbar"

    export default {
        name: 'home',
        components: { myToolbar },
        methods: {}
    }
</script>
