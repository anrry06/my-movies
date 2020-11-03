const { ipcRenderer, remote } = require('electron');
const fs = require('fs');

const movies = require('./lib/movies');

const env = process.env.NODE_ENV || 'dev';
const config = require('./config/' + env + '.js');

console.log('main.js');

let preferences = JSON.parse(fs.readFileSync(config.preferencesPath))

movies.getData(preferences.paths)
    .then(data => {
        console.log(data);
        Movies.init({
            parent: document.body,
            data: data,
            buttonClick: movies.start,
            type: 'movie'
        });
    })
    .catch(error => {
        throw error;
    });

const themeConfig = new ThemeConfig();
themeConfig.initTheme(preferences.theme);

ipcRenderer.on('set-theme', (event, data) => {
    console.log('set-theme', data);
    themeConfig.displayTheme(data);
});

ipcRenderer.on('display-archives', (event, data) => {
    console.log('display-archives', data);
    document.querySelector('h1').innerHTML = 'Archives';
    document.getElementById('movies').remove();
    Movies.init({
        parent: document.body,
        data: data,
        buttonClick: movies.searchOnRarbg,
        type: 'archive'
    });
});

ipcRenderer.on('display-movies', (event, data) => {
    console.log('display-movies', data);
    document.querySelector('h1').innerHTML = 'Movies';
    document.getElementById('movies').remove();
    Movies.init({
        parent: document.body,
        data: data,
        buttonClick: movies.start,
        type: 'movie'
    });
});
