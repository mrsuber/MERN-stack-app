const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const ResetTokenSchema = new mongoose.Schema({
  owner:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required:true
  },
  token:{
    type:String,
    required: true,
  },
  createdAt:{
    type:Date,
    expires: 3600,
    default: Date.now()
  }
})

ResetTokenSchema.pre("save", async function(next){
  if(!this.isModified("token")){
    next()
  }

  const salt =await bcrypt.genSalt(10)
  this.token=await bcrypt.hash(this.token,salt)
  next();
});

ResetTokenSchema.methods.compareToken = async function(token){
  return await bcrypt.compare(token, this.token)
};



const ResetToken = mongoose.model("ResetToken",ResetTokenSchema);

module.exports=ResetToken;
