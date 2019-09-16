/* eslint-disable no-var */
/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
// import all the packages that are required

const {
  src,
  dest,
  watch,
  series,
  parallel
} = require('gulp');

const settings = {
  clean: true,
  scripts: true,
  polyfills: false,
  styles: true,
  svgs: false,
  copy: true,
  images: false,
  testing: true,
  reload: true
};

// various
const prefix = require('gulp-autoprefixer');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');
const changed = require('gulp-changed');


// cleaning
const del = require('del');

// BrowserSync
const browserSync = require('browser-sync');

// SASS
var sass;
var cleanCss;
var purgeCss;
var sassGlob;

// js
var uglify;

// images & SVGs
var imagemin;
var svgmin;

if (settings.styles) {
  sass = require('gulp-sass');
  cleanCss = require('gulp-clean-css');
  sassGlob = require('gulp-sass-glob');
  purgeCss = require('gulp-purgecss');
}

if (settings.scripts) {
  uglify = require('gulp-terser');
}

if (settings.images) {
  imagemin = require('gulp-imagemin');
}

if (settings.svgs) {
  svgmin = require('gulp-svgmin');
}

// ---------------------------- Paths -------------------------------------

const paths = {
  input: 'src/',
  output: 'dist/',
  scripts: {
    input: 'src/scripts/**/*',
    output: 'dist/scripts/'
  },
  styles: {
    input: 'src/scss/style*.scss',
    inputFolder: 'src/scss/',
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
const cleanDist = function cleanDist(done) {

  if (!settings.clean) return done();

  // Clean the dist folder
  del.sync([
    paths.output
  ]);

  // Signal completion
  return done();

};

// ------------------------ Script tasks ---------------------------------------

const buildScripts = function buildScripts(done) {

  if (!settings.scripts) return done();

  return src(paths.scripts.input)
    .pipe(sourcemaps.init())
    .pipe(concat('script.min.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(dest(paths.scripts.output));
};

// ------------------------- style tasks ---------------------------------------

// Process, lint, and minify Sass files

const buildStyles = function buildStyles(done) {

  if (!settings.styles) return done();

  // Run tasks on all Sass files
  return src(paths.styles.input)
    .pipe(sassGlob())
    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: 'expanded',
      sourceComments: false
    }))
    .pipe(prefix({
      cascade: true,
      remove: true
    }))
    .pipe(dest(`${paths.styles.output}/debug`))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(cleanCss())
    .pipe(purgeCss({
      content: [`${paths.output}**/*.html`],
      whitelist: ['openBurger']
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(dest(paths.styles.output));
};

// --------------------------- Images tasks ------------------------------------

// Optimize image files
const buildImages = function buildImages(done) {
  if (!settings.images) return done();

  return src(paths.images.input)
    .pipe(imagemin()) // minifies images
    .pipe(dest(paths.images.output)); // save minified images
};

// Optimize SVG files
const buildSVGs = function buildSVGs(done) {

  if (!settings.svgs) return done();

  // Optimize SVG files
  return src(paths.svgs.input)
    .pipe(svgmin())
    .pipe(dest(paths.svgs.output));

};

// ----------------------- Copy - Nothing to do ----------------------------

const copyFiles = function copyFiles(done) {

  if (!settings.copy) return done();

  // Copy static files
  return src(paths.copy.input)
    .pipe(dest(paths.copy.output));

};

// ------------------------- web Fonts ---------------------------------------

const copyWebFonts = function copyWebFonts(done) {

  if (!settings.copy) return done();

  // Copy webfonts files
  return src(paths.webFonts.inputFont)
    .pipe(changed(paths.webFonts.outputFont))
    .pipe(dest(paths.webFonts.outputFont));
};

const copyWebFontsScss = function copyWebFontsScss(done) {

  if (!settings.copy) return done();

  // Copy webfonts scss files
  return src(paths.webFonts.inputScss)
    .pipe(changed(paths.webFonts.outputScss))
    .pipe(dest(paths.webFonts.outputScss));
};

// testing

const testing = function testing(done) {

  if (!settings.testing) return done();

  // Copy testing scripts
  return src('node_modules/@khanacademy/tota11y/dist/tota11y.min.js')
    .pipe(dest(`${paths.copy.output}/scripts/`));

};

// ----------------------- Server, watch, task running ------------------------

// Watch for changes to the src directory
const startServer = function startServer(done) {

  if (!settings.reload) return done();

  // Initialize BrowserSync
  browserSync.init({
    server: {
      baseDir: paths.reload
    }
  });

  // Signal completion
  return done();

};

// Reload the browser when files change
const reloadBrowser = function reloadBrowser(done) {
  if (!settings.reload) return done();
  browserSync.reload();
  return done();
};


// Watch for changes
const watchSource = function watchSource(done) {
  // will only watch for file modifications, not folders
  watch([`${paths.input}**/*`, `!${paths.webFonts.outputFont}**/*`, `!${paths.webFonts.outputScss}**/*`], series(exports.default, reloadBrowser));
  return done();
};

/**
 * Export Tasks
 */

// Default task
// gulp
exports.default = series(
  cleanDist,
  copyWebFonts,
  copyWebFontsScss,
  parallel(
    buildScripts,
    buildImages,
    buildSVGs,
    copyFiles,
    testing
  ),
  buildStyles
);

// Watch and reload
// gulp watch
exports.watch = series(
  exports.default,
  startServer,
  watchSource
);
