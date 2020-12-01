# patent-platter-SVG
Interprets and maps aliquots of land patents in the Public Land Survey System by generating SVG graphics.

This is an in-progress complete rewrite of the Patent Platter seen here (https://github.com/brsloan/patent-platter). While this is nothing like the complete application that is the original version, the core of it is all here, and it is much better written. Previously it mixed logic and display and used HTML divs to generate the maps, but this seperates logic (patent-converter.js, which intereprets land patent aliquots and returns a matrix representing the mapped land patents) and display (svg-map-generator.js, which takes that matrix and generates the SVG graphic of the map) entirely.

For more information on the background and purpose of this, please see the readme of the patent-platter repo referenced above (https://github.com/brsloan/patent-platter/blob/main/README.md) and the blog entry (https://www.wildcathistory.net/2019/02/generated-maps-of-original-land-owners.html) linked in its readme.
