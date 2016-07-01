'use strict';

require.config({
	baseUrl: '../',
	paths: {
		'eventEmitter': 'lib/components/eventEmitter/EventEmitter',
		'jcampconverter': 'lib/components/jcampconverter/dist/jcampconverter',
		'jquery': 'lib/components/jquery/dist/jquery.min',
		'jqueryui': 'lib/components/jquery-ui/ui/minified/jquery-ui.min',
		'jsgraph': 'lib/components/jsgraph/dist/jsgraph'
	}
});

require([ 'jquery', 'src/nmr' ], function( $, NMRHandler ) {

	$( document ).ready( function() {
		$.get( '../test/cosy/121-97-1_zg.jdx' ).then( loadNmr );
	});

	function loadNmr(data){
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

				targetB: {
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

				jsGraphShape: {
					dom: $("#nmr2"),
					bindableFilter: ".bindable",
					bindableFilterClass: ".bindable",
					attributeUnique: "id",
					attributeEquivalents: "data-bindable",

					highlighted: {
						stroke: "blue"
					},

					targettable: {
						"stroke-width": "5px",
						"stroke": "orange"
					}
				}
			}
		});

		nmr.loadJcamp(data, 'My jcamp');
	}

});
