import home from '@/views/home'
import login from '@/views/login'
import main_driver_view from '@/views/main_driver_view'
import main_rider_view from '@/views/main_rider_view'
import register from '@/views/register'
import trips_history from '@/views/trips_history'
import user_profile from '@/views/user_profile'
import welcome from '@/views/welcome'
import { getAuth } from "firebase/auth"
import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router);

const router = new Router({
    routes: [
        {
            path: "/",
            redirect: {
                path: "/welcome"
            }
        },
        {
            path: '/welcome',
            name: 'welcome',
            component: welcome
        },
        {
            path: '/login/:role',
            name: 'login',
            component: login
        },
        {
            path: '/register',
            name: 'register',
            component: register
        },
        {
            path: '/home',
            name: 'home',
            component: home,
            children: [
                {
                    path: 'main_rider_view',
                    component: main_rider_view
                },
                {
                    path: 'main_driver_view',
                    component: main_driver_view
                },
                {
                    path: 'user_profile',
                    component: user_profile
                },
                {
                    path: 'trips_history',
                    component: trips_history
                }
            ]
        }
    ]
});

router.beforeEach(async (to, from, next) => {
    const currentUser = await new Promise((resolve, reject) => {
        const auth = getAuth();
        auth.onAuthStateChanged(user => { resolve(user) }, error => { reject(error) });
    });

    if (currentUser) {
        if (to.fullPath.startsWith('/welcome') ||
            to.fullPath.startsWith('/login') ||
            to.fullPath.startsWith('/register')) {
            next(false);
        }
        else {
            next();
        }
    }
    else if (to.fullPath.startsWith('/welcome') ||
        to.fullPath.startsWith('/login') ||
        to.fullPath.startsWith('/register')) {
        next();
    }
    else {
        next('/welcome');
    }
});
export default router;
