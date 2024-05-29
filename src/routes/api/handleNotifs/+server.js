import webpush from 'web-push';
import { supabase } from "$lib/supabaseClient";
import { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } from '$env/static/private';

export async function POST({ request }) {
    const { title, options, data } = await request.json();

    webpush.setVapidDetails('mailto:programmers.muneshwers@gmail.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

    const notificationPayload = JSON.stringify({
        title: title,
        body: options.body
    });

    notifyUsers(data.userId, notificationPayload);
    // webpush.sendNotification(subscription, notificationPayload)
    console.log(title, options, data)
    return new Response(JSON.stringify({ message: "Some Message" }), { status: 200 })
}

async function sendNotification(subscription, payload) {
    try {
        const res = await webpush.sendNotification(subscription, payload);
        return {
            ok: res.statusCode === 201,
            status: res.statusCode,
            body: res.body
        }
    } catch (err) {
        const msg = `Could not send notification: ${err}`;
        console.error(msg);
        return {
            ok: false,
            status: undefined,
            body: msg
        }
    }
}

async function sendToDevice(devices, payload) {
    devices.forEach(async (device) => {
        const subscription = device.subscription;
        const res = await sendNotification(subscription, payload);
        // console.log("Notification Sent: ", res, payload);

        if(!res.ok) {
            console.error(
                `Failed to send notification to device ${device.id}: ${res.body} (${res.status}). ${JSON.stringify(res)}`
            );
        }

        if(res.status === 410) {
            removeDevice(device.id);
        }
    })
    
}

async function removeDevice(deviceId) {
    const {error} = await supabase.from("devices").delete().eq('id', deviceId);
    if (error) return console.error("Unable to Delete Device: ", error);
}

async function notifyUsers(userId, payload) {
    const devices = await getDevices(userId);

    if(!devices) return console.error("No Device for UserId", devices, userId);
    await sendToDevice(devices, payload);
}

async function getDevices(userId) {
    // const returnedData = [];
    const { data: devices, error } = await supabase.from("devices").select();
    if (error) return console.error("Unable to get devices from db: ", error);

    // console.log("All Devices: ", devices);

    const userDevices = devices.filter((device) => {
        return device.user_id == userId
    })

    // console.log("User Devices: ",userDevices);

    if (userDevices.length <= 0) {
        return false;
    }

    console.log("No of user devices: ",userDevices.length);

    return userDevices
}

// async function addDevice(userId, subscription) {
//     let details = {
//         user_id: userId,
//         subscription: subscription
//     }
//     const { error } = await supabase.from("devices").insert([details]);
//     if (error) return console.error("Unable to add device:", error);
// }