let fetch = require("node-fetch") ;
let admin = require('firebase-admin');
let uuid = require('node-uuid')

class clientAdapter {

    _URL = "https://webapi20210430062843.azurewebsites.net/api/" ;

    // operating user profile.
    async createUserProfile(req, data) {
        let currentUser = req.session.user ;
        let URL = this._URL + "CreateUserProfile" ;

        if (false) {
            await admin.firestore().collection("users").doc(data.uid).set(data) ;
            
            return {result: 1} ;
        } else {
            return await this.internalFetch(URL, currentUser.uid, data) ;
        }
    }

    async getUserProfile(req, targetUid) {
        let currentUser = req.session.user ;
        let URL = this._URL + "GetUserProfile" ;

        let data = {
            uid: targetUid,
        } ;

        if (false) {
            let resultData = (await admin.firestore().collection("users").doc(data.uid).get()).data() ;

            if (resultData != null) {
                return {result: 1, data: resultData} ;
            } else {
                return {result: 0} ;
            }
        } else {
            return await this.internalFetch(URL, currentUser.uid, data) ;
        }
    }

    async listUserProfile(req, start, limit, role) {
        let currentUser = req.session.user ;
        let URL = this._URL + "ListUserProfile" ;

        let data = {
            start: start,
            limit: limit,
            role: role,
        } ;

        if (false) {
            let snapshot = await admin.firestore().collection("users").where("role", "<=", role).get() ;

            let users = [] ;

            for (let key in snapshot.docs) {
                users.push(snapshot.docs[key].data()) ;
            }

            return {result: 1, data: {totalCount: users.length, userProfiles: users}} ;
        } else {
            return await this.internalFetch(URL, currentUser.uid, data) ;
        }
    }

    async updateUserProfile(req, data) {
        let currentUser = req.session.user ;
        let URL = this._URL + "UpdateUserProfile" ;

        if (false) {
            await admin.firestore().collection("users").doc(data.uid).update(data) ;

            return {result: 1} ;
        } else {
            return await this.internalFetch(URL, currentUser.uid, data) ;
        }
    }

    // operating program.
    async createProgram(req, data) {
        let currentUser = req.session.user ;
        let URL = this._URL + "CreateProgram" ;

        if (false) {
            data.programId = uuid.v4() ;
            await admin.firestore().collection("programs").doc(data.programId).set(data) ;

            return {result: 1} ;
        } else {
            data.category = Number(data.category) ;

            return await this.internalFetch(URL, currentUser.uid, data) ;
        }
    }

    async getProgram(req, programId) {
        let currentUser = req.session.user ;
        let URL = this._URL + "GetProgram" ;

        let data = {
            programId: programId,
        } ;

        if (false) {
            let resultData = (await admin.firestore().collection("programs").doc(data.programId).get()).data() ;

            if (resultData != null) {
                return {result: 1, data: resultData} ;
            } else {
                return {result: 0} ;
            }
        } else {
            return await this.internalFetch(URL, currentUser.uid, data) ;
        }    
    }

    async listProgram(req, start, limit) {
        let currentUser = req.session.user ;
        let URL = this._URL + "ListProgram" ;

        let data = {
            start: start,
            limit: limit,
        } ;

        if (false) {
            let snapshot = await admin.firestore().collection("programs").get() ;

            let programs = [] ;

            for (let key in snapshot.docs) {
                programs.push(snapshot.docs[key].data()) ;
            }

            return {result: 1, data: {totalCount: programs.length, programs: programs}} ;
        } else {
            return await this.internalFetch(URL, currentUser.uid, data) ;
        }
    }

    async updateProgram(req, data) {
        let currentUser = req.session.user ;
        let URL = this._URL + "UpdateProgram" ;

        if (false) {
            await admin.firestore().collection("programs").doc(data.programId).update(data) ;

            return {result: 1} ;
        } else {
            data.category = Number(data.category) ;

            return await this.internalFetch(URL, currentUser.uid, data) ;
        }
    }

    async deleteProgram(req, programId) {
        let currentUser = req.session.user ;
        let URL = this._URL + "DeleteProgram" ;

        let data = {
            programId: programId,
        } ;

        if (false) {
            await admin.firestore().collection("programs").doc(data.programId).delete() ;

            return {result: 1} ;
        } else {
            return await this.internalFetch(URL, currentUser.uid, data) ;
        }
    }
 
    async internalFetch(URL, uid, data) {
        let param = {
            method: "POST",
            headers: {"Authorization": process.env.SUMMITMAN_API_KEY,
            "Content-Type": "application/json"},
            body: JSON.stringify({v: process.env.SUMMITMAN_API_VERSION, uid: uid, data: data})
        } ;

        let res ;

        try {
            res = await fetch(URL, param)
            .then(response => response.json()) ;
        } catch (e) {
            res = {result: 0, data: {}} ;
        }

        console.log(res) ;

        return res ;
    }
}

module.exports =  new clientAdapter;