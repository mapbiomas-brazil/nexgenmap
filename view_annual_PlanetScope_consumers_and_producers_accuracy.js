//------------------------------------------------------------------
// View PlanetScope LULC Consumers's and producer's accuracy
//------------------------------------------------------------------


var gridNames = [
	    'SB-21-Y-C', //Apui
	    'SA-23-Y-C', //Paragominas
	    'SH-21-Z-B', //São Gabriel
	    'SC-21-Z-C', //Sinop 
	    'SD-23-Y-C', //Brasília 
	    'SF-23-Y-C', //São Paulo
	    'SF-23-X-B', //Rio Doce
	    'SH-22-Y-D', //Pelotas 
	    'SF-23-Z-B', //Rio de Janeio 
	    'SD-22-Z-C', //Rio Vermelho
	    'SB-24-Z-D', //Caatinga 2
	    'SC-24-V-D', //Caatinga 1 
	    'SE-21-Z-A', //Pantanal 
];

var sampleType = 'validation';

var dirAsset = 'projects/nexgenmap/SAMPLES/production-artigoRF';
var assetClassif = 'projects/nexgenmap/CLASSIFICATION/production_RF3';
var subGridsAsset = 'projects/nexgenmap/ANCILLARY/nextgenmap_subgrids';
var mosaicsAsset = 'projects/nexgenmap/MOSAIC/production-1';
var gridsAsset = 'projects/nexgenmap/ANCILLARY/nextgenmap_grids';
var subGridsFc = ee.FeatureCollection(subGridsAsset);
var assetCollec3_BR = 'projects/mapbiomas-workspace/public/collection4/mapbiomas_collection40_integration_v1';

var classesIn = [
    2, 3, 4, 5,
    9, 10, 11, 12, 13,
    15, 18, 19, 20, 21, 22,
    23, 24, 29, 30, 26, 33
];

//legenda saida
var classesOut = [
    3, 3, 4, 5,
    9, 12, 11, 12, 13,
    15, 18, 18, 18, 15, 22,
    23, 24, 29, 30, 26, 26
];


var classes2 =    [3,        4,         5,          9,                 11,         12,           15,        18,             24,       26,      29      ];
print('0=Forest', '1=Savanna', '2=Mangrove', '3=Planted Forest',  '4=Wetlands', '5=Grassland',  '6=Pasture', '7=Crop',  '8=Urban',  '9=Water', '10=Rocks');


// Create Symbol palets
var palettes = require('users/mapbiomas/modules:Palettes.js');


var visClassif = {
    min: 0,
    max: 34,
    palette: palettes.get('classification2'),
    format: 'png'
};

var accList = ee.List([]);

var FCcolPtVali = ee.FeatureCollection([])

gridNames.forEach(
  function (gridName) {
    var FCcolPt = ee.FeatureCollection(dirAsset+'/'+gridName+'-samples_acuracy_balanced')
    FCcolPtVali = FCcolPtVali.merge(FCcolPt.filterMetadata('type', 'equals', 'validation'))

   }
);

var grids = ee.FeatureCollection(gridsAsset)
var Annual2 = ee.ImageCollection(assetClassif).mosaic().clip(grids)

  Annual2 = Annual2.remap(classesIn,classesOut)
  var sampled_pointsan = Annual2.sampleRegions({
        collection: FCcolPtVali,
        properties: ['class'],
        scale: 4
      });
  var errorMatrix_abs = sampled_pointsan.errorMatrix('class', 'remapped', classes2);

  print('Consumers',errorMatrix_abs.consumersAccuracy())
  print('Producers',errorMatrix_abs.producersAccuracy())

