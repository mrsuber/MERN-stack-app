require('dotenv').config({path:"./config.env"})
const express = require('express')
const connectDB = require('./config/db')
const errorHandler = require('./middleware/error')
const path = require('path')
const multer = require("multer")
// working on generating pdf
const expressLayouts = require('express-ejs-layouts')


//connectDB
connectDB();

const app = express();

app.use(express.json())

//Error unhandler(should be last piece of middleware)
app.use(errorHandler)

// on developement routes
app.use('/api/auth',require('./routes/auth'))

//on production
if(process.env.NODE_ENV==="production"){
  app.use(express.static(path.join(__dirname,'/client/build')))
  // app.use('/api/auth',require('./routes/auth'))
  // app.use('/api/private',require('./routes/private'))
  // app.use('/api/fileupload', require('./routes/file-upload-routes'))

  app.get('*',(req,res)=>{
    res.sendFile(path.join(__dirname,'client','build','index.html'))

  })
}else{
  app.get('/', (req,res)=>{
    res.send('Api running');
  })
}

const PORT = process.env.PORT || 5000;

// const server = app.listen(PORT, ()=>console.log(`Server running on port http://192.168.150.101:${PORT}`))
const server = app.listen(PORT, ()=>console.log(`Server running on port http://localhost:${PORT}`))

//handle server crash error
process.on('unhandleRejection', (err,promise) =>{
  console.log(`Logged Error:${err}`)
  server.close(()=>process.exit(1))
})
