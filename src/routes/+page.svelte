<script>
    import { onMount } from 'svelte';
    import { Calendar } from "@fullcalendar/core";
    import { supabase } from "$lib/supabaseClient";
    import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
    import { browser } from '$app/environment';
    import './styles.css';
    import mllogo from "../mllogo.png";
	import Infocard from './Infocard.svelte';

    export let data;

    //Returns JSON of eventsList for calendar and all columns
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

    //Returns JSON of driverList for calendar and all columns
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
    
    let calendarEl;
    let calendar;
    let isLoggedIn = data.access;
    let disabled = true;


    //Main Data Sources
    $: eventsTableData = [];
    $: driverTableData = [];
    $: driversAllCols = [];
    $: eventsAllCols = [];


    //Returns array of events or drivers based on toggle input
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
        return returnedData;
    }


    //Input fields
    $: driverInput = '';
    $: fromInput = '';
    $: toInput = '';
    $: dateInput = (new Date()).toISOString().split('T')[0];
    $: description = '';
    $: driverInputConfirm = '';

    //Toggles
    $: formField = 'create'; //Options: create, editing, preview, deletion
    $: calendarOn = false;
    $: buttons = {
        create: {
            text: "Schedule",
        },
        edit: {
            text: "Update"
        }
    }
    
    //Fields for calendar event info
    $: resourceId = '';
    $: eventStart = '';
    $: eventEnd = '';
    $: eventTitle = '';
    $: driverName = '';
    $: eventIDEdit = '';

    //Fields for Modal
    $: modalDescription = '';
    $: modalDriver = '';
    $: modalStart = '';
    $: modalEnd = '';
    $: modalDate = '';

    $: showModal = false;

    //Input error information
    $: errors = {
        driver : {
            error: false,
            message: "",
            init: 0
        },
        fromField : {
            error: false,
            message: "",
            init: 0
        },
        toField : {
            error: false,
            message: "",
            init: 0
        },
        dateField : {
            error: false,
            message: "",
            init: 0
        },
        description : {
            error: false,
            message: "",
            init: 0
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
                if(!isLoggedIn) {
                    showModal = true;
                    modalDescription = selectedEvent.title;
                    modalDriver = foundDriver.name;
                    modalStart = selectedEvent.startTime;
                    modalEnd = selectedEvent.endTime;
                    modalDate = selectedEvent.date;
                    return;
                }
                driverName = foundDriver.name;
                eventIDEdit = selectedEvent.id;
                driverInput = selectedEvent.resourceId;
                driverInputConfirm = selectedEvent.resourceId;
                fromInput = selectedEvent.startTime;
                toInput = selectedEvent.endTime;
                dateInput = selectedEvent.date;
                description = selectedEvent.title;
            }
        });
        //Refreshes inputs and errors and switches workspace mode to create when clicked off of workspace and event
        document.addEventListener('click', function(event) {
            if (!event.target.closest('.fc-event') && !event.target.closest('.workspace') && !event.target.closest('.btn-edit') && !event.target.closest('.btn-delete') && !event.target.closest('.info-card-modal')) {
                formField = 'create';
                pageVariableRefresh();
                formValidation();
                buttonToggle();
                refreshErrors();
                showModal = false;
            }
        });
        //Listens to db events inserts, updates, and deletion
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
                    eventsTableData = await addDataToLocal("events");
                    eventsAllCols = await addDataToLocal("eventsFull");
                    calendar.removeAllEventSources();
                    calendar.addEventSource(eventsTableData);
                    calendar.render();
                }
            )
            .subscribe();
        calendar.render();
        calendarOn = true;
    });

    // onDestroy(() => {
    //     // Clean up calendar instance
    //     subscription.unsubscribe();
    // });

    //Runs when user clicks the submit button
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
        if(overlaps) {
            errors.fromField.error = true;
            errors.toField.error = true;
            errors.fromField.message = "Driver is already scheduled for this time and date. Please choose another period";
            return;
        }
        if(fromInput >= toInput) {
            errors.toField.error = true;
            errors.toField.message = "The End time is before the Start time. Please recheck your input and try again";
            return;
        };
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
        console.log("Edit contents: ", eventUpload);
        if(driverInputConfirm == driverInput) {
            let overlaps = await checkforOverlapsEdit(eventUpload);
            if(overlaps) {
                errors.fromField.error = true;
                errors.toField.error = true;
                errors.fromField.message = "Driver is already scheduled for this time and date. Please choose another period";
                return;
            }
        }
        if(driverInputConfirm !== driverInput) {
            let overlaps = await checkforOverlaps(eventUpload);
            if(overlaps) {
                errors.fromField.error = true;
                errors.toField.error = true;
                errors.fromField.message = "Driver is already scheduled for this time and date. Please choose another period";
                return;
            }
        }        
        
        editEvent(eventUpload);
        formField = 'create';
        calendar.render();
    }

    //Deletes event from DB using it's ID
    const handleDeletion = async(event) => {
        const {error} = await supabase.from("events").delete().eq('id', eventIDEdit);
        if (error) return console.error("Unable to Delete Event: ", error);
        formRefresh();
        formField = 'create';
    }

    //Checks for overlaps in event time and date
    const checkforOverlaps = async (eventUpload) => {
        eventsAllCols = await addDataToLocal("eventsFull");
        let driverEvents = eventsAllCols.filter((driverEvent) => driverEvent.resourceId == eventUpload.resourceId && driverEvent.date == eventUpload.date);
        let foundOverlap = driverEvents.find((singleEvent) => (eventUpload.startTime >= singleEvent.startTime && eventUpload.startTime < singleEvent.endTime) || (eventUpload.endTime > singleEvent.startTime && eventUpload.endTime <= singleEvent.endTime));
        if(!foundOverlap) return false; //No overlaps or duplicates
        return true;

    }

    //Checks for overlaps not related to current event
    const checkforOverlapsEdit = async (eventUpload) => {
        eventsAllCols = await addDataToLocal("eventsFull");
        let driverEvents = eventsAllCols.filter((driverEvent) => driverEvent.resourceId == eventUpload.resourceId && driverEvent.date == eventUpload.date && driverEvent.id !== eventUpload.editID);
        let foundOverlap = driverEvents.find((singleEvent) => (eventUpload.startTime >= singleEvent.startTime && eventUpload.startTime < singleEvent.endTime) || (eventUpload.endTime > singleEvent.startTime && eventUpload.endTime <= singleEvent.endTime));
        if(!foundOverlap) return false; //No overlaps or duplicates
        return true;

    }

    //Inserts new event into DB
    const updateEvents = async(eventDetails) => {
        const { error } = await supabase.from("events").insert([eventDetails]);
        if (error) return console.error("Unable to Insert: ", error);
        formRefresh();
    }

    //Updates DB with new edited event
    const editEvent = async(eventDetails) => {
        const { error } = await supabase.from("events").update({ 
            title: eventDetails.title,
            start: eventDetails.start,
            end: eventDetails.end,
            date: eventDetails.date,
            startTime: eventDetails.startTime,
            endTime: eventDetails.endTime,
            resourceId: eventDetails.resourceId,

         })
         .eq('id', eventDetails.editID)
         if (error) return console.error("Unable to edit: ", error);
         formRefresh();
    }

    //Initiates input to only allow errors if the input field was used (initiated) - Copied logic from (sort of) from petty cash
    const initializeInput = (field) => {
        if(field == "driver") {
            errors.driver.init++;
        }
        if(field == "from") {
            errors.fromField.init++;
        }
        if(field == "to") {
            errors.toField.init++;
        }
        if(field == "date") {
            errors.dateField.init++;
        }
        if(field == "desc") {
            errors.description.init++;
        }
    }

    //For edit workspace. Since inputs are already initialized.
    const initializeAllInput = () => {
        errors.driver.init++;
        errors.fromField.init++;
        errors.toField.init++;
        errors.dateField.init++;
        errors.description.init++;
    }

    //Checks for empty fields and sets error toggles and message accordingly
    const formValidation = () => {

        if (driverInput) {
            errors.driver.error = false;
            errors.driver.message = "";
        }
        if (fromInput) {
            errors.fromField.error = false;
            errors.fromField.message = "";
        }
        if (toInput) {
            errors.toField.error = false;
            errors.toField.message = "";
        }
        if (dateInput) {
            errors.dateField.error = false;
            errors.dateField.message = "";
        }
        if (description) {
            errors.description.error = false;
            errors.description.message = "";
        }
        if (!driverInput && errors.driver.init > 0) {
            errors.driver.error = true;
            errors.driver.message = "Description required.";
        }
        if (!fromInput && errors.fromField.init > 0) {
            errors.fromField.error = true;
            errors.fromField.message = "From time required.";
        }
        if (!toInput && errors.toField.init > 0) {
            errors.toField.error = true;
            errors.toField.message = "To time required";
        }
        if (!dateInput && errors.dateField.init > 0) {
            errors.dateField.error = true;
            errors.dateField.message = "Date required";
        }
        if (!description && errors.description.init > 0) {
            errors.description.error = true;
            errors.description.message = "Description Required";
        }
        
    }

    //Toggles button to be disabled if one or more inputs are empty
    const buttonToggle = () => {
        if (!driverInput || !fromInput || !toInput || !dateInput || !description) {
            disabled = true;
            return
        }
        disabled = false;
        
    } 

    //Refreshes all error fields
    const refreshErrors = () => {
        errors.driver.init = 0;
        errors.driver.error = false;
        errors.driver.message = "";
        errors.fromField.init = 0;
        errors.fromField.error = false;
        errors.fromField.message = "";
        errors.toField.init = 0;
        errors.toField.error = false;
        errors.toField.message = "";
        errors.dateField.init = 0;
        errors.dateField.error = false;
        errors.dateField.message = "";
        errors.description.init = 0;
        errors.description.error = false;
        errors.description.message = "";
    }

    //Refreshes form inputs and error initiation
    const formRefresh = () => {
        driverInput = '';
        fromInput = '';
        toInput='';
        dateInput=(new Date()).toISOString().split('T')[0];
        description='';
        buttonToggle();
        refreshErrors();
        formValidation();
        returnButtonState();
    }

    //Refreshes all page variables used in edit and submission
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
        refreshErrors();
        formValidation();
    }

    const returnButtonState = () => {
        buttons.create.text = "Schedule";
        buttons.edit.text = "Update";
    }

    //Gets event details with concatenated (unique Id) event calendar fields
    const getEventDetailsById = async (concatEvent) => {
        eventsAllCols = await addDataToLocal("eventsFull");
        const concatFromDb = eventsAllCols.map((singleEvent) => ({
            id: singleEvent.id,
            uniqueId: singleEvent.title+singleEvent.start+singleEvent.end+singleEvent.resourceId,
            resId: singleEvent.resourceId
        })); 
        const foundEvent = concatFromDb.find((data) => data.uniqueId == concatEvent);
        if(!foundEvent) return console.error("Event Id not found. Please check data.");
        const returnedEvent = eventsAllCols.find((data) => data.id == foundEvent.id);
        return returnedEvent;
    }

    const captureModalClose = (event) => {
        showModal = event.detail.boolean
    }
    

