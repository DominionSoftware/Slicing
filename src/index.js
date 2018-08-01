import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';

import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';

import controlPanel from './controller.html';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';

const fullScreenRenderWindow = vtkFullScreenRenderWindow.newInstance({
    background: [0, 0, 0],
});
const renderWindow = fullScreenRenderWindow.getRenderWindow();
const renderer = fullScreenRenderWindow.getRenderer();
fullScreenRenderWindow.addController(controlPanel);

const imageActorI = vtkImageSlice.newInstance();
const imageActorJ = vtkImageSlice.newInstance();
const imageActorK = vtkImageSlice.newInstance();

renderer.addActor(imageActorK);
renderer.addActor(imageActorJ);
renderer.addActor(imageActorI);

function updateColorLevel(e) {
    const colorLevel = Number(
        (e ? e.target : document.querySelector('.colorLevel')).value
    );
    imageActorI.getProperty().setColorLevel(colorLevel);
    imageActorJ.getProperty().setColorLevel(colorLevel);
    imageActorK.getProperty().setColorLevel(colorLevel);
    renderWindow.render();
}

function updateColorWindow(e) {
    const colorLevel = Number(
        (e ? e.target : document.querySelector('.colorWindow')).value
    );
    imageActorI.getProperty().setColorWindow(colorLevel);
    imageActorJ.getProperty().setColorWindow(colorLevel);
    imageActorK.getProperty().setColorWindow(colorLevel);
    renderWindow.render();
}

let data = vtkImageData.newInstance();
let xVoxels = 256;
let yVoxels = 256;
let zVoxels = 79;
data.setDimensions([xVoxels, yVoxels, zVoxels]);
let xSpacing = 1.25;
let ySpacing = 1.25;
let zSpacing = 3.0;
data.setSpacing([xSpacing, ySpacing, zSpacing]);

let pixelArray = new Int16Array(xVoxels * yVoxels * zVoxels);
let n = xVoxels * yVoxels * zVoxels;

for (let i = 0; i < n; i++) {
    pixelArray[i] = Math.random() * 1200;
}

let scalarArray = vtkDataArray.newInstance({
    name: "Pixels",
    numberOfComponents: 1,
    values: pixelArray,
});

data.getPointData().setScalars(scalarArray);

const dataRange = data
    .getPointData()
    .getScalars()
    .getRange();
const extent = data.getExtent();
debugger;
const imageMapperK = vtkImageMapper.newInstance();
imageMapperK.setInputData(data);
imageMapperK.setKSlice(30);
imageActorK.setMapper(imageMapperK);

const imageMapperJ = vtkImageMapper.newInstance();
imageMapperJ.setInputData(data);
imageMapperJ.setJSlice(30);
imageActorJ.setMapper(imageMapperJ);

const imageMapperI = vtkImageMapper.newInstance();
imageMapperI.setInputData(data);
imageMapperI.setISlice(30);
imageActorI.setMapper(imageMapperI);

renderer.resetCamera();
renderer.resetCameraClippingRange();
renderWindow.render();

['.sliceI', '.sliceJ', '.sliceK'].forEach((selector, idx) => {
    const el = document.querySelector(selector);
    el.setAttribute('min', extent[idx * 2 + 0]);
    el.setAttribute('max', extent[idx * 2 + 1]);
    el.setAttribute('value', 30);
});

['.colorLevel', '.colorWindow'].forEach((selector) => {
    document.querySelector(selector).setAttribute('max', dataRange[1]);
    document.querySelector(selector).setAttribute('value', dataRange[1]);
});
document
    .querySelector('.colorLevel')
    .setAttribute('value', (dataRange[0] + dataRange[1]) / 2);
updateColorLevel();
updateColorWindow();


document.querySelector('.sliceI').addEventListener('input', (e) => {
    imageActorI.getMapper().setISlice(Number(e.target.value));
    renderWindow.render();
});

document.querySelector('.sliceJ').addEventListener('input', (e) => {
    imageActorJ.getMapper().setJSlice(Number(e.target.value));
    renderWindow.render();
});

document.querySelector('.sliceK').addEventListener('input', (e) => {
    imageActorK.getMapper().setKSlice(Number(e.target.value));
    renderWindow.render();
});

document
    .querySelector('.colorLevel')
    .addEventListener('input', updateColorLevel);
document
    .querySelector('.colorWindow')
    .addEventListener('input', updateColorWindow);

global.fullScreen = fullScreenRenderWindow;
global.imageActorI = imageActorI;
global.imageActorJ = imageActorJ;
global.imageActorK = imageActorK;