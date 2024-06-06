<script>
    import { supabase } from "$lib/supabaseClient";
    import { createEventDispatcher } from "svelte";

    export let tripDetails;
    export let vehicles;
    export let allTrips;

    $: endInputs = {
        endTime: {
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
        odometer: {
            value: "",
            error: false,
            errorMessage: "",
            init: 0,
            initialize: function () {
                if(this.init <= 0) {
                    this.init++
                }
            }
        }
    }

    $: editToggle = false;
    $: tripEnd = '';
    $: tripError = false;
    $: tripErrorMessage = '';
    $: disabled = true;
    let vehicleNumber = vehicles.number;
    let vehicleType = vehicles.name;
    let vehicleName = vehicleNumber + " - " + vehicleType;

    
    const handleStop = async () => {
        clearErrors();
        let tripData = {
            id: tripDetails.id,
            date: tripDetails.date,
            odometer: endInputs.odometer.value,
            end: endInputs.endTime.value
        }
        let overlaps = checkForOverlaps(tripData);
        if(overlaps) {
            endInputs.endTime.error = true;
            endInputs.endTime.errorMessage = "End time is earlier than start time. Please check your input and try again.";
            return;
        };
        stopTrip(tripData);
        closeField();
    }

    const checkForOverlaps = (tripData) => {
        let foundExisting = allTrips.find((trip) => trip.date == tripData.date && trip.start >= tripData.end);
        console.log(foundExisting);
        if(!foundExisting) return false;
        return true;
    }

    const clearErrors = () => {
        endInputs.endTime.error = false;
        endInputs.odometer.error = false;
        endInputs.endTime.errorMessage = "";
        endInputs.odometer.errorMessage = "";
    }

    const formValidation = () => {
        if (endInputs.endTime.value) {
            endInputs.endTime.error = false;
            endInputs.endTime.errorMessage = "";
        }
        if (endInputs.odometer.value) {
            endInputs.odometer.error = false;
            endInputs.odometer.errorMessage = "";
        }
        if (!endInputs.endTime.value && endInputs.endTime.init > 0) {
            endInputs.endTime.error = true;
            endInputs.endTime.errorMessage = "End time is required";
        }
        if (!endInputs.odometer.value && endInputs.odometer.init > 0) {
            endInputs.odometer.error = true;
            endInputs.odometer.errorMessage = "Odometer is required";
        }
    }

    const buttonToggle = () => {
        if(!endInputs.odometer.value || !endInputs.endTime.value) {
            disabled = true;
            return
        }
        disabled = false;
    }

        //Updates DB with new edited driver
    const stopTrip = async(tripData) => {
        const { error } = await supabase.from("trips").update({ 
            end: tripData.end,
            odometer: tripData.odometer,
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
                {#if endInputs.odometer.error}
                    <div class="trip-error-message-label">
                        {endInputs.odometer.errorMessage}
                    </div>
                {/if}
                <div class="modal-row">
                    <label for="odometer" class="trip-label">
                        Odometer
                    </label>
                    <input type="text" name="odometer" id="odometer" placeholder="0000000"  bind:value={endInputs.odometer.value} class="modal-input {endInputs.odometer.error == true ? 'input-error' : 'attention-input'} "  on:input={() => {endInputs.odometer.initialize(); formValidation(); buttonToggle();}}>
                </div>
                {#if endInputs.endTime.error}
                    <div class="trip-error-message-label">
                        {endInputs.endTime.errorMessage}
                    </div>
                {/if}
                <div class="modal-row">
                    <label for="end" class="trip-label">
                        End Time
                    </label>
                    <input type="time" name="end" id="end" bind:value={endInputs.endTime.value} class="modal-input {endInputs.endTime.error == true ? 'input-error' : 'attention-input'} " on:input={() => {endInputs.endTime.initialize(); formValidation(); buttonToggle();}}>
                </div>
                <button type="button" class="trip-btn-submit"  { disabled } on:click={() => handleStop()}>End Trip</button>
            {/if}
            {#if !editToggle}
            <button type="button" class="trip-btn-submit" on:click={() => editToggle = true}>Stop</button>
            {/if}
        </div>
    </div>
</div>