var express = require('express');
let clientAdapter = require('../modules/clientAdapter') ;
let functions = require('../modules/functions') ;
let firebaseSession = require('../modules/firebase_session.js') ;
var router = express.Router() ;

const wrap = fn => (...args) => fn(...args).catch(args[2]) ;

router.get('/', wrap(async function(req, res, next) {
    let result = await firebaseSession.enter(req, res) ;

    if (result != 0) {
        res.redirect('/signin');
        return ;
    }

    let programId = req.query.programId ;

    let currentUser = req.session.user ;
    let uid = currentUser.uid ;
    
    let user = (await clientAdapter.getUserProfile(req, uid)).data ;
    let program = (await clientAdapter.getProgram(req, programId)).data ;

    user.email = currentUser.email ;
    
    if (!await functions.isProgramOwner(user, program) && user.role != 1) {
        res.redirect('/') ;
        return ;
    }

    res.render('programMembers', {program: program});		 
})) ;

router.get('/users', wrap(async function(req, res, next) {

    if (!req.headers.referer.startsWith(process.env.ROOT_URL)) {
		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify({}));
		return ;
	}
    
    let userProfiles ;

    {
        let recv = await clientAdapter.listUserProfile(req, 0, -1) ;

        userProfiles = recv.data.userProfiles ;
    }

    let data = {
        userProfiles: userProfiles,
    } ;

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
})) ;

router.get('/data', wrap(async function(req, res, next) {

    if (!req.headers.referer.startsWith(process.env.ROOT_URL)) {
		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify({}));
		return ;
	}
    
    let members ;

    {
        let recv = await clientAdapter.getProgramMembers(req, req.query.programId) ;

        members = recv.data.members ;
    }

    let data = {
        members: members ,
    } ;

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
})) ;

router.get('/add', wrap(async function(req, res, next) {
    let members ;

    {
        let recv = await clientAdapter.getProgramMembers(req, req.query.programId) ;

        members = recv.data.members ;
    }

    let uids = [] ;

    for (let key in members) {
        let member = members[key] ;

        uids.push({uid: member.uid, staffRole: member.staffRole}) ;
    }

    uids.push({uid: req.query.uid, staffRole: 0}) ;

    await clientAdapter.updateProgramMembers(req, req.query.programId, uids) ;

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({}));
})) ;

router.get('/changeStaffRole', wrap(async function(req, res, next) {
    let members ;

    {
        let recv = await clientAdapter.getProgramMembers(req, req.query.programId) ;

        members = recv.data.members ;
    }

    let uids = [] ;

    for (let key in members) {
        let member = members[key] ;

        if (req.query.uid != member.uid) {
            uids.push({uid: member.uid, staffRole: member.staffRole}) ;
        }
    }

    uids.push({uid: req.query.uid, staffRole: req.query.staffRole}) ;

    await clientAdapter.updateProgramMembers(req, req.query.programId, uids) ;

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({}));
})) ;

router.get('/remove', wrap(async function(req, res, next) {
    let members ;

    {
        let recv = await clientAdapter.getProgramMembers(req, req.query.programId) ;

        members = recv.data.members ;
    }

    let uids = [] ;

    for (let key in members) {
        let member = members[key] ;

        if (req.query.uid != member.uid) {
            uids.push({uid: member.uid, staffRole: member.staffRole}) ;
        }
    }

    await clientAdapter.updateProgramMembers(req, req.query.programId, uids) ;
 
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({}));
})) ;

module.exports = router;