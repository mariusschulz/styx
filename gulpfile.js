var gulp = require("gulp");
var browserify = require('gulp-browserify');
var rename = require('gulp-rename');

var transpiledScriptGlobs = ["./dist/transpiled/**/*.js"];

gulp.task("browserify", function() {
    return gulp.src("./dist/transpiled/browser.js")
        .pipe(browserify())
        .pipe(rename("styx.js"))
        .pipe(gulp.dest("./dist/browser"));
});

gulp.task("default", ["browserify"], function() {
    return gulp.watch(transpiledScriptGlobs, ["browserify"]);
});
