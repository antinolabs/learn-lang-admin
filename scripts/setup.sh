#!/bin/bash

echo "Setting up Language Learning Admin Dashboard..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install npm first."
    exit 1
fi

echo "Installing dependencies..."
npm install

echo "Setup complete! You can now run:"
echo "  npm start    - Start the development server"
echo "  npm run build - Build for production"
echo ""
echo "The app will be available at http://localhost:3000"

