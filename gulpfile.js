var gulp = require("gulp");
var gutil = require("gulp-util");
var concat = require("gulp-concat");
var uglify = require("gulp-uglify");
var cleanCss = require("gulp-clean-css");
var sourcemaps = require("gulp-sourcemaps");
// var babelify = require("babelify");
var browserify = require("browserify");
var watchify = require("watchify");
var source = require("vinyl-source-stream");
var buffer = require("vinyl-buffer");
var envify = require("envify/custom");
var vueify = require("vueify");

var browserSync = require("browser-sync");
var exec = require("child_process").exec;

// Configuration
var flask_assets_folder = "app/static";
var bundles = {
    core: {
        css: {
            src: [
                "src/css/bootstrap-theme.min.css",
                "node_modules/font-awesome/css/font-awesome.min.css",
                "src/css/main.css",
                "src/css/main.responsive.css",
                "src/css/layout.main.css",
                "node_modules/bootstrap-slider/dist/css/bootstrap-slider.min.css",
                "node_modules/bootstrap-toggle/css/bootstrap-toggle.min.css",
                "node_modules/leaflet/dist/leaflet.css",
                "node_modules/leaflet-draw/dist/leaflet.draw.css",
                "node_modules/esri-leaflet-geocoder/dist/esri-leaflet-geocoder.css",
                "node_modules/leaflet.markercluster/dist/MarkerCluster.css",
                "src/css/MarkerCluster.Default.css",
                "node_modules/leaflet-basemaps/L.Control.Basemaps.css"
            ],
            dist: {
                path: flask_assets_folder + "/css/",
                file: "bundle.core.css"
            }
        },
        js: {
            src: [
                "src/js/plugins.js",
                "src/js/utils.js",
                "src/js/map.js",
                "src/js/geoControl.js",
                "src/js/calcControl.js",
                "src/js/ready.js"
            ],
            dist: {
                path: flask_assets_folder + "/js/",
                file: "bundle.core.js"
            }
        }
    }
};

var bundlingConfigs = Object.keys(bundles);

/**
 * BUNDLE JS
 */
bundlingConfigs.forEach(function(bundleName) {
    gulp.task("scripts:" + bundleName, function() {
        return (
            browserify({
                basedir: ".",
                insertGlobalVars: {
                    $: function(file, dir) {
                        return 'require("jquery")';
                    },
                    jQuery: function(file, dir) {
                        return 'require("jquery")';
                    }
                },
                debug: true,
                entries: bundles[bundleName].js.src
                    // cache: {},
                    // packageCache: {}
            })
            // .transform('babelify', {
            //     presets: ['es2015'],
            //     extensions: ['.js']
            // })
            .transform(
                // Required in order to process node_modules files
                {
                    global: true
                },
                envify({
                    NODE_ENV: "production"
                })
            )
            .bundle()
            .pipe(source(bundles[bundleName].js.dist.file))
            .pipe(buffer())
            // .pipe(sourcemaps.init({ loadMaps: true }))
            // .pipe(uglify())
            .pipe(sourcemaps.write("./"))
            .pipe(gulp.dest(bundles[bundleName].js.dist.path))
            .pipe(
                browserSync.reload({
                    stream: true
                })
            )
        );
    });
});

gulp.task(
    "pack-js",
    gulp.parallel(
        bundlingConfigs.map(function(name) {
            return "scripts:" + name;
        })
    )
);

/**
 * BUNDLE CSS
 */
bundlingConfigs.forEach(function(bundleName) {
    gulp.task("styles:" + bundleName, function() {
        return gulp
            .src(bundles[bundleName].css.src)
            .pipe(concat(bundles[bundleName].css.dist.file))
            .pipe(cleanCss())
            .pipe(gulp.dest(bundles[bundleName].css.dist.path))
            .pipe(
                browserSync.reload({
                    stream: true
                })
            );
    });
});

gulp.task(
    "pack-css",
    gulp.parallel(
        bundlingConfigs.map(function(name) {
            return "styles:" + name;
        })
    )
);

/**
 * COPY ASSETS
 * (for dependencies that will look for assets to be in a certain place)
 */

// Configuration
var assets = {
    leaflet: {
        src: "node_modules/leaflet/dist/images/**/*",
        dist: flask_assets_folder + "/css/images"
    },
    leafletDraw: {
        src: "node_modules/leaflet-draw/dist/images/**/*",
        dist: flask_assets_folder + "/css/images"
    },
    esriLeafletGeocoding: {
        src: "node_modules/esri-leaflet-geocoder/dist/img/**/*",
        dist: flask_assets_folder + "/css/img"
    },
    fontawesome: {
        src: "node_modules/font-awesome/fonts/**/*",
        dist: flask_assets_folder + "/fonts"
    }
};

var assetConfigs = Object.keys(assets);

assetConfigs.forEach(function(assetName) {
    gulp.task("assets:" + assetName, function() {
        return gulp
            .src(assets[assetName].src)
            .pipe(gulp.dest(assets[assetName].dist))
            .pipe(
                browserSync.reload({
                    stream: true
                })
            );
    });
});

gulp.task(
    "copy-assets",
    gulp.parallel(
        assetConfigs.map(function(name) {
            return "assets:" + name;
        })
    )
);

/**
 * Copy leaflet assets to Flask assets folder
 */
// gulp.task("leaflet-assets", function() {
//     return gulp
//         .src("node_modules/leaflet/dist/images/**/*")
//         .pipe(gulp.dest(flask_assets_folder + "/css/images"))
//         .pipe(
//             browserSync.reload({
//                 stream: true
//             })
//         );
// });

// gulp.task("font-assets", function() {
//     return gulp
//         .src("node_modules/font-awesome/fonts/**/*")
//         .pipe(gulp.dest(flask_assets_folder + "/fonts"))
//         .pipe(
//             browserSync.reload({
//                 stream: true
//             })
//         );
// });

/**
 * COMBINED TASKS
 */

// basic build task.
gulp.task("build", gulp.parallel("pack-js", "pack-css", "copy-assets"));

//Run Flask server
gulp.task("runserver", function() {
    var proc = exec("pipenv run python application.py");
});
gulp.task("browser-sync", function() {
    browserSync({
        notify: true,
        proxy: "localhost:5000"
    });
});

gulp.task("serve-and-sync", gulp.parallel("runserver", "browser-sync"));

// gulp watch task
gulp.task(
    "watch",
    // start browserSync, and run the rest of our tasks once
    gulp.parallel(
        "serve-and-sync",
        "pack-css",
        "pack-js",
        "copy-assets",
        // re-run these tasks if source directories change
        function() {
            gulp.watch("src/css/*.css", gulp.parallel("pack-css"));
            gulp.watch("src/js/*.js", gulp.parallel("pack-js"));
        }
    )
);

// default (parameter-less) gulp task, runs watch and browser-sync
gulp.task("default", gulp.parallel("build"));