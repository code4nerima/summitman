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

    res.render('genre', {});		 
})) ;

router.get('/data', wrap(async function(req, res, next) {

    let recv = await clientAdapter.listGenre(req, 0, -1) ;

    let data = {
        genres: recv.data.genres
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

    let genre = {
        name: {},
    } ;

    if (req.query.genreId != undefined) {
        let recv = await clientAdapter.getGenre(req, req.query.genreId) ;
        
        genre = recv.data ;
        genre.genreId = req.query.genreId ;
    }

    res.render('genreEdit', {
        genre: genre,
    });		 
})) ;

router.post('/edit', wrap(async function(req, res, next) {
    let result = await firebaseSession.enter(req, res) ;

    if (result != 0) {
        res.redirect('/signin');
        return ;
    }

    let genre = {
        name: {
            "ja": req.body.ja_name,
            "en": req.body.en_name,
            "zh-TW": req.body['zh-TW_name'],
            "zh-CN": req.body['zh-CN_name'],
        },
    } ;

    if (req.body.genreId != undefined) {
        genre.genreId = req.body.genreId ;

        clientAdapter.updateGenre(req, genre) ;
    } else {
        clientAdapter.createGenre(req, genre) ;
    }

    res.redirect('/genre');
})) ;

router.get('/delete', wrap(async function(req, res, next) {

    let recv = await clientAdapter.deleteGenre(req, req.query.genreId) ;
    
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({}));
})) ;

module.exports = router;