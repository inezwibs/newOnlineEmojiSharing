const exportedIo = require('../configs/rootSocket');
const exportedApp = require('../../index');
// const io = exportedApp.getSocketIo;

class SocketServices {
    currentUser;
    currenUserRefresh;
    constructor() {

    }
    // initListenToUserSocket()  {
    //     // io.on('connection',(socket)=> {
    //     //     console.log("Connection from history controller");
    //     //     socket.on('current user', data => {
    //     //         this.currentSocket = data;
    //     //         console.log("User online array in services", data);
    //     //
    //     //     });
    //     // });
    //
    // }

     getUserSocketData(){
        this.currentUser =  exportedApp.userOnlineData;
        // this.currentUser = exportedApp.emittedUserIdSet;
        return this.currentUser;
    }

    getUserRefreshData(){
        this.currentUserRefresh =  exportedApp.userRefreshData;
        // this.currentUser = exportedApp.emittedUserIdSet;
        return this.currentUserRefresh;
    }
}

module.exports = SocketServices;
