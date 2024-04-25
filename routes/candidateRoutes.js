const express = require('express');
const router = express.Router();
const User = require('../models/user');
const {jwtAuthMiddleware, generateToken} = require('../jwt');
const Candidate = require('../models/candidate');


const checkAdminRole = async(userId) => {
    try{
        const user = await User.findById(userId);
        return user.role === 'admin';
    }catch(err){
        return false;
    }
}
//POST route to add a candidate
router.post('/', jwtAuthMiddleware, async (req, res) => {
    try {
        if(! await checkAdminRole(req.user.id))
         return res.status(403).json({error: 'You do not have permission to perform this action'});
    

    const data = req.body; //assuming the request body contains the candidate data

    const newCandidate = new Candidate(data); // create a new User document using the mongoose model

    const response = await newCandidate.save(); 
    console.log('data saved');// save the new userto the database
    res.status(200).json({response: response});
} 
catch (err) {
    console.log(err);
    res.status(500).json({error: 'Internal server error'});
}
   
})

//change password route

router.put('/:candidateID', jwtAuthMiddleware, async (req,res) => {
    try {
        if(!checkAdminRole(req.user.id))
         return res.status(403).json({error: 'You do not have permission to perform this action'});

        const candidateId = req.params.candidateID; //Extract id from request parameters
        const updatedCandidateData = req.body; //Extract updated data from request body

        const response = await Candidate.findByIdAndUpdate(candidateId, updatedCandidateData, {
            new: true,  //return the updated document
            runValidators: true //run the model validators
        } )

        if(!response){
            return res.status(404).json({error: 'Candidate not found'});
        }

        console.log('Candidate updated');
        res.status(200).json({response: response});
    } catch (err) {
        console.log(err);
        res.status(500).json({error: 'Internal server error'});
    }

});

//delete route

router.delete('/:candidateID', jwtAuthMiddleware, async (req,res) => {
    try {
        if(!checkAdminRole(req.user.id))
         return res.status(403).json({error: 'You do not have permission to perform this action'});

        const candidateId = req.params.candidateID; //Extract id from request parameters

        const response = await Candidate.findByIdAndDelete(candidateId);

        if(!response){
            return res.status(404).json({error: 'Candidate not found'});
        }

        console.log('Candidate deleted');
        res.status(200).json({response: response});
    } catch (err) {
        console.log(err);
        res.status(500).json({error: 'Internal server error'});
    }

});

//lets start voting

router.post('/vote/:candidateID', jwtAuthMiddleware, async (req,res) => {
    //no admin can vote
    //user can only vote once

    candidateId = req.params.candidateID;
    userId = req.user.id;

    try {

        //find the candidate with the candidateID
        const candidate = await Candidate.findById(candidateId);
        if(!candidate){
            return res.status(404).json({error: 'Candidate not found'});
        }

        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({error: 'User not found'});
        }
        if(user.isVoted){
            return res.status(400).json({error: 'You have already voted'});
        }
        if(user.role === 'admin'){
            return res.status(403).json({error: 'Admins cannot vote'});
        }
        
        //update the candidate vote count
        candidate.votes.push({user: userId});
        candidate.voteCount++;
        await candidate.save();

        //update the user isVoted status
        user.isVoted = true;
        await user.save();

        return res.status(200).json({response: 'Vote recorded successful'});

    }catch(error){
        console.log(error);
        return res.status(500).json({error: 'Internal server error'});
        }   
});

//vote count
router.get('/vote/count', async (req,res) => {
    try {
        //find the candidate with the candidateID and sort by vote count
        const candidates = await Candidate.find().sort({voteCount: 'desc'});

        //map the candidates to only return the candidate name and vote count
    
        const voteRecord = candidates.map((data)=> {
            return {
                party: data.party,
                count: data.voteCount
            }
        });

        return res.status(200).json({voteRecord})

    } catch (err) {
        console.log(err);
        res.status(500).json({error: 'Internal server error'});
    }
});

router.get('/', async (req, res) => {
    try{
        //list all candidates
        const candidates = await Candidate.find({}, 'name party _id');
        res.status(200).json({candidates});

    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal server error'});
    }
})



module.exports = router;