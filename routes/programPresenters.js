var express = require('express');
let clientAdapter = require('../modules/clientAdapter') ;
let functions = require('../modules/functions') ;
let firebaseSession = require('../modules/firebase_session.js') ;
let admin = require('firebase-admin');
const multer = require('multer') ;
const upload = multer({ dest: 'uploads/' }) ;
const sharp = require('sharp');
var router = express.Router() ;

const wrap = fn => (...args) => fn(...args).catch(args[2]) ;

router.get('/', wrap(async function(req, res, next) {
    let result = await firebaseSession.enter(req, res) ;

    if (result != 0) {
        res.redirect('/signin');
        return ;
    }

    let programId = req.query.programId ;

    let currentUser = req.session.user ;
    let uid = currentUser.uid ;
    
    let user = (await clientAdapter.getUserProfile(req, uid)).data ;
    let program = (await clientAdapter.getProgram(req, programId)).data ;

    user.email = currentUser.email ;

    let isProgramOwner = await functions.isProgramOwner(user, program) ;

    if (!isProgramOwner && user.role != 1 && user.role != 3) {
        res.redirect('/') ;
        return ;
    }

    res.render('programPresenters', {
        program: program,
        isProgramOwner: isProgramOwner,
        role: user.role,
    });		 
})) ;

