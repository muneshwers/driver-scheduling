<script>
    import { page } from '$app/stores';
    import logo from '../../logo.png';
    import '../styles.css';

    //Check for errors from params
    let errorSignin = "";
    const url = new URL($page.url);
    const searchParams = url.searchParams;
    errorSignin = searchParams.get('errorSignin');

    //Inputs
    $: username = '';
    $: password = '';

    //Toggles and Messages
    let errorToggle = false;
    let errorMessage = '';
    let disabled = true;

    if (errorSignin == "IncorrectCredentials") {
        errorToggle = true;
        errorMessage = "Incorrect username and password. Please try again.";
        
    }

    //Form input validation
    const buttonToggle = () => {
        if(!username || !password) {
            disabled = true;
            return
        }
        disabled = false;
    }
</script>
<svelte:head>
	<title>Sign In - Driver Scheduling</title>
	<meta name="description" content="Muneshwers Driver Scheduling Platform" />
</svelte:head>
<div class="signin-page">
    <div class="container">
        <div class="logo-container">
            <img src={logo} alt="Driver's App Logo" class="logo-image">
        </div>
        <div class="title">
            <h1 class="roboto-medium">Muneshwers Driver Schedule</h1>
        </div>
        {#if errorToggle}
            <div class="error-message">{errorMessage}</div>
        {/if}
        <form method="post">
            <input type="text" placeholder="Username" bind:value={username} name="username" class="signin-input {errorToggle == true ? 'input-error' : 'default-input'}" on:input={() => buttonToggle()}/>
            <input type="password" placeholder="Password" bind:value={password} name="password" class="signin-input {errorToggle == true ? 'input-error' : 'default-input'}" on:input={() => buttonToggle()}/>
            <button type="submit" class="signin-submit" {disabled}>Sign In</button>
        </form>
        <br />
        <div class="backTohome">
            <a href="/" class="remove-link-defaults">Back to Home</a>
        </div>
        
    </div>
    
</div>
<style>
    .logo-container {
        object-fit: contain;
        margin-top: 2%;
    }

    .logo-image {
        height: 50px;
        width: 50px;
    }
</style>