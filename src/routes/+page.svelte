<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { Calendar } from "@fullcalendar/core";
    import { supabase } from "$lib/supabaseClient";
    import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
    import './styles.css';

    export let data;
    
    let calendarEl;
    let calendar;
    let isLoggedIn = false;

    const url = new URL($page.url);
    const searchParams = url.searchParams;
    isLoggedIn = searchParams.get('isLoggedIn');

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

    onMount(() => {
        calendar = new Calendar(calendarEl, {
            plugins: [ resourceTimelinePlugin ],
            slotDuration: '00:10:00',
            initialView: 'resourceTimeline',
            selectable: true,
            buttonText: {
                today: 'Today' // Change the text for the "Today" button here
            },
            height: "100%",
            schedulerLicenseKey: '0970091250-fcs-1710098081',
            resources: data.driverList,
            events: data.eventsList,
            eventClick : (info) => {
                formField = 'preview'
                pageVariableRefresh(); //Refreshes all reactive variables
                resourceId = info.event._def.resourceIds[0];
                eventStart = info.event.startStr.slice(0, 19);
                eventEnd = info.event.endStr.slice(0, 19);
                eventTitle = info.event.title;
                console.log(info);
                console.log(resourceId);
                console.log(eventStart);
                console.log(eventEnd);
                console.log(eventTitle);
                let concatEvent = eventTitle+eventStart+eventEnd+resourceId;
                let selectedEvent = getEventDetailsById(concatEvent);
                console.log(selectedEvent);
                if(!selectedEvent) return console.log("Selected Event not found.");

                driverName = data.drivers.find((data) => data.id == selectedEvent.resourceId).name;
                eventIDEdit = selectedEvent.id;
                driverInput = selectedEvent.resourceId;
                fromInput = selectedEvent.startTime;
                toInput = selectedEvent.endTime;
                dateInput = selectedEvent.date;
                description = selectedEvent.title;
            }
        });
        document.addEventListener('click', function(event) {
            if (!event.target.closest('.fc-event') && !event.target.closest('.workspace') && !event.target.closest('.btn-edit')) {
                formField = 'create';
                pageVariableRefresh();
            }
        });
        calendar.render();
    });

    const handleSubmit = (event) => {
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
        let overlaps = checkforOverlaps(eventUpload);
        console.log("Entry Overlaps?: ",overlaps);
        if(overlaps) return console.log("Driver is already scheduled for this time and date. Please choose another period.")
        calendar.addEvent(eventDetails);
        updateEvents(eventUpload);
        calendar.refetchEvents();
    }

    const handleEdit = (event) => {
        // const dbEvent = getDbEventsByID(eventIDEdit);
        let eventDetails = {
            title: description,
            start: dateInput+"T"+fromInput,
            end: dateInput+"T"+toInput+":00",
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
        let overlaps = checkforOverlapsEdit(eventUpload);
        console.log("Entry Overlaps?: ",overlaps);
        if(overlaps) return console.log("Driver is already scheduled for this time and date. Please choose another period.")
        // calendar.addEvent(eventDetails);
        editEvent(eventUpload);
        calendar.refetchEvents();
    }

    const handleDeletion = async(event) => {
        const {error} = await supabase.from("events").delete().eq('id', eventIDEdit);
        console.log("Event Deleted.");
        formRefresh();
        formField = 'create';
    }


    const checkforOverlaps = (eventUpload) => {
        let eventsList = data.eventsAllCols;
        let driverEvents = eventsList.filter((driverEvent) => driverEvent.resourceId == eventUpload.resourceId && driverEvent.date == eventUpload.date);
        let foundOverlap = driverEvents.find((singleEvent) => (eventUpload.startTime >= singleEvent.startTime && eventUpload.startTime < singleEvent.endTime) || (eventUpload.endTime > singleEvent.startTime && eventUpload.endTime <= singleEvent.endTime));
        if(!foundOverlap) return false; //No overlaps or duplicates
        return true;

    }

    const checkforOverlapsEdit = (eventUpload) => {
        let eventsList = data.eventsAllCols;
        let driverEvents = eventsList.filter((driverEvent) => driverEvent.resourceId == eventUpload.resourceId && driverEvent.date == eventUpload.date && driverEvent.id !== eventUpload.editID);
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
         if (error) return console.log("Unable to edit: ", error);
         formRefresh();
    }

    const formRefresh = () => {
        driverInput = '';
        fromInput = '';
        toInput='';
        dateInput='';
        description='';
    }

    const pageVariableRefresh = () => {
        driverInput = '';
        fromInput = '';
        toInput='';
        dateInput='';
        description='';
        resourceId = '';
        eventStart = '';
        eventEnd = '';
        eventTitle = '';
        driverName = '';
    }


    const getEventDetailsById = (concatEvent) => {
        const concatFromDb = data.eventsAllCols.map((singleEvent) => ({
            id: singleEvent.id,
            uniqueId: singleEvent.title+singleEvent.start+singleEvent.end+singleEvent.resourceId
        }));

        const foundEvent = concatFromDb.find((data) => data.uniqueId == concatEvent);

        if(!foundEvent) return console.log("Event Id not found. Please check data.");
        const returnedEvent = data.eventsAllCols.find((data) => data.id == foundEvent.id);
        console.log(returnedEvent);
        return returnedEvent;

    }

    const getDbEventsByID = async(id) => {
        const { data, error } = await supabase.from("events").select().eq('id', id);
        if (error) return console.log("Unable to find DB Event: ", error);
        return data;
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

    {#if isLoggedIn}
        <div class="workspace {formField == "preview" ? 'preview-mode':'default-mode'}">
            {#if formField == "create"}
                <form action="" class="formContainer">
                    <h1 class="roboto-medium">Schedule Driver</h1>
                    <div class="row">
                        <label for="description">Description</label>
                        <input type="text" placeholder="Driver for..." id="description" bind:value={description} class="workspace-input"/>
                    </div>
                    <div class="row">
                        <label for="drivers">Driver</label>
                        <select id="drivers" bind:value={driverInput}>
                        <option value="Select Driver">Select Driver:</option>
                        {#each data.drivers as driver}
                            <option value={driver.id}>{driver.name}</option>
                        {/each}
                    </select>
                    </div>
                    <div class="row">
                        <label for="from">From</label>
                        <input type="time" placeholder="From" bind:value={fromInput} id="from" class="workspace-input"/>
                    </div>
                    <div class="row">
                        <label for="to">To</label>
                        <input type="time" placeholder="To" bind:value={toInput} id="to" class="workspace-input"/>
                    </div>
                    <div class="row">
                        <label for="date">Date</label>
                        <input type="date" placeholder="Date" bind:value={dateInput} id="date" class="workspace-input"/>
                    </div>
                    <button type="button" class="submit-button" on:click={() => handleSubmit()}>Schedule</button>
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
                    <button type="button" class="btn-edit" on:click={() => formField = 'editing'}>Edit</button>
                    <button type="button" class="btn-delete" on:click={() => handleDeletion()}>Delete</button>
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
                        <input type="text" class="workspace-input" bind:value={description}/>
                    </div>
                    <div class="row">
                        <label for="from">
                            From:
                        </label>
                        <input type="time" class="workspace-input" bind:value={fromInput}/>
                    </div>
                    <div class="row">
                        <label for="to">
                            To:
                        </label>
                        <input type="time" class="workspace-input" bind:value={toInput} />
                    </div>
                    <div class="row">
                        <label for="date">
                            Date:
                        </label>
                        <input type="date" class="workspace-input" bind:value={dateInput} />
                    </div>

                </div>
                <div class="preview-actions">
                    <button type="button" class="btn-edit" on:click={() => handleEdit()}>Update</button>
                </div>
            {/if}
        </div>
        
    {/if}
</div>

