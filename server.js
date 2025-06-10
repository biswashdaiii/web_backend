import express from 'express'
import cors from'cors'
import 'dotenv/config'

//app config
const app = express()

const port = process.env.port||4000

//middle ware
 app.use (express.json())
 app.use(cors())

 //api endpoint
 app.get('/',(req,res)=>{
    res.send('Api working ge')
 })

 app.listen(port,()=>console.log("server started ",port) )