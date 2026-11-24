set -e

echo "Generating production configurations..."

# MAIN WEBSITE
cat <<EOF > config.js
const isLocal = false;
const CONFIG = {
    API_URL: '/api/v1',
    API_KEY: '${FRONTEND_API_KEY}'
};
EOF

# QUIZ WEBSITE
mkdir -p quiz

cat <<EOF > quiz/config.js
const QUIZ_CONFIG = {
    QUIZ_API_URL: '${QUIZ_API_URL}',
    QUIZ_API_KEY: '${QUIZ_API_KEY}'
};
EOF

# GACHAPON WEBSITE
mkdir -p gashapon

cat <<EOF > gashapon/config.js
const GACHAPON_CONFIG = {
    GACHAPON_API_URL: '${GACHAPON_API_URL}',
    GACHAPON_API_KEY: '${GACHAPON_API_KEY}'
};
EOF

echo "All three configurations generated successfully!"