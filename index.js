const express=require('express')
const app=express()
const mongoose=require('mongoose')

app.listen(3000,()=>{
    console.log("server is runnig in port 3000")
});
app.get('/',(req,res)=>{
    res.send("hello from node api uouou")

}
);
mongoose.connect("")