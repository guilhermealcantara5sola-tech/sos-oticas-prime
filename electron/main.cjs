const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

// URL de Produção na Vercel (Atualiza automaticamente em todos os PCs)
const VERCEL_URL = process.env.SOS_OTICA_VERCEL_URL || 'https://sos-oticas-prime.vercel.app';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'SOS Óticas Prime - Sistema de Gestão Óptica',
    autoHideMenuBar: true,
    backgroundColor: '#0f172a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const localIndex = path.join(__dirname, '../dist/index.html');

  // Tenta carregar da Vercel (sempre atualizado) e, se estiver sem internet, carrega o sistema embutido no .exe
  mainWindow.loadURL(VERCEL_URL).catch(() => {
    mainWindow.loadFile(localIndex);
  });

  mainWindow.webContents.on('did-fail-load', () => {
    mainWindow.loadFile(localIndex);
  });

  // Abrir links externos no navegador padrão do sistema
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http') && !url.includes('sos-oticas-prime.vercel.app')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
