<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { Calendar } from "@fullcalendar/core";
    import { supabase } from "$lib/supabaseClient";
    import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
    import './styles.css';

    export let data;

    $: updateData = async () => {
        const { data, error } = await supabase.from("events").select();
        if (error) return console.error(error);
        return {
            eventsList: data.map((singleEvent) => ({
                title: singleEvent.title,
                start: singleEvent.start,
                end: singleEvent.end,
                resourceId: singleEvent.resourceId
            })),
            eventsAllCols: data ?? []
        };
    }

    $: updateDriverData = async () => {
        const { data, error } = await supabase.from("drivers").select();
        if(error) return console.error(error);
        return {
            drivers: data ?? [],
            driverList: data.map((driver) => ({
                id: driver.id,
                title: driver.name
            }))
        }
    }

    const updateLocalEvents = async () => {
        const { data, error } = await supabase.from("events").select();
        if (error) return console.error(error);
        localEventsList = data.map((singleEvent) => ({
            title: singleEvent.title,
            start: singleEvent.start,
            end: singleEvent.end,
            resourceId: singleEvent.resourceId
        }));
        // console.log("Events List Going into Local: ", eventsList);
        // eventsList.forEach((singleEvent) => {
        //     // localEventsList = [];
        //     localEventsList.push(singleEvent);
        // })
    }

    $: localEventsList = [];

    updateLocalEvents();
    
    let calendarEl;
    let calendar;
    let isLoggedIn = false;
    let disabled = true;

    const url = new URL($page.url);
    const searchParams = url.searchParams;
    isLoggedIn = searchParams.get('isLoggedIn');

    //Data Sources
    $: eventsTableData = [];
    $: driverTableData = [];
    $: driversAllCols = [];
    $: eventsAllCols = [];


    $: addDataToLocal = async (toggle) => {
        let returnedData = [];
        if (toggle == 'events') {
            const dbData = await updateData();
            dbData.eventsList.forEach(singleEvent => {
                returnedData.push(singleEvent);
            });
        }
        if (toggle == 'eventsFull') {
            const dbData = await updateData();
            dbData.eventsAllCols.forEach(singleEvent => {
                returnedData.push(singleEvent);
            });
        }
        if (toggle == 'drivers') {
            const dbData = await updateDriverData();
            dbData.driverList.forEach(singleEvent => {
                returnedData.push(singleEvent);
            });     
        }
        if (toggle == 'driversFull') {
            const dbData = await updateDriverData();
            dbData.drivers.forEach(singleEvent => {
                returnedData.push(singleEvent);
            });     
        }
        // console.log(returnedData);
        return returnedData;
    }

    //Input fields
    
    $: driverInput = '';
    $: fromInput = '';
    $: toInput = '';
    $: dateInput = (new Date()).toISOString().split('T')[0];
    $: description = '';

    //Toggles
    $: formField = 'create'; //Options: create, editing, preview
    
    $: resourceId = '';
    $: eventStart = '';
    $: eventEnd = '';
    $: eventTitle = '';
    $: driverName = '';
    $: eventIDEdit = '';

    $: errors = {
        driver : {
            error: false,
            message: ""
        },
        fromField : {
            error: false,
            message: ""
        },
        toField : {
            error: false,
            message: ""
        },
        dateField : {
            error: false,
            message: ""
        },
        description : {
            error: false,
            message: ""
        }
    }

    onMount( async () => {
        eventsTableData = await addDataToLocal("events");
        driverTableData = await addDataToLocal("drivers");
        driversAllCols = await addDataToLocal("driversFull");
        calendar = new Calendar(calendarEl, {
            plugins: [ resourceTimelinePlugin ],
            slotDuration: '00:10:00',
            initialView: 'resourceTimeline',
            selectable: true,
            buttonText: {
                today: 'Today'
            },
            height: "100%",
            schedulerLicenseKey: '0970091250-fcs-1710098081',
            resources: driverTableData,
            events: eventsTableData,
            businessHours: {
                daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
                startTime: '06:00',
                endTime: '20:00',
            },
            eventClick : async (info) => {
                if(!isLoggedIn) return
                formField = 'preview'
                pageVariableRefresh(); //Refreshes all reactive variables
                resourceId = info.event._def.resourceIds[0];
                eventStart = info.event.startStr.slice(0, 19);
                eventEnd = info.event.endStr.slice(0, 19);
                eventTitle = info.event.title;
                let concatEvent = eventTitle+eventStart+eventEnd+resourceId;
                let selectedEvent = await getEventDetailsById(concatEvent);
                if(!selectedEvent) return console.error("Selected Event not found.");

                let foundDriver = driversAllCols.find((data) => data.id == selectedEvent.resourceId);
                driverName = foundDriver.name;
                eventIDEdit = selectedEvent.id;
                driverInput = selectedEvent.resourceId;
                fromInput = selectedEvent.startTime;
                toInput = selectedEvent.endTime;
                dateInput = selectedEvent.date;
                description = selectedEvent.title;
            }
        });
        document.addEventListener('click', function(event) {
            if (!event.target.closest('.fc-event') && !event.target.closest('.workspace') && !event.target.closest('.btn-edit') && !event.target.closest('.btn-delete')) {
                formField = 'create';
                pageVariableRefresh();
                buttonToggle();
            }
        });
        const changes = supabase.channel('table-db-changes').on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public', 
                    table: 'events',
                },
                async (payload) => {
                    eventsTableData = await addDataToLocal("events");
                    eventsAllCols = await addDataToLocal("eventsFull");
                    calendar.removeAllEventSources();
                    calendar.addEventSource(eventsTableData);
                    calendar.render();
                }
            ).on(       
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'events',
                },
                async (payload) => {
                    eventsTableData = await addDataToLocal("events");
                    eventsAllCols = await addDataToLocal("eventsFull");
                    calendar.removeAllEventSources();
                    calendar.addEventSource(eventsTableData);
                    calendar.render();
                }
            ).on(       
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'events',
                },
                async (payload) => {
                    console.log(payload);
                    eventsTableData = await addDataToLocal("events");
                    eventsAllCols = await addDataToLocal("eventsFull");
                    calendar.removeAllEventSources();
                    calendar.addEventSource(eventsTableData);
                    calendar.render();
                }
            )
            .subscribe();
        calendar.render();
    });

    // onDestroy(() => {
    //     // Clean up calendar instance
    //     subscription.unsubscribe();
    // });
    const handleSubmit = async (event) => {
        
        let eventDetails = {
            title: description,
            start: dateInput+"T"+fromInput+":00",
            end: dateInput+"T"+toInput+":00",
            resourceId: driverInput
        };
        //For upload and validation
        let eventUpload = {
            ...eventDetails,
            date: dateInput,
            startTime: fromInput+":00",
            endTime: toInput+":00"
        } 
        let overlaps = await checkforOverlaps(eventUpload);
        if(overlaps) return console.error("Driver is already scheduled for this time and date. Please choose another period.");
        if(fromInput >= toInput) return console.log("Incorrect input. To date is before From date.");
        await updateLocalEvents();
        updateEvents(eventUpload);
        calendar.render();
    }

    const handleEdit = async (event) => {
        if (fromInput.length == 5){
            fromInput = fromInput+":00";
        }
        if (toInput.length == 5){
            toInput = toInput+":00";
        }
        let eventDetails = {
            title: description,
            start: dateInput+"T"+fromInput,
            end: dateInput+"T"+toInput,
            resourceId: driverInput
        };
        //For upload and validation
        let eventUpload = {
            ...eventDetails,
            date: dateInput,
            startTime: fromInput,
            endTime: toInput,
            editID: eventIDEdit
        } 
        let overlaps = await checkforOverlapsEdit(eventUpload);
        if(overlaps) return console.log("Driver is already scheduled for this time and date. Please choose another period.")
        // calendar.addEvent(eventDetails);
        
        editEvent(eventUpload);
        formField = 'create';
        calendar.render();
    }

    const handleDeletion = async(event) => {
        const {error} = await supabase.from("events").delete().eq('id', eventIDEdit);
        if (error) return console.error("Unable to Delete Event: ", error);
        formRefresh();
        formField = 'create';
        // calendar.render();
    }


    const checkforOverlaps = async (eventUpload) => {
        eventsAllCols = await addDataToLocal("eventsFull");
        let driverEvents = eventsAllCols.filter((driverEvent) => driverEvent.resourceId == eventUpload.resourceId && driverEvent.date == eventUpload.date);
        let foundOverlap = driverEvents.find((singleEvent) => (eventUpload.startTime >= singleEvent.startTime && eventUpload.startTime < singleEvent.endTime) || (eventUpload.endTime > singleEvent.startTime && eventUpload.endTime <= singleEvent.endTime));
        if(!foundOverlap) return false; //No overlaps or duplicates
        return true;

    }

    const checkforOverlapsEdit = async (eventUpload) => {
        eventsAllCols = await addDataToLocal("eventsFull");
        let driverEvents = eventsAllCols.filter((driverEvent) => driverEvent.resourceId == eventUpload.resourceId && driverEvent.date == eventUpload.date && driverEvent.id !== eventUpload.editID);
        let foundOverlap = driverEvents.find((singleEvent) => (eventUpload.startTime >= singleEvent.startTime && eventUpload.startTime < singleEvent.endTime) || (eventUpload.endTime > singleEvent.startTime && eventUpload.endTime <= singleEvent.endTime));
        if(!foundOverlap) return false; //No overlaps or duplicates
        return true;

    }

    const updateEvents = async(eventDetails) => {
        const { error } = await supabase.from("events").insert([eventDetails]);
        if (error) return console.log("Unable to Insert: ", error);
        console.log("Insert successful!");
        formRefresh();
    }

    const editEvent = async(eventDetails) => {
        const { error } = await supabase.from("events").update({ 
            title: eventDetails.title,
            start: eventDetails.start,
            end: eventDetails.end,
            date: eventDetails.date,
            startTime: eventDetails.startTime,
            endTime: eventDetails.endTime

         })
         .eq('id', eventDetails.editID)
         if (error) return console.error("Unable to edit: ", error);
         formRefresh();
    }

    const formValidation = () => {
        if (driverInput && fromInput && toInput && dateInput && description) {
            errors.driver.error = false;
            errors.fromField.error = false;
            errors.toField.error = false;
            errors.dateField.error = false;
            errors.description.error = false;

            errors.driver.message = "";
            errors.fromField.message = "";
            errors.toField.message = "";
            errors.dateField.message = "";
            errors.description.message = "";
            return
        }
        if (!driverInput) {
            errors.driver.error = true;
            errors.driver.message = "Description required."
            console.log("Driver: ", errors.driver);
        }
        if (!fromInput) {
            errors.fromField.error = true;
            errors.fromField.message = "From time required."
            console.log("From: ", errors.fromField);
        }
        if (!toInput) {
            errors.toField.error = true;
            errors.toField.message = "To time required"
            console.log("To: ", errors.toField);
        }
        if (!dateInput) {
            errors.dateField.error = true;
            errors.dateField.message = "Date required"
            console.log("Date: ", errors.dateField);
        }
        if (!description) {
            errors.description.error = true;
            errors.description.message = "Description Required"
            console.log("Description: ", errors.description);
        }
        
    }

    //
    const buttonToggle = () => {
        // formValidation();
        if (!driverInput || !fromInput || !toInput || !dateInput || !description) {
            disabled = true;
            return
        }
        disabled = false;
        
    } 

    const formRefresh = () => {
        driverInput = '';
        fromInput = '';
        toInput='';
        dateInput=(new Date()).toISOString().split('T')[0];
        description='';
        buttonToggle();
    }

    const pageVariableRefresh = () => {
        driverInput = '';
        fromInput = '';
        toInput='';
        dateInput=(new Date()).toISOString().split('T')[0];
        description='';
        resourceId = '';
        eventStart = '';
        eventEnd = '';
        eventTitle = '';
        driverName = '';
    }

    const getEventDetailsById = async (concatEvent) => {
        console.log("Get Event Runs");
        eventsAllCols = await addDataToLocal("eventsFull");
        const concatFromDb = eventsAllCols.map((singleEvent) => ({
            id: singleEvent.id,
            uniqueId: singleEvent.title+singleEvent.start+singleEvent.end+singleEvent.resourceId,
            resId: singleEvent.resourceId
        })); 
        console.log(concatFromDb);
        const foundEvent = concatFromDb.find((data) => data.uniqueId == concatEvent);
        if(!foundEvent) return console.log("Event Id not found. Please check data.");
        console.log(foundEvent);
        const returnedEvent = eventsAllCols.find((data) => data.id == foundEvent.id);
        console.log("Returned even from GEDBI func: ", returnedEvent);
        return returnedEvent;
    }
    

