const { ipcRenderer } = require('electron')

process.once('loaded', () => {
    let onMessage = evt => {
        if (evt.data.type === 'select-dirs') {
            ipcRenderer.send('select-dirs')
        }
    }
    window.removeEventListener('message', onMessage)
    window.addEventListener('message', onMessage)
})