<?php
if (isset($_GET['error']) && !empty($_GET['error'])) {
    $errorMessage = $_GET['error'];
    echo "<script>
                var errorMessage = '$errorMessage';
                var popup = document.createElement('div');
                popup.innerHTML = errorMessage;
                popup.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: red; color: white; border-radius: 5px; padding: 10px; animation: pulsate 1s ease-out;';
                document.body.appendChild(popup);
                setTimeout(function(){
                    popup.style.animation = 'fadeout 5s ease-out';
                    setTimeout(function(){
                        document.body.removeChild(popup);
                    }, 5000);
                }, 1000);            
                </script>";
}
if (isset($_GET['success']) && !empty($_GET['success'])) {
    $successMessage = $_GET['success'];
    echo "<script>
                var successMessage = '$successMessage';
                var popup = document.createElement('div');
                popup.innerHTML = successMessage;
                popup.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: blue; color: white; border-radius: 5px; padding: 10px; animation: pulsate 1s ease-out;';
                document.body.appendChild(popup);
                setTimeout(function(){
                    popup.style.animation = 'fadeout 5s ease-out';
                    setTimeout(function(){
                        document.body.removeChild(popup);
                    }, 5000);
                }, 1000);            
                </script>";
}
?>