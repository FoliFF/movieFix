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

let allowedOrigins = ['http://localhost:8080', 'http://testsite.com', 'http://localhost:1234', 'https://foliffmovieflix.netlify.app/'];
const cors = require('cors');
//app.use(cors());
app.use(cors({
  origin: (origin, callback) => {
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1 ){ //If a specific origin isn't found on the list of allowed origins
      let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
      return callback(new Error( message ), false);
    }
    return callback(null, true);
  }
}));

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
/**
 * POST: Allow new users to register, Username password & Email are required fields!
 * Request body: Bearer token, JSON with user information
 * @returns user object
 */
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
/**
 * GET: Returns data on all users in the Database (user object) by username
 * Request body: Bearer token
 * @param users
 * @returns user object
 * @requires passport
 */
app.get('/users', passport.authenticate('jwt', { session: false}), (req, res) => {
  Users.find().then((users) => {
    res.status(200).json(users);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });  
});

/*** GET SPECIFIC USER ***/
/**
 * GET: Returns data on a single user (user object) by username
 * Request body: Bearer token
 * @param Username
 * @returns user object
 * @requires passport
 */
app.get('/users/:Username', passport.authenticate('jwt', { session: false}), (req, res) => {
  Users.findOne({ Username: req.params.Username }).then((users) => {
    res.status(200).json(users);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });  
});

/*** UPDATE USERS ***/
/**
 * PUT: Allow users to update their user info (find by username)
 * Request body: Bearer token, updated user info
 * @param Username
 * @returns user object with updates
 * @requires passport
 */
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
/**
 * POST: Allows users to add a movie to their list of favorities
 * Request body: Bearer token
 * @param username
 * @param movieId
 * @returns user object
 * @requires passport
 */
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
/**
 * DELETE: Allows users to remove a movie from their list of favorites
 * Request body: Bearer token
 * @param Username
 * @param movieId
 * @returns user object
 * @requires passport
 */
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
/**
 * DELETE: Allows existing users to deregister
 * Request body: Bearer token
 * @param Username
 * @returns success message
 * @requires passport
 */
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

/**
 * GET: Returns a list of favorite movies from the user
 * Request body: Bearer token
 * @param Username
 * @returns array of favorite movies
 * @requires passport
 */
app.get(  '/users/:Username/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOne({ Username: req.params.Username }).then((user) => { 
    if (user) {
      // If a user with the corresponding username was found, return user info
      res.status(200).json(user.FavoriteMovies);
    } else {
      res.status(400).send('Could not find favorite movies for this user');
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

app.post('/movies', passport.authenticate('jwt'), (req, res) => {
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
/**
 * GET: returns a list of ALL movies to the user
 * Request body: Bearer Token
 * @returns array of movie objects
 * @ requires passport
 */
app.get('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.find().then((movies) => {
    res.status(201).json(movies);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });  
}); 

/*** READ MOVIE TITLE ***/
/* GET: Returns data (description, genre, director, image URL, whether it's featured or not) about a single movie by title to the user
 * REquest body: Bearer token
 * @param Title (of movie)
 * @returns movie object
 * @requires passport
 */
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
/**
 * GET: Returns data about a genre (description) by name/title (e.g., "Fantasy")
 * Request body: Bearer token
 * @param Name (of genre)
 * @returns genre object
 * @requires passport
 */
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
/**
 * GET: Returns data about a director (bio, birth year) by name
 * Request body: Bearer token
 * @param Name (of director)
 * @returns director object
 * @requires passport
 */
app.get('/director/:name', passport.authenticate('jwt', { session: false}), (req, res) => {
  Movies.find({ 'Director.Name': req.params.name }).then((movie) => {
    res.json(movie);    
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });  
});

/**
 * GET: Returns welcome message fro '/' request URL
 * @returns Welcome message
 */

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