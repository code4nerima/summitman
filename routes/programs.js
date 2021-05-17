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

    let currentUser = req.session.user ;
    let currentUserProfile = (await clientAdapter.getUserProfile(req, currentUser.uid)).data ;

    res.render('programs', {
        editable: currentUserProfile.role == 2 ? true : false,
    });		 
})) ;

router.get('/data', wrap(async function(req, res, next) {

    let trackIdMap = {} ;

    {
        let recv = await clientAdapter.listTrack(req, 0, -1) ;

        for (let key in recv.data.tracks) {
            let track = recv.data.tracks[key] ;

            trackIdMap[track.trackId] = track ;
        }
    }

    let recv = await clientAdapter.listProgram(req, 0, -1) ;

    let data = {
        lang: req.query.lang == undefined ? 'ja' : req.query.lang,
        programs: recv.data.programs,
        trackIdMap: trackIdMap,
    } ;

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
})) ;

router.get('/edit', wrap(async function(req, res, next) {
    let result = await firebaseSession.enter(req, res) ;

    if (result != 0) {
        res.redirect('/signin');
        return ;
    }

    let program = {
        title: {},
        description: {}
    } ;

    if (req.query.programId != undefined) {
        let recv = await clientAdapter.getProgram(req, req.query.programId) ;
        
        program = recv.data ;
        program.programId = req.query.programId ;
    }

    let recv = await clientAdapter.listTrack(req, 0, -1) ;

    res.render('programEdit', {
        program: program,
        tracks: recv.data.tracks,
    });	
})) ;

router.post('/edit', wrap(async function(req, res, next) {
    let result = await firebaseSession.enter(req, res) ;

    if (result != 0) {
        res.redirect('/signin');
        return ;
    }

    let program = {
        title: {
            "ja": req.body.ja_title,
            "en": req.body.en_title,
            "zh-TW": req.body['zh-TW_title'],
            "zh-CN": req.body['zh-CN_title'],
        },
        date: req.body.date,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        trackId: req.body.trackId,
        category: req.body.category,
        description: {
            "ja": req.body.ja_description,
            "en": req.body.en_description,
            "zh-TW": req.body['zh-TW_description'],
            "zh-CN": req.body['zh-CN_description'],
        },
    } ;

    if (req.body.programId != undefined) {
        program.programId = req.body.programId ;

        clientAdapter.updateProgram(req, program) ;
    } else {
        clientAdapter.createProgram(req, program) ;
    }

    res.redirect('/programs');
})) ;

router.get('/view', wrap(async function(req, res, next) {
    let result = await firebaseSession.enter(req, res) ;

    if (result != 0) {
        res.redirect('/signin');
        return ;
    }

    let program = null ;

    if (req.query.programId != undefined) {
        let recv = await clientAdapter.getProgram(req, req.query.programId) ;
        
        program = recv.data ;
        program.programId = req.query.programId ;
    }

    if (program == null) {
        res.redirect("/programs") ;
    }

    let trackIdMap = {} ;

    {
        let recv = await clientAdapter.listTrack(req, 0, -1) ;

        for (let key in recv.data.tracks) {
            let track = recv.data.tracks[key] ;

            trackIdMap[track.trackId] = track ;
        }
    }

    program.trackName = trackIdMap[program.trackId].name ;

    let currentUser = req.session.user ;

    let currentUserProfile = (await clientAdapter.getUserProfile(req, currentUser.uid)).data ;

    res.render('programView', {
        program: program,
        trackIdMap: trackIdMap,
        editable: currentUserProfile.role >= 1 ? true : false,
    });	
})) ;

router.get('/delete', wrap(async function(req, res, next) {
    let result = await firebaseSession.enter(req, res) ;

    if (result != 0) {
        res.redirect('/signin');
        return ;
    }

    await clientAdapter.deleteProgram(req, req.query.programId) ;

    res.redirect("/programs") ;
})) ;

module.exports = router;