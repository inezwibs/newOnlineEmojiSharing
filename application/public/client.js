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


        // Form submittion with new message in field with id 'm'
        $('#threeSecondSwitch').on('change',function(){
            let switchValue = $('#threeSecondSwitch').is(':checked') ? $('#threeSecondSwitch').val() : 'off';
            socket.emit('refreshInterval',{
                threeSecondSwitch: switchValue
            });
            console.log('user socket refresh data', switchValue);

            $('#emojiSubmit')[0].submit();

        })

    });
});