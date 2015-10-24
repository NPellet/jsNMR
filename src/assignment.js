
/*!
 * jsGraphs JavaScript Graphing Library v@VERSION
 * http://github.com/NPellet/jsGraphs
 *
 * Copyright 2014 Norman Pellet
 * Released under the MIT license
 *
 * Date: @DATE
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
				var pos = $( el ).position(),
				
					w = parseFloat( el.getAttribute('width') || 0 ),
					h = parseFloat( el.getAttribute('height') || 0 ),

					x2 = parseFloat( el.getAttribute('x2') || 0 ),
					y2 = parseFloat( el.getAttribute('y2') || 0 ),

					x1 = parseFloat( el.getAttribute('x1') || 0 ),
					y1 = parseFloat( el.getAttribute('y1') || 0 ),


					x = pos.left + ( w / 2 ) + ( Math.abs( x2 - x1 ) / 2 ),
					y = pos.top  + ( h / 2 ) + ( Math.abs( y2 - y1 ) / 2 );



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
				if( target == "targetA") {
					return "targetB";
				}
				return "targetA";
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

				bindingLine.setAttribute('x2', e.clientX );
				bindingLine.setAttribute('y2', e.clientY );
			},

			highlight = function( element, target ) {
				
				checkBindingPairs();
				
				if( options[ target ].highlighted ) {
					highlightEquivalents( target, getEquivalents( target, element ) );
				}
				
				//getEquivalents( target, selector );


				var eqs = [];
				
//				unhighlight( element, target );

				all( highlightPair, element, function( pair ) {
					eqs = eqs.concat( $.makeArray( getEquivalents( otherTarget( target ), pair[ otherTarget( target ) ] ) ) );
				} );

				eqs = $( eqs );
				
				if( options[ otherTarget( target ) ].highlighted ) {
					highlightEquivalents( otherTarget( target ), eqs );
				}
				
			},

			unhighlight = function( element, target ) {

				checkBindingPairs();
				
				if(  highlighted[ target ][ 0 ].jsGraphIsShape ) {

					highlighted[ target ].map( function( el ) {
						this.jsGraphIsShape.unHighlight( "assignmentHighlighted");
					} );
				} else {
					restoreAttributes( options[ target ].highlighted, highlighted[ target ] );
				}

				if(  highlighted[ otherTarget( target ) ][ 0 ] && highlighted[ otherTarget( target ) ][ 0 ].jsGraphIsShape ) {

					highlighted[ otherTarget( target ) ].map( function( el ) {
						this.jsGraphIsShape.unHighlight( "assignmentHighlighted");
					} );
				} else {
					restoreAttributes( options[ otherTarget( target ) ].highlighted, highlighted[ otherTarget( target ) ] );
				}

			
				all( unhighlightPair, element );

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

			all = function( fct, element, callback ) {

				for( var i = 0, l = self.bindingPairs.length ; i < l ; i ++ ) {

					if( self.bindingPairs[ i ].targetA == element || self.bindingPairs[ i ].targetB == element ) {

						fct( self.bindingPairs[ i ] );

						if( callback ) {
							callback( self.bindingPairs[ i ] );
						}
					}
				}
			},

			highlightPair = function( pair ) {


				var posA = $( pair.targetA ).offset();
				var posB = $( pair.targetB ).offset();

				var bbA = $( pair.targetA )[ 0 ].getBBox();
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
				if( pair = lookForBound( self.targetA, self.targetB ) ) {
					removePair( pair );
					unhighlightPair( pair );
					return false;
				}

				self.bindingPairs.push( { targetA: self.targetA, targetB: self.targetB } );

				if( self.targetA.jsGraphIsShape ) {
					self.targetA.jsGraphIsShape.setStrokeDasharray("5,5");
					self.targetA.jsGraphIsShape.applyStyle();
				}

				if( self.targetB.jsGraphIsShape ) {
					self.targetB.jsGraphIsShape.setStrokeDasharray("5,5");
					self.targetB.jsGraphIsShape.applyStyle();
				}

				bindingA = null;
				bindingB = null;

			},

			removePair = function( pair ) {
				self.bindingPairs.splice( self.bindingPairs.indexOf( pair ), 1 );
			},

			lookForBound = function( A, B ) {

				self.bindingPairs.map( function( pair ) {

					if( pair.targetA == A || pair.targetB == B ) {
						return pair;
					}
				} );

				return false;
			},

			checkBindingPairs = function() {

				for( var i = 0, l = self.bindingPairs.length ; i < l ; i ++ ) {

					if( $( options.targetA.dom ).get( 0 ).contains( self.bindingPairs[ i ].targetA ) && $( options.targetB.dom ).get( 0 ).contains( self.bindingPairs[ i ].targetB ) ) {
						continue;
					} else {

						self.bindingPairs[ i ] = false;
					}
				}
			},

			setEvents = function( ) {

				options.targetA.dom.on('mousedown', options.targetA.bindableFilter, function( e ) {
					
					mousedown( this, e, "targetA" );
				});

				options.targetA.dom.on('mouseover', options.targetA.bindableFilter, function( e ) {
					
					highlight( this, "targetA" );
				});

				options.targetA.dom.on('mouseout', options.targetA.bindableFilter, function( e ) {
					unhighlight( this, "targetA" );
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

				options.targetA.dom.on('mouseup', function( e ) {
					mouseup( this, e, "targetA" );
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

			var attrA = pair.targetA.getAttribute( self.options.targetA.attributeUnique );
			var attrB = pair.targetB.getAttribute( self.options.targetB.attributeUnique );

			return [ attrA, attrB ];
		} );
	}


	var Assignment = function( $ ) {
		return Constructor;
	};

	if( typeof define === "function" && define.amd ) {
		define( [ 'jquery' ], function( $ ) {
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
