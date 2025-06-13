const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require("../models/User");
const auth = require('../middlewares/auth');
const { validateRegistration, validateLogIn, validateBackgroundImage } = require('../middlewares/validationJoi');
require('dotenv').config();
const gravatar = require('gravatar');
const upload = require('../services/cloudinary');

router.post('/register', validateRegistration, async (req, res, next) => {
    try {

        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "Email already registered!" });
        }

        const avatarURL = gravatar.url(email, { s: '250', r: 'pg', d: 'monsterid' }, true);
        const newUser = new User({
            name: name,
            email: email,
            password: password,
            avatarURL: avatarURL,
        });

        await newUser.save();

        return res.status(201).json({
            message: 'Succesful registration!',
            user: {
                name: newUser.name,
                email: newUser.email,
                avatarURL: newUser.avatarURL,
            }
        });

    } catch (error) {
        console.error("Error during register:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


router.post('/login', validateLogIn, async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            console.error("User not found with email:", email);
            return res.status(401).json({ message: 'Email or password is wrong' });
        }

        const isPasswordValid = await user.isValidPassword(password);

        if (!isPasswordValid) {
            console.error("Invalid password for user:", password);
            return res.status(401).json({ message: 'Email or password is wrong' });
        }

        const payload = { id: user._id };
        const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: '3h' });
        user.token = token;

        await user.save();

        res.status(200).json({
            message: `Welcome ${user.name}`,
            user: {
                name: user.name,
                email: user.email,
                avatarURL: user.avatarURL
            },
            token
        });

    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


router.get('/current', auth, async (req, res, next) => {
    try {
        const { name, avatarURL, theme } = req.user;

        res.json({
            user: {
                name,
                avatarURL,
                theme,
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


router.patch('/update', auth, upload.single('avatar'), async (req, res, next) => {
    try {

        const { name, email, password } = req.body;
        const user = req.user;
        const file = req.file;

        if (file) {
            user.avatarURL = file.path;
        };

        if (name) {
            user.name = name;
        }
        if(password) {
            user.password = password;
        }

        if (email) {
            const existingUser = await User.findOne({ email });
            if (existingUser)
                return res.status(401).json({ message: 'Email already registered!' });
            user.email = email;
        }

        await user.save();

        res.status(200).json({
            message: "Successfully data updated!",
            update: {
                name: user.name,
                email: user.email,
                avatarURL: user.avatarURL
            }
        });

    } catch (error) {
        console.error("Error during update:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
})


router.patch('/change-theme', auth, async (req, res, next) => {
    try {
        const { theme } = req.body;
        const userId = req.user._id;

        const availableThemes = ['light', 'dark', 'violet'];

        const themeIndex = availableThemes.findIndex(t => t === theme);

        if (themeIndex === -1) {
            return res.status(400).json({ message: 'Invalid theme' });
        }
        const user = req.user;
        user.theme = availableThemes[themeIndex];

        await user.save();

        res.status(200).json({
            message: 'Theme updated successfully',
            owner: userId,
            theme: user.theme
        });

    } catch (error) {
        console.error("Error updating theme:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});



router.get('/logout', auth, async (req, res, next) => {
    try {
        const user = req.user;

        user.token = null;
        await user.save();

        res.status(200).json({ message: 'Successfully logged out!' })

    } catch (error) {
        console.error("Error during logout:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
})


router.patch('/users/:userId/set-background', auth, validateBackgroundImage, async (req, res) => {
    try {
        const { userId } = req.params;
        const { backgroundImage } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: `The user with id ${userId} not found!` });
        }

        const imageUrl = `/images/${backgroundImage}`;
        user.backgroundImage = imageUrl;
        await user.save();

        res.status(200).json({
            message: 'Succesfully setup background image!',
            backgroundImage: imageUrl
        });
    } catch (error) {
        res.status(500).json({ message: 'Eroare server', error });
    }
});

module.exports = router;