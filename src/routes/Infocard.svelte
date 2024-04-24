<script>
    import xmark from "../xmark-solid.svg";
    import { createEventDispatcher } from "svelte";

    export let driverInfo;
    export let description;
    export let startTime;
    export let endTime;
    export let dateInfo;

    const dispatch = createEventDispatcher();

    const closeField = () => {
        dispatch("toggle", {
            boolean: false
        })
    }
</script>
<div class="modal-container">
    <div class="info-card-modal">
        <div class="info-head-row">
            <div class="modal-header raleway-medium">
                {description}
            </div>
            <a href="" class="close-toggle" on:click={() => closeField()}>
                <img src={xmark} alt="Close Button" class="close-button">
            </a>
        </div>
        
        <div class="row">
            <div class="row-title">
                Driver:
            </div>
            <div class="row-details">
                {driverInfo}
            </div>
        </div>
        <div class="row">
            <div class="row-title">
                From:
            </div>
            <div class="row-details">
                {startTime}
            </div>
        </div>
        <div class="row">
            <div class="row-title">
                To:
            </div>
            <div class="row-details">
                {endTime}
            </div>
        </div>
        <div class="row">
            <div class="row-title">
                Date:
            </div>
            <div class="row-details">
                {dateInfo}
            </div>
        </div>

    </div>
</div>
