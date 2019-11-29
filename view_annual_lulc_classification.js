//------------------------------------------------------------------
// Script classificacao artigo RF
//------------------------------------------------------------------
var type = 'monthly';

var gridNames = [
	//    ['SA-23-Y-C', 'rf-2'], //Paragominas
	//    ['SB-21-Y-C', 'rf-2'], //Apui
	//    ['SC-21-Z-C', 'rf-2'], //Sinop
	//    ['SD-22-Z-C', 'rf-3'], //Rio Vermelho-Cerrado2
	//    ['SD-23-Y-C', 'rf-3'], //Brasília - Cerrado 1
	//    ['SE-21-Z-A', 'rf-3'], //Pantanal
	//    ['SF-23-X-B', 'rf-2'], //Rio Doce
	//    ['SF-23-Y-C', 'rf-2'], //São Paulo
	//    ['SF-23-Z-B', 'rf-2'], //Rio de Janeio
	//    ['SH-21-Z-B', 'rf-2'], //São Gabriel
	//    ['SH-22-Y-D', 'rf-3'], //Pelotas
	//    ['SC-24-V-D', 'rf-3'], //Caatinga 1
	//    ['SB-24-Z-D', 'rf-3'], //Caatinga 2
	//    ['SG-20-V-B', 'rf-3'], //Chaco 1
	//    ['SB-24-Z-D'  'rf-2'], //Chaco 2
];

var sampleType = 'validation';

var dirAsset = 'projects/nexgenmap/SAMPLES/production-artigoRF';
var assetClassif = 'projects/nexgenmap/CLASSIFICATION/production-RF';
var assetMosaics = 'projects/nexgenmap/MOSAIC/production-1';
var subGridsAsset = 'projects/nexgenmap/ANCILLARY/nextgenmap_subgrids';
var mosaicsAsset = 'projects/nexgenmap/MOSAIC/production-1';
var gridsAsset = 'projects/nexgenmap/ANCILLARY/nextgenmap_grids';
var subGridsFc = ee.FeatureCollection(subGridsAsset);
var assetCollec3_BR = 'projects/mapbiomas-workspace/public/collection4/mapbiomas_collection40_integration_v1';
var assetCollec3_CH = 'projects/mapbiomas-chaco/public/collection1/mapbiomas_chaco_collection1_integration_v1';


var classesIn = [
	3, 4, 5,
	9, 11, 12, 13,
	15, 18, 19, 20, 21,
	23, 24, 29, 30, 26, 33
];

//legenda saida
var classesOut = [
	3, 3, 3,
	9, 15, 15, 15,
	15, 18, 18, 18, 21,
	15, 24, 24, 24, 26, 26
];

var options = {
	'classes': [3, 9, 15, 18, 24, 26],
	'classNames': ['forest', 'Plantations', 'Pasture', 'Agriculture', 'Urban', 'Water']
};

// Create Symbol palets
var palettes = require('users/mapbiomas/modules:Palettes.js');

var collectionMosaics = ee.ImageCollection(assetMosaics)

var collectionClassif = ee.ImageCollection(assetClassif)
	.map(
		function (image) {
			return image
				.set('system:time_start', image.id().slice(10, 20))
				.set('system:time_end', image.id().slice(21, 31));
		}
	);

var visParams = {
	bands: ["R_median", "G_median", "B_median"],
	min: 500,
	max: 1500
};

var visClassif = {
	min: 0,
	max: 34,
	palette: palettes.get('classification2'),
	format: 'png'
};

var period = ['2017-08-01', '2018-07-31', 'annual'] // anual
var featureSpace = ['R', 'G', 'B', 'N', 'soil', 'ndvi', 'ndwi', 'entropyg', 'entropyn'];

var ndvi = function (image) {
	var ndvi = image.expression('float(nir - red)/(nir + red)', {
		'nir': image.select(['N']),
		'red': image.select(['R'])
	});
	ndvi = ndvi.add(1)
		.multiply(100)
		.int16()
		.rename(['ndvi']);
	return image.addBands(ndvi);
};

var ndwi = function (image) {
	var ndwi = image.expression(
		'float(green - nir) / float(green + nir)', {
		'green': image.select(['G']),
		'nir': image.select(['N'])
	});
	ndwi = ndwi.add(1)
		.multiply(100)
		.int16()
		.rename(['ndwi']);
	return image.addBands(ndwi);
};


var soil = function (image) {
	var soil = image.expression(
		'float(red - blue) / float(red + blue)', {
		'blue': image.select(['B']),
		'red': image.select(['R'])
	});
	soil = soil.add(1)
		.multiply(100)
		.int16()
		.rename(['soil']);
	return image.addBands(soil);
};

var normg = function (image) {
	var normg = image.expression(
		'(green) / (nir + green + red)', {
		'nir': image.select(['N']),
		'red': image.select(['R']),
		'green': image.select(['G'])
	});
	normg = normg.multiply(100)
		.int16()
		.rename(['normG']);
	return image.addBands(normg);
};

/**
 * Texture bands
 */
var entropyn = function (image) {
	var square = ee.Kernel.square({
		radius: 5
	});
	// Compute entropy N.
	var entropyn = image.select(['N'])
		.uint16()
		.entropy(square)
		.rename(['entropyn'])
		.multiply(100)

	return image.addBands(entropyn.int16());
};

