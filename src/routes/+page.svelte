<script>
    import Header from "./Header.svelte";
    import { onMount } from 'svelte';
    import { Calendar } from "@fullcalendar/core";
    import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
    import './styles.css';

    let calendarEl;

    onMount(() => {
        let calendar = new Calendar(calendarEl, {
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

<Header />
<div class="contentContainer">
    <div class="calendarContainer">
        <div bind:this={calendarEl}></div>
    </div>

    <form action="POST" class="formContainer">
        <h1>Schedule Driver</h1>
        <input type="text" placeholder="Driver Name" />
        <input type="text" placeholder="From" />
        <input type="text" placeholder="To" />
        <input type="date" placeholder="Date" />
        <button type="submit" class="submit-button">Schedule</button>
    </form>
</div>

