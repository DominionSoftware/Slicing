var path = require('path');
var webpack = require('webpack');
var vtkRules = require('vtk.js/Utilities/config/dependency.js').webpack.v2.rules;
var entry = path.join(__dirname, './src/index.js');
const sourcePath = path.join(__dirname, './src');
const outputPath = path.join(__dirname, './dist');
module.exports = {
    mode: 'development',
    entry,
    output: {
        path: outputPath, filename: 'Slicing.js',
    },
    module: {
        rules: [{test: entry, loader: "expose-loader?Slicing"}, {
            test: /\.html$/,
            loader: 'html-loader'
        },].concat(vtkRules),
    },
    resolve: {modules: [path.resolve(__dirname, 'node_modules'), sourcePath,],},
};