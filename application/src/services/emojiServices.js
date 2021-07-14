const db = require("../configs/database.js");
const SocketService = require( "../services/socketServices" );
const socketService = new SocketService();
const DateService = require("../services/dateServices");
const dateService = new DateService();

class EmojiServices {
    _result = {};
    studentOnlineNotParticipated = 0;
    studentOffline = 0;
    studentContributed =[];
    studentRegistered = 0;
    studentOnlineIds = [];

    constructor() {
    }

    // initializeListenerToUserSocket(){
    //     socketService.initListenToUserSocket();
    // }

    async getUserParticipatedIds(req) {
        let thisMinute = req.insertMinutes ? req.insertMinutes : req.currentMinutes

        let query = '';
        try{
            query = 'SELECT users_id FROM emojidatabase.emojiRecordsPerMinute WHERE min = ' + thisMinute ;

            const [rows, err] = await db.execute(query);
            if (rows !== null && rows.length > 0) {
                return {success: true, body: rows};
            } else {
                let rows = {};
                return {success: true, body: rows};
            }
        }catch(e){
            return {success: false, error: e};
        }
    };

    async getContributedStudentsCountAndId(req, thisMinute, currentDate) {
        // let thisMinute = req.insertMinutes ? req.insertMinutes : req.currentMinutes
        // let query =
        //     `SELECT distinct users_id FROM emojidatabase.posted_emojis WHERE class_id = ${req.classId} AND minute = ${thisMinute} AND date_time = '${currentDate}';`
        try {
            const results = await dateService.matchDateInDatabase(currentDate, req.classId, thisMinute);
            if (results.success && results.body.length > 0) {
                // req.contributedStudentsCount = rows[0].count;
                results.body.forEach(row =>{
                    if (this.studentContributed.indexOf(row))
                        this.studentContributed.push(row);
                })
                // req.studentNotContributed =
                //     req.classRegisteredStudentsCount - req.contributedStudentsCount;
                // let tempNotParticipated = this.studentRegistered - this.studentContributed;
                // //reset to 0 if the number is negative
                // if (req.studentNotContributed < 0){
                //     req.studentNotContributed = 0;
                // }
                let contributedStudents = {
                    count:  this.studentContributed.length ,
                    id:  this.studentContributed
                };
                return {success: true, body: contributedStudents};
            } else {
                let rows = {};
                return {success: true, body: rows};
            }
        } catch (e) {
            console.log("Catch an error: ", e);
            return {success: false, error: e};
        }
    };



    async getClassRegisteredStudentsCountAndId(req) {
        let query =
            " SELECT users_id  FROM emojidatabase.registrations WHERE classes_id = '" +
            req.classId +"'";

        try {
            const [rows, err] =  await db.execute(query);
            if (rows !== null && rows.length > 0) {
                this.studentRegistered = rows.length;
                let registeredStudents = {
                    count: this.studentRegistered,
                    id: rows
                };
                return {success: true, body: registeredStudents};
            } else {
                let rows = {};
                return {success: true, body: rows};
            }
        } catch (e) {
            console.log("Catch an error: ", e);
            return {success: false, error: e};
        }
    };

    getStudentOnlineNotParticipated(usersOnline) {
        // get ids of online students getOnlineStudentIds
        // get ids of contributed students getContributedStudentsCountAndId
        // foreach online students not in contributed, add to count of online not participate
        let studentOnlineNotParticipated =[];
        usersOnline = this.getOnlineStudentIds();
        this.studentOnlineIds = usersOnline;
        this.studentOnlineIds.forEach( onlineStudentId => {
            if (this.studentContributed.length !== 0){
                if (this.studentContributed.indexOf(onlineStudentId) < 0){ // meaning not found
                    studentOnlineNotParticipated.push(onlineStudentId);
                }
            }else {
                return this.studentOnlineIds;
            }
        });
        return studentOnlineNotParticipated;
    };

    getStudentOffline() {
        this.studentOffline =  this.studentRegistered - this.getOnlineStudentIds().length;
        return this.studentOffline;
    };

    getOnlineStudentIds() {
        this.studentOnlineIds = socketService.getUserSocketData();
        return this.studentOnlineIds;
    };
}

module.exports = EmojiServices;
