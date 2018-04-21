/**
 * Created by qingcheng on 2017/05/15.
 */
var path = require('path'),
    glob = require('glob'),
	archiver = require('archiver'),
    //指定frontend工程目录路径
    root = path.resolve('./'),
    commonDir = root + '/common',
    projectName = '',
    dir,
    fs = require('fs'),
    entries = {},
    webpack = require('webpack'),
    nodeModulesDir = path.resolve('./node_modules'),
    ExtractTextPlugin = require('extract-text-webpack-plugin'),
    HtmlWebpackPlugin = require('html-webpack-plugin'),
    SpritesmithPlugin = require('webpack-spritesmith'),
    CleanWebpackPlugin = require('clean-webpack-plugin'),
    CopyWebpackPlugin = require('copy-webpack-plugin'),
    YunnexHtmlWebpackPlugin = require('./yunnex-html-webpack'),
    //指定babel-preset-es2015插件所在路径
    //es2015 = path.resolve('./node_modules/babel-preset-es2015'),
    vendorDllManifest = path.resolve("./buildscript/js/vendor-manifest.json"),
    dllManifestName = '../../js/dll/' + require(vendorDllManifest).name.replace('_', '-'),
    curModuleName = 'member-data',
    entryDirPrefix,
    config,
    argv,
    prevModuleName = '',
    chunkArr = [],
    commIconsDir = commonDir + '/images/icons/',
    outputDir,
    jsFileNameTemplate = '[name].min.js',
    cssFileNameTemplate = '[name].css',
    imgFileNameTemplate = '[name].[ext]';

