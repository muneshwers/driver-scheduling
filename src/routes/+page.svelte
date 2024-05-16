<script>
    import { onMount } from 'svelte';
    import { Calendar } from "@fullcalendar/core";
    import { supabase } from "$lib/supabaseClient";
    import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
    import { browser } from '$app/environment';
    import './styles.css';
    import mllogo from "../mllogo.png";
    import arrowLeft from "../arrow-left-solid.svg";
	import Infocard from './Infocard.svelte';
	import Unfinishedmodal from './Unfinishedmodal.svelte';

    export let data;

    $: loggedUserInfo = data.userInfo;

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

    //Returns JSON of driver trips for validation
    $: getDriverTrips = async () => {
        const { data, error } = await supabase.from("trips").select();
        if(error) return console.error(error);
        return {
            trips: data ?? []
        }
    }

    
    let calendarEl;
    let calendar;
    let isLoggedIn = data.access;
    let userInfo = data.userInfo;
    let userType = userInfo.user_type;
    let disabled = true;

    //TODO Change before deployment
    let schema = "public";
    if(data.mode == "development") {
        schema = "testing";
    }
    
    console.log(`[routes/+page.svelte] Using ${schema} schema.`)

    $: notification = {};


    //Main Data Sources
    $: eventsTableData = [];
    $: driverTableData = [];
    $: driversAllCols = [];
    $: eventsAllCols = [];
    $: driversActiveData = [];
    $: driverTrips = [];
    $: userTrips = [];
    $: vehicleList = [];


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
            const activeAllDrivers = dbData.drivers.filter((driver) => driver.status == "Active");
            const activeDrivers = activeAllDrivers.map((driver) => ({
                id: driver.id,
                title: driver.name
            }))
            activeDrivers.forEach(singleEvent => {
                returnedData.push(singleEvent);
            });     
        }
        if (toggle == 'driversFull') {
            const dbData = await updateDriverData();
            dbData.drivers.forEach(singleEvent => {
                returnedData.push(singleEvent);
            });     
        }
        if (toggle == 'driversActive') {
            const dbData = await updateDriverData();
            const activeDrivers = dbData.drivers.filter((driver) => driver.status == "Active");
            activeDrivers.forEach(singleEvent => {
                returnedData.push(singleEvent);
            });     
        }
        if (toggle == 'trips') {
            const dbData = await getDriverTrips();
            const unfinishedTrips = dbData.trips.filter((trip) => trip.end == null);
            unfinishedTrips.forEach(trip => {
                returnedData.push(trip);
            })
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
    $: addDriverName = '';
    $: editDriverId = '';
    $: editDriverStatus = '';
    $: editDriverStatusConfirm = '';

    //Toggles
    $: formField = 'create'; //Options: create, editing, preview, deletion
    $: calendarOn = false;
    $: tabSelection = 'scheduler';
    $: settingsPage = 'default';
    $: buttons = {
        create: {
            text: "Schedule",
        },
        edit: {
            text: "Update"
        },
        driverCreate: {
            text: "Add New"
        },
        driverEdit: {
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

    $: tripModal = false;

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
        },
        addDriverName : {
            error: false,
            message: "",
            init: 0
        },
        editDriverId: {
            error: false,
            message: "",
            init: 0
        },
        editDriverStatus: {
            error: false,
            message: "",
            init: 0
        },
    }

    onMount( async () => {
        eventsTableData = await addDataToLocal("events");
        driverTableData = await addDataToLocal("drivers");
        driversAllCols = await addDataToLocal("driversFull");
        driversActiveData = await addDataToLocal("driversActive");
        driverTrips = await addDataToLocal("trips");

        userTrips = toggleTrips().returnedData;
        vehicleList = toggleTrips().vehicles;

        Notification.requestPermission()
            .then((permission) => {
                console.log('Notifications Permissions: ' + permission);
                // navigator.serviceWorker.ready
                //     .then(registration => registration.sync.register('syncTrips'))
                //     .then(() => console.log("Registered background sync"))
                //     .catch(err => console.error("Error registering background sync", err))
            })
            .catch((error) => {
                console.log('Permissions was rejected');
                console.log(error);
            });
        
        
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
                tabSelection = "scheduler"
                pageVariableRefresh(); //Refreshes all reactive variables
                resourceId = info.event._def.resourceIds[0];
                eventStart = info.event.startStr.slice(0, 19);
                eventEnd = info.event.endStr.slice(0, 19);
                eventTitle = info.event.title;
                let concatEvent = eventTitle+eventStart+eventEnd+resourceId;
                let selectedEvent = await getEventDetailsById(concatEvent);
                if(!selectedEvent) return console.error("Selected Event not found.");

                let foundDriver = driversAllCols.find((data) => data.id == selectedEvent.resourceId);
                if(!isLoggedIn || userType == "driver") {
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
                    schema: schema, 
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
                    schema: schema,
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
                    schema: schema,
                    table: 'drivers',
                },
                async (payload) => {
                    driverTableData = await addDataToLocal("drivers");
                    driversAllCols = await addDataToLocal("driversFull");
                    driversActiveData = await addDataToLocal("driversActive");
                    calendar.render();
                }
            ).on(       
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: schema,
                    table: 'events',
                },
                async (payload) => {
                    const driverInfo = driversActiveData.find((driver) => driver.id == payload.new.resourceId);
                    notification = {
                        title: 'Trip has been scheduled',
                        options: { body: payload.new.title + ' from '+payload.new.startTime+ ' to '+ payload.new.endTime + " | Driver: " + driverInfo.name },
                        data: {
                            loggedUser: userInfo.display_name,
                            driverName: driverInfo.name,
                            userType: userType
                        }
                    }
                    eventsTableData = await addDataToLocal("events");
                    eventsAllCols = await addDataToLocal("eventsFull");
                    calendar.removeAllEventSources();
                    calendar.addEventSource(eventsTableData);
                    navigator.serviceWorker.controller.postMessage(notification);
                    calendar.render();
                }
            ).on(       
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: schema,
                    table: 'drivers',
                },
                async (payload) => {
                    driverTableData = await addDataToLocal("drivers");
                    driversAllCols = await addDataToLocal("driversFull");
                    driversActiveData = await addDataToLocal("driversActive");
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

    //Runs when user clicks the submit button in scheduler
    const handleSubmit = async (event) => {
        
        let eventDetails = {
            title: description,
            start: dateInput+"T"+fromInput+":00",
            end: dateInput+"T"+toInput+":00",
            resourceId: driverInput
        };
        //For db upload and validation
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

    //Runs when user clicks on Create for Driver Settings
    const handleCreateDriver = async (event) => {

        let newId = await lastDriverId()+1;
        
        let driverUpload = {
            id: newId,
            name: addDriverName,
            status: "Active"
        };
        let driverInfo = {
            id: newId,
            title: addDriverName
        }
        let existing = await checkForExistingDrivers(driverUpload);
        if(existing) {
            errors.addDriverName.error = true;
            errors.addDriverName.message = "Driver already exists. Please confirm with list on calendar.";
            return;
        }
        createDriver(driverUpload);
        calendar.addResource(driverInfo);
        calendar.render();
    }

    //Runs when user clicks on Update in Edit Workspace
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

    //Runs when user clicks on Update in Driver Settings Edit
    const handleEditDriver = async (event) => {
        let updatedDriver = driversAllCols.find((driver) => driver.id == editDriverId);
        let driverName = updatedDriver.name;
        editDriverStatusConfirm = updatedDriver.status;

        let driverUpload = {
            id: editDriverId,
            status: editDriverStatus
        };

        let driverInsert = {
            id: editDriverId,
            title: driverName
        };
        

        if(editDriverStatus == editDriverStatusConfirm) {
            errors.editDriverStatus.error = true;
            errors.editDriverStatus.message = "Driver status has not been changed";
            return;
        }

        if(editDriverStatus == "Inactive" || editDriverStatus == "Deactive") {
            let removeResource = calendar.getResourceById(editDriverId);
            removeResource.remove();
        } 
        if(editDriverStatus == "Active") {
            calendar.addResource(driverInsert);
        }
        
        editDriver(driverUpload);
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

    //Checks for existing drivers
    const checkForExistingDrivers = async (driverUpload) => {
        driversAllCols = await addDataToLocal("driversFull");
        let foundExisting = driversAllCols.find((driver) => driver.name == driverUpload.name);
        if(!foundExisting) return false; //No overlaps or duplicates
        return true;
    }

    //Searches for ID of the last driver
    const lastDriverId = async () => {
        driversAllCols = await addDataToLocal("driversFull");
        if (driversAllCols.length < 1) {
            return 0;
        }
        let driverIds = [];
        driversAllCols.forEach((driver) => {
            driverIds.push(driver.id);
        });
        let sortedIds = driverIds.sort((a, b) => a - b)
        let lastItemIndex = sortedIds.length - 1;

        return sortedIds[lastItemIndex];
    }

    //Checks for overlaps not related to current event
    const checkforOverlapsEdit = async (eventUpload) => {
        eventsAllCols = await addDataToLocal("eventsFull");
        let driverEvents = eventsAllCols.filter((driverEvent) => driverEvent.resourceId == eventUpload.resourceId && driverEvent.date == eventUpload.date && driverEvent.id !== eventUpload.editID);
        let foundOverlap = driverEvents.find((singleEvent) => (eventUpload.startTime >= singleEvent.startTime && eventUpload.startTime < singleEvent.endTime) || (eventUpload.endTime > singleEvent.startTime && eventUpload.endTime <= singleEvent.endTime));
        if(!foundOverlap) return false; //No overlaps or duplicates
        return true;

    }

    //Gets Driver Status from DB using ID
    const getDriverStatus = (driverId) => {
        const driverDetails = driversAllCols.find((driver) => driver.id == driverId);
        return driverDetails.status;
    }

    //Inserts new event into DB
    const updateEvents = async(eventDetails) => {
        const { error } = await supabase.from("events").insert([eventDetails]);
        if (error) return console.error("Unable to Insert: ", error);
        formRefresh();
    }

    const createDriver = async(driverUpload) => {
        const { error } = await supabase.from("drivers").insert([driverUpload]);
        if (error) return console.error("Unable to create driver: ", error);
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

    //Updates DB with new edited driver
    const editDriver = async(driverUpload) => {
        const { error } = await supabase.from("drivers").update({ 
            status: driverUpload.status
         })
         .eq('id', driverUpload.id)
         if (error) return console.error("Unable to edit driver: ", error);
         formRefresh();
    }

    const toggleTrips = () => {
        //userTrips
        let returnedData = [];
        let vehicles = [];
        if (isLoggedIn && userInfo.user_type == "driver") {
            let userTrip = driverTrips.find((trip) => trip.driver == userInfo.display_name)
            if (userTrip) { 
                let userVehicle = data.vehicleList.find((vehicle) => vehicle.id == userTrip.vehicle);
                if(userVehicle) {
                    tripModal = true;
                    vehicles = userVehicle;
                }
            }
            returnedData = userTrip;           
            
        }
        
        return {
            returnedData,
            vehicles
        };
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
        if(field == "addDriverName") {
            errors.addDriverName.init++;
        }
        if(field == "editDriverId") {
            errors.editDriverId.init++;
        }
        if(field == "editDriverStatus") {
            errors.editDriverStatus.init++;
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
        if (addDriverName) {
            errors.addDriverName.error = false;
            errors.addDriverName.message = "";
        }
        if (!addDriverName && errors.addDriverName.init > 0) {
            errors.addDriverName.error = true;
            errors.addDriverName.message = "Driver name required.";
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

    const settingsButtonToggle = (section) => {
        if (!addDriverName && section == "create") {
            disabled = true;
            return
        }
        if (!editDriverId || !editDriverStatus && section == "edit") {
            disabled = true;
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
        errors.addDriverName.init = 0;
        errors.addDriverName.error = false;
        errors.addDriverName.message = "";
        errors.editDriverId.init = 0;
        errors.editDriverId.error = false;
        errors.editDriverId.message = "";
        errors.editDriverStatus.init = 0;
        errors.editDriverStatus.error = false;
        errors.editDriverStatus.message = "";
    }

    //Refreshes form inputs and error initiation
    const formRefresh = () => {
        driverInput = '';
        fromInput = '';
        toInput='';
        dateInput=(new Date()).toISOString().split('T')[0];
        description='';
        editDriverId = '';
        editDriverStatus = '';
        addDriverName = '';
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
        buttons.driverCreate.text = "Add New";
        buttons.driverEdit.text = "Update";
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

    const captureTripModalClose = (event) => {
        tripModal = event.detail.boolean
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

{#if userType == "driver"}
<div class="driver-widgets">
    <a href="/workspace/newTrip">
        <button type="button" class="navigation-item">New Trip</button>
    </a>
    <a href="/workspace/trips">
        <button type="button" class="navigation-item">Trip History</button>
    </a>
</div>
{/if}

<div class="contentContainer">
    <div class:calendarContainer={isLoggedIn && (userType == "admin" || userType == "scheduler") } class:calendarReadOnlyContainer={!isLoggedIn || userType == "driver"}>
        {#if !browser}
            <h1>LOADING...</h1>
        {:else}
            <div bind:this={calendarEl}></div>
            {#if showModal}
                <Infocard driverInfo={modalDriver} description={modalDescription} startTime={modalStart} endTime={modalEnd} dateInfo={modalDate} on:toggle={captureModalClose}/>
            {/if}
            {#if tripModal}
                <Unfinishedmodal tripDetails={userTrips} vehicles={vehicleList} allTrips={driverTrips} on:toggle={captureTripModalClose}/>
            {/if}
        {/if}
    </div>

    {#if isLoggedIn && (userType == "admin" || userType == "scheduler")} <!-- delete-mode -->
    <div class="workspace">
        <div class="page-toggle">
            <button class="tab-selector {tabSelection == "scheduler" ? "active-selector":""} roboto-medium" on:click={() => tabSelection = "scheduler"}>Scheduler</button>
            <button class="tab-selector {tabSelection == "settings" ? "active-selector":""} roboto-medium" on:click={() => tabSelection = "settings"}>Settings</button>
        </div>
        <div class="workspace-field {formField == "preview" ? 'preview-mode': formField == "editing" ? 'edit-mode' : formField == "deletion" ? 'delete-mode' : 'default-mode'}">
            
            {#if formField == "create" && tabSelection == "scheduler"}
                <form action="" class="formContainer">
                    <div class="poppins-medium workspace-title">Schedule Driver</div>
                    {#if errors.description.error}
                        <div class="error-message-label">
                            {errors.description.message}
                        </div>
                    {/if}
                    <div class="row">
                        <label for="description" class="workspace-label">Description</label>
                        <input type="text" placeholder="Purpose..." id="description" bind:value={description} class="workspace-input {errors.description.error == true ? 'input-error' : 'default-input'}"  on:input={() => {buttonToggle(); formValidation(); initializeInput("desc"); returnButtonState();}}/>
                    </div>
                    {#if errors.driver.error}
                        <div class="error-message-label">
                            {errors.driver.message}
                        </div>
                    {/if}
                    <div class="row">
                        <label for="drivers" class="workspace-label">Driver</label>
                        <select id="drivers" bind:value={driverInput} on:change={() => {buttonToggle(); formValidation();  initializeInput("driver"); returnButtonState();}} class="workspace-input {errors.driver.error == true ? 'input-error' : 'default-input'}">
                            {#each driversActiveData as driver}
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
                        <label for="from" class="workspace-label">From</label>
                        <input type="time" placeholder="From" bind:value={fromInput} id="from" class="workspace-input {errors.fromField.error == true ? 'input-error' : 'default-input'}" on:input={() => {buttonToggle(); formValidation(); initializeInput("from"); returnButtonState();}}/>
                    </div>
                    {#if errors.toField.error}
                        <div class="error-message-label">
                            {errors.toField.message}
                        </div>
                    {/if}
                    <div class="row">
                        <label for="to" class="workspace-label">To</label>
                        <input type="time" placeholder="To" bind:value={toInput} id="to" class="workspace-input {errors.toField.error == true ? 'input-error' : 'default-input'}" on:input={() => {buttonToggle(); formValidation(); initializeInput("to"); returnButtonState();}}/>
                    </div>
                    {#if errors.dateField.error}
                        <div class="error-message-label">
                            {errors.dateField.message}
                        </div>
                    {/if}
                    <div class="row">
                        <label for="date" class="workspace-label">Date</label>
                        <input type="date" placeholder="Date" bind:value={dateInput} min={dateInput} id="date" class="workspace-input {errors.dateField.error == true ? 'input-error' : 'default-input'}" on:input={() => {buttonToggle(); formValidation();  initializeInput("date"); returnButtonState();}}/>
                    </div>
                    <button type="button" class="{buttons.create.text == "Scheduling..." ? 'btn-submit-extend' : 'btn-submit'}" on:click={() => {handleSubmit(); buttons.create.text = "Scheduling..."}} {disabled} >{buttons.create.text}</button>
                </form>
            {:else if formField == "preview" && tabSelection == "scheduler"}
                <div class="poppins-medium workspace-title">Driver Event { eventIDEdit } Preview </div>
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
            {:else if formField == "deletion" && tabSelection == "scheduler"}
                <div class="poppins-medium workspace-title">Driver Event { eventIDEdit } Preview </div>
                <div class="preview-container">
                    Are you sure?
                </div>
                <div class="actions">
                    <button type="button" class="btn-delete" on:click={() => handleDeletion()}>Yes</button>
                    <button type="button" class="btn-edit" on:click={() => formField = 'preview'}>No</button>
                </div>
            {:else if formField == "editing" && tabSelection == "scheduler"}
                <div class="poppins-medium workspace-title">Driver Event { eventIDEdit } Edit</div>
                <div class="preview-container">
                    <div class="row">
                        <div class="previewLabel">
                            Driver:
                        </div>
                        <select id="drivers" bind:value={driverInput} on:change={() => {buttonToggle(); formValidation();  initializeInput("driver");}} class="workspace-input {errors.driver.error == true ? 'input-error' : 'default-input'}">
                            {#each driversActiveData as driver}
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
                        <label for="description"  class="workspace-label">
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
                        <label for="from" class="workspace-label">
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
                        <label for="to" class="workspace-label">
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
                        <label for="date" class="workspace-label">
                            Date:
                        </label>
                        <input type="date" id="date" class="workspace-input {errors.dateField.error == true ? 'input-error' : 'default-input'}" bind:value={dateInput} min={dateInput} on:input={() => {buttonToggle(); formValidation(); initializeInput("date");}}/>
                    </div>

                </div>
                <div class="preview-actions">
                    <button type="button" class="{buttons.create.text == "Scheduling..." ? 'btn-submit-extend' : 'btn-update'}" on:click={() => {handleEdit(); buttons.edit.text = "Updating..."}} {disabled}>{buttons.edit.text}</button>
                </div>
            {:else if tabSelection == "settings"}
                <div class="poppins-medium workspace-title">Settings</div>
                {#if settingsPage == "default"}
                    <div class="settings-home">
                        <!-- svelte-ignore a11y-invalid-attribute -->
                        <button href="" class="settings-item poppins-medium" on:click={() => settingsPage = "addDriver"}>
                            Add Driver
                        </button>
                        <button class="settings-item poppins-medium" on:click={() => settingsPage = "editDriver"}>
                            Edit Driver
                        </button>
                    </div>
                {:else if settingsPage == "addDriver"}
                    <div class="settings-page">
                        <form action="" class="formContainer">
                            <div class="settings-page-header">
                                <!-- svelte-ignore a11y-invalid-attribute -->
                                <a href="" class="back-toggle" on:click={() => settingsPage = "default"}>
                                    <img src={arrowLeft} alt="Back to Settings Home" class="back-button" />
                                </a>
                                <div class="poppins-medium workspace-subtitle">Add Driver</div>
                            </div>
                            {#if errors.addDriverName.error}
                                <div class="error-message-label">
                                    {errors.addDriverName.message}
                                </div>
                            {/if}
                            <div class="row">
                                <label for="addDriverName" class="workspace-label">Name</label>
                                <input type="text" placeholder="John Doe..." id="addDriverName" bind:value={addDriverName} class="workspace-input {errors.addDriverName.error == true ? 'input-error' : 'default-input'}"  on:input={() => {settingsButtonToggle("create"); formValidation(); initializeInput("addDriverName");  returnButtonState();}}/>
                            </div>
                            
                            <button type="button" class="{buttons.driverCreate.text == "Adding..." ? 'btn-submit-extend' : 'btn-submit'}" on:click={() => {handleCreateDriver(); buttons.driverCreate.text = "Adding..."}} {disabled} >{buttons.driverCreate.text}</button>
                        </form>
                    </div>
                {:else if settingsPage == "editDriver"}
                    <div class="settings-page">
                        <form action="" class="formContainer">
                            <div class="settings-page-header">
                                <!-- svelte-ignore a11y-invalid-attribute -->
                                <a href="" class="back-toggle" on:click={() => settingsPage = "default"}>
                                    <img src={arrowLeft} alt="Back to Settings Home" class="back-button" />
                                </a>
                                <div class="poppins-medium workspace-subtitle">Edit Driver</div>
                            </div>
                            {#if errors.editDriverId.error}
                                <div class="error-message-label">
                                    {errors.editDriverId.message}
                                </div>
                            {/if}
                            <div class="row">
                                <label for="drivers" class="workspace-label">Select Driver</label>
                                <select id="drivers" bind:value={editDriverId} on:change={() => {settingsButtonToggle("edit"); formValidation();  initializeInput("editDriverId"); editDriverStatus = getDriverStatus(editDriverId);  returnButtonState();}} class="workspace-input {errors.editDriverId.error == true ? 'input-error' : 'default-input'}">
                                    {#each driversAllCols as driver}
                                        <option value={driver.id}>{driver.name}</option>
                                    {/each}
                                </select>
                            </div>
                            {#if editDriverId && editDriverStatus}
                                {#if errors.editDriverStatus.error}
                                    <div class="error-message-label">
                                        {errors.editDriverStatus.message}
                                    </div>
                                {/if}
                                <div class="row">
                                    <label for="editDriverStatus" class="workspace-label">Status</label>
                                    <select id="editDriverStatus" bind:value={editDriverStatus} on:change={() => {settingsButtonToggle("edit"); formValidation();  initializeInput("editDriverStatus"); returnButtonState(); editDriverStatusConfirm}} class="workspace-input {errors.editDriverStatus.error == true ? 'input-error' : 'default-input'}">
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Not Active</option>
                                        <option value="Deactive">Delete</option>
                                    </select>
                                </div>
                            {/if}
                            
                            <button type="button" class="{buttons.driverEdit.text == "Updating..." ? 'btn-submit-extend' : 'btn-submit'}" on:click={() => {handleEditDriver(); buttons.driverEdit.text = "Updating..."}} {disabled} >{buttons.driverEdit.text}</button>
                        </form>
                    </div>
                {/if}
                
                

            {/if}
        </div>
    </div>

        
    {/if}
</div>

