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

    res.render('tracks', {
        role: currentUserProfile.role,
    });		 
})) ;

router.get('/data', wrap(async function(req, res, next) {
 
    let recv = await clientAdapter.listTrack(req, 0, -1) ;

    let data = {
        lang: req.query.lang == undefined ? 'ja' : req.query.lang,
        tracks: recv.data.tracks
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

    let currentUser = req.session.user ;
    let currentUserProfile = (await clientAdapter.getUserProfile(req, currentUser.uid)).data ;

    if (currentUserProfile.role != 1) {
        res.redirect('/');
        return ;
    }

    let track = {
        name: {},
    } ;

    if (req.query.trackId != undefined) {
        let recv = await clientAdapter.getTrack(req, req.query.trackId) ;
        
        track = recv.data ;
        track.trackId = req.query.trackId ;
    }

    res.render('trackEdit', {
        track: track,
    });	
})) ;

router.post('/edit', wrap(async function(req, res, next) {
    let result = await firebaseSession.enter(req, res) ;

    if (result != 0) {
        res.redirect('/signin');
        return ;
    }

    let track = {
        name: {
            "ja": req.body.ja_name,
            "en": req.body.en_name,
            "zh-TW": req.body['zh-TW_name'],
            "zh-CN": req.body['zh-CN_name'],
        },
        meetingURL: req.body.meetingURL,
        meetingId: req.body.meetingId,
        meetingPasscode: req.body.meetingPasscode,
        streamURL: req.body.streamURL,
        streamKey: req.body.streamKey,
        broadcastingURL: req.body.broadcastingURL,
        station: req.body.station,
    } ;

    console.log(track) ;

    if (req.body.trackId != undefined) {
        track.trackId = req.body.trackId ;

        clientAdapter.updateTrack(req, track) ;
        res.redirect('/tracks/view?trackId=' + req.body.trackId);
    } else {
        clientAdapter.createTrack(req, track) ;
        res.redirect('/tracks');
    }
})) ;

router.get('/view', wrap(async function(req, res, next) {
    let result = await firebaseSession.enter(req, res) ;

    if (result != 0) {
        res.redirect('/signin');
        return ;
    }

    let track = null ;

    if (req.query.trackId != undefined) {
        let recv = await clientAdapter.getTrack(req, req.query.trackId) ;
        
        track = recv.data ;
        track.trackId = req.query.trackId ;
    }

    if (track == null) {
        res.redirect("/tracks") ;
    }

    let currentUser = req.session.user ;

    let currentUserProfile = (await clientAdapter.getUserProfile(req, currentUser.uid)).data ;

    res.render('trackView', {
        track: track,
        role: currentUserProfile.role,
    });	
})) ;

router.get('/delete', wrap(async function(req, res, next) {
    let result = await firebaseSession.enter(req, res) ;

    if (result != 0) {
        res.redirect('/signin');
        return ;
    }

    await clientAdapter.deleteTrack(req, req.query.trackId) ;

    res.redirect("/tracks") ;
})) ;

module.exports = router;