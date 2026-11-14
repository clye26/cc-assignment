#!/bin/bash
echo "Generating production config.js..."
cat <<EOF > config.js
const isLocal = false;
const CONFIG = {
    API_URL: '/api/v1',
    API_KEY: '$FRONTEND_API_KEY'
};
EOF