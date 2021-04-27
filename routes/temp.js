var express = require('express');
let admin = require('firebase-admin');
let firebaseSession = require('../modules/firebase_session.js') ;
var router = express.Router() ;

const wrap = fn => (...args) => fn(...args).catch(args[2]) ;

router.get('/', wrap(async function(req, res, next) {
    let result = await firebaseSession.enter(req, res) ;

    if (result != 0) {
        res.redirect('/signin');
        return ;
    }

    res.render('temp', {
        email: user.email,
        data: data,
        errorMessage: '',
    });		 
})) ;

module.exports = router;