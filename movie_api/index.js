/* All Declerations occurs here */
const express = require('express'),
  bodyParser = require('body-parser'),
  uuid = require('uuid'),
  morgan = require('morgan');

const app = express(),
  mongoose = require('mongoose'),
  Models = require('./models.js'),
  Movies = Models.Movie,
  Users = Models.User;

mongoose.connect(process.env.CONNECTION_URI || 'mongodb://localhost:27017/test', //just added this line 
  { useNewUrlParser: true, useUnifiedTopology: true });

app.use(bodyParser.json());

app.use(express.static('public')); //This is for documentation.html in public folder.

const cors = require('cors');
app.use(cors());

const { check, validationResult } = require('express-validator');

/*** Intergrating auth.js file for authentication and authorization using HTTP and JWSToken ***/
let auth = require('./auth')(app); // it is placed here because it needs to be AFTER body parser is called.
const passport = require('passport');
require('./passport');

/*** Logging with Morgan ***/
app.use(morgan('common'));

/*** Error Handler ***/
const methodOverride = require('method-override');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(methodOverride());

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});
/*** END OF Error Handler ***/


/*** CREATE USERS ***/
app.post('/users', 
  /* Validation logic here for request
  you can either use a chain of methods like .not().isEmpty()
  which means "opposite of isEmpty" in plain english "is not empty"
  or use .isLength({min: 5}) which means
  minimum value of 5 characters are only allowed */
  [
    check('Username', 'Username is required').isLength({min: 5}),
    check('Username', 'Username contains non alphanumeric characters - not allowed').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail(),
  ], (req, res) => {
    // check the validation object for errors
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOne({ Username: req.body.Username }) // Search to see if a user with the requested username already exists
    .then((user) => {
      if (user) {
        return res.status(400).send(req.body.Username + 'already exists');
      } else {
        Users
          .create({
            Username: req.body.Username,
            Password: hashedPassword,
            Email: req.body.Email,
            Birthday: req.body.Birthday
          })
          .then((user) =>{res.status(201).json(user) })
          .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
        })
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

/*** GET USERS ***/
app.get('/users', passport.authenticate('jwt', { session: false}), (req, res) => {
  Users.find().then((users) => {
    res.status(200).json(users);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });  
}); 

/*** UPDATE USERS ***/
app.put('/users/:Username', passport.authenticate('jwt', { session: false}), (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username }, { $set: {
    Username: req.body.Username,
    Username: req.body.Password,
    Username: req.body.Email,
    Username: req.body.Birthday
  }
  }, { new: true }, // This line makes sure that the updated document is returned
  (err, updatedUser) => {
    if(err){
      console.error(err);
      res.status(500).send('Error: ' + err);
    } else {
      res.json(updatedUser);
    }
  });
});

/*** ADD MOVIE TO USER ***/
app.post('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false}), (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username }, {
    $push: { FavoriteMovies: req.params.MovieID }
  }, {new: true }, // This line makes sure that the updated document is returned
  (err, updatedUser) => {
    if(err){
      console.error(err);
      res.status(500).send('Error: ' + err);
    } else {
      res.json(updatedUser);
    }
  });
});

/*** DELETE MOVIE FROM USER ***/
app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false}), (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username }, {
    $pull: { FavoriteMovies: req.params.MovieID }
  }, {new: true }, // This line makes sure that the updated document is returned
  (err, updatedUser) => {
    if(err){
      console.error(err);
      res.status(500).send('Error: ' + err);
    } else {
      res.json(updatedUser);
    }
  });
});

/*** DELETE USER ***/
app.delete('/users/:Username', passport.authenticate('jwt', { session: false}), (req, res) => {
  Users.findOneAndRemove( { Username: req.params.Username }).then((user) => {
    if(!user){
      res.status(400).send(req.params.Username + ' was not found');
    } else{
      res.status(200).send(req.params.Username + ' was deleted.');
    }
  }).catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });
});

/**** END OF JSON FOR USERS ****/

/**** GET REQUEST ****/

app.get('/documentation', (req, res) => {                  
  res.sendFile('public/documentation.html', { root: __dirname });
});

/*** CREATE MOVIES ***/
/* We’ll expect JSON in this format
{
  ID: Integer,
  Title: String,
  Description: String,
  Genre: String,
  Director: String
} */

app.post('/movies', passport.authenticate('jwt', { session: false}), (req, res) => {
  Movies.findOne({ Title: req.body.Title })
    .then((movie) => {
      if (movie) {
        return res.status(400).send(req.body.Title + 'already exists');
      } else {
        Movies
          .create({
            Title: req.body.Title,
            Description: req.body.Description,
            Genre: req.body.Genre,
            Director: req.body.Director
          })
          .then((user) =>{res.status(201).json(user) })
        .catch((error) => {
          console.error(error);
          res.status(500).send('Error: ' + error);
        })
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

/*** READ MOVIES Return JSON object when at /movies ***/
app.get('/movies', passport.authenticate('jwt', { session: false}), (req, res) => {
  Movies.find().then((movies) => {
    res.status(201).json(movies);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });  
}); 

/*** READ MOVIE TITLE ***/
app.get('/movies/:Title', passport.authenticate('jwt', { session: false}), (req, res) => {
  Movies.findOne({ Title: req.params.Title }).then((movie) => {
    res.json(movie);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });  
}); 

/*** READ MOVIE GENRE ***/
app.get('/genre/:name', passport.authenticate('jwt', { session: false}), (req, res) => {
  Movies.find({ 'Genre.Name': req.params.name })
  .then((movie) => {
    res.json(movie);    
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });  
}); 

/*** READ MOVIE DIRECTOR ***/
app.get('/director/:name', passport.authenticate('jwt', { session: false}), (req, res) => {
  Movies.find({ 'Director.Name': req.params.name }).then((movie) => {
    res.json(movie);    
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });  
});

app.get('/', (req, res) => {
  res.send('Welcome to my myFlixMovie app!');
});

app.get('/documentation', (req, res) => {                  
  res.sendFile('public/documentation.html', { root: __dirname });
});

/**** END OF GET REQUEST ****/

/*** Listen For REQUEST ***/

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0',() => {
 console.log('Listening on Port ' + port);
});