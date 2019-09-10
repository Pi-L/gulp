//import all the packages that are required

var {
	gulp,
	src,
	dest,
	watch,
	series,
	parallel
} = require('gulp');

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



// SASS
var sass;
var globSass;
var cleanCss;
var glob;
if(settings.styles) {
	sass = require('gulp-sass');
	globSass = require('gulp-sass-globbing');
	cleanCss = require('gulp-clean-css');
	glob = require("glob");
}

// JS
var uglify;
var optimizejs;
if (settings.scripts) {
	uglify = require('gulp-terser');
	optimizejs = require('gulp-optimize-js');
}

//images & SVGs
var imagemin;
if (settings.images) {
	imagemin = require('gulp-imagemin');
}


var svgmin;
if (settings.svgs) {
	svgmin = require('gulp-svgmin');
}

// various
var prefix = require('gulp-autoprefixer');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');
var changed = require('gulp-changed');


// cleaning
var del = require('del');

// BrowserSync
var browserSync = require('browser-sync');

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
	webFonts: {
		inputFont: 'node_modules/@fortawesome/fontawesome-free/webfonts/**/*',
		outputFont: 'src/copy/webfonts/',
		inputScss: 'node_modules/@fortawesome/fontawesome-free/scss/**/*',
		outputScss: 'src/scss/webfonts/fontawesome/'
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
	del.sync([
		paths.styles.toolsDest
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
	// using glob.sync to get an array of files sorted by folders
	return src(glob.sync(paths.styles.toolsFiles))
		.pipe(globSass({
			path: '_tools.scss'
		}, {
			useSingleQuotes: true,
			signature: '// globsass Imports'
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

// ------------------------- web Fonts ---------------------------------------

var copyWebFonts = function (done) {

	if (!settings.copy) return done();

	// Copy webfonts files
	return src(paths.webFonts.inputFont)
		.pipe(changed(paths.webFonts.outputFont))
		.pipe(dest(paths.webFonts.outputFont));
};

var copyWebFontsScss = function (done) {

	if (!settings.copy) return done();

	// Copy webfonts scss files
	return src(paths.webFonts.inputScss)
		.pipe(changed(paths.webFonts.outputScss))
		.pipe(dest(paths.webFonts.outputScss));
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
	// will only watch for file modifications, not folders
	watch([paths.input + '**/*', '!' + paths.styles.toolsDest, '!' + paths.webFonts.outputFont + '**/*', '!' + paths.webFonts.outputScss + '**/*'], series(exports.default, reloadBrowser));
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
	copyWebFonts,
	copyWebFontsScss,
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
