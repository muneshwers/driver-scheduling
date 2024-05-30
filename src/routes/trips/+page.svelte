<script>
    import { onMount } from 'svelte';
    import mllogo from "../../mllogo.png";
    import '../styles.css';
    import arrowLeft from "../../arrow-left-solid.svg";
    import { supabase } from "$lib/supabaseClient";
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Checkbox, TableSearch } from 'flowbite-svelte';
    import { writable } from 'svelte/store';

    export let data;

    $: isLoggedIn = true;
    $: vehicles = [];
    $: trips = [];

    $: pullVehicleData = async () => {
        const { data, error } = await supabase.from("vehicles").select();
        if (error) return console.error(error);
        return {
            vehicles: data ?? []
        };
    }

    $: getDriverTrips = async () => {
        const { data, error } = await supabase.from("trips").select();
        if(error) return console.error(error);
        return {
            trips: data ?? []
        }
    }

    $: addDataToLocal = async (toggle) => {
        let returnedData = [];
        if (toggle == 'trips') {
            const dbData = await getDriverTrips();
            // const unfinishedTrips = dbData.trips.filter((trip) => trip.driver == data.loggedUser.display_name && trip.end != null);
            dbData.trips.forEach(trip => {
                returnedData.push(trip);
            })
        }
        if (toggle == 'vehicles') {
            const dbData = await pullVehicleData();
            dbData.vehicles.forEach(vehicle => {
                returnedData.push(vehicle);
            })
        }
        return returnedData;
    }

    onMount( async () => {
        vehicles = await addDataToLocal("vehicles");
        trips = await addDataToLocal("trips");
        trips = trips.sort(function(a,b){
            return new Date(b.date) - new Date(a.date);
        })
        // const sortItems = writable(trips.slice());
        // const sortKey = writable('date');
        // const sortDirection = writable(1);
        // const sortTable = (key) => {
        //     if($sortKey === key) {
        //         sortDirection.update((val) => -val);
        //     } else {
        //         sortKey.set(key);
        //         sortDirection.set(1);
        //     }
        // };

    })


   



    // $: {
    //     const key = $sortKey;
    //     const direction = $sortDirection;
    //     const sorted = [...$sortItems].sort((a, b) => {
    //         const aVal = a[key];
    //         const bVal = b[key];
    //         if(aVal < bVal) {
    //             return -direction;
    //         } else if (aVal > bVal) {
    //             return direction; 
    //         }
    //         return 0;
    //     });
    //     sortItems.set(sorted);
    // }


</script>

<header>
    <div class="title">
        <img src={mllogo} alt="Muneshwers Limited Logo" class="ml-logo">
        <div class="raleway-medium title-text"><span class="title-text-span">Muneshwers</span> Drivers Schedule</div>
    </div>
    <div class="actions">
        <a href={'/signin'}>
            <button type="button" class="signin-button">
                {isLoggedIn ? 'Sign Out' : 'Sign In'}
            </button>
        </a>
    </div>
</header>
<div class="driver-space">
    <div class="space-header poppins-medium">
        All Trips
    </div>
    <div class="page-subtitle poppins-medium">
        Trip History
    </div>
    <!-- svelte-ignore a11y-invalid-attribute -->
    <a href="/" class="workspace-back">
        <img src={arrowLeft} alt="Back to Home" class="workspace-back-button" />
    </a>
    <Table hoverable={true}>
        <TableHead>
            <TableHeadCell>Date</TableHeadCell>
            <TableHeadCell>Location</TableHeadCell>
            <TableHeadCell>Vehicle</TableHeadCell>
            <TableHeadCell>Start</TableHeadCell>
            <TableHeadCell>End</TableHeadCell>
            <TableHeadCell>Odometer</TableHeadCell>
        </TableHead>
        <TableBody tableBodyClass="divide-y">
            {#each trips as trip}
            <TableBodyRow>
                <TableBodyCell>{trip.date}</TableBodyCell>
                <TableBodyCell>{trip.location}</TableBodyCell>
                <TableBodyCell>{vehicles.find((vehicle) => vehicle.id == trip.vehicle).number + " - " + vehicles.find((vehicle) => vehicle.id == trip.vehicle).name}</TableBodyCell>
                <TableBodyCell>{trip.start}</TableBodyCell>
                <TableBodyCell>{trip.end}</TableBodyCell>
                <TableBodyCell>{trip.odometer}</TableBodyCell>
            </TableBodyRow>
            {/each}
        </TableBody>
    </Table>
</div>