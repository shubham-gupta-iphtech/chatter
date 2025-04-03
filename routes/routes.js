import express from "express"
import User from "../models/users.js"
import bcrypt from "bcrypt"
import jwt, { decode } from "jsonwebtoken"
import authMiddleware from "../middlewares/auth.js";
import { generateAccessToken, generateRefreshToken } from "../utils/generateTokens.js";
import {validateSignup, validateLogin} from "../middlewares/validation.js";

const router = express.Router();

// register user
router.post("/register",validateSignup,async (req,res)=> 
{
   try {
     const {name, email, password} = req.body;
    
     //check for whether user already exists or not
     const user = await User.findOne({email});
 
     if(user)
     {
         return res.json({message: "user registered successfully"});
     }
 
     const genSalt = await bcrypt.genSalt(10);
     const hashedPassword = await bcrypt.hash(password,genSalt);
 
      const newuser = new User({name, email, password:hashedPassword});
      await newuser.save();
      return res.json({message: "user registered successfully"});
      
 
   } catch (error) {
    res.json({message: "some error occured while registering the user."});
   }
})

//login user
router.post("/login", validateLogin, async (req,res)=> 
{
   try {
      const {email, password} = req.body;
     
      if(!(email || password)) return res.json({message: "email or password is missing"});
      
      const user = await User.findOne({email});
      
      if(!user) return res.json({message: "user not found"});
      console.log(user.password);
      const isMatch = await bcrypt.compare(password,user.password);
      if(!isMatch)
      {
         return res.json({message: "incorrect password"});
      }
      
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      
      //saved refresh token
      user.refreshToken = refreshToken;
      await user.save();
   
      //sending refresh token
      res.cookie('refreshToken',refreshToken, {httpOnly: true, secure: true, sameSite:'Strict'});
      res.json({accessToken, user: {id: user._id, username: user.username, email: user.email}});
      
   
   } catch (error) {
      res.json({message: "there was an error in logging in"});
   }
   

})

//route for refreshing the token
router.post("/refresh",async (req,res)=> 
{
 try {
     const refreshToken = req.cookies.refreshToken;
     if(!refreshToken) return res.json({message: "no cookie found"});
  
     //checking whether that user exist in the database with that refrsh token 
     const user = User.findOne({refreshToken});
     if(!user) return res.json({message: "invalid refresh token"});
  
     // verifying jwt token 
     jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err,decoded)=> {
        if(err) return res.json({message: "invalid refresh token"});
  
        //sending tokens
        const newAccessToken = generateAccessToken(user);
        res.json({accessToken: newAccessToken});
        
     });
 } catch (error) {
   res.json("error generating new refresh token");
 }
}) 


//protected route
router.get("/profile",authMiddleware, async(req,res)=> 
{
try {
      const user = await User.findById(req.user.id).select('-password');
      res.json({message: "user found successfully"});
} catch (error) {
     res.json({message: "cannot get profile"});
}

})


//logout 

router.post("/logout",async (req,res)=> 
{
 try {
      const user = await User.findOneAndUpdate({refreshToken: req.cookies.refreshToken},{refreshToken: null}, {new: true});
      if(!user) return res.json({message: "user not found"});
       
      res.clearCookie('refreshToken',{httpOnly: true, secure: true, sameSite: 'Strict'});
      res.json({message: "logged out successfully"});
 } catch (error) {
   res.json("error while logging out");

 }

})


export default router;

