//------------------------------------------------------------------
// View PlanetScope mosaci and availability
//------------------------------------------------------------------

var gridNames = [
//    'SA-23-Y-C', //Paragominas
//    'SB-21-Y-C', //Apui
//    'SC-21-Z-C', //Sinop
//    'SD-22-Z-C', //Cerrado 2
    'SD-23-Y-C', //Cerrado 1
//    'SE-21-Z-A', //Pantanal
//    'SF-23-X-B', //Rio Doce
//    'SF-23-Y-C', //São Paulo
//    'SF-23-Z-B', //Rio de Janeio
//    'SH-21-Z-B', //São Gabriel
//    'SH-22-Y-D' //Pelotas
//    'SC-24-V-D' //Caatinga 1
//    'SB-24-Z-D' //Caatinga 2
//    'SG-20-V-B' //Chaco 1 - com ERRO
//    'SB-24-Z-D' //Caatinga 2
]

var months = [
//    '2017-08-01',
//    '2017-09-01',
//    '2017-10-01',
//    '2017-11-01',
//    '2017-12-01',
//    '2018-01-01',
//    '2018-02-01',
//    '2018-03-01',
//    '2018-04-01',
    '2018-05-01',
//    '2018-06-01',
//    '2018-07-01',
//    '2018-08-01'
];

var subGridsAsset = 'projects/nexgenmap/ANCILLARY/nextgenmap_subgrids';
var mosaicsAsset = 'projects/nexgenmap/MOSAIC/production-1';
var gridsAsset = 'projects/nexgenmap/ANCILLARY/nextgenmap_grids';

var subGridsFc = ee.FeatureCollection(subGridsAsset);

var subgrids = [0, 1, 2, 3, 4, 5];

//type: ‘weekly’, ‘biweekly’, ‘monthly’)
var type = 'monthly';

// Create Symbol palets
var visParams = {
    bands: ["R", "G", "B"],
    min: 500,
    max: 1500
};
var ramp_color = 'f22912, f6a323, F5F61D, 6af412, 11cc0a, 0d720a'
    
//-----------------------------------------------------------------------------
// User defined functions
//-----------------------------------------------------------------------------
gridNames.forEach(
  function (gridName) {

    var grids = subGridsFc.filterMetadata("grid", "equals", gridName).union();
    print(grids)

    months.forEach(
        function (period) {
            var collection = ee.ImageCollection(mosaicsAsset)
                .filterMetadata("grid_name", "equals", gridName)
                .filterMetadata("cadence", "equals", type)
                .filterDate(period);
    
      var subcollection = collection
      var mosaic = subcollection.mosaic()

      Map.addLayer(mosaic, visParams, 'mosaic_'+ gridName + '_' + period, false);

      var vis_avail = {'bands':['AVAILABILITY'], 'min':0, 'max':30, 'palette':ramp_color};
      Map.addLayer(mosaic, vis_avail, 'Availability_' + gridName + '_' + period, true);

      }
    );
  }
);

