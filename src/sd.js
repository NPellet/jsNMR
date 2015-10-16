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
}