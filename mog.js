function MOG() {
    this.mogArray = new Array(6);
    this.score = new Array(6);
    this.columnWeight = new Array(6);
    this.topRowWeight = 0;
    this.weight = 0;

	var Hexacode = new HexacodeUtils();

    for (var i=0; i<6; i++) {
    	this.mogArray[i] = new Array(4);
        for (var j=0; j<4; j++) {
            this.mogArray[i][j] = false;
        }
        this.score[i] = 0;
        this.columnWeight[i] = 0;
    }

    this.copyMOG = function(oldMOG) {
		var newMOG = new MOG();

		for (var i=0; i<6; i++) {
			for (var j=0; j<4; j++)
				newMOG.mogArray[i][j] = oldMOG.mogArray[i][j];
			newMOG.score[i] = oldMOG.score[i];
			newMOG.columnWeight[i] = oldMOG.columnWeight[i];
		}

		newMOG.topRowWeight = oldMOG.topRowWeight;
		newMOG.weight = oldMOG.weight;

		return newMOG;
	};

    this.getWeight = function() {
        return this.weight;
    };

    this.getColumnWeight = function (outWeight) {
		for (var i=0; i<6; i++)
			outWeight[i] = this.columnWeight[i];
	};

	this.getArrayElement = function(i, j) {
		return this.mogArray[i][j];
	};

	this.getScore = function(outScore) {
		for (var i=0; i<6; i++)
			outScore[i] = this.score[i];
	};

	this.setArrayElement = function(i, j, value) {
		if (this.mogArray[i][j] && !value) {
			this.weight--;
			if (j == 0)
				this.topRowWeight--;
			this.columnWeight[i]--;
			this.score[i] = Hexacode.f4Add(this.score[i], j);
		}
		else if (!(this.mogArray[i][j]) && value) {
			this.weight++;
			if (j == 0)
				this.topRowWeight++;
			this.columnWeight[i]++;
			this.score[i] = Hexacode.f4Add(this.score[i], j);
		}
		this.mogArray[i][j] = value;
	};

	this.toggleArrayElement = function(i, j) {
		this.setArrayElement(i,j,!this.mogArray[i][j]);
	};

	this.isGolayCodeword = function() {
		var parity;

		parity = this.columnWeight[0] % 2;
		for (var i=1; i<6; i++)
			if (this.columnWeight[i] % 2 != parity)
				return false;
		if (this.topRowWeight % 2 != parity)
			return false;
		if (!Hexacode.isHexacodeElement(this.score))
			return false;
		return true;
	};

	this.getOctadCompletion = function(outCompletionI, outCompletionJ) {
		if (this.weight != 5)
			console.error("MOG.getOctadCompletion called with a weight other than 5");
		for (var i=0; i<3; i++) {
			outCompletionI[i] = -1;
			outCompletionJ[i] = -1;
		}
		var evenCount = 0, majorityParity;
		for (var i=0; i<6; i++)
			if (this.columnWeight[i] % 2 == 0)
				evenCount++;
		if (evenCount == 5)
			majorityParity = 0;
		else if (evenCount == 1)
			majorityParity = 1;
		else /* evenCount == 3, no majority */
			majorityParity = -1;

		if (majorityParity != -1) {
			var changed, wrongParity = -1, newTopRowWeight;
			var outScore = new Array(6), tempScore = new Array(6);
			//console.log("Majority parity is " + majorityParity);
			for (var i=0; i<6; i++)
				if (this.columnWeight[i] % 2 == majorityParity)
					tempScore[i] = this.score[i];
				else {
					tempScore[i] = -1;
					wrongParity = i;
				}
			changed = Hexacode.solve5Problem(tempScore, outScore);
			//console.log("Solved 5 problem is " + outScore[0] + " " + + outScore[1] + " " + outScore[2] + " " + outScore[3] + " " + outScore[4] + " " + outScore[5]);
			if (changed != -1) {
				/* In this case, we must add 2 elements to the changed position and 1 element to the wrong parity position.	 */

				/* First, fix the wrong parity position. */
				var changedRow = Hexacode.f4Add(this.score[wrongParity], outScore[wrongParity]);
				if (this.mogArray[wrongParity][changedRow])
					console.error("getOctadCompletion: majority parity " + majorityParity + " - could not fix wrongParity " + wrongParity + " column");

				outScore[wrongParity] = this.score[wrongParity];
				outCompletionI[0] = wrongParity;
				outCompletionJ[0] = changedRow;

				if (changedRow == 0)
					newTopRowWeight = this.topRowWeight + 1;
				else newTopRowWeight = this.topRowWeight;

				/* Now, figure out what to do with the changed position. */
				if (this.columnWeight[changed] > 2)
					console.error("getOctadCompletion: majority parity " + majorityParity + " - could not fix changed " + changed + " column because it already has " + this.columnWeight[changed] + " elements");
				if (this.columnWeight[changed] == 2) { /* Fill in the other two. */
					if (outScore[changed] != 0)
						console.error("getOctadCompletion: majority parity " + majorityParity + " - could not fix changed " + changed + " column because it already has 2 elements and we are changing to nonzero score " + outScore[changed]);
					var k=1;
					for (var j=0; j<=3; j++)
						if (!this.mogArray[changed][j]) {
							outCompletionI[k] = changed;
							outCompletionJ[k] = j;
							k++;
						}
				}
				else if (this.columnWeight[changed] == 1) { /* Fill in everything except outScore[changed]. */
					if (this.mogArray[changed][outScore[changed]])
						console.error("getOctadCompletion: majority parity " + majorityParity + " - could not fix changed " + changed + " column of 1 element to score " + outScore[changed]);
					var k=1;
					for (var j=0; j<=3; j++)
						if (j != outScore[changed] && j != this.score[changed]) {
							outCompletionI[k] = changed;
							outCompletionJ[k] = j;
							k++;
						}
				}
				else { /* columnWeight[changed] == 0 -- we have two possibilities now, check top row parity */
					if (this.columnWeight[changed] != 0)
						console.error("getOctadCompletion: majority parity " + majorityParity + " - unexpected column weight " + this.columnWeight[changed] + " in changed column " + changed);
					if (outScore[changed] == 0)
						console.error("getOctadCompletion: majority parity " + majorityParity + " - could not fix changed " + changed + " column of 0 elements to score 0");
					if (newTopRowWeight % 2 == majorityParity) { /* choose the solution not including 0. */
						var k=1;
						for (var j=1; j<=3; j++)
							if (j != outScore[changed]) {
								outCompletionI[k] = changed;
								outCompletionJ[k] = j;
								k++;
							}
					}
					else { /* choose the solution including 0. */
						outCompletionI[1] = changed;
						outCompletionJ[1] = 0;

						outCompletionI[2] = changed;
						outCompletionJ[2] = outScore[changed];
					}
				}
			} else { /* changed == -1, hexacode 5-problem was solved without changing any digits
			 		  * we must add 3 elements to the wrong parity column.
			 		  */
				if (this.columnWeight[wrongParity] > 1)
					console.error("getOctadCompletion: majority parity " + majorityParity + ", no changed position in 5-problem, wrong parity column has more than 1 element");
				else if (this.columnWeight[wrongParity] == 1) { /* Fill in the other 3 entries. */
					if (outScore[wrongParity] != 0)
						console.error("getOctadCompletion: majority parity " + majorityParity + ", no changed position in 5-problem, wrong parity column has 1 element, target score is nonzero value " + outScore[wrongParity]);
					var k=0;
					for (var j=0; j<=3; j++)
						if (!this.mogArray[wrongParity][j]) {
							outCompletionI[k] = wrongParity;
							outCompletionJ[k] = j;
							k++;
						}
				} else { /* columnWeight[wrongParity] == 0, fill in the 3 entries other than outScore[wrongParity]. */
					if (this.columnWeight[wrongParity] != 0)
						console.error("getOctadCompletion: majority parity " + majorityParity + ", no changed position in 5-problem, unexpected column weight " + this.columnWeight[wrongParity] + " in wrong parity column " + wrongParity);
					var k=0;
					for (var j=0; j<=3; j++)
						if (j != outScore[wrongParity]) {
							if (this.mogArray[wrongParity][j])
								console.error("getOctadCompletion: majority parity " + majorityParity + ", no changed position in 5-problem, column weight is 0 in wrong parity column " + wrongParity + " but found element at row " + j);
							outCompletionI[k] = wrongParity;
							outCompletionJ[k] = j;
							k++;
						}
				}
			}
		} else { /* no majority parity. */
			/* There are two cases: 311000 or 211100.  In the former case, the parity must be odd, but in the latter,
			 * it could be either one and we must try both.
			 */
			var has3 = false;
			var tempScore = new Array(6), outScore = new Array(6);

			for (var i=0; i<6; i++)
				if (this.columnWeight[i] == 3) {
					has3 = true;
					break;
				}

			if (has3) { /* 311000 - parity must be odd */
				for (var i=0; i<6; i++)
					if (this.columnWeight[i] % 2 == 1)
						tempScore[i] = this.score[i];
					else tempScore[i] = -1;
				Hexacode.solve3Problem(tempScore, outScore);
				var k=0;
				for (var i=0; i<6; i++) {
					if (this.columnWeight[i] % 2 == 0) {
						if (this.columnWeight[i] != 0)
							console.error("getOctadCompletion: no majority parity, has3 case, unexpected column weight " + this.columnWeight[i]);
						outCompletionI[k] = i;
						outCompletionJ[k] = outScore[i];
						k++;
					}
				}
			} else { /* 211100 - try both parities */
				/* first try odd - target distribution 311111 */
				for (var i=0; i<6; i++)
					if (this.columnWeight[i] % 2 == 1)
						tempScore[i] = this.score[i];
					else tempScore[i] = -1;
				Hexacode.solve3Problem(tempScore, outScore);

				/* We check the column with 2 elements to see if we can add a third.
				 * If so, then we are done.
				 */

				var done = false, foundTwo = false;
				var k=0;
				for (var i=0; i<6; i++)
					if (this.columnWeight[i] % 2 == 0) {
						if (this.columnWeight[i] == 0) {
							outCompletionI[k] = i;
							outCompletionJ[k] = outScore[i];
							k++;
						} else if (this.columnWeight[i] == 2) {
							if (foundTwo)
								console.error("getOctadCompletion: no majority parity, no has3, odd case, too many columns of weight 2");
							foundTwo = true;
							if (!this.mogArray[i][outScore[i]]) { /* we can add a third element, so we are done */
								var changedRow = Hexacode.f4Add(this.score[i], outScore[i]);
								if (this.mogArray[i][changedRow])
									console.error("getOctadCompletion: no majority parity, no has3, odd case, inconsistent information on adding third element to weight 2 column");
								outCompletionI[k] = i;
								outCompletionJ[k] = changedRow;
								k++;
								done = true;
							}
						}
					}
				if (!done) { /* odd case did not work, even case must work.  We add the appropriate element to each
				 			  * odd (1) column.
				 			  * Target distribution is 222200.
				 			  */

					for (var i=0; i<6; i++)
						if (this.columnWeight[i] % 2 == 0)
							tempScore[i] = this.score[i];
						else tempScore[i] = -1;
					Hexacode.solve3Problem(tempScore, outScore);

					/* clear everything out from the odd case, just to be safe. */
					for (k=0; k<=2; k++) {
						outCompletionI[k] = -1;
						outCompletionJ[k] = -1;
					}

					k=0;
					for (var i=0; i<6; i++) {
						if (this.columnWeight[i] % 2 == 1) {
							if (this.columnWeight[i] != 1)
								console.error("getOctadCompletion: no majority parity, no has3, even case, unexpected column weight " + this.columnWeight[i]);
							var changedRow = Hexacode.f4Add(outScore[i], this.score[i]);

							if (this.mogArray[i][changedRow])
								console.error("getOctadCompletion: no majority parity, no has3, even case, could not second element to weight 1 column " + i + " to get score " + outScore[i]);

							outCompletionI[k] = i;
							outCompletionJ[k] = changedRow;
							k++;
						}
					}

				}
			}
		}

		for (var k=0; k<=2; k++) {
			if (outCompletionI[k] == -1 || outCompletionJ[k] == -1)
				console.error("getOctadCompletion: function complete, but outCompletionI[k] = " + outCompletionI[k] + " and outCompletionJ[k] = " + outCompletionJ[k]);
			if (this.mogArray[outCompletionI[k]][outCompletionJ[k]])
				console.error("getOctadCompletion: function complete, but completion position " + outCompletionI[k] + " " + outCompletionJ[k] + " is already filled");
		}
	};

	this.getSextet = function() {
		var newArray = new Array(6);
		for (var i=0; i<6; i++) {
			newArray[i] = new Array(4);
        }
    	var completionI = new Array(3), completionJ = new Array(3);
    	var colorIndex = 1;
    	var done = false;

    	if (this.weight != 4)
    		console.error("getSextet called when weight is not 4");

    	var tempMOG = this.copyMOG(this);

    	for (var i=0; i<6; i++)
    		for (var j=0; j<4; j++)
    			if (tempMOG.getArrayElement(i,j))
    				newArray[i][j] = 1;
    			else newArray[i][j] = 0;

    	while (!done) {
    		done = true;
    		for (var i=0; i<6; i++) {
    			for (var j=0; j<4; j++) {
    				if (newArray[i][j] == 0) {
    					done = false;
    					tempMOG.setArrayElement(i, j, true);
    					tempMOG.getOctadCompletion(completionI, completionJ);
    					colorIndex++;
    					newArray[i][j] = colorIndex;
    					for (var k=0; k<=2; k++)
    						newArray[completionI[k]][completionJ[k]] = colorIndex;
    					tempMOG.setArrayElement(i, j, false);
    					break;
    				}
    			}
    			if (!done) break;
    		}
    	}

    	return newArray;
	};

	this.getDualRepresentative = function(outRepI, outRepJ) {
		/* Get a minimal dual representative of the subset indicated by the squares marked. */

		var newMOG = this.copyMOG(this);

		while (newMOG.weight >= 5) {
			var tempMOG = new MOG();
			var count = 0;
			for (var i=0; i<6; i++) {
				for (var j=0; j<4; j++) {
					if (newMOG.getArrayElement(i,j)) {
						count++;
						tempMOG.setArrayElement(i,j,true);
						newMOG.setArrayElement(i,j,false);
						if (count == 5) break;
					}
				}
				if (count == 5) break;
			}

			var compI = new Array(3), compJ = new Array(3);
			tempMOG.getOctadCompletion(compI, compJ);
			for (var k=0; k<3; k++)
				newMOG.toggleArrayElement(compI[k], compJ[k]);
		}

		var count = 0;
		for (var i=0; i<6; i++)
			for (var j=0; j<4; j++) {
				if (newMOG.getArrayElement(i,j)) {
					outRepI[count] = i;
					outRepJ[count] = j;
					count++;
				}
			}
		if (count != newMOG.weight)
			console.error("getDualRepresentative: count in newMOG does not equal newMOG.weight");
		return count;
	};

	this.getOrbitClassification = function() {
		/* This returns the orbit under M24 of the current mogArray, in the notation of SPLAG, Chapter 10, section 2.6.
		 *
		 * For n<12:
		 * 	S_n: a subset of size n which contains, or is contained, in a special octad.
		 *  U_n: a subset of size n not in S_n but contained in an umbral dodecad
		 *  T_n: otherwise.  (called transverse, only for n>=8)
		 *
		 * For n=12:
		 *  U_12: an umbral dodecad
		 *  S_12+: a subset of size 12 containing 3 special octads
		 *  S_12: a subset of size 12 containing 1 special octad
		 *  U_12-: 11 points of an umbral dodecad plus an extra point
		 *  T_12: otherwise. (called transverse)
		 *
		 * For n>12:
		 * 	A subset lies in S_n, T_n, U_n respectively iff its complement lies in S_{24-n}, T_{24-n}, U_{24-n}, respectively.
		 */

		if (this.weight > 12) {
			var tempMOG = new MOG();
			for(var i=0; i<6; i++)
				for (var j=0; j<4; j++)
					tempMOG.setArrayElement(i, j, !this.getArrayElement(i,j));

			var complementClass = tempMOG.getOrbitClassification();
			return complementClass.substring(0,1) + this.weight;
		}
		var dualLength, dualI = new Array(4), dualJ = new Array(4);


		dualLength = this.getDualRepresentative(dualI, dualJ);

		var intersectionSize = 0, sextetIntersectionSize = new Array(7), intersectionSizeDistribution = new Array(3);
		for (var k=0; k<dualLength; k++) {
			if (this.getArrayElement(dualI[k], dualJ[k]))
				intersectionSize++;
		}
		if (dualLength == 4) {
			var tempMOG = new MOG();
			for (var k=0; k<4; k++)
				tempMOG.setArrayElement(dualI[k], dualJ[k], true);
			var sextet = tempMOG.getSextet();
			for (var k=1; k<=6; k++)
				sextetIntersectionSize[k] = 0;
			for (var i=0; i<6; i++)
				for (var j=0; j<4; j++)
					if (this.getArrayElement(i,j))
						sextetIntersectionSize[sextet[i][j]]++;

			/* intersectionSizeDistribution counts how many 0's, 2's, 4's are among the intersection sizes. */

			for (var k=0; k<=2; k++)
				intersectionSizeDistribution[k] = 0;
			for (var k=1; k<=6; k++) {
				intersectionSizeDistribution[Math.floor(sextetIntersectionSize[k]/2)]++;
			}

		}

		if (this.weight < 6) return "S"+this.weight;

		if (this.weight == 6 && dualLength == 2) return "S6";
		if (this.weight == 6 && dualLength == 4) return "U6";

		if (this.weight == 7 && dualLength == 1) return "S7";
		if (this.weight == 7 && dualLength == 3) return "U7";

		if (this.weight == 8 && dualLength == 0) return "S8";
		if (this.weight == 8 && dualLength == 2) return "T8";
		if (this.weight == 8 && dualLength == 4) return "U8";

		if (this.weight == 9 && dualLength == 1) return "S9";
		if (this.weight == 9 && dualLength == 3 && intersectionSize == 2) return "T9";
		if (this.weight == 9 && dualLength == 3 && intersectionSize == 0) return "U9";

		if (this.weight == 10 && dualLength == 2 && intersectionSize == 2) return "S10";
		if (this.weight == 10 && dualLength == 4) return "T10";
		if (this.weight == 10 && dualLength == 2 && intersectionSize == 0) return "U10";

		if (this.weight == 11 && dualLength == 3 && intersectionSize == 3) return "S11";
		if (this.weight == 11 && dualLength == 3 && intersectionSize == 1) return "T11";
		if (this.weight == 11 && dualLength == 1) return "U11";

		if (this.weight == 12 && dualLength == 4 && intersectionSizeDistribution[0] == 1 && intersectionSizeDistribution[1] == 4 && intersectionSizeDistribution[2] == 1)
			return "S12";
		if (this.weight == 12 && dualLength == 4 && intersectionSizeDistribution[0] == 3 && intersectionSizeDistribution[1] == 0 && intersectionSizeDistribution[2] == 3)
			return "S12+";
		if (this.weight == 12 && dualLength == 4 && intersectionSizeDistribution[0] == 0 && intersectionSizeDistribution[1] == 6 && intersectionSizeDistribution[2] == 0)
			return "T12";
		if (this.weight == 12 && dualLength == 2) return "U12-";
		if (this.weight == 12 && dualLength == 0) return "U12";

		console.error("getOrbitClassification: unknown classification");
	};

	this.getFourthPointOfPlane = function(givenI, givenJ) {
		/* Given an octad (the current state of the MOG), the remaining 16 points form a 4-dimensional space over F_2.
		 * Any 3 points in the space determine an affine plane.
		 * The arrays givenI[] and givenJ[] should contain 3 points; then this function returns the fourth point of the affine plane.
		 *
		 *  We use the following algorithm:
		 *  1. Select a point P of the octad.
		 *  2. For each point Q != P of the octad, complete the following 5 points to an octad: Q, P, the 3 given points.
		 *  3. If the completion has 2 points inside the octad and one in the complement, then the one in the complement is the fourth point
		 *     we are looking for.  Otherwise, go back to step 2 with another point of the octad.
		 */

		var fourth;

		if (!(this.weight == 8 && this.isGolayCodeword()))
			console.error("getFourthPointOfPlane: called on non-octad");
		for (var k=0; k<3; k++)
			if (this.getArrayElement(givenI[k], givenJ[k]))
				console.error("getFourthPointOfPlane: given point is already in octad");

		fourth = new Array(2);

		var tempMOG = new MOG();
		for (var k=0; k<3; k++)
			tempMOG.setArrayElement(givenI[k], givenJ[k], true);

		var foundElement = false;
		for (var i=0; i<6; i++)
			for (var j=0; j<4; j++) {
				if (this.getArrayElement(i,j)) {
					if (!foundElement) {
						tempMOG.setArrayElement(i,j, true);
						foundElement = true;
					} else {
						tempMOG.setArrayElement(i,j,true);
						var compI = new Array(3), compJ = new Array(3);
						tempMOG.getOctadCompletion(compI, compJ);
						fourth[0] = -1;
						fourth[1] = -1;
						for (var k=0; k<3; k++)
							if (!this.getArrayElement(compI[k], compJ[k])) {
								if (fourth[0] != -1) { /* more than one element in complement, so this doesn't work. */
									fourth[0] = -1;
									fourth[1] = -1;
									break;
								} else {
									fourth[0] = compI[k];
									fourth[1] = compJ[k];
								}
							}
						/* If we get here and fourth[] isn't -1, then there was exactly one element in the completion
						 * in the complement of the octad.  That's it.
						 */
						if (fourth[0] != -1 && fourth[1] != -1)
							return fourth;
						else tempMOG.setArrayElement(i, j, false);
					}
				}
			}
		console.error("getFourthPointOfPlane: algorithm failed");
	};

	this.getBlockDecomposition = function() {
		/* This function returns the block decompositions for those classes whose stabilizers have one or more imprimitive
		 * orbits.
		 *
		 * For the stabilizers of S4, U6, U8, S10, T10, S12, S12+, T12, the block decomposition is obtained by intersecting the orbits
		 * with the dual representative sextets.
		 *
		 * For T10, the orbit of size 12 has two distinct block decompositions. The one induced by the dual sextet has
		 * 4 blocks of size 3, but there is another one with 3 blocks of size 4, which we do not show. -- TODO??
		 *
		 * For the stabilizer of a U10, the orbit of size 12 decomposes into 2 blocks of size 6.
		 * For the stabilizer of an S10, the orbit of size 14 decomposes into 7 blocks of size 2.
		 * For the stabilizer of an S11, the orbit of size 12 decomposes into 3 blocks of size 4,
		 *     and the orbit of size 8 decomposes into 2 blocks of size 4.
		 * In the last 3 cases, the algorithms for finding the blocks are described in the code below.
		 */
		var dualLength, dualI = new Array(4), dualJ = new Array(4);
		dualLength = this.getDualRepresentative(dualI, dualJ);
		if (dualLength == 4) {
			var tempMOG = new MOG();
			for (var k=0; k<4; k++)
				tempMOG.setArrayElement(dualI[k], dualJ[k], true);
			var sextet = tempMOG.getSextet();

			return sextet;
		} else {
			var orbitClass = this.getOrbitClassification();
			if (orbitClass == "S11") {
				/* Algorithm:
				 * 	1. Decompose S11 into an octad + 3 additional points.  (This decomposition is unique.)
				 *  2. Determine the fourth point of the plane determined by the 3 additional points, with respect to the octad.
				 *  3. Determine the sextets for the 4 points of the plane.
				 */
				for (var k=0; k<3; k++)
					this.setArrayElement(dualI[k], dualJ[k], false);
				/* now the MOG is a special octad. */
				var fourthPoint = this.getFourthPointOfPlane(dualI, dualJ);

				/* We have the fourth point now.  Complete the dual rep (3 point) + fourth point into sextets. */
				var tempMOG = new MOG();
				for (var k=0; k<3; k++)
					tempMOG.setArrayElement(dualI[k], dualJ[k], true);
				tempMOG.setArrayElement(fourthPoint[0], fourthPoint[1], true);

				var result = tempMOG.getSextet();

				/* Restore the original MOG. */
				for (var k=0; k<3; k++)
					this.setArrayElement(dualI[k], dualJ[k], true);
				return result;
			} else if (orbitClass == "S10") {
				/* Algorithm:
				 * 	1. Decompose the S10 into an octad plus 2 additional points (P, Q).  (This decomposition is unique.)
				 *  2. For each of the remaining 14 points R, find the fourth point of the plane determined by P, Q, R, with respect to the octad.
				 *     This pairs up the 14-point orbit to 7 blocks of size 2.
				 *  3. The remaining 2 orbits are the octad, and {P,Q}.
				 */
				for (var k=0; k<2; k++)
					this.setArrayElement(dualI[k], dualJ[k], false);
				/* now the MOG is a special octad. */

				var result = new Array(6);
				for (var i=0; i<6; i++) {
					result[i] = new Array(4);
                }
				for (var i=0; i<6; i++)
					for (var j=0; j<4; j++)
						result[i][j] = -1;

				var color = 3;
				for (var i=0; i<6; i++)
					for (var j=0; j<4; j++)
						if (this.getArrayElement(i,j)) /* in the special octad */
							result[i][j] = 1;
						else if ((i == dualI[0] && j == dualJ[0]) || (i == dualI[1] && j == dualJ[1])) /* dual representative */
							result[i][j] = 2;
						else if (result[i][j] == -1) {
							dualI[2] = i;
							dualJ[2] = j;
							var fourth = this.getFourthPointOfPlane(dualI, dualJ);
							result[i][j] = color;
							result[fourth[0]][fourth[1]] = color;
							color++;
						}
				/* Restore the original MOG. */
				for (var k=0; k<2; k++)
					this.setArrayElement(dualI[k], dualJ[k], true);
				return result;
			} else if (orbitClass == "U10") {
				/* Algorithm:
				 *
				 * 1. Complete the U10 to a dodecad, with 2 additional points (P, Q).
				 * 2. Choose 3 points X1, X2, X3 of the U10.
				 * 3. Complete the points P, Q, X1, X2, X3 to an octad.  The completion will have one point in the U10 (call it X4), and 2 other
				 *    points in the complement of the dodecad (Y1, Y2).
				 * 4. Choose another point X5 (distinct from X1 through X4).  Complete the points P, Q, X3, X4, X5 to an octad.  The completion
				 *    will have one point the U10 (call it X6 -- distinct from X1 through X5), and 2 other points (Y3, Y4).
				 * 5. Complete the points P, Q, X1, X2, X5 to an octad.  If the completion does not contain X6, go to step 4 and
				 *    try a different X5.
				 * 6. The blocks of the 12-point orbit of the stabilizer of the U10, are {Y1,...Y6} and the other 6 points.
				 * 7. The other orbits are the original U10 and {P,Q}.
				 */

				var xi = new Array(6), xj = new Array(6);
				var result = new Array(6);
				for (var i=0; i<6; i++) {
					result[i] = new Array(4);
                }

				var count = 0;
				var tempMOG = new MOG();
				tempMOG.setArrayElement(dualI[0], dualJ[0], true);
				tempMOG.setArrayElement(dualI[1], dualJ[1], true);

				/* Step 2.
				 */
				for (var i=0; i<6; i++)
					for (var j=0; j<4; j++)
						if (this.getArrayElement(i,j)) { /* in the original U10 */
							if (count < 5) {
								xi[count] = i;
								xj[count] = j;
								if (count < 3) {
									tempMOG.setArrayElement(i,j,true);
									result[i][j] = -2; /* we mark the initial points we choose as -2.  This label is later used to
									 					  ensure that we don't choose any of these points again when finding a suitable
									 					  5th point in step 4. */
								}
								else result[i][j] = 1;

								//console.log(count + ": " + xi[count] + " " + xj[count]);
								count++;
							} else result[i][j] = 1;
						} else if ((dualI[0] == i && dualJ[0] == j) || (dualI[1] == i && dualJ[1] == j)) /* in the dodecad completion */
							result[i][j] = 2;
						else result[i][j] = -1; /* in the complement of the dodecad */

				/* Step 3 */
				var compI = new Array(3), compJ = new Array(3);
				tempMOG.getOctadCompletion(compI, compJ);
				for (var k=0; k<3; k++)
					if (this.getArrayElement(compI[k], compJ[k])) {
						if (xi[4] == compI[k] && xj[4] == compJ[k]) { /* if we've already used this point as the 5th point, then switch it with the 4th point. */
							xi[4] = xi[3];
							xj[4] = xj[3];
							//console.log("4: " + xi[4] + " " + xj[4]);
						}
						xi[3] = compI[k];
						xj[3] = compJ[k];
						result[xi[3]][xj[3]] = -2; /* We can't use this point as the 5th point, so we mark it as -2. */
						//console.log("3: " + xi[3] + " " + xj[3]);
					} else result[compI[k]][compJ[k]] = 3;

				var done = false;

				while (!done) {
					/* Step 4 */
					tempMOG.setArrayElement(xi[0], xj[0], false);
					tempMOG.setArrayElement(xi[1], xj[1], false);
					tempMOG.setArrayElement(xi[2], xj[2], true);
					tempMOG.setArrayElement(xi[3], xj[3], true);
					tempMOG.setArrayElement(xi[4], xj[4], true);
					tempMOG.getOctadCompletion(compI, compJ);
					for (var k=0; k<3; k++)
						if (this.getArrayElement(compI[k], compJ[k])) {
							xi[5] = compI[k];
							xj[5] = compJ[k];
							//console.log("5: " + xi[5] + " " + xj[5]);
						} else result[compI[k]][compJ[k]] = -3; /* in case we need to clear it out if we find it doesn't work. */

					/* step 5 */
					tempMOG.setArrayElement(xi[0], xj[0], true);
					tempMOG.setArrayElement(xi[1], xj[1], true);
					tempMOG.setArrayElement(xi[2], xj[2], false);
					tempMOG.setArrayElement(xi[3], xj[3], false);
					tempMOG.setArrayElement(xi[4], xj[4], true); // this is already true
					tempMOG.getOctadCompletion(compI, compJ);

					done = true;
					for (var k=0; k<3; k++)
						if (this.getArrayElement(compI[k], compJ[k])) {
							if (!(compI[k] == xi[5] && compJ[k] == xj[5])) {
								done = false;
								result[xi[4]][xj[4]] = -2;
								result[xi[5]][xj[5]] = -2;
															/* -2 is a mark indicating we've already tried this as a 5th point and it did not
								                              work. */
								tempMOG.setArrayElement(xi[4], xj[4], false);
								var foundPoint = false;
								for (var i=0; i<6; i++) {
									for (var j=0; j<4; j++) {
										if (!foundPoint && this.getArrayElement(i,j) && result[i][j] != -2) {
											xi[4] = i;
											xj[4] = j;
											//console.log("4: " + xi[4] + " " + xj[4]);

											foundPoint = true;
											break;
										}
									}
									if (foundPoint)
										break;
								}
							}
						} else result[compI[k]][compJ[k]] = -3; /* in case we need to clear it out if we find it doesn't work. */

					if (!done) /* If the chosen 5th point didn't work, then clear out any temporary -3's. */
						for (var i=0; i<6; i++)
							for (var j=0; j<4; j++)
								if (result[i][j] == -3)
									result[i][j] = -1;
				}

				/* step 6 */
				/* Label the 6 remaining points of the dodecad complement; convert all temporary (negative) labels
				 * to their correct values.
				 */
				for (var i=0; i<6; i++)
					for (var j=0; j<4; j++)
						if (result[i][j] == -1)
							result[i][j] = 4;
						else if (result[i][j] == -2)
							result[i][j] = 1;
						else if (result[i][j] == -3)
							result[i][j] = 3;

				return result;
			} else return null;
		}
	};
}