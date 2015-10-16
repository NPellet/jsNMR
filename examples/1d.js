



requirejs.config({

	baseUrl: '../',
	paths: {
		'jquery': './lib/components/jquery/dist/jquery.min',
		'jqueryui': './lib/components/jquery-ui/ui/minified/jquery-ui.min',
		'highlightjs': './lib/lib/highlight/highlight.pack',
		'forms': './lib/lib/forms/form',
		'components': './lib/components',
		'graph': './lib/components/graph/dist/jsgraph',
		'assignment': './src/assignment',
		'jcampconverter': './lib/components/jcampconverter/build/jcampconverter',
		'graphs': './lib/components/graph/src'
	}
});



require([ '../src/nmr.js' ], function( NMRHandler ) {


	$( document ).ready( function() {


		var nmr = new NMRHandler({
			dom: $("#nmr2"),
			mode: '1d',
			symmetric: false,

			assignment: {
				domMolecule: $("#OCL"),
				domGlobal: $("#wrapper"),

				filters: {
					target: "[data-atomid]"
				},

				targetA: {
					dom: $("#OCL"),
					bindableFilter: "[data-atomid]",
					attributeUnique: "id",
					attributeEquivalents: "data-atomid",

					highlighted: {
						fill: 'red',
						'fill-opacity': 0.3
					},

					targettable: {
						fill: 'yellow',
						'fill-opacity': 0.3
					}
				},


				targetB: {
					dom: $("#nmr2"),
					bindableFilter: ".bindable",
					bindableFilterClass: ".bindable",
					attributeUnique: "id",
					attributeEquivalents: "id",

					targettable: {
						"stroke-width": "5px",
						"stroke": "orange"
					}
				}
			}
		});

		nmr.load( {

			urls: {
				x: '../test/cosy/121-97-1_zg.jdx', 
			},

			lineColor: 'green',
			label: 'Some molecule'

		})
	});




});




