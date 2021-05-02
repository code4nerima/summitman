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

    let recv = await clientAdapter.listUserProfile(req, 0, -1, 2) ;

    res.render('users', {users: recv.data});		 
})) ;

router.get('/user', wrap(async function(req, res, next) {
    let result = await firebaseSession.enter(req, res) ;

    if (result != 0) {
        res.redirect('/signin');
        return ;
    }

    let currentUser = req.session.user ;

    let currentUserProfile = (await clientAdapter.getUserProfile(req, currentUser.uid)).data ;

    let recv = await clientAdapter.getUserProfile(req, req.query.uid) ;

    res.render('user', {
        user: recv.data,
        editable: currentUserProfile.role == 2 ? true : false,
    });	
})) ;

module.exports = router;