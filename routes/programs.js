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

    let currentUser = req.session.user ;
    let currentUserProfile = (await clientAdapter.getUserProfile(req, currentUser.uid)).data ;

    res.render('programs', {
        editable: currentUserProfile.role == 1 ? true : false,
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

    let programId = req.query.programId ;

    let currentUser = req.session.user ;
    let uid = currentUser.uid ;
    
    {
        let user = (await clientAdapter.getUserProfile(req, uid)).data ;
        let program = (await clientAdapter.getProgram(req, programId)).data ;

        user.email = currentUser.email ;

        if (!await functions.isAccessAvailableToProgram(user, program)) {
            res.redirect('/') ;
            return ;
        }
    }

    let program = {
        title: {},
        description: {},
        genreIds: [],
    } ;

    if (programId != undefined) {
        let recv = await clientAdapter.getProgram(req, programId) ;
        
        program = recv.data ;
        program.programId = programId ;
    }

    let tracks = [] ;
    let genres = [] ;
    
    {
        let recv = await clientAdapter.listTrack(req, 0, -1) ;
        tracks = recv.data.tracks ;
    }

    {
        let recv = await clientAdapter.listGenre(req, 0, -1) ;
        genres = recv.data.genres ;
    }

    res.render('programEdit', {
        program: program,
        tracks: tracks,
        genres: genres,
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
        genreIds: req.body.genreIds,
        description: {
            "ja": req.body.ja_description,
            "en": req.body.en_description,
            "zh-TW": req.body['zh-TW_description'],
            "zh-CN": req.body['zh-CN_description'],
        },
        email: req.body.email,
    } ;

    if (req.body.programId != undefined) {
        program.programId = req.body.programId ;

        clientAdapter.updateProgram(req, program) ;
        res.redirect('/programs/view?programId=' + program.programId);
    } else {
        clientAdapter.createProgram(req, program) ;
        res.redirect('/programs');
    }

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

    let genreIdMap = {} ;

    {
        let recv = await clientAdapter.listGenre(req, 0, -1) ;

        for (let key in recv.data.genres) {
            let genre = recv.data.genres[key] ;

            genreIdMap[genre.genreId] = genre ;
        }
    }

    program.genreName = {
        "ja": "",
        "en": "",
        "zh-TW": "",
        "zh-CN": "",
    } ;

    for (let key in program.genreIds) {
        let genreId = program.genreIds[key] ;
        let genre = genreIdMap[genreId] ;

        program.genreName["ja"] += genre.name["ja"] + ", " ;
        program.genreName["en"] += genre.name["en"] + ", " ;
        program.genreName["zh-TW"] += genre.name["zh-TW"] + ", " ;
        program.genreName["zh-CN"] += genre.name["zh-CN"] + ", " ;
    }

    program.genreName["ja"] = program.genreName["ja"].trim() ;
    program.genreName["en"] = program.genreName["en"].trim() ;
    program.genreName["zh-TW"] = program.genreName["zh-TW"].trim() ;
    program.genreName["zh-CN"] = program.genreName["zh-CN"].trim() ;

    let currentUser = req.session.user ;
    let uid = currentUser.uid ;
    
    let user = (await clientAdapter.getUserProfile(req, uid)).data ;

    user.email = currentUser.email ;

    let editable = await functions.isAccessAvailableToProgram(user, program) ;

    res.render('programView', {
        program: program,
        trackIdMap: trackIdMap,
        editable: editable,
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