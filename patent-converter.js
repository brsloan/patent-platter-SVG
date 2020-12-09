var patentConverter = {
  getElasticMatrix: function(patentsJSON){

  return mapPatents(getMapMatrix());

  function getTwpMeasAndRange(){
    var twpMeas = [];
    var rng = [];

    patentsJSON.forEach(function(pat){
      var twpRange = pat.Twp_Rng.split(" - ");
      var thisTwpMeas = twpRange[0].charAt(3) == "N" ? parseInt(twpRange[0].slice(0,3)) : (parseInt(twpRange[0].slice(0,3)) * -1);
      var thisRng = twpRange[1].charAt(3) == "E" ? parseInt(twpRange[1].slice(0,3)) : (parseInt(twpRange[1].slice(0,3)) * -1);
      twpMeas.push(thisTwpMeas);
      rng.push(thisRng);
    });

    var uniq = [...new Set(twpMeas)];
    twpMeas = uniq;
    twpMeas.sort(function(a, b){return b - a});
    uniq = [...new Set(rng)];
    rng = uniq;
    rng.sort(function(a, b){return a - b});

    return { twpMeas: twpMeas,
            rng: rng };

  }

  function getMapMatrix(){
    var mapMatrix = [];
    var twpMeasAndRange = getTwpMeasAndRange();
    var twpMeas = twpMeasAndRange.twpMeas;
    var rng = twpMeasAndRange.rng;

    var d1 = "N";
    var d3 = "N";
    var startingSec = 6;
    var tVal = twpMeas[0];

    for(r=0; r < getNumberOfContinuousValues(twpMeas) * 24; r++){
      var thisRow = getMapMatrixRow(d1, d3, startingSec, tVal, rng);
      mapMatrix.push(thisRow);
      d1 = flipCap(d1);
      if((r + 1) % 2 === 0)
        d3 = flipCap(d3);
      if((r + 1) % 4 === 0)
        startingSec = shiftStartingSec(startingSec);
      if((r + 1) % 24 === 0)
        tVal = shiftTwpVal(tVal);
    }

    return mapMatrix;
  }

  function getNumberOfContinuousValues(vals){
    //Possible Twp or Range vals +/- integers skipping zero
    //Though arrays here are sorted, they may not contain all continuous values, so find max/min and subtract instead of using array length
    var maxVal = vals.reduce(function(a, b) {
      return Math.max(a, b);
    });
    var minVal = vals.reduce(function(a, b) {
      return Math.min(a, b);
    });

    var diff = maxVal - minVal;
    var measure = diff;

    //If there is not a zero between the values, add 1 to difference to get total number of values including max/min
    if(!(0 > minVal && 0 < maxVal))
      measure = measure + 1;

    return measure;
  }

  function getMapMatrixRow(positionVert, quarterVert, startingSection, twpVal, rng){
    var thisRow = [];

    var d1 = positionVert;
    var d2 = "W";
    var d3 = quarterVert;
    var d4 = "W";
    var sec = startingSection;
    var tVal = twpVal;
    var rVal = rng[0];
    for(i=0; i < getNumberOfContinuousValues(rng) * 24; i++){
      var thisSq = getSquare(d1.concat(d2), d3.concat(d4), sec, convertIntsToTwpRng(tVal, rVal));
      thisRow.push(thisSq);
      d2 = flipCap(d2);
      if((i + 1) % 2 === 0)
        d4 = flipCap(d4);
      if((i + 1) % 4 === 0)
        sec = shiftSec(sec);
      if((i + 1) % 24 === 0)
        rVal = shiftRangeVal(rVal);
    }

    return thisRow;
  }

  function getSquare(position, quarter, section, thisTwpRange){
    return {
      position: position.toLowerCase(),
      quarter: quarter.toLowerCase(),
      section: section,
      township: thisTwpRange,
      patentID: null,
      platID: null,
      borders: {
        w: false,
        n: false,
        e: false,
        s: false
      },
      conflict: false
    };
  }

  function convertIntsToTwpRng(thisTwp, thisRng){
    var twpRng = "";
    var convertedTwp = "";
    var convertedRng = "";

    convertedTwp = Math.abs(thisTwp).toString() + (thisTwp > 0 ? "N" : "S");
    convertedRng = Math.abs(thisRng).toString() + (thisRng > 0 ? "E" : "W");
    convertedTwp = convertedTwp.padStart(4,0);
    convertedRng = convertedRng.padStart(4,0);

    twpRng = convertedTwp + " - " + convertedRng;

    return twpRng;
  }

  function flipCap(dir){

    var flipped;
    if(dir == "N")
      flipped = "S";
    else if (dir=="S")
      flipped = "N";
    else if(dir=="W")
      flipped = "E";
    else if(dir=="E")
      flipped = "W";
    return flipped;
  }

  function shiftSec(sec){
    //Sections are numbered in serpentine fashion in PLSS
    var secs = [[6,5,4,3,2,1],
                [7,8,9,10,11,12],
                [18,17,16,15,14,13],
                [19,20,21,22,23,24],
                [30,29,28,27,26,25],
                [31,32,33,34,35,36]];
    var currentRow;
    if(sec > 30)
      currentRow = secs[5];
    else if (sec > 24)
      currentRow = secs[4];
    else if (sec > 18)
      currentRow = secs[3];
    else if (sec > 12)
      currentRow = secs[2];
    else if (sec > 6)
      currentRow = secs[1];
    else
      currentRow = secs[0];

    var thisSecPosition = currentRow.indexOf(sec);
    var newSec;

    if(thisSecPosition == currentRow.length - 1)
      newSec = currentRow[0];
    else
      newSec = currentRow[thisSecPosition + 1];

    return newSec;
  }

  function shiftRangeVal(oldVal){
    //PLSS skips zero in numbering Townships and Ranges
    var newVal;
    if(oldVal == -1)
      newVal = 1;
    else
      newVal = oldVal + 1;

    return newVal;
  }

  function shiftStartingSec(sec){
    var startingSecs = [6,7,18,19,30,31];
    var thisSecPosition = startingSecs.indexOf(sec);
    var newSec;
    if(thisSecPosition == startingSecs.length - 1)
      newSec = startingSecs[0];
    else
      newSec = startingSecs[thisSecPosition + 1];
    return newSec;
  }

  function shiftTwpVal(oldVal){
    var newVal;
    if(oldVal == 1)
      newVal = -1;
    else
      newVal = oldVal - 1;
    return newVal;
  }

  function mapPatents(matrix){

    patentsJSON.forEach(function(pat){
      assignSquares(pat, matrix);
    });

    detectPlats(matrix, patentsJSON);
    trimMatrix(matrix);
    return matrix;

    function assignSquares(pat, matrix) {
      var secNum = pat["Sec"];
      var quot = pat["Aliquots"];
      var dirs = quot ? parseAliquot(quot) : null;

      //If quot empty, it is a full section.
      if (quot == null || quot == "") {
        matrix.forEach(function(row){
          row.forEach(function(sq){
            if(sq.township == pat.Twp_Rng && sq.section == secNum){
              if(sq.patentID != null)
                sq.conflict = true;
              sq.patentID = pat._id;
            }
          });
        });

        //If only one letter-group, either a quarter or 2 quarters (half)
      } else if (!dirs[1]) {
        matrix.forEach(function(row){
          row.forEach(function(sq){
            if(sq.township == pat.Twp_Rng && sq.section == secNum && sq.quarter.indexOf(dirs[0]) !== -1){
              if(sq.patentID != null)
                sq.conflict = true;
              sq.patentID = pat._id;
            }
          });
        });

        //Otherwise, we're dealing with fragments in squares
      } else {
        matrix.forEach(function(row){
          row.forEach(function(sq){
            if(sq.township == pat.Twp_Rng && sq.section == secNum && sq.quarter.indexOf(dirs[1]) !== -1 && sq.position.indexOf(dirs[0]) !== -1){
              if(sq.patentID != null)
                sq.conflict = true;
              sq.patentID = pat._id;
            }
          });
        });

      }
      return matrix;
    }

    function detectPlats(township, patents){
      var platID = 0;

      for(var y=0;y<township.length;y++){
        for(var x=0;x<township[y].length;x++){
          var thisSquare = township[y][x];

          //Only bother checking if it has a patent
          if(thisSquare.patentID != null){
            var thisPatent = getPatByID(thisSquare.patentID, patents);

              //Check left if possible and left square has a patent
            if(x > 0){
              var leftSquare = township[y][x - 1];
              var nextLeftSquare = x > 1 ? township[y][x - 2] : null;
              assignPlat(thisSquare, thisPatent, leftSquare, nextLeftSquare, patents, "w", platID);
            }

            //check up if possible
            if(y > 0){
              var topSquare = township[y - 1][x];
              var nextTopSquare = y > 1 ? township[y - 2][x] : null;
              assignPlat(thisSquare, thisPatent, topSquare, nextTopSquare, patents, "n", platID);
            }

            //check right if possible
            if(x < township[y].length - 1){
              var rightSquare = township[y][x + 1];
              var nextRightSquare = x < township[y].length - 2 ? township[y][x + 2] : null;
              assignPlat(thisSquare, thisPatent, rightSquare, nextRightSquare, patents, "e", platID);
            }

            //Check down if possible
            if(y < township.length - 1){
              var bottomSquare = township[y + 1][x];
              var nextBottomSquare = y < township.length - 2 ? township[y + 2][x] : null;
              assignPlat(thisSquare, thisPatent, bottomSquare, nextBottomSquare, patents, "s", platID);
            }

            //If no platID assigned yet, assign one
            if(thisSquare.platID == null){
              thisSquare.platID = platID;
            }


            //If new platID has been used, iterate to new one for next plat
            if(thisSquare.platID == platID)
              platID++;

          }
        }
      }

    }

    function assignPlat(thisSquare, thisPatent, nextSquare, nextNextSquare, patents, border, platID){
      var nextPatent = nextSquare.patentID ? getPatByID(nextSquare.patentID, patents) : null;
      if(nextPatent != null && thisPatent.Names == nextPatent.Names){
        if(nextSquare.platID != null){
          thisSquare.platID = nextSquare.platID;
        }
        else {
          //TOADD: Check the next one over, if IT matches, then get THAT platID.
          if(nextNextSquare != null){
            var nextNextPatent = nextNextSquare.patentID ? getPatByID(nextNextSquare.patentID, patents) : null;
            if(nextNextPatent != null && thisPatent.Names == nextNextPatent.Names){
              if(nextNextSquare.platID != null)
                thisSquare.platID = nextNextSquare.platID;
            }

          }
          if(thisSquare.platID == null)
            thisSquare.platID = platID;
          nextSquare.platID = thisSquare.platID;
        }
      }
      else
        thisSquare.borders[border] = true;
    }

    function getPatByID(id, patents){
      return patents.find(function(p){
        return p._id == id;
      });
    }

    function parseAliquot(quot) {
      //Assuming correct input, which is stupid
      //Get first cardinal direction (fraction unneeded - 2 letters = quarter, 1 = half)
      var dir1 = quot
      .slice(0, 2)
      .match(/[A-Z]/g)
      .join("")
      .toLowerCase();
      var dir2 =
          quot.length > 3
      ? quot
      .slice(2)
      .match(/[A-Z]/g)
      .join("")
      .toLowerCase()
      : null;

      //Check for unconventional "SE quarter of N half" construction (SE¼N½) and convert if used
      //First scenario N/S: SE of N is actually 'S of NE'; Second E/W: SE of W is actullay 'E of SW'
      if (dir2 && dir1.length > 1 && dir2.length == 1) {
        if (dir2.toUpperCase() == "N" || dir2.toUpperCase() == "S") {
          var newDir1 = dir1.slice(0, 1);
          var newDir2 = dir2 + dir1.slice(1);
          dir1 = newDir1;
          dir2 = newDir2;
        } else {
          var newDir1 = dir1.slice(1);
          var newDir2 = dir1.slice(0, 1) + dir2;
          dir1 = newDir1;
          dir2 = newDir2;
        }
      } else if (dir2 && dir2.length > 2) {
        //Deal with any extra info in second portion of aliquot
        //get ride of any "lot/trc 1" stuff
        var newDir2 = dir2
        .split("¼")[0]
        .split("½")[0]
        .match(/[n|s|w|e]/g)
        .join("");
        dir2 = newDir2;

        //Check for unconventional jackassery of the type "S½W½SW¼" instead of (SW SW)
        if (newDir2.length > 2) {
          var finalDir1 = dir1 + dir2.slice(0, 1);
          var finalDir2 = newDir2.slice(1);
          dir1 = finalDir2;
          dir2 = finalDir2;
        }
      }

      return [dir1, dir2];
    }
  }

  function trimMatrix(matrix){
    //trim top
    while(matrix[0].every(function(sq){
      return sq.patentID == null;
    })){
      matrix.shift();
    }
    //trim bottom
    while(matrix[matrix.length - 1].every(function(sq){
      return sq.patentID == null;
    })){
      matrix.pop();
    }
    //trim left side
    var firstColumnIsEmpty = true;
    while(firstColumnIsEmpty){
      for(i=0;i < matrix.length; i++){
          if (matrix[i][0].patentID != null)
            firstColumnIsEmpty = false;
      }
      if(firstColumnIsEmpty){
        for(r=0;r<matrix.length;r++){
          matrix[r].shift();
        }
      }
    }
    //trim right side
    var lastColumnIsEmpty = true;
    while(lastColumnIsEmpty){
      for(l=0;l < matrix.length; l++){
          if (matrix[l][matrix[l].length - 1].patentID != null)
            lastColumnIsEmpty = false;
      }
      if(lastColumnIsEmpty){
        for(m=0;m < matrix.length;m++){
          matrix[m].pop();
        }
      }
    }





  }

  }
};
