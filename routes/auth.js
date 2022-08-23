const express=require('express');
const router = express.Router();
// const {isResetTokenValid} = require('../middleware/user')
const {register,login,verifyEmail,forgotpassword,resetpassword} = require('../controllers/auth')

router.route("/register").post(register)
router.route("/verify-email").post(verifyEmail)

router.route("/login").post(login)

router.route("/forgotpassword").post(forgotpassword)

router.route("/reset-password").post( resetpassword)



module.exports = router;
