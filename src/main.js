const { app, BrowserWindow, Tray, ipcMain, screen, nativeImage, dialog } = require('electron');
const path = require('path');
const { execFile } = require('child_process');
const fs = require('fs');

let tray = null;
let mainWindow = null;
let primaryDisplayPersistentId = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 360,
        height: 130,
        show: false,
        frame: false,
        resizable: false,
        transparent: true,
        webPreferences: {
            // This path is correct because preload.js is in the same 'src' directory
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    // **FIX:** Correct path to index.html (go up one level from 'src')
    mainWindow.loadFile(path.join(__dirname, '../index.html'));

    mainWindow.on('blur', () => {
        if (!mainWindow.webContents.isDevToolsOpened()) {
            mainWindow.hide();
        }
    });
}

const toggleWindow = () => {
    if (mainWindow.isVisible()) {
        mainWindow.hide();
    } else {
        showWindow();
    }
}

const showWindow = () => {
    const trayBounds = tray.getBounds();
    const windowBounds = mainWindow.getBounds();
    const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2));
    const y = Math.round(trayBounds.y + trayBounds.height);
    mainWindow.setPosition(x, y, false);
    mainWindow.show();
    mainWindow.focus();
}

function getDisplayPlacerPath() {
    const intelPath = '/usr/local/bin/displayplacer';
    const appleSiliconPath = '/opt/homebrew/bin/displayplacer';

    if (fs.existsSync(appleSiliconPath)) return appleSiliconPath;
    if (fs.existsSync(intelPath)) return intelPath;
    return null;
}

app.on('ready', () => {
    // **FIX:** Correct path to the binary for development mode
    const screenresolutionPath = app.isPackaged
        ? path.join(process.resourcesPath, 'screenresolution')
        : path.join(__dirname, '../bin/screenresolution');

    const displayplacerPath = getDisplayPlacerPath();
    let missingDependencies = [];

    if (!fs.existsSync(screenresolutionPath)) {
        missingDependencies.push('- The "screenresolution" executable is missing.');
    }
    if (!displayplacerPath) {
        missingDependencies.push('- The "displayplacer" utility is not installed.');
    }

    if (missingDependencies.length > 0) {
        const errorMessage = "SimpleRes cannot start due to missing dependencies:\n\n" +
            missingDependencies.join('\n') +
            "\n\nPlease follow the installation instructions in the README.md file.\n\n" +
            "To install displayplacer, run:\nbrew install displayplacer";

        dialog.showErrorBox("Dependency Error", errorMessage);
        app.quit();
        return;
    }

    createWindow();
    // **FIX:** Correct path to the icon
    const iconPath = path.join(__dirname, '../assets/icon.png');
    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(icon.resize({ width: 16, height: 16 }));
    tray.setToolTip('SimpleRes');
    tray.on('click', toggleWindow);
});


ipcMain.handle('get-displays', async () => {
    const displays = screen.getAllDisplays();
    const screenresolutionPath = app.isPackaged
        ? path.join(process.resourcesPath, 'screenresolution')
        : path.join(__dirname, '../bin/screenresolution');
    const displayplacerPath = getDisplayPlacerPath();

    if (mainWindow) {
        const newHeight = 130 + ((displays.length - 1) * 60);
        const [width] = mainWindow.getSize();
        mainWindow.setSize(width, newHeight);
    }

    const getHardwareModes = new Promise((resolve) => {
        execFile(screenresolutionPath, ['list'], (error, stdout) => {
            if (error) return resolve([]);
            const resolutions = [...new Set(stdout.split('\n')
                .flatMap(line => line.trim().split(/\s+/))
                .filter(item => item.includes('x') && item.includes('@')))];

            const parseRes = (resString) => {
                const match = resString.match(/(\d+)x(\d+)x(\d+)@(\d+)/);
                if (!match) return { width: 0, height: 0, refresh: 0 };
                return {
                    width: parseInt(match[1], 10),
                    height: parseInt(match[2], 10),
                    refresh: parseInt(match[4], 10),
                };
            };
            resolutions.sort((a, b) => {
                const resA = parseRes(a);
                const resB = parseRes(b);
                if (resA.width !== resB.width) return resA.width - resB.width;
                if (resA.height !== resB.height) return resA.height - resB.height;
                return resA.refresh - resB.refresh;
            });

            resolve(resolutions);
        });
    });

    const getScaledModes = new Promise((resolve) => {
        if (!displayplacerPath) return resolve([]);
        execFile(displayplacerPath, ['list'], (error, stdout) => {
            if (error) return resolve([]);

            const idMatch = stdout.match(/Persistent screen id: ([\w-]+)/);
            if (idMatch && idMatch[1]) {
                primaryDisplayPersistentId = idMatch[1];
            }

            const modeLines = stdout.match(/mode \d+: .*/g) || [];
            const modes = modeLines.map(line => {
                const resMatch = line.match(/res:\s*(\d+x\d+)/);
                const hzMatch = line.match(/hz:(\d+)/);
                const scaling = line.includes('scaling:on');
                if (resMatch && hzMatch) {
                    return {
                        res: resMatch[1],
                        hz: hzMatch[1],
                        scaling
                    };
                }
                return null;
            }).filter(Boolean);

            resolve(modes);
        });
    });

    const [hardwareModes, scaledModes] = await Promise.all([getHardwareModes, getScaledModes]);

    return displays.map(display => ({
        id: display.id,
        label: display.label || `Display ${display.id}`,
        currentResolution: `${display.size.width}x${display.size.height}`,
        hardwareModes,
        scaledModes
    }));
});

ipcMain.handle('set-resolution', async (event, { resolutionString }) => {
    const [type, ...rest] = resolutionString.split(':');
    let toolPath, args;

    if (type === 'scaled') {
        const [resolution, hz, scaling] = rest;
        toolPath = getDisplayPlacerPath();
        if (!toolPath || !primaryDisplayPersistentId) return { success: false, error: 'Tool or screen ID not found.' };

        let command = `id:${primaryDisplayPersistentId} res:${resolution} hz:${hz}`;
        if (scaling === 'true') {
            command += ' scaling:on';
        }
        args = [command];

    } else { // hardware
        toolPath = app.isPackaged
            ? path.join(process.resourcesPath, 'screenresolution')
            : path.join(__dirname, '../bin/screenresolution');
        args = ['set', rest[0]];
    }

    return new Promise((resolve) => {
        execFile(toolPath, args, (error, stdout, stderr) => {
            if (error) {
                resolve({ success: false, error: stderr || error.message });
                return;
            }
            resolve({ success: true });
        });
    });
});

ipcMain.on('hide-window', () => {
    if (mainWindow) mainWindow.hide();
});

ipcMain.on('quit-app', () => {
    app.quit();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.dock.hide();
