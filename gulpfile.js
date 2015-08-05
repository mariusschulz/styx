var gulp = require("gulp");
var browserify = require("gulp-browserify");
var rename = require("gulp-rename");

var browserifyEntryFile = "./dist/transpiled/browser.js";

gulp.task("browserify", function() {
    return gulp.src(browserifyEntryFile)
        .pipe(browserify())
        .pipe(rename("styx.js"))
        .pipe(gulp.dest("./dist/browser"));
});

gulp.task("browserify-watch", function() {
    return gulp.watch(browserifyEntryFile, ["browserify"]);
});

gulp.task("default", ["browserify-watch"]);
