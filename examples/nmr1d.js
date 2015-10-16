

requirejs.config({

	baseUrl: '../',
	paths: {
		'jquery': './lib/components/jquery/dist/jquery.min',
		'jqueryui': './lib/components/jquery-ui/ui/minified/jquery-ui.min',
		'highlightjs': './lib/lib/highlight/highlight.pack',
		'forms': './lib/lib/forms/form',
		'components': './lib/components',
		'graph': './lib/components/jsgraph/dist/jsgraph',
		'sd': './src/sd',
		'fft': './lib/components/fft/fft'
		//'graphs': './lib/components/graph/src'
	}
});

<<<<<<< HEAD
define( [ './src/nmr1d' ] , function( nmrhandler ) {
console.log( nmrhandler );
	"use strict";

	nmrhandler( 
		'../lib/components/jcampconverter/data/indometacin/1h.dx', 
		$("#OCL"),
=======
define( [ './src/nmr' ] , function( nmrhandler ) {

	"use strict";

	nmrhandler( 
		'../test/cosy/121-97-1_zg.jdx', 
		'../lib/components/VisuMol/moleculeA.json',
>>>>>>> 73cd9c371c8ebc53c32b7f6e6c36077e8a407d99
		$( "#nmr" )
	);
	
});
