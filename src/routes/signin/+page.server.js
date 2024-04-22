// import { users } from '../data.js';
import { redirect } from '@sveltejs/kit';
import { supabase } from "$lib/supabaseClient";


export const actions = {
    default: async ({request}) => {
        const { data: users, error } = await supabase.from("users").select();
        if(error) return console.error(error);
        console.log(users);
        const data = await request.formData();
        const username = data.get('username');
        const password = data.get('password');
        let formError = "IncorrectCredentials";

        let userLogin = users.find((user) => user.username == username);
        if(!userLogin) return redirect(303, `/signin?errorSignin=${formError}`);

        if (userLogin.username == username && userLogin.password == password) {
            console.log("Login Successful");
            const data = { isLoggedIn: true };
            redirect(303, `/?isLoggedIn=${data.isLoggedIn}`);
        } else {
            formError = "IncorrectCredentials";
            redirect(303, `/signin?errorSignin=${formError}`);
        }
    }
}