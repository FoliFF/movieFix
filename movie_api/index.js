/* All Declerations occurs here */
const express = require('express'),
  bodyParser = require('body-parser'),
  uuid = require('uuid');
  morgan = require('morgan');

const app = express();

app.use(bodyParser.json());

app.use(express.static('public')); //This is for documentation.html in public folder.

let users = [
  {
    id: 1,
    name: "Olof",
    favoriteMovies: ['Inception']
  },
  {
    id: 2,
    name: "Leen",
    favoriteMovies: []
  }
];

/* List of Movies */
let movies = [ 
{
  Title: 'Inception',
  Director: {
    Name: 'Christopher Nolan',
    Bio: 'Best known for his cerebral, often nonlinear, storytelling, acclaimed writer-director.',
    Born: 'July 30, 1970 in London, England, UK'
  },
  Stars: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page'],
  Genre: {
    Name: "Sci-Fi",
    Description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project and his team to disaster."
  },
  ImagePath: "https://www.imdb.com/title/tt1375666/mediaviewer/rm3426651392/",
  Featured: true
},
{
  Title: 'The Dark Knight',
  Director: {
    Name: 'Christopher Nolan',
    Bio: 'Best known for his cerebral, often nonlinear, storytelling, acclaimed writer-director.',
    Born: 'July 30, 1970 in London, England, UK'
  },
  Stars: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart'],
  Genre: {
    Name: 'Action',
    Description: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice."
  },
  ImagePath: "https://www.imdb.com/title/tt0468569/mediaviewer/rm4023877632/",
  Featured: true
},  
{ 
  Title: 'The Lord of the Rings: The Fellowship of the Ring',
  Director: {
    Name: 'Peter Jackson',
    Bio: 'Sir Peter Jackson made history with The Lord of the Rings trilogy, becoming the first person to direct three major feature films simultaneously.',
    Born: 'October 31, 1961 in Pukerua Bay, North Island, New Zealand'
  },
  Stars: ['Elijah Wood', 'Orlando Bloom', 'Ian McKellen'],
  Genre: {
    Name: 'Fantasy',
    Description: "A meek Hobbit from the Shire and eight companions set out on a journey to destroy the powerful One Ring and save Middle-earth from the Dark Lord Sauron."
  },
  ImagePath: "https://www.imdb.com/title/tt0120737/mediaviewer/rm3592958976/",
  Featured: true
},
{
  Title: 'The Good, the Bad and the Ugly',
  Director: {
    Name: 'Sergio Leone',
    Bio: 'Sergio Leone was virtually born into the cinema - he was the son of Roberto Roberti (A.K.A. Vincenzo Leone)',
    Born: 'January 3, 1929 in Rome, Lazio, Italy'
  },
  Stars: ['Clint Eastwood', 'Eli Wallach', 'Lee Van Cleef'],
  Genre: {
    Name: 'Western',
    Description: "A bounty hunting scam joins two men in an uneasy alliance against a third in a race to find a fortune in gold buried in a remote cemetery."
  },
  ImagePath: "https://www.imdb.com/title/tt0060196/mediaviewer/rm1383786241/",
  Featured: true
}];

/*** CREATE USERS ***/
app.post('/users', (req, res) => {
  const newUser = req.body;

  if(newUser.name){
    newUser.id = uuid.v4();
    users.push(newUser);
    res.status(201).json(newUser);
  } else {
    res.status(400).send('Users need name')
  }
});

/*** UPDATE USERS ***/
app.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const updatedUser = req.body;

  let user = users.find(user => user.id == id);
  if(user){
    user.name = updatedUser.name;
    res.status(200).json(user);
  } else {
    res.status(400).send('Users not found')
  }
});

/*** CREATE: ADD MOVIE TO USER ***/
app.post('/users/:id/:movieTitle', (req, res) => {
  const { id, movieTitle } = req.params;

  let user = users.find(user => user.id == id);
  if(user){
    user.favoriteMovies.push(movieTitle);
    res.status(200).send(`${movieTitle} has been added to user ${id}'s array`);
  } else {
    res.status(400).send('Users not found')
  }
});

/*** DELETE: DELETE MOVIE FROM USER ***/
app.delete('/users/:id/:movieTitle', (req, res) => {
  const { id, movieTitle } = req.params;

  let user = users.find(user => user.id == id);
  if(user){
    user.favoriteMovies = user.favoriteMovies.filter(title => title !== movieTitle)
    res.status(200).send(`${movieTitle} has been removed from to user ${id}'s array`);
  } else {
    res.status(400).send('Users not found')
  }
});


/*** DELETE USER ***/
app.delete('/users/:id', (req, res) => {
  const { id } = req.params;

  let user = users.find(user => user.id == id);
  if(user){
    users = users.filter(title => user.id != id)
    res.status(200).send(`User ${id} has been deleted`);
  } else {
    res.status(400).send('Users not found')
  }
});

/**** GET REQUEST ****/
app.get('/', (req, res) => {
  res.send('Welcome to my movies club!');
});

app.get('/documentation', (req, res) => {                  
  res.sendFile('public/documentation.html', { root: __dirname });
});

/*** READ MOVIES ***/
app.get('/movies', (req, res) => {
  res.status(200).json(movies);
}); 

/*** READ MOVIE TITLE ***/
app.get('/movies/:title', (req, res) => {
  const { title } = req.params;
  const movie = movies.find(movie => movie.Title === title);

  if(movie){
    res.status(200).json(movie);
  } else {
    res.status(400).json('No such movie');
  }
}); 

/*** READ MOVIE GENRE ***/
app.get('/movies/genre/:genreName', (req, res) => {
  const { genreName } = req.params;
  const genre = movies.find(movie => movie.Genre.Name === genreName).Genre;

  if(genre){
    res.status(200).json(genre);
  } else {
    res.status(400).json('No such genre');
  }
}); 

/*** READ MOVIE DIRECTOR ***/
app.get('/movies/directors/:directorName', (req, res) => {
  const { directorName } = req.params;
  const director = movies.find(movie => movie.Director.Name === directorName).Director;

  if(director){
    res.status(200).json(director);
  } else {
    res.status(400).json('No such director');
  }
}); 

/**** END OF GET REQUEST ****/

// Listen For REQUEST
app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});


/************************************************/

/* Logging with Morgan */
app.use(morgan('common'));

app.get('/', (req, res) => {
  res.send('Welcome to my app!');
});
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