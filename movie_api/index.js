/* All Declerations occurs here */
const express = require('express'),
  morgan = require('morgan');

const app = express();

app.use(express.static('public')); //This is for documentation.html in public folder.

/* top 10 movies according to IMDB */
let topMovies = [ //Movies are subject to change.
  { 
    title: 'Harry Potter and the Sorcerer\'s Stone',
    author: 'J.K. Rowling'
  },
  {
    title: 'Lord of the Rings',
    author: 'J.R.R. Tolkien'
  },
  {
    title: 'Twilight',
    author: 'Stephanie Meyer'
  }
];

/* GET requests */
app.get('/', (req, res) => {
  res.send('Welcome to my movies club!');
});

app.get('/documentation', (req, res) => {                  
  res.sendFile('public/documentation.html', { root: __dirname });
});

app.get('/movies', (req, res) => {
  res.json(topMovies);
}); 



// listen for requests
app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});

/* Logging with Morgan */

app.use(morgan('common'));

app.get('/', (req, res) => {
  res.send('Welcome to my app!');
});

app.get('/secreturl', (req, res) => {
  res.send('This is a secret url with super top-secret content.');
});


/* Error Handling */
const bodyParser = require('body-parser'),
  methodOverride = require('method-override');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());
app.use(methodOverride());

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});