try {
    argv = JSON.parse(process.env.npm_config_argv).original;
    if (argv[1] === 'production' || argv[1] === 'hash') {
	    if(!initEnviroment()) {
	        process.exit(0);
        }
        jsFileNameTemplate = '[name]-[chunkhash].min.js';
        cssFileNameTemplate = '[name]-[contenthash].css';
        imgFileNameTemplate = '[name]-[hash].[ext]';
    }
} catch (ex) {
    argv = process.argv;
}
outputDir = path.resolve('./target/' + projectName + '-frontend/' + projectName + '/');
function initEnviroment() {
    try {
	    var env = JSON.parse(fs.readFileSync(root + '/environment-domain.json', 'UTF-8'));
	
	    projectName = env.projectName;
	    curModuleName = env.module;
	    dir = root + '/' + projectName + '/src';
	    if(curModuleName) {
		    entryDirPrefix = dir + '/js/' + curModuleName + '/';
	    }else {
		    entryDirPrefix = dir + '/js/';
	    }
	    return true;
    }catch (ex) {
        console.log(ex.message);
        return false;
    }
}
function templateFunction(data) {
    //生成雪碧图模板
    var image,
        perSprite;

    if (!data.sprites.length) {
        return '';
    }
    image = data.sprites[0].image;

    perSprite = data.sprites
        .map(function (sprite) {
            return '.icon-N { display: inline-block; width: Wpx; height: Hpx; background-image: url(I); background-position: Xpx Ypx; vertical-align: middle;}'
                .replace('N', sprite.name)
                .replace('W', sprite.width)
                .replace('H', sprite.height)
                .replace('I', image)
                .replace('X', sprite.offset_x)
                .replace('Y', sprite.offset_y);
        })
        .join('\n');

    return perSprite;
}
config = {
    context: dir,
    entry: entries,
    cache: true,
    output: {
	    path: outputDir,
        filename: jsFileNameTemplate,
	    publicPath: '/shpt-frontend/' + projectName + '/',
	    chunkFilename: 'js/' + jsFileNameTemplate
    },
    module: {
        rules: [
            {
                test: /\.html$/,
                loader: 'html-loader',
                options: {
                    minimize: false
                }
            },
            {
                test: /\.css$/,
                use: ExtractTextPlugin.extract({
                    use: [
                        {
                            loader: 'css-loader?id=css'
                        }
                    ]
                })
            },
            {
                test: /\.less$/,
                use: ExtractTextPlugin.extract({
                    use: [
                        {
                            loader: 'css-loader?id=css'
                        },
                        {
                            loader: 'less-loader?id=less'
                        }
                    ]
                })
            },
            {
                test: /\.scss$/,
                use: ExtractTextPlugin.extract({
                    use: [
                        {
                            loader: 'css-loader?id=css'
                        },
                        {
                            loader: 'sass-loader?id=sass',
                            options: {
                                includePaths: [root + '/']
                            }
                        }
                    ]
                })
            },
            {
                test: /\.js$/,
                exclude: nodeModulesDir,
                loader: 'babel-loader?cacheDirectory'/*,
                query: {
                    presets: [es2015]
                }*/
            },
            {
                test: /\.vue$/,
                exclude: nodeModulesDir,
                loader: 'vue-loader?id=vue',
                options: {
                    extractCSS: true
                }
            },
            {
                test: /\.(png|jpg|gif|jpeg|bmp)$/,
                loader: 'yunnex-file-loader?id=file',
                options: {
                    name: imgFileNameTemplate,
                    useRelativePath: true,
                    publicPath: function (url) {
                        /*
                         正则表达式为取url的文件名以及文件所在目录，比如url为：'../images/mall/sprite.png'，处
                         理之后为mall/sprite.png。
                         */
                        return '/shpt-frontend/' + projectName + '/images/' + url.replace(/.*?([^\/]+\/[^\/]+)$/, '$1');
                    },
                    outputPath: function (url) {
                        return 'images/' + url.replace(/.*?([^\/]+\/[^\/]+)$/, '$1');
                    }
                }
            },
            {
                test: /\.(svg|eot|ttf|woff|woff2)$/,
                loader: 'yunnex-file-loader?id=file',
                options: {
                    name: imgFileNameTemplate,
                    useRelativePath: true,
                    publicPath: function (url) {
                        /*
                         正则表达式为取url的文件名以及文件所在目录，比如url为：'../images/mall/sprite.woff'，处
                         理之后为mall/sprite.woff。
                         */
                        return '../../css/' + url.replace(/.*?([^\/]+\/[^\/]+)$/, '$1');
                    },
                    outputPath: function (url) {
                        return 'css/' + url.replace(/.*?([^\/]+\/[^\/]+)$/, '$1');
                    }
                }

            }
        ]
    },
    resolve: {
        modules: [nodeModulesDir, dir],
        extensions: ['.js', '.vue', '.scss', '.less'],
        alias: {
            vue: commonDir + '/js/lib/vue.js',
            jsonp: commonDir + '/js/lib/jsonp.js',
            axios: commonDir + '/js/lib/axios.js',
	        iview: commonDir + '/js/lib/iview/iview_2.7.4.min.js',
            root: root,
            common: root + '/common'
        }
    },
    resolveLoader: {
        modules: [nodeModulesDir, __dirname]
    },
    plugins: [
        new CleanWebpackPlugin([projectName + '-frontend/*'], {
            root: path.resolve('./target/'),
            verbose: true,
            dry: false,
            exclude:  ['*-vendor.js']
        }),
        //拷贝网站标签图标
	    new CopyWebpackPlugin([{from: root + '/favicon.ico', to: path.resolve('./target/') + projectName + '-frontend/favicon.ico'}]),
        new CopyWebpackPlugin([{from: commonDir + '/js/dll', to: outputDir + '/js/dll'}]),
	    new CopyWebpackPlugin([{from: root + '/environment-domain.json', to: path.resolve('./target/') + projectName + '-frontend/environment-domain.json'}]),
        new webpack.DllReferencePlugin({
            scope: 'libs',
            manifest: vendorDllManifest
        }),
        //提取css文件
        new ExtractTextPlugin({
            filename: function (getPath) {
                return getPath(cssFileNameTemplate).replace('js', 'css');
            }
        }),
        //去掉生成的打包脚本中含有依赖文件的文件路径
        new webpack.LoaderOptionsPlugin({
            minimize: true
        }),
        new YunnexHtmlWebpackPlugin({
            //assetsPrefix: projectName,
            assetsBeforeAppend: dllManifestName + '.min.js',
            isNeedCtx: false,
	        afterEmitCb: generateZipPackage
        })
    ],
    externals: {
        jquery: 'window.$'
    }
};
function genCommSprite() {
    //对common/icons目录下的图标生成对应的雪碧图
    fs.readdirSync(commIconsDir).forEach(function (el, index) {
        config.plugins.splice(1, 0,
            new SpritesmithPlugin({
                src: {
                    cwd: commIconsDir + el,
                    glob: '*.png'
                },
                target: {
                    image: commonDir + '/images/common/' + el + '-sprite.png',
                    css: [
                        [
                            commonDir + '/styles/' + el + '-sprite.css',
                            {
                                format: 'function_based_template'
                            }
                        ]
                    ]
                },
                // 样式文件中调用雪碧图地址写法
                apiOptions: {
                    cssImageRef: '../images/common/' + el + '-sprite.png'
                },
                customTemplates: {
                    function_based_template: templateFunction
                }
            })
        );
    });
}
function generateEntryAndHTMLPlugin (tarDir, moduleName) {
    //循环生成入口entries和自动输出html
    var reg = /.*?([^\/]+)$/g,
        _prefix;

    moduleName = moduleName || '';
    _prefix = moduleName ? 'js/' + moduleName + '/' : 'js/';
    fs.readdirSync(tarDir).forEach(function (el, index, arr) {
        if (fs.statSync(tarDir + el).isFile()) {
            chunkArr.push('js/' + prevModuleName + el.split('.')[0]);
            entries[_prefix + el.split('.')[0]] = tarDir + el;
            config.plugins.push(
                new HtmlWebpackPlugin({
                    chunks: [_prefix + el.split('.')[0], _prefix + 'common'],
                    template: dir + '/html/' + moduleName + '/' + el.split('.')[0] + '.html',
                    filename: 'html/' + moduleName + '/' + el.split('.')[0] + '.html',
                    minify: false,
                    xhtml: true,
                    chunksSortMode: function (a, b) {
                        if (b.names[0].replace(reg, '$1') === 'common') {
                            return 1;
                        }
                        return -1;
                    }
                })
            );
        }else if(el !== 'lib'){
            if(prevModuleName) {
                //如果觉得不需要对子模块代码生成common.min.js则注释此段代码
                /*config.plugins.push(new webpack.optimize.CommonsChunkPlugin({
                    name: ['js/' + prevModuleName + 'common'],
                    chunks: chunkArr.concat(),
                    minChunks: 2
                }));*/
            }
            if(moduleName) {
                //限制只允许对子项目模块目录进行一层遍历
                return;
            }
            prevModuleName = el + '/';
            chunkArr = [];
            generateEntryAndHTMLPlugin(entryDirPrefix + el + '/', el);
        }
    });
    //处理最后一个目录的公共chunk的提取,如果觉得不需要对子模块代码生成common.min.js则注释此段代码
    /*config.plugins.push(new webpack.optimize.CommonsChunkPlugin({
        name: ['js/' + prevModuleName + 'common'],
        chunks: chunkArr.concat(),
        minChunks: 2
    }));*/
}
function generateSpriteForModule() {
    if(!fs.existsSync(dir + '/images/icons/')) {
        return;
    }
    fs.readdirSync(dir + '/images/icons/').forEach(function (el, index, arr) {
        if (fs.statSync(dir + '/images/icons/' + el).isDirectory()) {
            //为不同的模块生成对应的雪碧图
            config.plugins.push(new SpritesmithPlugin({
                // 目标小图标
                src: {
                    cwd: dir + '/images/icons/' + el,
                    glob: '*.png'
                },
                // 输出雪碧图文件及样式文件
                target: {
                    image: dir + '/images/' + el + '/sprite.png',
                    css: [
                        [
                            dir + '/styles/' + el + '/sprite.css',
                            {
                                format: 'function_based_template'
                            }
                        ]
                    ]
                },
                // 样式文件中调用雪碧图地址写法
                apiOptions: {
                    cssImageRef: '../../images/' + el + '/sprite.png'
                },
                customTemplates: {
                    function_based_template: templateFunction
                }
            }));
        }
    });
}
function generateZipPackage() {
	var archive = archiver('zip'),
        zipName = './target/' + projectName + '-frontend',
        output = fs.createWriteStream('./target/shpt-frontend-' + projectName +'.zip');
	
	archive.on('error', function(err){
		throw err;
	});
	output.on('close', function(){
		console.log('成功生成./target/shpt-frontend-' + projectName +'.zip');
	});
	archive.pipe(output);
	archive.directory(zipName + '/', false);
	archive.finalize();
}
/*
    如果之前打包时已经构建过common中的雪碧图并且下次打包common中的icon image没有发生改变，
    则可以注释此函数减少因重复生成雪碧图而浪费打包时间
 */
genCommSprite();
generateSpriteForModule();
//generateEntryAndHTMLPlugin(entryDirPrefix);
generateEntryAndHTMLPlugin(entryDirPrefix, curModuleName);

module.exports = config;
