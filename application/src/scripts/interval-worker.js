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
onmessage = e => {
    // function string2dom (html) {
    //     let iframe, doc;
    //     iframe = document.createElement('iframe');
    //     iframe.style.display = 'none';
    //     document.body.appendChild(iframe);
    //     doc = iframe.contentDocument || iframe.contentWindow.document;
    //     iframe.parentNode.removeChild(iframe);
    //     doc.open();
    //     doc.write(html);
    //     doc.close();
    //     return doc;
    // }
    console.log("[From Main]: ");
    const message = e.data.emojiFunction;
    const domString = e.data.domElementString;
    let dom = string2dom(domString);
    console.log(message);
    let parsedFunc = eval('('+ message +')');
    parsedFunc(dom);
    // let objParsed = JSON.parse(message, function (key,value){
    //     if (typeof value == "string" && value.startsWith("/Function(") && value.endsWith(")/")){
    //         value = value.substring(10,value.length - 2);
    //         console.log("Value after it is parsed",value);
    //         return (0, eval)("(" + value + ")");
    //     }
    //     return value;
    // })
    postMessage("Set Interval!");
    postMessage("Polo!");
};