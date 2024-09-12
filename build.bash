# build main.js
npx esbuild ./src/main.js --bundle --minify --outdir=build &> /dev/null && echo "main.js built!"

# build sw.js
npx esbuild ./src/sw.js --bundle --minify --outdir=build &> /dev/null && echo "sw.js built!"

# copy favicon.ico
cp ./src/favicon.ico ./build && echo "favicon.ico copied!"

# copy icons
cp -r ./src/icons ./build && echo "icons copied!"

# build index.html
cat ./src/index.html | tr -d '\n' | sed 's/>\s*</></g' | sed 's/\s\+/ /g' > ./build/index.html && echo "index.html built!"

# build style.css
npx tailwindcss -o ./build/style.css --minify &> /dev/null && echo "style.css built!"

# build manifest.json
cat ./src/manifest.json | jq -c > ./build/manifest.json && echo "manifest.json built!"