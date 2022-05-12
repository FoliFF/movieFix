/* All Declerations occurs here */
const express = require('express'),
  bodyParser = require('body-parser'),
  uuid = require('uuid'),
  morgan = require('morgan');

const app = express(),
mongoose = require('mongoose'),
Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;
const Genres = Models.Genre;
const Directors = Models.Director

mongoose.connect('mongodb://localhost:27017/test', { useNewUrlParser: true, useUnifiedTopology: true });

app.use(bodyParser.json());

app.use(express.static('public')); //This is for documentation.html in public folder.

/*** CREATE USERS ***/
/* We’ll expect JSON in this format
{
  ID: Integer,
  Username: String,
  Password: String,
  Email: String,
  Birthday: Date
} */

app.post('/users', (req, res) => {
  Users.findOne({ Username: req.body.Username })
    .then((user) => {
      if (user) {
        return res.status(400).send(req.body.Username + 'already exists');
      } else {
        Users
          .create({
            Username: req.body.Username,
            Password: req.body.Password,
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
app.get('/users', (req, res) => {
  Users.find().then((users) => {
    res.status(200).json(users);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });  
}); 

/*** UPDATE USERS ***/
app.put('/users/:Username', (req, res) => {
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

/*** CREATE: ADD MOVIE TO USER ***/
app.post('/users/:Username/movies/:MovieID', (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username }, {
    $push: { favoriteMovies: req.params.MovieID }
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

/*** DELETE: DELETE MOVIE FROM USER ***/
app.delete('/users/:Username/movies/:MovieID', (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username }, {
    $pull: { favoriteMovies: req.params.MovieID }
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
app.delete('/users/:Username', (req, res) => {
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

/*** READ MOVIES Return JSON object when at /movies ***/
app.get('/movies', (req, res) => {
  Movies.find().then((movies) => {
    res.status(200).json(movies);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });  
}); 

/*** READ MOVIE TITLE ***/
app.get('/movies/:Title', (req, res) => {
  Movies.findOne({ Title: req.params.Title }).then((movie) => {
    res.json(movie);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });  
}); 

/*** READ MOVIE GENRE ***/
app.get('/genre/:Name', (req, res) => {
  Genres.findOne({ Name: req.params.Name }).then((genre) => {
    res.json(genre.Description);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });  
}); 

/*** READ MOVIE DIRECTOR ***/
app.get('/director/:Name', (req, res) => {
  Directors.findOne({ Name: req.params.Name }).then((director) => {
    res.json(director);
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

// Listen For REQUEST
app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});


/************************************************/

/* Logging with Morgan */
app.use(morgan('common'));

/* END OF Logging with Morgan */

/* Error Handling */
const methodOverride = require('method-override');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());
app.use(methodOverride());

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});
/* END OF Error Handling */