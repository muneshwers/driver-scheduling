<script>
    import '../styles.css';
    let isLoggedIn;
</script>

<div class="signin-page">
    <div class="container">
        <div class="title">
            <h1>Muneshwers Driver Schedule</h1>
        </div>
        <form action="POST">
            <input type="text" placeholder="Username" />
            <input type="password" placeholder="Password" />
            <button type="submit" class="signin-submit">Sign In</button>
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