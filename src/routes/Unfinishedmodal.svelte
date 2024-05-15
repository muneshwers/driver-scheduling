<script>
    import { supabase } from "$lib/supabaseClient";
    import { createEventDispatcher } from "svelte";

    export let tripDetails;
    export let vehicles;

    $: editToggle = false;
    $: tripEnd = '';
    let vehicleNumber = vehicles.number;
    let vehicleType = vehicles.name;
    let vehicleName = vehicleNumber + " - " + vehicleType;

    
    const handleStop = async () => {
        let tripData = {
            id: tripDetails.id,
            end: tripEnd
        }
        stopTrip(tripData);
        closeField();
    }

        //Updates DB with new edited driver
    const stopTrip = async(tripData) => {
        const { error } = await supabase.from("trips").update({ 
            end: tripData.end
         })
         .eq('id', tripData.id)
         if (error) return console.error("Unable to edit trip: ", error);
    }

    const dispatch = createEventDispatcher();

    const closeField = () => {
        dispatch("toggle", {
            boolean: false
        })
    }
</script>

<div class="modal-container">
    <div class="trip-modal">
        <div class="trip-title poppins-medium">Ongoing Trip</div>
        <div class="trip-subtitle">Enter end time at the end of your trip to be able to create new trips.</div>
        <div class="trip-details">
            <div class="modal-row">
                <label for="location" class="trip-label">
                    Location
                </label>
                <input type="text" name="location" id="location" bind:value={tripDetails.location} class="modal-input default-input" disabled>
            </div>
            <div class="modal-row">
                <label for="driver" class="trip-label">
                    Driver
                </label>
                <input type="text" name="driver" id="driver" bind:value={tripDetails.driver} class="modal-input default-input" disabled>
            </div>
            <div class="modal-row">
                <label for="vehicle" class="trip-label">
                    Vehicle
                </label>
                <input type="text" name="vehicle" id="vehicle" bind:value={vehicleName} class="modal-input default-input" disabled>
            </div>
            <div class="modal-row">
                <label for="odometer" class="trip-label">
                    Odometer
                </label>
                <input type="text" name="odometer" id="odometer"  bind:value={tripDetails.odometer} class="modal-input default-input" disabled>
            </div>
            <div class="modal-row">
                <label for="date" class="trip-label">
                    Date
                </label>
                <input type="date" name="date" id="date" bind:value={tripDetails.date} class="modal-input default-input" disabled>
            </div>
            <div class="modal-row">
                <label for="start" class="trip-label">
                    Start Time
                </label>
                <input type="time" name="start" id="start" bind:value={tripDetails.start} class="modal-input default-input" disabled>
            </div>
            {#if editToggle}
            <div class="modal-row">
                <label for="end" class="trip-label">
                    End Time
                </label>
                <input type="time" name="end" id="end" bind:value={tripEnd} class="modal-input attention-input">
            </div>
            <button type="button" class="trip-btn-submit" on:click={() => handleStop()}>End Trip</button>
            {/if}
            {#if !editToggle}
            <button type="button" class="trip-btn-submit" on:click={() => editToggle = true}>Stop</button>
            {/if}
        </div>
    </div>
</div>