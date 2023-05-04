/*
  todo.js -- Router for the ToDoList
*/
const express = require('express');
const router = express.Router();
const gpt_Item = require('../models/chat_item')
const User = require('../models/User')
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
/*
this is a very simple server which maintains a key/value
store using an object where the keys and values are lists of strings

*/

isLoggedIn = (req, res, next) => {
  if (res.locals.loggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}

// get the value associated to the key
router.get('/gpt/',
  isLoggedIn,
  async (req, res, next) => {
    const show = req.query.show
    const completed = show == 'completed'
    let items = []
    if (show) { // show is completed or todo, so just show some items
      items =
        await gpt_Item.find({ userId: req.user._id, completed })
          .sort({ completed: 1, priority: 1, createdAt: 1 })
    } else {  // show is null, so show all of the items
      items =
        await gpt_Item.find({ userId: req.user._id })
          .sort({ completed: 1, priority: 1, createdAt: 1 })

    }
    res.render('chatgpt', { items, show, completed });
  });



/* add the value in the body to the list associated to the key */
router.post('/gpt',
  isLoggedIn,
  async (req, res, next) => {
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: req.body.question,
    });
    const newQuestion = new gpt_Item(
      {
        question: req.body.question,
        answer: completion.data.choices[0].text,
        userId: req.user._id
      })
    await newQuestion.save();
    res.redirect('/gpt')
  });



router.get('/gpt/remove/:itemId',
  isLoggedIn,
  async (req, res, next) => {
    console.log("inside /todo/remove/:itemId")
    await gpt_Item.deleteOne({ _id: req.params.itemId });
    res.redirect('/gpt')
  });



// console.log(completion.data.choices[0].text);




// router.get('/todo/complete/:itemId',
//   isLoggedIn,
//   async (req, res, next) => {
//     console.log("inside /todo/complete/:itemId")
//     await gpt_Item.findOneAndUpdate(
//       { _id: req.params.itemId },
//       { $set: { completed: true } });
//     res.redirect('/toDo')
//   });

// router.get('/todo/uncomplete/:itemId',
//   isLoggedIn,
//   async (req, res, next) => {
//     console.log("inside /todo/complete/:itemId")
//     await gpt_Item.findOneAndUpdate(
//       { _id: req.params.itemId },
//       { $set: { completed: false } });
//     res.redirect('/toDo')
//   });

// router.get('/todo/edit/:itemId',
//   isLoggedIn,
//   async (req, res, next) => {
//     console.log("inside /todo/edit/:itemId")
//     const item =
//       await gpt_Item.findById(req.params.itemId);
//     //res.render('edit', { item });
//     res.locals.item = item
//     res.render('edit')
//     //res.json(item)
//   });

// router.post('/todo/updateTodoItem',
//   isLoggedIn,
//   async (req, res, next) => {
//     const { itemId, item, priority } = req.body;
//     console.log("inside /todo/complete/:itemId");
//     await gpt_Item.findOneAndUpdate(
//       { _id: itemId },
//       { $set: { item, priority } });
//     res.redirect('/toDo')
//   });

// router.get('/todo/byUser',
//   isLoggedIn,
//   async (req, res, next) => {
//     let results =
//       await gpt_Item.aggregate(
//         [
//           {
//             $group: {
//               _id: '$userId',
//               total: { $count: {} }
//             }
//           },
//           { $sort: { total: -1 } },
//         ])

//     results =
//       await User.populate(results,
//         {
//           path: '_id',
//           select: ['username', 'age']
//         })

//     //res.json(results)
//     res.render('summarizeByUser', { results })
//   });



module.exports = router;
