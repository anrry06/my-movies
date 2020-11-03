const util = require('util');
const glob = require('glob');
const promiseGlob = util.promisify(glob);
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const Stream = require('stream').Transform;
const nameToImdb = require('name-to-imdb');
const uniqueRandomArray = require('unique-random-array');

const env = process.env.NODE_ENV || 'dev';
const config = require('../config/' + env + '.js');

let debug = console.log;
let debugLow = console.log;

let utils = {
    getFilesList: async function (filesPaths) {
        try {
            let promisesFilesPaths = filesPaths.map(async fp => {
                let dirs = await promiseGlob(fp + '/*');
                dirs = dirs
                    .filter(dir => {
                        if (!fs.lstatSync(dir).isDirectory()) {
                            debug(` - Not a directory : ${dir}`);
                            return false;
                        }
                        return dir;
                    })
                    .map(dir => {
                        fp = fp.split('\\').join('/');
                        if(fp[fp.length - 1] !== '/') fp += '/';

                        let d = {};
                        d.path = dir;
                        d.name = utils.cleanName(dir, fp);
                        debugLow('Name cleaned -', d.name);
                        d.year = utils.getYear(dir, fp);
                        d.creationDate = new Date().toISOString();
                        return d;
                    });
                return dirs;
            });

            let results = await Promise.all(promisesFilesPaths);

            let movies = results.reduce((c, a) =>  [...a, ...c], []);

            return movies;
        } catch (error) {
            throw error;
        }
    },

    processPossibleMovies: async function(movies){
        try {
            debug(`Found ${movies.length} possible movies`);

            let moviesList = JSON.parse(fs.readFileSync(config.moviesPath));
            let oldMoviesList = JSON.parse(fs.readFileSync(config.oldMoviesPath));

            let found = [];

            movies = movies.map(m => {
                let exist = moviesList.findIndex(_m => _m.name === m.name);
                if (exist !== -1) {
                    debug(` - Found movie : ${m.name} - Allready exist`);
                    found.push(m.name);
                    return false;
                }
                debug(` - Found movie : ${m.name}`);
                return m;
            }).filter((m) => m !== false);

            debug(`Found ${movies.length} new movies`);

            let _oldMoviesList = moviesList.filter(m => found.indexOf(m.name) === -1).map(m => {
                m.archivedDate = new Date().toISOString();
                return m;
            });
            debug(`Archived ${_oldMoviesList.length} old movies`);

            oldMoviesList = oldMoviesList.concat(_oldMoviesList);
            fs.writeFileSync(config.oldMoviesPath, JSON.stringify(oldMoviesList));
            debug(`Total archived movies : ${oldMoviesList.length}`);

            moviesList = moviesList.filter(m => found.indexOf(m.name) !== -1);

            movies = movies.concat(moviesList);
            debug(`Total movies : ${movies.length}`);

            let imagesPath = config.imagesPath;

            debug(`Starting movie processing`);

            let i = 0;
            while(i < movies.length){
                let m = movies[i];
                debugLow(` - Processing movie ${m.name}`);

                if(!m.image || m.image.src === undefined){
                    debugLow(`  - Searching for images`);
                    let image = await utils.getImage(movies[i].name, movies[i].year)
        
                    if(image.src != null)
                        debugLow(`  - Image found`);
                    else 
                        debugLow(`  - Image not found`);

                    movies[i].image = image;
                } 
                
                if(m.image && m.image.src && m.image.id && !m.image.path){
                    debugLow(`  - Downloading image`);
                    await utils.downloadImage(m.image.src, path.join(imagesPath, m.image.id + '.jpg'));
                    debugLow(`  - Image downloaded`);
                    movies[i].image.path = path.join(imagesPath, movies[i].image.id + '.jpg');
                }
                i++;
            }

            debug(`Saving data`);
            fs.writeFileSync(config.moviesPath, JSON.stringify(movies));
            
            debug(`Total movies saved: ${movies.length}`);
            return movies;
        } catch (error) {
            throw error;
        }
    },

    cleanName: function (dirPath, mainPath) {
        dirPath = dirPath.replace(mainPath, '');
        if (dirPath.match(/\(\b(19|20)\d{2}\b\)/)) {
            dirPath = dirPath.split(/\(\b(19|20)\d{2}\b\)/)[0];
        }
        else if (dirPath.match(/\.19|20\d{2}\./)) {
            dirPath = dirPath.split(/\.19|20\d{2}\./)[0].replace(/\./g, ' ');
        }
        else if (dirPath.match(/\b(19|20)\d{2}\b/)) {
            dirPath = dirPath.split(/\b(19|20)\d{2}\b/)[0];
        }
        else if (dirPath.match(/\[\b1080p\b\]/)) {
            dirPath = dirPath.split(/\[\b1080p\b\]/)[0].replace(/\./g, ' ');
        }
        else if (dirPath.match(/\.(720|1080)p\./)) {
            dirPath = dirPath.split(/\.(720|1080)p\./)[0].replace(/\./g, ' ');
        }
        else if (dirPath.match(/\bx264\b/)) {
            dirPath = dirPath.split(/\bx264\b/)[0];
        }
        return dirPath.trim();
    },

    getYear: function (dirPath, mainPath) {
        dirPath = dirPath.replace(mainPath, '');
        if (dirPath.match(/\(\b(19|20)\d{2}\b\)/)) {
            dirPath = dirPath.match(/\b(19|20)\d{2}\b/)[0];
        }
        else if (dirPath.match(/\b(19|20)\d{2}\b/)) {
            dirPath = dirPath.replace(/\./g, ' ').match(/\b(19|20)\d{2}\b/)[0];
        } else {
            return '';
        }
        return dirPath.trim();
    },

    getImage: function (name, year) {
        return new Promise((resolve, reject) => {
            let opt = {
                'name': name,
                'year': year,
                'type': 'movie',
                'providers': 'imdbFind'
            }
            nameToImdb(opt, function (error, res, inf) {
                if (error) {
                    return reject(error);
                }
    
                let image = inf.meta && inf.meta.image ? inf.meta.image.src : null;
                let id = inf.meta && inf.meta.id ? inf.meta.id : null;
                resolve({ src: image, id: id });
            });
        });
    },

    downloadImage: function (url, imagePath) {
        return new Promise((resolve, reject) => {
            if (fs.existsSync(imagePath)) {
                return resolve();
            }
    
            var client = http;
            if (url.toString().indexOf('https') === 0) {
                client = https;
            }
            client.request(url, function (response) {
                var data = new Stream();
    
                response.on('data', function (chunk) {
                    data.push(chunk);
                });
    
                response.on('error', function (error) {
                    reject(error);
                });
    
                response.on('end', function () {
                    fs.writeFileSync(imagePath, data.read());
                    resolve();
                });
            }).end();
        })
    },

    getRandom: function (a) {
        let rand = uniqueRandomArray(a);
        return rand();
    },

    sortMovies: function(movies){
        function compare(a, b) {
            // Use toUpperCase() to ignore character casing
            const aname = a.name.toUpperCase();
            const bname = b.name.toUpperCase();

            let comparison = 0;
            if (aname > bname) {
                comparison = 1;
            } else if (aname < bname) {
                comparison = -1;
            }
            return comparison;
        }
        movies.sort(compare);
        return movies;
    }
};

module.exports = utils;
