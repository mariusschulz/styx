var gulp = require("gulp");
var shell = require("gulp-shell");

var scriptGlobs = ["src/**/*.ts"];

gulp.task("typescript", function() {
    return gulp.src(scriptGlobs)
        .pipe(shell(["node ../TypeScript/built/local/tsc -p src"]));
});

gulp.task("default", ["typescript"], function() {
    return gulp.watch(scriptGlobs, ["typescript"]);
});
