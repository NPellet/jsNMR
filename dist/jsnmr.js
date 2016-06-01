/*!
 * jsNMR JavaScript Graphing Library v0.0.3
 * http://github.com/NPellet/jsNMR
 *
 * Copyright 2014 Norman Pellet and other authors
 * http://github.com/NPellet/jsNMR/authors.txt
 *
 * Released under the MIT license
 *
 * Date: 2016-06-01T12:30Z
 */


define( 'src/shape.1dnmr',[ 'jquery', 'jsgraph' ], function( $, Graph ) {

	"use strict";
	var lineHeight = 5;
	var GraphLine = Graph.getConstructor( 'graph.shape.line' );

	function GraphNmrSignal1D( graph, options ) {

		this.options = options || 2;
		
	}

	$.extend(GraphNmrSignal1D.prototype, GraphLine.prototype, {
		
		createDom: function() {
			

	      this._createHandles( 2, 'rect', {
	        transform: "translate(-3 -3)",
	        width: 6,
	        height: 6,
	        stroke: "black",
	        fill: "white",
	        cursor: 'nwse-resize'
	      } );

			this._dom = document.createElementNS(this.graph.ns, 'line');
			this.maxLines = 64;
			this.nbLines = 0;

			this.maxLines = 0;


			this.lines = new Array(this.maxLines);
			

			/*this._createHandles( this.nbHandles, 'rect', { 
				transform: "translate(-3 -3)", 
				width: 6, 
				height: 6, 
				stroke: "black", 
				fill: "white",
				cursor: 'nwse-resize'
			} );*/


			//I dont know how to remove the previous lines, so, I'll create an array of
			//empty lines that can be filled up by the system.
			for(var i=this.maxLines-1;i>=0;i--){
				this.lines[i] = document.createElementNS( this.graph.ns, 'line');
				this.group.appendChild( this.lines[i]);
				this.lines[i].setAttribute('stroke', 'green');
			}
			
			// calculate a "hard"-threshold as in
			// IEEE Transactions on biomedical engineering, vol. 52, no. 1, january
			// 2005, p. 76-
			// keep the number of standard deviations variable
			//nbStandardDeviations=1;
			var j,mean=0,std=0,max = 0;
			var serie = this.graph.series[0].data[0];
			//console.log(serie.length);
			for(j=0;j<serie.length;j+=2){
				if(Math.abs(serie[ j + 1 ])>max)
					max = Math.abs(serie[ j + 1 ]);
			}
			for(j=0;j<serie.length;j+=2){
				mean+=serie[ j + 1 ]/max;
			}
			for(j=0;j<serie.length;j+=2)
				std+=Math.pow(mean-serie[ j + 1 ]/max,2);
			std=Math.sqrt(max)*Math.sqrt(std*2/serie.length);
			this.noiseLevel = std*3;//3 is the given number of std for nucleus 1H. For 13C it is 1.
			//console.log("noiseLevel "+this.noiseLevel);
			//this.noiseLevel = 4e6;
			
			this._dom.element = this;
		},


		redrawImpl: function() {

			this.setHandles();
			this.redrawLines( lineHeight );
			//this.setBindableToDom( this._dom );
		},


		redrawLines: function( height ) {

			if( this.maxLines == 0 ) {
				return;
			}

			var peaks = this.findxs();
			//this.lines = [];
			for(var i=peaks.length-1;i>=0;i--){
			    //TODO How to know the base of the spectrum?????
			    var baseLine = this._getPosition( { x: 10 } );
				var x1 = this._getPosition( { x: peaks[i][0] } );
				if( this.lines[i] && x1.x && this.currentPos2y && this.currentPos1y && i<this.maxLines ) {
					this.lines[i].setAttribute('stroke', 'green');
					this.lines[i].setAttribute('x1', x1.x );
					this.lines[i].setAttribute('x2', x1.x );
					this.lines[i].setAttribute('y1', x1.y);
					this.lines[i].setAttribute('y2', baseLine.y  );
					this.lines[i].setAttribute('on', true );

				}
			}
			for(var i=peaks.length;i<this.nbLines;i++){

				if( this.lines[i] ) {
				    this.lines[i].setAttribute('y1', parseFloat(this.lines[i].getAttribute('y2')));
				    this.lines[i].setAttribute('x1', -1000000 );
					this.lines[i].setAttribute('x2', -1000000 );
					this.lines[i].setAttribute('on', false );
				}
			}

			this.nbLines = peaks.length;

		},

		highLigthLinesY: function( height ) {
			for(var i=this.lines.length-1;i>=0;i--){
				if(this.lines[i].getAttribute('on')=="true")
					this.lines[i].setAttribute('y1', parseFloat(this.lines[i].getAttribute('y1'))-height);
			}
		},


		findxs: function() {
			var v1 = this.serie.searchClosestValue( this.getFromData( 'pos' ).x ),
				v2 = this.serie.searchClosestValue( this.getFromData( 'pos2' ).x ),
				v3,
				init,
				max,
				x=[],
				y=[];
				
			if(! v1 || ! v2) {
				return false;
			}
		    
			for(var i = v1.dataIndex; i <= v2.dataIndex ; i++) {

				init = i == v1.dataIndex ? v1.xBeforeIndexArr : 0;
				max = i == v2.dataIndex ? v2.xBeforeIndexArr : this.serie.data[i].length;
				k = 0;
				
				for(j = init; j <= max; j+=2) {
					x.push(this.serie.data[ i ][ j + 0 ]);
					y.push(this.serie.data[ i ][ j + 1 ]);
					
				}
			}
			
			
			
			for(var i=y.length-1;i>=0;i--)
  				if(Math.abs(y[i])<this.noiseLevel)
    				y[i]=0;
			
			var dx = x[1]-x[0];
			// fill convolution frecuency axis
			var X = []//x[2:(x.length-2)];
	
			// fill Savitzky-Golay polynomes
			var Y = [];
			var dY = [];
			var ddY = [];
			for (var j = 2; j < x.length -2; j++){
				Y.push((1/35.0)*(-3*y[j-2] + 12*y[j-1] + 17*y[j] + 12*y[j+1] - 3*y[j+2]));
				X.push(x[j]);
				dY.push((1/(12*dx))*(y[j-2] - 8*y[j-1] + 8*y[j+1] - y[j+2]));
				ddY.push((1/(7*Math.abs(dx*2)))*(2*y[j-2] - y[j-1] - 2*y[j] - y[j+1] + 2*y[j+2]));
			}
		
			// pushs max and min points in convolution functions
			var maxY = [];
			var stackInt = [];
			var intervals = [];
			var minddY = [];
			for (var i = 1; i < Y.length -1 ; i++)
			{
				if ((Y[i] > Y[i-1]) && (Y[i] > Y[i+1]))
				{
					maxY.push(X[i]);
				}
				if ((dY[i] < dY[i-1]) && (dY[i] < dY[i+1]))
				{
					stackInt.push(X[i]);
				}
				if ((dY[i] > dY[i-1]) && (dY[i] > dY[i+1]))
				{
					try{
						intervals.push( [X[i] , stackInt.pop()] );
					}
					catch(e){
						console.log("Error I don't know why");
					}
				}
				if ((ddY[i] < ddY[i-1]) && (ddY[i] < ddY[i+1]))
				{
					minddY.push( [X[i], Y[i]] );
				}
			}
		    //console.log(intervals.length);
			// creates a list with (frecuency, linewith, height)
			var signals = new Array();
			for (var j = 0; j < minddY.length; j++)
			{
				var f = minddY[j];
				var frecuency = f[0];
				var possible = new Array();
				for (var k=0;k<intervals.length;k++){
				    var i = intervals[k];
					if (frecuency > i[0] && frecuency < i[1])
						possible.push(i);
				}
				//console.log("possible "+possible.length);
				if (possible.length > 0)
					if (possible.length == 1)
					{
						var inter = possible[0];
						var linewith = inter[1] - inter[0];
						var height = f[1];
						var points = Y;
						//console.log(frecuency);
						points.sort(function(a, b){return a-b});
						if ((linewith > 2*dx) && (height > 0.0001*points[0]))
							signals.push( [frecuency, linewith, height] );
					}
					else
					{
						//TODO: nested peaks
					//	console.log(possible);
					}
			}
			//console.log(signals);
			return signals;
		}
	});

	return GraphNmrSignal1D;
});

