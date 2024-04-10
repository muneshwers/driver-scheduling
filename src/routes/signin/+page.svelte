<script>
    import '../styles.css';
    import { users } from '../data';

    $: username = '';
    $: password = '';

    const validateLogin = (event) => {
        let userLogin = users.find((user) => user.username == username);
        if (!userLogin) return;
    }
</script>

<div class="signin-page">
    <div class="container">
        <div class="title">
            <h1>Muneshwers Driver Schedule</h1>
        </div>
        <form action="">
            <input type="text" placeholder="Username" bind:value={username}/>
            <input type="password" placeholder="Password" bind:value={password}/>
            <span>{username}</span>
            <button type="submit" class="signin-submit" on:click={() => validateLogin()}>Sign In</button>
        </form>
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