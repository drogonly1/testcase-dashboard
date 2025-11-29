# 🐛 Debug Configuration for VS Code + Docker

Đây là các file config để debug Docker containers bằng VS Code.

## 📦 Files bao gồm:

1. **`.vscode/launch.json`** - VS Code debugger configuration
2. **`.vscode/settings.json`** - VS Code workspace settings
3. **`docker-compose.debug.yml`** - Docker Compose cho debug mode
4. **`Dockerfile.dev`** - Development Dockerfile với debug support
5. **`nodemon.json`** - Nodemon configuration cho hot reload
6. **`start-debug.sh`** - Script tự động start debug environment

## 🚀 Quick Start:

```bash
# 1. Copy files vào project root
cp -r .vscode ~/your-project/
cp docker-compose.debug.yml ~/your-project/
cp Dockerfile.dev ~/your-project/
cp nodemon.json ~/your-project/
cp start-debug.sh ~/your-project/

# 2. Start debug mode
cd ~/your-project
./start-debug.sh

# 3. Attach debugger trong VS Code
# Press F5, chọn "🐛 Docker: Attach to Backend"
```

## 📚 Chi tiết:

Xem file **DEBUG_DOCKER_WITH_VSCODE.md** để biết hướng dẫn đầy đủ.
