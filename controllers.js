const express = require('express');
const morgan = require('morgan');
const { users } = require('./model');
const utils = require('./utils');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { Server } = require("socket.io");

const io = new Server();


module.exports = {
    register: async (req, res) => {
        try {
            const existingUser = await users.findFirst({
                where: {
                    email: req.body.email
                },
            });

            if (existingUser) {
                return res.status(400).json({
                    error: 'Email already exists',
                });
            }

            const newUser = await users.create({
                data: {
                    email: req.body.email,
                    password: await utils.cryptPassword(req.body.password),
                },
            });

            io.to(newUser.id).emit('registrationSuccess', {
                message: 'Registration successful!',
                user: newUser,
            });

            return res.render('reg-success', { user: newUser });
        } catch (error) {
            console.error(error);
            return res.render('error', {
                message: error.message || 'Internal Server Error',
            });
        }
    },

    resetPassword: async (req, res) => {
        try {
            const findUser = await users.findFirst({
                where: {
                    email: req.body.email
                }
            });

            if (!findUser) {
                return res.render('error');
            }

            const resetToken = crypto.randomBytes(20).toString('hex');

            await users.update({
                data: {
                    resetPasswordToken: resetToken,
                },
                where: {
                    id: findUser.id
                }
            });

            const transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 465,
                secure: true,
                auth: {
                    user: 'delaputri811@gmail.com',
                    pass: 'raia twqi yjmt dtof'
                }
            });

            const email = req.body.email;
            const htmlTemplate = `
            <!DOCTYPE html>
            <html lang="en">
            
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Reset Password</title>
                <style type="text/css">
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: 'Arial', sans-serif;
                        background-color: #edf4f5;
                        color: #000000;
                    }
        
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #ffffff;
                        border-radius: 10px;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    }
        
                    h1 {
                        text-align: center;
                        color: #30b3f1;
                    }
        
                    p {
                        font-size: 16px;
                        line-height: 1.5;
                        margin-bottom: 20px;
                    }
        
                    a {
                        color: #0000ee;
                        text-decoration: underline;
                    }
        
                    a:hover {
                        color: #ff4500;
                    }
                </style>
            </head>
            
            <body>
                <div class="container">
                    <h1>🎉 Hii ${email}, Your Email<br />Was Successfully Reset 🎉</h1>
                    <p>
                        To set a new password, click the following link:
                        <br />
                        <a href="http://localhost:3000/set-password/${resetToken}">Click Here</a>
                    </p>
                </div>
            </body>
            
            </html>
            `;

            const mailOptions = {
                from: 'system@gmail.com',
                to: req.body.email,
                subject: "Reset Password",
                html: htmlTemplate
            }

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
                
                transporter.close();
            });

        } catch (error) {
            console.error(error);
            return res.render('error', {
                message: error.message || 'Internal Server Error',
            });
        }
    },

    setPassword: async (req, res) => {
        try {
            const findUser = await users.findFirst({
                where: {
                    resetPasswordToken: req.body.key
                }
            });

            if (!findUser) {
                return res.render('error');
            }

            await users.update({
                data: {
                    password: await utils.cryptPassword(req.body.password),
                    resetPasswordToken: null
                },
                where: {
                    id: findUser.id
                }
            });

            io.emit('passwordSet', { userId: findUser.id });

            return res.render('success');
        } catch (error) {
            console.error(error);
            return res.render('error', {
                message: error.message || 'Internal Server Error',
            });
        }
    },
}