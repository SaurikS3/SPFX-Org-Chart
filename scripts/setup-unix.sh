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
echo "[Step 1/5] Checking Node.js installation..."
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

# Step 2: Configure npm to use local cache
echo "[Step 2/5] Configuring npm to use local cache..."
npm config set cache "$ROOT_DIR/npm-cache"
npm config set offline true
npm config set prefer-offline true
echo "npm cache configured to: $ROOT_DIR/npm-cache"
echo ""

# Step 3: Install global packages
echo "[Step 3/5] Installing global npm packages..."
echo "Installing yo, gulp-cli, and @microsoft/generator-sharepoint..."

# Try to install globally, or use local if permission denied
if npm install -g yo gulp-cli @microsoft/generator-sharepoint --cache "$ROOT_DIR/npm-cache" --offline 2>/dev/null; then
    echo "Global packages installed successfully!"
else
    echo "Global install failed (likely permission issue). Using npm prefix instead..."
    NPM_PREFIX="$HOME/.npm-global"
    mkdir -p "$NPM_PREFIX"
    npm config set prefix "$NPM_PREFIX"
    npm install -g yo gulp-cli @microsoft/generator-sharepoint --cache "$ROOT_DIR/npm-cache" --offline
    echo ""
    echo "Add the following to your ~/.bashrc or ~/.zshrc:"
    echo "  export PATH=\"$NPM_PREFIX/bin:\$PATH\""
    echo ""
fi
echo ""

# Step 4: Verify installation
echo "[Step 4/5] Verifying installation..."
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

# Step 5: Create .npmrc in user home
echo "[Step 5/5] Creating user .npmrc for offline mode..."
cat > "$HOME/.npmrc" << EOF
cache=$ROOT_DIR/npm-cache
offline=true
prefer-offline=true
EOF
echo "Created $HOME/.npmrc"
echo ""

echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo ""
echo "You can now create new SPFx projects using:"
echo "  yo @microsoft/sharepoint"
echo ""
echo "All npm packages are cached locally in:"
echo "  $ROOT_DIR/npm-cache"
echo ""
echo "For any new project, run npm install with:"
echo "  npm install --offline --cache \"$ROOT_DIR/npm-cache\""
echo ""
echo "Sample project available at:"
echo "  $ROOT_DIR/sample-project/sample-spfx"
echo ""
