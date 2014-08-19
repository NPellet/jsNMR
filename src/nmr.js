
(function( global, factory ) {

    if ( typeof module === "object" && typeof module.exports === "object" ) {
        module.exports = factory( global );
    } else {
        factory( global );
    }

} ( window, function( window ) {

	var factory = function( Graph, Attribution, JcampConverter ) {

		// Root here
		var defaults = {

			mode: '1d',
			molecule: false,
			urls: {

			}
		}

		function fetchUrls( nmr, urls ) {

			var fetching = [];

			for( var i in urls ) {

				fetching.push( $.get( urls[ i ] ).then( function( data ) { return JcampConverter( data ) } ) );
			}

			nmr.divLoading = $("<div />").css( {

				width: nmr.getDom().width(),
				height: nmr.getDom().height(),
				position: 'absolute',
				backgroundColor: 'rgba(200, 200, 200, 0.5)',
				textAlign: 'center',
				lineHeight: nmr.getDom().height() + "px",
				fontSize: '2em',
				border: "1px solid #c0c0c0"

			} ).html("Loading...");

			nmr.getDom().prepend( nmr.divLoading );

			$.when.apply( $, fetching ).then( function() {

				var j = 0;
				for( i in urls ) {

					urls[ i ] = arguments[ j ];
					j++;
				}

				nmr.divLoading.remove();
				doNMR( nmr, urls );

			} );
		}


		function integral_resizemove( nmr, mode, noLoop ) {

			var sumMax = 0;

			for( var i = 0, l = nmr.integrals[ mode ].length; i < l ; i ++ ) {
				sumMax = Math.max( sumMax, nmr.integrals[ mode ][ i ].lastSum );
			}

			for( var i = 0, l = nmr.integrals[ mode ].length; i < l ; i ++ ) {

				nmr.integrals[ mode ][ i ].ratio = nmr.integrals[ mode ][ i ].lastSum / sumMax;
				nmr.integrals[ mode ][ i ].setPosition();

				if( nmr.integralBasis ) {
					nmr.integrals[ mode ][ i ].data.label[ 0 ].text = Math.round( nmr.integrals[ mode ][ i ].lastSum / nmr.integralBasis * 100 ) / 100;	
				} else {
					nmr.integrals[ mode ][ i ].data.label[ 0 ].text = 1;	
				}
				
				nmr.integrals[ mode ][ i ].setLabelPosition( 0 );
				nmr.integrals[ mode ][ i ].setLabelText( 0 );
			}


			if( nmr.isSymmetric( ) && ! noLoop ) {
				integral_resizemove( nmr, getOtherMode( nmr, mode ), true );
			}
		}

		function setSyncPos( nmr, from, to ) {

			var pos1 = from.getFromData( 'pos' ),
				pos2 = from.getFromData( 'pos2' );

			var pos1t = to.getFromData( 'pos' ),
				pos2t = to.getFromData( 'pos2' );

			pos1t.x = pos1.y;
			pos1t.y = pos1.x;

			pos2t.x = pos2.y;
			pos2t.y = pos2.x;

		} 

		function integralCreated( nmr, mode, integral ) {

			makeNMRIntegral( nmr, mode, integral ).then( function( nmrint ) {

				integral.integral = nmrint;
				nmrint.data.pos = integral.getFromData( 'pos' );
				nmrint.data.pos2 = integral.getFromData( 'pos2' );//integral.getFromData( 'pos2' );
			
			} );

		//	 poses.push( integral.getFromData('pos') );

			if( nmr.isSymmetric( ) ) {

				var otherMode = getOtherMode( nmr, mode );

				makePeakPosition( nmr, otherMode ).then( function( shape ) {

					integral.syncTo = shape;
					shape.syncTo = integral;

					shape.data.pos = {};
					shape.data.pos2 = {};
					shape.draw();

					setSyncPos( nmr, integral, integral.syncTo );

					shape.redrawImpl();

					makeNMRIntegral( nmr, otherMode ).then( function( nmrint ) {

						shape.integral = nmrint;
						nmrint.data.pos = shape.getFromData( 'pos' );
						nmrint.data.pos2 = shape.getFromData( 'pos2' );

					});	
				});
			}
		}

		function integralResized( nmr, mode, peak ) {

			if( ! peak.integral ) {
				return;
			}

			peak.integral.setPosition();

			if( peak.syncTo ) {
				setSyncPos( nmr, peak, peak.syncTo );
				peak.syncTo.redrawImpl();

				if( peak.syncTo.integral ) {
					peak.syncTo.integral.setPosition();
				}
			}
		

			integral_resizemove( nmr, mode );
		}


		function integralMoved( nmr, mode, peak ) {

			if( ! peak.integral ) {
				return;
			}

			peak.integral.setPosition();

			if( peak.syncTo ) {
				setSyncPos( nmr, peak, peak.syncTo );
				peak.syncTo.redrawImpl();
				peak.syncTo.integral.setPosition();
			}

			integral_resizemove( nmr, mode );
		}

		function integralRemoved( nmr, mode, peak ) {

			if( peak.integral ) {
				peak.integral.kill();
				nmr.integrals[ mode ].splice( nmr.integrals[ mode ].indexOf( peak.integral ), 1 );
			}

			if( peak.syncTo ) {

				peak.syncTo.kill();
				nmr.integrals[ getOtherMode( mode ) ].splice( nmr.integrals[ getOtherMode( nmr, mode ) ].indexOf( peak.syncTo.integral ), 1 );
			}

			integral_resizemove( nmr, mode );

		}

		function getOtherMode( nmr, mode ) {
			return mode == 'x' ? 'y' : ( mode == 'y' ? 'x' : ( console.error( "Mode not recognized") ) );
		}

		function makePeakPosition( nmr, mode ) {

			return nmr.graphs[ mode ].makeShape( $.extend( true, {}, nmr.nmrSignal1dOptions[ mode ] ), {} );
		}

		function makeNMRIntegral( nmr, mode, integral ) {

			return nmr.graphs[ mode ].makeShape( $.extend( true, {}, nmr.nmrIntegralOptions[ mode ] ), {} ).then( function( nmrint ) {

				nmr.integrals[ mode ].push( nmrint );
				nmrint.draw();
				return nmrint;
			} );
		}
		

		function getNmrSignal1dHandlers( nmr, mode ) {

			return { 

				shapeOptions: {
					onCreate: function() {
						integralCreated( nmr, mode, this );
					},

					onResize: function() {
						integralResized( nmr, mode, this );
					},

					onMove: function() {
						integralMoved( nmr, mode, this );
					},

					onRemove: function() {
						integralRemoved( nmr, mode, this );
					}
				}
			}
		}



			
		function doNMR( nmr, data ) { 

			nmr.data = data;

			switch( nmr.getMode() ) {

				case '1d':

					nmr.options.dom.append('<div />');
					nmr.makeGraphs1D();

				break;

				case '2d':

					nmr.options.dom.append('<table cellpadding="0" cellspacing="0" class="nmr-wrapper"><tr><td></td><td class="nmr-1d nmr-1d-x nmr-main"></td></tr><tr class="nmr-main"><td class="nmr-1d nmr-1d-y"></td><td class="nmr-2d"></td></tr></table>');
					nmr.makeGraphs2D();
				break;

			}
		}
	

		var NMR = function( options ) {

			this.options = $.extend( true, {}, defaults, options );

			
			var urls = {};

			switch( this.options.mode ) {

				case '2d':

					this.options.urls.twoD = this.options.urls.twoD || this.options.urls.url;
					this.options.urls.x = this.options.urls.x || this.options.urls.oneD;
					this.options.urls.y = ( this.options.urls.y || this.options.urls.oneD ) || ( this.options.symmetric ? this.options.urls.x : false );

					urls.twoD = this.options.urls.twoD; // Compulsory
					
					if( this.options.urls.x ) {
						urls.x = this.options.urls.x;
					}

					if( this.options.urls.y ) {
						urls.y = this.options.urls.y;
					}

					this.graphs = { x: null, y: null, _2d: null };
					this.integrals = { x: [], y: [], _2d: [] };
				break;

				case '1d':
					
					this.options.urls.oneD = this.options.url || this.options.urls.oneD || this.options.urls.x;
					urls.x = this.options.urls.oneD;	

					this.graphs = { x: null };
					this.integrals = { x: [] };


				break;
			}

			fetchUrls( this, urls );

			// 1D
	
			this.nmrIntegralOptions = {
				 x: { 
					type: 'nmrintegral', 
					fillColor: 'transparent', 
					strokeColor: 'rgba(100, 0, 0, 0.5)', 
					strokeWidth: '1px',
					label: {
						position: { },
						text: 1,
						color: 'red',
						anchor: 'middle'
					},

					shapeOptions: {
						locked: true
					}
				 }
			}

			if( this.isSymmetric() ) {
				this.nmrIntegralOptions.y = $.extend(true, {}, this.nmrIntegralOptions.x );
				this.nmrIntegralOptions.y.shapeOptions.axis = 'y';
			}

			this.nmrSignal1dOptions = {

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


			if( this.isSymmetric() ) {
				this.nmrSignal1dOptions.y = $.extend(true, {}, this.nmrSignal1dOptions.x );
				this.nmrSignal1dOptions.y.shapeOptions.axis = 'y';
			}

			this.nmrSignal1dOptions.x = $.extend( true, {}, this.nmrSignal1dOptions.x, getNmrSignal1dHandlers( this, 'x' ) );
			this.nmrSignal1dOptions.y = $.extend( true, {}, this.nmrSignal1dOptions.x, getNmrSignal1dHandlers( this, 'y' ) );



			// 2D
			this.nmrSignal2dOptions = {

			
				url: 'src/shape.2dnmr',
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

		NMR.prototype.isSymmetric = function() {
			return this.options.symmetric || false;
		}

		NMR.prototype.getMode = function() {
			return this.options.mode;
		}

		NMR.prototype.getDom = function() {
			return this.options.dom;
		}


		/********************************************/
		/** LOAD GRAPHS *****************************/
		/********************************************/

		NMR.prototype.makeGraphs2D = function() {


			var self = this;
			

			/** LOAD 2D *********************************/
			
			this.graphs[ '_2d' ] = new Graph( this.getDom().find('.nmr-2d').get(0), {

				close: { left: false, top: false, right: false },

				paddingBottom: 0,
				paddingTop: 0,
				paddingLeft: 0,
				paddingRight: 0,

				onAnnotationChange: function( data, shape ) {

					var pos = data.pos;
					pos.x = ( pos.x + data.pos2.x ) / 2;
					pos.y = ( pos.y + data.pos2.y ) / 2;

					this.makeShape( {

						type: 'cross',
						pos: pos,

						strokeColor: 'red',
						strokeWidth: 3,

						shapeOptions: {
							length: 20
						}

					} ).then( function( shape2 ) {

						shape2.draw();
						shape2.redrawImpl();

					} );

					// ANDRES
					// You can do here your processing and create new shapes
					shape.kill();
				},

				plugins: {

					'graph.plugin.zoom': { 

						zoomMode: 'xy',
						onZoomStart: function( graph, x, y, e, target ) {
							self.graphs['x']._pluginExecute( 'graph.plugin.zoom', 'onMouseDown', [ self.graphs['x'], x, y, e, true ] );
							self.graphs['y']._pluginExecute( 'graph.plugin.zoom', 'onMouseDown', [ self.graphs['y'], x, y, e, true ] );
						},

						onZoomMove: function( graph, x, y, e, target ) {
							self.graphs['x']._pluginExecute( 'graph.plugin.zoom', 'onMouseMove', [ self.graphs['x'], x, y, e, true ] );
							self.graphs['y']._pluginExecute( 'graph.plugin.zoom', 'onMouseMove', [ self.graphs['y'], x, y, e, true ] );
						},

						onZoomEnd: function( graph, x, y, e, target ) {
							self.graphs['x']._pluginExecute( 'graph.plugin.zoom', 'onMouseUp', [ self.graphs['x'], x, y, e, true ] );
							self.graphs['y']._pluginExecute( 'graph.plugin.zoom', 'onMouseUp', [ self.graphs['y'], x, y, e, true ] );
						},

						onDblClick: function( x, y, prefs, e ) {
							
							self.graphs['y']._pluginExecute( 'graph.plugin.zoom', 'onDblClick', [ self.graphs['y'], x, y, { mode: 'total' }, e, true ] );
							self.graphs['x']._pluginExecute( 'graph.plugin.zoom', 'onDblClick', [ self.graphs['x'], x, y, { mode: 'total' }, e, true ] );
						}
					},

					'graph.plugin.shape': {
						type: 'rect',

						fillColor: 'rgba(100, 0, 0, 0.3)',

						shapeOptions: { 
							bindable: false,

						}
						
					},
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

			} );



			/** LOAD X **********************************/	

			this.graphs['x'] = new Graph( this.getDom().find('.nmr-1d-x').get(0), {

				close: { left: false, top: false, right: false },
				paddingBottom: 0,
				paddingTop: 0,
				paddingLeft: 0,
				paddingRight: 0,

				onAnnotationChange: function( data, shape ) {

					if( data.url == "src/shape.1dnmr" ) {

						if( ! self.integralBasis ) {
							self.integralBasis = shape.integral.lastSum;
						}


					} else if( data.type == "nmrintegral" ) {

						if( self.integralBasis ) {

							var fl = parseFloat( shape.data.label[ 0 ].text );
							
							if( fl != 0 ) {
								self.integralBasis = shape.lastSum / fl;
							}

						}
						
					}

					integral_resizemove( self, 'x' );

					if( self.isSymmetric() ) {
						integral_resizemove( self, 'y' );
					}
				},

				plugins: {
					'graph.plugin.zoom': { 
						zoomMode: 'x',

						onZoomStart: function( graph, x, y, e, target ) {

							self.graphs[ '_2d' ]._pluginExecute( 'graph.plugin.zoom', 'onMouseDown', [ self.graphs[ '_2d' ], x, undefined, e, true ] );

						},

						onZoomMove: function( graph, x, y, e, target ) {

							self.graphs[ '_2d' ]._pluginExecute( 'graph.plugin.zoom', 'onMouseMove', [ self.graphs[ '_2d' ], x, undefined, e, true ] );

						},

						onZoomEnd: function( graph, x, y, e, target ) {

							self.graphs[ '_2d' ]._pluginExecute( 'graph.plugin.zoom', 'onMouseUp', [ self.graphs[ '_2d' ], x, undefined, e, true ] );

						},

						onDblClick: function( x, y, prefs, e ) {
							
							self.graphs[ '_2d' ]._pluginExecute( 'graph.plugin.zoom', 'onDblClick', [ self.graphs[ '_2d' ], x, y, { mode: 'xtotal' }, e, true ] );
							
						}

					},

					'graph.plugin.shape': self.nmrSignal1dOptions[ 'x' ],
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

			} );


			/** LOAD Y **********************************/
			
			this.graphs['y'] = new Graph( this.getDom().find('.nmr-1d-y').get(0), { 

				close: { left: false, top: false, right: false },

				plugins: {
					'graph.plugin.zoom': { 
						zoomMode: 'y',
						onZoomStart: function( graph, x, y, e, target ) {

							self.graphs[ '_2d' ]._pluginExecute( 'graph.plugin.zoom', 'onMouseDown', [ self.graphs[ '_2d' ], undefined , y, e, true ] );

						},

						onZoomMove: function( graph, x, y, e, target ) {

							self.graphs[ '_2d' ]._pluginExecute( 'graph.plugin.zoom', 'onMouseMove', [ self.graphs[ '_2d' ], undefined , y, e, true ] );

						},

						onZoomEnd: function( graph, x, y, e, target ) {

							self.graphs[ '_2d' ]._pluginExecute( 'graph.plugin.zoom', 'onMouseUp', [ self.graphs[ '_2d' ], undefined, y, e, true ] );

						},

						onDblClick: function( x, y, prefs, e ) {
							
							self.graphs[ '_2d' ]._pluginExecute( 'graph.plugin.zoom', 'onDblClick', [ self.graphs[ '_2d' ], x, y, { mode: 'ytotal' }, e, true ] );
							
						}
					},

					'graph.plugin.shape': self.nmrSignal1dOptions[ 'y' ]
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
				},

				wheel: {
					type: 'plugin',
					plugin: 'graph.plugin.zoom',
					options: {
						direction: 'x'
					}
				},

				paddingBottom: 0,
				paddingTop: 0,
				paddingLeft: 0,
				paddingRight: 0

			} );
			

			/********************************************/
			/** LOAD SERIES *****************************/
			/********************************************/

			var serie_x = this.graphs['x'].newSerie("seriex" )
				.setLabel( "My serie" )
				.autoAxis()
				.setData( this.data.x.spectra[ 0 ].data[ 0 ] );

			serie_x.getYAxis().setDisplay( false ).togglePrimaryGrid( false ).toggleSecondaryGrid( false );
			serie_x.getXAxis().flip(true).setLabel('ppm').togglePrimaryGrid( false ).toggleSecondaryGrid( false ).setTickPosition( 'outside' )

			var serie_y = this.graphs['y'].newSerie("seriey", { flip: true } )
				.setLabel( "My serie" )
				.setXAxis( this.graphs['y'].getBottomAxis( ) )
				.setYAxis( this.graphs['y'].getRightAxis( ) )
				.setData( this.data.y.spectra[ 0 ].data[ 0 ] );

			serie_y.getYAxis().setLabel('ppm').togglePrimaryGrid( false ).toggleSecondaryGrid( false ).flip( true ).setTickPosition( 'outside' );
			serie_y.getXAxis().togglePrimaryGrid( false ).toggleSecondaryGrid( false ).setDisplay( false ).flip( true );


			var serie_2d = this.graphs[ '_2d' ].newSerie("serie2d", { }, 'contour' )
				.setLabel( "My serie" )
				.autoAxis()
				.setData( this.data.twoD.contourLines )

			serie_2d.getXAxis().forceMin( serie_x.getXAxis().getMinValue( ) );
			serie_2d.getXAxis().forceMax( serie_x.getXAxis().getMaxValue( ) );


			serie_2d.getYAxis().forceMin( serie_y.getYAxis().getMinValue( ) );
			serie_2d.getYAxis().forceMax( serie_y.getYAxis().getMaxValue( ) );


			serie_2d.getXAxis().setLabel('ppm').togglePrimaryGrid( false ).toggleSecondaryGrid( false ).setDisplay( false ).flip( true );
			serie_2d.getYAxis().togglePrimaryGrid( false ).toggleSecondaryGrid( false ).setDisplay( false ).flip( true );


			/********************************************/
			/** DRAW ALL ********************************/
			/********************************************/

			this.graphs['y'].redraw( );
			this.graphs['y'].drawSeries();	

			this.graphs['x'].redraw( );	
			this.graphs['x'].drawSeries();	

			this.graphs[ '_2d' ].redraw( );
			this.graphs[ '_2d' ].drawSeries();

		}


		NMR.prototype.makeGraphs1D = function() {

			var self = this;

			this.graphs['x'] = new Graph( this.getDom().children().get(0), {

				close: { left: false, top: false, right: false },
				paddingBottom: 0,
				paddingTop: 0,
				paddingLeft: 0,
				paddingRight: 0,


				onAnnotationChange: function( data, shape ) {


					if( data.type == "nmrsignal1d" ) {

						if( ! self.integralBasis ) {
							self.integralBasis = shape.integral.lastSum;
						}

					} else if( data.type == "nmrintegral" ) {

						if( self.integralBasis ) {

							var fl = parseFloat( shape.data.label[ 0 ].text );
							
							if( fl != 0 ) {
								self.integralBasis = shape.lastSum / fl;
							}

						}
						
					}

					integral_resizemove( self, 'x' );
				},

				plugins: {
					'graph.plugin.zoom': { 
						zoomMode: 'x'

					},

					'graph.plugin.shape': this.nmrSignal1dOptions[ 'x' ],
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

			} );


			this.graphs[ 'x' ].setHeight(500);

			/********************************************/
			/** LOAD SERIES *****************************/
			/********************************************/

			var serie_x = this.graphs[ 'x' ].newSerie("seriex" )
				.setLabel( "My serie" )
				.autoAxis()
				.setData( this.data.x.spectra[ 0 ].data[ 0 ] );

			serie_x.getYAxis().setDisplay( false ).togglePrimaryGrid( false ).toggleSecondaryGrid( false );
			serie_x.getXAxis().flip(true).setLabel('ppm').togglePrimaryGrid( false ).toggleSecondaryGrid( false ).setTickPosition( 'outside' )

		
			/********************************************/
			/** DRAW ALL ********************************/
			/********************************************/


			this.graphs[ 'x' ].redraw( );	
			this.graphs[ 'x' ].drawSeries();	

		}

		return NMR;

	}; // End Factory



    if( typeof define === "function" && define.amd ) {
        
        define( [ 'graph', 'assignation', 'jcampconverter' ], function( Graph, Assignation, JcampConverter ) {
            return factory( Graph, Assignation, JcampConverter );
        });

    } else if( window ) {
        
        if( window.Graph && window.Assignation && window.JcampConverter ) {

        	// Namespace NMRHandler
        	window.NMRHandler = factory( window.Graph, window.Assignation, window.JcampConverter );	

        } else {
        	throw "Graph, Attribution or Jcamp is not defined"
        }
    }

}));




/*

			
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
*/

