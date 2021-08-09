var express = require('express');
let clientAdapter = require('../modules/clientAdapter') ;
let firebaseSession = require('../modules/firebase_session.js') ;
var router = express.Router() ;
let admin = require('firebase-admin');
const multer = require('multer') ;
const upload = multer({ dest: 'uploads/' }) ;
const sharp = require('sharp');

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

            if (data.role == 1) {
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
        data.name['zh-CN'] = req.body["zh-CN_name"] ;
    }

    if (req.body.role != undefined) {
        data.role = Number(req.body.role) ;
    }

    let recv = await clientAdapter.updateUserProfile(req, data) ;

    if (recv.result == 1) {
        if (req.body.adminAccess == '1') {
            res.redirect('/users');
        } else {
            res.redirect('/');
        }
    } else {
        res.redirect('/profile');
    }
})) ;

router.post('/photo', upload.single('file'), wrap(async function(req, res, next) {
    let result = await firebaseSession.enter(req, res) ;

    if (result != 0) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({publicUrl: ''}));
        return ;
    }

    let currentUser = req.session.user ;

    let userProfile ;

    {
        let recv = await clientAdapter.getUserProfile(req, currentUser.uid) ;

        if (recv.result == 1) {
            userProfile = recv.data ;
        } else {
            userProfile = {} ;
        }
    }

    try {
        let currentUser = req.session.user ;

        var bucket = admin.storage().bucket();

        if (userProfile.photoURL != '') {
            let fileName = userProfile.photoURL.substring(userProfile.photoURL.lastIndexOf('/') + 1)

            try {
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

            const date = new Date();

            await bucket.upload(req.file.path + "_", {
                destination: "photo_" + currentUser.uid + '_' + date.getTime()
            });

            const file = bucket.file("photo_" + currentUser.uid + '_' + date.getTime()) ;
            publicUrl = file.publicUrl();
        }

        {
            userProfile.photoURL = publicUrl ;

            await clientAdapter.updateUserProfile(req, userProfile) ;
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

    let currentUser = req.session.user ;

    let userProfile ;

    {
        let recv = await clientAdapter.getUserProfile(req, currentUser.uid) ;

        if (recv.result == 1) {
            userProfile = recv.data ;
        } else {
            userProfile = {} ;
        }
    }

    var bucket = admin.storage().bucket();

    if (userProfile.photoURL != '') {
        let fileName = userProfile.photoURL.substring(userProfile.photoURL.lastIndexOf('/') + 1)

        try {
            await bucket.file(fileName).delete() ;
        } catch (e) {
            console.log(e) ;
        }
    }

    {
        userProfile.photoURL = "" ;

        await clientAdapter.updateUserProfile(req, userProfile) ;
    }

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({}));
})) ;

module.exports = router;