<script>
    import { onMount } from 'svelte';
    import { Calendar } from "@fullcalendar/core";
    import { drivers, events } from "./data";
    import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
    import './styles.css';

    let calendarEl;
    let isLoggedIn = true;
    let calendar;
    let eventData = events;

    $: driverInput = '';
    $: fromInput = '';
    $: toInput = '';
    $: dateInput = '';

    onMount(() => {
        calendar = new Calendar(calendarEl, {
            plugins: [ resourceTimelinePlugin ],
            initialView: 'resourceTimeline',
            buttonText: {
                today: 'Today' // Change the text for the "Today" button here
            },
            height: "100%",
            resources: drivers,
            events: eventData
        })
        calendar.render();
    });

    const handleSubmit = (event) => {
        let eventDetails = {
            title: "Driving",
            start: dateInput+"T"+fromInput+":00",
            end: dateInput+"T"+toInput+":00",
            resourceId: driverInput
        }
        eventData.push(eventDetails);
        eventData = eventData;
        console.log("Schedule updated!", eventDetails, ". Events are now: ", eventData);
    }

    

</script>

<svelte:head>
	<title>Driver Scheduling</title>
	<meta name="description" content="Muneshwers Driver Scheduling Platform" />
</svelte:head>

<header>
    <div class="title">
        <h1>Muneshwers Drivers Schedule</h1>
    </div>
    <div class="actions">
        <a href="/signin">
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
        <form action="" class="formContainer">
            <h1>Schedule Driver</h1>
            <select name="drivers" bind:value={driverInput}>
                <option value="Select Driver">Select Driver:</option>
                <option value="1">Johnson Barrymore</option>
                <option value="2">Christian Murray</option>
                <option value="3">Izuku Midoriya</option>
                <option value="4">Brad English</option>
            </select>
            <input type="time" placeholder="From" bind:value={fromInput}/>
            <input type="time" placeholder="To" bind:value={toInput}/>
            <input type="date" placeholder="Date" bind:value={dateInput}/>
            <button type="submit" class="submit-button" on:click={() => handleSubmit()}>Schedule</button>
            <span>{driverInput} from {fromInput} to {toInput} on {dateInput}.</span>
        </form>
    {/if}
</div>

