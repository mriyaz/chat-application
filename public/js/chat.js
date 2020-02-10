const socket = io();

const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $messages = document.querySelector('#messages');

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const urlTemplate = document.querySelector('#url-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
    //Get the new message
    const $newMessage = $messages.lastElementChild;

    //Get the new message margin botton
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMarginBotton = parseInt(newMessageStyles.marginBottom);

    //Get the new message height
    const newMessageHeight = $newMessage.offsetHeight + newMessageMarginBotton;

    //Get visible height of the messages window
    const visibleHeight = $messages.offsetHeight;

    //Total height of the messages container
    const containerHeight = $messages.scrollHeight;

    //How far have I scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if ((containerHeight - newMessageHeight) <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }

}

socket.on('message', (message) => {
    console.log(message);

    //compile data to render
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('locationMessage', (locationObj) => {
    console.log(locationObj);

    //compile data to render
    const html = Mustache.render(urlTemplate, {
        username: locationObj.username,
        url: locationObj.url,
        createdAt: moment(locationObj.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});


socket.on('roomData', (roomObj) => {
    console.log(roomObj.users);

    //compile data to render
    const html = Mustache.render(sidebarTemplate, {
        room: roomObj.room,
        users: roomObj.users
    });
    document.querySelector('#sidebar').innerHTML = html;
});


$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    //disable button
    $messageFormButton.setAttribute('disabled', 'disabled');
    const chatMsg = e.target.elements.message.value;

    socket.emit('sendMessage', chatMsg, (error) => {
        //enable button
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();

        if (error) {
            return console.log(error)
        }

        console.log('Message was delivered!')

    });
});

const $sendLocationButton = document.querySelector('#send-location');

$sendLocationButton.addEventListener('click', (e) => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser');
    }

    //disable the button
    $sendLocationButton.setAttribute('disabled', 'disabled');
    navigator.geolocation.getCurrentPosition((position) => {
        //console.log(position.coords);
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        socket.emit('sendLocation', {
            longitude, latitude
        }, () => {
            //enable the button
            $sendLocationButton.removeAttribute('disabled');
            console.log('Location shared!');

        });
    });
});

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href('/');
    }
});