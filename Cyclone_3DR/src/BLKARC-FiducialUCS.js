/// <reference path="C:/Program Files/Leica Geosystems/Cyclone 3DR/Script/JsDoc/Reshaper.d.ts"/>

// Context: The goal of this script is to position the Fiducial marker and create the associated UCS.
// This script is meant to be used to position the QR Code needed for the BLK ARC.
// See more information on https://leica-geosystems.com/products/laser-scanners/autonomous-reality-capture/blk-arc
// ------------------------ HOW TO USE IT --------------------------------------------
// The required inputs to make the script work are:
//      - a single cloud if you want to use it to create your UCS (Method 2),
//      - a UCS in your document (Method 3)
//		- an .obj file corresponding to the Fiducial marker at the location of the script (all the methods)
//
// 1. Run the script without any selection.
// 2. Choose the method for the UCS creation for BLK ARC:
// a) The first method is to click 3 points in the scene.
// b) The second method is to use 3 planes extracted from a cloud.
// c) The third method is to use the active UCS.
// d) The fourth method is to use a docking station: click 3 points to define its location,
// 3. Check the UCS created from the method chosen previously.
// 4. Choose the method to position the Fiducial marker:
// a) Click a point in the scene to place it or,
// b) Enter the distance of it from the wall corner along Y direction and its height of the ground.
// 5. The Fiducial marker is created from the .obj file and added to the document.

/**
 * Function to show an error message
 * @param {string} iMessage The message to display
 * @param {bool} iThrowError Should we throw an error (default value: true)
 */
function ErrorMessage(iMessage, iThrowError)
{
	var throwError = (typeof iThrowError !== 'undefined') ? iThrowError : true;

	SDialog.Message(iMessage, SDialog.EMessageSeverity.Error, "Error Message");
	
	if(throwError)
		throw new Error(iMessage);
}

/**
 * Function to launch a dialog allowing to define the UCS parameters
 * @returns {number} Number for each method
 */
function UCSMethod()
{
	var curCS = SMatrix.New();
	curCS = SMatrix.FromActiveCS();
	var isWCS = curCS.IsIdentity();

	var myDialog = SDialog.New("UCS Creation for BLK ARC");
	myDialog.SetHeader( "", CurrentScriptPath()+"\\BLKARCFiducialUCS.svg", 48);
	myDialog.AddChoices({
    	id: "method",
    	name: "List of methods",
    	choices: ["Three points (CAD/BIM drawing)","Three planes (Point Cloud)","Active UCS","Docking station"],
    	tooltip: "Choose between the methods",
    	value: 0, 
    	saveValue: true, 
    	readOnly: false,
    	style: SDialog.ChoiceRepresentationMode.RadioButtons});

	var dialogResult = myDialog.Run();

	if(dialogResult.ErrorCode != 0)
		ErrorMessage("Operation canceled");

	var myMethod = dialogResult.method+1;
	if(isWCS)
	{
		if(myMethod != 1 && myMethod != 2 && myMethod != 4)
			ErrorMessage("not available, no UCS activated");
	}

	return myMethod;
}

/**
* @typedef {Object} FiducialParam
* @property {number} UCSDistance The distance of the Fiducial marker from the wall corner
* @property {number} UCSHeight The height of the Fiducial marker from the ground
*/

/**
 * Function to launch a dialog allowing to define the UCS parameters
 * @param {SMatrix} iMat The matrix
 * @returns {FiducialParam} Position of the Fiducial marker
 */
function FiducialPositionDlg(iMat)
{
	var dist = 0;
	var height = 0;
	var myDialog1=SDialog.Question("Do you want to click a point (Yes) or enter a value (No)?","Fiducial marker position");  

	if(myDialog1) // dist and height must be calculated from user click
	{
		var clickP = SPoint.FromClick();
		if(clickP.ErrorCode != 0)
			ErrorMessage("Canceled by user");
		var thePnt = clickP.Point;
		thePnt.ApplyTransformation(iMat);
		dist = thePnt.GetY();
		height = thePnt.GetZ();
	}
	else // dist and height are user input
	{
		var myDialog = SDialog.New("Fiducial marker position");
		myDialog.AddLength({ 
            id: "dY", 
            name: "Distance along Y",
            tooltip: "Distance of the Fiducial marker to wall corner along Y direction (can be negative!)" , 
            value: 1, 
            min: -Number.MAX_VALUE,
            saveValue: true, 
            readOnly: false});
        myDialog.AddLength({ 
            id: "dZ", 
            name: "Height",
            tooltip: "Height of the Fiducial marker to ground", 
            value: 0.3, 
            saveValue: true, 
            readOnly: false});

		var dialogResult = myDialog.Run();

		if(dialogResult.ErrorCode != 0)
			ErrorMessage("Operation canceled");

		dist = dialogResult.dY;
		height = dialogResult.dZ;
	}

	return { 'UCSDistance': dist, 'UCSHeight': height };
}

