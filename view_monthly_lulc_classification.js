//------------------------------------------------------------------
// GEE Script View Monthly Mosaic, Classification and Accuracy
//------------------------------------------------------------------

// specify gridName - options are listed and commented

var gridNames = [
    //    'SA-23-Y-C', //Paragominas
    //    'SB-21-Y-C', //Apui
    //    'SC-21-Z-C', //Sinop
    //    'SD-22-Z-C', //Rio Vermelho-Cerrado2
    //    'SD-23-Y-C', //Brasília - Cerrado 1
    //    'SE-21-Z-A', //Pantanal
    //    'SF-23-X-B', //Rio Doce
    'SF-23-Y-C', //São Paulo
    //    'SF-23-Z-B', //Rio de Janeio
    //    'SH-21-Z-B', //São Gabriel
    //    'SH-22-Y-D', //Pelotas
    //    'SC-24-V-D', //Caatinga 1
    //    'SB-24-Z-D', //Caatinga 2
    //    'SG-20-V-B', //Chaco
    //    'SF-20-Z-D', //Chaco2
]
// specify months - options are listed and commented
var months = [
    '2017-08-01',
    '2017-09-01',
    '2017-10-01',
    '2017-11-01',
    '2017-12-01',
    '2018-01-01',
    '2018-02-01',
    '2018-03-01',
    '2018-04-01',
    '2018-05-01',
    '2018-06-01',
    '2018-07-01',
    '2018-08-01'
];

// Define input data
var type = 'monthly';
var sampleType = 'validation';
var version = 'rf-3';
var dirAsset = 'projects/nexgenmap/SAMPLES/production-artigoRF';
var assetClassif = 'projects/nexgenmap/CLASSIFICATION/production-RF';
var assetClassif2 = 'projects/nexgenmap/CLASSIFICATION/production-RF2';
var subGridsAsset = 'projects/nexgenmap/ANCILLARY/nextgenmap_subgrids';
var mosaicsAsset = 'projects/nexgenmap/MOSAIC/production-1';
var assetCollec3_BR = 'projects/mapbiomas-workspace/public/collection4/mapbiomas_collection40_integration_v1';
var assetCollec3_CH = 'projects/mapbiomas-chaco/public/collection1/mapbiomas_chaco_collection1_integration_v1';

var subGridsFc = ee.FeatureCollection(subGridsAsset);

// class in
var classesIn = [
    2, 3, 4, 5,
    9, 10, 11, 12, 13,
    15, 18, 19, 20, 21,
    23, 24, 29, 30, 26, 33
];

// class out
var classesOut = [
    3, 3, 4, 5,
    9, 12, 11, 12, 13,
    15, 18, 18, 18, 21,
    23, 24, 29, 30, 26, 26
];

// classes and classnames
var classes = [3, 4, 5, 9, 11, 12, 15, 18, 22, 24, 26, 29];
var classNames = ['Forest', 'Savanna', 'Mangrove', 'Planted Forest', 'Wetlands', 'Grassland', 'Pasture', 'Agriculture', 'Beach', 'Urban', 'Water', 'Rocks'];


// Create Symbol palets
var palettes = require('users/mapbiomas/modules:Palettes.js');

var visMosaics = {
    bands: ["R", "G", "B"],
    min: 500,
    max: 1500
};

var visClassif = {
    min: 0,
    max: 34,
    palette: palettes.get('classification2'),
    format: 'png'
};

//
var collectionMosaics = ee.ImageCollection(mosaicsAsset)

var collectionClassif = ee.ImageCollection(assetClassif)
    .map(
        function (image) {
            return image
                .set('system:time_start', image.id().slice(10, 20))
                .set('system:time_end', image.id().slice(21, 31));
        }
    );

// create empty list
var accList = ee.List([]);

gridNames.forEach(
    function (gridName) {

        var grids = subGridsFc.filterMetadata("grid", "equals", gridName).union();
        var FCcolPt = ee.FeatureCollection(dirAsset + '/' + gridName + '-samples_acuracy_balanced')
        var FCcolPtVali = FCcolPt.filterMetadata('type', 'equals', 'validation')


        // MapBiomas Brazil
        var mapbiomas = ee.Image(assetCollec3_BR).select('classification_2017').clip(grids)

        // MapBiomas Chaco
        //  var mapbiomas = ee.Image(assetCollec3_CH).select('classification_2017').clip(grids)
        mapbiomas = mapbiomas.remap(classesIn, classesOut)

        var sampled_pointsmp = mapbiomas.sampleRegions({
            collection: FCcolPtVali,
            properties: ['class'],
            scale: 30
        });

        var errorMatrix_abs = sampled_pointsmp.errorMatrix('class', 'remapped', classes);
        
        print(gridName)

        Map.addLayer(mapbiomas, visClassif, 'MapBiomas ' + gridName, false);

        months.forEach(
            function (month) {
                var collection = ee.ImageCollection(mosaicsAsset)
                    .filterMetadata("grid_name", "equals", gridName)
                    .filterMetadata("cadence", "equals", type)
                    .filterDate(month);

                Map.addLayer(collection, visMosaics, 'mosaic_' + '_' + month + '_' + gridName, false);

                var classif = ee.Image(assetClassif2 + '/' + gridName + '_' + version + '_' + 'GAP').select('classification_' + month)
                Map.addLayer(classif, visClassif, 'Class LULC Planet ' + '_' + month + '_' + gridName, false);

                var sampled_points = classif.sampleRegions({
                    collection: FCcolPtVali,
                    properties: ['class'],
                    scale: 3
                });
                
                var errorMatrix_abs = sampled_points.errorMatrix('class', 'classification_' + month, classes);
                
                print(month, errorMatrix_abs.accuracy())

            }
        )
    }
);