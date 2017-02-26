/**
 * Created by shashank on 16/03/16.
 */
'use strict';

var gulp = require('gulp');

var browserSync = require('browser-sync').create();

gulp.task('default', function () {
    browserSync.init({
        server: "src"
    });
    browserSync.stream();

    gulp.watch('src/*.html').on('change', browserSync.reload);
    gulp.watch('src/js/*.js').on('change', browserSync.reload);
    gulp.watch('src/css/*.css').on('change', browserSync.reload);
});