</script>

<svelte:head>
	<title>Driver Scheduling</title>
	<meta name="description" content="Muneshwers Driver Scheduling Platform" />
</svelte:head>

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

<div class="contentContainer">
    <div class:calendarContainer={isLoggedIn} class:calendarReadOnlyContainer={!isLoggedIn}>
        {#if !browser}
            <h1>LOADING...</h1>
        {:else}
            <div bind:this={calendarEl}></div>
            {#if showModal}
                <Infocard driverInfo={modalDriver} description={modalDescription} startTime={modalStart} endTime={modalEnd} dateInfo={modalDate} on:toggle={captureModalClose}/>
            {/if}
        {/if}
    </div>

    {#if isLoggedIn} <!-- delete-mode -->
        <div class="workspace {formField == "preview" ? 'preview-mode': formField == "editing" ? 'edit-mode' : formField == "deletion" ? 'delete-mode' : 'default-mode'}">
            {#if formField == "create"}
                <form action="" class="formContainer">
                    <div class="poppins-medium workspace-title">Schedule Driver</div>
                    {#if errors.description.error}
                        <div class="error-message-label">
                            {errors.description.message}
                        </div>
                    {/if}
                    <div class="row">
                        <label for="description">Description</label>
                        <input type="text" placeholder="Purpose..." id="description" bind:value={description} class="workspace-input {errors.description.error == true ? 'input-error' : 'default-input'}"  on:input={() => {buttonToggle(); formValidation(); initializeInput("desc");}}/>
                    </div>
                    {#if errors.driver.error}
                        <div class="error-message-label">
                            {errors.driver.message}
                        </div>
                    {/if}
                    <div class="row">
                        <label for="drivers">Driver</label>
                        <select id="drivers" bind:value={driverInput} on:input={() => {buttonToggle(); formValidation();  initializeInput("driver");}} class="workspace-input {errors.driver.error == true ? 'input-error' : 'default-input'}">
                            {#each data.drivers as driver}
                                <option value={driver.id}>{driver.name}</option>
                            {/each}
                        </select>
                    </div>
                    {#if errors.fromField.error}
                        <div class="error-message-label">
                            {errors.fromField.message}
                        </div>
                    {/if}
                    <div class="row">
                        <label for="from">From</label>
                        <input type="time" placeholder="From" bind:value={fromInput} id="from" class="workspace-input {errors.fromField.error == true ? 'input-error' : 'default-input'}" on:input={() => {buttonToggle(); formValidation(); initializeInput("from");}}/>
                    </div>
                    {#if errors.toField.error}
                        <div class="error-message-label">
                            {errors.toField.message}
                        </div>
                    {/if}
                    <div class="row">
                        <label for="to">To</label>
                        <input type="time" placeholder="To" bind:value={toInput} id="to" class="workspace-input {errors.toField.error == true ? 'input-error' : 'default-input'}" on:input={() => {buttonToggle(); formValidation(); initializeInput("to");}}/>
                    </div>
                    {#if errors.dateField.error}
                        <div class="error-message-label">
                            {errors.dateField.message}
                        </div>
                    {/if}
                    <div class="row">
                        <label for="date">Date</label>
                        <input type="date" placeholder="Date" bind:value={dateInput} min={dateInput} id="date" class="workspace-input {errors.dateField.error == true ? 'input-error' : 'default-input'}" on:input={() => {buttonToggle(); formValidation();  initializeInput("date");}}/>
                    </div>
                    <button type="button" class="{buttons.create.text == "Scheduling..." ? 'btn-submit-extend' : 'btn-submit'}" on:click={() => {handleSubmit(); buttons.create.text = "Scheduling..."}} {disabled} >{buttons.create.text}</button>
                </form>
            {:else if formField == "preview"}
                <div class="roboto-medium workspace-title">Driver Event { eventIDEdit } Preview </div>
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
                    <button type="button" class="btn-edit" on:click={() => {formField = 'editing'; buttonToggle(); initializeAllInput(); }}>Edit</button>
                    <button type="button" class="btn-delete" on:click={() => formField = 'deletion'}>Delete</button>
                </div>
            {:else if formField == "deletion"}
                <div class="roboto-medium workspace-title">Driver Event { eventIDEdit } Preview </div>
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
                        <select id="drivers" bind:value={driverInput} on:input={() => {buttonToggle(); formValidation();  initializeInput("driver");}} class="workspace-input {errors.driver.error == true ? 'input-error' : 'default-input'}">
                            {#each data.drivers as driver}
                                <option value={driver.id}>{driver.name}</option>
                            {/each}
                        </select>
                    </div>
                    {#if errors.description.error}
                        <div class="error-message-label">
                            {errors.description.message}
                        </div>
                    {/if}
                    <div class="row">
                        <label for="description">
                            Description:
                        </label>
                        <input type="text" id="description" class="workspace-input {errors.description.error == true ? 'input-error' : 'default-input'}" bind:value={description} on:input={() => {buttonToggle(); formValidation(); initializeInput("desc");}}/>
                    </div>
                    {#if errors.fromField.error}
                        <div class="error-message-label">
                            {errors.fromField.message}
                        </div>
                    {/if}
                    <div class="row">
                        <label for="from">
                            From:
                        </label>
                        <input type="time" id="from" class="workspace-input {errors.fromField.error == true ? 'input-error' : 'default-input'}" bind:value={fromInput} on:input={() => {buttonToggle(); formValidation(); initializeInput("from");}}/>
                    </div>
                    {#if errors.toField.error}
                        <div class="error-message-label">
                            {errors.toField.message}
                        </div>
                    {/if}
                    <div class="row">
                        <label for="to">
                            To:
                        </label>
                        <input type="time" id="to" class="workspace-input {errors.toField.error == true ? 'input-error' : 'default-input'}" bind:value={toInput} on:input={() => {buttonToggle(); formValidation(); initializeInput("to");}}/>
                    </div>
                    {#if errors.dateField.error}
                        <div class="error-message-label">
                            {errors.dateField.message}
                        </div>
                    {/if}
                    <div class="row">
                        <label for="date">
                            Date:
                        </label>
                        <input type="date" id="date" class="workspace-input {errors.dateField.error == true ? 'input-error' : 'default-input'}" bind:value={dateInput} min={dateInput} on:input={() => {buttonToggle(); formValidation(); initializeInput("date");}}/>
                    </div>

                </div>
                <div class="preview-actions">
                    <button type="button" class="{buttons.create.text == "Scheduling..." ? 'btn-submit-extend' : 'btn-update'}" on:click={() => {handleEdit(); buttons.edit.text = "Updating..."}} {disabled}>{buttons.edit.text}</button>
                </div>
            {/if}
        </div>
        
    {/if}
</div>

