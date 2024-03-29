var path = require("path");
var webpack = require("webpack");
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var Clean = require("clean-webpack-plugin");
var git = require('git-rev-sync');
require('es6-promise').polyfill();

// BASE APP DIR
var root_dir = path.resolve(__dirname, "..");

// FUNCTION TO EXTRACT CSS FOR PRODUCTION
function extractForProduction(loaders) {
  return ExtractTextPlugin.extract("style", loaders.substr(loaders.indexOf("!")));
}

module.exports = function(options) {
    // console.log(options.prod ? "Using PRODUCTION options\n" : "Using DEV options\n");
    // STYLE LOADERS
    var cssLoaders = "style-loader!css-loader!postcss-loader",
      scssLoaders = "style!css!postcss-loader!sass?outputStyle=expanded";

    // DIRECTORY CLEANER
    var cleanDirectories = ["dist"];

    // OUTPUT PATH
    var outputPath = path.join(root_dir, "assets");

    // COMMON PLUGINS
    var plugins = [
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.DefinePlugin({
            APP_VERSION: JSON.stringify(git.tag()),
            __ELECTRON__: !!options.electron
        })
    ];

    if (options.prod) {
        // WRAP INTO CSS FILE
        cssLoaders = extractForProduction(cssLoaders);
        scssLoaders = extractForProduction(scssLoaders);

        // PROD PLUGINS
        plugins.push(new Clean(cleanDirectories, {root: root_dir}));
        plugins.push(new webpack.DefinePlugin({'process.env': {NODE_ENV: JSON.stringify('production')}}));
        plugins.push(new ExtractTextPlugin("app.css"));
        if (!options.noUgly) {
            plugins.push(new webpack.optimize.UglifyJsPlugin({
                minimize: true,
                sourceMap: true,
                compress: {
                    warnings: true
                },
                output: {
                    screw_ie8: true
                }
            }));
        }

        // plugins.push(new webpack.optimize.CommonsChunkPlugin({
        //     names: ["app", "vendors"],
        //     filename: "vendors.js"
        // }));

        // PROD OUTPUT PATH
        outputPath = path.join(root_dir, "dist");
    } else {
        plugins.push(new webpack.DefinePlugin({'process.env': {NODE_ENV: JSON.stringify('development')}})),
        plugins.push(new webpack.HotModuleReplacementPlugin());
    }

    var config = {
        entry: {
            app: options.prod ?
            path.resolve(root_dir, "app/Main.js") :
            [
                "webpack-dev-server/client?http://localhost:8080",
                "webpack/hot/only-dev-server",
                path.resolve(root_dir, "app/Main-dev.js")
            ]
        },
        output: {
            path: outputPath,
            filename: "app.js",
            pathinfo: !options.prod,
            sourceMapFilename: "[name].js.map"
        },
        devtool: options.prod ? "cheap-module-source-map" : "eval",
        debug: options.prod ? false : true,
        module: {
            loaders: [
                {
                    test: /\.jsx$/,
                    include: [path.join(root_dir, "app"), path.join(root_dir, "node_modules/react-foundation-apps"), "/home/sigve/Dev/graphene/react-foundation-apps"],
                    loaders: options.prod ? ["babel-loader"] : ["babel-loader?cacheDirectory"]
                },
                {
                    test: /\.js$/,
                    exclude: [/node_modules/, path.resolve(root_dir, "../dl/node_modules")],
                    loader: "babel-loader",
                    query: {compact: false, cacheDirectory: true}
                },
                {
                    test: /\.json/, loader: "json",
                    exclude: [
                        path.resolve(root_dir, "../dl/src/common"),
                        path.resolve(root_dir, "app/assets/locales")
                    ]
                },
                { test: /\.coffee$/, loader: "coffee-loader" },
                { test: /\.(coffee\.md|litcoffee)$/, loader: "coffee-loader?literate" },
                { test: /\.css$/, loader: cssLoaders },
                {
                    test: /\.scss$/,
                    loader: scssLoaders
                },
                { test: /\.png$/, loader: "url-loader?limit=100000", exclude:[
                    path.resolve(root_dir, "app/assets/asset-symbols"),
                    path.resolve(root_dir, "app/assets/images"),
                ] },
                { test: /\.woff$/, loader: "url-loader?limit=100000&mimetype=application/font-woff" },
                { test: /.*\.svg$/, loaders: ["svg-inline-loader", "svgo-loader"] },
                { test: /\.md/, loader: 'html?removeAttributeQuotes=false!remarkable' }
            ],
            postcss: function () {
                return [precss, autoprefixer];
            }
        },
        resolve: {
            root: [path.resolve(root_dir, "./app"), path.resolve(root_dir, "../dl/src")],
            extensions: ["", ".js", ".jsx", ".coffee", ".json"],
            modulesDirectories: ["node_modules"],
            fallback: [path.resolve(root_dir, "./node_modules")]
        },
        resolveLoader: {
            root: path.join(root_dir, "node_modules"),
            fallback: [path.resolve(root_dir, "./node_modules")]
        },
        plugins: plugins,
        root: outputPath,
        remarkable: {
            preset: "full",
            typographer: true
        }
    };

    // if(options.prod) config.entry.vendors = [
    //     "classnames", "react-router", "highcharts/highstock", "counterpart", "react-translate-component",
    //     "perfect-scrollbar", "jdenticon", "react-notification-system", "react-tooltip",
    //     "whatwg-fetch", "alt", "react-json-inspector",
    //     "immutable", "graphenejs-lib"
    // ];

    return config;

}
