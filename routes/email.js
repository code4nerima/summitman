var express = require('express');
let clientAdapter = require('../modules/clientAdapter') ;
let firebaseSession = require('../modules/firebase_session.js') ;
let functions = require('../modules/functions') ;
var router = express.Router() ;

const wrap = fn => (...args) => fn(...args).catch(args[2]) ;

router.get('/', wrap(async function(req, res, next) {
    let result = await firebaseSession.enter(req, res) ;

    if (result != 0) {
        res.redirect('/signin');
        return ;
    }

    res.render('email', {subject: "", message: ""});		 
})) ;

router.post('/send', wrap(async function(req, res, next) {

    let programs = (await clientAdapter.listProgram(req, 0, -1)).data.programs ;
    
    for (let key in programs) {
        let program = programs[key] ;

        if (program.email != undefined && program.email != "") {
            await functions.sendEmail("code4nerima@gmail.com", program.email, req.body.subject, req.body.message) ;
        }
    }

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ resultMessage: 'メールを送信しました。' }));
})) ;

module.exports = router;