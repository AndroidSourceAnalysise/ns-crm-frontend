/**
 * Created by qingcheng on 2017/05/15.
 */
var path = require('path'),
    //指定frontend工程目录路径
    root = path.resolve('./'),
    dir = root + '/common/js/lib/',
    fs = require('fs'),
    webpack = require('webpack'),
	CleanWebpackPlugin = require('clean-webpack-plugin'),
    nodeModulesDir = path.resolve('./node_modules'),
    config;

config = {
    context: dir,
    entry: {
        vendor: ['./vue', './jsonp', './axios', './axios-proxy']
    },
    output: {
        path: dir + '../dll',
        filename: '[name]-[chunkhash].min.js',
        library: '[name]_[chunkhash]'
    },
    resolve: {
        modules: [nodeModulesDir, dir],
        extensions: ['.js', '.vue']
    },
    resolveLoader: {
        modules: [__dirname, nodeModulesDir]
    },
    plugins: [
	    new CleanWebpackPlugin(['dll/*'], {
		    root: root + '/common/js/',
		    verbose: true,
		    dry: false
	    }),
        new webpack.DllPlugin({
            path: root + '/buildscript/js/[name]-manifest.json',
            name: '[name]_[chunkhash]'
        }),
        new webpack.LoaderOptionsPlugin({
            minimize: true
        })
    ]
};

module.exports = config;
