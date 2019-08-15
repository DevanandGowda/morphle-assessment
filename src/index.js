import Map from 'ol/Map';
import View from 'ol/View';
import {Tile as TileLayer, Image } from 'ol/layer.js';
import {OSM, ImageCanvas} from 'ol/source';
import { fromLonLat } from 'ol/proj';
import {defaults as defaultControls, OverviewMap } from 'ol/control';
import {defaults as defaultInteractions} from 'ol/interaction';

require('ol/ol.css');
require('./ol-custom-overviewmap.css');


let canvas = document.createElement('canvas');
let context = canvas.getContext('2d');

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


const overviewMapOverlayContainer = overviewMapControl
                                        .getOverviewMap()
                                        .getViewport()
                                        .getElementsByClassName('ol-overlay-container ol-selectable')[0];


var colors = [
    'rgba( 255,   0,   0, 0.05 )',
    'rgba( 255, 255,   0, 0.05)',
    'rgba(   0, 255,   0, 0.05)',
    'rgba(   0, 255, 255, 0.05)',
    'rgba(   0,   0, 255, 0.05)',
    'rgba( 255,   0, 255, 0.05)'
];

// Concatenate to repeat colors
colors = colors.concat(colors);
colors = colors.concat(colors);
colors = colors.concat(colors);


// Function to change background color and border of overview map box
function changeColor(currentZoomLevel) {
    overviewMapBox.style.backgroundColor = colors[currentZoomLevel];
    // overviewMapBox.style.border = colors[currentZoomLevel];
    canvas = document.createElement('canvas');
    context = canvas.getContext('2d');
    context.strokeStyle = colors[currentZoomLevel];
    context.fillStyle = colors[currentZoomLevel];
}

let currentZoomLevel = map.getView().getZoom();

const canvasFunction = function (x,y,width,height) {
    context.globalCompositeOperation = "xor";
    context.fillRect(300.0-x,150.0-y,width,height); 
    return canvas;
}


// Call the function to set color for initial render
window.addEventListener('load',() => {
    changeColor(currentZoomLevel);
    
    // Create an observer instance linked to the callback function
    var observer = new MutationObserver( mutationList => {
        mutationList.forEach( mutation => {
            let x=parseFloat(overviewMapOverlayContainer.style.left);
            let y=parseFloat(overviewMapOverlayContainer.style.bottom);
            let width = parseFloat(overviewMapBox.style.width);
            let height = parseFloat(overviewMapBox.style.height);
            canvasFunction(x,y,width,height);
            
        });    
    });

    // Select the node that will be observed for mutations
    const targetNode = overviewMapControl
                            .getOverviewMap()
                            .getViewport()
                            .getElementsByClassName('ol-overlay-container ol-selectable')[0];

    // Start observing the target node for configured mutations
    observer.observe(targetNode, { attributes : true, attributeOldValue: true, attributeFilter : ['style'] });
});


// Call changeColor() on change of zoom level
map.on('moveend', () => {
    if (currentZoomLevel !== map.getView().getZoom()) {
        currentZoomLevel = map.getView().getZoom();
        changeColor(currentZoomLevel);        
    }
});

const canvasLayer = new Image({
    source: new ImageCanvas({
    canvasFunction: canvasFunction,
    projection: 'EPSG:3857',
    })
});

overviewMapControl.getOverviewMap().addLayer(canvasLayer);
