'use strict';

// Dependencies
var gulp            = require('gulp'),
    gutil           = require('gulp-util'),
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
        http_server: 8888,
        lr_server: 35730
    },
    paths = {
        main: 'app/scripts/main.jsx',
        scripts: [
            'app/scripts/**/*.js',
            'app/scripts/**/*.jsx'
        ],
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
        vendor: [
            //'bower_components/react/react-with-addons.js',
            'node_modules/es6ify/node_modules/traceur/bin/traceur-runtime.js',
        ],
        react: 'node_modules/react/react.js',
        build: 'build'
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
    return gulp.src(paths.vendor)
        .pipe(gulp.dest(paths.build + '/vendor'));
});

/**
 * Build all HTML files, embedding LiveReload JS code.
 */
gulp.task('html', function() {
    return gulp.src(paths.html)
        .pipe(embedlr({port: ports.lr_server}))
        .pipe(gulp.dest(paths.build));
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
        .pipe(gulp.dest(paths.build + '/styles'));
});

/**
 * Build all JS/XJS scripts.
 * Uses ECMAScript 6 transpiler.
 */
gulp.task('scripts', function() {
    gutil.log('Starting browserify');
    es6ify.traceurOverrides = {
        experimental: true
    };

    //var bundler = (watch ? watchify : browserify)('./' + paths.main);
    var bundler = watchify('./' + paths.main);
    bundler.require('./' + paths.react);
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

        stream.pipe(gulp.dest(paths.build + '/bundle'));
    };
        
    bundler.on('update', rebundle);
    return rebundle();
});

/**
 * Run all unit tests.
 */
gulp.task('test', ['scripts'], function() {
    gulp.src('tests')
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
gulp.task('server', function(next) {
    var app = express();
    app.use(express.static(path.resolve('./' + paths.build)));
    app.listen(ports.http_server, function() {
        gutil.log('HTTP listening on', ports.http_server);
        next();
    });
});

/**
 * Default task.
 */
gulp.task('default', ['clean', 'scripts', 'vendor', 'styles', 'server'], function() {
    gutil.log('Default routine');
    var lr_server = livereload(ports.lr_server);

    // Init watch
    gulp.start('html');
    gulp.watch(paths.html, ['html']);

    // Monitor changes
    gulp.watch([paths.build + '/**/*'], function(evt) {
        //gutil.log(gutil.color.cyan(evt.path), 'changed');
        gutil.log(evt.path, 'changed');
        lr_server.changed(evt.path);
    });
});
