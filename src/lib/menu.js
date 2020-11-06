const { app, Menu, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

const env = process.env.NODE_ENV || 'dev';
const config = require('../config/' + env + '.js');

const utils = require('../lib/utils');
const Json = require('../lib/json');

let preferencesJson = new Json(config.preferencesPath);
let preferences = preferencesJson.data;

let savePreferences = (prefs) => {
    console.log('Saving preferences', prefs);
    if (prefs) {
        preferencesJson.save(prefs);
    }
}

let displayPreferences = (mainWindow) => {
    const htmlPath = path.join(
        __dirname,
        '../preferences.html'
    );

    utils.replaceTheme(htmlPath, preferences.theme);

    let prefWindow = new BrowserWindow({
        y: 200,
        x: 200,
        width: 600,
        height: 500,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preloadPreferences.js'),
            nodeIntegration: true,
            enableRemoteModule: true
        },
    });
    prefWindow.removeMenu();
    prefWindow.loadURL(htmlPath);
    prefWindow.show();

    let devtools = new BrowserWindow();
    prefWindow.webContents.setDevToolsWebContents(
        devtools.webContents
    );
    prefWindow.webContents.openDevTools({ mode: 'detach' });

    let directoryDialog = null;

    let _selectDirs = async (event, arg) => {
        console.log('Show directory dialog')
        if(!directoryDialog){
            directoryDialog = await dialog.showOpenDialog(prefWindow, {
                properties: ['openDirectory']
            })
            console.log('Directories selected', directoryDialog.filePaths)
            prefWindow.webContents.send('dirs-results', directoryDialog.filePaths);
            directoryDialog = null;
        }
    }
    ipcMain.on('select-dirs', _selectDirs)

    let _savePreferences = (event, prefs) => {
        savePreferences(prefs)
        if (prefs) {
            prefWindow.webContents.send('preferences-saved', prefs);
        }
    }
    ipcMain.on('save-preferences', _savePreferences);

    let _savePreferencesPath = (event, prefs) => {
        savePreferences(prefs)
        if (prefs) {
            prefWindow.webContents.send('preferences-saved', prefs);
        }

        utils.mainWindow = mainWindow;
        utils.getData(prefs.paths)
            .then(data => {
                // console.log(data);
                console.log('Send display-movies');
                mainWindow.webContents.send('display-movies', data);
            })
            .catch(error => {
                throw error;
            });
    }
    ipcMain.on('save-preferences-path', _savePreferencesPath);

    prefWindow.on('close', function () {
        prefWindow = null;
        ipcMain.removeListener('select-dirs', _selectDirs)
        ipcMain.removeListener('save-preferences', _savePreferences);
        ipcMain.removeListener('save-preferences-path', _savePreferencesPath);
    });

}

let archivesShown = false;

let displayArchives = (mainWindow) => {
    let _menuConf = menuConf(mainWindow);
    let label = _menuConf[0].submenu[2].label;

    if(archivesShown === false){
        let archives = new Json(config.oldMoviesPath).data;
        mainWindow.webContents.send('display-archives', archives);
        label = 'Display Movies';
        archivesShown = true;
    } else {
        let movies = new Json(config.moviesPath).data;
        mainWindow.webContents.send('display-movies', movies);
        label = 'Display Archives';
        archivesShown = false;
    }

    _menuConf[0].submenu[2].label = label;
    Menu.setApplicationMenu(Menu.buildFromTemplate(_menuConf));
}

let switchDarkMode = (mainWindow) => {
    preferences.theme = preferences.theme === 'light' ? 'dark' : 'light';
    mainWindow.webContents.send('set-theme', preferences.theme);

    savePreferences(preferences);

    let _menuConf = menuConf(mainWindow);
    _menuConf[0].submenu[1].label = preferences.theme === 'light' ? 'Switch to Dark mode' : 'Switch to Light mode';
    Menu.setApplicationMenu(Menu.buildFromTemplate(_menuConf));
}

let menuConf = (window) => [
    {
        label: app.getName(),
        submenu: [
            {
                label: 'Preferences',
                accelerator: 'ctrl+,', // shortcut
                click: () => { displayPreferences(window) }
            },
            {
                label: preferences.theme === 'light' ? 'Switch to Dark mode' : 'Switch to Light mode',
                accelerator: 'ctrl+d', // shortcut
                click: () => { switchDarkMode(window) }
            },
            {
                label: 'Display Archives',
                click: () => { displayArchives(window) }
            },
        ],
    },
    {
        label: 'Edit',
        submenu: [
            { label: 'Undo', role: 'undo' },
            { label: 'Redo', role: 'redo' },
            { label: 'Cut', role: 'cut' },
            { label: 'Copy', role: 'copy' },
            { label: 'Paste', role: 'paste' },
        ],
    },
    {
        label: 'Reload',
        submenu: [
            { label: 'Reload', role: 'reload' },
            { label: 'Force reload', role: 'forceReload' }
        ],
    }
];

module.exports = function (window) {
    return Menu.buildFromTemplate(menuConf(window));
};
