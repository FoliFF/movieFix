const mongoose = require('mongoose');

let movieSchema = mongoose.Schema({
    Title: { Type: String, required: true },
    Description: {Type: String, required: true },
    Genre: {
        Name: String,
        Description: String
    },
    Director: {
        Name: String,
        Bio: String
    },
    Actors: [String],
    ImagePath: String,
    Featured: Boolean
});

let userSchema = mongoose.Schema({
    Username: { Type: String, required: true },
    Pasword: { Type: String, required: true },
    Email: { Type: String, required: true },
    Birthday: Date,
    FavoriteMovies: [{ Type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }]
});

let Movie = mongoose.model('Movie', movieSchema);
let User = mongoose.model('User', userSchema);

module.exports.Movie = Movie;
module.exports.User = User;