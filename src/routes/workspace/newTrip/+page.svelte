<script>
    import mllogo from "../../../mllogo.png";
    import '../../styles.css';
    import arrowLeft from "../../../arrow-left-solid.svg";
    import { supabase } from "$lib/supabaseClient";
	import { onMount } from "svelte";
    import { redirect } from '@sveltejs/kit';
    import { goto } from '$app/navigation';


    //Data from +page.server.js
    export let data;

    //Access toggle
    $: isLoggedIn = data.access;

    $: vehicles = [];
    $: trips = [];
    $: disabled = true;
    $: userInfo = data.loggedUser;

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
            const unfinishedTrips = dbData.trips.filter((trip) => trip.driver == data.loggedUser.display_name);
            unfinishedTrips.forEach(trip => {
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

    $: formInputs = {
        location: {
            value: "",
            error: false,
            errorMessage: "",
            init: 0,
            initialize: function () {
                if(this.init <= 0) {
                    this.init++
                }
                
            }
        },
        vehicle: {
            value: "",
            error: false,
            errorMessage: "",
            init: 0,
            initialize: function () {
                if(this.init <= 0) {
                    this.init++
                }
            }
        },
        start: {
            value: "",
            error: false,
            errorMessage: "",
            init: 0,
            initialize: function () {
                if(this.init <= 0) {
                    this.init++
                }
            }
        },
        date: {
            value: (new Date()).toISOString().split('T')[0],
            error: false,
            errorMessage: "",
            init: 0,
            initialize: function () {
                if(this.init <= 0) {
                    this.init++
                }
            }
        },
    }

    $: buttons = {
        create: {
            text: "Create Trip"
        }
    }

    onMount( async () => {
        vehicles = await addDataToLocal("vehicles");
        trips = await addDataToLocal("trips");

    })

    const handleSubmit = async () => {
        let tripUpload = {
            driver: data.loggedUser.display_name,
            location: formInputs.location.value,
            vehicle: formInputs.vehicle.value,
            start: formInputs.start.value,
            end: null,
            date: formInputs.date.value
        };
        let overlaps = await checkforOverlaps(tripUpload);
        if(overlaps) {
            formInputs.start.error = true;
            formInputs.start.errorMessage = "You already created a trip for this time and date. Please choose another start time.";
            return;
        }
        createTrip(tripUpload);
    }

    const createTrip = async (uploadDetails) => {
        const {error} = await supabase.from("trips").insert([uploadDetails]);
        if (error) return console.error(`Unable to create trip: ${error}`);
        refreshErrors();
        formRefresh();
        // redirect(302, "/");
        goto('/');

    }

        //Checks for overlaps in event time and date
    const checkforOverlaps = async (uploadDetails) => {
        trips = await addDataToLocal("trips");
        let foundOverlap = trips.find((trip) => uploadDetails.start+":00" >= trip.start && uploadDetails.start+":00" < trip.end && uploadDetails.date == trip.date);
        if(!foundOverlap) return false; //No overlaps or duplicates
        return true;
    }

    const formValidation = () => {
        if (formInputs.date.value) {
            formInputs.date.error = false;
            formInputs.date.errorMessage = "";
        }
        if (formInputs.location.value) {
            formInputs.location.error = false;
            formInputs.location.errorMessage = "";
        }
        if (formInputs.start.value) {
            formInputs.start.error = false;
            formInputs.start.errorMessage = "";
        }
        if (formInputs.vehicle.value) {
            formInputs.vehicle.error = false;
            formInputs.vehicle.errorMessage = "";
        }
        if (!formInputs.date.value && formInputs.date.init > 0) {
            formInputs.date.error = true;
            formInputs.date.errorMessage = "Date is required";
        }
        if (!formInputs.location.value && formInputs.location.init > 0) {
            formInputs.location.error = true;
            formInputs.location.errorMessage = "Location is required";
        }
        if (!formInputs.start.value && formInputs.start.init > 0) {
            formInputs.start.error = true;
            formInputs.start.errorMessage = "Start time is required";
        }
        if (!formInputs.vehicle.value && formInputs.vehicle.init > 0) {
            formInputs.vehicle.error = true;
            formInputs.vehicle.errorMessage = "Vehicle Number is required";
        }
    }

    const refreshErrors = () => {
        formInputs.date.error = false;
        formInputs.location.error = false;
        formInputs.start.error = false;
        formInputs.vehicle.error = false;
        formInputs.date.errorMessage = "";
        formInputs.location.errorMessage = "";
        formInputs.start.errorMessage = "";
        formInputs.vehicle.errorMessage = "";
    }

    const formRefresh = () => {
        formInputs.date.value = "";
        formInputs.location.value = "";
        formInputs.start.value = "";
        formInputs.vehicle.value = "";
        buttons.create.text="Create Trip";
    }

    const buttonToggle = () => {
        if (!formInputs.date.value || !formInputs.location.value || !formInputs.start.value || !formInputs.vehicle.value) {
            disabled = true;
            return
        }
        disabled = false;
    }

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
        Driver's Workspace
    </div>
    <div class="page-subtitle poppins-medium">
        Create New Trip
    </div>
    <!-- svelte-ignore a11y-invalid-attribute -->
    <a href="/" class="workspace-back">
        <img src={arrowLeft} alt="Back to Home" class="workspace-back-button" />
    </a>

    <form action="" method="post" class="trip-form">
        {#if formInputs.location.error}
            <div class="trip-error-message-label">
                {formInputs.location.errorMessage}
            </div>
        {/if}
        <div class="trip-row">
            <label for="" class="form-label">To:</label>
            <input type="text" name="location" bind:value={formInputs.location.value} id="location" placeholder="Location" class="trip-form-input {formInputs.location.error == true ? 'input-error' : 'default-input'}" on:input={() => {formValidation(); buttonToggle(); formInputs.location.initialize();}}/>
        </div>
        {#if formInputs.vehicle.error}
            <div class="trip-error-message-label">
                {formInputs.vehicle.errorMessage}
            </div>
        {/if}
        <div class="trip-row">
            <label for="" class="form-label">Vehicle:</label>
            <select id="drivers" bind:value={formInputs.vehicle.value} class="trip-form-input {formInputs.vehicle.error == true ? 'input-error' : 'default-input'}"  on:change={() => {formValidation(); buttonToggle(); formInputs.vehicle.initialize();}}>
                {#each vehicles as vehicle}
                    <option value={vehicle.id}>{vehicle.number} - {vehicle.name}</option>
                {/each}
            </select>
        </div>
        {#if formInputs.start.error}
            <div class="trip-error-message-label">
                {formInputs.start.errorMessage}
            </div>
        {/if}
        <div class="trip-row">
            <label for="" class="form-label">Start:</label>
            <input type="time" name="startTrip" bind:value={formInputs.start.value} id="startTrip" placeholder="startTrip" class="trip-form-input {formInputs.start.error == true ? 'input-error' : 'default-input'}"  on:input={() => {formValidation(); buttonToggle(); formInputs.start.initialize();}}/>
        </div>
        {#if formInputs.date.error}
            <div class="trip-error-message-label">
                {formInputs.date.errorMessage}
            </div>
        {/if}
        <div class="trip-row">
            <label for="" class="form-label">Date:</label>
            <input type="date" name="tripDate" bind:value={formInputs.date.value} id="tripDate" placeholder="Date" class="trip-form-input {formInputs.date.error == true ? 'input-error' : 'default-input'}"  on:input={() => {formValidation(); buttonToggle(); formInputs.date.initialize();}}/>
        </div>
        <button type="button" class="trip-btn-submit {buttons.create.text == "Creating..." ? 'trip-btn-submit-extend' : 'trip-btn-submit'}" on:click={() => {handleSubmit(); buttons.create.text = "Creating..."}} {disabled} >{buttons.create.text}</button>
    </form>
    
</div>