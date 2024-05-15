import { supabase } from "$lib/supabaseClient";
import { redirect } from '@sveltejs/kit';

export async function load({cookies}) {
    const access = cookies.get("loginCredents");
    // console.log(access);
    const userSession = cookies.get("sessionId");
    // console.log(userSession);

    let loggedUser = [];
    let environmentMode = "development";
    console.log(`[routes./workspace/+page.server.js] Running on ${environmentMode} environment.`)

    const { data: sessions, error } = await supabase.from("public_sessions").select();
    const { data: users, error: usersError } = await supabase.from("users").select();

    if(error) {
        console.error("Unable to pull sessions: ", error);
        throw redirect(302, "/");
    }
    if(usersError) {
        console.error("Unable to pull users records: ", usersError);
        throw redirect(302, "/");
    }

    //Search for logged session
    const foundSession = sessions.find((session) => session.session_key == userSession);
    if(!foundSession) {
        console.error("Unable to find session using: ", userSession);
        throw redirect(302, "/");
    }

    loggedUser = users.find((user) => user.id == foundSession.user);
    if(!loggedUser) {
        console.error("Unable to find user from session id: ", foundSession.user);
        throw redirect(302, "/");
    }
    if(loggedUser.user_type != "driver") {
        throw redirect(302, "/");
    }

    return {
        access: access,
        loggedUser: loggedUser
    }
}