var gulp         = require('gulp');
var sass         = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var sourcemaps   = require('gulp-sourcemaps');
var browser_sync = require('browser-sync');
var uglify       = require('gulp-uglify');
var concat       = require('gulp-concat');
var rename       = require('gulp-rename');
var run_sequence = require('run-sequence');
var del          = require('del');
var nunjucksRender = require('gulp-nunjucks-render');

/**
 * App specs
 */
var app = {
    dist_path: './dist',
    src_path:  './src',
    main_css_file_name: 'main.min.css',
    main_js_file_name:  'main.min.js'
};

/**
 * Commonly used dist paths
 */
var dist_path = {
    root:  app.dist_path,
    css:   app.dist_path+'/assets/css',
    js:    app.dist_path+'/assets/js'
};

/**
 * Commonly used src paths
 */
var src_path = {
    root:   app.src_path,
    sass:   app.src_path+'/sass',
    html:   app.src_path+'/html',
    views:  app.src_path+'/html/views',
    vendor: app.src_path+'/bower_components'
};

/**
 * Server config
 */
var browser_sync_config = {
    base_dir: dist_path.root,
    open: true,
    port: 3000,
    notify: true
};

/**
 * .js files to compile
 */
var js_files = [
    src_path.vendor+'/jquery/dist/jquery.min.js'
];

/**
 * Compile .scss files into dist
 * Use autoprefixer
 * Write sourcemaps
 * Reload browser
 */
gulp.task('sass', function() {
    return gulp.src(src_path.sass+'/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({
            outputStyle: 'compressed',
            onError: browser_sync.notify
        })
            .on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 2 versions']
        }))
        .pipe(rename(app.main_css_file_name))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(dist_path.css))
        // make browser_sync inject only .css files with 'match'
        .pipe(browser_sync.stream({match: '**/*.css'}));
});

/**
 * Move .html files into dist
 * Reload browser
 */
gulp.task('html', function() {
    return gulp.src(src_path.html+'/*.html')
        .pipe(nunjucksRender({
            path: [src_path.views]
        }))
        .pipe(gulp.dest(dist_path.root))
        .pipe(browser_sync.stream());
});

/**
 * Compress .js into dist
 */
gulp.task('js', function() {
    return gulp.src(js_files)
        .pipe(sourcemaps.init())
        .pipe(concat(app.main_js_file_name))
        .pipe(uglify())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(dist_path.js));
});

/**
 * Setup browser-sync server with dist folder as root
 * Wait for build task to be finished
 */
gulp.task('browser-sync-server', ['build'], function() {
    browser_sync({
        server: {
            baseDir: browser_sync_config.base_dir
        },
        open: browser_sync_config.open,
        port: browser_sync_config.port,
        notify: browser_sync_config.notify
    })
});

/**
 * Watch files and run task when they change
 */
gulp.task('watch', function() {
    gulp.watch(src_path.sass+'/**/*.+(scss|sass)', ['sass']);
    gulp.watch(src_path.root+'/**/*.html', ['html']);
});

/**
 * Delete dist
 */
gulp.task('clean', function(cb) {
    del([
        //dist_path.root+'/*.html',
        dist_path.root
    ], cb);
});

/**
 * Build dist
 */
gulp.task('build', ['sass', 'html', 'js']);

/**
 * Default
 */
gulp.task('default', function(callback) {
    run_sequence(
        ['clean', 'watch'],
        ['build'],
        ['browser-sync-server'],
        callback
    );
});