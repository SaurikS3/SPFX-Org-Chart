#!/bin/bash
# SPFx Offline Development Environment Setup Script for macOS/Linux
# Make this script executable: chmod +x setup-unix.sh
# Run with: ./setup-unix.sh

set -e

echo "========================================"
echo "SPFx Offline Development Environment Setup"
echo "========================================"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Script Directory: $SCRIPT_DIR"
echo "Root Directory: $ROOT_DIR"
echo ""

# Detect OS
OS_TYPE="unknown"
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS_TYPE="macos"
    ARCH=$(uname -m)
    if [[ "$ARCH" == "arm64" ]]; then
        NODE_INSTALLER="node-v18.20.5-darwin-arm64.tar.gz"
    else
        NODE_INSTALLER="node-v18.20.5-darwin-x64.tar.gz"
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS_TYPE="linux"
    NODE_INSTALLER="node-v18.20.5-linux-x64.tar.gz"
fi

echo "Detected OS: $OS_TYPE"
echo ""

# Step 1: Check/Install Node.js
echo "[Step 1/6] Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "Node.js is already installed: $NODE_VERSION"
else
    echo "Node.js not found. Installing from local package..."
    if [[ "$OS_TYPE" == "macos" ]]; then
        echo "Extracting $NODE_INSTALLER..."
        cd "$ROOT_DIR/node-installers"
        tar -xzf "$NODE_INSTALLER"
        NODE_DIR=$(ls -d node-v18* | head -1)
        echo ""
        echo "Add the following to your ~/.bashrc or ~/.zshrc:"
        echo "  export PATH=\"$ROOT_DIR/node-installers/$NODE_DIR/bin:\$PATH\""
        echo ""
        echo "Or run: export PATH=\"$ROOT_DIR/node-installers/$NODE_DIR/bin:\$PATH\""
        echo ""
        read -p "Press Enter after updating your PATH..."
    else
        echo "Please extract and install Node.js from:"
        echo "  $ROOT_DIR/node-installers/$NODE_INSTALLER"
        read -p "Press Enter after Node.js installation is complete..."
    fi
fi
echo ""

# Verify Node.js
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not in PATH. Please install Node.js and ensure it's in your PATH."
    exit 1
fi

echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo ""

# Step 2: Extract global-packages node_modules
echo "[Step 2/6] Extracting global packages dependencies..."
if [ ! -d "$ROOT_DIR/global-packages/node_modules" ]; then
    cd "$ROOT_DIR/global-packages"
    if [ -f "node_modules.zip" ]; then
        echo "Extracting global-packages/node_modules.zip..."
        unzip -q node_modules.zip
        echo "Global packages dependencies extracted."
    else
        echo "Warning: node_modules.zip not found in global-packages."
    fi
else
    echo "Global packages dependencies already extracted."
fi
echo ""

# Step 3: Extract sample-project node_modules
echo "[Step 3/6] Extracting sample project dependencies..."
if [ ! -d "$ROOT_DIR/sample-project/sample-spfx/node_modules" ]; then
    cd "$ROOT_DIR/sample-project/sample-spfx"
    
    # Check if split files exist and combine them
    if [ -f "node_modules.zip.part_aa" ]; then
        echo "Combining split zip files..."
        cat node_modules.zip.part_* > node_modules.zip
        echo "Combined successfully."
    fi
    
    if [ -f "node_modules.zip" ]; then
        echo "Extracting sample-project/sample-spfx/node_modules.zip..."
        unzip -q node_modules.zip
        echo "Sample project dependencies extracted."
    else
        echo "Warning: node_modules.zip not found in sample-project/sample-spfx."
    fi
else
    echo "Sample project dependencies already extracted."
fi
echo ""

# Step 4: Install global packages from tgz files
echo "[Step 4/6] Installing global SPFx development tools..."
cd "$ROOT_DIR/global-packages"

echo "Installing Yeoman (yo)..."
npm install -g yo-6.0.0.tgz 2>/dev/null || npm install -g yo-6.0.0.tgz --offline || true

echo "Installing Gulp CLI..."
npm install -g gulp-cli-3.1.0.tgz 2>/dev/null || npm install -g gulp-cli-3.1.0.tgz --offline || true

echo "Installing SharePoint Generator..."
npm install -g microsoft-generator-sharepoint-1.22.1.tgz 2>/dev/null || npm install -g microsoft-generator-sharepoint-1.22.1.tgz --offline || true

echo ""

# Step 5: Verify installation
echo "[Step 5/6] Verifying installation..."
echo ""
echo "Node.js version:"
node --version
echo ""
echo "npm version:"
npm --version
echo ""

if command -v yo &> /dev/null; then
    echo "Yeoman version:"
    yo --version
else
    echo "Yeoman: Use 'npx yo' or add npm global bin to PATH"
fi
echo ""

if command -v gulp &> /dev/null; then
    echo "Gulp CLI version:"
    gulp --version
else
    echo "Gulp: Use 'npx gulp' or add npm global bin to PATH"
fi
echo ""

# Step 6: Configure npm for offline mode
echo "[Step 6/6] Configuring npm for offline mode..."
npm config set cache "$ROOT_DIR/npm-cache" 2>/dev/null || true
npm config set prefer-offline true 2>/dev/null || true
echo "npm configured for offline usage."
echo ""

echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo ""
echo "Installed tools:"
echo "  - Yeoman (yo): For scaffolding projects"
echo "  - Gulp CLI: For running build tasks"
echo "  - SharePoint Generator: For creating SPFx projects"
echo ""
echo "To verify installation, run:"
echo "  yo --version"
echo "  gulp --version"
echo ""
echo "To work with the sample SPFx project:"
echo "  cd $ROOT_DIR/sample-project/sample-spfx"
echo "  gulp serve"
echo ""
echo "To create a new SPFx project:"
echo "  mkdir my-new-project"
echo "  cd my-new-project"
echo "  yo @microsoft/sharepoint"
echo ""
