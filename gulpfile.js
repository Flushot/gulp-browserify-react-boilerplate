var gulp            = require('gulp'),
    clean           = require('gulp-clean'),
    browserify      = require('gulp-browserify'),
    //browserify      = require('browserify'),
    uglify          = require('gulp-uglify'),
    cssmin          = require('gulp-cssmin'),
    sourcemaps      = require('gulp-sourcemaps'),
    concat          = require('gulp-concat'),
    less            = require('gulp-less'),
    refresh         = require('gulp-livereload'),
    embedlr         = require('gulp-embedlr'),
    gutil           = require('gulp-util'),
    react           = require('gulp-react'),
    jest            = require('gulp-jest'),
    coffee          = require('gulp-coffee'),
    //es6_transpiler  = require('gulp-es6-module-transpiler'),
    //es6ify          = require('es6ify'),
    path            = require('path'),
    tiny_lr         = require('tiny-lr'),
    express         = require('express');

var lr_server,
    lr_port = 35730,
    web_port = 8888,
    build_path = 'build';

gulp.task('clean', function() {
    gulp.src(build_path, {read: false})
        .pipe(clean());
});

// Common stuff
var scriptPipeline = function(source, dest_file) {
    if (!dest_file)
        dest_file = 'app.js';

    var pipeline = source
        .pipe(browserify({
            insertGlobals: true,
            debug: true //!gulp.env.production
        }))
        // .pipe(es6_transpiler({
        //     type: 'amd',
        //     prefix: 'example'
        // }))
        .pipe(sourcemaps.init())
        .pipe(concat(dest_file))
        .pipe(uglify())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(build_path + '/scripts'));

    if (lr_server)
        pipeline.pipe(refresh(lr_server));

    return pipeline;
};

gulp.task('scripts', function() {
    // JS
    scriptPipeline(
        gulp.src([
            'node_modules/es5-shim/es5-shim.js',
            'app/scripts/**/*.js'
        ]))

    // JSX
    scriptPipeline(
        gulp.src(['app/scripts/**/*.jsx'])
            .pipe(react()));

    // Coffeescript
    scriptPipeline(
        gulp.src(['app/scripts/**/*.coffee'])
            //.pipe(sourcemaps.init())
            .pipe(coffee({bare: true}).on('error', gutil.log)));
            //.pipe(sourcemaps.write()));
});

gulp.task('styles', function() {
    gulp.src([
            'node_modules/bootstrap/dist/css/bootstrap.css',
            'node_modules/bootstrap/dist/css/bootstrap-theme.css',
            'app/styles/**/*.less'
        ])
        //.pipe(sourcemaps.init())
        .pipe(less())
        .pipe(cssmin())
        .pipe(concat('app.css'))
        //.pipe(sourcemaps.write())
        .pipe(gulp.dest(build_path + '/styles'));
});

gulp.task('html', function() {
    gulp.src('app/*.html')
        .pipe(embedlr())
        .pipe(gulp.dest(build_path))
        .pipe(refresh(lr_server));
});

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

gulp.task('server', function() {
    lr_server = tiny_lr();
    lr_server.listen(lr_port, function() {
        gutil.log('LiveReload listening on', lr_port);
    });

    var app = express();
    app.use(express.static(path.resolve('./' + build_path)));
    app.listen(web_port, function() {
        gutil.log('HTTP listening on', web_port);
    });

    gulp.watch(build_path + '/**/*', function(evt) {
        gutil.log(gutil.colors.cyan(evt.path), 'changed');
        lr_server.changed({
            body: {
                files: [evt.path]
            }
        });
    });
});

gulp.task('watch', function() {
    gulp.watch('app/*.html', ['html']);
    gulp.watch('app/scripts/**', ['scripts']);
    gulp.watch('app/styles/**', ['styles']);
});

gulp.task('default', ['scripts', 'html', 'styles', 'server', 'watch']);