/**
 * Function to create a UCS 
 * @param {SPoint} iOriginPt The origin point of the UCS
 * @param {SVector} iY The Y axis of the UCS
 * @param {SPoint} iThirdPt The last point used for the UCS
 * @returns {SMatrix} The matrix
 */
function CreateUCS(iOriginPt, iY, iThirdPt)
{
	iY.SetZ(0);
	iY.Normalize();
	var x = SVector.Cross(iY, SVector.New(0, 0, 1));
	var origP1 = SVector.New(iOriginPt, iThirdPt);
	var dotRes = SVector.Dot(x, origP1);
	if(dotRes < 0)
		iY = iY.Mult(-1);

	var pY = SPoint.New(iOriginPt);
	pY.Translate(iY);

	var theMat = SMatrix.New();
	theMat.InitAlign(SPoint.New(0, 0, 0), SPoint.New(0, 1, 0), iOriginPt, pY);

	return theMat;
}

/**
 * Function to create a UCS from 3 points
 * @returns {SMatrix} The matrix
 */
function CreateUCS3Points()
{
	var myDialog = SDialog.New("Fiducial marker position");
	myDialog.AddPoint({ 
        id: "origin", 
        name: "Origin", 
        tooltip: "Click a point in the corner used as reference", 
        saveValue: false, 
        value: SPoint.New(0,0,0), 
        readOnly: false});
	myDialog.AddPoint({ 
        id: "yAxis", 
        name: "Point on Y axis", 
        tooltip: "Click a point on the edge between the wall and the floor", 
        saveValue: false, 
        value: SPoint.New(0,0,0), 
        readOnly: false});
    myDialog.AddPoint({ 
        id: "xPositiveSide", 
        name: "Point with X>0", 
        tooltip: "Click a point in front of the wall where Fiducial marker is located ", 
        saveValue: false, 
        value: SPoint.New(0,0,0), 
        readOnly: false});    
	var dlgResult=myDialog.Run();

	if(dlgResult.ErrorCode != 0)
		ErrorMessage("Canceled by user");

	var theMat = CreateUCS(dlgResult.origin, SVector.New(dlgResult.origin, dlgResult.yAxis), dlgResult.xPositiveSide);

	return theMat;
}

/**
* @typedef {Object} PlaneExtractObject
* @property {SPlane} ThePlane The plane extracted
* @property {SPoint} TheClickedPoint The clicked point
*/

/**
 * Function to create a local cloud from the CwCloud
 * @param {SCwCloud} iCwCloud The input CwCloud
 * @param {SPoint} iPoint The input point
 * @returns {SCloud} The output cloud
 */
function GetLocalCloudFromCWCloud(iCwCloud, iPoint)
{
	// 1st - deactivate all clips
	var allActivated = SClipping.GetAllActivated(2);
	for(var iAct = 0; iAct < allActivated.length; iAct++)
		allActivated[iAct].DeactivateInAllScenes();

	var tmpClip = SClippingBox.New();
	tmpClip.SetCenter(iPoint);
	tmpClip.SetHeight(1);
	tmpClip.SetLength(1);
	tmpClip.SetWidth(1);
	tmpClip.AddToDoc();
	tmpClip.ActivateInAllScenes();

	var toRet = iCwCloud.ToCloud(10000, false);
	if(toRet.ErrorCode == 1)
		ErrorMessage("No cloud clicked.");

	tmpClip.RemoveFromDoc();

	// last reactivate previously activated clips
	for(var iAct = 0; iAct < allActivated.length; iAct++)
		allActivated[iAct].ActivateInAllScenes();

	return toRet.Cloud;
}

/**
 * Function to extract a plane from a point cloud
 * @param {string} iMessage The message to display
 * @returns {PlaneExtractObject} The extracted plane
 */
