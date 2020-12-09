function platTownship(patents){
  var mapMatrix = patentConverter.getElasticMatrix(patents);
  var map = document.getElementById("map");
  map.setAttribute("width", mapMatrix[0].length * scale);
  map.setAttribute("height", mapMatrix.length * scale);
  var mapBorder = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
  mapBorder.setAttribute("width", mapMatrix[0].length * scale);
  mapBorder.setAttribute("height", mapMatrix.length * scale);
  mapBorder.classList.add("mapBorder");
  map.appendChild(mapBorder);

  drawPlatBorders(map, mapMatrix);
  colorPlats(map, mapMatrix, patents);
  labelPlats(map, mapMatrix, patents);
  //saveSVG(map, "patent_map.svg");
}

function labelPlats(map, mapMatrix, patents){
  var plats = getUniquePlats(mapMatrix);

  plats.forEach(function(plat){
    var width = getPlatWidth(plat.x, plat.y, mapMatrix, 1);
    var height = getPlatHeight(plat.x, plat.y, mapMatrix, 1);
    var sq = mapMatrix[plat.y][plat.x];
    var name = patents.find(function(pat){
      return pat._id == sq.patentID;
    }).Names.split(",")[0];

    if(width >= height){
      //Write label horizontally
      var label = document.createElementNS("http://www.w3.org/2000/svg", 'text');
      label.setAttribute("x", (plat.x * scale) + 2);
      label.setAttribute("y", (plat.y * scale) + (height * scale / 2));
      label.setAttribute("textLength", (width * scale) - 4);
      label.setAttribute("lengthAdjust", "spacingAndGlyphs");
      label.setAttribute("font-size", scale / 2);
      label.innerHTML = name;
      map.appendChild(label);
    }
    else {
      //Write vertically
      var label = document.createElementNS("http://www.w3.org/2000/svg", 'text');
      label.setAttribute("x", (plat.x * scale) + (scale / 2));
      label.setAttribute("y", (plat.y * scale) + 4);
      label.style["writing-mode"] = "tb";
      label.setAttribute("textLength", (height * scale) - 4);
      label.setAttribute("lengthAdjust", "spacingAndGlyphs");
      label.setAttribute("font-size", scale / 1.5);
      label.innerHTML = name;
      map.appendChild(label);
    }
  });


}

function getPlatWidth(sqX, sqY, mapMatrix, width){
  var sq = mapMatrix[sqY] ? mapMatrix[sqY][sqX] : null;
  var nextSq = mapMatrix[sqY] ? mapMatrix[sqY][sqX + 1] : null;
  if(nextSq != null && nextSq != undefined && nextSq.platID == sq.platID){
    width++;
    return getPlatWidth(sqX + 1, sqY, mapMatrix, width);
  }
  else {
    return width;
  }
}

function getPlatHeight(sqX, sqY, mapMatrix, height){
  var sq = mapMatrix[sqY] ? mapMatrix[sqY][sqX] : null;
  var nextSq = mapMatrix[sqY + 1] ? mapMatrix[sqY + 1][sqX] : null;
  if(nextSq != null && nextSq != undefined && nextSq.platID == sq.platID){
    height++;
    return getPlatHeight(sqX, sqY + 1, mapMatrix, height);
  }
  else {
    return height;
  }
}

function colorPlats(map, mapMatrix, patents){
  var names = getUniquePatentNames(patents);
  var colors = [];

  for (var i = 0; i < names.length; i++) {
    var color = selectColor(i, names.length);
    colors.push(color);
  }

  for(var y=0;y < mapMatrix.length;y++){
    for(var x=0; x < mapMatrix[y].length; x++){

      var patID = mapMatrix[y][x].patentID;
      if(patID != null){
        var patent = getPatByID(patID, patents);
      var color = colors[names.indexOf(patent.Names)];

      var rec = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
      rec.setAttribute("x", x * scale);
      rec.setAttribute("y", y * scale);
      rec.setAttribute("width", scale);
      rec.setAttribute("height", scale);
      rec.classList.add("platColor");
      rec.setAttribute("fill", color);
      map.appendChild(rec);
      }


    }
  }


}

function selectColor(colorNum, colors) {
  if (colors < 1) colors = 1; // defaults to one color - avoid divide by zero
  return "hsla(" + (colorNum * (360 / colors)) % 360 + ",70%,50%,0.5)";
}

function drawPlatBorders(map, mapMatrix){
    for(var y=0;y<mapMatrix.length;y++){
    for(var x=0;x<mapMatrix[y].length;x++){
      var sq = mapMatrix[y][x];

      if(sq.borders.n){
        var line = document.createElementNS("http://www.w3.org/2000/svg", 'line');
        line.setAttribute("x1", x * scale);
        line.setAttribute("y1", y * scale);
        line.setAttribute("x2", (x + 1) * scale);
        line.setAttribute("y2", y * scale);
        line.classList.add("platBorder");
        map.appendChild(line);
      }
      if(sq.borders.s){
        var line = document.createElementNS("http://www.w3.org/2000/svg", 'line');
        line.setAttribute("x1", x * scale);
        line.setAttribute("y1", (y + 1) * scale);
        line.setAttribute("x2", (x + 1) * scale);
        line.setAttribute("y2", (y + 1) * scale);
        line.classList.add("platBorder");
        map.appendChild(line);
      }
      if(sq.borders.w){
        var line = document.createElementNS("http://www.w3.org/2000/svg", 'line');
        line.setAttribute("x1", x * scale);
        line.setAttribute("y1", y * scale);
        line.setAttribute("x2", x * scale);
        line.setAttribute("y2", (y + 1) * scale);
        line.classList.add("platBorder");
        map.appendChild(line);
      }
      if(sq.borders.e){
        var line = document.createElementNS("http://www.w3.org/2000/svg", 'line');
        line.setAttribute("x1", (x + 1) * scale);
        line.setAttribute("y1", y * scale);
        line.setAttribute("x2", (x + 1) * scale);
        line.setAttribute("y2", (y + 1) * scale);
        line.classList.add("platBorder");
        map.appendChild(line);
      }


    }
  }
}

function getUniquePlats(map){
  var plats = [];
  var platObjs = [];

  for(var y=0;y < map.length; y++){
    for(var x=0; x < map[y].length; x++){
      var plat = map[y][x].platID;
      if(plat != null && plats.indexOf(plat) == -1){
        plats.push(plat);
        platObjs.push({
          platID: plat,
          x: x,
          y: y
        });
      }
    }
  }

  return platObjs;
}

function getUniquePatentNames(patents) {
  var names = patents.map(function(pt) {
    return pt["Names"];
  });

  var uniqueNames = [];

  names.forEach(function(name){
    if(uniqueNames.indexOf(name) == -1)
      uniqueNames.push(name);
  });
  return uniqueNames;
}

function getPatByID(id, patents){
  return patents.find(function(p){
    return p._id == id;
  });
}


function saveSVG(svgEl, name) {
    svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    var svgData = svgEl.outerHTML;
    var preface = '<?xml version="1.0" standalone="no"?>\r\n';
    var svgBlob = new Blob([preface, svgData], {type:"image/svg+xml;charset=utf-8"});
    var svgUrl = URL.createObjectURL(svgBlob);
    var downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = name;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}