define( 'src/assignment',[ 'jquery' ], function( $ ) {

	"use strict";

	var ns = 'http://www.w3.org/2000/svg';

		var Assignment = function( options ) {

		//	domMolecule, domGraphs, domGlobal, moleculeFilter, graphs
			var self = this;

			this.options = options;
			this.bindingPairs = [];

			var binding = false,
			bindingA = false,
			bindingB = false,
			bindingLine,
			highlighted = {},
			targetting,
			stashedLines = [],
			currentLines = [],

			mousedown = function( el, event, element ) {

				checkBindingPairs();

				if( event.shiftKey ) {

					for( var i in options.graphs ) { // We need to lock all graphs to prevent actions on the shapes.
						options.graphs[ i ].lockShapes();	
					}
					
					binding = true;
					self[ element ] = el;

					event.preventDefault();
					event.stopPropagation();
				}

				// Try to be smart and determine where to put the line ?

				var bb = el.getBBox();
				var pos = $( el ).position(),

				x = pos.left + bb.width / 2,
				y = pos.top + bb.height / 2;

				bindingLine.setAttribute('display', 'block');

				bindingLine.setAttribute('x1', x );
				bindingLine.setAttribute('x2', x );

				bindingLine.setAttribute('y1', y );
				bindingLine.setAttribute('y2', y );



				targetting = otherTarget( element ); 
				if( options[ otherTarget( element ) ].targettable ) {

					var targetEls = findTargettableElements( otherTarget( element ) );

					targetEls.each( function( ) {

						if( this.jsGraphIsShape ) {

							this.jsGraphIsShape.highlight( options[ otherTarget( element ) ].targettable, "binding" );

						} else {

							storeAttributes( options[ otherTarget( element ) ].targettable, $( this ) );
							$( this ).attr( options[ otherTarget( element ) ].targettable );

						}
					} );
				}

			},

			otherTarget = function( target ) {

				if( target == "jsGraphShape") {
					return "targetB";
				}

				return "jsGraphShape";
			},

			findTargettableElements = function( target ) {

				return $( options[ target ].dom ).find( options[ target ].bindableFilter );
			},


			mouseup = function( el, event, target ) {

				checkBindingPairs();
				

				if( targetting ) {

					if( options[ targetting ].targettable ) {

						var targetEls = findTargettableElements( targetting );

						targetEls.each( function( ) {

							if( this.jsGraphIsShape ) {

								this.jsGraphIsShape.unHighlight( "binding" );

							} else {

								restoreAttributes( options[ targetting ].targettable, $( this ) );
							}
						} );
					}
				

				}

				targetting = false;
				
				if( binding && ! target ) {
					bindingLine.setAttribute('display', 'none');
					binding = false;
					
					return;
				}

				if( ! binding ) {
					return;
				}

				var domTarget = event.target;
	
				
				bindingLine.setAttribute('display', 'none');

				if( ! $( domTarget ).is( options[ target ].bindableFilter ) && ! $( domTarget ).get( 0 ).classList.contains( options[ target ].bindableFilterClass ) > -1 ) {

					binding = false;

				} else {

					self[ target ] = event.target;


					binding = false;
					bindSave();

		

				}

				
				
				for( var i in options.graphs ) { // We can now unlock everything
					options.graphs[ i ].unlockShapes();	
				}			
			},

			mousemove = function( e ) {

				checkBindingPairs();
				

				if( ! binding ) {
					return;
				}

				bindingLine.setAttribute('x2', e.clientX + window.scrollX );
				bindingLine.setAttribute('y2', e.clientY + window.scrollY );
			},

			highlight = function( element, target ) {
				
				checkBindingPairs();
				
				var elements = [ element ];
				if( options[ target ].highlighted ) {
					elements = getEquivalents( target, element );
					highlightEquivalents( target, elements );
				}
				
				//getEquivalents( target, selector );


				var eqs = [];
				
//				unhighlight( element, target );
				for( var i = 0, l = elements.length; i < l; i ++ ) {
			
					allPairs( highlightPair, elements[ i ], function( pair ) {
						eqs = eqs.concat( $.makeArray( getEquivalents( otherTarget( target ), pair[ otherTarget( target ) ] ) ) );
					} );
				}

				
				eqs = $( eqs );
				
				if( options[ otherTarget( target ) ].highlighted ) {
					highlightEquivalents( otherTarget( target ), eqs );
				}
				
			},

			unhighlight = function( element, target, force ) {

			/*	if( binding && ! force) {
					return;
				}
*/
				checkBindingPairs();
				var elements = getEquivalents( target, element );
				
				var eqs = [];

				for( var i = 0; i < elements.length; i ++ ) {

					allPairs( unhighlightPair, elements[ i ], function( pair ) {
						eqs = eqs.concat( $.makeArray( getEquivalents( otherTarget( target ), pair[ otherTarget( target ) ] ) ) );
					} );
				}


				highlighted.jsGraphShape.map( function( el ) {
					this.jsGraphIsShape.unHighlight( "assignmentHighlighted");
				} );

				restoreAttributes( options.targetB.highlighted, highlighted.targetB );
				
			},

			highlightEquivalents = function( target, elementsToHighlight ) {

				var highlightedAttributes = options[ target ].highlighted;

				if( elementsToHighlight[ 0 ] && elementsToHighlight[ 0 ].jsGraphIsShape ) {

					elementsToHighlight.map( function( el ) {

						this.jsGraphIsShape.highlight( highlightedAttributes, "assignmentHighlighted");
					} );

				} else {

					storeAttributes( highlightedAttributes, elementsToHighlight );
					elementsToHighlight.attr( highlightedAttributes );

				}

				highlighted[ target ] = elementsToHighlight;

			},

			getEquivalents = function( target, element ) {
				var selector = element.getAttribute( options[ target ].attributeEquivalents );
				return $( options[ target ].dom ).find( "[" + options[ target ].attributeEquivalents + "=\"" + selector + "\"]");
			},

			storeAttributes = function( attr, els ) {

				for( var i in attr ) {
					

					for( var j = 0, l = els.length; j < l; j ++ )  {
							
						if( ! $( els[ j ]  ).data( "backup-" + i ) ) {	
							$( els[ j ]  ).data( "backup-" + i, $( els[ j ]  ).attr( i ) );
						}
					}

				}
			},

			restoreAttributes = function( attr, els ) {

				for( var i in attr ) {

					for( var j = 0, l = els.length; j < l; j ++ )  {

						$( els[ j ] ).attr( i, $( els[ j ]  ).data('backup-' + i ) );
					}
				}
			},

			allPairs = function( fct, element, callback ) {

				for( var i = 0, l = self.bindingPairs.length ; i < l ; i ++ ) {

					if( self.bindingPairs[ i ].jsGraphShape == element || self.bindingPairs[ i ].targetB == element ) {

						fct( self.bindingPairs[ i ] );

						if( callback ) {
							callback( self.bindingPairs[ i ] );
						}
					}
				}
			},

			highlightPair = function( pair ) {


				var posA = $( pair.jsGraphShape ).offset();
				var posB = $( pair.targetB ).offset();

				var bbA = $( pair.jsGraphShape )[ 0 ].getBBox();
				var bbB = $( pair.targetB )[ 0 ].getBBox();

				var posMain = options.domGlobal.offset();

				var line;

				if( stashedLines.length > 0 ) {
					line = stashedLines.pop();
					line.setAttribute('display', 'block');
				} else {
					line = document.createElementNS( ns, 'line');	
				}

				
				line.setAttribute('stroke', 'black');
				line.setAttribute('x1', posA.left - posMain.left + bbA.width / 2 );
				line.setAttribute('y1', posA.top - posMain.top + bbA.height / 2  );
				line.setAttribute('x2', posB.left - posMain.left + bbB.width / 2 );
				line.setAttribute('y2', posB.top - posMain.top + bbB.height / 2 );

				pair.line = line;
				currentLines.push( line );

				topSVG.appendChild( line );
			},


			unhighlightPair = function( pair ) {

				pair.line = false;

				currentLines.map( function( line ) {

					line.setAttribute('display', 'none');

				} );

				stashedLines = stashedLines.concat( currentLines );
				currentLines = [];
	
				
			},

			bindSave = function() {

				var pair;
				if( pair = lookForPair( self.jsGraphShape, self.targetB ) ) {
					removePair( pair );
					unhighlightPair( pair );
					return false;
				}

				unhighlight( self.jsGraphShape, "jsGraphShape", true );

				self.bindingPairs.push( { jsGraphShape: self.jsGraphShape, targetB: self.targetB } );

				self.jsGraphShape.jsGraphIsShape.setStrokeDasharray("5,5");
				self.jsGraphShape.jsGraphIsShape.applyStyle();
			
				bindingA = null;
				bindingB = null;

				console.log( self.getAssignment() );


			},

			removePair = function( pair ) {
				self.bindingPairs.splice( self.bindingPairs.indexOf( pair ), 1 );
			},

			lookForPair = function( A, B ) {

				self.bindingPairs.map( function( pair ) {

					if( pair.jsGraphShape == A || pair.targetB == B ) {
						return pair;
					}
				} );

				return false;
			},

			checkBindingPairs = function() {

				for( var i = 0, l = self.bindingPairs.length ; i < l ; i ++ ) {

					if( $( options.jsGraphShape.dom ).get( 0 ).contains( self.bindingPairs[ i ].jsGraphShape ) && $( options.targetB.dom ).get( 0 ).contains( self.bindingPairs[ i ].targetB ) ) {
						continue;
					} else {

						self.bindingPairs[ i ] = false;
					}
				}
			},

			setEvents = function( ) {

				options.jsGraphShape.dom.on('mousedown', options.jsGraphShape.bindableFilter, function( e ) {
					
					mousedown( this, e, "jsGraphShape" );
				});

				options.jsGraphShape.dom.on('mouseover', options.jsGraphShape.bindableFilter, function( e ) {
					
					highlight( this, "jsGraphShape" );
				});

				options.jsGraphShape.dom.on('mouseout', options.jsGraphShape.bindableFilter, function( e ) {
					unhighlight( this, "jsGraphShape" );
				});

				options.targetB.dom.on('mousedown', options.targetB.bindableFilter, function( e ) {
					mousedown( this, e, "targetB" );
				});

				options.targetB.dom.on('mouseover', options.targetB.bindableFilter, function( e ) {
					highlight( this, "targetB" );
				});

				options.targetB.dom.on('mouseout', options.targetB.bindableFilter, function( e ) {
					unhighlight( this, "targetB" );
				});

				options.jsGraphShape.dom.on('mouseup', function( e ) {
					mouseup( this, e, "jsGraphShape" );
				});

				options.targetB.dom.on('mouseup', function( e ) {
					mouseup( this, e, "targetB" );
				});

				options.domGlobal.on('mouseup', function( e ) {
					mouseup( this, e, false );
				})

				options.domGlobal.on('mousemove', function( e ) {
					mousemove( e );
				})
			};


			var topSVG = document.createElementNS( ns, 'svg' );
			topSVG.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
			topSVG.setAttribute('xmlns', ns );
		
			topSVG.setAttribute('style', 'position: absolute');
			topSVG.setAttribute('width', options.domGlobal.width( ) )
			topSVG.setAttribute('height', options.domGlobal.height( ) )
			topSVG.setAttribute('pointer-events', 'none');

			bindingLine = document.createElementNS( ns, 'line');
			bindingLine.setAttribute('stroke', 'black');

			topSVG.appendChild( bindingLine );

			options.domGlobal.prepend( topSVG );
			setEvents( );	
	};

	Assignment.prototype.getAssignment = function() {

		var self = this;

		return this.bindingPairs.map( function( pair ) {

			if( ! pair ) {
				return undefined;
			}

			var attrA = pair.jsGraphShape.getAttribute( self.options.jsGraphShape.attributeEquivalents );
			var attrB = pair.targetB.getAttribute( self.options.targetB.attributeEquivalents );

			return [ attrA, attrB ];
		} );
	}


	Assignment.prototype.findElement = function( target, selector ) {

		return $( this.options[ target ].dom ).find( "[" + this.options[ target ].attributeEquivalents + "=\"" + selector + "\"]");	
	};


	Assignment.prototype.setAssignment = function( pairs ) {

		var self = this;
		self.bindingPairs = [];

		pairs.forEach( function( pair ) {

			self.bindingPairs.push( { jsGraphShape: self.findElement( 'jsGraphShape', pair[ 0 ] ), targetB: self.findElement( 'targetB', pair[ 1 ] ) } );

		} );
	}

	return Assignment;

});

