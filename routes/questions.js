'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

const User = require('../models/user');

// Protect endpoints using JWT Strategy
router.use(passport.authenticate('jwt', { session: false, failWithError: true }));

router.get('/',(req,res,next) =>{
  console.log('REQ USER', req.user.id);
  console.log('GET WORKS');
  // console.log('current NODE',curNode);

  const userId = req.user.id;
  User.findById(userId)
    .populate('questions.question')
    .then(user =>{
      res.json(user.questions[user.head].question.lapineWord);
    })
    .catch(err => {
      next(err);
    });
});



router.get('/image',(req,res,next) =>{
  console.log('REQ USER', req.user.id);
  console.log('GET IMAGE WORKS');
  // console.log('current NODE',curNode);

  const userId = req.user.id;
  User.findById(userId)
    .populate('questions.question')
    .then(user =>{
      res.json(user.questions[user.head].question.imageURL);
    })
    .catch(err => {
      next(err);
    });
});

router.get('/attempts',(req,res,next) =>{
 
  console.log('GET ATTEMPTS WORKS');
  // console.log('current NODE',curNode);

  const userId = req.user.id;
  User.findById(userId)
    .populate('questions.question')
    .then(user =>{

      console.log('CurrentUser',user);
      res.json(user.questions[user.head].attempts);


    })
    .catch(err => {
      next(err);
    });
      
});

// get the number of correct answers

router.get('/correct',(req,res,next) =>{
 

  console.log('REQ USER', req.user.id);
  console.log('GET CORRECT WORKS');
  // console.log('current NODE',curNode);

  const userId = req.user.id;
  User.findById(userId)
    .populate('questions.question')
    .then(user =>{
      console.log('CurrentUser',user);
      res.json(user.questions[user.head].correctAnswers);
    })
    .catch(err => {
      next(err);
    });  
});

// get ALL questions

router.get('/all',(req,res,next) =>{
 

  console.log('REQ USER', req.user.id);
  console.log('GET ALL WORKS');
  // console.log('current NODE',curNode);

  const userId = req.user.id;
  User.findById(userId)
    .populate('questions.question')
    .then(user =>{
      console.log('CurrentUser',user);
      res.json(user.questions);
    })
    .catch(err => {
      next(err);
    });  
});

router.get('/hint',(req,res,next) =>{
  console.log('REQ USER', req.user.id);
  console.log('GET HINT WORKS');
  // console.log('current NODE',curNode);

  const userId = req.user.id;
  User.findById(userId)
    .populate('questions.question')
    .then(user =>{
     

      res.json(user.questions[user.head].question.englishWord[0]);


    })
    .catch(err => {
      next(err);
    });
});


router.post('/',(req,res,next) =>{
  console.log('user answer req body',req.body);
 
  const {guess} = req.body;
  const userId = req.user.id;

  User.findById(userId)
    .populate('questions.question')
    .then(user => {
      console.log('REQ USER ID POST',userId); 
       
      //Local variables having to do with the position
      let currIndex = user.head;
      let question = user.questions[currIndex];

      //Local variables having to do with the accuracy tracking
      let answer = user.questions[currIndex].question.englishWord;
      let correctGuess = true;

      //Increment attempt counter
      user.questions[currIndex].attempts += 1;

      // Compare our user input (guess) with our correct answer
      // console.log('answer',answer,'guess',guess); 
      if(answer === guess.replace(/\s+/g, '').toLowerCase()){
        correctGuess = true;
        user.questions[currIndex].correctAnswers +=1;
        user.questions[currIndex].mValue *= 2;
      }
      else{
        correctGuess = false;
        user.questions[currIndex].mValue = 1;
      }

      //Set head to the value of next pointer (unless it's the end)
      //This is what changes the word being displayed -
      //every time you send a post request, the head is set to the next item
      if (user.head === null) {
        user.head = 0;
      } else {
        user.head = question.next;
      }

      //Move the question back based on the mValue calculated above
      //temp variable that stores a copy of our current node and a counter
      let currNode = question;
      let counter = 0;

      //Loop until we reach our mValue (our new position)
      //Each iteration, move to the next node 
      while(counter !== question.mValue){
        if (currNode.mValue > user.questions.length) {
          currNode.mValue = user.questions.length - 1;
       
        }
        (currNode !== null) ?
          currNode = user.questions[currNode.next] : 
          currNode = user.questions[user.head];
        counter++;
      }
      
      //When the new position is reached, 
      //set the current nodes's next pointer value to the temporary node's next value
      //And the temporary next pointer's value to the original node's head
      //this effectively inserts the original node at a new position M spaces away from where it was originally
    
      question.next = currNode.next;
      currNode.next = currIndex;
     
      //below function is a mongoose method to update our DB with the modified properties 
      //and send a response back to the client
      user.save(function (err) {
        if (err) {
          next(err);
        }
        if(!correctGuess){
          let tempObj={
            answer,
            attempts : user.questions[currIndex].attempts,
            correctCount:  user.questions[currIndex].correctAnswers,
            // imageURL:''
           
          };
          res.json(tempObj);
        } else {
          let tempObj={
            answer:'',
            attempts : user.questions[currIndex].attempts,
            correctCount:  user.questions[currIndex].correctAnswers,
            // imageURL: user.questions[question.next].question.imageURL
          };
          res.json(tempObj);
        }

      });


    });




});




module.exports = router;