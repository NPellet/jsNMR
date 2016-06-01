

module.exports = function(grunt) {


    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),
        
        copy: {

            dist: {

                files: {
                    './dist/jsnmr.js': [ './src/nmr.js'/*, './src/assignation.js' */]
                }    
            },

            toVisualizer: {

                files: {
                    '../visualizer-dev/src/components/jsNMR/src/nmr.js': 'src/nmr.js',
                     '../visualizer-dev/src/components/jsNMR/src/shape.1dnmr.js': 'src/shape.1dnmr.js'
                }
            }
            
        },

        bump: {
            options: {
                files: ['package.json', 'bower.json'],
                updateConfigs: [ 'pkg' ],
                createTag: true,
                push: true,
                pushTo: 'origin',
                commitFiles: ['-a'],
                runTasks: ['default']
            }
        },
        
        requirejs: {
            compile: {
                options: {
                    baseUrl: './',
                    include: ['./src/nmr.js'],
                    out: 'dist/jsnmr.js',
                    paths: {
                        jsgraph: 'empty:',
                        jquery: 'empty:',
                        jcampconverter: 'empty:'
                    },
                    optimize: 'none'
                }
            },
            compileMin: {
                options: {
                    baseUrl: './',
                    include: ['./src/nmr.js'],
                    out: 'dist/jsnmr.min.js',
                    paths: {
                        jsgraph: 'empty:',
                        jquery: 'empty:',
                        jcampconverter: 'empty:'
                    },
                    optimize: 'uglify2',
                    generateSourceMaps: true,
                    preserveLicenseComments: false
                }
            }
        }
    });



    var fs = require('fs');

    grunt.loadNpmTasks('grunt-sass');
    grunt.loadNpmTasks('grunt-sloc');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-bump');

    grunt.registerTask('default', [ 'requirejs', 'concatSource', 'concatMin' ]);


    function processSource( source ) {

        return source
                .join("\n")
                .replace( /@VERSION/g, grunt.config('pkg').version )
                .replace( /@DATE/g, ( new Date() ).toISOString().replace( /:\d+\.\d+Z$/, "Z" ) );

    }


    grunt.registerTask( 'concatSource', 'Concat all src files', function() {

        var source = [ './src/build_utils/header.js', './dist/jsnmr.js' ];
        source = source.map( function( path ) {
            return grunt.file.read( path );
        });
        
        grunt.file.write( './dist/jsnmr.js', processSource( source ) );

    });


    grunt.registerTask( 'concatMin', 'Concat all src files', function() {

        var source = [ './src/build_utils/header.min.js', './dist/jsnmr.min.js' ];
        source = source.map( function( path ) {
            return grunt.file.read( path );
        });
        
        grunt.file.write( './dist/jsnmr.min.js', processSource( source ) );

    });

    grunt.registerTask( 'patch', function () {

        grunt.task.run('bump:patch:bump-only');
        grunt.task.run('default');
        grunt.task.run('bump:patch:commit-only');

    });
};