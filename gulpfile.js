const gulp = require("gulp");
const gulpBrowserify = require("gulp-browserify");
const gulpRename = require("gulp-rename");

const browserifyEntryFile = "./lib/browser.js";

function browserify() {
  return gulp
    .src(browserifyEntryFile)
    .pipe(gulpBrowserify())
    .pipe(gulpRename("styx.js"))
    .pipe(gulp.dest("./dist/browser"));
}

function browserifyWatch() {
  return gulp.watch(browserifyEntryFile, browserify);
}

gulp.task("browserify", browserify);
gulp.task("browserify-watch", browserifyWatch);
gulp.task("default", gulp.series(browserify, browserifyWatch));
