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

    if (!await functions.isAccessAvalableToProgram(req, programId)) {
        res.redirect('/') ;
        return ;
    }

    res.render('graphigRecordings', {programId: programId});		 
})) ;

module.exports = router;