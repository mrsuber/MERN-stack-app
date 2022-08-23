const express=require('express');
const router = express.Router();

const {register,login,verifyEmail,forgotpassword,resetpassword} = require('../controllers/auth')

router.route("/register").post(register)
router.route("/verify-email").post(verifyEmail)

router.route("/login").post(login)

router.route("/forgotpassword").post(forgotpassword)

router.route("/resetpassword/:resetToken").put(resetpassword)


module.exports = router;
