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

    async listProgram(req, start, limit) {
        let currentUser = req.session.user ;
        let URL = this._URL + "ListProgram" ;

        let data = {
            start: start,
            limit: limit,
        } ;

        return await this.internalFetch(URL, currentUser.uid, data) ;
    }

    async listRelatedProgram(req, programOwnerUid, programMemberUid, submittedEmail) {
        let currentUser = req.session.user ;
        let URL = this._URL + "ListRelatedProgram" ;

        let data = {
        } ;

        if (programOwnerUid != '') {
            data['programOwnerUid'] = programOwnerUid ;
        }

        if (programMemberUid != '') {
            data['programMemberUid'] = programMemberUid ;
        }

        if (submittedEmail != undefined && submittedEmail != "") {
            data['submittedEmail'] = submittedEmail ;
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

    // operating genre
    async createGenre(req, data) {
        let currentUser = req.session.user ;
        let URL = this._URL + "CreateGenre" ;

        return await this.internalFetch(URL, currentUser.uid, data) ;
    }

    async getGenre(req, genreId) {
        let currentUser = req.session.user ;
        let URL = this._URL + "GetGenre" ;

        let data = {
            genreId: genreId,
        } ;

        return await this.internalFetch(URL, currentUser.uid, data) ;
    }

    async listGenre(req, start, limit) {
        let currentUser = req.session.user ;
        let URL = this._URL + "ListGenre" ;

        let data = {
            start: start,
            limit: limit,
        } ;

        return await this.internalFetch(URL, currentUser.uid, data) ;
    }

    async updateGenre(req, data) {
        let currentUser = req.session.user ;
        let URL = this._URL + "UpdateGenre" ;

        return await this.internalFetch(URL, currentUser.uid, data) ;
    }

    async deleteGenre(req, genreId) {
        let currentUser = req.session.user ;
        let URL = this._URL + "DeleteGenre" ;

        let data = {
            genreId: genreId,
        } ;

        return await this.internalFetch(URL, currentUser.uid, data) ;
    }

    // operating presenter
    async createPresenter(req, programId, data) {
        let currentUser = req.session.user ;
        let URL = this._URL + "CreatePresenter" ;

        data.programId = programId ;

        return await this.internalFetch(URL, currentUser.uid, data) ;
    }

    async getPresenter(req, programId, presenterId) {
        let currentUser = req.session.user ;
        let URL = this._URL + "GetPresenter" ;

        let data = {
            programId: programId,
            presenterId: presenterId,
        } ;

        return await this.internalFetch(URL, currentUser.uid, data) ;
    }

    async listPresenter(req, programId, start, limit) {
        let currentUser = req.session.user ;
        let URL = this._URL + "ListPresenter" ;

        let data = {
            programId: programId,
            start: start,
            limit: limit,
        } ;

        return await this.internalFetch(URL, currentUser.uid, data) ;
    }

    async updatePresenter(req, programId, data) {
        let currentUser = req.session.user ;
        let URL = this._URL + "UpdatePresenter" ;

        data.programId = programId ;
        
        return await this.internalFetch(URL, currentUser.uid, data) ;
    }

    async deletePresenter(req, programId, presenterId) {
        let currentUser = req.session.user ;
        let URL = this._URL + "DeletePresenter" ;

        let data = {
            programId: programId,
            presenterId: presenterId,
        } ;

        return await this.internalFetch(URL, currentUser.uid, data) ;
    }

    // operating grareco
    async createGrareco(req, programId, data) {
        let currentUser = req.session.user ;
        let URL = this._URL + "CreateGrareco" ;

        data.programId = programId ;

        return await this.internalFetch(URL, currentUser.uid, data) ;
    }

    async getGrareco(req, programId, grarecoId) {
        let currentUser = req.session.user ;
        let URL = this._URL + "GetGrareco" ;

        let data = {
            programId: programId,
            grarecoId: grarecoId,
        } ;

        return await this.internalFetch(URL, currentUser.uid, data) ;
    }

    async listGrareco(req, programId, start, limit) {
        let currentUser = req.session.user ;
        let URL = this._URL + "ListGrareco" ;

        let data = {
            programId: programId,
            start: start,
            limit: limit,
        } ;

        return await this.internalFetch(URL, currentUser.uid, data) ;
    }

    async updateGrareco(req, programId, data) {
        let currentUser = req.session.user ;
        let URL = this._URL + "UpdateGrareco" ;

        data.programId = programId ;
        
        return await this.internalFetch(URL, currentUser.uid, data) ;
    }

    async deleteGrareco(req, programId, grarecoId) {
        let currentUser = req.session.user ;
        let URL = this._URL + "DeleteGrareco" ;

        let data = {
            programId: programId,
            grarecoId: grarecoId,
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