function ExtractPlaneFromPointCloud(iMessage)
{
	SDialog.Message(iMessage, SDialog.EMessageSeverity.Instruction, "UCS Creation for BLK ARC");

	var clickP = SPoint.FromClick();
	if(clickP.ErrorCode != 0)
		ErrorMessage("Canceled by user");

	var theCloud = SCloud.New();
	var allClouds = SCloud.All(1);
	if(allClouds.length == 1)
		theCloud = allClouds[0];
	else // cloud to be retrieved from SCwCloud
	{
		var theCW = SCwCloud.All(1)[0];
		theCloud = GetLocalCloudFromCWCloud(theCW, clickP.Point);
	}
	var resExtract = theCloud.ExtractPlane([clickP.Point], 0.05, SCloud.PLANE_FORCE_NOTHING);
	if(resExtract.ErrorCode != 0)
		ErrorMessage("Error in Plane Extraction");

	return { "ThePlane": resExtract.Plane, "TheClickedPoint": clickP.Point };
}

/**
 * Function to create a UCS from a point cloud
 * @returns {SMatrix} The matrix
 */
function CreateUCSPointCloud()
{
	var p1 = ExtractPlaneFromPointCloud("Click a point on the ground in front of the Fiducial marker");
	var p2 = ExtractPlaneFromPointCloud("Click a point on the wall where the Fiducial marker is located");
	var p3 = ExtractPlaneFromPointCloud("Click a point on the corner wall");

	var intRes = p1.ThePlane.IntersectionBetween2Planes(p2.ThePlane);
	if(intRes.ErrorCode != 0)
		ErrorMessage("Error when calculating the intersection between 2 planes");

	var theLine = intRes.Line;
	var projRes = p3.ThePlane.ProjDir(theLine.GetLastPoint(), theLine.GetNormal());
	if(projRes.ErrorCode != 0)
		ErrorMessage("Error when calculating the projection of the line on 3rd plane");

	var theMat = CreateUCS(projRes.Point, theLine.GetNormal(), p1.TheClickedPoint);

	return theMat;
}

/**
 * Function to create a UCS by positionning the docking station
 * @returns {structure} {theMat,XAxis,Yaxis} The matrix, the X axis and the Y axis
 */
function CreateUCSDock()
{
	var myDialog = SDialog.New("Docking station");
    myDialog.AddText("Create a UCS by positionning the docking station.<br />-Rear Center: Give a point on the ground where the center of the rear of the Docking Station should be placed.<br />-Front Center: give a point on the ground to define the orientation, which is determined by the center of the front of the Docking Station.<br />-Point on left side: give a point on the ground to define the orientation, which is determined by the left side of the Docking Station.",SDialog.EMessageSeverity.Info);
	myDialog.AddPoint({ 
        id: "point1", 
        name: "Rear Center", 
        saveValue: false, 
        value: SPoint.New(0,0,0), 
        readOnly: false});
	myDialog.AddImage(CurrentScriptPath() + "/DockingStationPt1.jpg",-1,200,true);
    myDialog.AddPoint({ 
        id: "point2", 
        name: "Front Center", 
        saveValue: false, 
        value: SPoint.New(0,0,0), 
        readOnly: false});
	myDialog.AddImage(CurrentScriptPath() + "/DockingStationPt2.jpg",-1,200,true);
    myDialog.AddPoint({ 
        id: "point3", 
        name: "Point on left side", 
        saveValue: false, 
        value: SPoint.New(0,0,0), 
        readOnly: false});
	myDialog.AddImage(CurrentScriptPath() + "/DockingStationPt3.jpg",-1,200,true);
    var dlgResult=myDialog.Run();
    if(!dlgResult.ErrorCode)
    {      
        var theMat = SMatrix.New();
        var alignement=theMat.InitAlign(
            dlgResult.point1, dlgResult.point2, dlgResult.point3, SPoint.New(0, 0, 0), SPoint.New(1, 0, 0), SPoint.New(0, 1, 0));
        if(alignement.ErrorCode)
            ErrorMessage("Invalid points");

        theMat.InitInverse(theMat);
    }
    else
    {
        ErrorMessage("Canceled by user");
    }
	return theMat;
}