</script>

<svelte:head>
	<title>Driver Scheduling</title>
	<meta name="description" content="Muneshwers Driver Scheduling Platform" />
</svelte:head>

<header>
    <div class="title">
        <div class="roboto-medium title-text">Muneshwers Drivers Schedule</div>
    </div>
    <div class="actions">
        <a href={'/signin'}>
            <button type="button" class="signin-button">
                {isLoggedIn ? 'Sign Out' : 'Sign In'}
            </button>
        </a>
    </div>
</header>

<div class="contentContainer">
    <div class:calendarContainer={isLoggedIn} class:calendarReadOnlyContainer={!isLoggedIn}>
        <div bind:this={calendarEl}></div>
    </div>

    {#if isLoggedIn} <!-- delete-mode -->
        <div class="workspace {formField == "preview" ? 'preview-mode': formField == "editing" ? 'edit-mode' : formField == "deletion" ? 'delete-mode' : 'default-mode'}">
            {#if formField == "create"}
                <form action="" class="formContainer">
                    <h1 class="roboto-medium">Schedule Driver</h1>
                    <div class="row">
                        <label for="description">Description</label>
                        <input type="text" placeholder="Driver for..." id="description" bind:value={description} class="workspace-input {errors.description.error == true ? 'input-error' : 'default-input'}"  on:input={() => {buttonToggle(); formValidation();}}/>
                    </div>
                    <div class="row">
                        <label for="drivers">Driver</label>
                        <select id="drivers" bind:value={driverInput} on:input={() => {buttonToggle(); formValidation();}} class="workspace-input {errors.driver.error == true ? 'input-error' : 'default-input'}">
                            <option value="Select Driver" >Select Driver:</option>
                            {#each data.drivers as driver}
                                <option value={driver.id}>{driver.name}</option>
                            {/each}
                        </select>
                    </div>
                    <div class="row">
                        <label for="from">From</label>
                        <input type="time" placeholder="From" bind:value={fromInput} id="from" class="workspace-input {errors.fromField.error == true ? 'input-error' : 'default-input'}" on:input={() => {buttonToggle(); formValidation();}}/>
                    </div>
                    <div class="row">
                        <label for="to">To</label>
                        <input type="time" placeholder="To" bind:value={toInput} id="to" class="workspace-input" on:input={() => {buttonToggle(); formValidation();}}/>
                    </div>
                    <div class="row">
                        <label for="date">Date</label>
                        <input type="date" placeholder="Date" bind:value={dateInput} id="date" class="workspace-input" on:input={() => {buttonToggle(); formValidation();}}/>
                    </div>
                    <button type="button" class="btn-submit" on:click={() => handleSubmit()} {disabled}>Schedule</button>
                </form>
            {:else if formField == "preview"}
                <h1 class="roboto-medium">Driver Event { eventIDEdit } Preview </h1>
                <div class="preview-container">
                    <div class="row">
                        <div class="previewLabel">
                            Driver:
                        </div>
                        <div class="previewContent">
                            {driverName}
                        </div>
                    </div>
                    <div class="row">
                        <div class="previewLabel">
                            Description:
                        </div>
                        <div class="previewContent">
                            {description}
                        </div>
                    </div>
                    <div class="row">
                        <div class="previewLabel">
                            From:
                        </div>
                        <div class="previewContent">
                            {fromInput}
                        </div>
                    </div>
                    <div class="row">
                        <div class="previewLabel">
                            To:
                        </div>
                        <div class="previewContent">
                            {toInput}
                        </div>
                    </div>
                    <div class="row">
                        <div class="previewLabel">
                            Date:
                        </div>
                        <div class="previewContent">
                            {dateInput}
                        </div>
                    </div>
                </div>
                <div class="actions">
                    <button type="button" class="btn-edit" on:click={() => {formField = 'editing'; buttonToggle(); }}>Edit</button>
                    <button type="button" class="btn-delete" on:click={() => formField = 'deletion'}>Delete</button>
                </div>
            {:else if formField == "deletion"}
                <h1 class="roboto-medium">Driver Event { eventIDEdit } Preview </h1>
                <div class="preview-container">
                    Are you sure?
                </div>
                <div class="actions">
                    <button type="button" class="btn-delete" on:click={() => handleDeletion()}>Yes</button>
                    <button type="button" class="btn-edit" on:click={() => formField = 'preview'}>No</button>
                </div>
            {:else if formField == "editing"}
                <h1 class="roboto-medium">Driver Event { eventIDEdit } Edit</h1>
                <div class="preview-container">
                    <div class="row">
                        <div class="previewLabel">
                            Driver:
                        </div>
                        <div class="previewContent">
                            {driverName}
                        </div>
                    </div>
                    <div class="row">
                        <label for="description">
                            Description:
                        </label>
                        <input type="text" class="workspace-input" bind:value={description} on:input={() => buttonToggle()}/>
                    </div>
                    <div class="row">
                        <label for="from">
                            From:
                        </label>
                        <input type="time" class="workspace-input" bind:value={fromInput} on:input={() => buttonToggle()}/>
                    </div>
                    <div class="row">
                        <label for="to">
                            To:
                        </label>
                        <input type="time" class="workspace-input" bind:value={toInput} on:input={() => buttonToggle()}/>
                    </div>
                    <div class="row">
                        <label for="date">
                            Date:
                        </label>
                        <input type="date" class="workspace-input" bind:value={dateInput} on:input={() => buttonToggle()}/>
                    </div>

                </div>
                <div class="preview-actions">
                    <button type="button" class="btn-update" on:click={() => handleEdit()} {disabled}>Update</button>
                </div>
            {/if}
        </div>
        
    {/if}
</div>

