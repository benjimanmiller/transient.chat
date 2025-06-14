<div class="sidebar-left">
    <h2>Navigation</h2>
    <ul>
        <?php session_start(); ?>
        <?php if (isset($_SESSION['username'])) : ?>
            <?php if ($_SESSION['user_type'] === 'admin') : ?>
                <!-- Links for admin users -->
                <li><a href="dashboard.php">Boards</a></li>
                <li><a href="admin-panel.php">Admin Panel</a></li>
                <li><a href="about.php">About</a></li>
                <li><a href="contact.php">Contact</a></li>
                <li><a href="privacy.php">Privacy Statement</a></li>
            <?php else : ?>
                <!-- Links for non-admin users -->
                <li><a href="dashboard.php">Boards</a></li>
                <li><a href="about.php">About</a></li>
                <li><a href="contact.php">Contact</a></li>
                <li><a href="privacy.php">Privacy Statement</a></li>
            <?php endif; ?>
            <li><a href="logout.php">Log Out</a></li>
        <?php else : ?>
            <!-- Links for non-logged-in users -->
            <li><a href="index.php">Login</a></li>
            <li><a href="about.php">About</a></li>
            <li><a href="contact.php">Contact</a></li>
            <li><a href="privacy.php">Privacy Statement</a></li>
        <?php endif; ?>
    </ul>
</div>