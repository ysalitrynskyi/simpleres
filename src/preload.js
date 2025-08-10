const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    getDisplays: () => ipcRenderer.invoke('get-displays'),
    setResolution: (resolutionString) => ipcRenderer.invoke('set-resolution', { resolutionString }),
    quitApp: () => ipcRenderer.send('quit-app'),
    hideWindow: () => ipcRenderer.send('hide-window'),
});
