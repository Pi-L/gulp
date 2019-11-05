/* eslint-disable vars-on-top */
/* eslint-disable no-var */
/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
// import all the packages that are required

console.time('Loading plugins');

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
  webFonts: false,
  images: false,
  testing: false,
  ghPages: true,
  reload: true
};

// various
const prefix = require('gulp-autoprefixer');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');
const changed = require('gulp-changed');
// const hash = require('gulp-hash');


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
// var imageminJpegRecompress;
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
  // imageminJpegRecompress = require('imagemin-jpeg-recompress');
}

if (settings.svgs) {
  svgmin = require('gulp-svgmin');
}

console.timeEnd('Loading plugins');

// ---------------------------- Paths -------------------------------------

const paths = {
  input: 'src/',
  output: 'dist/',
  ghPages: 'docs/',
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
const cleanDist = async function cleanDist(done) {

  if (!settings.clean) return done();

  // await sleep(3000);
  // Clean the dist folder
  del.sync([
    paths.output
  ]);

  if (settings.ghPages) {
    del.sync([
      paths.ghPages
    ]);
  }

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
    // * enabling @import /**/* type syntaxe - doesn't support chained imports
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
    // ! level 2 might break things
    .pipe(cleanCss({
      level: 1
    }))
    // * remove unused css - very useful with fontawesome
    .pipe(purgeCss({
      content: [`${paths.output}**/*.html`, `${paths.scripts.output}**/*.*`, `${paths.output}**/*.php`],
      fontFace: false,
      keyframes: false
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(dest(paths.styles.output));
};

// --------------------------- Images tasks ------------------------------------

// Optimize image files
const buildImages = function buildImages(done) {
  if (!settings.images) return done();

  return src(paths.images.input)
    .pipe(imagemin([
      imagemin.gifsicle({ interlaced: true }),
      imagemin.jpegtran({ progressive: true }),
      imagemin.optipng({ optimizationLevel: 5 })
    ],
      { verbose: true })) // minifies images
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
    /*  .pipe(hash()) */
    .pipe(dest(paths.copy.output))

  /* .pipe(hash.manifest(`${paths.copy.output}/assets.json`, {
    deleteOld: true,
    sourceDir: `${__dirname}${paths.copy.output}`
  }))
  .pipe(dest('src/copy/'));
*/
};

// GitHub Pages folder

const GITHUBPAGES = function gitHubPages(done) {

  if (!settings.ghPages) return done();

  // Copy dist to docs
  return src(`${paths.output}**/*`)
    .pipe(dest(paths.ghPages));

};

// ------------------------- web Fonts ---------------------------------------

const copyWebFonts = function copyWebFonts(done) {

  if (!settings.webFonts) return done();

  // Copy webfonts files
  return src(paths.webFonts.inputFont)
    .pipe(changed(paths.webFonts.outputFont))
    .pipe(dest(paths.webFonts.outputFont));
};

const copyWebFontsScss = function copyWebFontsScss(done) {

  if (!settings.webFonts) return done();

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
  copyFiles,

  parallel(
    buildScripts,
    buildImages,
    buildSVGs,
    buildStyles,
    testing
  ),
  GITHUBPAGES
);

// Watch and reload
// gulp watch
exports.watch = series(
  exports.default,
  startServer,
  watchSource
);
