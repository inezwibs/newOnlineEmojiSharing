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
                    if (this.studentContributed.indexOf(row) < 0){
                        this.studentContributed.push(row);
                    }//TODO: need to account for students who contributed more than once in a minute
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
                console.log('student contributed = ', this.studentContributed);
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
            " SELECT users_id  FROM emojidatabase.registrations WHERE classes_id = " + req.classId + "'";

        try {
            const [rows, err] =  await db.execute(query);
            if (rows !== null && rows.length > 0) {
                this.studentRegistered = rows.length;
                let registeredStudents = {
                    count: this.studentRegistered,
                    id: rows
                };
                console.log('student registered = ', this.studentRegistered);
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
        // const result = await this.getOnlineStudentIds();
        this.studentOnlineIds = usersOnline;
        this.studentOnlineIds.forEach( onlineStudentId => {
            //of students who are online
            //if student contributed is not 0
            if (this.studentContributed.length !== 0){
                // we compare those contributed to those online
                // those online is not in the student contributed array
                if (this.studentContributed.indexOf(onlineStudentId) < 0){ // meaning not found
                    studentOnlineNotParticipated.push(onlineStudentId);
                }
                // if those online is in the student contributed array, continue
            }
            //if student contributed is 0
            else {
                console.log('No student online has participated ');
            }

        });
        console.log('student online not participated = ', studentOnlineNotParticipated.length)
        return studentOnlineNotParticipated;
    };

    getStudentOffline(studentRegistered) {
        this.studentOffline =  (this.studentRegistered ? this.studentRegistered : studentRegistered ) - this.studentOnlineIds.length;
        console.log('student offline = ', this.studentOffline);
        return this.studentOffline;
    };

     getOnlineStudentIds() {
        this.studentOnlineIds =  socketService.getUserSocketData();
        console.log('student online = ', this.studentOnlineIds.length);
        //TODO not a stable number from get user socket data, why
        return this.studentOnlineIds;
    };
}

module.exports = EmojiServices;
