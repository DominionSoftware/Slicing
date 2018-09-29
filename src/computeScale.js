import vtkCoordinate from "vtk.js/Sources/Rendering/Core/Coordinate";
import vtkImageMapper from "vtk.js/Sources/Rendering/Core/ImageMapper";


function _computeDiagonal(hMin,hMax,vMin,vMax,dMin,dMax,renderer,imageMode){
    let valueA = [];
    let valueB = [];
    let valueAW = [];
    let valueBW = [];
    if (!imageMode){
        let coord = vtkCoordinate.newInstance();
        coord.setValue([hMin,vMin,dMin]);
        valueA = coord.getComputedViewportValue(renderer);
        coord.setValue([hMax,vMax,dMax]);
        valueB = coord.getComputedViewportValue(renderer);
        // let ls = publicAPI.getLineSource();
        // ls.setPoint1(hMin,vMin,dMin);
        // ls.setPoint2(hMax,vMax,dMax);
        valueA.push(0);
        valueB.push(0);

    }
    else {
        valueA = [hMin,vMin,dMin];
        valueB = [hMax,vMax,dMax];
    }

    let hSquared = (valueB[0] - valueA[0]) * (valueB[0] - valueA[0]);
    let vSquared = (valueB[1] - valueA[1]) * (valueB[1] - valueA[1]);
    let dSquared = (valueB[2] - valueA[2]) * (valueB[2] - valueA[2]);
    let diag = Math.sqrt(hSquared + vSquared + dSquared );
    return diag;
}


function computeDiagonalForSlice(sliceMode,spacing,renderer,bounds,imageMode){
    let diag;
    let xMin = bounds[0];
    let xMax =  bounds[1];
    let yMin = bounds[2];
    let yMax =  bounds[3];
    let zMin = bounds[4];
    let zMax = bounds[5];
    if (imageMode){
        xMin *= spacing[0];
        yMin *= spacing[1];
        zMin *= spacing[2];
        xMax *= spacing[0];
        yMax *= spacing[1];
        zMax *= spacing[2];
    }
    switch (sliceMode){
        case vtkImageMapper.SlicingMode.Z:
            diag = _computeDiagonal(xMin,xMax,yMin,yMax,0,0,renderer,imageMode);
            break;
        case vtkImageMapper.SlicingMode.Y:
            diag = _computeDiagonal(xMin,xMax,0,0,zMin,zMax,renderer,imageMode);
            break;
        case vtkImageMapper.SlicingMode.X:
            diag = _computeDiagonal(0,0,yMin,yMax,zMin,zMax,renderer,imageMode);
            break;
    }
    return diag;
}

function computeDiagonal(spacing,sliceMode,renderer,bounds){
    return computeDiagonalForSlice(sliceMode,spacing,renderer,bounds,false);
}

function computeImageDiagonal(scanDirection,spacing,sliceMode,renderer,bounds){

    return computeDiagonalForSlice(sliceMode,spacing,renderer,bounds,true);
}
