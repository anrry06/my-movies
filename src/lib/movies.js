let utils = require('./utils');
const { exec } = require('child_process');

let movies = {
    mainWindow: null,
    getData: async function(paths){
        try {
            utils.mainWindow = this.mainWindow;
            let movies = await utils.getFilesList(paths);
            movies = await utils.processPossibleMovies(movies);
            return movies;
        } catch (error) {
            throw error;
        }
    },

    start: function(path){
        console.log('start', path);
        exec(`start "" "${path}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            if(stdout !== '')
                console.log(`stdout: ${stdout}`);
            if(stderr !== '')
                console.error(`stderr: ${stderr}`);
        });
    },

    searchOnRarbg: function(name){
        console.log('searchOnRarbg', name);
        exec(`start chrome.exe "https://rarbgproxy.org/torrents.php?search=${name}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            if(stdout !== '')
                console.log(`stdout: ${stdout}`);
            if(stderr !== '')
                console.error(`stderr: ${stderr}`);
        });
    }
};

module.exports = movies;
