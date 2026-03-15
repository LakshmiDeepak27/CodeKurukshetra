const express = require('express');
const dotenv= require('dotenv');
const cors = require('cors');

const connectdb = require('./src/config/db')
const authRoutes = require('./src/routes/authRoutes');
const userRoutes=require('./src/routes/userRoutes');

dotenv.config();

//data base - mongodb connection 
connectdb();

const app=express();

const PORT= process.env.PORT || 5000;

app.use(cors({
    origin: "http://localhost:5173",
}));


app.use(express.json());

app.use("/api/auth" , authRoutes);
app.use("/api/user" , userRoutes);

app.get('/' , (req , res)=>{
    res.send("Backend started running");
});

app.listen(PORT , ()=>{
    console.log(`server started at port: ${PORT}`);
});

