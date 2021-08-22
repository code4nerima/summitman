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

    if (!isProgramOwner && user.role != 1 && user.role != 4) {
        res.redirect('/') ;
        return ;
    }

    res.render('graphicRecordings', {
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

    let recv = await clientAdapter.listGrareco(req, programId, 0, -1) ;

    let data = {
        grarecos: recv.data.grarecos
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

    let currentUser = req.session.user ;
    let uid = currentUser.uid ;
    
    {
        let user = (await clientAdapter.getUserProfile(req, uid)).data ;
        let program = (await clientAdapter.getProgram(req, programId)).data ;

        user.email = currentUser.email ;

        if (!await functions.isProgramOwner(user, program) && user.role != 1 && user.role != 4) {
            res.redirect('/') ;
            return ;
        }
    }

    let grarecoId = req.query.grarecoId ;

    let grareco = {
        name: {},
        organization: {},
        description: {},
        photoURL: "",
        sortOrder: 0,
    } ;

    if (grarecoId != undefined) {
        let recv = await clientAdapter.getGrareco(req, programId, grarecoId) ;
        
        grareco = recv.data ;
        grareco.grarecoId = grarecoId ;

        if (req.query.force == undefined) {
            let data = (await admin.firestore().collection("grarecoEditingLock").doc(grarecoId).get()).data() ;

            if (data != undefined && data.uid != uid) {
                let lockingUser = (await clientAdapter.getUserProfile(req, data.uid)).data ;

                grareco.programId = programId ;

                res.render('grarecoIsLocked', {
                    lockingUser: lockingUser,
                    grareco: grareco,
                    datetime: data.datetime,
                });	
                return ;
            }
        }
        
        var date = new Date();

        await admin.firestore().collection("grarecoEditingLock").doc(grarecoId).set(
            {
                datetime: date.toUTCString(),
                grarecoId: grarecoId,
                uid: uid
            }) ;
    }

    grareco.programId = programId ;

    res.render('graphicRecordingEdit', {
        programId: programId,
        grareco: grareco,
    });		 
})) ;

router.post('/edit', wrap(async function(req, res, next) {
    let result = await firebaseSession.enter(req, res) ;

    if (result != 0) {
        res.redirect('/signin');
        return ;
    }

    let programId = req.body.programId ;
    let grarecoId = req.body.grarecoId ;

    let grareco = {} ;

    if (grarecoId != undefined) {
        let recv = await clientAdapter.getGrareco(req, programId, grarecoId) ;
        
        grareco = recv.data ;
        grareco.grarecoId = grarecoId ;
    } else {
        grareco.name = {} ;
        grareco.organization = {} ;
        grareco.description = {} ;
    }

    grareco.name["ja"] = req.body.ja_name ;
    grareco.name["ja_kana"] = req.body.ja_name_kana ;
    grareco.name["en"] = req.body.en_name ;
    grareco.name["zh-TW"] = req.body['zh-TW_name'] ;
    grareco.name["zh-CN"] = req.body['zh-CN_name'] ;

    grareco.organization["ja"] = req.body.ja_organization ;
    grareco.organization["en"] = req.body.en_organization ;
    grareco.organization["zh-TW"] = req.body['zh-TW_organization'] ;
    grareco.organization["zh-CN"] = req.body['zh-CN_organization'] ;

    grareco.description["ja"] = req.body.ja_description ;
    grareco.description["en"] = req.body.en_description ;
    grareco.description["zh-TW"] = req.body['zh-TW_description'] ;
    grareco.description["zh-CN"] = req.body['zh-CN_description'] ;

    grareco.sortOrder = req.body.sortOrder ;

    grareco.urls = [{
        title: {
            'ja': req.body.ja_linkTitle,
            'en': req.body.en_linkTitle,
            'zh-TW': req.body['zh-TW_linkTitle'],
            'zh-CN': req.body['zh-CN_linkTitle'],
        }, 
        sortOrder: 0, 
        url: req.body.linkURL,
    }] ;

    if (grarecoId != undefined) {
        await clientAdapter.updateGrareco(req, programId, grareco) ;

        await admin.firestore().collection("grarecoEditingLock").doc(grareco.grarecoId).delete() ;
    } else {
        await clientAdapter.createGrareco(req, programId, grareco) ;
    }

    res.redirect('/graphicRecordings?programId=' + programId);
})) ;

router.get('/delete', wrap(async function(req, res, next) {
    let programId = req.query.programId ;
    let grarecoId = req.query.grarecoId ;

    await clientAdapter.deleteGrareco(req, programId, grarecoId) ;
    
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
        let grarecoId = req.body.grarecoId ;

        let grareco ;
        
        {
            let recv = await clientAdapter.getGrareco(req, programId, grarecoId) ;
            grareco = recv.data ;
        }
    
        var bucket = admin.storage().bucket();

        if (grareco.photoURL != null && grareco.photoURL != '') {
            try {
                let fileName = grareco.photoURL.substring(grareco.photoURL.lastIndexOf('/') + 1)
                await bucket.file(fileName).delete() ;
            } catch (e) {
                console.log(e) ;
            }
        }

        let publicUrl = '' ;

        if (req.file != undefined) {

            const image = sharp(req.file.path);

            image.resize({
                width: 1280,
            }) ;

            await image.toFile(req.file.path + "_") ;

            let date = new Date() ;
            
            await bucket.upload(req.file.path + "_", {
                destination: "photo_" + grarecoId + '_' + date.getTime(),
            });

            const file = bucket.file("photo_" + grarecoId + '_' + date.getTime()) ;
            publicUrl = file.publicUrl();
        }

        {    
            grareco.photoURL = publicUrl ;

            await clientAdapter.updateGrareco(req, programId, grareco) ;
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
    let grarecoId = req.query.grarecoId ;

    let grareco ;
        
    {
        let recv = await clientAdapter.getGrareco(req, programId, grarecoId) ;
        grareco = recv.data ;
    }

    var bucket = admin.storage().bucket();

    if (grareco.photoURL != '') {
        let fileName = grareco.photoURL.substring(grareco.photoURL.lastIndexOf('/') + 1)

        try {
            await bucket.file(fileName).delete() ;
        } catch (e) {
            console.log(e) ;
        }
    }

    {
        grareco.photoURL = "" ;

        await clientAdapter.updateGrareco(req, programId, grareco) ;
    }

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({}));
})) ;

module.exports = router;