
(function( global, factory ) {

    if ( typeof module === "object" && typeof module.exports === "object" ) {
        module.exports = factory( global );
    } else {
        factory( global );
    }

} ( window, function( window ) {

	var factory = function( Graph, Shape1DNMR, Assignment, JcampConverter ) {

		// Root here
		var defaults = {

			mode: '1d',
			molecule: false,
			urls: {

			}
		}

		function fetchUrls( nmr, urls, options ) {

			var fetching = [];
			for( var i in urls ) {
				fetching.push( $.get( urls[ i ] ).then( function( data ) { return JcampConverter.convert( data, {keepSpectra:true} ) } ) );
			}

			if( ! nmr.divLoading ) {

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
			}

			nmr.loading = nmr.loading || 0
			nmr.loading++;

			$.when.apply( $, fetching ).then( function() {

				var j = 0;
				for( i in urls ) {

					urls[ i ] = arguments[ j ];
					j++;
				}

				nmr.loading--;
				if( nmr.loading == 0 ) {
					nmr.divLoading.remove();
					nmr.divLoading = false;
				}

				nmr.series.push( urls );
				nmr.loaded( urls, options, "a" + Math.random() );
			} );
		}


		function integral_resizemove( nmr, mode, noLoop ) {

			var sumMax = 0;


			for( var i = 0, l = nmr.integrals[ mode ].length; i < l ; i ++ ) {
				nmr.integrals[ mode ][ i ].redraw();
				sumMax = Math.max( sumMax, nmr.integrals[ mode ][ i ].lastSum );
			}


			for( var i = 0, l = nmr.integrals[ mode ].length; i < l ; i ++ ) {


				nmr.integrals[ mode ][ i ].ratio = Math.abs( sumMax == 0 ? 1 : nmr.integrals[ mode ][ i ].lastSum / sumMax );

				if( nmr.integralBasis ) {

					var text = Math.round( nmr.integrals[ mode ][ i ].lastSum / nmr.integralBasis * 100 ) / 100;

					if( isNaN( text ) ) {
						continue;
					}

					nmr.integrals[ mode ][ i ].setLabelText( text );
				} else {

					nmr.integrals[ mode ][ i ].setLabelText( 1 );	
				}
				
				//nmr.integrals[ mode ][ i ].setLabelPosition( {0 );
				nmr.integrals[ mode ][ i ].updateLabels();

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

		var nmr1dshapes = [];

		function integralCreated( nmr, mode, integral ) {

			nmr1dshapes.push( integral );

			if( nmr.graphs[ mode ].selectedSerie ) {
				integral.setSerie( nmr.graphs[ mode ].selectedSerie );	
			} else {
				integral.setSerie( nmr.graphs[ mode ].getSerie( 0 ) );	
			}
			
			var nmrint = makeNMRIntegral( nmr, mode, integral )
				nmrint.setSerie( integral.getSerie() );
			
			integral.integral = nmrint;
			
			nmrint.setProp( 'position', integral.getProp( 'position', 0 ), 0 );
			nmrint.setProp( 'position', integral.getProp( 'position', 1 ), 1 );

			nmr.integrals[ mode ].push( nmrint );
			nmrint.originalShape = integral;
		}

		function integralChanged( nmr, mode, peak ) {

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


		function integralRemoved( nmr, mode, peak ) {

			if( peak.integral) {
				var i = peak.integral;
				peak.integral = false;
				i.originalShape = false;

				if( i._inDom ) {
					i.kill();
				}

				nmr.integrals[ mode ].splice( nmr.integrals[ mode ].indexOf( i ), 1 );

				nmr1dshapes.splice( nmr1dshapes.indexOf( peak ), 1 );//push( integral );

				if( nmr1dshapes.length == 1 ) {

					nmr.integralBasis = nmr.integrals[ mode ][ 0 ].lastSum;
				}
			}

			integral_resizemove( nmr, mode );
		}

		function getOtherMode( nmr, mode ) {
			return mode == 'x' ? 'y' : ( mode == 'y' ? 'x' : ( console.error( "Mode not recognized") ) );
		}


		function makeNMRIntegral( nmr, mode, integral ) {

			var shape = nmr.graphs[ mode ].newShape( { 
					type: 'nmrintegral', 
					fillColor: 'transparent', 
					strokeColor: '#AF002A', 
					strokeWidth: '2px',
					label: {
						position: { },
						text: 1,
						color: 'red',
						anchor: 'middle'
					},

					shapeOptions: {
						locked: true
					}
				 } );
			
			shape.setSerie( nmr.getGraphX().getSerie( 0 ) );
			shape.setLabelText( "NMRVal" );
			shape.draw();
			shape.redraw();

			return shape;
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
					}/*,

					onRemove: function() {
						integralRemoved( nmr, mode, this );
					}*/
				}
			}
		}

		function removeSerie( nmr, axis, name ) {

			var serie;
			if( ( serie = nmr.graphs[ axis ].getSerie( name ) ) ) {
				serie.kill();
			}

			nmr.graphs[ axis ].redraw();
			nmr.graphs[ axis ].drawSeries();

		}

			
		function doNMR( nmr ) { 

			switch( nmr.getMode() ) {

				case '1d':

				//console.time("Making the whole graph");
					nmr.options.dom.append('<div />');
					nmr.makeGraphs1D();
				//	console.timeEnd("Making the whole graph");

				break;

				case '2d':

					nmr.options.dom.append('<div class="nmr-table-wrapper"><div class="nmr-2d-map" style="width: 150px; height: 150px; position: absolute; right: 0; bottom: 0"></div><table cellpadding="0" cellspacing="0" class="nmr-wrapper"><tr><td></td><td class="nmr-1d nmr-1d-x nmr-main" style="width: 500px; height: 150px;"></td></tr><tr class="nmr-main"><td class="nmr-1d nmr-1d-y"style="height: 500px; width: 150px;"></td><td class="nmr-2d" style="height: 500px; width: 500px;"></td></tr></table></div>');
					nmr.makeGraphs2D();
				break;

			}
		}
	

		var NMR = function( options ) {

			this.options = $.extend( true, {}, defaults, options );
			this.series = [];

			this.minimapClip;
			// 1D
		

			Graph.registerConstructor("graph.shape.1dnmr", Shape1DNMR);
			var self = this;
			
/*
			if( this.isSymmetric() ) {
				this.nmrSignal1dOptions.y = $.extend(true, {}, this.nmrSignal1dOptions.x );
				this.nmrSignal1dOptions.y.shapeOptions.axis = 'y';
			}

			this.nmrSignal1dOptions.x = $.extend( true, {}, this.nmrSignal1dOptions.x, {} );
			this.nmrSignal1dOptions.y = $.extend( true, {}, this.nmrSignal1dOptions.x, {} );

			*/
			this.graphs = { x: null };
			this.integrals = { x: [] };

			doNMR( this );


			switch( this.options.mode ) {
				case '2d':
					
				break;

				case '1d':
					this.legend = this.graphs.x.makeLegend( { frame: true, frameWidth: 2, frameColor: 'grey', movable: true, backgroundColor: 'white' } );
					this.legend.setPosition( { x: "300px", y: "40px" }, 'right' );

				break;
			}

			if( this.options.assignment ) {

				this.assignement = new Assignment( $.extend( this.options.assignment, { graphs: this.graphs, domGraphs: this.options.dom } ) );	
				//this.assignement.setAssignment( [ [ "1", "gGQHLIeIUjdA~dPHeT" ] ] );
			}
		}


		var loadDefaults = {
			urls: {}
		}

		NMR.prototype.load = function( load ) {

			var load = $.extend( true, {}, loadDefaults, load );
			var urls = {};
			switch( this.options.mode ) {


				case '1d':
					
					load.urls.oneD = load.url || load.urls.oneD || load.urls.x;
					urls.x = load.urls.oneD;	


				break;
			}


			fetchUrls( this, urls, load );
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

		NMR.prototype.getGraph2D = function() {
			return this.graphs['_2d'];
		}

		NMR.prototype.getGraphX = function() {
			return this.graphs['x'];
		}

		NMR.prototype.getGraphY = function() {
			return this.graphs['y'];
		}

		NMR.prototype.resize1DTo = function( w, h ) {
			this.graphs[ 'x' ].resize( w, h );
			this.graphs[ 'x' ].drawSeries();
		}

		NMR.prototype.removeSerieX = function( name ) {
			removeSerie( this, 'x', name );
		}

		NMR.prototype.setSerieX = function( name, data, options ) {

			if( this.graphs[ 'x' ].getSerie( name ) ) {

				this.graphs[ 'x' ].getSerie( name ).kill();
				this.graphs[ 'x' ].removeShapes();
				this.integralBasis = false;

			}

			var serie_x = this.graphs[ 'x' ].newSerie( name, $.extend( { useSlots: true }, options ) )
				.setLabel( "My serie" )
				.autoAxis()
				.setData( data )
				.XIsMonotoneous();

			if( options.lineColor ) {
				serie_x.setLineColor( options.lineColor );
			}

			if( options.lineWidth ) {
				serie_x.setLineWidth( options.lineWidth );
			}

			if( options.setLineStyle ) {
				serie_x.setLineStyle( options.lineStyle );
			}

			//serie_x.degrade( 1 ).kill()

			serie_x.XIsMonotoneous();
			serie_x.getXAxis().setAxisDataSpacingMax(0);
			serie_x.getXAxis().setAxisDataSpacingMin(0);

			serie_x.getYAxis().setDisplay( false ).primaryGridOff( false ).secondaryGridOff( false );
			serie_x.getXAxis().flip(true).setLabel('ppm').primaryGridOff( false ).secondaryGridOff( false ).setTickPosition( 'outside' )

			this.graphs.x.autoscaleAxes();
			this.graphs.x.draw();
		}


		NMR.prototype.loaded = function( series, options, name ) {


			switch( this.getMode() ) {

				case '1d':

					this.setSerieX( name, series.x.spectra[ 0 ].data[ 0 ], { label: "SomeLabel" } );


				break;


			}


		}

	
		NMR.prototype.makeGraphs1D = function() {

			var self = this;

			this.graphs['x'] = new Graph( this.getDom().children().get(0), {

				close: { left: false, top: false, right: false },
				paddingBottom: 0,
				paddingTop: 0,
				paddingLeft: 0,
				paddingRight: 0,

				plugins: {
					'zoom': { 
						zoomMode: 'x'

					},

					'shape': { 
						type: '1dnmr',
						strokeColor: '#AF002A', 
						strokeWidth: 2,

						locked: false,
						movable: true,
						resizable: true,
						selectable: true,
						selectOnMouseDown: true,
						handles: true,

						horizontal: true, 
						forcedCoords: { y: function( shape ) { return ( 20 + shape.serie.getIndex() * 5 ) + "px"; } },
						bindable: true,
						axis: 'x',

						attributes: { 'data-bindable': function() { return 1; } },

						onNewShape: function( shape ) {
							
							shape.setSerie( self.graphs[ 'x' ].getSerie( 0 ) );
							//shape.setAttributes( { 'data-assignation': Math.random() } );
						},

						highlightOnMouseOver: true
					},
				},


				dblclick: {
					type: 'plugin',
					plugin: 'zoom',
					options: {
						mode: 'total'
					}
				},


				wheel: {
					type: 'plugin',
					plugin: 'zoom',
					options: {
						direction: 'y',
						baseline: 0
					}
				},


				pluginAction: {
					'zoom': { shift: false, ctrl: false },
					'shape': { shift: true, ctrl: false }
				},

				onBeforeNewShape: function() {

					if( ! this.selectedSerie && this.series.length > 1 ) {
						return false;
					}
				}

			} );


			this.graphs[ 'x' ].setHeight(300);
	

			this.graphs[ 'x' ].on("shapeChanged", function( shape ) {

				
				if( shape.getType() == "1dnmr" ) {

					shape.integral.setPosition( shape.getPosition( 0 ), 0 );
					shape.integral.setPosition( shape.getPosition( 1 ), 1 );

					if( ! self.integralBasis || nmr1dshapes.length == 1 ) {

						self.integralBasis = shape.integral.lastSum;
					}

				} else if( shape.getType() == "nmrintegral" ) {

					if( self.integralBasis ) {

						var fl = parseFloat( shape.data.label[ 0 ].text );

						if( fl != 0 ) {
							self.integralBasis = shape.lastSum / fl;
						}
					}					
				}

				integral_resizemove( self, 'x' );
			});



			this.graphs[ 'x' ].on("shapeRemoved", function( shape ) {

				if( shape.integral ) {
					integralRemoved( self, 'x', shape );
				} else if( shape.originalShape ) {
					shape.originalShape.kill();
				}
			});



			this.graphs[ 'x' ].on("shapeNew", function( shape ) {

				if( shape.getType() == "1dnmr" ) {
					integralCreated( self, 'x', shape );

					shape.setHighlightAttributes( { 'stroke-width': 5 } );
					shape.addClass("bindable");
				}
			});


		
			/********************************************/
			/** DRAW ALL ********************************/
			/********************************************/


			this.graphs[ 'x' ].redraw( );	
			this.graphs[ 'x' ].drawSeries();	

		}

		return NMR;

	}; // End Factory



    if( typeof define === "function" && define.amd ) {
        

        define( [ 'graph', 'shape1DNMR', 'assignment', 'jcampconverter', 'sd' ], function( Graph, Shape1DNMR, Assignment, JcampConverter, SD ) {
            return factory( Graph, Shape1DNMR, Assignment, JcampConverter );

        });

    } else if( window ) {
        
        if( window.Graph && window.Assignment && window.JcampConverter ) {

        	// Namespace NMRHandler
        	window.NMRHandler = factory( window.Graph, window.Shape1DNMR, window.Assignment, window.JcampConverter );	

        } else {
        	throw "Graph, Assignment or Jcamp is not defined"
        }
    }

}));

