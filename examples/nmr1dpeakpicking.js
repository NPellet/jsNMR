



requirejs.config({

	baseUrl: '../',
	paths: {
		'jquery': './lib/components/jquery/dist/jquery.min',
		'jqueryui': './lib/components/jquery-ui/ui/minified/jquery-ui.min',
		'highlightjs': './lib/lib/highlight/highlight.pack',
		'forms': './lib/lib/forms/form',
		'components': './lib/components',
		'graph': './lib/components/graph/dist/jsgraph',
		'assignation': './src/assignation',
		'jcampconverter': './lib/components/jcampconverter/src/jcampconverter',
		'graphs': './lib/components/graph/src'
	}
});



require([ '../src/nmr.js' ], function( NMRHandler ) {

	var nmr = new NMRHandler({
				
			dom: $("#nmr2"),

			mode: '2d',
			
			urls: {
				twoD: '../lib/components/jcampconverter/data/indometacin/cosy.dx',
				x: '../lib/components/jcampconverter/data/indometacin/1h.dx', 

			},

			symmetric: true,

			molecule: '../lib/components/VisuMol/moleculeA.json'


		});
});




