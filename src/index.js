import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';

import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';

import controlPanel from './controller.html';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import ohifInteractorStyleSlice from './ohifInteractorStyleSlice';
import {extend} from "./ohifInteractorStyleSlice";

let url = "http://localhost:8080/AP.json";
let scanDirection = 'A';
let viewDirection = 'A';

let xIPP = [];
let yIPP = [];
let zIPP = [];
let zCurrentIndex = undefined;
let yCurrentIndex = undefined;
let xCurrentIndex = undefined;
let created = false;
let imageActor = undefined;
let imageMapper =undefined;
let interactorStyle = undefined;

const fullScreenRenderWindow = vtkFullScreenRenderWindow.newInstance({
    background: [0, 0, 0],
});
fullScreenRenderWindow.addController(controlPanel);
const renderWindow = fullScreenRenderWindow.getRenderWindow();
const renderer = fullScreenRenderWindow.getRenderer();
document.getElementById("viewDropDown").onchange  = onViewChanged;
document.getElementById("imageDropDown").onchange = onImageChanged;

function onViewChanged(){
    let value = this.value;
    let mode = computeSlicingMode(scanDirection, value);
    imageMapper.setSlicingMode(mode);
    renderer.setActiveCamera(renderer.makeCamera());

    computeCamera(scanDirection, value, renderer.getActiveCamera());
    renderer.resetCamera();
    renderer.resetCameraClippingRange();
    renderWindow.getInteractor().setInteractorStyle(interactorStyle);
    renderWindow.render();
}

function onImageChanged(){
    let value = this.value;
    let promise = undefined;
    switch (value) {
        case 'A':
            url = "http://localhost:8080/AP.json";
            scanDirection = 'A';
            promise = fetch(url).then(function (response) {
                response.text().then(function (text) {
                    let imageData = JSON.parse(text);
                    loadImage(imageData);
                });
            });
            break;
        case 'I':
            url = "http://localhost:8080/IS.json";
            scanDirection = 'I';
            promise = fetch(url).then(function (response) {
                response.text().then(function (text) {
                    let imageData = JSON.parse(text);
                    loadImage(imageData);
                });
            });
            break;
        case 'L':
            url = "http://localhost:8080/LR.json";
            scanDirection = 'L';
            promise = fetch(url).then(function (response) {
                response.text().then(function (text) {
                    let imageData = JSON.parse(text);
                    loadImage(imageData);
                });
            });
            break;
    }
}

function loadImage(imageData){
    let data = vtkImageData.newInstance();

    data.setDimensions([imageData.dims[0], imageData.dims[1], imageData.dims[2]]);
    data.setSpacing([imageData.spacing[0], imageData.spacing[1], imageData.spacing[2]]);
    let ipp = imageData.imagePositionPatient;
 
    xIPP.push(ipp[0]);
    for(let x = 1; x < imageData.dims[0]; x++){
        xIPP.push(xIPP[x-1]+imageData.spacing[0]);
    }
    yIPP.push(ipp[1]);
    for(let y = 1; y < imageData.dims[1]; y++){
        yIPP.push(yIPP[y-1]+imageData.spacing[1]);
    }
    zIPP.push(ipp[2]);
    for(let z = 1; z < imageData.dims[2]; z++){
        zIPP.push(zIPP[z-1]+imageData.spacing[2]);
    }
    zCurrentIndex = zIPP.length/2 | 0;
    yCurrentIndex = yIPP.length/2 |0;
    xCurrentIndex = xIPP.length/2 |0;

    let count =    imageData.dims[0] * imageData.dims[1] * imageData.dims[2]
    let pixelArray = new Int16Array(count);

    for(let pixelIndex = 0; pixelIndex < count;pixelIndex++) {
        pixelArray[pixelIndex] = imageData.image[pixelIndex];
    }

    let scalarArray = vtkDataArray.newInstance({
        name: "Pixels",
        numberOfComponents: 1,
        values: pixelArray,
    });

    data.getPointData().setScalars(scalarArray);



    let initialValues = {
        currentZIndex : zCurrentIndex,
        currentYIndex : yCurrentIndex,
        currentXIndex : xCurrentIndex,
        zPositions : zIPP,
        yPositions: yIPP,
        xPositions: xIPP,
        zSpacing: imageData.spacing[2],
        ySpacing: imageData.spacing[1],
        xSpacing: imageData.spacing[0]
    }

    if (created === false) {
        created = true;
        imageActor = vtkImageSlice.newInstance();
        imageMapper = vtkImageMapper.newInstance();
        interactorStyle = ohifInteractorStyleSlice.newInstance(extend, 'ohifInteractorStyleSlice');
        renderer.addActor(imageActor);
    }
    interactorStyle.setDirectionalProperties(initialValues);

    interactorStyle.setInteractionMode('IMAGE_SLICE');

    const dataRange = data
        .getPointData()
        .getScalars()
        .getRange();
    const extent = data.getExtent();

    imageMapper.setInputData(data);
    imageActor.setMapper(imageMapper);
    let  mode = computeSlicingMode(scanDirection,viewDirection);
    imageMapper.setSlicingMode(mode);
    computeCamera(scanDirection,viewDirection, renderer.getActiveCamera());
    renderWindow.getInteractor().setInteractorStyle(interactorStyle);
    interactorStyle.moveSliceByWheel(0);
    renderer.resetCamera();
    renderer.resetCameraClippingRange();
    let e = document.getElementById("viewDropDown");
    e.value = 'A';
    var event = new Event('change');
    e.dispatchEvent(event);
    renderWindow.render();


}
function computeSlicingModeForAP(viewOrientation) {
    switch (viewOrientation) {
        case 'A':
        case 'P':
            return vtkImageMapper.SlicingMode.Y;
            break;
        case 'I':
        case 'S':
            return vtkImageMapper.SlicingMode.Z
            break;
        case 'L':
        case 'R':
            return vtkImageMapper.SlicingMode.X;
            break;
    }
}

