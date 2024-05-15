// import { users } from '../data.js';
import { redirect } from '@sveltejs/kit';
import { supabase } from "$lib/supabaseClient";
import { v4 as uuidv4} from 'uuid';

export async function load({ cookies }) {
	
    const logOutSession = cookies.get("sessionId");
    const { error } = await supabase.from("public_sessions").update({
        logged_out: (new Date(Date.now())).toISOString().slice(0, -1),
    })
    .eq('session_key', logOutSession);
    if(error) {
        console.error("Unable to log out session: ", error);
        throw redirect(302, "/");
    }
    cookies.set('loginCredents', 'false', {
        path: '/',
        maxAge: -1,
    });
    cookies.set('sessionId', '', {
        path: '/',
        maxAge: -1,
    });
}

export const actions = {
    default: async ({request, cookies }) => {
        const { data: users, error } = await supabase.from("users").select();
        if(error) return console.error(error);
        const data = await request.formData();
        const username = data.get('username').toLowerCase();
        const password = data.get('password');

        let formError = "IncorrectCredentials";

        let userLogin = users.find((user) => user.username == username);
        if(!userLogin) return redirect(303, `/signin?errorSignin=${formError}`);

        if (userLogin.username == username && userLogin.password == password) {
            console.log("Login Successful");
            const sessionId = uuidv4();

            let sessionDetails = {
                user: userLogin.id,
                session_key: sessionId
            }

            cookies.set('sessionId', sessionId, {path: '/', httpOnly: true,  sameSite: 'strict'});
            const { error } = await supabase.from('public_sessions').insert([sessionDetails]);
            if (error) return console.error("Unable to log session: ", error);

            cookies.set('loginCredents', 'true', {path: '/', httpOnly: true, sameSite: "strict"});
            throw redirect(302, "/");
            
        } else {
            formError = "IncorrectCredentials";
            redirect(303, `/signin?errorSignin=${formError}`);
        }
    }
}