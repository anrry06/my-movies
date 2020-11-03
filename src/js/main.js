const { ipcRenderer, remote } = require('electron');
const fs = require('fs');

const movies = require('./lib/movies');

const env = process.env.NODE_ENV || 'dev';
const config = require('./config/' + env + '.js');

console.log('main.js');

let preferences = JSON.parse(fs.readFileSync(config.preferencesPath))

movies.getData(preferences.paths, (error, data) => {
    if (error) {
        throw error;
    }

    console.log('data length', data.length);
    console.log(data);
    Movies.init({
        parent: document.body,
        data: data,
        openFolder: movies.start
    });
});

const themeConfig = new ThemeConfig();
themeConfig.initTheme(preferences.theme);

ipcRenderer.on('set-theme', (event, data) => {
    console.log('set-theme', data);
    themeConfig.displayTheme(data);
});
