var gulp = require("gulp");
var shell = require("gulp-shell");

var scriptGlobs = ["src/**/*.ts"];

gulp.task("typescript", function() {
	gulp.src(scriptGlobs)
        .pipe(shell(["node ../TypeScript/built/local/tsc src/styx.ts --out dist/styx.js"]));
});

gulp.task("default", function() {
    gulp.watch(scriptGlobs, ["typescript"]); 
});
