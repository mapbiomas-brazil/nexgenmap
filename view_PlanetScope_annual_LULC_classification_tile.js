//------------------------------------------------------------------
// PlanetScope Annual Classification Accuracy
//------------------------------------------------------------------

var gridNames = [
//	    ['SB-21-Y-C', 'rf-2_SF3'], //Apui
	    ['SA-23-Y-C', 'rf-2_SF3'], //Paragominas
//	    ['SH-21-Z-B', 'rf-2_SF3'], //São Gabriel
//	    ['SC-21-Z-C', 'rf-3_SF'],  //Sinop 
//	    ['SD-23-Y-C', 'rf-3_SF3'], //Brasília 
//	    ['SF-23-Y-C', 'rf-2_SF3'], //São Paulo
//	    ['SF-23-X-B', 'rf-2_SF3'], //Rio Doce
//	    ['SH-22-Y-D', 'rf-2_SF3'], //Pelotas 
//	    ['SF-23-Z-B', 'rf-3_SF'],  //Rio de Janeio 
//	    ['SD-22-Z-C', 'rf-2_SF3'], //Rio Vermelho
//	    ['SB-24-Z-D', 'rf-2_SF3'], //Caatinga 2
//	    ['SC-24-V-D', 'rf-2_SF3'], //Caatinga 1 
//	    ['SE-21-Z-A', 'rf-2_SF3'], //Pantanal 
];


var dirAsset = 'projects/nexgenmap/SAMPLES/production-artigoRF';
var assetClassif = 'projects/nexgenmap/CLASSIFICATION/production-RF';
var assetMosaics = 'projects/nexgenmap/MOSAIC/production-1';
var subGridsAsset = 'projects/nexgenmap/ANCILLARY/nextgenmap_subgrids';
var subGridsFc = ee.FeatureCollection(subGridsAsset);
var assetCollec3_BR = 'projects/mapbiomas-workspace/public/collection4/mapbiomas_collection40_integration_v1';

var classesIn = [
    3, 4, 5,
    9, 11, 12, 
    15, 18, 
    24, 29, 26, 33
];

//legenda saida
var classesOut = [
    3, 4, 5,
    9, 11, 12, 
    15, 18, 
    24, 29, 26, 26
];

var classes2 =    [3,        4,         5,          9,                 11,         12,           15,        18,             24,       26,      29     ];
var classNames = ['Forest', 'Savanna', 'Mangrove', 'Planted Forest',  'Wetlands', 'Grassland',  'Pasture', 'Agriculture',  'Urban',  'Water', 'Rocks' ];

// Create Symbol palets
var palettes = require('users/mapbiomas/modules:Palettes.js');

// PlanetScope Annual Mosaic Symbology
var visParams = {
	bands: ["R_median", "G_median", "B_median"],
	min: 500,
	max: 1500
};

// LULC Map Symbology
var visClassif = {
	min: 0,
	max: 34,
	palette: palettes.get('classification2'),
	format: 'png'
};

// Funcition for each gridNames
gridNames.forEach(
	function (gridName) {
		var grids = subGridsFc.filterMetadata("grid", "equals", gridName[0]).union();

		var FCcolPt = ee.FeatureCollection(dirAsset + '/' + gridName[0] + '-samples_acuracy_balanced')
		var FCcolPtVali = FCcolPt.filterMetadata('type', 'equals', 'validation')

		var subcollection = ee.ImageCollection(assetMosaics)
			.filterMetadata("grid_name", "equals", gridName[0])
			.filterMetadata("cadence", "equals", 'monthly')
			.filterDate('2017-08-01', '2018-07-31');


		var spectralBandsmedian = ['R_median', 'G_median', 'B_median', 'N_median'];

		var median = subcollection.reduce(ee.Reducer.median()).select(spectralBandsmedian).int16();

		Map.addLayer(median, visParams, 'mosaic_' + gridName[0], false);

		// MapBiomas Brazil
		var mapbiomas = ee.Image(assetCollec3_BR).select('classification_2017').clip(grids)
		mapbiomas = mapbiomas.remap(classesIn, classesOut)
		Map.addLayer(mapbiomas, visClassif, 'MapBiomas '+ gridName[0], false);

		// Annual
		var Annual2 = ee.Image(assetClassif + '/' + gridName[0] + '_annual_' + gridName[1]);
		Annual2 = Annual2.remap(classesIn, classesOut)
		Map.addLayer(Annual2, visClassif, 'Anual Temporal '+ gridName[0], false);

    // Calculate Accuracy
		var sampled_pointsan = Annual2.sampleRegions({
			collection: FCcolPtVali,
			properties: ['class'],
			scale: 4
		});

		var errorMatrix_abs = sampled_pointsan.errorMatrix('class', 'remapped', classes2);
		print(errorMatrix_abs.accuracy().format('%.3f'))
	}
);
