define( [ 'jquery', 'jsgraph', './shape.1dnmr', './assignment', 'jcampconverter' ], function( $, Graph, Shape1DNMR, Assignment, JcampConverter ) {

	// Root here
	var defaults = {

		mode: '1d',
		molecule: false,
		urls: {

		}
	};

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

/*
	function getOtherMode( nmr, mode ) {
		return mode == 'x' ? 'y' : ( mode == 'y' ? 'x' : ( console.error( "Mode not recognized") ) );
	}
*/

	function makeNMRIntegral( nmr, mode, integral ) {
		// External call
		var shape = nmr.graphs.newShape( { 
				type: 'nmrintegral', 
				fillColor: 'transparent', 
				strokeColor: '#AF002A', 
				strokeWidth: '2px',
				selectOnClick: true,
				handles: true,
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
		if( ( serie = nmr.graphs.getSerie( name ) ) ) {
			serie.kill();
		}

		nmr.graphs.redraw();
		nmr.graphs.drawSeries();
	}

		
	Graph.registerConstructor("graph.shape.1dnmr", Shape1DNMR);

	function NMR( options ) {

		var nmr = this;

		this.options = $.extend( true, {}, defaults, options );
		this.series = [];


		// 1D
		
/*
		if( this.isSymmetric() ) {
			this.nmrSignal1dOptions.y = $.extend(true, {}, this.nmrSignal1dOptions.x );
			this.nmrSignal1dOptions.y.shapeOptions.axis = 'y';
		}

		this.nmrSignal1dOptions.x = $.extend( true, {}, this.nmrSignal1dOptions.x, {} );
		this.nmrSignal1dOptions.y = $.extend( true, {}, this.nmrSignal1dOptions.x, {} );

		*/
		this.graphs;
		this.integrals = [];


		nmr.options.dom.append('<div />');
		nmr.makeGraph();

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
	};


	var loadDefaults = {
		urls: {}
	};

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
	};

	NMR.prototype.integralCreated = function( integral ) {

		//shape.setSerie( self.graphs.getSerie( 0 ) );

		if( this.graphs.selectedSerie ) {
			integral.setSerie( this.graphs.selectedSerie );	
		} else {
			integral.setSerie( this.graphs.getSerie( 0 ) );	
		}
	
		this.integrals.push( integral );
		//integrals.push( integral );
		//nmrint.originalShape = integral;
	}

	NMR.prototype.integralChanged = function( integral ) {
		this.recalculateIntegrals( );
	}

	NMR.prototype.integralRemoved = function( integral ) {

		nmr.integrals.splice( nmr.integrals.indexOf( i ), 1 );
		nmr.recalculateIntegrals( );
	}


	NMR.prototype.recalculateIntegrals = function( ) {

		var nmr = this,
			numberOfIntegrals = nmr.integrals.length;

		if( numberOfIntegrals == 1 ) {
			nmr.ratio = 150 / nmr.integrals[ 0 ].sum;
			nmr.ratioSum = nmr.integrals[ 0 ].sum;
		}
		
		for( var i = 0; i < numberOfIntegrals ; i ++ ) {

			nmr.integrals[ i ].ratio = nmr.ratio;

			var text = Math.round( nmr.integrals[ i ].sum / nmr.ratioSum * 100 ) / 100;
			if( ! isNaN( text ) ) {
				nmr.integrals[ i ].setLabelText( text );
			}

			//nmr.integrals[ mode ][ i ].setLabelPosition( {0 );
			nmr.integrals[ i ].updateLabels();
		}
	}

	NMR.prototype.integralValueChanged = function( integral ) {

		var fl = parseFloat( integral.getLabelText( 0 ) );
		ratioSum = integral.sum / fl;
		this.recalculateIntegrals( );
	}


	NMR.prototype.isSymmetric = function() {
		return this.options.symmetric || false;
	};

	NMR.prototype.getMode = function() {
		return this.options.mode;
	};

	NMR.prototype.getDom = function() {
		return this.options.dom;
	};

	NMR.prototype.getGraph2D = function() {
		return this.graphs['_2d'];
	};

	NMR.prototype.getGraphX = function() {
		return this.graphs['x'];
	};

	NMR.prototype.getGraphY = function() {
		return this.graphs['y'];
	};

	NMR.prototype.resize1DTo = function( w, h ) {
		this.graphs.resize( w, h );
		this.graphs.drawSeries();
	};

	NMR.prototype.removeSerieX = function( name ) {
		removeSerie( this, 'x', name );
	};

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
	};


	NMR.prototype.loaded = function( series, options, name ) {
		
		switch( this.getMode() ) {

			case '1d':

				this.setSerieX( name, series.x.spectra[ 0 ].data[ 0 ], { label: "SomeLabel" } );


			break;
			
		}
		
	};


	NMR.prototype.makeGraph = function() {

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
						self.integralCreated( shape );
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

				self.integralChanged( shape );
			}
		});

		this.graphs.on("shapeLabelChanged", function( shape ) {


			if( shape.getType() == "nmrintegral" ) {

				self.integralValueChanged( shape );
			}
		} );

		this.graphs.draw( );	
		
	};

	return NMR;
	

});
