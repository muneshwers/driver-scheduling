import { supabase } from "$lib/supabaseClient";
import { json } from "@sveltejs/kit";


export async function POST({request}) {

    const data = await request.json();

    const userId = data.userId;

    if(!userId) {
        console.log("No user passed to subscription.");
        throw Error(401, 'Unauthorized');
    }

    if(!data.subscription) {
        console.log("No susbscription passed to addSubscription", data);
        throw Error(400, 'Bad Request');
    }

    addDevice(userId, data.subscription);

    return json({ success: true });
}

async function addDevice(userId, subscription) {
    let details = {
        user_id: userId,
        subscription: subscription
    }
    const { error } = await supabase.from("devices").insert([details]);
    if (error) return console.error("Unable to add device:", error);
}