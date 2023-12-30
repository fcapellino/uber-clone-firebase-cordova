<template>
    <v-dialog value="true" persistent max-width="200">
        <v-card>
            <v-card-text class="text-center pa-10">
                <v-progress-circular :size="50" color="primary" indeterminate>
                </v-progress-circular>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script>
    export default {
        name: 'loading',
        props: {
            cancel: Boolean, message: String
        }
    }
</script>
