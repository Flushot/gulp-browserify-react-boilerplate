'use strict';

// Dependencies
var gulp            = require('gulp'),
    gutil           = require('gulp-util'),
    order           = require('gulp-order'),
    rimraf          = require('gulp-rimraf'),
    ignore          = require('gulp-ignore'),
    rename          = require('gulp-rename'),
    sourcemaps      = require('gulp-sourcemaps'),
    browserify      = require('browserify'),
    watchify        = require('watchify'),
    reactify        = require('reactify'),
    es6ify          = require('es6ify'),
    source          = require('vinyl-source-stream'),
    uglify          = require('gulp-uglify'),
    less            = require('gulp-less'),
    cssmin          = require('gulp-cssmin'),
    concat          = require('gulp-concat'),
    livereload      = require('gulp-livereload'),
    embedlr         = require('gulp-embedlr'),
    jest            = require('gulp-jest'),
    path            = require('path'),
    exit            = require('exit'),
    express         = require('express');

// Configuration
var ports = {
        // Web server
        http_server: 8888,

        // LiveReload server
        lr_server: 35730
    },
    paths = {
        // Main entrypoint
        main: 'app/scripts/main.jsx',

        // Build target directory
        build: 'build',

        scripts: [
            'app/scripts/**/*.js',
            'app/scripts/**/*.jsx'
        ],

        // Jest cases
        tests: [
            'tests/**/*-test.js'
        ],

        html: [
            'app/**/*.html'
        ],

        styles: [
            'node_modules/bootstrap/dist/css/bootstrap.css',
            'node_modules/bootstrap/dist/css/bootstrap-theme.css',
            'app/styles/**/*.less'
        ],

        // These scripts get concatenated and evaluated in global scope
        vendor: [
            //'bower_components/react/react-with-addons.js',            
            'node_modules/es6ify/node_modules/traceur/bin/traceur-runtime.js',
            'node_modules/bootstrap/dist/js/bootstrap.js',
            'node_modules/jquery/dist/jquery.js',
            'node_modules/moment/moment.js'
        ]
    };

/**
 * Clean up all build files.
 */
gulp.task('clean', function() {
    gulp.src(paths.build, {read: false})
        .pipe(rimraf());
});

/**
 * Build all vendor files.
 */
gulp.task('vendor', function() {
    return gulp
        .src(paths.vendor)
        //.pipe(order(paths.vendor))
        //.src(paths.vendor)
        .pipe(sourcemaps.init())
        //.pipe(uglify())
        .pipe(concat('vendor.js'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(paths.build));
});

/**
 * Build all HTML files, embedding LiveReload JS code.
 */
gulp.task('html', function() {
    gulp.src(paths.html)
        .pipe(embedlr({port: ports.lr_server}))
        .pipe(gulp.dest(paths.build));
    gulp.watch(paths.html, ['html']);
});

/**
 * Build all LESS styles, concatenating and minifying.
 */
gulp.task('styles', function() {
    gulp.src(paths.styles)
        .pipe(sourcemaps.init())
        .pipe(less()) // TODO: only apply to .less files
        .pipe(cssmin())
        .pipe(concat('app.css'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(paths.build));
    gulp.watch(paths.styles, ['styles']);
});

/**
 * Build all JS/XJS scripts.
 * Uses ECMAScript 6 transpiler.
 */
gulp.task('scripts', ['vendor'], function() {
    es6ify.traceurOverrides = {
        experimental: true
    };

    //var bundler = (watch ? watchify : browserify)('./' + paths.main);
    var bundler = watchify('./' + paths.main);
    bundler.require(require.resolve('react'));
    bundler.transform(reactify);
    bundler.transform(es6ify.configure(/.jsx/));

    var rebundle = function() {
        var stream = bundler.bundle({debug: true});

        stream.on('error', function (err) {
            console.error('Compilation error:', err);
            exit(1);
        });

        stream = stream.pipe(source('./' + paths.main));
        stream.pipe(rename('app.js'));

        stream.pipe(gulp.dest(paths.build));
    };
        
    bundler.on('update', rebundle);
    return rebundle();
});

/**
 * Run all unit tests.
 */
gulp.task('test', ['scripts'], function() {
    return gulp
        .src('tests')
        .pipe(jest({
            //scriptPreprocessor: 'support/preprocessor.js',
            unmockedModulePathPatterns: [
                'node_modules/react'
            ],
            testDirectoryName: 'tests',
            testPathIgnorePatterns: [
                'node_modules',
                'tests/support'
            ],
            moduleFileExtensions: [
                'js',
                'json'
            ]
        }));
});

/**
 * Run express web server.
 */
gulp.task('server', ['scripts', 'styles', 'html'], function(next) {
    var app = express();
    app.use(express.static(path.resolve('./' + paths.build)));
    app.listen(ports.http_server, function() {
        gutil.log('HTTP server listening on:', ports.http_server);
        next();
    });
});

/**
 * Default task.
 */
gulp.task('default', ['server'], function() {
    var lr_server = livereload(ports.lr_server);

    // Monitor changes
    gulp.watch([paths.build + '/**/*'], function(evt) {
        //gutil.log(gutil.color.cyan(evt.path), 'changed');
        gutil.log(evt.path, 'changed');
        lr_server.changed(evt.path);
    });
});
