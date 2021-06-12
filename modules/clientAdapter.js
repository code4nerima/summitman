let fetch = require("node-fetch") ;
let admin = require('firebase-admin');
let uuid = require('node-uuid')

class clientAdapter {

    _URL = "https://webapi20210430062843.azurewebsites.net/api/" ;

    // operating user profile.
    async createUserProfile(req, data) {
        let currentUser = req.session.user ;
        let URL = this._URL + "CreateUserProfile" ;

        return await this.internalFetch(URL, currentUser.uid, data) ;
    }

    async getUserProfile(req, targetUid) {
        let currentUser = req.session.user ;
        let URL = this._URL + "GetUserProfile" ;

        let data = {
            uid: targetUid,
        } ;

        return await this.internalFetch(URL, currentUser.uid, data) ;
    }

    async listUserProfile(req, start, limit) {
        let currentUser = req.session.user ;
        let URL = this._URL + "ListUserProfile" ;

        let data = {
            start: start,
            limit: limit,
            roles: [0, 1, 2, 3],
        } ;

        return await this.internalFetch(URL, currentUser.uid, data) ;
    }

    async updateUserProfile(req, data) {
        let currentUser = req.session.user ;
        let URL = this._URL + "UpdateUserProfile" ;

        return await this.internalFetch(URL, currentUser.uid, data) ;
    }

    // operating program.
    async createProgram(req, data) {
        let currentUser = req.session.user ;
        let URL = this._URL + "CreateProgram" ;

        data.category = Number(data.category) ;

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

    async listProgram(req, start, limit, programOwnerUid, programMemberUid) {
        let currentUser = req.session.user ;
        let URL = this._URL + "ListProgram" ;

        let data = {
            start: start,
            limit: limit,
        } ;

        if (programOwnerUid != '') {
            data['programOwnerUid'] = programOwnerUid ;
        }

        if (programMemberUid != '') {
            data['programMemberUid'] = programMemberUid ;
        }

        return await this.internalFetch(URL, currentUser.uid, data) ;
    }

    async updateProgram(req, data) {
        let currentUser = req.session.user ;
        let URL = this._URL + "UpdateProgram" ;

        data.category = Number(data.category) ;

        return await this.internalFetch(URL, currentUser.uid, data) ;
    }

    async deleteProgram(req, programId) {
        let currentUser = req.session.user ;
        let URL = this._URL + "DeleteProgram" ;

        let data = {
            programId: programId,
        } ;

        return await this.internalFetch(URL, currentUser.uid, data) ;
    }

    // operating track.
    async createTrack(req, data) {
        let currentUser = req.session.user ;
        let URL = this._URL + "CreateTrack" ;

        return await this.internalFetch(URL, currentUser.uid, data) ;
    }

    async getTrack(req, trackId) {
        let currentUser = req.session.user ;
        let URL = this._URL + "GetTrack" ;

        let data = {
            trackId: trackId,
        } ;

        return await this.internalFetch(URL, currentUser.uid, data) ;
    }

    async listTrack(req, start, limit) {
        let currentUser = req.session.user ;
        let URL = this._URL + "ListTrack" ;

        let data = {
            start: start,
            limit: limit,
        } ;

        return await this.internalFetch(URL, currentUser.uid, data) ;
    }

    async updateTrack(req, data) {
        let currentUser = req.session.user ;
        let URL = this._URL + "UpdateTrack" ;

        return await this.internalFetch(URL, currentUser.uid, data) ;
    }

    async deleteTrack(req, trackId) {
        let currentUser = req.session.user ;
        let URL = this._URL + "DeleteTrack" ;

        let data = {
            trackId: trackId,
        } ;

        return await this.internalFetch(URL, currentUser.uid, data) ;
    }
 
    async updateProgramOwners(req, programId, owners) {
        let currentUser = req.session.user ;
        let URL = this._URL + "UpdateProgramOwners" ;

        let data = {
            programId: programId,
            owners: owners
        } ;

        return await this.internalFetch(URL, currentUser.uid, data) ;
    }

    async getProgramOwners(req, programId) {
        let currentUser = req.session.user ;
        let URL = this._URL + "GetProgramOwners" ;

        let data = {
            programId: programId,
        } ;

        return await this.internalFetch(URL, currentUser.uid, data) ;
    }

    async updateProgramMembers(req, programId, members) {
        let currentUser = req.session.user ;
        let URL = this._URL + "UpdateProgramMembers" ;

        let data = {
            programId: programId,
            members: members,
        } ;

        return await this.internalFetch(URL, currentUser.uid, data) ;
    }

    async getProgramMembers(req, programId) {
        let currentUser = req.session.user ;
        let URL = this._URL + "GetProgramMembers" ;

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