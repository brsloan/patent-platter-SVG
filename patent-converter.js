var patentConverter = {
  getTownshipMatrix: function(patentsJSON){
    var township = generateBlankTownship();
  
    patentsJSON.forEach(function(pat){
      assignSquares(pat, township);
    });
    
    detectPlats(township, patentsJSON);

    return township;
    
    function generateBlankTownship() {
      var township = [[],
                      [],
                      [],
                      [],
                      [],
                      []];
      for (var i = 6; i > 0; i--) {
        township[0].push(generateSection(i));
      }
      for (var i = 7; i < 13; i++) {
        township[1].push(generateSection(i));
      }
      for (var i = 18; i > 12; i--) {
        township[2].push(generateSection(i));
      }
      for (var i = 19; i < 25; i++) {
        township[3].push(generateSection(i));
      }
      for (var i = 30; i > 24; i--) {
        township[4].push(generateSection(i));
      }
      for (var i = 31; i < 37; i++) {
        township[5].push(generateSection(i));
      }

      var townshipSquares = [];

      for(var y=0;y < township.length; y++){
        var topRow = [];
        var secondRow = [];
        var thirdRow = [];
        var fourthRow = [];
        for(var x=0; x < township[y].length; x++){
          var squares = township[y][x].squares;
          for(var i=0; i<4; i++){
            topRow.push(squares[0][i]);
            secondRow.push(squares[1][i]);
            thirdRow.push(squares[2][i]);
            fourthRow.push(squares[3][i]);
          }

        }
        townshipSquares.push(topRow);
        townshipSquares.push(secondRow);
        townshipSquares.push(thirdRow);
        townshipSquares.push(fourthRow);
      }

      return townshipSquares;
    }

    function generateSection(secNum) {
      var eightCount = 0;
      var fourCount = 0;
      var twoCount = 0;
      var quot = ["n","w","n","w"];
      var squares = [];
      var squareMatrix = [];

      for(var i=0;i<16;i++){
        if(eightCount == 8){
          eightCount = 0;
          quot[2] = flip(quot[2]);
        }
        if(fourCount == 4){

          fourCount = 0;
          quot[0] = flip(quot[0]);
        }
        if(twoCount == 2){
          twoCount = 0;
          quot[3] = flip(quot[3]);
        }
        if(i > 0)
          quot[1] = flip(quot[1]);

        squares.push(getSquare(quot[0].concat(quot[1]), quot[2].concat(quot[3]), secNum));
        if(squares.length == 4){
          squareMatrix.push(squares);
          squares = [];
        }
        twoCount++;
        fourCount++;
        eightCount++;
      }

      return { number: secNum, squares: squareMatrix};
    }

    function flip(dir){
      var flipped;
      if(dir == "n")
        flipped = "s";
      else if (dir=="s")
        flipped = "n";
      else if(dir=="w")
        flipped = "e";
      else if(dir=="e")
        flipped = "w";

      return flipped;
    }

    function getSquare(position, quarter, section){
      return {
        position: position,
        quarter: quarter,
        section: section,
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

    function assignSquares(pat, township) {
      var secNum = pat["Sec"];
      var quot = pat["Aliquots"];
      var dirs = quot ? parseAliquot(quot) : null;

      //If quot empty, it is a full section.
      if (quot == null || quot == "") {
        township.forEach(function(row){
          row.forEach(function(sq){
            if(sq.section == secNum){
              if(sq.patentID != null)
                sq.conflict = true;
              sq.patentID = pat._id;
            }  
          });
        });

        //If only one letter-group, either a quarter or 2 quarters (half)
      } else if (!dirs[1]) {
        township.forEach(function(row){
          row.forEach(function(sq){
            if(sq.section == secNum && sq.quarter.indexOf(dirs[0]) !== -1){
              if(sq.patentID != null)
                sq.conflict = true;
              sq.patentID = pat._id;
            }
          });
        });

        //Otherwise, we're dealing with fragments in squares
      } else {
        township.forEach(function(row){
          row.forEach(function(sq){
            if(sq.section == secNum && sq.quarter.indexOf(dirs[1]) !== -1 && sq.position.indexOf(dirs[0]) !== -1){
              if(sq.patentID != null)
                sq.conflict = true;
              sq.patentID = pat._id;
            } 
          });
        });

      }

      return township;
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
};
