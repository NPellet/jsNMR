



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
/*
	var nmr = new NMRHandler({
				
		dom: $("#nmr2"),
		mode: '1d',
		symmetric: false,
	});
*/

/*
	nmr.load( {

		urls: {
			twoD: '../lib/components/jcampconverter/data/indometacin/cosy.dx',
			x: '../lib/components/jcampconverter/data/indometacin/1h.dx', 
		},

		molecule: '../lib/components/VisuMol/moleculeA.json',


		lineColor: 'green'

	})


	nmr.load( {

		urls: {
			x: '../test/sqzdec1.jdx', 
		},

		lineColor: 'blue'

	});


*/


	var nmr = new NMRHandler({
				
			dom: $("#nmr2"),
			mode: '2d',
			symmetric: true
	});

	nmr.load( {

		urls: {
			twoD: '../test/cosy/84-74-2_cosygpppqf.jdx',
			x: '../lib/components/jcampconverter/data/indometacin/1h.dx'

		},

		lineColor: 'rgba(200, 0, 0, 1)',
		twoDColor: {

			fromPositive: { h: 100, s: 0.3, l: 0.7 },
			toPositive: { h: 100, s: 1, l: 0.5},

			fromNegative: { h: 100, s: 0.3, l: 0.5  },
			toNegative: { h: 100, s: 1, l: 0.3 }
		},
		
		molecule: '../lib/components/VisuMol/moleculeA.json'

	});

	nmr.load( {

		urls: {
			twoD: '../test/cosy/121-97-1_cosygpppqf.jdx',
			x: '../lib/components/jcampconverter/data/indometacin/1h.dx'

		},

		lineColor: 'blue',

		twoDColor: {

			fromPositive: { h: 220, s: 0.3, l: 0.7 },
			toPositive: { h: 220, s: 1, l: 0.5},

			fromNegative: { h: 220, s: 0.3, l: 0.5  },
			toNegative: { h: 220, s: 1, l: 0.3 }
		},
		

		molecule: '../lib/components/VisuMol/moleculeA.json'

	});


});




