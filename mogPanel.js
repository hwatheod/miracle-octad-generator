var colorList = ["ghostWhite", "red", "pink", "cyan", "lime", "yellow", "magenta", "lightSkyBlue", "gray", "orange"];

var mog = new MOG();

var label = new Array(6);
for (var i=0; i<6; i++)
    label[i] = new Array(4);

var outColor = new Array(6);
for (var i=0; i<6; i++)
    outColor[i] = new Array(4);

var inColor = new Array(6);
for (var i=0; i<6; i++)
    inColor[i] = new Array(4);

var underlyingMOGUpdated = false;

function setSquareColors(outColorArray, inColorArray) {
    for (var i=0; i<6; i++)
        for (var j=0; j<4; j++)
            outColor[i][j] = outColorArray[i][j];
    for (var i=0; i<6; i++)
        for (var j=0; j<4; j++)
            inColor[i][j] = inColorArray[i][j];
    repaintAll();
}

function setAllSquareColors(colorArray) {
    setSquareColors(colorArray, colorArray);
}

function clearAll() {
    underlyingMOGUpdated = true;

    resetLabelsAndColors();

    for (var i=0; i<6; i++)
        for (var j=0; j<4; j++)
            mog.setArrayElement(i,j,false);

    repaintAll();
}

function complement() {
    underlyingMOGUpdated = true;

    resetLabelsAndColors();

    for (var i=0; i<6; i++)
        for (var j=0; j<4; j++)
            mog.toggleArrayElement(i,j);

    repaintAll();
}

function clickSquare(i, j) {
    resetLabelsAndColors();
    repaintAll();
    toggleSquare(i, j);
    setButtonStatuses();
}

function toggleSquare(i, j) {
    underlyingMOGUpdated = true;
    mog.toggleArrayElement(i, j);
    repaintOne(i, j);
}

function setOutSquareColor(i, j, value) {
    outColor[i][j] = value;
    repaintOne(i, j);
}

function setInSquareColor(i, j, value) {
    inColor[i][j] = value;
    repaintOne(i, j);
}

function setSquareColor(i, j, value) {
    outColor[i][j] = value;
    inColor[i][j] = value;
    repaintOne(i, j);
}

function setButtonStatuses() {
    var orbitClass = mog.getOrbitClassification();

    $('#complete').prop('disabled', !(orbitClass == "S5"));
    $('#sextet').prop('disabled', !(orbitClass == "S4"));

    $('#block').prop('disabled', !(
        orbitClass == "S4" ||
        orbitClass == "U6" ||
        orbitClass == "U8" ||
        orbitClass == "U10" ||
        orbitClass == "T10" ||
        orbitClass == "S10" ||
        orbitClass == "S11" ||
        orbitClass == "S12" ||
        orbitClass == "S12+" ||
        orbitClass == "T12"
    ));
}

function repaintOne(i, j) {
    var outerColor;
    var outerSquare = $('#mog_' + i + '_' + j);
    if (outColor[i][j] != -1)
        outerColor = colorList[outColor[i][j]];
    else if (mog.getArrayElement(i,j))
        outerColor = colorList[1];
    else outerColor = colorList[0];
    outerSquare.css('background-color', outerColor);

    var innerColor;
    var innerSquare = $('#inner_' + i + '_' + j);
    if (inColor[i][j] != -1)
        innerColor = colorList[inColor[i][j]];
    else if (mog.getArrayElement(i,j))
        innerColor = colorList[1];
    else innerColor = colorList[0];
    innerSquare.css('background-color', innerColor);
    innerSquare.html(label[i][j]);

    if (underlyingMOGUpdated) {
        $('#orbitClass').html(mog.getOrbitClassification());
        underlyingMOGUpdated = false;
    }
}

function repaintAll() {
    for (var i=0; i<6; i++) {
        for (var j=0; j<4; j++) {
            repaintOne(i, j);
        }
    }
}

function resetLabelsAndColors() {
    for (var i=0; i<6; i++) {
        for (var j=0; j<4; j++) {
            label[i][j] = "";
            outColor[i][j] = -1;
            inColor[i][j] = -1;
        }
    }
}

function complete() {
    if (mog.getWeight() == 5) {
        var completionI, completionJ;

        completionI = new Array(3);
        completionJ = new Array(3);

        mog.getOctadCompletion(completionI, completionJ);

        for (var k=0; k<3; k++)
            setSquareColor(completionI[k], completionJ[k], 2);
    }

}

function sextet() {
    var sextet = mog.getSextet();
    setAllSquareColors(sextet);
}

function dualRep() {
    var len;
    var repI = new Array(4), repJ = new Array(4);

    len = mog.getDualRepresentative(repI, repJ);
    clearAll();

    for (var k=0; k<len; k++)
        toggleSquare(repI[k], repJ[k]);
    setButtonStatuses();
}

function orbit() {
    showOrbits(false);
}

function block() {
    showOrbits(true);
}

function showOrbits(withBlocks) {
    /* Labels each square with the orbit classification of the diagram that would result if that square were
     * added (if it is not currently marked) or removed (if it is currently marked).
     */

    underlyingMOGUpdated = true;
    var colorToUse, nextMarkedColor = 1, nextComplementColor = 4;
    var blockColorArray = null;

    var colorClass = new Array(7);

    for(var i=0; i<7; i++)
        colorClass[i] = "";

    if (withBlocks)
        blockColorArray = mog.getBlockDecomposition();

    for (var i=0; i<6; i++)
        for (var j=0; j<4; j++) {
            mog.toggleArrayElement(i,j);
            label[i][j] = mog.getOrbitClassification();
            mog.toggleArrayElement(i,j);
            if (mog.getArrayElement(i,j))
                label[i][j] = label[i][j] + "*";

            colorToUse = 0;
            for (var k=1; k<=6; k++)
                if (colorClass[k] == label[i][j]) {
                    colorToUse = k ;
                    break;
                }
            if (colorToUse == 0) {
                if (mog.getArrayElement(i,j)) {
                    colorToUse = nextMarkedColor;
                    colorClass[nextMarkedColor] = label[i][j];
                    while (colorClass[nextMarkedColor] != "") {
                        nextMarkedColor = (nextMarkedColor % 6) + 1;
                        if (nextMarkedColor == colorToUse)
                            console.error("showOrbits: ran out of colors, should not happen");
                    }
                }
                else {
                    colorToUse = nextComplementColor;
                    colorClass[nextComplementColor] = label[i][j];
                    while (colorClass[nextComplementColor] != "") {
                        nextComplementColor = (nextComplementColor % 6) + 1;
                        if (nextComplementColor == colorToUse)
                            console.error("showOrbits: ran out of colors, should not happen");
                    }
                }
            }
            outColor[i][j] = colorToUse;
            if (blockColorArray == null)
                inColor[i][j] = outColor[i][j];
            else inColor[i][j] = blockColorArray[i][j];
        }

    repaintAll();
}

$(document).ready(function() {
   resetLabelsAndColors();
   repaintAll();
   setButtonStatuses();
});