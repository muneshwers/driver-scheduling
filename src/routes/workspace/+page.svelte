<script>
    import mllogo from "../../mllogo.png";
    import '../styles.css';
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