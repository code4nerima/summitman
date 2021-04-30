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

    let recv = await clientAdapter.getUserProfile(req, currentUser.uid) ;

    let data ;

    if (recv.result == 1) {
        data = recv.data ;
    } else {
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
    }

    res.render('profile', {data: data});		 
})) ;

router.post('/', wrap(async function(req, res, next) {
    let result = await firebaseSession.enter(req, res) ;

    if (result != 0) {
        res.redirect('/signin');
        return ;
    }

    let currentUser = req.session.user ;

    let data = {
        "uid": currentUser.uid,
        "name": 
            {
                "ja": req.body.ja_name,
                "en": req.body.en_name,
                "zh-TW": req.body["zh-TW_name"],
                "zh-CN": req.body["zh-CN_name"],
            },
        "role": 0,
    } ;

    let recv = await clientAdapter.updateUserProfile(req, data) ;

    if (recv.result == 1) {
        res.redirect('/');
    } else {
        res.redirect('/profile');
    }
})) ;

module.exports = router;