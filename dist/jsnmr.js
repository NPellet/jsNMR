/*!
 * jsNMR JavaScript Graphing Library v1.1.1
 * http://github.com/NPellet/jsNMR
 *
 * Copyright 2014 Norman Pellet and other authors
 * http://github.com/NPellet/jsNMR/authors.txt
 *
 * Released under the MIT license
 *
 * Date: 2016-06-01T11:42Z
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


/*!
 * jsGraphs JavaScript Graphing Library v1.1.1
 * http://github.com/NPellet/jsGraphs
 *
 * Copyright 2014 Norman Pellet
 * Released under the MIT license
 *
 * Date: 2016-06-01T11:42Z
 */

(function( global, factory ) {

	if ( typeof module === "object" && typeof module.exports === "object" ) {
		
		module.exports = factory( global );
			
	} else {

		factory( global );

	}

// Pass this if window is not defined yet
}( ( typeof window !== "undefined" ? window : this ), function( window ) {

	"use strict";

	var ns = 'http://www.w3.org/2000/svg';

		var Constructor = function( options ) {

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

	Constructor.prototype.getAssignment = function() {

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


	Constructor.prototype.findElement = function( target, selector ) {

		return $( this.options[ target ].dom ).find( "[" + this.options[ target ].attributeEquivalents + "=\"" + selector + "\"]");	
	};


	Constructor.prototype.setAssignment = function( pairs ) {

		var self = this;
		self.bindingPairs = [];

		pairs.forEach( function( pair ) {

			self.bindingPairs.push( { jsGraphShape: self.findElement( 'jsGraphShape', pair[ 0 ] ), targetB: self.findElement( 'targetB', pair[ 1 ] ) } );

		} );
	}


	var Assignment = function( $ ) {
		return Constructor;
	};

	if( typeof define === "function" && define.amd ) {
		define( 'src/assignment',[ 'jquery' ], function( $ ) {
			return Assignment( $ );
		});
	} else if( window ) {

		if( ! window.jQuery ) {
			throw "jQuery has not been loaded. Abort assignment initialization."
			return;
		}

		window.Assignment = Assignment( window.jQuery );
	}
}));

var SD={
	  /**
	  * @function create(spectra)
	  * This function define a spectraData from the x and y vectors. If the spectraData is null it will return a new instance of
	  * SpectraData
	  * @param	spectra:+Object
	  * @returns	+SD
	  */
	 create: function(spectra){
		 return new ESD(spectra);
	 }
};

var HeteroNuclearPeakOptimizer={
	toleranceX : 0.025,
	toleranceY : 0.5,
	clean: function(peaks, threshold){
		var max = Number.NEGATIVE_INFINITY;
		var i,peak;
		//double min = Double.MAX_VALUE;
		for(i=peaks.length-1;i>=0;i--){
			if(Math.abs(peaks[i].z)>max)
				max=Math.abs(peaks[i].z);
		}
		max*=threshold;
		for(i=peaks.length-1;i>=0;i--){
			if(Math.abs(peaks[i].z)<max)
				peaks.splice(i,1);
		}
		return peaks;
	}
}

var HomoNuclearPeakOptimizer={
	diagonalError:0.05,
	tolerance:0.05,
	DEBUG:false,
	
	enhanceSymmetry: function(signals){
		
		var properties = this.initializeProperties(signals);
		var output = signals;

		if(this.DEBUG)
			console.log("Before optimization size: "+output.size());
		
		//First step of the optimization: Symmetry validation
		var i,hits,index;
		var signal;
		for(i=output.length-1;i>=0;i--){
			signal = output[i];
			if(signal.peaks.length>1)
				properties[i][1]++;
			if(properties[i][0]==1){
				index = this.exist(output, properties, signal,-1,true);
				if(index>=0){
					properties[i][1]+=2;
					properties[index][1]+=2;
				}
			}
		}
		//Second step of the optimization: Diagonal image existence
		for(i=output.length-1;i>=0;i--){
			signal = output[i];
			if(properties[i][0]==0){
				hits = this.checkCrossPeaks(output, properties, signal, true);
				properties[i][1]+=hits;
				//checkCrossPeaks(output, properties, signal, false);
			}
		}
		
		//Now, each peak have a score between 0 and 4, we can complete the patterns which
		//contains peaks with high scores, and finally, we can remove peaks with scores 0 and 1
		var count = 0;
		for(i=output.length-1;i>=0;i--){
			if(properties[i][0]!=0&&properties[i][1]>2){
				count++;
				count+=this.completeMissingIfNeeded(output,properties,output[i],properties[i]);
			}
			if(properties[i][1]>=2&&properties[i][0]==0)
				count++;
		}
		
		if(this.DEBUG)
			console.log("After optimization size: "+count);
		var  toReturn = new Array(count);
		count--;
		for(i=output.length-1;i>=0;i--){
			if(properties[i][0]!=0&&properties[i][1]>2
					||properties[i][0]==0&&properties[i][1]>1){
				toReturn[count--]=output[i];
			}
			else{
				console.log("Removed "+i+" "+output[i].peaks.length);
			}
			//if(properties.get(i)[1]>=2)
			//	toReturn[count--]=output.get(i);
		}
		return toReturn;
	},
	
	completeMissingIfNeeded: function(output, properties, thisSignal, thisProp) {
		//Check for symmetry
		var index = this.exist(output, properties, thisSignal,-thisProp[0],true);
		var addedPeaks=0;
		if(index<0){//If this signal have no a symmetry image, we have to include it
			var newSignal = {nucleusX:thisSignal.nucleusX,nucleusY:thisSignal.nucleusY};
			newSignal.resolutionX=thisSignal.resolutionX;
			newSignal.resolutionY=thisSignal.resolutionY;
			newSignal.shiftX=thisSignal.shiftY;
			newSignal.shiftY=thisSignal.shiftX;
			newSignal.peaks = [{x:thisSignal.shiftY,y:thisSignal.shiftX,z:1}];
			output.push(newSignal);
			var tmpProp = [-thisProp[0],thisProp[1]];
			properties.push(tmpProp);
			addedPeaks++;
		}
		//Check for diagonal peaks
		var j=0;
		var diagX=false, diagY=false;
		var signal;
		for(j=output.length-1;j>=0;j--){
			signal = output[j];
			if(properties[j][0]==0){
				if(Math.abs(signal.shiftX-thisSignal.shiftX)<this.diagonalError)
					diagX=true;
				if(Math.abs(signal.shiftY-thisSignal.shiftY)<this.diagonalError)
					diagY=true;
			}
		}
		if(diagX==false){
			var newSignal = {nucleusX:thisSignal.nucleusX,nucleusY:thisSignal.nucleusY};
			newSignal.resolutionX=thisSignal.resolutionX;
			newSignal.resolutionY=thisSignal.resolutionY;
			newSignal.shiftX=thisSignal.shiftX;
			newSignal.shiftY=thisSignal.shiftX;
			newSignal.peaks = [{x:thisSignal.shiftX,y:thisSignal.shiftX,z:1}];
			output.push(newSignal);
			var tmpProp = [0,thisProp[1]];
			properties.push(tmpProp);
			addedPeaks++;
		}
		if(diagY==false){
			var newSignal = {nucleusX:thisSignal.nucleusX,nucleusY:thisSignal.nucleusY};
			newSignal.resolutionX=thisSignal.resolutionX;
			newSignal.resolutionY=thisSignal.resolutionY;
			newSignal.shiftX=thisSignal.shiftY;
			newSignal.shiftY=thisSignal.shiftY;
			newSignal.peaks = [{x:thisSignal.shiftY,y:thisSignal.shiftY,z:1}];
			output.push(newSignal);
			var tmpProp = [0,thisProp[1]];
			properties.push(tmpProp);
			addedPeaks++;
		}
		return addedPeaks;
		
	},
	
	//Check for any diagonal peak that match this cross peak
	checkCrossPeaks: function(output, properties, signal, updateProperties) {
		var hits = 0, i=0, shift=signal.shiftX*4;
		var crossPeaksX = [],crossPeaksY = [];
		var cross,i;
		for(i=output.length-1;i>=0;i--){
			cross = output[i];
			if(properties[i][0]!=0){
				if(Math.abs(cross.shiftX-signal.shiftX)<this.diagonalError){
					hits++;
					if(updateProperties)
						properties[i][1]++;
					crossPeaksX.push(i);
					shift+=cross.shiftX;
				}
				else{
					if(Math.abs(cross.shiftY-signal.shiftY)<this.diagonalError){
						hits++;
						if(updateProperties)
							properties[i][1]++;
						crossPeaksY.push(i);
						shift+=cross.shiftY;
					}
				}
			}
		}
		//Update found crossPeaks and diagonal peak
		shift/=(crossPeaksX.length+crossPeaksY.length+4);
		if(crossPeaksX.length>0){
			for(var i=crossPeaksX.length-1;i>=0;i--){
				output[crossPeaksX[i]].shiftX=shift;
			}
		}
		if(crossPeaksY.length>0){
			for(var i=crossPeaksY.length-1;i>=0;i--){
				output[crossPeaksY[i]].shiftY=shift;
			}
		}
		signal.shiftX=shift;
		signal.shiftY=shift;
		return hits;
	},

	exist: function(output, properties, signal, type, symmetricSearch) {
		for(var i=output.length-1;i>=0;i--){
			if(properties[i][0]==type){
				if(this.distanceTo(signal, output[i], symmetricSearch)<this.tolerance){
					if(!symmetricSearch){
						var shiftX=(output[i].shiftX+signal.shiftX)/2.0;
						var shiftY=(output[i].shiftY+signal.shiftY)/2.0;
						output[i].shiftX=shiftX;
						output[i].shiftY=shiftY;
						signal.shiftX=shiftX;
						signal.shiftY=shiftY;
					}
					else{
						var shiftX=signal.shiftX;
						var shiftY=output[i].shiftX;
						output[i].shiftY=shiftX;
						signal.shiftY=shiftY;
					}
					return i;
				}
			}
		}
		return -1;
	},
	/**
	 * We try to determine the position of each signal within the spectrum matrix.
	 * Peaks could be of 3 types: upper diagonal, diagonal or under diagonal 1,0,-1
	 * respectively.
	 * @param Signals
	 * @return A matrix containing the properties of each signal
	 */
	initializeProperties: function(signals){
		var signalsProperties = new Array(signals.length);
		for(var i=signals.length-1;i>=0;i--){
			signalsProperties[i]=[0,0];
			//We check if it is a diagonal peak
			if(Math.abs(signals[i].shiftX-signals[i].shiftY)<=this.diagonalError){
				signalsProperties[i][1]=1;
				//We adjust the x and y value to be symmetric.
				//In general chemical shift in the direct dimension is better than in the other one,
				//so, we believe more to the shiftX than to the shiftY.
				var shift = (signals[i].shiftX*2+signals[i].shiftY)/3.0;
				signals[i].shiftX=shift;
				signals[i].shiftY=shift;
			}
			else{
				if(signals[i].shiftX-signals[i].shiftY>0)
					signalsProperties[i][0]=1;
				else
					signalsProperties[i][0]=-1;
			}
		}
		return signalsProperties;
	},
	
	/**
	 * This function calculates the distance between 2 nmr signals . If toImage is true, 
	 * it will interchange x by y in the distance calculation for the second signal.
	 */
	distanceTo: function(a, b, toImage){
		if(!toImage){
			return Math.sqrt(Math.pow(a.shiftX-b.shiftX, 2)
					+Math.pow(a.shiftY-b.shiftY, 2));
		}
		else{
			return Math.sqrt(Math.pow(a.shiftX-b.shiftY, 2)
					+Math.pow(a.shiftY-b.shiftX, 2));
		}
	}
};

var SimpleClustering={

	/*This function returns the cluster list given a connectivity matrix.
	*To improve the performance, the connectivity(square and symmetric) matrix 
	*is given as a single vector containing  the upper diagonal of the matrix
	*Note: This algorithm is O(n*n) complexity. I wonder if there is something better. 
	*acastillo
	*/
	fullClusterGenerator:function(conn){
		var nRows = Math.sqrt(conn.length*2+0.25)-0.5;
		//console.log("nRows: "+nRows+" - "+conn.length);
		var clusterList = [];
		var available = new Array(nRows);
		var remaining = nRows;
		var cluster = [];
		//Mark all the elements as available
		for(var i=nRows-1;i>=0;i--){
			available[i]=1;
		}
		var nextAv=-1,i;
		var toInclude = [];
		while(remaining>0){
			if(toInclude.length==0){
				//If there is no more elements to include, start a new cluster
				cluster = new Array(nRows);
				for(i=nRows-1;i>=0;i--)
					cluster[i]=0;
				clusterList.push(cluster);
		    	for(nextAv = nRows-1;available[nextAv]==0;nextAv--){};
		    }
		    else{
		    	nextAv=toInclude.splice(0,1);
		    }
		    //console.log("row: "+nextAv);
		    cluster[nextAv]=1;
		    available[nextAv]=0;
		    remaining--;
		    //Copy the next available row
		    var row = new Array(nRows);
			for(i=nRows-1;i>=0;i--){
				var c=Math.max(nextAv,i);
				var r=Math.min(nextAv,i);
				//The element in the conn matrix
				//console.log("index: "+r*(2*nRows-r-1)/2+c)
				row[i]=conn[r*(2*nRows-r-1)/2+c];
				//console.log("col: "+i+":"+row[i]);
				//There is new elements to include in this row?
				//Then, include it to the current cluster
				if(row[i]==1&&available[i]==1&&cluster[i]==0){
					toInclude.push(i);
					cluster[i]=1;
				}
			}
		}
		return clusterList;
	}
}

var MathUtils={
	/**
	 * Returns the minimum and maximum values of the given vector
	 * @param data
	 * @return double array containing [min,max]
	 */
	getMinMax: function( data) {
		var result = [Number.POSITIVE_INFINITY,Number.NEGATIVE_INFINITY];

		for (var i = data.length-1; i >=0 ; i--) {
			if (data[i] < result[0])
				result[0] = data[i];
			if (data[i] > result[1])
				result[1] = data[i];
		}
		return result;
	}
};

var FFTUtils = {

/**
	 * Calculates the inverse of a 2D Fourier transform
	 * 
	 * @param ft
	 * @param ftRows
	 * @param ftCols
	 * @return
	 */
	ifft2DArray: function(ft, ftRows, ftCols) {
		var tempTransform = new Array(ftRows * ftCols);
		var nRows = ftRows / 2;
		var nCols = (ftCols - 1) * 2;
		// reverse transform columns
		FFT.init(nRows);
		var tmpCols = {re:new Array(nRows),im:new Array(nRows)};
		for (var iCol = 0; iCol < ftCols; iCol++) {
			for (var iRow = nRows-1; iRow >=0; iRow--) {
				tmpCols.re[iRow] = ft[(iRow * 2) * ftCols + iCol];
				tmpCols.im[iRow] = ft[(iRow * 2 + 1) * ftCols + iCol];
			}
			//Unnormalized inverse transform
			FFT.bt(tmpCols.re, tmpCols.im);
			for (var iRow = nRows-1; iRow >=0; iRow--) {
				tempTransform[(iRow * 2) * ftCols + iCol] = tmpCols.re[iRow];
				tempTransform[(iRow * 2 + 1) * ftCols + iCol] = tmpCols.im[iRow];
			}
		}

		// reverse row transform
		var finalTransform = new Array(nRows * nCols);
		FFT.init(nCols);
		var tmpRows = {re:new Array(nCols),im:new Array(nCols)};
		var scale = nCols * nRows;
		for (var iRow = 0; iRow < ftRows; iRow += 2) {
			tmpRows.re[0] = tempTransform[iRow * ftCols];
			tmpRows.im[0] = tempTransform[(iRow + 1) * ftCols];
			for (var iCol = 1; iCol < ftCols; iCol++) {
				tmpRows.re[iCol] = tempTransform[iRow * ftCols + iCol];
				tmpRows.im[iCol] = tempTransform[(iRow + 1) * ftCols + iCol];
				tmpRows.re[nCols - iCol] = tempTransform[iRow * ftCols + iCol];
				tmpRows.im[nCols - iCol] = -tempTransform[(iRow + 1) * ftCols + iCol];
			}
			//Unnormalized inverse transform
			FFT.bt(tmpRows.re, tmpRows.im);
			
			var indexB = (iRow / 2) * nCols;
			for (var iCol = nCols-1; iCol >=0; iCol--) {
				finalTransform[indexB + iCol] = tmpRows.re[iCol]/ scale;
			}
		}
		return finalTransform;
	},
    /**
	 * Calculates the fourier transform of a matrix of size (nRows,nCols) It is
	 * assumed that both nRows and nCols are a power of two
	 * 
	 * On exit the matrix has dimensions (nRows * 2, nCols / 2 + 1) where the
	 * even rows contain the real part and the odd rows the imaginary part of the
	 * transform
	 * @param data
	 * @param nRows
	 * @param nCols
	 * @return
	 */
    fft2DArray:function(data, nRows, nCols){
    	var ftCols = (nCols / 2 + 1);
		var ftRows = nRows * 2;
		var tempTransform = new Array(ftRows * ftCols);
		FFT.init(nCols);
		// transform rows
		var tmpRows = {re:new Array(nCols),im:new Array(nCols)};
		var row1 = {re:new Array(nCols),im:new Array(nCols)}
		var row2 = {re:new Array(nCols),im:new Array(nCols)}
		var index,iRow0, iRow1, iRow2, iRow3;
		for (var iRow = 0; iRow < nRows / 2; iRow++) {
		    index = (iRow * 2) * nCols;
			tmpRows.re = data.slice(index, index+nCols);
			
			index = (iRow * 2 + 1) * nCols;
			tmpRows.im = data.slice(index,index+nCols);
			
			FFT.fft1d(tmpRows.re, tmpRows.im);
			
			/*if(iRow==0){
				console.log(tmpRows.re);
				console.log(tmpRows.im);
			}*/
			this.reconstructTwoRealFFT(tmpRows, row1, row2);
			//Now lets put back the result into the output array
			iRow0=(iRow * 4) * ftCols;
			iRow1=(iRow * 4+1) * ftCols;
			iRow2=(iRow * 4+2) * ftCols;
			iRow3=(iRow * 4+3) * ftCols;
			for(var k=ftCols-1;k>=0;k--){
				tempTransform[iRow0+k]=row1.re[k];
				tempTransform[iRow1+k]=row1.im[k];
				tempTransform[iRow2+k]=row2.re[k];
				tempTransform[iRow3+k]=row2.im[k];
			}
		}
		
		//console.log(tempTransform);
		row1 = null;
		row2 = null;
		// transform columns
		var finalTransform = new Array(ftRows * ftCols);
		FFT.init(nRows);
		var tmpCols = {re:new Array(nRows),im:new Array(nRows)};
		for (var iCol = ftCols-1; iCol >= 0; iCol--) {
			for (var iRow = nRows-1; iRow >=0; iRow--) {
				tmpCols.re[iRow] = tempTransform[(iRow * 2) * ftCols + iCol];
				tmpCols.im[iRow] = tempTransform[(iRow * 2 + 1) * ftCols + iCol];
			}
			FFT.fft1d(tmpCols.re, tmpCols.im);
			for (var iRow = nRows-1; iRow >=0; iRow--) {
				finalTransform[(iRow * 2) * ftCols + iCol] = tmpCols.re[iRow];
				finalTransform[(iRow * 2 + 1) * ftCols + iCol] = tmpCols.im[iRow];
			}
		}
		
		//console.log(finalTransform);
		return finalTransform;
    
    },
     /**
	 * 
	 * @param fourierTransform
	 * @param realTransform1
	 * @param realTransform2
	 * 
	 * Reconstructs the individual Fourier transforms of two simultaneously
	 * transformed series. Based on the Symmetry relationships (the asterisk
	 * denotes the complex conjugate)
	 * 
	 * F_{N-n} = F_n^{*} for a purely real f transformed to F
	 * 
	 * G_{N-n} = G_n^{*} for a purely imaginary g transformed to G
	 * 
	 */
	reconstructTwoRealFFT:function(fourierTransform, realTransform1, realTransform2) {
		var length = fourierTransform.re.length;
		// allocate storage
		/*realTransform1.re = new Array(length);
		realTransform1.im = new Array(length);
		realTransform2.re = new Array(length);
		realTransform2.im = new Array(length);*/

		// the components n=0 are trivial
		realTransform1.re[0] = fourierTransform.re[0];
		realTransform1.im[0] = 0.0;
		realTransform2.re[0] = fourierTransform.im[0];
		realTransform2.im[0] = 0.0;
		var rm, rp, im, ip, j;
		for (var i = length / 2; i >0 ; i--) {
			j = length - i;
			rm = 0.5 * (fourierTransform.re[i] - fourierTransform.re[j]);
			rp = 0.5 * (fourierTransform.re[i] + fourierTransform.re[j]);
			im = 0.5 * (fourierTransform.im[i] - fourierTransform.im[j]);
			ip = 0.5 * (fourierTransform.im[i] + fourierTransform.im[j]);
			realTransform1.re[i] = rp;
			realTransform1.im[i] = im;
			realTransform1.re[j] = rp;
			realTransform1.im[j] = -im;
			realTransform2.re[i] = ip;
			realTransform2.im[i] = -rm;
			realTransform2.re[j] = ip;
			realTransform2.im[j] = rm;
		}
	},
	
	/**
	 * In place version of convolute 2D
	 * 
	 * @param ftSignal
	 * @param ftFilter
	 * @param ftRows
	 * @param ftCols
	 * @return
	 */
	convolute2DI:function(ftSignal, ftFilter, ftRows, ftCols) {
		var re, im;
		for (var iRow = 0; iRow < ftRows / 2; iRow++) {
			for (var iCol = 0; iCol < ftCols; iCol++) {
				// 
				re = ftSignal[(iRow * 2) * ftCols + iCol]
						* ftFilter[(iRow * 2) * ftCols + iCol]
						- ftSignal[(iRow * 2 + 1) * ftCols + iCol]
						* ftFilter[(iRow * 2 + 1) * ftCols + iCol];
				im = ftSignal[(iRow * 2) * ftCols + iCol]
						* ftFilter[(iRow * 2 + 1) * ftCols + iCol]
						+ ftSignal[(iRow * 2 + 1) * ftCols + iCol]
						* ftFilter[(iRow * 2) * ftCols + iCol];
				// 
				ftSignal[(iRow * 2) * ftCols + iCol] = re;
				ftSignal[(iRow * 2 + 1) * ftCols + iCol] = im;
			}
		}
	}	
};

var PeakFinders2D = {
    DEBUG:false,
    smallFilter: [ 
			[ 0, 0, 1, 2, 2, 2, 1, 0, 0 ],
			[ 0, 1, 4, 7, 7, 7, 4, 1, 0 ], 
			[ 1, 4, 5, 3, 0, 3, 5, 4, 1 ],
			[ 2, 7, 3, -12, -23, -12, 3, 7, 2 ],
			[ 2, 7, 0, -23, -40, -23, 0, 7, 2 ],
			[ 2, 7, 3, -12, -23, -12, 3, 7, 2 ],
			[ 1, 4, 5, 3, 0, 3, 5, 4, 1 ], 
			[ 0, 1, 3, 7, 7, 7, 3, 1, 0 ],
			[ 0, 0, 1, 2, 2, 2, 1, 0, 0 ]],

	//How noisy is the spectrum depending on the kind of experiment.
	getLoGnStdDevNMR: function(spectraData) {
		if (spectraData.isHomoNuclear())
			return 1.5
		else
			return 3;
	},
	
	_findPeaks2DLoG: function(spectraData, thresholdFactor){
		if(thresholdFactor==0)
			thresholdFactor=1;
		if(thresholdFactor<0)
			thresholdFactor=-thresholdFactor;
		var nbPoints = spectraData.getNbPoints();
		var nbSubSpectra = spectraData.getNbSubSpectra();
		var data = new Array(nbPoints * nbSubSpectra);
		//var data = new Array(nbPoints * nbSubSpectra/2);
		
		var isHomonuclear = spectraData.isHomoNuclear();
		
		//var sum = new Array(nbPoints);
		
		for (var iSubSpectra = 0; iSubSpectra < nbSubSpectra; iSubSpectra++) {
			var spectrum = spectraData.getSpectraData(iSubSpectra);
			for (var iCol = 0; iCol < nbPoints; iCol++) {
				if(isHomonuclear){
					data[iSubSpectra * nbPoints + iCol] =(spectrum[iCol*2+1]>0?spectrum[iCol*2+1]:0);
				}
				else{
					data[iSubSpectra * nbPoints + iCol] =Math.abs(spectrum[iCol*2+1]);
				}
			}
		}
		
		var nStdDev = this.getLoGnStdDevNMR(spectraData);
		if(isHomonuclear){
			var convolutedSpectrum = this.convoluteWithLoG(data,nbSubSpectra, nbPoints);
			var peaksMC1 = this.findPeaks2DLoG(data, convolutedSpectrum, nbSubSpectra, nbPoints, nStdDev*thresholdFactor);//)1.5);
			var peaksMax1 = this.findPeaks2DMax(data, convolutedSpectrum, nbSubSpectra, nbPoints, (nStdDev+0.5)*thresholdFactor);//2.0);
			for(var i=0;i<peaksMC1.length;i++)
				peaksMax1.push(peaksMC1[i]);
			return HomoNuclearPeakOptimizer.enhanceSymmetry(this.createSignals2D(peaksMax1,spectraData,24));
			
		}
		else{
			var convolutedSpectrum = this.convoluteWithLoG(data, nbSubSpectra, nbPoints);
			var peaksMC1 = this.findPeaks2DLoG(data, convolutedSpectrum, nbSubSpectra, nbPoints, nStdDev*thresholdFactor);
			//Peak2D[] peaksMC1 = PeakFinders2D.findPeaks2DMax(data, nbSubSpectra, nbPoints, (nStdDev+0.5)*thresholdFactor);
			//Remove peaks with less than 3% of the intensity of the highest peak	
			return this.createSignals2D(HeteroNuclearPeakOptimizer.clean(peaksMC1, 0.05), spectraData,24);
		}
		
	},
	/**
	Calculates the 1st derivative of the 2D matrix, using the LoG kernel approximation
	*/
	convoluteWithLoG:function(inputSpectrum, nRows, nCols){
		var ftSpectrum = new Array(nCols * nRows);
		for (var i = nRows * nCols-1; i >=0; i--){
			ftSpectrum[i] = inputSpectrum[i];
		}
		
		ftSpectrum = FFTUtils.fft2DArray(ftSpectrum, nRows, nCols);
		
		var dim = this.smallFilter.length;
		var ftFilterData = new Array(nCols * nRows);
		for(var i=nCols * nRows-1;i>=0;i--){
			ftFilterData[i]=0;
		}
		
		var iRow, iCol;
		var shift = (dim - 1) / 2;
		//console.log(dim);
		for (var ir = 0; ir < dim; ir++) {
			iRow = (ir - shift + nRows) % nRows;
			for (var ic = 0; ic < dim; ic++) {
				iCol = (ic - shift + nCols) % nCols;
				ftFilterData[iRow * nCols + iCol] = this.smallFilter[ir][ic];
			}
		}
		
		ftFilterData = FFTUtils.fft2DArray(ftFilterData, nRows, nCols);

		var ftRows = nRows * 2;
		var ftCols = nCols / 2 + 1;
		FFTUtils.convolute2DI(ftSpectrum, ftFilterData, ftRows, ftCols);
		
		return  FFTUtils.ifft2DArray(ftSpectrum, ftRows, ftCols);	
	},
	/**
		Detects all the 2D-peaks in the given spectrum based on center of mass logic. 
	*/
	findPeaks2DLoG:function(inputSpectrum, convolutedSpectrum, nRows, nCols, nStdDev) {
		var threshold = 0;
		for(var i=nCols*nRows-2;i>=0;i--)
			threshold+=Math.pow(convolutedSpectrum[i]-convolutedSpectrum[i+1],2);
		threshold=-Math.sqrt(threshold);
		threshold*=nStdDev/nRows;
		
		var bitmask = new Array(nCols * nRows); 
		for(var i=nCols * nRows-1;i>=0;i--){
			bitmask[i]=0;
		}
		var nbDetectedPoints = 0;
		var lasti=-1;
		for (var i = convolutedSpectrum.length-1; i >=0 ; i--) {
			if (convolutedSpectrum[i] < threshold) {
				bitmask[i] = 1;
				nbDetectedPoints++;
			}
		}
		var iStart = 0;
		//int ranges = 0;
		var peakList = [];
		
		while (nbDetectedPoints != 0) {
			for (iStart; iStart < bitmask.length && bitmask[iStart]==0; iStart++){};
			//
			if (iStart == bitmask.length)
				break;
			
			nbDetectedPoints -= this.extractArea(inputSpectrum, convolutedSpectrum,
					bitmask, iStart, nRows, nCols, peakList, threshold);
		}
		
		if (peakList.length > 0&&this.DEBUG) {
			console.log("No peak found");
		}
		return peakList;
	},
	/**
	Detects all the 2D-peaks in the given spectrum based on the Max logic. 
	*/
	findPeaks2DMax:function(inputSpectrum, cs, nRows, nCols, nStdDev) {
		var threshold = 0;
		for(var i=nCols*nRows-2;i>=0;i--)
			threshold+=Math.pow(cs[i]-cs[i+1],2);
		threshold=-Math.sqrt(threshold);
		threshold*=nStdDev/nRows;
		
		var rowI,colI;
		var peakListMax = [];
		var tmpIndex = 0;
		for (var i = 0; i < cs.length; i++) {
			if (cs[i] < threshold) {
				//It is a peak?
				rowI=Math.floor(i/nCols);
				colI=i%nCols;
				//Verifies if this point is a peak;
				if(rowI>0&&rowI+1<nRows&&colI+1<nCols&&colI>0){
					//It is the minimum in the same row
					if(cs[i]<cs[i+1]&&cs[i]<cs[i-1]){
						//It is the minimum in the previous row 
						tmpIndex=(rowI-1)*nCols+colI;
						if(cs[i]<cs[tmpIndex-1]&&cs[i]<cs[tmpIndex]&&cs[i]<cs[tmpIndex+1]){
							//It is the minimum in the next row 
							tmpIndex=(rowI+1)*nCols+colI;
							if(cs[i]<cs[tmpIndex-1]&&cs[i]<cs[tmpIndex]&&cs[i]<cs[tmpIndex+1]){
								peakListMax.push({x:colI,y:rowI,z:inputSpectrum[i]});
							}
						}
					}
				}
			}
		}
		return peakListMax;
	},
	/*
		This function detects the peaks
	*/
	extractArea:function(spectrum, convolutedSpectrum, bitmask, iStart,
			nRows, nCols, peakList, threshold) {
		var iRow = Math.floor(iStart / nCols);
		var iCol = iStart % nCols;
		var peakPoints =[];
		//console.log(iStart+" "+iRow+" "+iCol);
		// scanBitmask(bitmask, convolutedSpectrum, nRows, nCols, iRow, iCol,
		// peakPoints);
		this.scanBitmask(bitmask, nRows, nCols, iRow, iCol, peakPoints);
		//console.log("extractArea.lng "+peakPoints.length);
		var x = new Array(peakPoints.length);
		var y = new Array(peakPoints.length);
		var z = new Array(peakPoints.length);
		var nValues = peakPoints.length;
		var xAverage = 0.0;
		var yAverage = 0.0;
		var zSum = 0.0;
		if (nValues >= 9) {
			if (this.DEBUG)
				console.log("nValues=" + nValues);
			var maxValue = Number.NEGATIVE_INFINITY;
			var maxIndex = -1;
			for (var i = 0; i < nValues; i++) {
				var pt = (peakPoints.splice(0,1))[0];
				x[i] = pt[0];
				y[i] = pt[1];
				z[i] = spectrum[pt[1] * nCols + pt[0]];
				xAverage += x[i] * z[i];
				yAverage += y[i] * z[i];
				zSum += z[i];
				if (z[i] > maxValue) {
					maxValue = z[i];
					maxIndex = i;
				}
			}
			if (maxIndex != -1) {
				xAverage /= zSum;
				yAverage /= zSum;
				var newPeak = {x:xAverage, y:yAverage, z:zSum};
				var minmax;
				minmax = MathUtils.getMinMax(x);
				newPeak.minX=minmax[0];
				newPeak.maxX=minmax[1];
				minmax = MathUtils.getMinMax(y);
				newPeak.minY=minmax[0];
				newPeak.maxY=minmax[1];
				peakList.push(newPeak);
			}
		}
		return nValues;
	},
	/*
		Return all the peaks(x,y points) that composes a signal.
	*/
	scanBitmask:function(bitmask, nRows, nCols, iRow, iCol, peakPoints) {
		//console.log(nRows+" "+iRow+" "+nCols+" "+iCol);
		if (iRow < 0 || iCol < 0 || iCol == nCols || iRow == nRows)
			return;
		if (bitmask[iRow * nCols + iCol]) {
			bitmask[iRow * nCols + iCol] = 0;
			peakPoints.push([iCol, iRow]);
			this.scanBitmask(bitmask, nRows, nCols, iRow + 1, iCol, peakPoints);
			this.scanBitmask(bitmask, nRows, nCols, iRow - 1, iCol, peakPoints);
			this.scanBitmask(bitmask, nRows, nCols, iRow, iCol + 1, peakPoints);
			this.scanBitmask(bitmask, nRows, nCols, iRow, iCol - 1, peakPoints);
		}
	},
	/**
	This function converts a set of 2D-peaks in 2D-signals. Each signal could be composed 
	of many 2D-peaks, and it has some additional information related to the NMR spectrum.
	*/
	createSignals2D:function(peaks, spectraData, tolerance){
		//console.log(peaks.length);
		var signals=[];
		var nbSubSpectra = spectraData.getNbSubSpectra();
		
		var bf1=spectraData.observeFrequencyX();
		var bf2=spectraData.observeFrequencyY();
		
		var firstY = spectraData.getFirstY();
		var lastY = spectraData.getLastY();
		var dy = spectraData.getDeltaY();
		
		//spectraData.setActiveElement(0);
		var noValid=0;
		for (var i = peaks.length-1; i >=0 ; i--) {
		    //console.log(peaks[i].x+" "+spectraData.arrayPointToUnits(peaks[i].x));
		    //console.log(peaks[i].y+" "+(firstY + dy * (peaks[i].y)));
			peaks[i].x=(spectraData.arrayPointToUnits(peaks[i].x));
			peaks[i].y=(firstY + dy * (peaks[i].y));
			//Still having problems to correctly detect peaks on those areas. So I'm removing everything there.
			if(peaks[i].y<-1||peaks[i].y>=210){
				peaks.splice(i,1);
			}
		}
		//The connectivity matrix is an square and symmetric matrix, so we'll only store the upper diagonal in an
		//array like form 
		var connectivity = [];
		var tmp=0;
		tolerance*=tolerance;
		for (var i = 0; i < peaks.length; i++) {
			for (var j = i; j < peaks.length; j++) {
				tmp=Math.pow((peaks[i].x-peaks[j].x)*bf1,2)+Math.pow((peaks[i].y-peaks[j].y)*bf2,2);
				//Console.log(peaks[i].getX()+" "+peaks[j].getX()+" "+tmp);
				if(tmp<tolerance){//30*30Hz We cannot distinguish peaks with less than 20 Hz of separation
					connectivity.push(1);
				}
				else{
					connectivity.push(0);
				}
			}
		}

		var clusters = SimpleClustering.fullClusterGenerator(connectivity);
		
		var signals = [];
		if (peaks != null) {
			var xValue, yValue;
			for (var iCluster = 0; iCluster < clusters.length; iCluster++) {
				signal={nucleusX:spectraData.getNucleus(1),nucleusY:spectraData.getNucleus(2)};
				signal.resolutionX=( spectraData.getLastX()-spectraData.getFirstX()) / spectraData.getNbPoints();
				signal.resolutionY=dy;
				var peaks2D = [];
				signal.shiftX = 0;
				signal.shiftY = 0;
				var sumZ = 0;
				for(var jPeak = clusters[iCluster].length-1;jPeak>=0;jPeak--){
					if(clusters[iCluster][jPeak]==1){
						peaks2D.push(peaks[jPeak]);
						signal.shiftX+=peaks[jPeak].x*peaks[jPeak].z;
						signal.shiftY+=peaks[jPeak].y*peaks[jPeak].z;
						sumZ+=peaks[jPeak].z;
					}
				}
				signal.shiftX/=sumZ;
				signal.shiftY/=sumZ;
				signal.peaks = peaks2D;
				signals.push(signal);
			}
		}
		//console.log(signals);	
		return signals;
	}
};

/**
 * @object SD.prototype
 * Prototype of ESD objects
 */
var ESD = function (newESD) {
	this.ESD2=newESD;
	/**
	* @function nmrPeakDetection2D(options)
	* This function process the given spectraData and tries to determine the NMR signals. Returns an NMRSignal2D array containing all the detected 2D-NMR Signals
	* @param	options:+Object			Object containing the options
	* @option	thresholdFactor:number	A factor to scale the automatically determined noise threshold.
	* @returns	+Object	set of NMRSignal2D
	*/
	this.nmrPeakDetection2D=function(options){
	    options = options||{};
	    if(!options.thresholdFactor)
			options.thresholdFactor=1;
		return PeakFinders2D._findPeaks2DLoG(this, options.thresholdFactor);
	},
	
	this.getNbPoints=function(){
		return this.getSpectraData(0).length/2;
	},
	
	this.getSpectraData=function(i){
		return this.ESD2.spectra[i].data[0];
	},
	
	this.getYData=function(i){
		var y = new Array(this.getNbPoints());
		var tmp = this.getSpectraData(i);
		for(var i=this.getNbPoints()-1;i>=0;i--){
			y[i]=tmp[i*2+1];
		}
		return y;
	}
	this.getNbSubSpectra=function(){
		return this.ESD2.spectra.length;
	},
	
	this.isHomoNuclear=function(){
		return this.ESD2.xType==this.ESD2.yType;
	},
	//Returns the observe frequency in the direct dimension
	this.observeFrequencyX=function(){
		return this.ESD2.spectra[0].observeFrequency;
	},
	
	//Returns the observe frequency in the indirect dimension
	this.observeFrequencyY=function(){
		return this.ESD2.indirectFrequency;
	},
	//Return the xValue for the given index
	this.arrayPointToUnits=function(doublePoint){
		return (this.getFirstX() - (doublePoint* (this.getFirstX() - this.getLastX()) / (this.getNbPoints()-1)));
	},
	//Return the first value of the direct dimension
	this.getFirstX=function(){
		return this.ESD2.minMax.minX;
	},
	//Return the first value of the direct dimension
	this.getLastX=function(){
		return this.ESD2.minMax.maxX;
	},
	
	//Return the first value of the direct dimension
	this.getFirstY=function(){
		return this.ESD2.minMax.minY;
	},
	//Return the first value of the direct dimension
	this.getLastY=function(){
		return this.ESD2.minMax.maxY;
	},
	//Returns the separation between 2 consecutive points in the spectra domain
	this.getDeltaX=function(){
		return (this.getLastX()-this.getFirstX()) / (this.getNbPoints()-1);
	},
	//Returns the separation between 2 consecutive points in the indirect domain
	this.getDeltaY=function(){
		return ( this.getLastY()-this.getFirstY()) / (this.getNbSubSpectra()-1);
	},
	//Return the nucleus of the direct dimension
	this.getNucleus=function(dim){
		if(dim==1)
			return this.ESD2.xType;
		if(dim==2)
			return this.ESD2.yType;
	}
};
define("src/sd", function(){});

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

		}

		return NMR;

	}; // End Factory



    if( typeof define === "function" && define.amd ) {
        

        define( 'src/nmr.js',[ 'jsgraph', './shape.1dnmr', './assignment', 'jcampconverter', './sd' ], function( Graph, Shape1DNMR, Assignment, JcampConverter, SD ) {
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

