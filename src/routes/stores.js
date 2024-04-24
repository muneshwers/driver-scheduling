import { writable } from 'svelte/store';

function createLogInCheck() {
    const {subscribe, set } = writable(false);

    return {
        subscribe,
        logOut: () => set(false),
        logIn: () => set(true)
    }
}

export const logInCheck = createLogInCheck();