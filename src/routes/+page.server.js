import { supabase } from "$lib/supabaseClient";


  export async function load({cookies}) {
    const access = cookies.get("loginCredents");
    const { data: drivers, error: driverError } = await supabase.from("drivers").select();
    if(driverError) {
        return console.log(driverError);
    }
    return {
      access: access,
      drivers: drivers ?? [],
      driverList: drivers.map((driver) => ({
        id: driver.id,
        title: driver.name
      }))
    };
  }