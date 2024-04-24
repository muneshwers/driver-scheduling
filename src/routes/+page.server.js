
  export async function load({cookies}) {
    const access = cookies.get("loginCredents");
    return {
      access: access
    };
  }