/**
 * Function to check the alignment
 * @param {SMultiline[]} iFakeUCS All the Multilines added as a fake UCS
*/
function CheckAlignment(iFakeUCS)
{
	    var myDialog=SDialog.Message("<span style='color:red;font-weight: bold;'>X Axis</span> should be oriented external to the wall. <br><span style='color:green;font-weight: bold;'>Y Axis</span> should be horizontal, aligned to the wall and pointing right. <br><span style='color:blue;font-weight: bold;'>Z Axis</span> should be oriented vertically (upward). <br>After closing this dialog, look at the alignment and check if it is correctly oriented.<br>Then press Enter if everything is fine or Escape if you want to restart from beginning.",SDialog.EMessageSeverity.Instruction, "UCS Creation for BLK ARC");

	var clickP = SPoint.FromClick();
	if(clickP.ErrorCode == 2)
	{
		for(var iM = 0; iM < iFakeUCS.length; iM++)
			iFakeUCS[iM].RemoveFromDoc();

		ErrorMessage("Canceled by user");
	}
}

/**
 * Function to add labels
* @param {FiducialParam} iFidPos The Fiducial marker position
* @param {FiducSMatrixialParam} iMat The matrix
*/
function AddLabels(iFidPos, iMat)
{
	var lab1 = SLabel.New(1, 1);
	lab1.SetLineType([SLabel.YY]);
	lab1.SetColType([SLabel.Measure]);
	lab1.AttachToPoint(SPoint.New(0, -iFidPos.UCSDistance / 2, 0));
	var theMult1 = SMultiline.New();
	theMult1.InsertLast(SPoint.New(0, -iFidPos.UCSDistance, 0));
	theMult1.InsertLast(SPoint.New(0, 0, 0));
	theMult1.AddArrows(false);
	lab1.AddSComp([theMult1]);
	lab1.ApplyTransformation(iMat);
	lab1.SetCell(0, 0, iFidPos.UCSDistance);
	lab1.AddToDoc();
	lab1.MoveToGroup("Fiducials", false);

	var lab2 = SLabel.New(1, 1);
	lab2.SetLineType([SLabel.ZZ]);
	lab2.SetColType([SLabel.Measure]);
	lab2.AttachToPoint(SPoint.New(0, 0, -iFidPos.UCSHeight / 2));
	var theMult2 = SMultiline.New();
	theMult2.InsertLast(SPoint.New(0, 0, 0));
	theMult2.InsertLast(SPoint.New(0, 0, -iFidPos.UCSHeight));
	theMult2.AddArrows(false);
	lab2.AddSComp([theMult2]);
	lab2.ApplyTransformation(iMat);
	lab2.SetCell(0, 0, iFidPos.UCSHeight);
	lab2.AddToDoc();
	lab2.MoveToGroup("Fiducials", false);
}

/**
* Function to hide clipping objects 
* @returns {SComp[]} The list of components that were hidden
*/
function HideObjects()
{
	var toRet = SClipping.All(1);
	for(var iComp = 0; iComp < toRet.length; iComp++)
		toRet[iComp].SetVisibility(false);
	return toRet;
}

/**
 * Function to create a temporary UCS
 * @param {SMatrix} iUCSMat The Matrix of the UCS
 * @returns {SMultiline[]} The list of multilines that were created
 */
function CreateTempUCS(iUCSMat)
{
	var inv = SMatrix.New();
	inv.InitInverse(iUCSMat);

	var X = SMultiline.New();
	X.InsertLast(SPoint.New(0, 0, 0));
	X.InsertLast(SPoint.New(1, 0, 0));
	X.AddArrows(1, 1);
	X.SetColors(1, 0, 0);
	X.ApplyTransformation(inv);
	X.SetLineWidth(4);
	X.AddToDoc();

	var Y = SMultiline.New();
	Y.InsertLast(SPoint.New(0, 0, 0));
	Y.InsertLast(SPoint.New(0, 1, 0));
	Y.AddArrows(1, 1);
	Y.SetColors(0, 1, 0);
	Y.ApplyTransformation(inv);
	Y.SetLineWidth(4);
	Y.AddToDoc();

	var Z = SMultiline.New();
	Z.InsertLast(SPoint.New(0, 0, 0));
	Z.InsertLast(SPoint.New(0, 0, 1));
	Z.AddArrows(1, 1);
	Z.SetColors(0, 0, 1);
	Z.ApplyTransformation(inv);
	Z.SetLineWidth(4);
	Z.AddToDoc();

	return [X, Y, Z];
}

