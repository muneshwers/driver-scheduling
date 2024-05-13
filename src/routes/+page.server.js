import { supabase } from "$lib/supabaseClient";
import { redirect } from '@sveltejs/kit';

  export async function load({cookies}) {
    //Get cookies
    const access = cookies.get("loginCredents");
    let loggedUser = [];
    let environmentMode = "development"; //Options "development" and "production"
    console.log(`[routes/+page.server.js] Running on ${environmentMode} environment.`)


    if (access) {
      const userSession = cookies.get("sessionId");

      //Pulls session for session ID
      const { data: sessions, error } = await supabase.from("public_sessions").select();
      const { data: users, error: usersError } = await supabase.from("users").select();
      if(error) {
        console.error("Unable to pull sessions: ", error);
        throw redirect(302, "/signin");
      }
      if(usersError) {
        console.error("Unable to pull users records: ", usersError);
        // throw redirect(302, "/signin");
      }

      const foundSession = sessions.find((session) => session.session_key == userSession);
      if(!foundSession) {
        console.error("Unable to find session using: ", userSession);
        throw redirect(302, "/signin");
      }
      loggedUser = users.find((user) => user.id == foundSession.user);
      if(!loggedUser) {
        console.error("Unable to find user from session id: ", foundSession.user);
        throw redirect(302, "/signin");
      }
    }
    
    return {
      userInfo: loggedUser,
      access: access,
      mode: environmentMode
    };
  }