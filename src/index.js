import Map from 'ol/Map';
import View from 'ol/View';
import {Tile as TileLayer, Image } from 'ol/layer.js';
import {OSM, ImageCanvas} from 'ol/source';
import { fromLonLat, transformExtent } from 'ol/proj';
import {defaults as defaultControls, OverviewMap } from 'ol/control';
import {defaults as defaultInteractions} from 'ol/interaction';
import { getSize, getCenter } from 'ol/extent';

require('ol/ol.css');
require('./ol-custom-overviewmap.css');


const baseLayer = new TileLayer({ 
    source: new OSM()
});

const overviewMapControl = new OverviewMap({
    className: 'ol-overviewmap ol-custom-overviewmap',
    layers: [ baseLayer ],
    collapseLabel: '\u00BB',
    label: '\u00AB',
    collapsed: false
});

// Initialize Map Instance
const map = new Map({
    target: 'map',
    layers: [ baseLayer ],
    controls: defaultControls().extend([
        overviewMapControl,
    ]),
    interactions: defaultInteractions({
        constrainResolution: true,  
        zoomDuration: 250,
    }),
    view: new View({
        center: fromLonLat([79.0806, 22.1498]),
        zoom: 13,
        minZoom: 2,
        maxZoom: 20,
    }),
});


// HTML element of overview map box
const overviewMapBox = overviewMapControl
                        .getOverviewMap()
                        .getViewport()
                        .getElementsByClassName('ol-overviewmap-box')[0];
// console.log(overviewMapBox.getAttribute());

var colors = [
    'rgba( 255,   0,   0, 0.3 )',
    'rgba( 255, 255,   0, 0.3 )',
    'rgba(   0, 255,   0, 0.3 )',
    'rgba(   0, 255, 255, 0.3 )',
    'rgba(   0,   0, 255, 0.3)',
    'rgba( 255,   0, 255, 0.3)'
];

// Concatenate to repeat colors
colors = colors.concat(colors);
colors = colors.concat(colors);
colors = colors.concat(colors);

// Function to change background color and border of overview map box
function changeColor(currentZoomLevel) {
    overviewMapBox.style.backgroundColor = colors[currentZoomLevel];
    // overviewMapBox.style.border = colors[currentZoomLevel];
}

let currentZoomLevel = map.getView().getZoom();

// Call the function to set color for initial render
changeColor(currentZoomLevel);

// Call changeColor() on change of zoom level
map.on('moveend', () => {
    if (currentZoomLevel !== map.getView().getZoom()) {
        currentZoomLevel = map.getView().getZoom();
        changeColor(currentZoomLevel);
    }
});


// Create an observer instance linked to the callback function
var observer = new MutationObserver( mutationList => {
    mutationList.forEach( mutation => {
        let mainMapExtent = map.getView().calculateExtent(map.getSize());
        canvasFunction(mainMapExtent)
    });    
});

// Select the node that will be observed for mutations
const targetNode = overviewMapControl
                        .getOverviewMap()
                        .getViewport()
                        .getElementsByClassName('ol-overlay-container ol-selectable')[0];

// Start observing the target node for configured mutations
observer.observe(targetNode, { attributes : true, attributeOldValue: true, attributeFilter : ['style'] });

// To stop observing
// observer.disconnect();


const canvasFunction = function (mainMapExtent,world) {
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    context.strokeStyle = colors[currentZoomLevel];
    context.fillStyle = colors[currentZoomLevel];
    canvas.style = overviewMapBox.getAttribute('style');
    var extent = transformExtent(mainMapExtent, 'EPSG:3857', 'EPSG:4326');
    var size = getSize(extent);
    var center = getCenter(extent);
    context.fillRect(center[0],center[1],size[0],size[1]); 
    context.save();
    return canvas;
}

const canvasLayer = new Image({
    source: new ImageCanvas({
    canvasFunction: canvasFunction,
    projection: 'EPSG:3857',
    })
});

overviewMapControl.getOverviewMap().addLayer(canvasLayer);


