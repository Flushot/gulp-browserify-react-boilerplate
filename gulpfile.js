'use strict';

// Dependencies
var gulp            = require('gulp'),
    concat          = require('gulp-concat-sourcemap'),
    cssmin          = require('gulp-cssmin'),
    embedlr         = require('gulp-embedlr'),
    gfilter         = require('gulp-filter'),
    jest            = require('gulp-jest'),
    less            = require('gulp-less'),
    livereload      = require('gulp-livereload'),
    rename          = require('gulp-rename'),
    rimraf          = require('gulp-rimraf'),
    sourcemaps      = require('gulp-sourcemaps'),
    uglify          = require('gulp-uglify'),
    gutil           = require('gulp-util'),
    browserify      = require('browserify'),
    shim            = require('browserify-shim'),
    reactify        = require('reactify'),
    es6ify          = require('es6ify'),
    path            = require('path'),
    exit            = require('exit'),
    express         = require('express'),
    source          = require('vinyl-source-stream');

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
            //'node_modules/bootstrap/dist/css/bootstrap-theme.css',
            'app/styles/**/*.css',
            'app/styles/**/*.less'
        ],

        // These scripts get concatenated and evaluated in global scope
        vendor: [
            //'bower_components/react/react-with-addons.js',            
            'node_modules/es6ify/node_modules/traceur/bin/traceur-runtime.js',
            //'node_modules/jquery/dist/jquery.js',
            //'node_modules/bootstrap/dist/js/bootstrap.js',
            //'node_modules/moment/moment.js'
            //'vendor/**/*.js'
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
        //.src(paths.vendor)
        //.pipe(uglify())
        .pipe(concat('vendor.js'))
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
    var lessFilter = gfilter(['*.less']);
    gulp.src(paths.styles)
        //.pipe(sourcemaps.init())
        .pipe(lessFilter)
            .pipe(less({path: './app/styles'}))
        .pipe(lessFilter.restore())
        //.pipe(cssmin())
        .pipe(concat('app.css'))
        //.pipe(sourcemaps.write())
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

    var bundler = browserify('./' + paths.main, {debug: true})
            .require(require.resolve('react'))
            .transform(reactify)
            .transform(es6ify.configure(/.jsx/));

    var stream = bundler.bundle();
    stream.on('error', function (err) {
        console.error('Compilation error:', err);
        exit(1);
    });

    stream.pipe(source('./' + paths.main))
          .pipe(rename('app.js'))
          .pipe(gulp.dest(paths.build));
    
    gulp.watch(paths.scripts, ['scripts']);
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
        gutil.log(evt.path, 'changed');
        lr_server.changed(evt.path);
    });
});
