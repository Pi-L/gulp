//import all the packages that are required

var {
	gulp,
	src,
	dest,
	watch,
	series,
	parallel
} = require('gulp');

// SASS
var sass = require('gulp-sass');
var globSass = require('gulp-sass-globbing');
var cleanCss = require('gulp-clean-css');

// JS
var uglify = require('gulp-terser');
var optimizejs = require('gulp-optimize-js');

//images & SVGs
var imagemin = require('gulp-imagemin');
var svgmin = require('gulp-svgmin');

// various
var prefix = require('gulp-autoprefixer');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');


// cleaning
var del = require('del');

// BrowserSync
var browserSync = require('browser-sync');


var settings = {
	clean: true,
	scripts: true,
	polyfills: false,
	styles: true,
	svgs: false,
	copy: true,
	images: false,
	reload: true
};

// ---------------------------- Paths -------------------------------------

var paths = {
	input: 'src/',
	output: 'dist/',
	scripts: {
		input: 'src/scripts/**/*',
		output: 'dist/scripts/'
	},
	styles: {
		input: 'src/scss/style*.scss',
		inputFolder: 'src/scss/',
		toolsDest: 'src/scss/_tools.scss',
		toolsFiles: 'src/scss/tools/**/*.scss',
		output: 'dist/css/'
	},
	images: {
		input: 'src/images/**/*',
		output: 'dist/images/'
	},
	svgs: {
		input: 'src/svg/*.svg',
		output: 'dist/svg/'
	},
	copy: {
		input: 'src/copy/**/*',
		output: 'dist/'
	},
	reload: './dist/'
};

// ------------------------ Cleaning task -------------------------------------

// Remove pre-existing content from output folders
var cleanDist = function (done) {

	if (!settings.clean) return done();

	// Clean the dist folder
	del.sync([
		paths.output
	]);

	// Signal completion
	return done();

};

// ------------------------ Script tasks ---------------------------------------

var buildScripts = function (done) {

	if (!settings.scripts) return done();

	return src(paths.scripts.input)
		.pipe(sourcemaps.init())
		.pipe(concat('script.min.js'))
		.pipe(uglify())
		.pipe(optimizejs())
		.pipe(sourcemaps.write('.'))
		.pipe(dest(paths.scripts.output));
};

// ------------------------- style tasks ---------------------------------------

// build a import list of a folder of scss files

var buildStyleImports = function (done) {

	if (!settings.styles) return done();

	// Run tasks on all Sass files
	return src(paths.styles.toolsFiles)
		.pipe(globSass({
			path: '_tools.scss'
		}, {
			useSingleQuotes: true,
			signature: '// glob Imports'
		}))
		.pipe(dest(paths.styles.inputFolder));
};


// Process, lint, and minify Sass files

var buildStyles = function (done) {

	if (!settings.styles) return done();

	// Run tasks on all Sass files
	return src(paths.styles.input)
		.pipe(sourcemaps.init())
		.pipe(sass({
			outputStyle: 'expanded',
			sourceComments: true
		}))
		.pipe(prefix({
			cascade: true,
			remove: true
		}))
		.pipe(dest(paths.styles.output + '/debug'))
		.pipe(rename({
			suffix: '.min'
		}))
		.pipe(cleanCss())
		.pipe(sourcemaps.write('.'))
		.pipe(dest(paths.styles.output));
};

// --------------------------- Images tasks ------------------------------------

// Optimize image files
var buildImages = function (done) {
	if (!settings.images) return done();

	return src(paths.images.input)
		.pipe(imagemin()) //minifies images
		.pipe(dest(paths.images.output)); //save minified images
};

// Optimize SVG files
var buildSVGs = function (done) {

	if (!settings.svgs) return done();

	// Optimize SVG files
	return src(paths.svgs.input)
		.pipe(svgmin())
		.pipe(dest(paths.svgs.output));

};

// ----------------------- Copy - Nothing to do ----------------------------

var copyFiles = function (done) {

	if (!settings.copy) return done();

	// Copy static files
	return src(paths.copy.input)
		.pipe(dest(paths.copy.output));

};


// ----------------------- Server, watch, task running ------------------------ 

// Watch for changes to the src directory
var startServer = function (done) {

	if (!settings.reload) return done();

	// Initialize BrowserSync
	browserSync.init({
		server: {
			baseDir: paths.reload
		}
	});

	// Signal completion
	done();

};

// Reload the browser when files change
var reloadBrowser = function (done) {
	if (!settings.reload) return done();
	browserSync.reload();
	done();
};

// Watch for changes
var watchSource = function (done) {
	watch([paths.input + '**/*', '!' + paths.styles.toolsDest], series(exports.default, reloadBrowser));
	done();
};

/**
 * Export Tasks
 */

// Default task
// gulp
exports.default = series(
	cleanDist,
	buildStyleImports,
	parallel(
		buildScripts,
		buildStyles,
		buildImages,
		buildSVGs,
		copyFiles
	)
);

// Watch and reload
// gulp watch
exports.watch = series(
	exports.default,
	startServer,
	watchSource
);