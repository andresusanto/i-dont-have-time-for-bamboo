TAG=$(cat package.json | jq -r '.version')
cd dist; zip -r ../release/release-${TAG}.zip *