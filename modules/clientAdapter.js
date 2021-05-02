let fetch = require("node-fetch") ;
let admin = require('firebase-admin');

class clientAdapter {

    _URL = "https://webapi20210430062843.azurewebsites.net/api/" ;

    // operating user profile.
    async createUserProfile(req, data) {
        let currentUser = req.session.user ;
        let URL = this._URL + "CreateUserProfile" ;

        if (process.env.USE_FIREBASE) {
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

        if (process.env.USE_FIREBASE) {
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

        if (process.env.USE_FIREBASE) {
            let snapshot = await admin.firestore().collection("users").where("role", "<=", role).get() ;

            let users = [] ;

            for (let key in snapshot.docs) {
                users.push(snapshot.docs[key].data()) ;
            }

            return {result: 1, data: users} ;
        } else {
            return await this.internalFetch(URL, currentUser.uid, data) ;
        }
    }

    async updateUserProfile(req, data) {
        let currentUser = req.session.user ;
        let URL = this._URL + "UpdateUserProfile" ;

        if (process.env.USE_FIREBASE) {
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

        return await this.internalFetch(URL, currentUser.uid, data) ;
    }

    async getProgram(req, programId) {
        let currentUser = req.session.user ;
        let URL = this._URL + "GetProgram" ;

        let data = {
            programId: programId,
        } ;

        return await this.internalFetch(URL, currentUser.uid, data) ;
    }

    async listProgram(req, start, limit) {
        let currentUser = req.session.user ;
        let URL = this._URL + "GetProgram" ;

        let data = {
            start: start,
            limit: limit,
        } ;

        return await this.internalFetch(URL, currentUser.uid, data) ;
    }

    async updateProgram(req, data) {
        let currentUser = req.session.user ;
        let URL = this._URL + "UpdateProgram" ;

        return this.internalFetch(URL, currentUser.uid, data) ;
    }

    async deleteProgram(req, programId) {
        let currentUser = req.session.user ;
        let URL = this._URL + "DeleteProgram" ;

        let data = {
            programId: programId,
        } ;

        return await this.internalFetch(URL, currentUser.uid, data) ;
    }

    async internalFetch(URL, uid, data) {
        let param = {
            method: "POST",
            headers: {"Authorization": process.env.SUMMITMAN_API_KEY,
            "Content-Type": "application/json"},
            body: JSON.stringify({v: process.env.SUMMITMAN_API_VERSION, uid: uid, data: data})
        } ;

        console.log(param) ;

        let res ;

        try {
            res = await fetch(URL, param)
            .then(response => response.json()) ;
        } catch (e) {
            return {result: 0, data: {}} ;
        }

        return res ;
    }
}

module.exports =  new clientAdapter;