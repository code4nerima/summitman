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

    res.render('presenters', {programId: req.query.programId});		 
})) ;

router.get('/data', wrap(async function(req, res, next) {

    let recv = await clientAdapter.listPresenter(req, 0, -1) ;

    let data = {
        presenters: recv.data.presenters
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

    let presenter = {
        name: {},
    } ;

    if (req.query.presenterId != undefined) {
        let recv = await clientAdapter.getPresenter(req, req.query.presenterId) ;
        
        presenter = recv.data ;
        presenter.presenterId = req.query.presenterId ;
    }

    res.render('presenterEdit', {
        programId: req.query.programId,
        presenter: presenter,
    });		 
})) ;

router.post('/edit', wrap(async function(req, res, next) {
    let result = await firebaseSession.enter(req, res) ;

    if (result != 0) {
        res.redirect('/signin');
        return ;
    }

    let presenter = {
        name: {
            "ja": req.body.ja_name,
            "en": req.body.en_name,
            "zh-TW": req.body['zh-TW_name'],
            "zh-CN": req.body['zh-CN_name'],
        },
    } ;

    let programId = req.body.programId ;

    if (req.body.presentersId != undefined) {
        presenter.presenterId = req.body.presenterId ;

        clientAdapter.updatePresenter(req, programId, presenter) ;
    } else {
        clientAdapter.createPresenter(req, programId, presenter) ;
    }

    res.redirect('/programPresenters');
})) ;

router.get('/delete', wrap(async function(req, res, next) {

    let recv = await clientAdapter.deletePresenter(req, req.query.presenterId) ;
    
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({}));
})) ;

module.exports = router;