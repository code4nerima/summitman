var express = require('express');
let clientAdapter = require('../modules/clientAdapter') ;
let firebaseSession = require('../modules/firebase_session.js') ;
let admin = require('firebase-admin');
var router = express.Router() ;

const wrap = fn => (...args) => fn(...args).catch(args[2]) ;

router.get('/', wrap(async function(req, res, next) {
    let result = await firebaseSession.enter(req, res) ;

    if (result != 0) {
		if (result == 2) {
			res.render('verify', {});
			return ;
		}

        res.redirect('/signin');
        return ;
    }

	let currentUser = req.session.user ;

    let recv = await clientAdapter.getUserProfile(req, currentUser.uid) ;
	let data ;

	if (recv.data == null) {
		let user = null ;

		try {
			user = await admin.auth().getUser(currentUser.uid) ;
		} catch (error) {
			
		}

		data = {
			"uid": currentUser.uid,
			"name": 
				{
					"ja": user != null ? user.displayName : '',
					"ja_kana": "",
					"en": user != null ? user.displayName : '',
					"zh-TW": "",
					"zh-CN": "",
				},
			"introduction": 
				{
					"ja": "",
					"en": "",
					"zh-TW": "",
					"zh-CN": "",
				},
			"role": 0,
		} ;

		await clientAdapter.createUserProfile(req, data) ;
	} else {
		data = recv.data ;
	}

    res.render('index', {userProfile: data});		 
})) ;

router.get('/data', wrap(async function(req, res, next) {

	let currentUser = req.session.user ;

    let trackIdMap = {} ;

    {
        let recv = await clientAdapter.listTrack(req, 0, -1) ;

        for (let key in recv.data.tracks) {
            let track = recv.data.tracks[key] ;

            trackIdMap[track.trackId] = track ;
        }
    }

	let firebaseUser = null ;

	try {
		firebaseUser = await admin.auth().getUser(currentUser.uid) ;
	} catch (error) {
		
	}

    let recv = await clientAdapter.listProgram(
		req, 
		0, 
		-1, 
		currentUser.uid, 
		currentUser.uid,
		firebaseUser.email) ;

    let data = {
        lang: req.query.lang == undefined ? 'ja' : req.query.lang,
        programs: recv.data.programs,
        trackIdMap: trackIdMap,
    } ;

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
})) ;

router.get('/signout', wrap(async function(req, res, next) {
	delete req.session.errorMessage;

	await firebaseSession.signOut(req, res, () => {
		res.redirect('/') ;
	}) ;
})) ;

module.exports = router;