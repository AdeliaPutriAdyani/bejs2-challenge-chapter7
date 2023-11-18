const express = require('express'),
    router = express.Router(),
    controller = require('./controllers'),
    { users } = require('./model');

router.get('/', (req, res) => {
    return res.render('index');
});

router.get('/register', (req, res) => {
    return res.render('register');
});

router.get('/reset-password', (req, res) => {
    return res.render('reset-password');
});

router.get('/set-password', (req, res) => {
    return res.render('error', { message: 'Invalid request' });
});

router.get('/set-password/:key', async (req, res) => {
    try {
        console.log(req.params.key);
        const findData = await users.findFirst({
            where: {
                resetPasswordToken: req.params.key
            }
        });

        if (!findData) {
            return res.render('error', { message: 'Invalid key' });
        }

        return res.render('set-password', { user: findData });
    } catch (error) {
        console.log(error);
        return res.render('error', { message: 'Internal Server Error' });
    }
});

router.post('/api/v1/register', controller.register);
router.post('/api/v1/reset-password', controller.resetPassword);
router.post('/api/v1/set-password', controller.setPassword);

module.exports = router