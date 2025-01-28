//require('dotenv').config({path:'./env'})
import {app} from './app.js'
import dotenv from 'dotenv'
dotenv.config({
    path:"./.env"
})
import connectDB from "./db/index.js";


connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is running at port : ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("MongoDb Connection Failed",err)
})









/*
import express from "express";
const app = express();

( async()=>{
    try{
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        app.on("error", (err) => {
            console.log("Error: ", err);
            throw err;
        });

        app.listen(process.env.PORT,()=>{
            console.log(`App is listing on port ${process.env.PORT}`)
        })
    }catch(e){
        console.log("Error: ", e);
        throw e;
    }
})()
*/
