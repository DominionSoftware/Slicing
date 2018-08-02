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
let xIPP = [];
let yIPP = [];
let zIPP = [];
let zCurrentIndex = undefined;
let yCurrentIndex = undefined;
let xCurrentIndex = undefined;
fetch(url).then(function(response) {
    response.text().then(function(text) {
        let imageData = JSON.parse(text);
        debugger;

        let data = vtkImageData.newInstance();

        data.setDimensions([imageData.dims[0], imageData.dims[1], imageData.dims[2]]);
        data.setSpacing([imageData.spacing[0], imageData.spacing[1], imageData.spacing[2]]);
       // let ipp = imageData.imagePositionPatient;
        let ipp = [0,0,0];
        xIPP.push(ipp[0]);
        for(let x = 1; x < imageData.dims[0]; x++){
            xIPP.push(xIPP[x-1]+imageData.spacing[0]);
        }
        yIPP.push(ipp[1]);
        for(let y = 1; y < imageData.dims[1]; y++){
            yIPP.push(yIPP[y-1]+imageData.spacing[0]);
        }
        zIPP.push(ipp[2]);
        for(let z = 1; z < imageData.dims[1]; z++){
            zIPP.push(zIPP[z-1]+imageData.spacing[0]);
        }
        zCurrentIndex = zIPP.length/2 | 0;
        yCurrentIndex = yIPP.length/2 |0;
        xCurrentIndex = xIPP.length/2 |0;

        debugger;
        let pixelArray = new Int16Array(imageData.dims[0] * imageData.dims[1] * imageData.dims[2]);
        let  pixelIndex = 0;
        for(let x = 0; x < imageData.dims[0];x++) {
            for (let y = 0; y < imageData.dims[1]; y++) {
                for (let z = 0; z < imageData.dims[2]; z++) {
                    pixelArray[pixelIndex++] = imageData.image[x][y][z];
                }
            }
        }

        let scalarArray = vtkDataArray.newInstance({
            name: "Pixels",
            numberOfComponents: 1,
            values: pixelArray,
        });

        data.getPointData().setScalars(scalarArray);

        const fullScreenRenderWindow = vtkFullScreenRenderWindow.newInstance({
            background: [0, 0, 0],
        });

        let initialValues = {
            initialZIndex : zCurrentIndex,
            initialYIndex : yCurrentIndex,
            initialXIndex : xCurrentIndex,
            zPositions : zIPP,
            yPositions: yIPP,
            xPositions: xIPP,
            zSpacing: imageData.spacing[2],
            ySpacing: imageData.spacing[1],
            xSpacing: imageData.spacing[0]
        }
        const interactorStyle = ohifInteractorStyleSlice.newOHIFInstance(extend, 'ohifInteractorStyleSlice',initialValues);
        interactorStyle.setInteractionMode('IMAGE_SLICE');
        const renderWindow = fullScreenRenderWindow.getRenderWindow();

        const renderer = fullScreenRenderWindow.getRenderer();

        fullScreenRenderWindow.addController(controlPanel);

        const imageActor = vtkImageSlice.newInstance();


        renderer.addActor(imageActor);

        function updateColorLevel(e) {
            const colorLevel = Number(
                (e ? e.target : document.querySelector('.colorLevel')).value
            );
            imageActor.getProperty().setColorLevel(colorLevel);

            renderWindow.render();
        }

        function updateColorWindow(e) {
            const colorLevel = Number(
                (e ? e.target : document.querySelector('.colorWindow')).value
            );
            imageActor.getProperty().setColorWindow(colorLevel);

            renderWindow.render();
        }



        const dataRange = data
            .getPointData()
            .getScalars()
            .getRange();
        const extent = data.getExtent();
        debugger;
        const imageMapper = vtkImageMapper.newInstance();
        imageMapper.setInputData(data);
        imageActor.setMapper(imageMapper);


        renderer.resetCamera();
        renderer.resetCameraClippingRange();
        renderWindow.getInteractor().setInteractorStyle(interactorStyle);
        renderWindow.render();

        ['.slice'].forEach((selector, idx) => {
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


        document.querySelector('.slice').addEventListener('input', (e) => {
            imageActor.getMapper().setKSlice(Number(e.target.value));
            renderWindow.render();
        });



        document
            .querySelector('.colorLevel')
            .addEventListener('input', updateColorLevel);
        document
            .querySelector('.colorWindow')
            .addEventListener('input', updateColorWindow);
    });
});
