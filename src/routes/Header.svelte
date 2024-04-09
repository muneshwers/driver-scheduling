<script>
    let signedin = false;
</script>

<header>
    <div class="title">
        <h1>Muneshwers Drivers Schedule</h1>
    </div>
    <div class="actions">
        <button type="button" class="signin-button">
            {signedin ? 'Sign Out' : 'Sign In'}
        </button>
    </div>
</header>

<style>
    
    header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        font-weight: bold;
    }

    .signin-button {
        padding: 10px;
        border-radius: 5px;
        border: 0;
        background-color: #0047ab;
        color: white;
        font-size: medium;
    }

    .signin-button:hover {
        cursor: pointer;
        background-color: #003580;
        transition: 0.5s;
    }
</style>