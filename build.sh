#!/bin/bash

source build-config.cfg

## Still have to work on this. For now, manually run "npm install" and "npm start"
#npm ci
#npm run build

echo "Updating files in $wp_plugin_dir"

rm -rf $wp_plugin_dir

mkdir $wp_plugin_dir

rsync -axz src/* $wp_plugin_dir/

echo "Build complete!"
