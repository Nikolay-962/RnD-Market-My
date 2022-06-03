
let project_folder  = require("path").basename(__dirname);
let source_folder = "src";

let {src, dest} = require('gulp'),
  gulp = require('gulp'),  
  prefixer = require('gulp-autoprefixer'),
  sass = require('gulp-sass')(require('sass')),
  sourcemaps = require('gulp-sourcemaps'),
  browsersync = require("browser-sync").create(),
  clean_css = require("gulp-clean-css"),
  imagemin = require("gulp-imagemin"),
  rename = require("gulp-rename"),
  fileinclude = require("gulp-file-include"),
  twig = require("gulp-twig"),
  rigger = require('gulp-rigger'),
  cheerio = require('gulp-cheerio'),
  svgSprite = require('gulp-svg-sprites'),
  nunjucks = require('gulp-nunjucks'),
  webp = require("gulp-webp"),
  uglify = require("gulp-uglify-es").default;
  webphtml = require("gulp-webp-html"),
  del = require("del");
  

let path = {
  build: {
    html: project_folder +  '/',
    js: project_folder +  '/js/',
    css: project_folder +  '/css/',
    img: project_folder +  '/img/',
    svg: project_folder +  "/img/svg/"
  },
  src: {
    html: [source_folder + "/*.html", "!" + source_folder + "/_*.html"],
    js: source_folder + '/js/*.js',
    style: source_folder + '/style/*.scss',
    img: source_folder + '/img/**/*.*',
    svg: source_folder + "/img/svg/*.svg"
  },
  watch: {
    html: source_folder + '/**/*.html',
    js: source_folder + '/js/**/*.js',
    style: source_folder + '/style/**/*.scss',
    img: source_folder + '/img/**/*.*{jpg,jpeg,png,webp,svg}',
    svg: source_folder + "/img/svg/*.svg"
  },
  clean: "./" + project_folder + "/"
};

function browserSync(done) {
  browsersync.init({
    server: {
      baseDir: "./" + project_folder + "/"
    },
    port: 3000
  });
  done();
}

function html() {
  return gulp
    .src(path.src.html)
    .pipe(twig())
    .pipe(nunjucks.compile())
    .pipe(fileinclude())
    .pipe(webphtml())
    .pipe(dest(path.build.html))
    .pipe(browsersync.stream())
}
// Стили
function style() {
  return src(path.src.style)
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(prefixer({
      overrideBrowserslist: ["last 5 versions"],
      cascade: true
    }))
    .pipe(dest(path.build.css))
    .pipe(clean_css())
    .pipe(rename({
      extname: ".min.css"
    }))
    .pipe(sourcemaps.write('/sourcemaps'))
    .pipe(dest(path.build.css))
    .pipe(browsersync.stream())
}

// Изображения
function images() {
  return src(path.src.img)
  .pipe(webp({
    quality: 70
  }))
  .pipe(dest(path.build.img))
  .pipe(src(path.src.img))
  .pipe(imagemin({
    progressive: true,
    svgoPlugins: [{ removeViewBox: false}],
    interlaced: true,
    optimizationLevel: 3
     }))
    .pipe(dest(path.build.img))
    .pipe(browsersync.stream())
}

// SVG
var svgConfig = {
  mode: {
    stack: {
      sprite: "../sprite.svg"
    }
  }
};

function svg() {
  return src(path.src.svg)
  .pipe(cheerio({
    run: function  ($) {
      $('[fill]').removeAttr('fill');
      $('[stroke]').removeAttr('stroke');
      $('[style]').removeAttr('style');
    },
    parserOptions: { xmlMode: true }
  }))
    .pipe(svgSprite(svgConfig))
    .pipe(dest(path.build.svg))
    .pipe(browsersync.stream())
};


// Скрипты
function js() {
  return gulp
    .src(path.src.js)
    .pipe(uglify())
    .pipe(rigger())
    .pipe(rename({
      extname: ".min.js"
    }))
    .pipe(dest(path.build.js))
    .pipe(browsersync.stream())
}

function clean() {
  return del(path.clean);
}

function watchFiles() {
  gulp.watch([path.watch.html], html);
  gulp.watch([path.watch.style], style);
  gulp.watch([path.watch.img], images);
  gulp.watch([path.watch.img], svg);
  gulp.watch([path.watch.js], js);
}

let build = gulp.series(clean, gulp.parallel(js, style, html, images, svg));
let watch = gulp.parallel(build, watchFiles, browserSync);

exports.svg = svg;
exports.images = images;
exports.js = js;
exports.html = html;
exports.style = style;
exports.watch = watch;
exports.default = watch;