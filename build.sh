#!/bin/bash

rm jeo.zip
cp -a src jeo
zip -r jeo.zip jeo/
rm -rf jeo

