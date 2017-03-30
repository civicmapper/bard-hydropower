  console.log("--------------------");
  console.log("Analysis initiated");

  /**
   * set up the geoprocessing services and tasks
   */
  var elevProfileService = L.esri.GP.service({
    url: "http://elevation.arcgis.com/arcgis/rest/services/Tools/ElevationSync/GPServer/Profile",
    //url: "https://elevation.arcgis.com/arcgis/rest/services/Tools/Elevation/GPServer/Profile"
    useCors: true
  });
  var elevProfile = elevProfileService.createTask();

  var watershedService = L.esri.GP.service({
    url: "http://elevation.arcgis.com/arcgis/rest/services/Tools/ElevationSync/GPServer/Profile",
    
    useCors: true
  });
  var watershed = watershedService.createTask();

  /**
   * Parse the drawn polyline
   */
  
  var coords = [];
  $(drawnLayer).each(function(i,v){
    coords.push([v.lon, v.lat]);
    });
  var linestring = new Terraformer.LineString(coords);
  var esriPolyline = Terraformer.ArcGIS.convert(linestring);
  
  var InputLineFeatures = {
    "displayFieldName": "",
    "geometryType": "esriGeometryPolyline",
    "spatialReference": {
      "wkid": 102100,
      "latestWkid": 3857
    },
    "fields": [{
        "name": "OID",
        "type": "esriFieldTypeOID",
        "alias": "OID"
      }, {
        "name": "Shape_Length",
        "type": "esriFieldTypeDouble",
        "alias": "Shape_Length"
      }
    ],
    "features": [],
    "exceededTransferLimit": false
  };

  /** Run GP Task (only once it has been initialized)
   **
   **/
  gpTask.on('initialized', function() {
    gpTask.setParam("InputLineFeatures", JSON.stringify(InputLineFeatures));
    gpTask.setParam("DEMResolution ", "FINEST");
    gpTask.setOutputParam("Result");
    console.log("Extraction initialized. Submitting Request...");
    $('#gpmessages').show();
    gpTask.run(function(error, response, raw) {
      $('#gpmessages').hide();
      if (error) {
        $('#gperror').show();
        console.log("There was an error processing your request. Please try again.");
        console.log(error);
      } else {
        $('#gpsuccess').show();
        console.log("Extraction complete!");
        window.location.assign(response.Result.url);
      }
    });
  });