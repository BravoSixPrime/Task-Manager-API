const express = require('express')
const User = require("../models/user")
const router = new express.Router()
const jwt = require('jsonwebtoken')
const auth = require("../middleware/auth")
const multer = require('multer')
const sharp = require('sharp')
const { sendWelcomeEmail, sendCancellationEmail } = require('../emails/account')


//Create User

router.post('/users', async(req, res) => {
    const user = User(req.body)
    try {
        await user.save()
        const token = await user.generateAuthToken()
        sendWelcomeEmail(user.email, user.name)
        res.status(201).send({ user, token })
    } catch (e) {
        res.status(400).send(e)
    }
})

//Login Portal

router.post('/users/login', async(req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch (e) {
        res.status(400).send({ "error": "something went wrong" })
    }
})

//Logout
router.post('/users/logout', auth, async(req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send({ "error": 'Logout Failed' })
    }
})

//Logout All
router.post('/users/logoutall', auth, async(req, res) => {
    try {
        req.user.token = []
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send(e)
    }
})

router.get('/users/me', auth, async(req, res) => {
    console.log("Get User")
    res.send(req.user)
})



//Update User details

router.patch('/users/me', auth, async(req, res) => {
    const updates = Object.keys(req.body)
        // console.log(updates)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) =>
        allowedUpdates.includes((update))
    )
    if (!isValidOperation) {
        return res.status(400).send("Can't update the fields")
    }
    try {
        updates.forEach((update) => {
            req.user[update] = req.body[update]
        })
        await req.user.save()
        res.send(req.user)
    } catch (e) {
        res.status(500).send(e)
    }
})

router.delete('/users/me', auth, async(req, res) => {
    try {

        await req.user.remove()
        sendCancellationEmail(req.user.email, req.user.name)
        res.send(req.user)
    } catch (e) {
        res.status(500).send(e)
    }
})

const upload = multer({
    limits: {
        fileSize: 1000000,
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)/)) {
            return cb(new Error('Please upload an image'))
        }

        cb(undefined, true)
    }
})

//Upload avatar
router.post('/users/me/avatar', auth, upload.single('avatar'), async(req, res) => {
            const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
            req.user.avatar = buffer
            await req.user.save()
            res.send('Recieved!')
        },
        (error, req, res, next) => {
            res.status(400).send({ error: error.message })
        }
    )
    //Delete Avatar
router.delete('/users/me/avatar', auth, async(req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send("Deleted!")
})

router.get('/users/:id/avatar', async(req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user || !user.avatar) {
            throw new Error()
        }
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (e) {
        res.status(404).send('Not Found')
    }
})
module.exports = router