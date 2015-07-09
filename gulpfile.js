var gulp = require("gulp");
var browserify = require('gulp-browserify');

var transpiledScriptGlobs = ["./dist/transpiled/**/*.js"];

gulp.task("browserify", function() {
    return gulp.src("./dist/transpiled/index.js")
        .pipe(browserify())
        .pipe(gulp.dest("./dist/browser"));
});

gulp.task("default", ["browserify"], function() {
    return gulp.watch(transpiledScriptGlobs, ["browserify"]);
});
