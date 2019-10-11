#!/bin/bash

source build-config.cfg

echo "Updating files in $wp_plugin_dir"

rm -rf $wp_plugin_dir

mkdir $wp_plugin_dir

rsync -axz src/* $wp_plugin_dir/

echo "Build complete!"
