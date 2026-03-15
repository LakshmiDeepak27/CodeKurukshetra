const jwt= require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const User = require('../models/User');
// async function handleUserSignUp(req,res){
//     const {username , email , password} = req.body;
//     await User.create({
//         username,
//         email,
//         password,
//     });
//     return res.render("home")
// }


exports.register = async (req , res)=>{
    // try{
    //     res.json({message: "Register route working"});
    // }catch(error){
    //     res.status(500).json({message: "Server Error"});
    // }
    // try{
    //     console.log(req.body);
    //     res.json({
    //         message: "Data received",
    //         data: req.body
    //     });
    // }catch(error){
    //     res.start(500).json({message:"server error"});
    // }

    try{
        const {username , email , password , mobile  , agreeToTerms} = req.body;

        if (!agreeToTerms) {
  return res.status(400).json({ message: "You must agree to terms" });
}

        if(!username || !email || !password || !mobile){
            return res.status(400).json({message: "All field required"});
        }

        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({message : "User already exists"});
        }


        const user= await User.create({
            username,
            email,
            password,
            mobile,
        });
        res.status(201).json({
            message: "User registered successfully",
            userId: user._id
        });
    }catch(error){
        console.log("register error" , error);
       return res.status(500).json({message: "Server error"});
    }
};


exports.login = async(req , res)=>{
    try{
         console.log("LOGIN BODY 👉", req.body);
        const {email,password}= req.body;

        if(!email||!password){
            return res.status(400).json({message:"All fields are required"});
        }

        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({message:"Invalid Credentials"});
        }

        const isMatch = await bcrypt.compare(password , user.password);
        if(!isMatch){
            return res.status(400).json({message:"Invalid Credentials"})
        }
        //   return res.status(200).json({
        //     email:user._id,
        //     username: user.username
        // });

        //jwt implementation 

        const token=jwt.sign(
            {id:user._id},
            process.env.JWT_SECRET_KEY,
            {expiresIn:process.env.JWT_EXPRESS_IN}
        );

        return res.status(200).json({
            message:"login successfully",
            token
        });

      
    }catch(error){
        console.log("Error from Login: " , error);
        return res.status(500).json({
            message:"Server Error"
        });
    }
};




//user profile

exports.   getProfile = async (req, res) => {
  try {
    // userId comes from JWT middleware
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile fetched successfully",
      user
    });

  } catch (error) {
    console.error("PROFILE ERROR ", error);
    return res.status(500).json({ message: "Server error" });
  }
};