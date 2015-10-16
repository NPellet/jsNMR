'use strict';
 function convertTo3DZ(spectra) {
        //console.time("ConvertTo3DZ");
        var z = [];
        var noise = 0;
        var minZ = spectra[0].data[0][0];
        var maxZ = spectra[0].data[0][0];
        var ySize = spectra.length;
        var xSize = spectra[0].data[0].length / 2;
        for (var i = 0; i < ySize; i++) {
            z[i] = [];
            for (var j = 0; j < xSize; j++) {
                z[i][j] = spectra[i].data[0][j * 2 + 1];
                if (z[i][j] < minZ) minZ = spectra[i].data[0][j * 2 + 1];
                if (z[i][j] > maxZ) maxZ = spectra[i].data[0][j * 2 + 1];
                if (i != 0 && j != 0) {
                    noise += Math.abs(z[i][j] - z[i][j - 1]) + Math.abs(z[i][j] - z[i - 1][j]);
                }
            }
        }
        //console.timeEnd("ConvertTo3DZ");
        return {
            z: z,
            minX: spectra[0].data[0][0],
            maxX: spectra[0].data[0][spectra[0].data[0].length - 2],
            minY: spectra[0].pageValue,
            maxY: spectra[spectra.length - 1].pageValue,
            minZ: minZ,
            maxZ: maxZ,
            noise: noise / ((z.length - 1) * (z[0].length - 1) * 2)
        };

    }

    function add2D(result) {
        var zData = convertTo3DZ(result.spectra);
        result.contourLines = generateContourLines(zData);
        delete zData.z;
        result.minMax = zData;
    }


    function generateContourLines(zData, options) {
        //console.time("generateContourLines");
        var noise = zData.noise;
        var z = zData.z;
        var contourLevels = [];
        var nbLevels = 7;
        var povarHeight = new Float32Array(4);
        var isOver = [];
        var nbSubSpectra = z.length;
        var nbPovars = z[0].length;
        var pAx, pAy, pBx, pBy;

        var x0 = zData.minX;
        var xN = zData.maxX;
        var dx = (xN - x0) / (nbPovars - 1);
        var y0 = zData.minY;
        var yN = zData.maxY;
        var dy = (yN - y0) / (nbSubSpectra - 1);
        var minZ = zData.minZ;
        var maxZ = zData.maxZ;

        //System.out.prvarln("y0 "+y0+" yN "+yN);
        // -------------------------
        // Povars attribution
        //
        // 0----1
        // |  / |
        // | /  |
        // 2----3
        //
        // ---------------------d------

        var lineZValue;
        for (var level = 0; level < nbLevels * 2; level++) { // multiply by 2 for positif and negatif
            var contourLevel = {};
            contourLevels.push(contourLevel);
            var side = level % 2;
            if (side == 0) {
                lineZValue = (maxZ - 5 * noise) * Math.exp(level / 2 - nbLevels) + 5 * noise;
            } else {
                lineZValue = -(maxZ - 5 * noise) * Math.exp(level / 2 - nbLevels) - 5 * noise;
            }
            var lines = [];
            contourLevel.zValue = lineZValue;
            contourLevel.lines = lines;

            if (lineZValue <= minZ || lineZValue >= maxZ) continue;

            for (var iSubSpectra = 0; iSubSpectra < nbSubSpectra - 1; iSubSpectra++) {
                for (var povar = 0; povar < nbPovars - 1; povar++) {
                    povarHeight[0] = z[iSubSpectra][povar];
                    povarHeight[1] = z[iSubSpectra][povar + 1];
                    povarHeight[2] = z[(iSubSpectra + 1)][povar];
                    povarHeight[3] = z[(iSubSpectra + 1)][(povar + 1)];

                    for (var i = 0; i < 4; i++) {
                        isOver[i] = (povarHeight[i] > lineZValue);
                    }

                    // Example povar0 is over the plane and povar1 and
                    // povar2 are below, we find the varersections and add
                    // the segment
                    if (isOver[0] != isOver[1] && isOver[0] != isOver[2]) {
                        pAx = povar + (lineZValue - povarHeight[0]) / (povarHeight[1] - povarHeight[0]);
                        pAy = iSubSpectra;
                        pBx = povar;
                        pBy = iSubSpectra + (lineZValue - povarHeight[0]) / (povarHeight[2] - povarHeight[0]);
                        lines.push(pAx * dx + x0, pAy * dy + y0, pBx * dx + x0, pBy * dy + y0);
                    }
                    if (isOver[3] != isOver[1] && isOver[3] != isOver[2]) {
                        pAx = povar + 1;
                        pAy = iSubSpectra + 1 - (lineZValue - povarHeight[3]) / (povarHeight[1] - povarHeight[3]);
                        pBx = povar + 1 - (lineZValue - povarHeight[3]) / (povarHeight[2] - povarHeight[3]);
                        pBy = iSubSpectra + 1;
                        lines.push(pAx * dx + x0, pAy * dy + y0, pBx * dx + x0, pBy * dy + y0);
                    }
                    // test around the diagonal
                    if (isOver[1] != isOver[2]) {
                        pAx = povar + 1 - (lineZValue - povarHeight[1]) / (povarHeight[2] - povarHeight[1]);
                        pAy = iSubSpectra + (lineZValue - povarHeight[1]) / (povarHeight[2] - povarHeight[1]);
                        if (isOver[1] != isOver[0]) {
                            pBx = povar + 1 - (lineZValue - povarHeight[1]) / (povarHeight[0] - povarHeight[1]);
                            pBy = iSubSpectra;
                            lines.push(pAx * dx + x0, pAy * dy + y0, pBx * dx + x0, pBy * dy + y0);
                        }
                        if (isOver[2] != isOver[0]) {
                            pBx = povar;
                            pBy = iSubSpectra + 1 - (lineZValue - povarHeight[2]) / (povarHeight[0] - povarHeight[2]);
                            lines.push(pAx * dx + x0, pAy * dy + y0, pBx * dx + x0, pBy * dy + y0);
                        }
                        if (isOver[1] != isOver[3]) {
                            pBx = povar + 1;
                            pBy = iSubSpectra + (lineZValue - povarHeight[1]) / (povarHeight[3] - povarHeight[1]);
                            lines.push(pAx * dx + x0, pAy * dy + y0, pBx * dx + x0, pBy * dy + y0);
                        }
                        if (isOver[2] != isOver[3]) {
                            pBx = povar + (lineZValue - povarHeight[2]) / (povarHeight[3] - povarHeight[2]);
                            pBy = iSubSpectra + 1;
                            lines.push(pAx * dx + x0, pAy * dy + y0, pBx * dx + x0, pBy * dy + y0);
                        }
                    }
                }
            }
        }
        // console.timeEnd("generateContourLines");
        return {
            minX: zData.minX,
            maxX: zData.maxX,
            minY: zData.minY,
            maxY: zData.maxY,
            segments: contourLevels
        };
        //return contourLevels;
    }