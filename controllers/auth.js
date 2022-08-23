const crypto = require("crypto")
const User = require('../models/User')
const ErrorResponse = require('../utils/errorResponse')
const VerificationToken = require('../models/VerificationToken')
const nodemailer = require('nodemailer')
const {isValidObjectId} = require('mongoose')

// send email with this number for verification
const mailTransport = () => nodemailer.createTransport({
  host: "smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.MAILTRAP_USERNAME,
    pass: process.env.MAILTRAP_PASSWORD
  }
});

//generate welcome and verify your email template
const generateEmailTemplate = code =>{
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset='UTF-8'>
      <meta http-equiv='X-UA-Compatible' content='IE=edge'>
      <style>
        @media only screen and (max-width:620px){
          h1{
            font-size:20px;
            padding:5px;
          }
        }
      </style>
    </head>
    <body>
      <div>
          <div style="max-width:620px; margin:0 auto; font-family:sans-serif; color:#272727;">
            <h1 style="background:#f6f6f6; padding:10px; text-align:center; color:#272727;">
            We are delighted to welcome you to our shop

            </h1>
            <p>Please Verify Your Email To Continue Your Verification code is:</p>
            <p style="width:80px; margin:0 auto; font-weight:bold; text-align:center; background:#f6f6f6; border-radius:5px; font-size:25px;">
              ${code}
            </p>
          </div>
      </div>
    </body>
    </html>
  `
}
const plainEmailTemplate = (heading,message) =>{
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset='UTF-8'>
      <meta http-equiv='X-UA-Compatible' content='IE=edge'>
      <style>
        @media only screen and (max-width:620px){
          h1{
            font-size:20px;
            padding:5px;
          }
        }
      </style>
    </head>
    <body>
      <div>
          <div style="max-width:620px; margin:0 auto; font-family:sans-serif; color:#272727;">
            <h1 style="background:#f6f6f6; padding:10px; text-align:center; color:#272727;">
          ${heading}

            </h1>

            <p style=" text-align:center; color:#272727;">
              ${message}
            </p>
          </div>
      </div>
    </body>
    </html>
  `
}

const generatePasswordResetTemplate = url =>{
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset='UTF-8'>
      <meta http-equiv='X-UA-Compatible' content='IE=edge'>
      <style>
        @media only screen and (max-width:620px){
          h1{
            font-size:20px;
            padding:5px;
          }
        }
      </style>
    </head>
    <body>
      <div>
          <div style="max-width:620px; margin:0 auto; font-family:sans-serif; color:#272727;">
            <h1 style="background:#f6f6f6; padding:10px; text-align:center; color:#272727;">
          Response To Your Reset Password Request

            </h1>

            <p style=" text-align:center; color:#272727;">
              Please click the link below to reset your password
            </p>
            <div style="text-align: center">
              <a href="${url}" style="font-family:sans-serif; margin:0 auto; padding:20px; text-align:center; background:#e63946; border-radius:5px; font-size:20px 10px; color:#fff; cursor:pointer; text-decoration:none; display:inline-block;">
              Reset Password

              </a>
            </div>
          </div>
      </div>
    </body>
    </html>
  `
}

const generatePasswordResetTemplateSuccess = (heading, message) =>{
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset='UTF-8'>
      <meta http-equiv='X-UA-Compatible' content='IE=edge'>
      <style>
        @media only screen and (max-width:620px){
          h1{
            font-size:20px;
            padding:5px;
          }
        }
      </style>
    </head>
    <body>
      <div>
          <div style="max-width:620px; margin:0 auto; font-family:sans-serif; color:#272727;">
            <h1 style="background:#f6f6f6; padding:10px; text-align:center; color:#272727;">
          ${heading}

            </h1>

            <p style=" text-align:center; color:#272727;">
              ${message}
            </p>

          </div>
      </div>
    </body>
    </html>
  `
}


//generate OTP
const generateOTP = () =>{
  let otp = ''
  for(let i =0; i<6; i++){
  const randVal =  Math.round(Math.random() * 9)
  otp = otp + randVal
  }
  return otp
}

