var express = require('express');
let clientAdapter = require('../modules/clientAdapter') ;
let functions = require('../modules/functions') ;
let firebaseSession = require('../modules/firebase_session.js') ;
let admin = require('firebase-admin');
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

    if (!req.headers.referer.startsWith(process.env.ROOT_URL)) {
		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify({}));
		return ;
	}
    
    let trackIdMap = {} ;

    {
        let recv = await clientAdapter.listTrack(req, 0, -1) ;

        for (let key in recv.data.tracks) {
            let track = recv.data.tracks[key] ;

            trackIdMap[track.trackId] = track ;
        }
    }

    let recv = await clientAdapter.listProgram(req, 0, -1) ;

    let currentUser = req.session.user ;
    let currentUserProfile = (await clientAdapter.getUserProfile(req, currentUser.uid)).data ;
    let programs = [] ;

    if (currentUserProfile.role != 1) {
        for (let key in recv.data.programs) {
            if (recv.data.programs[key].category == 4) {
                continue ;
            }

            programs.push(recv.data.programs[key]) ;
        }
    } else {
        programs = recv.data.programs ;
    }

    let data = {
        lang: req.query.lang == undefined ? 'ja' : req.query.lang,
        programs: programs,
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
    let program = {
        title: {},
        description: {},
        genreIds: [],
        urls: [],
    } ;
    
    if (programId != undefined) {
        program = (await clientAdapter.getProgram(req, programId)).data ;
    }

    if (program.urls.length == 0) {
        program.urls = [{title: {}, sortOrder: 0, url: ''}] ;
    }

    {
        let user = (await clientAdapter.getUserProfile(req, uid)).data ;

        user.email = currentUser.email ;

        if (!await functions.isProgramOwner(user, program) && user.role != 1 && user.role != 3) {
            res.redirect('/') ;
            return ;
        }
    }

    if (programId != undefined) {
        program.programId = programId ;
        
        if (req.query.force == undefined) {
            let data = (await admin.firestore().collection("programEditingLock").doc(programId).get()).data() ;

            if (data != undefined && data.uid != uid) {
                let lockingUser = (await clientAdapter.getUserProfile(req, data.uid)).data ;

                res.render('programIsLocked', {
                    lockingUser: lockingUser,
                    program: program,
                    datetime: data.datetime,
                });	
                return ;
            }
        }
        
        var date = new Date();
        
        await admin.firestore().collection("programEditingLock").doc(programId).set(
            {
                datetime: date.toUTCString(),
                programId: programId,
                uid: uid
            }) ;
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

    let currentUserProfile = (await clientAdapter.getUserProfile(req, currentUser.uid)).data ;

    res.render('programEdit', {
        program: program,
        tracks: tracks,
        genres: genres,
        role: currentUserProfile.role,
    });	
})) ;

router.post('/edit', wrap(async function(req, res, next) {
    let result = await firebaseSession.enter(req, res) ;

    if (result != 0) {
        res.redirect('/signin');
        return ;
    }

    let programId = req.body.programId ;
    let program ;

    if (programId != undefined) {
        let recv = await clientAdapter.getProgram(req, programId) ;
        program = recv.data ;
    } else {
        program = {
            title: {},
            description: {}} ;
    }

    program.title["ja"] = req.body.ja_title ;
    program.title["en"] = req.body.en_title ;
    program.title["zh-TW"] = req.body['zh-TW_title'] ;
    program.title["zh-CN"] = req.body['zh-CN_title'] ;
    
    if (req.body.date != undefined) {
        program.date = req.body.date ;
        program.startTime = req.body.startTime ;
        program.endTime = req.body.endTime ;
        program.trackId = req.body.trackId ;
        program.category = req.body.category ;
        program.email = req.body.email ;
    }

    program.genreIds = req.body.genreIds == undefined ? [] : req.body.genreIds ;

    program.description["ja"] = req.body.ja_description ;
    program.description["en"] = req.body.en_description ;
    program.description["zh-TW"] = req.body['zh-TW_description'] ;
    program.description["zh-CN"] = req.body['zh-CN_description'] ;

    program.urls = [{
        title: {
            'ja': req.body.ja_linkTitle,
            'en': req.body.en_linkTitle,
            'zh-TW': req.body['zh-TW_linkTitle'],
            'zh-CN': req.body['zh-CN_linkTitle'],
        }, 
        sortOrder: 0, 
        url: req.body.linkURL,
    }] ;

    program.inputCompleted = req.body.inputCompleted != undefined ? "1" : "0" ;

    if (programId != undefined) {
        program.programId = programId ;

        clientAdapter.updateProgram(req, program) ;

        await admin.firestore().collection("programEditingLock").doc(programId).delete() ;
        
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

    let isProgramOwner = await functions.isProgramOwner(user, program) ;

    let currentUserProfile = (await clientAdapter.getUserProfile(req, currentUser.uid)).data ;

    res.render('programView', {
        program: program,
        trackIdMap: trackIdMap,
        isProgramOwner: isProgramOwner,
        role: currentUserProfile.role,
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