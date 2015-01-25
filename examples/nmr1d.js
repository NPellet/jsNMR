

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

define( [ './src/nmr' ] , function( nmrhandler ) {

	"use strict";

	nmrhandler( 
		'../test/cosy/121-97-1_zg.jdx', 
		'../lib/components/VisuMol/moleculeA.json',
		$( "#nmr" )
	);
	
});