define( 'src/nmr.js',[ 'jsgraph', './shape.1dnmr', './assignment', 'jcampconverter' ], function( Graph, Shape1DNMR, Assignment, JcampConverter ) {

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

	var ratio, ratioSum;

	var integrals = [];

	function recalculateIntegrals( nmr, mode, noLoop ) {

		var sumMax = 0;
		var l = integrals.length;


		if( l == 1 ) {
			ratio = 150 / integrals[ 0 ].sum;
			ratioSum = integrals[ 0 ].sum;
		}

		for( var i = 0; i < l ; i ++ ) {

			integrals[ i ].ratio = ratio;

			var text = Math.round( integrals[ i ].sum / ratioSum * 100 ) / 100;
			if( ! isNaN( text ) ) {
				integrals[ i ].setLabelText( text );
			}

			//nmr.integrals[ mode ][ i ].setLabelPosition( {0 );
			integrals[ i ].updateLabels();
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

		integrals.push( integral );
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

		recalculateIntegrals( nmr, mode );
	}

	function getOtherMode( nmr, mode ) {
		return mode == 'x' ? 'y' : ( mode == 'y' ? 'x' : ( console.error( "Mode not recognized") ) );
	}


	function makeNMRIntegral( nmr, mode, integral ) {
		// External call
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
	
	function removeSerie( nmr, axis, name ) {

		var serie;
		if( ( serie = nmr.graphs[ axis ].getSerie( name ) ) ) {
			serie.kill();
		}

		nmr.graphs[ axis ].redraw();
		nmr.graphs[ axis ].drawSeries();

	}

		
	function doNMR( nmr ) { 
		
		nmr.options.dom.append('<div />');
		nmr.makeGraphs1D();
	
	}


	function NMR( options ) {

		this.options = $.extend( true, {}, defaults, options );
		this.series = [];

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

				recalculateIntegrals( self );

			}



			
		});

		this.graphs.on("shapeLabelChanged", function( shape ) {


			if( shape.getType() == "nmrintegral" ) {

				var fl = parseFloat( shape.getLabelText( 0 ) );
				ratioSum = shape.sum / fl;
				recalculateIntegrals( self );

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

	};

	return NMR;
	

});

