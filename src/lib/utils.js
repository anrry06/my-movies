const glob = require('glob');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const Stream = require('stream').Transform;
const nameToImdb = require('name-to-imdb');
const uniqueRandomArray = require('unique-random-array');

const env = process.env.NODE_ENV || 'dev';
const config = require('../config/' + env + '.js');

let utils = {
    getFilesList: function (filesPath, next) {
        glob(filesPath + '/*', function (error, dirs) {
            if (error) {
                console.log(error);
                throw error;
            }

            console.log('filesPath', filesPath)
            filesPath = filesPath.split('\\').join('/') + '/';
            console.log('filesPath', filesPath)
            // console.log(dirs)

            let imagesPath = config.imagesPath;

            let rawdata = fs.readFileSync(config.moviesPath);
            let moviesList = JSON.parse(rawdata);

            let movies = dirs
                .map(function (dir) {
                    if (!fs.lstatSync(dir).isDirectory()) {
                        return false;
                    }
                    let d = {};

                    d.path = dir;
                    d.name = utils.cleanName(dir, filesPath);

                    let exist = moviesList.find((m) => m.name === d.name);
                    if (exist !== undefined) {
                        return false;
                    }

                    d.year = utils.getYear(dir, filesPath);
                    return d;
                })
                .filter((m) => m !== false);

            // return next(null, movies);

            movies = movies.concat(moviesList);
            console.log('run');
            let run = function (i, cb) {
                if (movies[i] === undefined) {
                    return cb();
                }

                let m = movies[i];

                if (m.image && m.image.src !== undefined) {
                    return run(i + 1, cb);
                }
                utils.getImage(movies[i].name, movies[i].year, function (error, image) {
                    if (error) {
                        return next(error);
                    }
                    movies[i].image = image;
                    run(i + 1, cb);
                });
            };

            run(0, function () {

                console.log('runDownload');
                let runDownload = function (i, cb) {
                    if (movies[i] === undefined) {
                        return cb();
                    }

                    let m = movies[i];

                    if (!m.image || !m.image.src || m.image.src === null || m.image.path) {
                        return runDownload(i + 1, cb);
                    }

                    utils.downloadImage(m.image.src, path.join(imagesPath, m.image.id + '.jpg'), function (error) {
                        if (error) {
                            return next(error);
                        }
                        movies[i].image.path = path.join(imagesPath, movies[i].image.id + '.jpg');
                        runDownload(i + 1, cb);
                    });
                };

                runDownload(0, function () {
                    fs.writeFileSync(config.moviesPath, JSON.stringify(movies));
                    next(null, movies);
                });
            });
        });
    },

    cleanName: function (dirPath, mainPath) {
        console.log(dirPath, mainPath)
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
        else {
            console.log('cleaned name', dirPath);
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

    getImage: function (name, year, next) {
        console.log('searching for ', name);
        let opt = {
            'name': name,
            'year': year,
            'type': 'movie',
            'providers': 'imdbFind'
        }
        nameToImdb(opt, function (error, res, inf) {
            if (error) {
                return next(error);
            }

            console.log('found image for ', name);
            let image = inf.meta && inf.meta.image ? inf.meta.image.src : null;
            let id = inf.meta && inf.meta.id ? inf.meta.id : null;
            next(null, { src: image, id: id });
        });
    },

    downloadImage: function (url, imagePath, next) {
        if (fs.existsSync(imagePath)) {
            return next();
        }

        console.log('dowloading ', url);
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
                next(error);
            });

            response.on('end', function () {
                console.log('saving ', imagePath);
                fs.writeFileSync(imagePath, data.read());
                next();
            });
        }).end();
    },

    getRandom: function (a) {
        let rand = uniqueRandomArray(a);
        return rand();
    }
};

module.exports = utils;
