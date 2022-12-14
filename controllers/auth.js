const crypto = require("crypto")
const User = require('../models/User')
const ErrorResponse = require('../utils/errorResponse')
const VerificationToken = require('../models/VerificationToken')
const ResetToken = require('../models/ResetToken')

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

//check email
const handleOnChange = ( email ) => {

  // don't remember from where i copied this code, but this works.
  let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  if ( re.test(email) ) {
      return true
  }
  else {
      return false
  }

}

//create randomBytes
const createRandomBytes = () =>
new Promise((resolve, reject) =>{
  crypto.randomBytes(30, (err,buff) =>{
    if(err) reject(err)
    const token = buff.toString('hex')
    resolve(token)
  })
})

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


// //reset user password
// exports.forgotpassword= async (req,res,next)=>{
//   const {email} = req.body;
//
//   if(handleOnChange(email)===false){
//     res.status(400).json({msg:"This email is invalid"})
//     return next(new ErrorResponse("This email is invalid", 400))
//   }
//     try{
//       const user=await User.findOne({email})
//
//       if(!user){
//         return next(new ErrorResponse("Email could not be sent",404))
//       }
//       // const resetToken = user.getResetPasswordToken()
//       const token = await ResetToken.findOne({owner:user._id})
//       if(token){
//         res.status(400).json({msg:"only one hour you can request another token"})
//         return next(new ErrorResponse("only one hour you can request another token", 400))
//
//       }
//       const randomBytes = await createRandomBytes()
//       const resetToken = new ResetToken({owner: user._id, token:randomBytes})
//       await resetToken.save();
//       mailTransport().sendMail({
//         form:'winetastingSecurity@winetasting.com',
//         to: user.email,
//         subject:'Password Reset',
//         html: generatePasswordResetTemplate(`http://localhost:3000/reset-password?token=${randomBytes}&id=${user._id}`)
//       })
//
//       res.status(200).json({success:true,message:'Password reset link is sent to your email.'})
//
//     }catch(error){
//       next(error)
//     }
// }

// //password reset done
// exports.resetpassword= async (req,res,next)=>{
//   const {token, id} = req.query
//   if(!token || !id){
//     res.status(400).json({msg:"Invalid request1"})
//     return next(new ErrorResponse("Invalid request", 400))
//
//   }
//   if(!isValidObjectId(id)){
//     res.status(400).json({msg:"Invalid request"})
//     return next(new ErrorResponse("Invalid request", 400))
//
//   }
//
//   const user = await User.findById(id)
//   if(!user){
//     res.status(400).json({msg:"user not found"})
//     return next(new ErrorResponse("user not found", 400))
//
//   }
//
//   const resetToken = await ResetToken.findOne({owner:user._id})
//
//   if(!resetToken){
//     res.status(400).json({msg:"Reset token not found!"})
//     return next(new ErrorResponse("Reset token not found!", 400))
//
//   }
//
//   const isValid = await resetToken.compareToken(token)
//   if(!isValid){
//     res.status(400).json({msg:"Reset token is invalid!"})
//     return next(new ErrorResponse("Reset token is invalid!", 400))
//
//   }
//
//   req.user = user
//
//   const {password} = req.body
//   if(!password){
//     res.status(400).json({msg:"Please input new password"})
//     return next(new ErrorResponse("Please input new password", 400))
//
//   }
// try{
//
//   const user = await User.findById(req.user._id).select('+password')
//
//
//   if(!user){
//     res.status(400).json({msg:"User not found"})
//     return next(new ErrorResponse("User not found", 400))
//
//   }
//
//   const isSamePassword = await user.matchPasswords(password)
//   if(isSamePassword){
//     res.status(400).json({msg:"New Password must be different"})
//     return next(new ErrorResponse("New Password must be different", 400))
//
//   }
//
//   if(password.trim().length < 6 || password.trim().length >20 ){
//    res.status(400).json({msg:"Password mustbe at least 6 to 20 characters"})
//    return next(new ErrorResponse("Password mustbe at least 6 to 20 characters", 400))
//
//   }
//   user.password = password.trim()
//   await user.save()
//   const resetToken = await ResetToken.findOneAndRemove({owner:user._id})
//
//   mailTransport().sendMail({
//     form:'winetastingSecurity@winetasting.com',
//     to: user.email,
//     subject:'Password Reset Successfully',
//     html: generatePasswordResetTemplateSuccess('Password Reset Successfully', 'Now you can login with new password')
//   })
//   res.status(201).json({
//     success:true,
//     data:"Password Reset Success"
//   })
//
// }catch(error){
//   next(error)
// }
// }

const sendToken = (user,statusCode,res) =>{
  const token = user.getSignedToken()
  res.status(statusCode).json({success:true,token,userId:user._id, username:user.username})
}
