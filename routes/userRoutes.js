const express = require('express');
const router = express.Router();
const User = require('../models/user');
const {jwtAuthMiddleware, generateToken} = require('./../jwt');

router.post('/signup', async (req, res) => {
    try {
    const data = req.body; //assuming the request body contains the User data

    // Check if there is already an admin user
    const adminUser = await User.findOne({ role: 'admin' });
    if (data.role === 'admin' && adminUser) {
        return res.status(400).json({ error: 'Admin user already exists' });
    }

    // Validate Aadhar Card Number must have exactly 12 digit
    if (!/^\d{12}$/.test(data.aadharCardNumber)) {
        return res.status(400).json({ error: 'Aadhar Card Number must be exactly 12 digits' });
    }

    // Check if a user with the same Aadhar Card Number already exists
    const existingUser = await User.findOne({ aadharCardNumber: data.aadharCardNumber });
    if (existingUser) {
        return res.status(400).json({ error: 'User with the same Aadhar Card Number already exists' });
    }

    const newUser = new User(data); // create a new User document using the mongoose model

    const response = await newUser.save(); 
    console.log('data saved');// save the new userto the database

    const payload = {
        id: response._id,
    }
    console.log(JSON.stringify(payload));
    const token = generateToken(payload);
    console.log("Token is : ",token);

    res.status(200).json({response: response, token: token});
} 
catch (err) {
    console.log(err);
    res.status(500).json({error: 'Internal server error'});
}
   
})

//Login route

router.post('/login', async (req, res) => {
    try { 

const{aadharCardNumber, password} = req.body; //extract the aadharCardNumber and password from the request body

if (!aadharCardNumber || !password) {
    return res.status(400).json({ error: 'Aadhar Card Number and password are required' });
}

const user = await User.findOne({aadharCardNumber: aadharCardNumber}); //find the user with the given aadharCardNumber

if(!user || !(await user.comparePassword(password))){
    return res.status(404).json({error: 'Invalid aadharCardNumber or password'});
    //if the user is not found or the password is incorrect, return an error response
}

//generate a JWT token
const payload = {
    id: user.id,
}
const token = generateToken(payload);

//return the token
res.json({token})
}catch(err){
    console.log(err);
    res.status(500).json({error: 'Internal server error'}); 
}

});


//profile route

router.get('/profile', jwtAuthMiddleware, async (req, res) => {
    try {
        const userData = req.user;
        const userId = userData.id;
        const user= await User.findById(userId);
        res.status(200).json({user});
    } catch (err) {
        console.log(err);
        res.status(500).json({error: 'Internal server error'});
    }
});

//change password route

router.put('/profile/password',jwtAuthMiddleware, async (req,res) => {
    try {
        const userId = req.user; //Extract id from token

        const{currentPassword, newPassword} = req.body; //Extract currentPassword and newPassword from request body

        // Check if currentPassword and newPassword are present in the request body
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Both currentPassword and newPassword are required' });
        }

        const user = await User.findById(userId); //find the user with the given userid

         // If user does not exist or password does not match, return error
         if (!user || !(await user.comparePassword(currentPassword))) {
            return res.status(401).json({ error: 'Invalid current password' });
        }
 
        user.password = newPassword; //set the new password
        await user.save(); //save the updated user document 

        console.log('Password updated');
        res.status(200).json({message: 'Password updated successfully'});
    } catch (err) {
        console.log(err);
        res.status(500).json({error: 'Internal server error'});  
        
    }
});

module.exports = router;