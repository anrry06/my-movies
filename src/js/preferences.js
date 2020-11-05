const { ipcRenderer } = require('electron');
const fs = require('fs')

const env = process.env.NODE_ENV || 'dev';
const config = require('./config/' + env + '.js');

let preferences = JSON.parse(fs.readFileSync(config.preferencesPath))

console.log('preferences', preferences);

let pathList = document.querySelector('.pathList');
let removeButton = '<button class="btn btn-secondary float-right removePath">Remove</button>';
preferences.paths.forEach(path => {
    pathList.innerHTML += `<li class="list-group-item" data-path="${path}">${path} ${removeButton}</li>`;
});

let addPathButton = document.querySelector('#addPath');
addPathButton.onclick = e => {
    e.preventDefault();

    let newPath = document.querySelector('#pathResult').getAttribute('data-path')
    console.log('newPath', newPath);

    if(newPath){
        preferences.paths.push(newPath);
        ipcRenderer.send('save-preferences-path', preferences);

        pathList.innerHTML += `<li class="list-group-item" data-path="${newPath}">${newPath} ${removeButton}</li>`;
    }
}

let removePathButtons = document.querySelectorAll('.removePath');
removePathButtons.forEach(button => {
    button.onclick = e => {
        e.preventDefault();

        let pathToRemove = e.target.parentNode.getAttribute('data-path');
        console.log('pathToRemove', pathToRemove);

        preferences.paths.splice(preferences.paths.indexOf(pathToRemove), 1);
        ipcRenderer.send('save-preferences-path', preferences)

        e.target.parentNode.remove()
    }
})

let pathFolderInput = document.querySelector('#path');
pathFolderInput.onclick = e => {
    e.preventDefault();

    console.log('select-dirs');
    window.postMessage({
        type: 'select-dirs'
    })

    ipcRenderer.on('dirs-results', (event, data) => {
        console.log(data);

        if(data.length === 0){
            return false;
        }

        let folderPath = data[0].replace(/\\/g, '/');
        document.querySelector('#pathResult').innerHTML = folderPath;
        document.querySelector('#pathResult').setAttribute('data-path', folderPath)
    })
}

ipcRenderer.on('preferences-saved', (event, data) => {
    let alert = `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            Preferences Saved !
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>    
    `;
    let _html = document.querySelector('#preferences').innerHTML;
    document.querySelector('#preferences').innerHTML = alert + _html;

    setTimeout(() => {
        $('.alert').alert('close')
    }, 1000)
})
