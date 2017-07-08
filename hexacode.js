function HexacodeUtils() {
    this.omega = 2; /* element of F4 */
	this.omegabar = 3; /* element of F4 */

	this.verifyf4 = function(j, exceptionString) {
		if (!(0<=j && j<=3))
			console.error(exceptionString);
	};

	this.f4Add = function(j1, j2) {
		this.verifyf4(j1,"Attempt to f4Add " + j1 + " and " + j2);
		this.verifyf4(j2,"Attempt to f4Add " + j1 + " and " + j2);

		if (j1 == j2)
			return 0;
		if (j1 == 0)
			return j2;
		if (j2 == 0)
			return j1;
		for (var i=1; i<=3; i++)
			if(i != j1 && i != j2)
				return i;

		console.error("f4Add failed on " + j1 + " and " + j2);
	};

	this.f4Multiply = function(j1, j2) {
		this.verifyf4(j1, "Attempt to f4Multiply " + j1 + " and " + j2);
		this.verifyf4(j2, "Attempt to f4Multiply " + j1 + " and " + j2);

		if (j1 == 0 || j2 == 0)
			return 0;
		if (j1 == 1)
			return j2;
		if (j2 == 1)
			return j1;
		if (j1 != j2)
			return 1;
		if (j1 == this.omega && j2 == this.omega)
			return this.omegabar;
		if (j1 == this.omegabar && j2 == this.omegabar)
			return this.omega;
		console.error("f4Multiply failed on " + j1 + " and " + j2);
	};

	this.isHexacodeElement = function(score) {
		for (var i=0; i<6; i++)
			this.verifyf4(score[i], "isHexacodeElement: Illegal element " + score[i] + " in score at position " + i);

		/* Check definition 3 in SPLAG, Chapter 10. */

		var slope = this.f4Add(score[0], score[1]);
		//console.log("slope is " + slope);

		if (this.f4Add(score[2], score[3]) != slope)
			return false;
		//console.log("second block okay");

		if (this.f4Add(score[4], score[5]) != slope)
			return false;
		//console.log("third block okay");

		if (this.f4Add(this.f4Add(score[0], score[2]), score[4]) != this.f4Multiply(slope, this.omega))
			return false;
		//console.log("0,2,4 okay");

		return true;
	};

	this.solve3Problem = function(score, outScore) {
		/* fill positions to be solved with -1 */
		var filled = 0;
		for (var i=0; i<6; i++) {
			if (score[i] != -1) {
				this.verifyf4(score[i], "solve3Problem: Illegal element " + score[i] + " in score at position " + i);
				filled++;
			}
			outScore[i] = score[i];
		}

		if (filled != 3)
			console.error("solve3Problem called with wrong number of filled elements " + score[0] + " "
					+ score[1] + " "
					+ score[2] + " "
					+ score[3] + " "
					+ score[4] + " "
					+ score[5]
					);

		/* First, determine the slope. */
		var slope;

		/* Check if any blocks with both elements filled */
		if (score[0] != -1 && score[1] != -1)
			slope = this.f4Add(score[0], score[1]);
		else if (score[2] != -1 && score[3] != -1)
			slope = this.f4Add(score[2], score[3]);
		else if (score[4] != -1 && score[5] != -1)
			slope = this.f4Add(score[4], score[5]);
		else { /* We have one element of each block filled */
			var totalParity = 0, totalFilledScore = 0;
			for (var i=0; i<6; i++)
				if (score[i] != -1) {
					totalParity += i;
					totalFilledScore = this.f4Add(totalFilledScore, score[i]);
				}

			if (totalParity % 2 == 0)
				slope = this.f4Multiply(totalFilledScore, this.omegabar);
			else slope = this.f4Multiply(totalFilledScore, this.omega);
		}

		/* Now we have the slope.
		 * If one element of a block is filled, then fill in the other one using the slope.
		 * Otherwise, use the triple sum to fill in using the slope * omega or slope * omegabar.
		 */
		for(var b = 0; b<3; b++) {
			if (score[2*b] != -1 && score[2*b+1] != -1) /* block already filled */
				continue;
			else if (score[2*b] != -1 && score[2*b + 1] == -1)
				outScore[2*b + 1] = this.f4Add(score[2*b], slope);
			else if (score[2*b + 1] != -1 && score[2*b] == -1)
				outScore[2*b] = this.f4Add(score[2*b + 1], slope);
			else { /* block completely empty */
				var u2, u3, u4, u5;
				u2 = score[(2*b + 2) % 6];
				u3 = score[(2*b + 3) % 6];
				u4 = score[(2*b + 4) % 6];
				u5 = score[(2*b + 5) % 6];

				if (u2 != -1 && u4 != -1) {
					outScore[2*b] = this.f4Add(this.f4Multiply(slope, this.omega), this.f4Add(u2, u4));
					outScore[2*b + 1] = this.f4Add(this.f4Multiply(slope, this.omegabar), this.f4Add(u2, u4));
				}
				else if (u2 != -1 && u5 != -1) {
					outScore[2*b] = this.f4Add(this.f4Multiply(slope, this.omegabar), this.f4Add(u2, u5));
					outScore[2*b + 1] = this.f4Add(this.f4Multiply(slope, this.omega), this.f4Add(u2, u5));
				}
				else if (u3 != -1 && u5 != -1) {
					outScore[2*b] = this.f4Add(this.f4Multiply(slope, this.omega), this.f4Add(u3, u5));
					outScore[2*b + 1] = this.f4Add(this.f4Multiply(slope, this.omegabar), this.f4Add(u3, u5));
				}
				else if (u3 != -1 && u4 != -1) {
					outScore[2*b] = this.f4Add(this.f4Multiply(slope, this.omegabar), this.f4Add(u3, u4));
					outScore[2*b + 1] = this.f4Add(this.f4Multiply(slope, this.omega), this.f4Add(u3, u4));
				}
				else console.error("solve3Problem: Algorithm failed trying to fill block " + b + " in " + score[0] + " "
						+ score[1] + " "
						+ score[2] + " "
						+ score[3] + " "
						+ score[4] + " "
						+ score[5]);
			}
		}

		/* Verify answer.*/
		if (!this.isHexacodeElement(outScore))
			console.error("solve3Problem: Algorithm failed, returning wrong answer " + outScore[0] + " "
						+ outScore[1] + " "
						+ outScore[2] + " "
						+ outScore[3] + " "
						+ outScore[4] + " "
						+ outScore[5] + " on " + score[0] + " "
						+ score[1] + " "
						+ score[2] + " "
						+ score[3] + " "
						+ score[4] + " "
						+ score[5]);
	};

	this.solve5Problem = function(score, outScore) {
		var filled = 0, missing = -1, missingMate = -1, changed = -1;
		var tempScore = new Array(6);
		for (var i=0; i<6; i++) {
			if (score[i] != -1) {
				this.verifyf4(score[i], "solve5Problem: Illegal element " + score[i] + " in score at position " + i);
				filled++;
			}
			else {
				missing = i;
				if (missing % 2 == 0)
					missingMate = missing + 1;
				else missingMate = missing - 1;
			}
			tempScore[i] = score[i];
		}

		if (filled != 5 || missing == -1)
			console.error("solve5Problem called with wrong number of filled elements " + score[0] + " "
					+ score[1] + " "
					+ score[2] + " "
					+ score[3] + " "
					+ score[4] + " "
					+ score[5]
					);

		/* Check "consistency": if the sum of the two filled blocks is 0, then those are correct. */
		var filledSum = 0;
		for (var i=0; i<6; i++)
			if (Math.floor(i/2) != Math.floor(missing/2))
				filledSum = this.f4Add(filledSum, score[i]);
		if (filledSum == 0) {
			/* clear the other element of the missing block, plus one other to produce a 3 problem, then call the
			 * 3-problem solver.
			 */

			tempScore[missingMate] = -1;
			tempScore[(missing + 2) % 6] = -1;

			this.solve3Problem(tempScore, outScore);
			if (outScore[(missing + 2) % 6] != score[(missing + 2) % 6])
				console.error("solve5Problem: consistency check passed, but inconsistent result returned from solve3Problem in " + score[0] + " "
					+ score[1] + " "
					+ score[2] + " "
					+ score[3] + " "
					+ score[4] + " "
					+ score[5]
					);

			if (outScore[missingMate] != score[missingMate])
				changed = missingMate;
		} else { /* Try all the other positions besides the missingMate */
			tempScore[missingMate] = -1;

			for (var i = (((Math.floor(missing/2)) + 1) * 2) % 6; Math.floor(i/2) != Math.floor(missing/2); i = (i+1) % 6) {
				tempScore[i] = -1;
				this.solve3Problem(tempScore, outScore);
				if (outScore[missingMate] == score[missingMate]) { /* if they agree, we found the solution! */
					changed = i;
					break;
				}
				tempScore[i] = score[i];
			}
			if (changed == -1) /* did not find a solution */
				console.error("solve5Problem: consistency check failed, all other tries also inconsistent in " + score[0] + " "
						+ score[1] + " "
						+ score[2] + " "
						+ score[3] + " "
						+ score[4] + " "
						+ score[5]
						);

		}
		return changed;
	};
}
