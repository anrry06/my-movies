const { ipcRenderer } = require('electron');
const fs = require('fs');

const utils = require('./lib/utils');
const loader = require('./js/loader');

const env = process.env.NODE_ENV || 'dev';
const config = require('./config/' + env + '.js');

console.log('main.js');

let preferences = JSON.parse(fs.readFileSync(config.preferencesPath))

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
        buttonClick: utils.searchOnRarbg,
        type: 'archive'
    });
});

ipcRenderer.on('display-movies', (event, data) => {
    console.log('display-movies', data);
    loader.hide(data);
    document.querySelector('h1').innerHTML = 'Movies';
    if (document.getElementById('movies')) {
        document.getElementById('movies').remove();
    }
    Movies.init({
        parent: document.body,
        data: data,
        buttonClick: utils.start,
        type: 'movie'
    });
});

ipcRenderer.on('debug', (event, data) => {
    console.log('debug', data);
    loader.display(data);
});
