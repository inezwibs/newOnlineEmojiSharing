const db = require("../configs/database.js");

class InstructorServices {
    _result = {};
    constructor() {}

    async checkExistingInstructorClasses ( reqBody ) {
        let query = "SELECT * FROM emojidatabase.registrations WHERE isInstructor ="+
            1 + " AND users_id = '" + reqBody.instructorObject.id + "'" ;

        try {
            // We only pass the body object, never the req object
            const [rows,err] = await db.execute(query);
            console.log(rows);
            this._result = rows;
            if (rows === undefined || rows.length === 0) {
                return { success: true, body: [] };
            }else {
                return { success: true, body: rows };
            }
        } catch ( err ) {
            return { success: false, error: err };
        }
    }

    async getInstructorClasses(instructorId) {
        let checkExistingInstructor = "SELECT * FROM emojidatabase.registrations WHERE users_id='"+
            instructorId + "' and isInstructor=1";
        try {
            const [rows, fields] = await db.execute(checkExistingInstructor);
            if (rows.length !== 0) {
                console.log('found!');
                return rows;
            } else {
                console.log('not found');
                //new classes id would be last record in database + 1
                return 0;
            }
        } catch (e) {
            console.log("Catch an error: ", e);
            throw e.message;
        }
    }

    async getInstructorClassNames(classesArrayFromRegDatabase){
        let classesIdArr = [];
        let classNamesArr = [];
        if (classesArrayFromRegDatabase !==0 ){
            classesArrayFromRegDatabase.forEach( (obj) => {
                classesIdArr.push(obj.classes_id);
            });
            for (let i = 0 ; i<classesIdArr.length; i++){
                let getClassName = "SELECT class_name, datetime FROM emojidatabase.classes WHERE id='"+
                    classesIdArr[i] + "'";
                try {
                    const [rows, fields] = await db.execute(getClassName);
                    if (rows.length !== 0) {
                        console.log('found!');
                        classNamesArr.push(rows);
                    } else {
                        console.log('not found');
                        //new classes id would be last record in database + 1
                        return 0;
                    }
                } catch (e) {
                    console.log("Catch an error: ", e);
                    throw e.message;
                }

            }
            return classNamesArr;
        }else{
            return 0;
        }
    }


    async getClassID(reqBody) {
        let query =
            " SELECT * FROM emojidatabase.classes where class_name = '" + reqBody.className + "' and datetime = '" +
            reqBody.weekday +
            "-" +
            reqBody.startTime +
            "-" +
            reqBody.endTime +
            "'";
        // instructorObj = res.locals;
        try {
            const [rows, err] = await db.execute(query);
            return { success: true, body: rows };
        } catch (e) {
            console.log("Catch an error: ", e);
            return { success: false, body: e };
        }
    }

    parseInstructorObject(reqBody){
        if (reqBody.instructorObject.length > 0 && typeof reqBody.instructorObject == 'string'){
            reqBody.instructorObject = JSON.parse(reqBody.instructorObject);
            return reqBody.instructorObject;
        }
        return reqBody.instructorObject;
    }

    async getClassRegistrationID(reqBody, insertedClassId) {

        let query =
            " SELECT * FROM emojidatabase.registrations where classes_id = " + insertedClassId +
            " and users_id = " + reqBody.instructorObject.id;
        // instructorObj = res.locals;
        try {
            const [rows, err] = await db.execute(query);
            if (rows === undefined || rows.length === 0) {
                return { success: true, body: [] };
            }else {
                return { success: true, body: rows };
            }
        } catch (e) {
            console.log("Catch an error: ", e);
            return { success: false, body: e };
        }
    }

    async validateInstructorUser(instructorId) {
        let message;
        let query =
            " SELECT * FROM emojidatabase.users where id = '" + instructorId + "' and isInstructor = 1";

        try{
            const [rows, err ] = await db.execute(query);
            if (rows && rows.length == 0 || rows == null){
                //not an instructor
                 message = "This user is not registered as an instructor."
                return {success:false, body:{}, message:message};
                // return res.render("classLinkPage.ejs" ,{
                //     classObj: {},
                //     path : path,
                //     message: message
                // });
            }else if (rows && rows.length > 0 ){
                // instructorObj = rows[0];
                message = "Instructor found."
                return {success:true, body: rows[0], message:message};
            }
        }catch(e){
            console.log('error' , e)
            throw e.message;
        }
    }

}

module.exports = InstructorServices;
