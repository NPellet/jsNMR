
var baseOptions = {
    baseUrl: './src',
    name: 'build_utils/almond',
    useStrict: true,
    include: ['nmr'],
    paths: {
        eventEmitter: 'empty:',
        jsgraph: 'empty:',
        jquery: 'empty:',
        jcampconverter: 'empty:'
    },
    wrap: {
        startFile: './src/build_utils/wrap.start.js',
        endFile: './src/build_utils/wrap.end.js'
    }
};

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
            },

            targos: {
                src: './dist/jsnmr.js',
                dest: '../visualizer/src/components/jsnmr/dist/jsnmr.js'
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
                options: Object.assign({}, baseOptions, {
                    out: 'dist/jsnmr.js',
                    optimize: 'none'
                })
            }
        }
    });



    var fs = require('fs');

    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-bump');

    grunt.registerTask('default', [ 'requirejs', 'concatSource' ]);


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

    grunt.registerTask( 'patch', function () {

        grunt.task.run('bump:patch:bump-only');
        grunt.task.run('default');
        grunt.task.run('bump:patch:commit-only');

    });
};