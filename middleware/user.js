const User = require('../models/User')
const ResetToken = require('../models/ResetToken')
const ErrorResponse = require('../utils/errorResponse')
const {isValidObjectId} = require('mongoose')





exports.isResetTokenValid = async (req,res,next)=>{

  const {token, id} = req.query

  if(!token || !id){
    res.status(400).json({msg:"Invalid request1"})
    return next(new ErrorResponse("Invalid request", 400))

  }
  if(!isValidObjectId(id)){
    res.status(400).json({msg:"Invalid request"})
    return next(new ErrorResponse("Invalid request", 400))

  }
  const user = await User.findById(id)

  if(!user){
    res.status(400).json({msg:"user not found"})
    return next(new ErrorResponse("user not found", 400))

  }

  const resetToken = await ResetToken.findOne({owner:user._id})

  if(!resetToken){
    res.status(400).json({msg:"Reset token not found!"})
    return next(new ErrorResponse("Reset token not found!", 400))

  }

    const isValid = await resetToken.compareToken(token)
    if(!isValid){
      res.status(400).json({msg:"Reset token is invalid!"})
      return next(new ErrorResponse("Reset token is invalid!", 400))

    }

    req.user = user
    next()
}
