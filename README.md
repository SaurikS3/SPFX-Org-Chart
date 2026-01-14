# SPFx Org Chart - Complete Offline Development Environment

A complete offline SharePoint Framework (SPFx) development environment with an Org Chart web part sample project. This repository includes everything needed to set up SPFx development without internet access.

## 📦 What's Included

### Node.js Installers
Located in `node-installers/`:
- **Windows**: `node-v18.20.5-x64.msi` (recommended) or `node-v18.20.5-win-x64.zip`
- **macOS Intel**: `node-v18.20.5-darwin-x64.tar.gz`
- **macOS Apple Silicon**: `node-v18.20.5-darwin-arm64.tar.gz`

### Global SPFx Packages
Located in `global-packages/`:
- `yo-6.0.0.tgz` - Yeoman scaffolding tool
- `gulp-cli-3.1.0.tgz` - Gulp task runner CLI
- `microsoft-generator-sharepoint-1.22.1.tgz` - SharePoint Framework generator
- `node_modules.zip` - Pre-installed dependencies for global packages

### Sample SPFx Project
Located in `sample-project/sample-spfx/`:
- Complete SPFx Org Chart web part using Microsoft Graph API
- `node_modules.zip` - All project dependencies pre-installed
- Ready to build and deploy

## 🚀 Quick Start

### Windows

1. **Install Node.js 18.x**
   - Run `node-installers/node-v18.20.5-x64.msi`
   - Follow the installation wizard

2. **Run Setup Script**
   ```cmd
   scripts\setup-windows.bat
   ```

3. **Work with Sample Project**
   ```cmd
   cd sample-project\sample-spfx
   gulp serve
   ```

### macOS / Linux

1. **Install Node.js 18.x**
   ```bash
   # For Apple Silicon (M1/M2/M3)
   tar -xzf node-installers/node-v18.20.5-darwin-arm64.tar.gz
   export PATH=$PWD/node-v18.20.5-darwin-arm64/bin:$PATH
   
   # For Intel Mac
   tar -xzf node-installers/node-v18.20.5-darwin-x64.tar.gz
   export PATH=$PWD/node-v18.20.5-darwin-x64/bin:$PATH
   ```

2. **Run Setup Script**
   ```bash
   chmod +x scripts/setup-unix.sh
   ./scripts/setup-unix.sh
   ```

3. **Work with Sample Project**
   ```bash
   cd sample-project/sample-spfx
   gulp serve
   ```

## 📁 Project Structure

```
SPFX-Org-Chart/
├── README.md
├── .gitignore
├── .gitattributes              # Git LFS configuration
├── node-installers/            # Node.js installers for all platforms
│   ├── node-v18.20.5-x64.msi           # Windows MSI installer
│   ├── node-v18.20.5-win-x64.zip       # Windows portable
│   ├── node-v18.20.5-darwin-x64.tar.gz # macOS Intel
│   └── node-v18.20.5-darwin-arm64.tar.gz # macOS Apple Silicon
├── global-packages/            # Global npm packages
│   ├── yo-6.0.0.tgz
│   ├── gulp-cli-3.1.0.tgz
│   ├── microsoft-generator-sharepoint-1.22.1.tgz
│   ├── node_modules.zip        # Dependencies (extract before use)
│   └── package.json
├── sample-project/
│   └── sample-spfx/            # Sample SPFx Org Chart project
│       ├── src/                # Source code
│       ├── config/             # SPFx configuration
│       ├── node_modules.zip.part_aa  # Dependencies part 1 (combine before extract)
│       ├── node_modules.zip.part_ab  # Dependencies part 2
│       ├── package.json
│       └── ...
└── scripts/
    ├── setup-windows.bat       # Windows setup script
    └── setup-unix.sh           # macOS/Linux setup script
```

## 🔧 Manual Installation

If the setup scripts don't work, you can manually install:

### 1. Extract Dependencies

**Windows (PowerShell):**
```powershell
cd global-packages
Expand-Archive -Path node_modules.zip -DestinationPath .

cd ..\sample-project\sample-spfx
Expand-Archive -Path node_modules.zip -DestinationPath .
```

**macOS/Linux:**
```bash
cd global-packages
unzip node_modules.zip

cd ../sample-project/sample-spfx
unzip node_modules.zip
```

### 2. Install Global Packages

```bash
cd global-packages
npm install -g yo-6.0.0.tgz
npm install -g gulp-cli-3.1.0.tgz
npm install -g microsoft-generator-sharepoint-1.22.1.tgz
```

## 📋 Sample Org Chart Web Part

The included sample project is an Org Chart web part that:
- Fetches organization data from Microsoft Graph API
- Displays hierarchical org chart visualization
- Shows user photos, names, and job titles
- Supports drilling into manager/direct reports

### Configuration

The web part requires the following Microsoft Graph API permissions:
- `User.Read.All` - To read user profiles
- `People.Read` - To read organizational relationships

### Building for Production

```bash
cd sample-project/sample-spfx
gulp bundle --ship
gulp package-solution --ship
```

The `.sppkg` package will be in `sharepoint/solution/`.

## 📝 Creating a New SPFx Project

After running the setup script, you can create new SPFx projects:

```bash
mkdir my-new-webpart
cd my-new-webpart
yo @microsoft/sharepoint
```

Follow the prompts to scaffold your project.

## ⚠️ Requirements

- **Node.js**: v18.x (included in this package)
- **Disk Space**: ~500MB for installation
- **Operating System**: Windows 10+, macOS 10.14+, or Linux

## 🔄 Updating Dependencies

If you need to update the offline packages in the future:

```bash
# Update global packages
npm pack yo@latest
npm pack gulp-cli@latest
npm pack @microsoft/generator-sharepoint@latest

# Update project dependencies
cd sample-project/sample-spfx
npm install
zip -r node_modules.zip node_modules/
```

## 📄 License

MIT License - Feel free to use and modify for your projects.
