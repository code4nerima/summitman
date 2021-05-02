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
    let adminAccess = false ;
    let data = null ;

    if (req.query.uid != undefined) {
        let recv = await clientAdapter.getUserProfile(req, currentUser.uid) ;

        if (recv.result == 1) {
            data = recv.data ;

            if (data.role == 2) {
                let recv = await clientAdapter.getUserProfile(req, req.query.uid) ;

                if (recv.result == 1) {
                    data = recv.data ;
                    adminAccess = true ;
                }
            }
        }
    } else {
        let recv = await clientAdapter.getUserProfile(req, currentUser.uid) ;

        if (recv.result == 1) {
            data = recv.data ;
        }
    }

    if (data != null) {
        res.render('profile', {
            data: data,
            adminAccess: adminAccess,
        });		 
    } else {
        res.redirect("/") ; 
    }
})) ;

router.post('/', wrap(async function(req, res, next) {
    let result = await firebaseSession.enter(req, res) ;

    if (result != 0) {
        res.redirect('/signin');
        return ;
    }

    let uid = req.body.uid ;

    let data ;

    {
        let recv = await clientAdapter.getUserProfile(req, uid) ;

        if (recv.result == 1) {
            data = recv.data ;
        } else {
            data = {} ;
        }

        data.name['ja'] = req.body.ja_name ;
        data.name['ja_kana'] = req.body.ja_name_kana ;
        data.name['en'] = req.body.en_name ;
        data.name['zh-TW'] = req.body["zh-TW_name"] ;
        data.name['h-CN'] = req.body["zh-CN_name"] ;
    }

    if (req.body.role != undefined) {
        data.role = Number(req.body.role) ;
    }

    let recv = await clientAdapter.updateUserProfile(req, data) ;

    if (recv.result == 1) {
        if (req.body.adminAccess) {
            res.redirect('/users');
        } else {
            res.redirect('/');
        }
    } else {
        res.redirect('/profile');
    }
})) ;

module.exports = router;