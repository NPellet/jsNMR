
(function( global, factory ) {

    if ( typeof module === "object" && typeof module.exports === "object" ) {
        
        module.exports = factory( global );
            
    } else {

        factory( global );

    }

// Pass this if window is not defined yet
} ( window, function( window ) {


	var NMRHandler = function( Graph, Attribution, JcampConverter ) {

		return function( url, mol, nmr ) {

			var graphs = { x: null };
			
			var symmetric = true;

			var integralBasis = undefined;
			var integrals = { x: [], y: [] };

			$.get( url ).then( function( data ) {

				JcampConverter( data ).then( function( data ) {

					doNMR( data )
				} );
			} );


			
			function doNMR( data ) { 

				// Create DOM
				nmr.append('<div />');

				function integral_resizemove( mode, noLoop ) {

					var sumMax = 0;

					for( var i = 0, l = integrals[ mode ].length; i < l ; i ++ ) {
						sumMax = Math.max( sumMax, integrals[ mode ][ i ].lastSum );
					}

					for( var i = 0, l = integrals[ mode ].length; i < l ; i ++ ) {

						integrals[ mode ][ i ].ratio = integrals[ mode ][ i ].lastSum / sumMax;
						integrals[ mode ][ i ].setPosition();

						if( integralBasis ) {
							integrals[ mode ][ i ].data.label[ 0 ].text = Math.round( integrals[ mode ][ i ].lastSum / integralBasis * 100 ) / 100;	
						} else {
							integrals[ mode ][ i ].data.label[ 0 ].text = 1;	
						}
						
						integrals[ mode ][ i ].setLabelPosition( 0 );
						integrals[ mode ][ i ].setLabelText( 0 );
					}

				}

				function integralCreated( mode, integral ) {

					makeNMRIntegral( mode, integral ).then( function( nmrint ) {

						integral.integral = nmrint;
						nmrint.data.pos = integral.getFromData( 'pos' );
						nmrint.data.pos2 = integral.getFromData( 'pos2' );//integral.getFromData( 'pos2' );
					
					} );

				}

				function integralResized( mode, peak ) {

					if( ! peak.integral ) {
						return;
					}

					peak.integral.setPosition();

					integral_resizemove( mode );
				}


				function integralMoved( mode, peak ) {

					if( ! peak.integral ) {
						return;
					}

					peak.integral.setPosition();
					
					integral_resizemove( mode );
				}

				function integralRemoved( mode, peak ) {

					if( peak.integral ) {
						peak.integral.kill();
						integrals[ mode ].splice( integrals[ mode ].indexOf( peak.integral ), 1 );
					}

					integral_resizemove( mode );

				}


				var nmrIntegralOptions = {
					 x: { 
						type: 'nmrintegral', 
						fillColor: 'transparent', 
						strokeColor: 'rgba(100, 0, 0, 0.5)', 
						strokeWidth: '1px',

						label: {
							position: { x: "100px", y: "20px"},
							text: 1,
							color: 'red',
							anchor: 'middle'
						},

						shapeOptions: {
							locked: true,
							maxPx: 200
						}
					 }
				}


				var nmrSignal1dOptions = {

					x: { 
						url: 'src/shape.1dnmr',
						strokeColor: 'green',
						strokeWidth: 2,
						shapeOptions: {

							horizontal: true, 
							forcedCoords: { y: "20px" },
							bindable: true,
							axis: 'x'
						}
					}
				}


				function getNmrSignal1dHandlers( mode ) {

					return { 

						shapeOptions: {
							onCreate: function() {
								integralCreated( mode, this );
							},

							/*onResize: function() {
								integralResized( mode, this );
							},*/

							onMove: function() {
								integralMoved( mode, this );
							},

							onRemove: function() {
								integralRemoved( mode, this );
							}
						}
					}
				}

				nmrSignal1dOptions.x = $.extend( true, {}, nmrSignal1dOptions.x, getNmrSignal1dHandlers( 'x' ) );
			

				function makePeakPosition( mode ) {

					return graphs[ mode ].makeShape( $.extend( true, {}, nmrSignal1dOptions[ mode ] ), {} );
				}

				function makeNMRIntegral( mode, integral ) {

					return graphs[ mode ].makeShape( $.extend( true, {}, nmrIntegralOptions[ mode ] ), {} ).then( function( nmrint ) {

						integrals[ mode ].push( nmrint );
						nmrint.draw();
						return nmrint;
					} );
				}
				




				/********************************************/
				/** LOAD GRAPHS *****************************/
				/********************************************/

				/** LOAD X **********************************/	

				graphs['x'] = new Graph( nmr.children().get(0), {

					close: { left: false, top: false, right: false },
					paddingBottom: 0,
					paddingTop: 0,
					paddingLeft: 0,
					paddingRight: 0,


					onAnnotationChange: function( data, shape ) {
						if( data.type == "nmrsignal1d" ) {

							if( ! integralBasis ) {
								integralBasis = shape.integral.lastSum;
							}

						} else if( data.type == "nmrintegral" ) {

							if( integralBasis ) {

								var fl = parseFloat( shape.data.label[ 0 ].text );
								
								if( fl != 0 ) {
									integralBasis = shape.lastSum / fl;
								}

							}
							
						}

						integral_resizemove('x');
						integral_resizemove('y');
					},

					plugins: {
						'graph.plugin.zoom': { 
							zoomMode: 'x'

						},

						'graph.plugin.shape': nmrSignal1dOptions[ 'x' ],
					},


					dblclick: {
						type: 'plugin',
						plugin: 'graph.plugin.zoom',
						options: {
							mode: 'total'
						}
					},

					pluginAction: {
						'graph.plugin.zoom': { shift: false, ctrl: false },
						'graph.plugin.shape': { shift: true, ctrl: false }
					}

				}, function( graph ) {



					graph.setHeight(500);

					/********************************************/
					/** LOAD SERIES *****************************/
					/********************************************/

					var serie_x = graph.newSerie("seriex" )
						.setLabel( "My serie" )
						.autoAxis()
						.setData( data.spectra[ 0 ].data[ 0 ] );

					serie_x.getYAxis().setDisplay( false ).togglePrimaryGrid( false ).toggleSecondaryGrid( false );
					serie_x.getXAxis().flip(true).setLabel('ppm').togglePrimaryGrid( false ).toggleSecondaryGrid( false ).setTickPosition( 'outside' )

				
					/********************************************/
					/** DRAW ALL ********************************/
					/********************************************/


					graph.redraw( );	
					graph.drawSeries();	



				} );

			
				/********************************************/
				/** DRAW MOLECULE ***************************/
				/** INIT ASSIGN *****************************/
				/********************************************/

				Attribution( nmr, graphs );
				loadMolecule( mol );
			}


			
			function loadMolecule( molUrl ) {

				return;
				require( [ './lib/components/VisuMol/src/molecule' ], function( Molecule ) {


					var dom = document.createElement("div");
					dom.setAttribute('style', 'position: absolute;');
					// Create a new molecule
					var molecule = new Molecule( { maxBondLengthAverage: 40 } );

					// Adds the molecule somewhere in the DOM
					dom.appendChild( molecule.getDom() );

					// Set the size of the canvas
					molecule.resize( 300, 200 );

					// Fetches the JSON and uses it as the source data
					molecule.setDataFromJSONFile( molUrl ).then( function() {

						molecule.render();

					});

					nmr.prepend( dom );
				} );
			}
		}
	}



    if( typeof define === "function" && define.amd ) {
        
        define( [ 'graph', 'assignation', 'jcampconverter' ], function( Graph, Assignation, JcampConverter ) {
            return NMRHandler( Graph, Assignation, JcampConverter );
        });

    } else if( window ) {
        
        if( window.Graph && window.Assignation && window.JcampConverter ) {

        	window.NMRHandler = NMRHandler( window.Graph, window.Assignation, window.JcampConverter );	

        } else {
        	throw "Graph, Attribution or Jcamp is not defined"
        }
    }
}));
