<?php session_start(); ?>

<header>
    <?php if (isset($_SESSION['username'])): ?>
        <h1><a href="dashboard.php">Ephermera</a></h1>
    <?php else: ?>
        <h1><a href="index.php">Ephermera</a></h1>
    <?php endif; ?>
    <div class="header-text">
        <p>A Forum for the Momentary Present</p>
    </div>
</header>

<script src="js/utils.js"></script>
