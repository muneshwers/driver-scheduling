// import { VAPID_PUBLIC_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';

export const GET = (() => {
    const VAPID_PUBLIC_KEY = 'BA5nv-0PTU5msFULsacy7L3CRD6Bqu855CihwlenYvbEiK3gmm8rPkZrK2CrhD5CuEMcpYlYUuisdptK9H6Ft8U';
    return json({ data: VAPID_PUBLIC_KEY });
})