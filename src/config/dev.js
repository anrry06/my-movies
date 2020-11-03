const path = require('path');

module.exports = {
    'preferencesPath': path.join(__dirname, '..', 'data', 'preferences.json'),
    'moviesPath': path.join(__dirname, '..', 'data', 'movies.json'),
    'oldMoviesPath': path.join(__dirname, '..', 'data', 'old-movies.json'),
    'imagesPath': path.join(__dirname, '..', 'data', 'images')
};