# SPFx Offline Development Environment for macOS

Complete, pre-packaged SharePoint Framework (SPFx) development environment for **air-gapped/lockdown macOS environments** where internet access is not available.

## 📦 Contents

| Directory | Description |
|-----------|-------------|
| `node-installers/` | Node.js v18.20.5 (Intel & Apple Silicon) |
| `npm-cache/` | Pre-populated npm cache (~787MB) |
| `global-packages/` | yo, gulp-cli, @microsoft/generator-sharepoint |
| `sample-project/` | Sample SPFx React WebPart (dependencies installed) |
| `scripts/` | Setup script for macOS |

## 🚀 Quick Start

```bash
# 1. Make setup script executable
chmod +x scripts/setup-unix.sh

# 2. Run setup
./scripts/setup-unix.sh
```

## 🔧 Manual Setup

### 1. Install Node.js v18.20.5

Extract the appropriate package from `node-installers/`:

**Apple Silicon (M1/M2/M3/M4):**
```bash
cd node-installers
tar -xzf node-v18.20.5-darwin-arm64.tar.gz
export PATH="$(pwd)/node-v18.20.5-darwin-arm64/bin:$PATH"
```

**Intel Mac:**
```bash
cd node-installers
tar -xzf node-v18.20.5-darwin-x64.tar.gz
export PATH="$(pwd)/node-v18.20.5-darwin-x64/bin:$PATH"
```

Add to `~/.zshrc` for persistence:
```bash
echo 'export PATH="/path/to/node-v18.20.5-darwin-xxx/bin:$PATH"' >> ~/.zshrc
```

### 2. Configure npm for Offline Mode

```bash
npm config set cache "/path/to/SFPX-ENV/npm-cache"
npm config set offline true
npm config set prefer-offline true
```

### 3. Install Global Packages

```bash
npm install -g yo gulp-cli @microsoft/generator-sharepoint --offline
```

### 4. Verify Installation

```bash
node --version    # v18.20.5
npm --version     # 10.x.x
yo --version
gulp --version
```

## 📝 Creating New SPFx Projects

```bash
# Create and enter project directory
mkdir my-webpart && cd my-webpart

# Run SPFx generator
yo @microsoft/sharepoint

# Install dependencies (offline)
npm install --offline
```

## 🏗️ Build Commands

```bash
gulp build                    # Build project
gulp bundle --ship            # Bundle for production
gulp package-solution --ship  # Create .sppkg package
gulp serve                    # Local development server
```

## 📁 Sample Project

Pre-configured React WebPart at `sample-project/sample-spfx/`:

```bash
cd sample-project/sample-spfx
gulp build
gulp serve
```

## ⚠️ SPFx 1.22.1 Requirements

| Component | Version |
|-----------|---------|
| Node.js | 18.x LTS |
| npm | 9.x - 10.x |
| TypeScript | 4.7+ |
| SharePoint | Online only |

## 🔒 Offline Notes

All packages required for SPFx development are cached. For additional packages not in cache, you'll need to pre-cache them on a connected machine first.

## 📚 References

- [SPFx Compatibility](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/compatibility)
- [SPFx Development Setup](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/set-up-your-development-environment)
