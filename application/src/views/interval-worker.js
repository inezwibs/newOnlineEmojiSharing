// self.setInterval( (ev) => {
//     ev.emojiForm.submit();
// },60000);
//
// self.postMessage('Emoji form submitted');
// self.close();
//
// self.addEventListener('submit', (ev) => {
//     console.log('Submitting')
//     self.setInterval( e => {
//         e.emojiForm.submit();
//     },5000)
//     console.log('Submitted')
//     self.postMessage('Emoji form submitted');
//     self.close();
// })
// onmessage = e => {
//     console.log("[From Main]: ");
//     // const message = e.data;
//     console.log(e.data);
//     // console.log(`[From Main]: ${message}`);
//     postMessage("Polo!");
// };