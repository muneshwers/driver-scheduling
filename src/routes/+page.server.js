import { drivers, events } from "./data";

export function load() {
    return {
        driverList: drivers,
        eventsList: events
    }
}