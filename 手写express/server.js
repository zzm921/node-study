let express=require('express')
let app=express()

app.listen('3333')
app.get('/',(req,res,next)=>{
    res.send('hello')
})