//register user
exports.register= async (req,res,next)=>{
  const {username,email,password} = req.body;

  let handleOnChange = ( email ) => {

    // don't remember from where i copied this code, but this works.
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    if ( re.test(email) ) {
        return true
    }
    else {
        return false
    }

}


  if(!username){
    res.status(400).json({success:true, msg:'please provide a username, good one'})

    return next(new ErrorResponse("please provide a username, good one", 400))
  }

  if(username.trim().length<3 || username.trim().length>20){
    res.status(400).json({success:true, msg:'Name must be 3 to 20 characters long!'})

    return next(new ErrorResponse("Name must be 3 to 20 characters long!", 400))

  }
  // username = username.toLowerCase().replace(/ /g,'')


  const username1 = await User.findOne({username:username})
  const email1 = await User.findOne({email:email})



  if(username1){
   res.status(400).json({msg:"This username already exits."})
   return next(new ErrorResponse("This username already exits.", 400))

  }
  if(handleOnChange(email)===false){
    res.status(400).json({msg:"This email is invalid"})
    return next(new ErrorResponse("This email is invalid", 400))
  }
  if(email1){
   res.status(400).json({msg:"This email already exits."})
   return next(new ErrorResponse("This email already exitsed.", 400))
  }

  if(password.trim().length < 6){
   res.status(400).json({msg:"Password mustbe at least 6 characters"})
   return next(new ErrorResponse("Password mustbe at least 6 characters", 400))

  }


  //now we are working with database


  try{
    const newUser = new User({
      username,
      email,
      password
    })

    //generate the otp numbers used for verification
    const OTP = generateOTP()
    const verificationToken = new VerificationToken({
      owner: newUser._id,
      token: OTP
      })
    await verificationToken.save()
    await newUser.save()

    // send email with this number for verification
    const mailTransport = () => nodemailer.createTransport({
      host: "smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD
      }
    });
    const generateEmailTemplate = code =>{
      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset='UTF-8'>
          <meta http-equiv='X-UA-Compatible' content='IE=edge'>
          <style>
            @media only screen and (max-width:620px){
              h1{
                font-size:20px;
                padding:5px;
              }
            }
          </style>
        </head>
        <body>
          <div>
              <div style="max-width:620px; margin:0 auto; font-family:sans-serif; color:#272727;">
                <h1 style="background:#f6f6f6; padding:10px; text-align:center; color:#272727;">
                We are delighted to welcome you to our shop

                </h1>
                <p>Please Verify Your Email To Continue Your Verification code is:</p>
                <p style="width:80px; margin:0 auto; font-weight:bold; text-align:center; background:#f6f6f6; border-radius:5px; font-size:25px;">
                  ${code}
                </p>
              </div>
          </div>
        </body>
        </html>
      `
    }

    mailTransport().sendMail({
      form:'winetastingVerification@winetasting.com',
      to: newUser.email,
      subject:'Verify your email account',
      html: generateEmailTemplate(OTP)
    })

    sendToken(newUser, 201,res)
  }catch(error){
    next(error)

  }
}


//login user
exports.login= async (req,res,next)=>{
  const {email,password} = req.body;
  if(!email || !password){
    res.status(400).json({success:true, msg:'please provide an email and password'})

    return next(new ErrorResponse("please provide an email and password", 400))
  }

  try{
    const user = await User.findOne({email}).select("+password")
    if(!user){
      res.status(400).json({success:true, msg:'Invalid credentials'})

      return next(new ErrorResponse("Invalid credentials",401))

    }

    const isMatch = await user.matchPasswords(password)

    if(!isMatch){
      res.status(400).json({success:true, msg:'Invalid Login credentials'})

      return next(new ErrorResponse("Invalid Login credentials",401))

    }


    sendToken(user, 200,res)
  }catch(error){
    res.status(400).json({success:true, msg:error})

  }
}

//verify Email
exports.verifyEmail = async (req, res,next) => {
  const { userId, otp} = req.body
  if(!userId || !otp.trim()){
    res.status(400).json({msg:"Invalid Request, missing parameters"})
    return next(new ErrorResponse("Invalid Request, missing parameters", 400))

  }

  if(!isValidObjectId(userId)){
    res.status(400).json({msg:"Invalid user Id"})
    return next(new ErrorResponse("Invalid user Id", 400))

  }

  const user = await User.findById(userId)
  if(!user){
    res.status(400).json({msg:"Sorry user not found"})
    return next(new ErrorResponse("Sorry user not found", 400))

  }
  if(user.verified){
    res.status(400).json({msg:"This account is already verified"})
    return next(new ErrorResponse("This account is already verified", 400))

  }

  const token = await VerificationToken.findOne({owner:user._id})
  if(!token){
    res.status(400).json({msg:"Sorry user not found"})
    return next(new ErrorResponse("Sorry user not found", 400))

  }

  const isMatched = await token.compareToken(otp)

  if(!isMatched){
    res.status(400).json({msg:"Please provide a valid token"})
    return next(new ErrorResponse("Please provide a valid token", 400))

  }

  user.verified = true;
  await VerificationToken.findByIdAndDelete(token._id)
  await user.save()

  mailTransport().sendMail({
    form:'winetastingVerification@winetasting.com',
    to: user.email,
    subject:'Welcome Email',
    html: plainEmailTemplate("Email Verified Successfully", "Thanks for connecting with us")
  })

  res.json({success:true, message:"your email is verified.", user:{name:user.name,email:user.email,id:user._id}})
}


//reset user password
exports.forgotpassword= async (req,res,next)=>{
  const {email} = req.body;

  try{
    const user=await User.findOne({email})

    if(!user){
      return next(new ErrorResponse("Email could not be sent",404))
    }
    const resetToken = user.getResetPasswordToken()

    await user.save()

    const resetUrl = `http://localhost:3000/passwordreset/${resetToken}`
    console.log(resetUrl)
    const message = `
    <h1>You have requested a password reset</h1>
    <p>Please go to this link to reset your password </p>
    <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
    `

    try{
      // await sendEmail({ to:user.email, subject:"Password Reset Request",text:message   })

      res.status(200).json({success:true, data:"Email sent"})
    }catch(error){
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save();

      return next(new ErrorResponse("Email could not be sent",500))
    }
  }catch(error){
    next(error)
  }
}

//password reset done
exports.resetpassword= async (req,res,next)=>{
  const resetPasswordToken = crypto.createHash("sha256").update(req.params.resetToken).digest("hex");

  try{
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire:{$gt:Date.now()}
    })

    if(!user){
      return next(new ErrorResponse("Invalid Reset Token",400))
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save()

    res.status(201).json({
      success:true,
      data:"Password Reset Success"
    })

  }catch(error){
    next(error)
  }
}

const sendToken = (user,statusCode,res) =>{
  const token = user.getSignedToken()
  res.status(statusCode).json({success:true,token,userId:user._id, username:user.username})
}
