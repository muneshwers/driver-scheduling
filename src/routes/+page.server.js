import { supabase } from "$lib/supabaseClient";

  export async function load() {
    const { data: drivers, error: driverError } = await supabase.from("drivers").select();
    const { data: events, error: eventError } = await supabase.from("events").select();
    if(driverError || eventError) {
        return console.log(driverError || eventError);
    }
    return {
      drivers: drivers ?? [],
      eventsList: events.map((singleEvent) => ({
        title: singleEvent.title,
        start: singleEvent.start,
        end: singleEvent.end,
        resourceId: singleEvent.resourceId
      })),
      driverList: drivers.map((driver) => ({
        id: driver.id,
        title: driver.name
      }))
    };
  }