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
            resources: data.driverList,
            events: data.eventsList
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
        calendar.addEvent(eventDetails);
        updateEvents(eventDetails);
        calendar.refetchEvents();
        console.log("Schedule updated!", eventDetails, ". Events are now: ", data.eventsList);
    }

    const updateEvents = async(eventDetails) => {
        const { error } = await supabase.from("events").insert([eventDetails]);
        if (error) return console.log("Unable to Insert: ", error);
        console.log("Insert successful!");
        driverInput = '';
        fromInput = '';
        toInput='';
        dateInput='';
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
                {#each data.drivers as driver}
                    <option value={driver.id}>{driver.name}</option>
                {/each}
            </select>
            <input type="time" placeholder="From" bind:value={fromInput}/>
            <input type="time" placeholder="To" bind:value={toInput}/>
            <input type="date" placeholder="Date" bind:value={dateInput}/>
            <button type="submit" class="submit-button" on:click={() => handleSubmit()}>Schedule</button>
            <span>{driverInput} from {fromInput} to {toInput} on {dateInput}.</span>
            <!-- <ul>
                {#each data.users as user}
                    <li>{user.name}</li>
                {/each}
            </ul> -->
        </form>
    {/if}
</div>

