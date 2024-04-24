// import { users } from '../data.js';
import { redirect } from '@sveltejs/kit';
import { supabase } from "$lib/supabaseClient";

export async function load({ cookies }) {
	cookies.set('loginCredents', 'false', {
        path: '/',
        maxAge: -1,
    });
}

export const actions = {
    default: async ({request, cookies }) => {
        const { data: users, error } = await supabase.from("users").select();
        if(error) return console.error(error);
        const data = await request.formData();
        const username = data.get('username');
        const password = data.get('password');

        let formError = "IncorrectCredentials";

        let userLogin = users.find((user) => user.username == username);
        if(!userLogin) return redirect(303, `/signin?errorSignin=${formError}`);

        if (userLogin.username == username && userLogin.password == password) {
            console.log("Login Successful");

            cookies.set('loginCredents', 'true', {path: '/', sameSite: "strict"});
            throw redirect(302, "/");
            
        } else {
            formError = "IncorrectCredentials";
            redirect(303, `/signin?errorSignin=${formError}`);
        }
    }
}