var entropyg = function (image) {
	var square = ee.Kernel.square({
		radius: 5
	});
	// Compute entropy G.
	var entropyg = image.select(['G'])
		.uint16()
		.entropy(square)
		.rename(['entropyg'])
		.multiply(100);

	return image.addBands(entropyg.int16());
};

var accList = ee.List([]);

gridNames.forEach(
	function (gridName) {

		var grids = subGridsFc.filterMetadata("grid", "equals", gridName[0]).union();

		var FCcolPt = ee.FeatureCollection(dirAsset + '/' + gridName[0] + '-samples_acuracy_balanced')
		var FCcolPtVali = FCcolPt.filterMetadata('type', 'equals', 'validation')

		var subcollection = ee.ImageCollection(assetMosaics)
			.filterMetadata("grid_name", "equals", gridName[0])
			.filterMetadata("cadence", "equals", type)
			.filterDate(period[0], period[1]);

		subcollection = subcollection
			.map(ndvi)
			.map(ndwi)
			.map(soil)
			.map(entropyn)
			.map(entropyg)

		var ndviPercThresh = subcollection.select('ndvi')
			.reduce(ee.Reducer.percentile([25]));

		var spectralBandsmedian = ['R_median', 'G_median', 'B_median', 'N_median', 'ndvi_median', 'ndwi_median', 'soil_median', 'entropyn_median', 'entropyg_median'];

		var median = subcollection.reduce(ee.Reducer.median()).select(spectralBandsmedian).int16();
		var ndvi_amp = subcollection.select('ndvi').reduce(ee.Reducer.max()).subtract(subcollection.select('ndvi').reduce(ee.Reducer.min())).rename(['ndvi_ampl'])
		var ndwi_amp = subcollection.select('ndwi').reduce(ee.Reducer.max()).subtract(subcollection.select('ndwi').reduce(ee.Reducer.min())).rename(['ndwi_ampl'])
		var soil_amp = subcollection.select('soil').reduce(ee.Reducer.max()).subtract(subcollection.select('soil').reduce(ee.Reducer.min())).rename(['soil_ampl'])
		var ndvi_std = subcollection.select('ndvi').reduce(ee.Reducer.stdDev()).rename(['ndvi_std']).multiply(100).int16()
		var ndwi_std = subcollection.select('ndwi').reduce(ee.Reducer.stdDev()).rename(['ndwi_std']).multiply(100).int16()
		var soil_std = subcollection.select('soil').reduce(ee.Reducer.stdDev()).rename(['soil_std']).multiply(100).int16()
		
		var featureSpaceImage = median
			.addBands(ndvi_amp)
			.addBands(ndwi_amp)
			.addBands(soil_amp)
			.addBands(ndvi_std)
			.addBands(ndwi_std)
			.addBands(soil_std);

		Map.addLayer(featureSpaceImage, visParams, 'mosaic_' + period[2], false);

		// MapBiomas Brazil
		var mapbiomas = ee.Image(assetCollec3_BR).select('classification_2017').clip(grids)

		// MapBiomas Chaco
		//  var mapbiomas = ee.Image(assetCollec3_CH).select('classification_2017').clip(grids)
		mapbiomas = mapbiomas.remap(classesIn, classesOut)

		Map.addLayer(mapbiomas, visClassif, 'MapBiomas', false);

		// Annual
		var Annual2 = ee.Image(assetClassif + '/' + gridName[0] + '_annual_' + gridName[1]);
		Annual2 = Annual2.remap(classesIn, classesOut)

		var sampled_pointsan = Annual2.sampleRegions({
			collection: FCcolPtVali,
			properties: ['class'],
			scale: 3
		});

		var errorMatrix_abs = sampled_pointsan.errorMatrix('class', 'remapped', options.classes);
		
		print('Global Accuracy', errorMatrix_abs.accuracy())
	
		Map.addLayer(Annual2, visClassif, 'Anual Temporal', false);

		var errorMatrix_abs_list = errorMatrix_abs.array().toList();

		var tableLists_rel = options.classes.map(
			function (classValue) {

				var index = ee.List(options.classes).indexOf(classValue);
				var className = ee.List(options.classNames).get(index);


				var matrixNumberList_rel = ee.List(errorMatrix_abs_list.get(index)).map(
					function (number) {
						var corresp = ee.Number(number);
						var corresp_rel = corresp
						return corresp_rel
					});

				var classList = matrixNumberList_rel.iterate(
					function (matrixNumber, classList) {
						return ee.List(classList).add(matrixNumber);
					},
					ee.List([className])
				);

				return classList;
			});


		var header = ee.List(options.classNames).iterate(
			function (name, header) {
				return ee.List(header).add(ee.String(name));
			},
			ee.List([ee.String('classes')])
		);

		var finalList = ee.List(tableLists_rel).insert(0, header);

		print('processing Annual table...')

		finalList.evaluate(
			function (finalList) {
				var chart_rel = ui.Chart(finalList).setChartType('Table').setOptions({
					backgroundColor: '#000000'
				});

				print(chart_rel);
			}
		);
	}
);