router.get('/data', wrap(async function(req, res, next) {

    if (!req.headers.referer.startsWith(process.env.ROOT_URL)) {
		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify({}));
		return ;
	}
    
    let programId = req.query.programId ;

    let recv = await clientAdapter.listPresenter(req, programId, 0, -1) ;

    let data = {
        presenters: recv.data.presenters
    } ;

    for (let key in data.presenters) {
        let presenter = data.presenters[key] ;

        if (presenter.urls == undefined || presenter.urls.length == 0) {
            presenter.urls = [{
                title: {
                    'ja': "",
                    'en': "",
                    'zh-TW': "",
                    'zh-CN': "",
                }, 
                sortOrder: 0, 
                url: "",
            }]
        }
    }
    
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

    let currentUser = req.session.user ;
    let uid = currentUser.uid ;
    
    {
        let user = (await clientAdapter.getUserProfile(req, uid)).data ;
        let program = (await clientAdapter.getProgram(req, programId)).data ;

        user.email = currentUser.email ;

        if (!await functions.isProgramOwner(user, program) && user.role != 1 && user.role != 3) {
            res.redirect('/') ;
            return ;
        }
    }

    let presenterId = req.query.presenterId ;

    let presenter = {
        name: {},
        organization: {},
        description: {},
        photoURL: "",
        sortOrder: 0,
        urls: [],
    } ;

    if (presenterId != undefined) {
        let recv = await clientAdapter.getPresenter(req, programId, presenterId) ;
        
        presenter = recv.data ;
        presenter.presenterId = presenterId ;

        if (req.query.force == undefined) {
            let data = (await admin.firestore().collection("presenterEditingLock").doc(presenterId).get()).data() ;

            if (data != undefined && data.uid != uid) {
                let lockingUser = (await clientAdapter.getUserProfile(req, data.uid)).data ;

                presenter.programId = programId ;

                res.render('presenterIsLocked', {
                    lockingUser: lockingUser,
                    presenter: presenter,
                    datetime: data.datetime,
                });	
                return ;
            }
        }
        
        var date = new Date();

        await admin.firestore().collection("presenterEditingLock").doc(presenterId).set(
            {
                datetime: date.toUTCString(),
                presenterId: presenterId,
                uid: uid
            }) ;
    }

    if (presenter.urls.length == 0) {
        presenter.urls = [{title: {}, sortOrder: 0, url: ''}] ;
    }

    presenter.programId = programId ;

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
    let presenterId = req.body.presenterId ;

    let presenter = {} ;

    if (presenterId != undefined) {
        let recv = await clientAdapter.getPresenter(req, programId, presenterId) ;
        
        presenter = recv.data ;
        presenter.presenterId = presenterId ;
    } else {
        presenter.name = {} ;
        presenter.organization = {} ;
        presenter.description = {} ;
    }

    presenter.name["ja"] = req.body.ja_name ;
    presenter.name["ja_kana"] = req.body.ja_name_kana ;
    presenter.name["en"] = req.body.en_name ;
    presenter.name["zh-TW"] = req.body['zh-TW_name'] ;
    presenter.name["zh-CN"] = req.body['zh-CN_name'] ;

    presenter.organization["ja"] = req.body.ja_organization ;
    presenter.organization["en"] = req.body.en_organization ;
    presenter.organization["zh-TW"] = req.body['zh-TW_organization'] ;
    presenter.organization["zh-CN"] = req.body['zh-CN_organization'] ;

    presenter.description["ja"] = req.body.ja_description ;
    presenter.description["en"] = req.body.en_description ;
    presenter.description["zh-TW"] = req.body['zh-TW_description'] ;
    presenter.description["zh-CN"] = req.body['zh-CN_description'] ;

    presenter.sortOrder = req.body.sortOrder ;

    presenter.urls = [{
        title: {
            'ja': req.body.ja_linkTitle,
            'en': req.body.en_linkTitle,
            'zh-TW': req.body['zh-TW_linkTitle'],
            'zh-CN': req.body['zh-CN_linkTitle'],
        }, 
        sortOrder: 0, 
        url: req.body.linkURL,
    }] ;

    if (presenterId != undefined) {
        await clientAdapter.updatePresenter(req, programId, presenter) ;

        await admin.firestore().collection("presenterEditingLock").doc(presenter.presenterId).delete() ;
    } else {
        await clientAdapter.createPresenter(req, programId, presenter) ;
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

router.post('/photo', upload.single('file'), wrap(async function(req, res, next) {
    let result = await firebaseSession.enter(req, res) ;

    if (result != 0) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({publicUrl: ''}));
        return ;
    }

    try {
        let programId = req.body.programId ;
        let presenterId = req.body.presenterId ;

        let presenter ;
        
        {
            let recv = await clientAdapter.getPresenter(req, programId, presenterId) ;
            presenter = recv.data ;
        }
    
        var bucket = admin.storage().bucket();

        if (presenter.photoURL != null && presenter.photoURL != '') {
            try {
                let fileName = presenter.photoURL.substring(presenter.photoURL.lastIndexOf('/') + 1)
                await bucket.file(fileName).delete() ;
            } catch (e) {
                console.log(e) ;
            }
        }

        let publicUrl = '' ;

        if (req.file != undefined) {

            const image = sharp(req.file.path);

            image.resize({
                width: 400,
                height: 400,
            }) ;

            await image.toFile(req.file.path + "_") ;

            let date = new Date() ;
            
            await bucket.upload(req.file.path + "_", {
                destination: "photo_" + presenterId + '_' + date.getTime(),
            });

            const file = bucket.file("photo_" + presenterId + '_' + date.getTime()) ;
            publicUrl = file.publicUrl();
        }

        {    
            presenter.photoURL = publicUrl ;

            await clientAdapter.updatePresenter(req, programId, presenter) ;
        }

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({publicUrl: publicUrl}));
    } catch (e) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({publicUrl: ''}));
    }
})) ;

router.get('/photoDelete', wrap(async function(req, res, next) {
    let result = await firebaseSession.enter(req, res) ;

    if (result != 0) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({}));
        return ;
    }

    let programId = req.query.programId ;
    let presenterId = req.query.presenterId ;

    let presenter ;
        
    {
        let recv = await clientAdapter.getPresenter(req, programId, presenterId) ;
        presenter = recv.data ;
    }

    var bucket = admin.storage().bucket();

    if (presenter.photoURL != '') {
        let fileName = presenter.photoURL.substring(presenter.photoURL.lastIndexOf('/') + 1)

        try {
            await bucket.file(fileName).delete() ;
        } catch (e) {
            console.log(e) ;
        }
    }

    {
        presenter.photoURL = "" ;

        await clientAdapter.updatePresenter(req, programId, presenter) ;
    }

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({}));
})) ;

module.exports = router;