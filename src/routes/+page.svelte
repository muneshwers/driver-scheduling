<script>
    import { onMount } from 'svelte';
    import { Calendar } from "@fullcalendar/core";
    import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
    import './styles.css';

    let calendarEl;
    let isLoggedIn = true;
    let calendar;

    onMount(() => {
        calendar = new Calendar(calendarEl, {
            plugins: [ resourceTimelinePlugin ],
            initialView: 'resourceTimeline',
            buttonText: {
                today: 'Today' // Change the text for the "Today" button here
            },
            height: "100%",
            width: "100%",
            resources: [
                { id: 'a', title: 'Johnson Daniels'},
                { id: 'b', title: 'Christian Murray'},
                { id: 'c', title: 'Mash Burnedead'},
                { id: 'd', title: 'Midoriya Izuku'},
                { id: 'e', title: 'Brad English'},
                { id: 'f', title: 'James Harrison'},
                { id: 'g', title: 'Quincy Monroe'},
                { id: 'h', title: 'Bartholomew Ew'},
                { id: 'i', title: 'Ewart British'},
                { id: 'j', title: 'Halle Lujah'},
            ],
            events: [
                {
                    title: 'Driving',
                    start: '2024-04-09T10:00:00',
                    end: '2024-04-09T12:00:00',
                    resourceId: 'a'
                },
                {
                    title: 'Driving',
                    start: '2024-04-09T13:00:00',
                    end: '2024-04-09T15:00:00',
                    resourceId: 'b'
                }
            ]
        })
        calendar.render();
    })

    

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
        <form action="POST" class="formContainer">
            <h1>Schedule Driver</h1>
            <select name="drivers">
                <option value="Select Driver">Select Driver:</option>
                <option value="Johnson Daniels">Johnson Daniels</option>
                <option value="Christian Murray">Christian Murray</option>
            </select>
            <input type="time" placeholder="From" />
            <input type="time" placeholder="To" />
            <input type="date" placeholder="Date" />
            <button type="submit" class="submit-button">Schedule</button>
        </form>
    {/if}
</div>

