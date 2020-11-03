const { app, Menu, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

const env = process.env.NODE_ENV || 'dev';
const config = require('../config/' + env + '.js');

let preferences = JSON.parse(fs.readFileSync(config.preferencesPath))

let savePreferences = (prefs) => {
    console.log('Saving preferences', prefs);
    if (prefs) {
        fs.writeFileSync(config.preferencesPath, JSON.stringify(prefs));
    }
}

let displayPreferences = () => {
    const htmlPath = path.join(
        __dirname,
        '../preferences.html'
    );

    let html = fs.readFileSync(htmlPath, 'utf8');
    html = html.replace(/dark|light/, preferences.theme || 'dark');
    fs.writeFileSync(htmlPath, html);

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

    // let devtools = new BrowserWindow();
    // prefWindow.webContents.setDevToolsWebContents(
    //     devtools.webContents
    // );
    // prefWindow.webContents.openDevTools({ mode: 'detach' });

    prefWindow.on('close', function () {
        prefWindow = null;
    });

    ipcMain.on('select-dirs', async (event, arg) => {
        console.log('show dialog')
        const result = await dialog.showOpenDialog(prefWindow, {
            properties: ['openDirectory']
        })
        console.log('directories selected', result.filePaths)
        prefWindow.webContents.send('dirs-results', result.filePaths);
    })

    ipcMain.on('save-preferences', (event, prefs) => {
        savePreferences(prefs)
        if (preferences) {
            prefWindow.webContents.send('preferences-saved', prefs);
        }
    });
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
                click: displayPreferences
            },
            {
                label: preferences.theme === 'light' ? 'Switch to Dark mode' : 'Switch to Light mode',
                accelerator: 'ctrl+d', // shortcut
                click: () => { switchDarkMode(window) }
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