/**
 * Function to scale object to the current document unit coming from a document in meters
 * @param {SComp} the SComp to scale
 * @returns {SComp} The scaled SComp
 */
function scaleLoadedObjects(iComp)
{
	var scaleFactor = 1000 / GetScaleFactor().Value;
	var scaleFactorMatrix = SMatrix.New();
	scaleFactorMatrix.InitScale(SPoint.New(0, 0, 0), scaleFactor, scaleFactor, scaleFactor);
	iComp.ApplyTransformation(scaleFactorMatrix);
	return iComp;
}

/**
 * Main Function
 */
function Main()
{
	HideObjects();
	var UCSCreationMethod = UCSMethod();

	var theMat = SMatrix.New();
	if(UCSCreationMethod == 1)
		theMat = CreateUCS3Points();
	else if(UCSCreationMethod == 2)
	{
		var allCloudsNb = SCloud.All(1).length + SCwCloud.All(1).length;
		if(allCloudsNb != 1)
			ErrorMessage("One single cloud should be visible in order to run this method");
		theMat = CreateUCSPointCloud();
	}
	else if(UCSCreationMethod == 4)
	{
		theMat = CreateUCSDock();
	}
	else if(UCSCreationMethod != 3)
		ErrorMessage("Wrong method defined to create a UCS");

	var inv = SMatrix.New();
	if(UCSCreationMethod < 3)
	{
		var FakeUCS = CreateTempUCS(theMat);
		CheckAlignment(FakeUCS);
		for(var iM = 0; iM < FakeUCS.length; iM++)
			FakeUCS[iM].RemoveFromDoc();

		var fidPos = FiducialPositionDlg(theMat);
		var tMat = SMatrix.New(SVector.New(0, -fidPos.UCSDistance, -fidPos.UCSHeight));
		tMat.ApplyTransformation(theMat);

		tMat.AddToDocAsUCS("Fiducial", true);
		inv.InitInverse(tMat);
		AddLabels(fidPos, inv);
	}
	else if(UCSCreationMethod == 3)
	{
		tMat = SMatrix.FromActiveCS();
		inv.InitInverse(tMat);
	}
	else if(UCSCreationMethod == 4)
	{
		var offsetX = -0.183 * 1000 / GetScaleFactor().Value;
		var offsetY = 0 * 1000 / GetScaleFactor().Value;
		var offsetZ = -0.30866 * 1000 / GetScaleFactor().Value;
		var tMat = SMatrix.New(SVector.New(offsetX, offsetY, offsetZ));
		tMat.ApplyTransformation(theMat);

		tMat.AddToDocAsUCS("Fiducial", true);
		inv.InitInverse(tMat);
	}

	// adding the Fiducial marker
	var objFile = CurrentScriptPath() + "/Fiducial.obj";
	var fiMesh = SPoly.New();
	fiMesh = SPoly.FromFile(objFile).PolyTbl[0];
	fiMesh = scaleLoadedObjects(fiMesh);
	fiMesh.ApplyTransformation(inv);
	fiMesh.SetName("Fiducial");
	fiMesh.SetPolyRepresentation(SPoly.POLY_TEXTURE);
	fiMesh.AddToDoc();
	fiMesh.MoveToGroup("Fiducials", false);

	// adding the Docking Station
	if(UCSCreationMethod == 4)
	{
		var dockModel = CurrentScriptPath() + "/Docking_Station.msd";
		var dockMesh = SPoly.FromFile(dockModel).PolyTbl[0];
		dockMesh = scaleLoadedObjects(dockMesh);
		dockMesh.ApplyTransformation(inv);
		dockMesh.SetName("Docking_Station");
		dockMesh.SetTransparency(128);
		dockMesh.AddToDoc();
		dockMesh.MoveToGroup("Fiducials", false);

		var returnPointPath = CurrentScriptPath() + "/../BLK ARC Common/return_point.asc";
        var returnPoint=SPoint.FromFile(returnPointPath).PointTbl[0];
        returnPoint=scaleLoadedObjects(returnPoint);
		returnPoint.ApplyTransformation(inv); 
        returnPoint.SetName("Return Point");
        returnPoint.SetPointSize(8);
        returnPoint.ShowName(true);
        returnPoint.AddToDoc();
        returnPoint.MoveToGroup("Fiducials",false);

	}
}

// Main();
module.exports = { MAIN };