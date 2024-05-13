<script>
    import mllogo from "../../../mllogo.png";
    import '../../styles.css';
    import arrowLeft from "../../../arrow-left-solid.svg";
    $: isLoggedIn = true;
</script>

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
<div class="driver-space">
    <div class="space-header poppins-medium">
        Driver's Workspace
    </div>
    <div class="page-subtitle poppins-medium">
        Create New Trip
    </div>
    <!-- svelte-ignore a11y-invalid-attribute -->
    <a href="/" class="workspace-back">
        <img src={arrowLeft} alt="Back to Home" class="workspace-back-button" />
    </a>

    <form action="" method="post" class="trip-form">
        <div class="trip-row">
            <label for="" class="form-label">To:</label>
            <input type="text" name="location" id="location" placeholder="Location" class="trip-form-input default-input" />
        </div>
        <div class="trip-row">
            <label for="" class="form-label">Vehicle:</label>
            <select id="drivers" class="trip-form-input default-input">
                <option value="1">GAC4612</option>
                <option value="2">GAG1432</option>
                <option value="3">PAE8785</option>
                <option value="4">PAE7442</option>
                <option value="5">PAE2709</option>
                <option value="6">PMM5900</option>
                <option value="7">PAC4729</option>
                <option value="8">PAC2290</option>
                <option value="9">PAC7412</option>
            </select>
        </div>
        <div class="trip-row">
            <label for="" class="form-label">Start:</label>
            <input type="time" name="startTrip" id="startTrip" placeholder="startTrip" class="trip-form-input default-input"/>
        </div>
        <div class="trip-row">
            <label for="" class="form-label">Odometer:</label>
            <input type="text" name="odometer" id="odometer" placeholder="0000000" class="trip-form-input default-input"/>
        </div>
        <div class="trip-row">
            <label for="" class="form-label">Date:</label>
            <input type="date" name="tripDate" id="tripDate" placeholder="Location" class="trip-form-input default-input"/>
        </div>
        <button type="button" class="trip-btn-submit" disabled >Create Trip</button>
    </form>
    
</div>