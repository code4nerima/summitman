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

    let programId = req.query.programId ;

    res.render('presenters', {programId: programId});		 
})) ;

router.get('/data', wrap(async function(req, res, next) {
    let programId = req.query.programId ;

    let recv = await clientAdapter.listPresenter(req, programId, 0, -1) ;

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

    let programId = req.query.programId ;
    let presenterId = req.query.presenterId ;

    let presenter = {
        name: {},
        organization: {},
        description: {},
        photoURL: "",
        sortOrder: 0,
    } ;

    if (req.query.presenterId != undefined) {
        let recv = await clientAdapter.getPresenter(req, programId, presenterId) ;
        
        presenter = recv.data ;
        presenter.presenterId = presenterId ;
    }

    res.render('presenterEdit', {
        programId: programId,
        presenter: presenter,
    });		 
})) ;

router.post('/edit', wrap(async function(req, res, next) {
    let result = await firebaseSession.enter(req, res) ;

    if (result != 0) {
        res.redirect('/signin');
        return ;
    }

    let programId = req.body.programId ;

    let presenter = {
        presenterId: "",
        name: {
            "ja": req.body.ja_name,
            "ja_kana": req.body.ja_name_kana,
            "en": req.body.en_name,
            "zh-TW": req.body['zh-TW_name'],
            "zh-CN": req.body['zh-CN_name'],
        },
        organization: {
            "ja": req.body.ja_organization,
            "en": req.body.en_organization,
            "zh-TW": req.body['zh-TW_organization'],
            "zh-CN": req.body['zh-CN_organization'],
        },
        description: {
            "ja": req.body.ja_description,
            "en": req.body.en_description,
            "zh-TW": req.body['zh-TW_description'],
            "zh-CN": req.body['zh-CN_description'],
        },
        photoURL: "",
        sortOrder: req.body.sortOrder,
    } ;

    if (req.body.presentersId != undefined) {
        presenter.presenterId = req.body.presenterId ;

        clientAdapter.updatePresenter(req, programId, presenter) ;
    } else {
        clientAdapter.createPresenter(req, programId, presenter) ;
    }

    res.redirect('/programPresenters?programId=' + programId);
})) ;

router.get('/delete', wrap(async function(req, res, next) {
    let programId = req.query.programId ;
    let presenterId = req.query.presenterId ;

    await clientAdapter.deletePresenter(req, programId, presenterId) ;
    
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({}));
})) ;

module.exports = router;