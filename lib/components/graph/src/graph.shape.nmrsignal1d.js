
define( [ 'require', 'graphs/graph.shape.line' ], function( require, GraphLine ) {

	"use strict";
	var lineHeight = 5;

	var GraphNmrSignal1D = function( graph, options ) {

		this.options = options || {};
		this.init( graph );
		this.nbHandles = 2;
		this.createHandles( this.nbHandles, 'rect', { 
									transform: "translate(-3 -3)", 
									width: 6, 
									height: 6, 
									stroke: "black", 
									fill: "white",
									cursor: 'nwse-resize'
								} );

	}
	$.extend(GraphNmrSignal1D.prototype, GraphLine.prototype, {
		
		createDom: function() {
			this._dom = document.createElementNS(this.graph.ns, 'line');
			this.line1 = document.createElementNS( this.graph.ns, 'line');
			this.line2 = document.createElementNS( this.graph.ns, 'line');

			this.group.appendChild( this.line1 );
			this.group.appendChild( this.line2 );

			this.line1.setAttribute('stroke', 'green');
			this.line2.setAttribute('stroke', 'green');

			this._dom.element = this;
		},


		redrawImpl: function() {

			this.setPosition();
			this.setPosition2();
			this.setHandles();

			this.redrawLines( lineHeight );
			

			this.setBindableToDom( this._dom );
		},

		redrawLines: function( height ) {


			var xs = this.findxs();

			var x1 = this._getPosition( { x: xs[ 0 ] } );
			var x2 = this._getPosition( { x: xs[ 1 ] } );

			if( x1.x && x2.x && this.currentPos2y && this.currentPos1y ) {
				this.line1.setAttribute('x1', x1.x );
				this.line1.setAttribute('x2', x1.x );

				this.line2.setAttribute('x1', x2.x );
				this.line2.setAttribute('x2', x2.x );

				this.setLinesY( height );
			}


		},

		setLinesY: function( height ) {

			this.line1.setAttribute('y1', this.currentPos2y - height );
			this.line1.setAttribute('y2', this.currentPos2y + height );

			this.line2.setAttribute('y1', this.currentPos1y - height );
			this.line2.setAttribute('y2', this.currentPos1y + height );

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
			var dx = x[1]-x[0];
			// fill convolution frecuency axis
			var X = []//x[2:(len(x)-2)];
	
			// fill Savitzky-Golay 0th
			var Y = new Array();
			for (var j = 2; j < x.length -2; j++){
				Y.push((1/35.0)*(-3*y[j-2] + 12*y[j-1] + 17*y[j] + 12*y[j+1] - 3*y[j+2]));
				X.push(x[j]);
			}
	
			// fill Savitzky-Golay 1st
			var dY = new Array();
			for (j = 2; j < x.length -2; j++)
				dY.push((1/(12*dx))*(y[j-2] - 8*y[j-1] + 8*y[j+1] - y[j+2]));
	
			// fill Savitzky-Golay 2nd
			var ddY = new Array();
			for (j = 2; j < x.length -2; j++)
				ddY.push((1/(7*dx*2))*(2*y[j-2] - y[j-1] - 2*y[j] - y[j+1] + 2*y[j+2]));
		
			// pushs max and min points in convolution functions
			var maxY = new Array();
			var stackInt = new Array();
			var intervals = new Array();
			var minddY = new Array();
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
						intervals.push( (X[i] , stackInt.pop()) );
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
		    console.log(intervals.length);
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
				if (possible.length > 0)
					if (possible.length == 1)
					{
						var inter = possible[0];
						var linewith = inter[1] - inter[0];
						var height = f[1];
						var points = Y;
						points.sort(function(a, b){return a-b});
						if ((linewith > 2*dx) && (height > 0.0001*points[0]))
							signals.push( [frecuency, linewith, height] );
					}
					else
					{
						//TODO: nested peaks
						console.log(possible);
					}
			}
			//console.log(signals);
			return signals;
		},

		highlight: function() {

			if( this.isBindable() ) {
				this._dom.setAttribute('stroke-width', '5');
				this.setLinesY( lineHeight + 2 );
			}
		},


		unhighlight: function() {

			if( this.isBindable() ) {
				this.setStrokeWidth();
				this.setLinesY( lineHeight );
			}
		}
	});

	return GraphNmrSignal1D;
});