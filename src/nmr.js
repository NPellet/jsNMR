
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

			if( nmr.graphs.selectedSerie ) {
				integral.setSerie( nmr.graphs.selectedSerie );	
			} else {
				integral.setSerie( nmr.graphs.getSerie( 0 ) );	
			}
		/*	
			var nmrint = makeNMRIntegral( nmr, mode, integral )
				nmrint.setSerie( integral.getSerie() );
		*/	
			integral.integral = integral;
			
			//nmrint.setProp( 'position', integral.getProp( 'position', 0 ), 0 );
			//nmrint.setProp( 'position', integral.getProp( 'position', 1 ), 1 );

			nmr.integrals.push( integral );
			//nmrint.originalShape = integral;
		}

		function integralChanged( nmr, mode, peak ) {

			if( ! peak.integral ) {
				return;
			}
/*
			peak.integral.setPosition();

			if( peak.syncTo ) {
				setSyncPos( nmr, peak, peak.syncTo );
				peak.syncTo.redrawImpl();

				if( peak.syncTo.integral ) {
					peak.syncTo.integral.setPosition();
				}
			}
		

			recalculateIntegrals( nmr, mode );
			*/
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

			nmr.recalculateIntegrals(mode );
		}

		function getOtherMode( nmr, mode ) {
			return mode == 'x' ? 'y' : ( mode == 'y' ? 'x' : ( console.error( "Mode not recognized") ) );
		}


		function makeNMRIntegral( nmr, mode, integral ) {
			// External call
			var shape = nmr.graphs.newShape( { 
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
		
		function removeSerie( nmr, axis, name ) {

			var serie;
			if( ( serie = nmr.graphs[ axis ].getSerie( name ) ) ) {
				serie.kill();
			}

			nmr.graphs.redraw();
			nmr.graphs.drawSeries();

		}

			
		function doNMR( nmr ) { 
	
			nmr.options.dom.append('<div />');
			nmr.makeGraphs1D();
		
		}
	

		var NMR = function( options ) {

			this.options = $.extend( true, {}, defaults, options );
			this.series = [];

			this.minimapClip;
			// 1D
			
			this.integrals = [];

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
					this.legend = this.graphs.makeLegend( { frame: true, frameWidth: 2, frameColor: 'grey', movable: true, backgroundColor: 'white' } );
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

		NMR.prototype.recalculateIntegrals = function( mode, noLoop ) {

			var sumMax = 0;
			var l = nmr.integrals.length;
			var nmr = this;

			if( l == 1 ) {
				nmr.ratio = 150 / integrals[ 0 ].sum;
				nmr.ratioSum = integrals[ 0 ].sum;
			}

			for( var i = 0; i < l ; i ++ ) {

				nmr.integrals[ i ].ratio = nmr.ratio;

				var text = Math.round( nmr.integrals[ i ].sum / nmr.ratioSum * 100 ) / 100;
				if( ! isNaN( text ) ) {
					nmr.integrals[ i ].setLabelText( text );
				}

				//nmr.integrals[ mode ][ i ].setLabelPosition( {0 );
				nmr.integrals[ i ].updateLabels();
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
			this.graphs.resize( w, h );
			this.graphs.drawSeries();
		}

		NMR.prototype.removeSerieX = function( name ) {
			removeSerie( this, 'x', name );
		}

		NMR.prototype.setSerieX = function( name, data, options ) {

			if( this.graphs.getSerie( name ) ) {

				this.graphs.getSerie( name ).kill();
				this.graphs.removeShapes();
				this.integralBasis = false;

			}

			var serie_x = this.graphs.newSerie( name, $.extend( { useSlots: true }, options ) )
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

			this.graphs.autoscaleAxes();
			this.graphs.draw();
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

			this.graphs = new Graph( this.getDom().children().get(0), {

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
						type: 'nmrintegral',
						strokeColor: '#AF002A', 
						fillColor: "transparent",
						strokeWidth: 2,

						locked: false,
						movable: true,
						resizable: true,
						selectable: true,
						selectOnMouseDown: true,
						handles: true,
						labelEditable: true,

						horizontal: true, 
						forcedCoords: { y: function( shape ) { return ( 20 + shape.serie.getIndex() * 5 ) + "px"; } },
						bindable: true,
						axis: 'x',

						labels: [ { text: "Something", color: 'red' } ] ,



						attributes: { 'data-bindable': function() { return 1; } },

						onCreatedShape: function( shape ) {
							//console.log( self.graphs[ 'x' ].getSerie( 0 ) );
							shape.setSerie( self.graphs.getSerie( 0 ) );
							integralCreated( self, 'x', shape );
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


			this.graphs.setHeight(300);
	

			this.graphs.on("shapeChanged", function( shape ) {

				

				if( shape.getType() == "nmrintegral" ) {

					self.recalculateIntegrals( );

				}



				
			});

			this.graphs.on("shapeLabelChanged", function( shape ) {

				if( shape.getType() == "nmrintegral" ) {

					var fl = parseFloat( shape.getLabelText( 0 ) );
					self.ratioSum = shape.sum / fl;
					self.recalculateIntegrals( );
				}
			} );

/*
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

*/
		
			/********************************************/
			/** DRAW ALL ********************************/
			/********************************************/


			this.graphs.redraw( );	
			this.graphs.drawSeries();	

		}

		return NMR;

	}; // End Factory



    if( typeof define === "function" && define.amd ) {
        

        define( [ 'jsgraph', './shape.1dnmr', './assignment', 'jcampconverter', './sd' ], function( Graph, Shape1DNMR, Assignment, JcampConverter, SD ) {
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

