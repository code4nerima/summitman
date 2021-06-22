var express = require('express');
let clientAdapter = require('../modules/clientAdapter') ;
let firebaseSession = require('../modules/firebase_session.js') ;
var router = express.Router() ;

const wrap = fn => (...args) => fn(...args).catch(args[2]) ;

router.get('/', wrap(async function(req, res, next) {
    let result = await firebaseSession.enter(req, res) ;

    if (result != 0) {
        res.redirect('/signin');
        return ;
    }

    res.render('programMembers', {programId: req.query.programId});		 
})) ;

router.get('/data', wrap(async function(req, res, next) {

    let members ;
    let userProfiles ;

    {
        let recv = await clientAdapter.getProgramMembers(req, req.query.programId) ;

        members = recv.data.members ;
    }

    {
        let recv = await clientAdapter.listUserProfile(req, 0, -1) ;

        userProfiles = recv.data.userProfiles ;
    }

    let data = {
        members: members ,
        userProfiles: userProfiles,
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

        uids.push(member.uid) ;
    }

    uids.push(req.query.uid) ;

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

        if (req.query.uid != owner.uid) {
            uids.push(member.uid) ;
        }
    }

    await clientAdapter.updateProgramOwners(req, req.query.programId, uids) ;
 
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({}));
})) ;

module.exports = router;