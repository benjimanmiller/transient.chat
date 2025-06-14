//Utils File for shared functions. 

function showAlert_Success(message) {
    var successMessage = message;
    var popup = document.createElement('div');
    popup.innerHTML = successMessage;
    popup.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: blue; color: white; border-radius: 5px; padding: 10px; animation: pulsate 1s ease-out;';
    document.body.appendChild(popup);
    setTimeout(function () {
        popup.style.animation = 'fadeout 5s ease-out';
        setTimeout(function () {
            document.body.removeChild(popup);
        }, 5000);
    }, 1000);
}

function showAlert_Error(message) {
    var errorMessage = message;
    var popup = document.createElement('div');
    popup.innerHTML = errorMessage;
    popup.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: red; color: white; border-radius: 5px; padding: 10px; animation: pulsate 1s ease-out;';
    document.body.appendChild(popup);
    setTimeout(function () {
        popup.style.animation = 'fadeout 5s ease-out';
        setTimeout(function () {
            document.body.removeChild(popup);
        }, 5000);
    }, 1000);
}