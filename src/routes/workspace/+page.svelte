<script>
    import mllogo from "../../mllogo.png";
    import '../styles.css';
    import arrowLeft from "../../arrow-left-solid.svg";
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
    <!-- svelte-ignore a11y-invalid-attribute -->
    <a href="/" class="workspace-back">
        <img src={arrowLeft} alt="Back to Home" class="workspace-back-button" />
    </a>
    <div class="pages">
        <a href="/workspace/newTrip" rel="noopener noreferrer">
            <button class="single-page poppins-medium">
                New Trip
            </button>
        </a>
        <a href="/workspace" rel="noopener noreferrer">
            <button class="single-page poppins-medium">
                View Trip History
            </button>
        </a>

    </div>
</div>