function computeSlicingModeForIS(viewOrientation) {
    switch (viewOrientation) {
        case 'I':
        case 'S':
            return vtkImageMapper.SlicingMode.Z;
            break;
        case 'A':
        case 'P':
            return vtkImageMapper.SlicingMode.Y;
            break;
        case 'L':
        case 'R':
            return vtkImageMapper.SlicingMode.X;
            break;
    }
}

function computeSlicingModeForLR(viewOrientation) {
    switch (viewOrientation) {
        case 'L':
        case 'R':
            return vtkImageMapper.SlicingMode.X;
            break;
        case 'I':
        case 'S':
            return vtkImageMapper.SlicingMode.Z;
            break;
        case 'A':
        case 'P':
            return vtkImageMapper.SlicingMode.Y;
            break;
    }
}


function computeSlicingMode(imageOrientation, viewOrientation) {

    switch (imageOrientation) {
        case 'A':
        case 'P':
            return computeSlicingModeForAP(viewOrientation);
            break;
        case 'I':
        case 'S':
            return computeSlicingModeForIS(viewOrientation);
            break;
        case 'L':
        case 'R':
            return computeSlicingModeForLR(viewOrientation);
            break;
    }
}

function computeCameraForAP(viewOrientation, camera) {
    switch (viewOrientation) {
        case 'A':
        case 'P':
            camera.elevation(-90);
            console.log(camera);
            break;

        case 'I':
        case 'S':
            camera.azimuth(180);
            camera.roll(180);
            break;
        case 'L':
        case 'R':

            camera.azimuth(90);
            camera.roll(-90);
            break;
    }

}

function computeCameraForIS(viewOrientation, camera) {
    switch (viewOrientation) {
        case 'A':
        case 'P':
            camera.elevation(-90);
            break;

        case 'I':
        case 'S':
            camera.azimuth(180);
            camera.roll(180);
            break;
        case 'L':
        case 'R':

            camera.azimuth(90);
            camera.roll(-90);
            break;
    }

}

function computeCameraForLR(viewOrientation, camera) {
    switch (viewOrientation) {
        case 'A':
        case 'P':
            camera.elevation(-90);
            break;

        case 'I':
        case 'S':
            camera.azimuth(180);
            camera.roll(180);
            break;
        case 'L':
        case 'R':

            camera.azimuth(90);
            camera.roll(-90);
            break;
    }

}

function computeCamera(imageOrientation, viewOrientation, camera) {
    switch (imageOrientation) {
        case 'A':
        case 'P':
            return computeCameraForAP(viewOrientation, camera);
            break;
        case 'I':
        case 'S':
            return computeCameraForIS(viewOrientation, camera);
            break;
        case 'L':
        case 'R':
            return computeCameraForLR(viewOrientation, camera);
            break;
    }
    camera.setParallelProjection(true);

}



