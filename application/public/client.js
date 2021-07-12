// This file's full path is /public/client.js

jQuery.noConflict()(function ($) { // this was missing for me

    $(document).ready(function () {
        /* Global io */
        let socket = io();
        console.log('in client js ')
        socket.on('user', data => {
            console.log('user socket on connect', data);
            console.log ('This is user online data: ',data);
            socket.emit('user data', data);

        });


        socket.on('userCount', count => {
            console.log('user online connected', count);
        })


        // // Form submittion with new message in field with id 'm'
        // $('form').submit(function () {
        //     let messageToSend = $('#m').val();
        //     // Send message to server here?
        //     $('#m').val('');
        //     return false; // Prevent form submit from refreshing page
        // });
    });
});