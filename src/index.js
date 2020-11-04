const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

const env = process.env.NODE_ENV || 'dev';
const config = require('./config/' + env + '.js');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    // eslint-disable-line global-require
    app.quit();
}

const menu = require('./lib/menu');
const movies = require('./lib/movies');

const createWindow = () => {

    console.log('config.preferencesPath', config.preferencesPath)
    let preferences = JSON.parse(fs.readFileSync(config.preferencesPath))

    let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    html = html.replace(/\"(dark|light)\"/, `"${preferences.theme}"` || '"dark"');
    fs.writeFileSync(path.join(__dirname, 'index.html'), html);

    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: __dirname + '/icon.ico',
        // fullscreen: true,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true
        },
        show: false
    });

    mainWindow.maximize()
    mainWindow.show()

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    Menu.setApplicationMenu(menu(mainWindow))

    // Open the DevTools.
    mainWindow.webContents.openDevTools();
    mainWindow.webContents.on('did-finish-load', () => {
        console.log('did-finish-load');
        movies.getData(preferences.paths)
            .then(data => {
                console.log(data);
                console.log('send display-movies');
                mainWindow.webContents.send('display-movies', data);
            })
            .catch(error => {
                throw error;
            });
    });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
