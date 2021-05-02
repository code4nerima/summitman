var express = require('express');
let clientAdapter = require('../modules/clientAdapter') ;
let firebaseSession = require('../modules/firebase_session.js') ;
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

	if (recv.result != 1) {
		data = {
			"uid": currentUser.uid,
			"name": 
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

router.get('/signout', wrap(async function(req, res, next) {
	delete req.session.errorMessage;

	await firebaseSession.signOut(req, res, () => {
		res.redirect('/') ;
	}) ;
})) ;

module.exports = router;