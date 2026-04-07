#!/bin/bash

echo "========================================"
echo "  Sonor Online Multiplayer Launcher"
echo "========================================"
echo ""

# Check if server dependencies are installed
if [ ! -d "server/node_modules" ]; then
    echo "Installing server dependencies..."
    cd server
    npm install
    cd ..
    echo ""
fi

echo "Starting server..."
cd server
npm start &
SERVER_PID=$!
cd ..

sleep 3

echo "Starting client..."
npm run dev &
CLIENT_PID=$!

echo ""
echo "========================================"
echo "  Both server and client are running!"
echo "========================================"
echo ""
echo "Server: http://localhost:3001"
echo "Client: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both processes"

# Wait for Ctrl+C
trap "kill $SERVER_PID $CLIENT_PID; exit" INT
wait
