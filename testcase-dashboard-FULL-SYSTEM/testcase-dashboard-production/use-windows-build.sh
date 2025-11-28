#!/bin/bash
# use-windows-build.sh
# Switch to Windows-optimized Dockerfile if build hangs

echo "🔧 Switching to Windows-optimized build..."

# Backup original
if [ ! -f frontend/Dockerfile.original ]; then
    cp frontend/Dockerfile frontend/Dockerfile.original
    echo "✅ Backed up original Dockerfile"
fi

# Use Windows version
cp frontend/Dockerfile.windows frontend/Dockerfile
echo "✅ Using Windows-optimized Dockerfile"

echo ""
echo "Now run: docker-compose build"
echo ""
echo "To restore original:"
echo "  cp frontend/Dockerfile.original frontend/Dockerfile"
