import macro from 'vtk.js/Sources/macro';
import vtkInteractorStyleTrackballCamera from 'vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera';
import { States } from 'vtk.js/Sources/Rendering/Core/InteractorStyle/Constants';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import Constants from "vtk.js/Sources/Rendering/Core/ImageMapper/Constants";

function ohifInteractorStyleSlice(publicAPI, model,initialValues) {
    debugger;
    // Set our className
    model.classHierarchy.push('ohifInteractorStyleSlice');
    model.currentZIndex = initialValues.initialZIndex;
    model.currentYIndex = initialValues.initialYIndex;
    model.currentXIndex = initialValues.initialXIndex;

    model.xPositions = initialValues.xPositions;
    model.yPositions = initialValues.yPositions;
    model.zPositions = initialValues.zPositions;
    model.zSpacing = initialValues.zSpacing;
    model.ySpacing = initialValues.ySpacing;
    model.xSpacing = initialValues.xSpacing;
    // Public API methods
    publicAPI.superHandleMouseMove = publicAPI.handleMouseMove;
    publicAPI.handleMouseMove = (callData) => {
        const pos = callData.position;
        const renderer = callData.pokedRenderer;

        switch (model.state) {
            case States.IS_WINDOW_LEVEL:
                publicAPI.windowLevel(renderer, pos);
                publicAPI.invokeInteractionEvent({ type: 'InteractionEvent' });
                break;
            default:
                break;
        }
        publicAPI.superHandleMouseMove(callData);
    };

    //----------------------------------------------------------------------------
    publicAPI.superHandleLeftButtonPress = publicAPI.handleLeftButtonPress;
    publicAPI.handleLeftButtonPress = (callData) => {
        const pos = callData.position;

        if (!callData.shiftKey && !callData.controlKey) {
            model.windowLevelStartPosition[0] = pos.x;
            model.windowLevelStartPosition[1] = pos.y;
            // Get the last (the topmost) image
            publicAPI.setCurrentImageNumber(model.currentImageNumber);
            const property = model.currentImageProperty;
            if (property) {
                model.windowLevelInitial[0] = property.getColorWindow();
                model.windowLevelInitial[1] = property.getColorLevel();
            }
            publicAPI.startWindowLevel();
        } else if (model.interactionMode === 'IMAGE_SLICING') {
            model.lastSlicePosition = pos.y;
            publicAPI.startSlice();
        } else {
            // The rest of the button + key combinations remain the same
            publicAPI.superHandleLeftButtonPress(callData);
        }
    };

    //--------------------------------------------------------------------------
    publicAPI.superHandleLeftButtonRelease = publicAPI.handleLeftButtonRelease;
    publicAPI.handleLeftButtonRelease = () => {
        switch (model.state) {
            case States.IS_WINDOW_LEVEL:
                publicAPI.endWindowLevel();
                break;
            case States.IS_SLICE:
                publicAPI.endSlice();
                break;

            default:
                publicAPI.superHandleLeftButtonRelease();
                break;
        }
    };

    //--------------------------------------------------------------------------
    publicAPI.handleStartMouseWheel = (callData) => {
        publicAPI.startSlice();
        publicAPI.handleMouseWheel(callData);
    };

    //--------------------------------------------------------------------------
    publicAPI.handleEndMouseWheel = () => {
        publicAPI.endSlice();
    };

    //--------------------------------------------------------------------------
    publicAPI.handleMouseWheel = (callData) => {
        let slice = publicAPI.findSlice();
        let increment = 0;
        if (callData.spinY < 0){
            increment = 1;
        }
        else
        {
            increment = -1;
        }
        if (slice) {
            let currentZPosition = model.currentZPosition;
            let newZPos = currentZPosition + (model.zSpacing * increment);

           slice.getMapper().setSlicingMode(Constants.SlicingMode.Z)
            let id = slice.getMapper().getSliceAtPosition(newZPos);
           if (id != undefined) {
               model.currentZPosition = newZPos;
               slice.getMapper().setKSlice(id);
           }

        }
    };

    //----------------------------------------------------------------------------
    publicAPI.windowLevel = (renderer, position) => {
        model.windowLevelCurrentPosition[0] = position.x;
        model.windowLevelCurrentPosition[1] = position.y;
        const rwi = model.interactor;

        if (model.currentImageProperty) {
            const size = rwi.getView().getViewportSize(renderer);

            const mWindow = model.windowLevelInitial[0];
            const level = model.windowLevelInitial[1];

            // Compute normalized delta
            let dx =
                (model.windowLevelCurrentPosition[0] -
                    model.windowLevelStartPosition[0]) *
                4.0 /
                size[0];
            let dy =
                (model.windowLevelStartPosition[1] -
                    model.windowLevelCurrentPosition[1]) *
                4.0 /
                size[1];

            // Scale by current values
            if (Math.abs(mWindow) > 0.01) {
                dx *= mWindow;
            } else {
                dx *= mWindow < 0 ? -0.01 : 0.01;
            }
            if (Math.abs(level) > 0.01) {
                dy *= level;
            } else {
                dy *= level < 0 ? -0.01 : 0.01;
            }

            // Abs so that direction does not flip
            if (mWindow < 0.0) {
                dx *= -1;
            }
            if (level < 0.0) {
                dy *= -1;
            }

            // Compute new mWindow level
            let newWindow = dx + mWindow;
            const newLevel = level - dy;

            if (newWindow < 0.01) {
                newWindow = 0.01;
            }

            model.currentImageProperty.setColorWindow(newWindow);
            model.currentImageProperty.setColorLevel(newLevel);
        }
    };



    //----------------------------------------------------------------------------
    // This is a way of dealing with images as if they were layers.
    // It looks through the renderer's list of props and sets the
    // interactor ivars from the Nth image that it finds.  You can
    // also use negative numbers, i.e. -1 will return the last image,
    // -2 will return the second-to-last image, etc.
    publicAPI.setCurrentImageNumber = (i) => {
        const renderer = model.interactor.getCurrentRenderer();
        if (!renderer) {
            return;
        }
        model.currentImageNumber = i;

        function propMatch(prop) {
            if (
                prop.isA('vtkImageSlice')
            ) {
                return true;
            }
            return false;
        }

        const props = renderer.getViewProps();

        let imageProp = null;
        let foundImageProp = false;
        for (let j = 0; j < props.length && !foundImageProp; j++) {
            if (propMatch(props[j])) {
                foundImageProp = true;
                imageProp = props[j];
                break;
            }
        }

        if (imageProp) {
            model.currentImageProperty = imageProp.getProperty();
        }
    };

    publicAPI.findSlice = ()=> {

        function propMatch(prop) {
            if (
                prop.isA('vtkImageSlice')
            ) {
                return true;
            }
            return false;
        }
        const renderer = model.interactor.getCurrentRenderer();
        if (!renderer) {
            return;
        }
        const props = renderer.getViewProps();

        let imageProp = null;
        let foundImageProp = false;
        for (let j = 0; j < props.length && !foundImageProp; j++) {
            if (propMatch(props[j])) {
                foundImageProp = true;
                imageProp = props[j];
                break;
            }
        }

        if (imageProp) {
            model.currentImageProperty = imageProp.getProperty();
        }
        return imageProp;
    };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
    windowLevelStartPosition: [0, 0],
    windowLevelCurrentPosition: [0, 0],
    lastSlicePosition: 0,
    windowLevelInitial: [1.0, 0.5],
    currentImageProperty: 0,
    currentImageNumber: -1,
    interactionMode: 'IMAGE_SLICE',
    xViewRightVector: [0, 1, 0],
    xViewUpVector: [0, 0, -1],
    yViewRightVector: [1, 0, 0],
    yViewUpVector: [0, 0, -1],
    zViewRightVector: [1, 0, 0],
    zViewUpVector: [0, 1, 0],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
    Object.assign(model, DEFAULT_VALUES, initialValues);

    // Inheritance
    vtkInteractorStyleTrackballCamera.extend(publicAPI, model, initialValues);

    // Create get-set macros
    macro.setGet(publicAPI, model, ['interactionMode']);

    // For more macro methods, see "Sources/macro.js"

    // Object specific methods
    ohifInteractorStyleSlice(publicAPI, model,initialValues);
}

// ----------------------------------------------------------------------------

export const newOHIFInstance = macro.newInstance(extend, 'ohifInteractorStyleSlice');

// ----------------------------------------------------------------------------

export default Object.assign({ newOHIFInstance, extend });
