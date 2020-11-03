let utils = require('./utils');
let path = require('path');
const { exec } = require('child_process');

let movies = {
    getData: async function(paths){
        try {     
            let movies = await utils.getFilesList(paths);
            movies = await utils.processPossibleMovies(movies);
            movies = utils.sortMovies(movies);
            return movies;
        } catch (error) {
            throw error;
        }
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
