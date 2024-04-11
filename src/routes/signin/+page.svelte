<script>
    import '../styles.css';
    import { users } from '../data';

    $: username = '';
    $: password = '';

    const validateLogin = (event) => {
        let userLogin = users.find((user) => user.username == username);
        if (userLogin == undefined) return console.log("Error: User not found.");
        if (userLogin.password !== password) return console.log("Incorrect Password");
        console.log("Login Successful");
    }
</script>
<svelte:head>
	<title>Sign In - Driver Scheduling</title>
	<meta name="description" content="Muneshwers Driver Scheduling Platform" />
</svelte:head>
<div class="signin-page">
    <div class="container">
        <div class="title">
            <h1>Muneshwers Driver Schedule</h1>
        </div>
        <form method="post">
            <input type="text" placeholder="Username" bind:value={username} name="username"/>
            <input type="password" placeholder="Password" bind:value={password} name="password"/>
            <span>{username}</span>
            <button type="submit" class="signin-submit" on:click={() => validateLogin()}>Sign In</button>
        </form>
        <br />
        <a href="/">Back to Home</a>
    </div>
    
</div>

<style>
    input {
        padding: 10px;
        border: 1px rgb(82, 82, 82) solid;
        outline: none;
        border-radius: 10px;
        width: 80%;
        margin-left: auto;
        margin-right: auto;
        margin-bottom: 5%;
    }

    input:hover, input:focus {
        border: 1px #0047ab solid;
    }
</style>