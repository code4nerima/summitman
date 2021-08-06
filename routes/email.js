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

    let resultMessagte = "" ;
    let result = 0 ;

    if (req.body.subject != "" && req.body.message != "") {
        let programs = (await clientAdapter.listProgram(req, 0, -1)).data.programs ;
        let emails = [] ;

        for (let key in programs) {
            let program = programs[key] ;

            if (program.email != undefined && program.email != "") {
                emails.push(program.email) ;
            }
        }
        
        for (let key in emails) {
            await functions.sendEmail("info@code4nerima.org", emails[key], req.body.subject, req.body.message) ;
        }

        resultMessagte = "メールを送信しました。" ;
        result = 1 ;
    } else {
        resultMessagte = "タイトルと本文を入力してください。" ;
    }

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ result: result, resultMessage: resultMessagte }));
})) ;

module.exports = router;