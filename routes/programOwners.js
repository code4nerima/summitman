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

    res.render('programOwners', {programId: req.query.programId});		 
})) ;

router.get('/data', wrap(async function(req, res, next) {

    let owners ;
    let userProfiles ;

    {
        let recv = await clientAdapter.getProgramOwners(req, req.query.programId) ;

        owners = recv.data.owners ;
    }

    {
        let recv = await clientAdapter.listUserProfile(req, 0, -1, 2) ;

        userProfiles = recv.data.userProfiles ;
    }

    let data = {
        owners: owners ,
        userProfiles: userProfiles,
    } ;

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
})) ;

router.get('/add', wrap(async function(req, res, next) {
    let owners ;

    {
        let recv = await clientAdapter.getProgramOwners(req, req.query.programId) ;

        owners = recv.data.owners ;
    }

    let uids = [] ;

    for (let key in owners) {
        let owner = owners[key] ;

        uids.push(owner.uid) ;
    }

    uids.push(req.query.uid) ;

    await clientAdapter.updateProgramOwners(req, req.query.programId, uids) ;

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({}));
})) ;

router.get('/remove', wrap(async function(req, res, next) {
    let owners ;

    {
        let recv = await clientAdapter.getProgramOwners(req, req.query.programId) ;

        owners = recv.data.owners ;
    }

    let uids = [] ;

    for (let key in owners) {
        let owner = owners[key] ;

        if (req.query.uid != owner.uid) {
            uids.push(owner.uid) ;
        }
    }

    await clientAdapter.updateProgramOwners(req, req.query.programId, uids) ;
 
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({}));
})) ;

module.exports = router;