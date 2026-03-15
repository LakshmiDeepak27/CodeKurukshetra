const mongoose= require('mongoose');
const bcrypt = require('bcryptjs')

const userSchema= new mongoose.Schema(
    {
        username:{
            type: String,
            required: true,
            trim:true,
            unique:true,
        },
        email:{
            type: String,
            required:true,
            unique: true,
            lowercase:true,
        },
        password:{
            type: String,
            required: true,
        },
        mobile:{
            type: String,
            required:true,
        },
        isVerified:{
            type: Boolean,
            default: false,
        },

    },
    {timestamps: true}
);

userSchema.pre('save' , async function(){
    if(!this.isModified("password")) return;
    const salt=await bcrypt.genSalt(10);
    this.password= await bcrypt.hash(this.password , salt);


});

const User=mongoose.model('User' , userSchema);
module.exports= User;