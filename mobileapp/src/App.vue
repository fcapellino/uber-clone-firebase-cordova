<template>
    <v-app toolbar id="inspire">
        <router-view></router-view>
    </v-app>
</template>

<script>
    import myToolbar from "@/components/my_toolbar"
    export default {
        name: 'app',
        components: { myToolbar }
    }
</script>
