let utils = require('./utils');
let path = require('path');
const { exec } = require('child_process');

// const paths = ['E:/films/', 'G:/movies/'];

let movies = {
    getData: function(paths, next){
        let run = function (i, next, data) {
            if (paths[i] === undefined) {
                return next(null, data);
            }
    
            let moviePath = path.resolve(paths[i]);

            console.log('getFilesList');
            utils.getFilesList(moviePath, function (error, movies) {
                if (error) {
                    return next(error);
                }

                console.log('movies length', movies.length);
    
                run(i + 1, next, movies);
            });
        };
        console.log('run getData');
    
        run(0, function (error, data) {
            if (error) {
                return next(error)
            }
            console.log('data length', data.length);
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
            data.sort(compare);
    
            next(null, data.slice(0, 10));
        });
    },

    start: function(path){
        console.log(path);
        exec(`start "" "${path}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
        });
    }
};

module.exports = movies;
