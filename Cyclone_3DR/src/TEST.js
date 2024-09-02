//*******************************************************************//
//**	 THIS IS TEST SCRIPT. WILL BE REFORMATTED WITH TIME        **//
//**CURRENTLY THREE SEPERATE SCRIPTS HAVE BEEN COMBINED IN THIS DOC**//
//*******************************************************************//

var ZValue = .309;
// Error Message Function
function ErrorMessage(iMessage) 
{
    SDialog.Message(iMessage,SDialog.EMessageSeverity.Error,"Error");
    throw new Error(iMessage);
}

// Open Point Cloud
function openMyproject(iName) 
{
    var isOpen = OpenDoc(iName, true, true).ErrorCode; // 3DR document is cleared and the defined 3DR project is opened 

    if (isOpen == 1) {
        ErrorMessage("An error occurred. Impossible to open the 3DR file."); // print an error message if no success
    }
    else 
    {
        print("Your project " + iName + " has been opened."); // throw a message to inform the opening of the file
    }
}


// SCRIPT 1


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
	// var dist = 0;
	// var height = 0;
	// var myDialog1=SDialog.Question("Do you want to click a point (Yes) or enter a value (No)?","Fiducial marker position");  

	// if(myDialog1) // dist and height must be calculated from user click
	// {
	// 	var clickP = SPoint.FromClick();
	// 	if(clickP.ErrorCode != 0)
	// 		ErrorMessage("Canceled by user");
	// 	var thePnt = clickP.Point;
	// 	thePnt.ApplyTransformation(iMat);
	// 	dist = thePnt.GetY();
	// 	height = thePnt.GetZ() + .309;
	// }
	// else // dist and height are user input
	// {
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

		var dist = dialogResult.dY;
		var height = dialogResult.dZ;
	//}
	if(height < .308 || height > .308)
	{
		var imessage = "Please keep height at .308m ";
	    ErrorMessage(imessage);
	}
	print("Height: " + height)
	print("Y Distance: " + dist)

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

// Sleep(1000);

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

Main();































//*****************************************************************//
//	 					SCRIPT 2 (ZG Script)                       //
//*****************************************************************//

// //////////////////////////////////////////////////
// // Creating dialog box for longitude and latitude
// var LongLat = SDialog.New("Longitude and Latitude");

// // Add input fields for X, Y, Z with initial values
// LongLat.AddLength({id: 'Long', name: "Click Longitude of Image (X)", value: 0, saveValue: true, readOnly: false}); 
// LongLat.AddLength({id: 'Lat', name: "Click Latitude of Image (Y)", value: 0, saveValue: true, readOnly: false}); 

// // Get user inputs
// var dialogLongLat = LongLat.Run();

// // Check if "Cancel" button is pressed
// if (dialogLongLat.ErrorCode == 1) 
// {
// 	var imessage = "User Has Terminated Sequence";
// 	ErrorMessage(imessage);
// }
// else
// {
//     // Retrieve the Long and Lat values entered by the user
//     var ImageLat = dialogLongLat.Lat;
//     var ImageLong = dialogLongLat.Long;
// }
// //////////////////////////////////////////////////

// //////////////////////////////////////////////////
// // Create the dialog for Initial X, Y, Z Values
// var XYZ = SDialog.New("Initial X,Y,Z Values");

// // Add input fields for X, Y, Z with initial values
// XYZ.AddLength({id: 'X', name: "Set X", value: 0, saveValue: true, readOnly: false});
// XYZ.AddLength({id: 'Y', name: "Set Y", value: 0, saveValue: true, readOnly: false});
// XYZ.AddLength({id: 'Z', name: "Set Z", value: 0, saveValue: true, readOnly: false});

// // Run the dialog to get user inputs
// var dialogInitialXYZ = XYZ.Run();

// // Check if "Cancel" button is pressed
// if (dialogInitialXYZ.ErrorCode == 1) 
// {
//     var imessage = "User Has Terminated Sequence";
//     ErrorMessage(imessage);
// }
// else
// {
//     // Retrieve the initial X, Y, Z values entered by the user
//     var initialXValue = dialogInitialXYZ.X;
//     var initialYValue = dialogInitialXYZ.Y;
//     var initialZValue = dialogInitialXYZ.Z;

//     // Validate the initial X value 
//     // if (initialXValue >= 90 || initialYValue < 0) 
// 	if (initialXValue >= 90) 
//     {
//         var imessage = "Invalid X or Y Value";
//         ErrorMessage(imessage);
//     }

//     // Validate the initial Y value 
//     // if (initialYValue >= 90 || initialYValue < 0)
// 	if (initialYValue >= 90) 
//     {
//         var imessage = "Invalid X or Y Value";
//         ErrorMessage(imessage);
//     }

//     // Validate the initial Z value 
//     if (initialZValue < 0) 
//     {
//         var imessage = "Invalid Z Value";
//         ErrorMessage(imessage);
//     }
// }   
// //////////////////////////////////////////////////

// //////////////////////////////////////////////////
// // Incrementation of new XYZ
// var IncrementationXYZ = SDialog.New("Increment X,Y,Z");

// // Setting up user input window
// IncrementationXYZ.AddLength({id: 'X_length', name: "X Increment", value: 0, saveValue: true, readOnly: false});
// IncrementationXYZ.AddLength({id: 'Y_length', name: "Y Increment", value: 0, saveValue: true, readOnly: false});
// IncrementationXYZ.AddLength({id: 'Z_length', name: "Z Increment", value: 0, saveValue: true, readOnly: false});

// // User input recorded
// var dialogNewXYZ = IncrementationXYZ.Run();

// // Check if "Cancel" button is pressed
// if (dialogNewXYZ.ErrorCode == 1) 
// {
//     var imessage = "User Has Terminated Sequence";
//     ErrorMessage(imessage);
// }
// else
// {
//     // Recalling user inputs
//     var NewXrecall = dialogNewXYZ.X_length;
//     var NewYrecall = dialogNewXYZ.Y_length;
//     var NewZrecall = dialogNewXYZ.Z_length;
// }
// //////////////////////////////////////////////////

// // Printing all Variables
// print("Chosen Reference Pts: " + initialXValue + " X, " + initialYValue + " Y, " + initialZValue + " Z");
// print("The Longitude of Point Cloud: " + ImageLong + " The Latitude is: " + ImageLat);
// print("XYZ Incrementation Values: " + NewXrecall + " X, " + NewYrecall + " Y, " + NewZrecall + " Z");
// // END ZG SCRIPT
var myDialogFunc = SDialog.New("Waypoint INformation");
	myDialogFunc.AddLength({ 
        id: "X", 
        name: "Initial X Value", 
        tooltip: "Set close to 0", 
        saveValue: true, 
        // value: SPoint.New(0,0,0), 
        readOnly: false});
	myDialogFunc.AddLength({ 
		id: "Y", 
		name: "Initial Y Value", 
		tooltip: "Set close to 0", 
		saveValue: true, 
		// value: SPoint.New(0,0,0), 
		readOnly: false});
	myDialogFunc.AddLength({ 
		id: "Z", 
		name: "Initial Z Value", 
		tooltip: "Set close to 0", 
		saveValue: true, 
		// value: SPoint.New(0,0,0), 
		readOnly: false});
	myDialogFunc.AddLength({ 
        id: "Long", 
        name: "Longitude (X)",
        tooltip: "Click Width of layout", 
        saveValue: true, 
        // value: SPoint.New(0,0,0), 
        readOnly: false});
	myDialogFunc.AddLength({ 
		id: "Lat", 
		name: "Latitutde (Y)", 
		tooltip: "Click Length of layout", 
		saveValue: true, 
		// value: SPoint.New(0,0,0), 
		readOnly: false});
    myDialogFunc.AddLength({ 
        id: "X_length", 
        name: "X Increment", 
        tooltip: "Distance between two points", 
        saveValue: true, 
        // value: SPoint.New(0,0,0), 
        readOnly: false});    
    myDialogFunc.AddLength({ 
        id: "Y_length", 
        name: "Y Increment", 
        tooltip: "Distance between two points", 
        saveValue: true, 
        // value: SPoint.New(0,0,0), 
        readOnly: false}); 
    myDialogFunc.AddLength({ 
        id: "Z_length", 
        name: "Z Increment", 
        tooltip: "Distance between two points", 
        saveValue: true, 
        // value: SPoint.New(0,0,0), 
        readOnly: false}); 

	var dlgResult=myDialogFunc.Run();

	if(dlgResult.ErrorCode != 0)
		ErrorMessage("Canceled by user");

    var initialXValue = dlgResult.X
    var initialYValue = dlgResult.Y
    var initialZValue = dlgResult.Z

    var ImageLat = dlgResult.Lat
    var ImageLong = dlgResult.Long

    var NewXrecall = dlgResult.X_length
    var NewYrecall = dlgResult.Y_length
    var NewZrecall = dlgResult.Z_length

// Printing all Variables
print("Chosen Reference Pts: " + initialXValue + " X, " + initialYValue + " Y, " + initialZValue + " Z");
print("The Longitude of Point Cloud: " + ImageLong + " The Latitude is: " + ImageLat);
print("XYZ Incrementation Values: " + NewXrecall + " X, " + NewYrecall + " Y, " + NewZrecall + " Z");
// END ZG SCRIPT
	


//*****************************************************************//
//																   //
// SCRIPT 3 (AUTONOMOUS WAYPOINT AT SECTION 4. ZG IMPLEMENTED CODE)//
//																   //
//*****************************************************************//

// <reference path="C:/Program Files/Leica Geosystems/Cyclone 3DR/Script/JsDoc/Reshaper.d.ts"/>

// Context: This script is meant to be used to give instructions to the BLK ARC.
// It defines a go zone, no-go zones and waypoints where scan is required.
//
// See more information on https://leica-geosystems.com/products/laser-scanners/autonomous-reality-capture/blk-arc
// ------------------------ HOW TO USE IT --------------------------------------------
// 1. Run the script without any selection. Then, define the name of the mission, the name of the fiducial UCS to use, and answer if the current CS corresponds to a docking station.
// 2. Create the go zone polyline representing the area where the BLK ARC is allowed. Press Enter at the end.
// 3. Optionally, create the NO go zone polylines representing the area where the BLK ARC is NOT allowed. Press Enter at the end of each NO go zone.
// 4. Optionally, add waypoints. Press Enter at the end.
// 4. Optionally, modify the waypoints actions.
// 5. When using a docking station, you can define return waypoints. Press Enter at the end. A waypoint will be added or moved next to the docking station.
// 6. Define the folder where to save the .json file. The name of the file will be named according to the name of the mission. This file contains instructions for the BLK ARC
// 7. Optionally, export a mesh in .GLB.
// 8. The duration of the mission is then showed in minutes with intervals every 30 seconds.
// in case of cancellation, check the corresponding mission folder and restart the script (Go, No Go zones and waypoints will be reused)

var addQuaternionDirectionToDoc = false;

//Read the current document unit
var scaleFactorToMeters = GetScaleFactor().Value / 1000;

//-------------Classes--------------
class SMission
{
	/**
     * Default constructor
     */
	constructor()
	{
		//the name of the mission (a string)
		this.MissionName;

		//the UCS that corresponds to the given fiducial (a SMatrix)
		this.UCS;

		//if the UCS refers to a docking station (a boolean)
		this.IsDockingStation;

		//the GO zone where the scanner can move (a polyline)
		this.GoZone;

		//the list of NO GO zones where the scanner should not go (a table of SPolyline)
		this.NoGoZonesTbl = [];

		//points that define the trajectory (a table of SWaypoint)
		this.WaypointsTbl = [];

		//points that define the trajectory back to the docking station (a table of SWaypoint)
		this.WaypointsBackTbl = [];

		//origin of the docking station (a SWaypoint)
		this.WaypointDockingFinal;

		//the path created from all waypoints
		this.DummyPath;

        //the fiducial return point (a single SPoint)
        this.FiducialReturnPoint;

        //the reference plane, horizontal at the Fiducial return point elevation or at the Fiducial elevation (a SPlane)
		this.RefPlane;
	}

	/**
     * Function to re-create a possible path according to the SWaypoints stored in the mission
     */
	UpdateDummyPath()
	{
		if(this.DummyPath != undefined)
		{
			var allMultis = SMultiline.All(2);
			for(var ii = 0; ii < allMultis.length; ii++)
			{
				if(allMultis[ii].GetPath() == "/" + this.GetTrajectoryGroupPath())
				{
					allMultis[ii].RemoveFromDoc();
					break;
				}
			}
		}

		var dummyPath = SMultiline.New();

		for(var iWpt = 0; iWpt < this.WaypointsTbl.length; iWpt++)
			dummyPath.InsertLast(this.WaypointsTbl[iWpt].PointInWCS);

		for(var iWpt = 0; iWpt < this.WaypointsBackTbl.length; iWpt++)
			dummyPath.InsertLast(this.WaypointsBackTbl[iWpt].PointInWCS);

		if(this.WaypointDockingFinal != undefined)
			dummyPath.InsertLast(this.WaypointDockingFinal.PointInWCS);

		this.DummyPath = dummyPath;
		this.DummyPath.AddToDoc();
		this.DummyPath.SetColors(0, 0, 0);
		this.DummyPath.AddArrows(1, 1);
		this.DummyPath.SetLineWidth(1);
		this.DummyPath.SetName(this.MissionName + "_Trajectory");
		this.DummyPath.MoveToGroup(this.GetTrajectoryGroupPath(), false);
	}

	/**
     * Function to read the treeview and re-create the SMission
     */
	InitMissionFromDoc()
	{
		//read the zone multilines
		var allMultis = SMultiline.All(2);
		var goZonesTbl = allMultis.filter(a => a.GetPath() == ("/" + this.GetGoZoneGroupPath()));
		var oNoGoZonesTbl = allMultis.filter(a => a.GetPath() == ("/" + this.GetNoGoZonesGroupPath()));
		print("->" + goZonesTbl.length + " go zone found");
		print("->" + oNoGoZonesTbl.length + " no go zones found");

		//only 1 go zone allowed
		if(goZonesTbl.length > 1)
			ErrorMessage("Too many Go Zones");
		if(goZonesTbl.length == 1)
		{
			var oGoZone = goZonesTbl[0];
		}

		//clean up old trajectories
		for(var ii = 0; ii < allMultis.length; ii++)
		{
			if(allMultis[ii].GetPath() == "/" + this.GetTrajectoryGroupPath())
			{
				allMultis[ii].RemoveFromDoc();
			}
		}

		//read the waypoints labels
		var allLabels = SLabel.All(2);
		var oWaypointsLabelTbl = allLabels.filter(a => a.GetPath() == ("/" + this.GetWaypointsGroupPath()));
		var oWaypointsBackLabelTbl = allLabels.filter(a => a.GetPath() == ("/" + this.GetWaypointsReturnGroupPath()));
		var oWaypointsDockingLabelTbl = allLabels.filter(a => a.GetPath() == ("/" + this.GetWaypointDockingGroupPath()));

		print("->" + oWaypointsLabelTbl.length + " main waypoints found");
		print("->" + oWaypointsBackLabelTbl.length + " return waypoints found");
		print("->" + oWaypointsDockingLabelTbl.length + " docking waypoints found");

		oWaypointsLabelTbl.sort(
            (a, b) => parseInt(a.GetName().split("_")[a.GetName().split("_").length-1]) - parseInt(b.GetName().split("_")[b.GetName().split("_").length-1]));
		oWaypointsBackLabelTbl.sort(
            (a, b) => parseInt(a.GetName().split("_")[a.GetName().split("_").length-1]) - parseInt(b.GetName().split("_")[b.GetName().split("_").length-1]));

		//rename the label waypoints
		for(var iRenaming = 0; iRenaming < oWaypointsLabelTbl.length; iRenaming++)
			oWaypointsLabelTbl[iRenaming].SetName(this.MissionName + "_" + (iRenaming + 1));

		for(var iRenaming = 0; iRenaming < oWaypointsBackLabelTbl.length; iRenaming++)
			oWaypointsBackLabelTbl[iRenaming].SetName(this.MissionName + "_" + (iRenaming + 1));

		//only 1 docking waypoint allowed
		if(oWaypointsDockingLabelTbl.length > 1)
			ErrorMessage("Too many Docking Waypoints");
		if(oWaypointsDockingLabelTbl.length == 1)
		{
			var oWaypointDockingFinal = oWaypointsDockingLabelTbl[0];
			oWaypointDockingFinal.SetName(this.MissionName + "_D");
		}

		//and create the corresponding SWaypoint tables
		var oWaypointsTbl = SWaypoint.CreateWaypointsFromLabels(this, oWaypointsLabelTbl);
		var oWaypointsBackTbl = SWaypoint.CreateWaypointsFromLabels(this, oWaypointsBackLabelTbl);
		var oWaypointsDockingTbl = SWaypoint.CreateWaypointsFromLabels(this, oWaypointsDockingLabelTbl);

		this.GoZone = oGoZone;
		this.NoGoZonesTbl = oNoGoZonesTbl;
		this.WaypointsTbl = oWaypointsTbl;
		this.WaypointsBackTbl = oWaypointsBackTbl;
		this.WaypointDockingFinal = oWaypointsDockingTbl[0];
		this.UpdateDummyPath();
	}

	/**
     * Function to import the fiducial or docking station return point and save it inside the SMission
     */
    SetFiducialReturnPoint()
	{
        var returnPointPath= CurrentScriptPath() + "/../BLK ARC Common/return_point.asc";
        var returnPointImportation=SPoint.FromFile(returnPointPath);
        if(returnPointImportation.ErrorCode)
            ErrorMessage("return_point.asc not found");
        var returnPoint=returnPointImportation.PointTbl[0];
        returnPoint=ScaleAnObject(returnPoint);
        returnPoint.ApplyTransformation(this.UCS);

        this.FiducialReturnPoint=returnPoint;
	}

	/**
     * Function to set the reference plane
     * @param {number} z the elevation of the reference plane
     */
    SetRefPlane(z)
	{
        this.RefPlane=SPlane.New(SPoint.New(0,0,z),SVector.New(0,0,1));
	}

	/**
     * Function to compute the duration of the mission
     * @returns {Map} The mission duration in minutes (number and string)
     */
	ComputeMissionDuration()
	{
		var missionWaypoints = this.WaypointsTbl.concat(this.WaypointsBackTbl);
		if(this.WaypointDockingFinal != undefined)
			missionWaypoints.push(this.WaypointDockingFinal);

		var I = 90; // Initialization and Fiducial Detection (90 sec)
		var D = this.DummyPath.GetLength() * scaleFactorToMeters; // distance of the trajectory (m)
		var V = 0.5; // Spot velocity (0.5 m/s)
		var Nwp = this.DummyPath.GetNumber(); // Number of way points (value)
		var C = 2; // Constant (2 sec)
		var Tsh = 75; // Time of static scan High (75 sec)
		var Nsh = SWaypoint.ComputeWaypointCountFromComment(missionWaypoints, "High");
		var Tsm = 45; // Time of static scan Medium (45 sec)
		var Nsm = SWaypoint.ComputeWaypointCountFromComment(missionWaypoints, "Medium");
		var Tsl = 25; // Time of static scan Low (25 sec)
		var Nsl = SWaypoint.ComputeWaypointCountFromComment(missionWaypoints, "Low");

		var fullDuration = I + D / V + Nwp * C + Tsh * Nsh + Tsm * Nsm + Tsl * Nsl;
		var duration = Math.max(Math.floor(fullDuration / 60), 1);
		var durationInMin = duration;
		var AddedS = "";
		AddedS += durationInMin;
		AddedS += "min";
		if(fullDuration - duration * 60 > 30)
		{
			AddedS += " 30 s";
			durationInMin += 0.5;
		}

		return { 'DurationValue': durationInMin, 'DurationString': AddedS };
	}

	/**
     * function which returns the mission folder path of the go zone
     * @returns {string} the path string
     */
    GetGoZoneGroupPath() 
    {  
        return this.MissionName+"/GO Zone"; 
    }

	/**
     * function which returns the mission folder path of the no go zones
     * @returns {string} the path string
     */
    GetNoGoZonesGroupPath() 
    {  
        return this.MissionName+"/NO GO Zones"; 
    }

	/**
     * function which returns the mission folder path of the trajectory
     * @returns {string} the path string
     */
    GetTrajectoryGroupPath() 
    {  
        return this.MissionName+"/Trajectory"; 
    }

	/**
     * function which returns the mission folder path of main waypoints
     * @returns {string} the path string
     */
    GetWaypointsGroupPath() 
    { 
        return this.MissionName+"/Waypoints"; 
    }

	/**
     * function which returns the mission folder path of back waypoints
     * @returns {string} the path string
     */
    GetWaypointsReturnGroupPath() 
    { 
        return this.MissionName+"/Waypoints_return way"; 
    }

	/**
     * function which returns the mission folder path of the docking waypoint
     * @returns {string} the path string
     */
    GetWaypointDockingGroupPath() 
    {  
        return this.MissionName+"/Waypoint_Docking"; 
    }

	/**
     * Function which creates and exports the json file (ascii)
     * @param {number} iDuration the mission duration in minutes
     * @returns {string} The  json file
     */
	ExportJson(iDuration)
	{
		var missionWaypoints = this.WaypointsTbl.concat(this.WaypointsBackTbl);
		if(this.WaypointDockingFinal != undefined)
			missionWaypoints.push(this.WaypointDockingFinal);

		//header
		var positionUCS = {
			'x': Round(this.UCS.GetValue(0, 3) * scaleFactorToMeters, 5),
			'y': Round(this.UCS.GetValue(1, 3) * scaleFactorToMeters, 5),
            'z': Round(this.UCS.GetValue(2, 3)*scaleFactorToMeters,5)};
        
		var eulerUCS = SQuaternion.ComputeEulerAnglesFromMatrix(this.UCS);
		var qUCS = SQuaternion.CreateQuaternionFromEulerAngles(eulerUCS.RotX, eulerUCS.RotY, eulerUCS.RotZ);
		if(addQuaternionDirectionToDoc)
			qUCS.VerifyQuaternion(SPoint.New(positionUCS.x, positionUCS.y, positionUCS.z));

		var content = {};

		content["version"] = 3;

		var curDate = new Date(Date.now());
		var day = curDate.toISOString().split('T')[0];
		var hour = curDate.toISOString().split('T')[1].split(".")[0];
		var curDateFormated = day.concat("_", hour);

		content["metadata"] = {
			'name': this.MissionName,
			'duration': 60 * iDuration,
			"last_modified_date": curDateFormated,
            "min_blk_arc_ui_version": "v2.0.0" };

		if(this.IsDockingStation)
		{
			content["docking_station"] = { 'pose': { 'position': positionUCS, 'rotation': qUCS }, 'tag_id': 0 };
		}
		else
		{
			content["fiducial"] = { 'pose': { 'position': positionUCS, 'rotation': qUCS }, 'tag_id': 0 };
		}

		//waypoints
		content["waypoints"] = new Array;

		for(var iLab = 0; iLab < missionWaypoints.length; iLab++)
		{
			if(missionWaypoints[iLab].ScanningAction == "High")
				var duration = [{ 'static_scan': { 'duration': 60 } }];
			else if(missionWaypoints[iLab].ScanningAction == "Medium")
				var duration = [{ 'static_scan': { 'duration': 30 } }];
			else if(missionWaypoints[iLab].ScanningAction == "Low")
				var duration = [{ 'static_scan': { 'duration': 10 } }];
			else if(missionWaypoints[iLab].ScanningAction == "None")
				var duration = [];

			if(missionWaypoints[iLab].Type == "D")
				var duration =
					[{ "docking_station": { "pose": { "position": positionUCS, "rotation": qUCS }, "tag_id": 0 } }];

			var waypointPosition = {
				'x': Round(missionWaypoints[iLab].PointInWCS.GetX() * scaleFactorToMeters, 5),
				'y': Round(missionWaypoints[iLab].PointInWCS.GetY() * scaleFactorToMeters, 5),
				'z': Round(missionWaypoints[iLab].PointInWCS.GetZ() * scaleFactorToMeters, 5)
			}

			var tmp = {
				'id': iLab,
				'actions': duration,
				'pose': { 'position': waypointPosition, 'rotation': { "w": 1.0, "x": 0.0, "y": 0.0, "z": 0.0 } },
			};
			content.waypoints.push(tmp);
		}

		//go zones
		var verticesGoZone = new Array;
		for(var iGoZone = 0; iGoZone < this.GoZone.GetNumber() - 1; iGoZone++) //last point not repeated
		{
			var ptGoZone = this.GoZone.GetPoint(iGoZone);

			var tmp = {
				"x": Round(ptGoZone.GetX() * scaleFactorToMeters, 5), //point in WCS and in m
				"y": Round(ptGoZone.GetY() * scaleFactorToMeters, 5),
				"z": Round(ptGoZone.GetZ() * scaleFactorToMeters, 5)
			};
			verticesGoZone.push(tmp);
		}
		content["go_zone"] = { 'vertices': verticesGoZone };

		//no go zones
		content["no_go_zones"] = new Array;
		for(var iNoGoZone = 0; iNoGoZone < this.NoGoZonesTbl.length; iNoGoZone++)
		{
			var verticesNoGoZone = new Array;
            for (var iNoGoZoneV=0;iNoGoZoneV<this.NoGoZonesTbl[iNoGoZone].GetNumber()-1;iNoGoZoneV++)//last point not repeated
			{
				var ptNoGoZone = this.NoGoZonesTbl[iNoGoZone].GetPoint(iNoGoZoneV);

				var tmp = {
					"x": Round(ptNoGoZone.GetX() * scaleFactorToMeters, 5), //point in WCS and in m
					"y": Round(ptNoGoZone.GetY() * scaleFactorToMeters, 5),
					"z": Round(ptNoGoZone.GetZ() * scaleFactorToMeters, 5)
				};

				verticesNoGoZone.push(tmp);
			}
			content["no_go_zones"].push({ 'vertices': verticesNoGoZone });
		}

		//create the json string
		var contentJSON = JSON.stringify(content, null, '\t');

		var currentPath = CurrentScriptPath();
		var jsonFile = GetOpenFolder("Choose where to save JSON file", currentPath);
		if(jsonFile.length == 0)
			ErrorMessage('JSON export cancelled by user');
		var jsonPath = jsonFile + "/";
		jsonFile += "/" + this.MissionName + ".json";

		// Save the data
		var file = SFile.New(jsonFile);
		var name = this.MissionName;
		if(file.Exists()){
        do
            {
                var myDialog = SDialog.New("BLK ARC mission planner: overwrite the result");
                myDialog.AddText("The file " + name + ".json already exists.<br /> Please check if you want to overwrite it.",SDialog.EMessageSeverity.Warning);
                myDialog.AddTextField({
                    id: 'jsonName',
                    name: "JSON Name",
                    value: name,
                    saveValue : false,
                    readOnly: false,
                    canBeEmpty : false})
                myDialog.AddBoolean({
                    id: "overwrite",
                    name: "Overwrite existing file",
                    value: true});
                var dialogResult = myDialog.Run();
                if(dialogResult.ErrorCode != 0)
                    ErrorMessage("Operation canceled");

                name = dialogResult.jsonName;

                file = SFile.New(jsonPath + name + ".json");
            }while(file.Exists()&&dialogResult.overwrite==false)
        }

		if(!file.Open(SFile.WriteOnly))
			ErrorMessage('Failed to write file:' + name + ".json"); // test if we can open the file

		file.Write(contentJSON);

		// Close the file
		file.Close();

		return jsonFile;
	}
}

class SWaypoint
{
	/**
     * Default constructor
     */
	constructor()
	{
		//the label SWaypoint (a SLabel)
		this.Label;

		//the index number of the waypoint (order of the path)
		this.Index;

		//the type of the waypoint (1=Main (default), 2=return, D=docking)
		this.Type = "1";

		//the scanning action to proceed at the waypoint (None(default), Low, Medium, High)
		this.ScanningAction = "None";

		//the corresponding point in UCS (a SPoint)
		this.PointInUCS;

		//the corresponding point in WCS (a SPoint)
		this.PointInWCS;
	}

	/**
    * Function which returns a SWaypoint and creates the corresponding SLabel
    * @param {SMission} iMission, the mission object
    * @param {number} iIndex a suffix number, use to complete the label name
    * @param {SPoint} iPoint the attachment point
    * @param {string} iType the waypoint type
    * @param {string} iAction the scanning action
    * @returns {SWaypoint} The  created SWaypoint
    */
	static CreateWayPoint(iMission, iIndex, iPoint, iType, iAction)
	{
		var oWaypoint = new SWaypoint;

		var newLab = SLabel.New(3, 1);
		newLab.SetColType([SLabel.Measure]);
		newLab.SetLineType([SLabel.XX, SLabel.YY, SLabel.ZZ]);

		newLab.SetCol(0, [iPoint.GetX(), iPoint.GetY(), iPoint.GetZ()]); //WCS coordinates in document unit

		newLab.SetName(iMission.MissionName + "_" + iIndex);
		newLab.SetComment(iType + ") " + iAction);
		newLab.AttachToPoint(iPoint);
		newLab.AddToDoc();

		switch(iType)
		{
			case "1":
				newLab.MoveToGroup(iMission.GetWaypointsGroupPath(), false);
				break;
			case "2":
				newLab.MoveToGroup(iMission.GetWaypointsReturnGroupPath(), false);
				break;
			case "D":
				newLab.MoveToGroup(iMission.GetWaypointDockingGroupPath(), false);
				break;
			default:

				break;
		}

		oWaypoint.Label = newLab;
		oWaypoint.PointInWCS = iPoint;
		var ptCopy = SPoint.New(iPoint);
		var invUCS = SMatrix.New();
		invUCS.InitInverse(iMission.UCS);
		ptCopy.ApplyTransformation(invUCS);
		oWaypoint.PointInUCS = ptCopy;
		oWaypoint.Index = iIndex;
		oWaypoint.Type = iType;
		oWaypoint.ScanningAction = iAction;

		return oWaypoint;
	}

	/**
     * Function to find the SWaypoint from a given SLabel
     * @param {SMission} iMission, the mission defined
     * @param {SLabel} iLabel, the label
     * @returns {SWaypoint} the corresponding waypoint
     */
	static GetWaypointFromLabel(iMission, iLabel)
	{
		for(var i = 0; i < iMission.WaypointsTbl.length; i++)
		{
            if(iMission.WaypointsTbl[i].Label.GetName()==iLabel.GetName() && iLabel.GetPath()=="/"+iMission.GetWaypointsGroupPath())
			{
				return iMission.WaypointsTbl[i];
			}
		}

		for(var i = 0; i < iMission.WaypointsBackTbl.length; i++)
		{
            if(iMission.WaypointsBackTbl[i].Label.GetName()==iLabel.GetName() && iLabel.GetPath()=="/"+iMission.GetWaypointsReturnGroupPath())
			{
				return iMission.WaypointsBackTbl[i];
			}
		}

        if(iMission.WaypointDockingFinal.Label.GetName()==iLabel.GetName() && iLabel.GetPath()=="/"+iMission.GetWaypointDockingGroupPath())
		{
			return iMission.WaypointDockingFinal;
		}
	}


	/**
    * Function to create SWaypoint tbl from SLabel tbl
    * @param {SMission} iMission, the mission defined
    * @param {SLabel[]} iLabelTbl the label table
    * @returns {SWaypoint[]} the waypoint table
    */
	static CreateWaypointsFromLabels(iMission, iLabelTbl)
	{
		var wptTbl = new Array();
		for(var i = 0; i < iLabelTbl.length; i++)
		{
			var curWayPt = new SWaypoint();

			iLabelTbl[i].GetName();
			var pathString = iLabelTbl[i].GetPath();
			var x = iLabelTbl[i].GetCell(0, 0).Value;
			var y = iLabelTbl[i].GetCell(1, 0).Value;
			var z = iLabelTbl[i].GetCell(2, 0).Value;
			var commentString = iLabelTbl[i].GetComment();

			curWayPt.Label = iLabelTbl[i];
			curWayPt.PointInWCS = SPoint.New(x, y, z);
			var ptCopy = SPoint.New(curWayPt.PointInWCS);
			var invUCS = SMatrix.New();
			invUCS.InitInverse(iMission.UCS);
			ptCopy.ApplyTransformation(invUCS);
			curWayPt.PointInUCS = ptCopy;

			curWayPt.Index = i + 1;

			if(pathString.endsWith(iMission.GetWaypointsGroupPath()))
				curWayPt.Type = "1";
			else if(pathString.endsWith(iMission.GetWaypointsReturnGroupPath()))
				curWayPt.Type = "2";
			else if(pathString.endsWith(iMission.GetWaypointDockingGroupPath()))
				curWayPt.Type = "D";

			curWayPt.ScanningAction = commentString.split(" ")[1];

			wptTbl.push(curWayPt);
		}

		return wptTbl;
	}

	/**
     * Function to transform a 'return' waypoint into a 'docking' waypoint
     */
	TransformWaypointIntoDockingWaypoint(iMission)
	{
		this.Label.SetCol(0, [
            iMission.FiducialReturnPoint.GetX(), 
            iMission.FiducialReturnPoint.GetY(), 
            iMission.FiducialReturnPoint.GetZ()
		]);
		this.Label.SetComment("D) " + this.ScanningAction);
		this.Label.MoveToGroup(iMission.GetWaypointDockingGroupPath(), false);
        this.Label.Translate(SVector.New(this.PointInWCS,iMission.FiducialReturnPoint));

        this.PointInWCS=iMission.FiducialReturnPoint;

		var invUCS = SMatrix.New();
		invUCS.InitInverse(iMission.UCS);
        var ptCopy=SPoint.New(iMission.FiducialReturnPoint);
		ptCopy.ApplyTransformation(invUCS);
		this.PointInUCS = ptCopy;

		this.Index = 1;

		this.Type = "D";

		iMission.WaypointsBackTbl.pop();
		iMission.WaypointDockingFinal = this;
	}

	/**
     * Function to set the actions to proceed at a SWaypoint
     */
	SetActions(iScanningAction)
	{
		this.Label.SetComment(this.Type + ") " + iScanningAction);
		this.ScanningAction = iScanningAction;
	}

	/**
     * Function to computing the number of SWaypoints which match a given 'comment'
     * @param {SWaypoint[]} iAllWaypoints, the mission waypoints to export
     * @param {string} iStringToSearch, the string to search in the comment
     * @returns {number} The number of waypoints in which the comment was found
     */
	static ComputeWaypointCountFromComment(iAllWaypoints, iStringToSearch)
	{
		var toRet = 0;
		for(var i = 0; i < iAllWaypoints.length; i++)
		{
			var curCom = iAllWaypoints[i].Label.GetComment().split(" ")[1];
			if(curCom == iStringToSearch)
				toRet++;
		}
		return toRet;
	}
}

class SQuaternion
{
	/**
     * Default constructor
     */
	constructor()
	{
		this.w;
		this.x;
		this.y;
		this.z;
	}

	/**
     * Function to extract Euler rotations from a matrix 
     * @param {SMatrix} iMatrix where rotations are stored
     * @returns {structure} RotX, RotY, RotZ, ErrorCode
     */
	static ComputeEulerAnglesFromMatrix(iMatrix)
	{
		var invMat = SMatrix.New();
		invMat.InitInverse(iMatrix);

		var result = invMat.GetEuler(SMatrix.RADIAN);
		if(result.ErrorCode)
			return { 'RotX': 0, 'RotY': 0, 'RotZ': 0, 'ErrorCode': 1 };

		return { 'RotX': result.RotX, 'RotY': result.RotY, 'RotZ': result.RotZ, 'ErrorCode': 0 };
	}

	/**
     * Function to create a quaternion from Euler rotation
     * @param {number} 1st Euler rotation angle (radians)
     * @param {number} 2nd Euler rotation angle (radians)
     * @param {number} 3rd Euler rotation angle (radians)
     * @returns {SQuaternion} w, x, y, z
     */
	static CreateQuaternionFromEulerAngles(iRotX, iRotY, iRotZ)
	{
        
		var q1 = { 'w': Math.cos(iRotX / 2), 'x': Math.sin(iRotX / 2), 'y': 0, 'z': 0 };
		var q2 = { 'w': Math.cos(iRotY / 2), 'x': 0, 'y': Math.sin(iRotY / 2), 'z': 0 };
		var q3 = { 'w': Math.cos(iRotZ / 2), 'x': 0, 'y': 0, 'z': Math.sin(iRotZ / 2) };

		var q = SQuaternion.MultiplyQuaternion(q3, SQuaternion.MultiplyQuaternion(q2, q1));

		return q;
	}

	/**
     * Function to multiply 2 quaternions
     * @param {SQuaternion} quaternion1
     * @param {SQuaternion} quaternion2
     * return {SQuaternion} quaternion=quaternion1*quaternion2
     */
	static MultiplyQuaternion(q1, q2)
	{
		var q = new SQuaternion();

		var w1 = q1.w;
		var w2 = q2.w;
		var v1 = SVector.New(q1.x, q1.y, q1.z);
		var v2 = SVector.New(q2.x, q2.y, q2.z);

		var w = w1 * w2 - SVector.Dot(v1, v2);
		var vc = SVector.Cross(v1, v2);
		var va = v2.Mult(w1);
		var vb = v1.Mult(w2);
		var v = SVector.New(
			va.GetX() + vb.GetX() + vc.GetX(), va.GetY() + vb.GetY() + vc.GetY(), va.GetZ() + vb.GetZ() + vc.GetZ());

		q.w = w;
		q.x = v.GetX();
		q.y = v.GetY();
		q.z = v.GetZ();

		return q;
	}

	/**
     * function to display a 3D vector at a waypoint (debug purpose)
     * @param {SPoint} the point position x,y,z
     */
	VerifyQuaternion(pos)
	{
		var multi = SMultiline.New();
		multi.InsertLast(SPoint.New(0, 0, 0));
		multi.InsertLast(SPoint.New(1, 0, 0));

		var mat = SMatrix.New();

		mat.InitRot(SPoint.New(0, 0, 0), SVector.New(this.x, this.y, this.z), 2 * Math.acos(this.w), SMatrix.RADIAN);

		multi.ApplyTransformation(mat);

		multi.Translate(SVector.New(
			pos.GetX() / scaleFactorToMeters, pos.GetY() / scaleFactorToMeters, pos.GetZ() / scaleFactorToMeters));

		multi.AddArrows(1, 1);

		multi.AddToDoc();
	}

}

//-------------Dialogs------------

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
 * Function to display a dialog whose goal is to ask a boolean question to the user
 * @param {string} iTitle the popup title
 * @param {string} iQuestion the popup question
 * @param {string} iHelp the mapping explanation of OK/Cancel buttons
 * @returns {bool} the answer (true if OK, false if ESC or Cancel)
 */
function ValidateAStep(iTitle, iQuestion, iHelp)
{
	var answer = true;

    var answer=SDialog.Question(iQuestion+"<br>"+iHelp,iTitle)

	return answer;
}


/**
 * Function to create the contour polyline of a Zone (either 'go' or 'no go') and verify it (no autointersection and compatible with the return point and waypoints)
 * @param {SMission} iMission, the mission defined
 * @param {string} iDialogTitle, the title of the dialog
 * @param {string} iOptionalMsg, an optional message explaining while we repeat the Zone creation
 * @param {string} iDialogInstruction, the dialog instructions
 * @param {number} iOutputColorR, red value of the created object [0,1]
 * @param {number} iOutputColorG, green value of the created object [0,1]
 * @param {number} iOutputColorB, blue value of the created object [0,1]
 * @param {boolean} checkGoOrNoGo true to check the return point complies with the Go zone, false to check the return point complies with a No Go Zone
 * @returns {Map<SMultiline,number,string>} the horizontal multiline zone, an error code and its corresponding message
 */
function CreateZone(
    iMission,
    iDialogTitle,
    iOptionalMsg,
    iDialogInstruction,
    iOutputColorR, 
    iOutputColorG, 
    iOutputColorB,
    checkGoOrNoGo,
	auto)
{
	var errorCode = 0;
	var errorMsg = "";
	var buttonInstructions = "";

	//Instructions dialog
	if(checkGoOrNoGo)
	{
		buttonInstructions="YES=start the zone definition / ESC or NO=Exit Mission Planner";
	}
	else
	{
		buttonInstructions="YES=start the zone definition / ESC or NO=cancel the current No Go Zone";
	}

	var dialogResult = SDialog.Question("<span style='color:red;font-weight: bold;'>"+iOptionalMsg+"</span><br>"+iDialogInstruction+"<br>"+buttonInstructions,iDialogTitle);

	/////////////////////////////////////////////////////////////////////
	if(dialogResult)
	{
		//draw the temp polylines
		var temp3DZone = SMultiline.New();
		// var temp3DZone = 
		temp3DZone.SetColors(0, 0, 1); //temp color
		temp3DZone.SetLineWidth(3);
		temp3DZone.SetName(iMission.MissionName + "_Zone(3D)");

		var temp2DZone = SMultiline.New();
		temp2DZone.SetColors(iOutputColorR, iOutputColorG, iOutputColorB);
		temp2DZone.SetLineWidth(5);
		temp2DZone.SetName(iMission.MissionName + "_Zone(2D)");

		temp2DZone.AddToDoc();
		temp3DZone.AddToDoc();

		if(checkGoOrNoGo)
		{
			temp2DZone.MoveToGroup(iMission.GetGoZoneGroupPath(), false);
			temp3DZone.MoveToGroup(iMission.GetGoZoneGroupPath(), false);
		}
		else
		{
			temp2DZone.MoveToGroup(iMission.GetNoGoZonesGroupPath(), false);
			temp3DZone.MoveToGroup(iMission.GetNoGoZonesGroupPath(), false);
		}

		var allOK = true;
		while(allOK)
		{
			var pointRes = SPoint.FromClick();
			if(pointRes.ErrorCode == 0)
			{ // point clicked by user
				//Add the vertex to the multiline but do not repeat the first point
				if(temp3DZone.GetNumber() > 0)
				{
					if(pointRes.Point.Equals(temp3DZone.GetPoint(0)))
					{
						allOK = false;
						break;
					}
				}

				temp3DZone.InsertLast(pointRes.Point);
				var pointProjection = iMission.RefPlane.Proj3D(pointRes.Point);
				if(!pointProjection.ErrorCode)
				{
					temp2DZone.InsertLast(pointProjection.Point);
				}
				else
				{
					ErrorMessage("The point cannot be projected");
				}
			}
			else // Escape or Enter -> stopping
			{
				allOK = false;
			}
		}

		//remove the temporary 3D multiline
		temp3DZone.RemoveFromDoc();

		if(temp2DZone.GetNumber() > 2)
		{
			temp2DZone.Close();

			//test "autointersection"
			var testAutoIntersection = temp2DZone.GetAutoIntersections(0.00001);

			if(testAutoIntersection.PointTbl.length > 0)
			{
				errorCode = 2;
				errorMsg = "The created multiline auto-intersects";
			}
			else
			{
                //test "return point and previous waypoints are inside or outside the Zone" 
				if(checkGoOrNoGo)
				{
					for(var iwaypt = 0; iwaypt < iMission.WaypointsTbl.length && errorCode != 3; iwaypt++)
					{
						if(!IsWaypointAllowed(iMission.WaypointsTbl[iwaypt].PointInWCS, [temp2DZone], []))
						{
							errorCode = 3;
                            errorMsg=iMission.WaypointsTbl[iwaypt].Label.GetName()+" waypoint is outside the Go Zone";
						}
					}

					for(var iwaypt = 0; iwaypt < iMission.WaypointsBackTbl.length && errorCode != 3; iwaypt++)
					{
						if(!IsWaypointAllowed(iMission.WaypointsBackTbl[iwaypt].PointInWCS, [temp2DZone], []))
						{
							errorCode = 3;
                            errorMsg=iMission.WaypointsTbl[iwaypt].Label.GetName()+" back waypoint is outside the Go Zone";
						}
					}

                    if(iMission.IsDockingStation==true)
                    {
                        if(!IsWaypointAllowed(iMission.FiducialReturnPoint,[temp2DZone],[]) && errorCode!=3)
					{
						errorCode = 3;
                            errorMsg="The return point is outside the Go Zone";
                        }
					}

				}
				else
				{
                    
					for(var iwaypt = 0; iwaypt < iMission.WaypointsTbl.length && errorCode != 4; iwaypt++)
					{
						if(!IsWaypointAllowed(iMission.WaypointsTbl[iwaypt].PointInWCS, [], [temp2DZone]))
						{
							errorCode = 4;
                            errorMsg=iMission.WaypointsTbl[iwaypt].Label.GetName()+" waypoint is inside the NO Go Zone";
						}
					}

					for(var iwaypt = 0; iwaypt < iMission.WaypointsBackTbl.length && errorCode != 4; iwaypt++)
					{
						if(!IsWaypointAllowed(iMission.WaypointsBackTbl[iwaypt].PointInWCS, [], [temp2DZone]))
						{
							errorCode = 4;
                            errorMsg=iMission.WaypointsTbl[iwaypt].Label.GetName()+" back waypoint is inside the NO Go Zone";
						}
					}

                    if(iMission.IsDockingStation==true)
                    {
                        if(!IsWaypointAllowed(iMission.FiducialReturnPoint,[],[temp2DZone]) && errorCode!=4)
					{
						errorCode = 4;
                            errorMsg="The return point is inside the NO Go Zone";
                        }
					}
                    
				}
			}
		}
		else
		{
			errorCode = 1;
			errorMsg = "The multiline created is too small";
		}
		return { 'Zone': temp2DZone, 'ErrorCode': errorCode, 'ErrorMsg': errorMsg };
	}
	else
	{
		if(checkGoOrNoGo)
		{
			ErrorMessage("Operation canceled");
		}
		else
		{
			return { 'Zone': undefined, 'ErrorCode': -1, 'ErrorMsg': "No Go Zone cancelled" };
		}
        
	}
}

/**
  * Function to display a dialog whose goal is to set actions in a given waypoint
  * @returns {string} ScanMode
  */
function AddActionToWaypointDlg()
{
	var modes = ["None = 0s", "Low = 10s", "Medium = 30s", "High = 60s"];
    
    var myDialog = SDialog.New("Add actions to a waypoint");
    myDialog.AddChoices({
        id: "scanMode",
        name: "Add a stationary scan time",
        choices: modes,
        tooltip: "Choose between None, Low, Medium or High",
        value: 0, 
        saveValue: true, 
        readOnly: false,
        style: SDialog.ChoiceRepresentationMode.RadioButtons});
    myDialog.SetButtons(["Validate","Cancel"]);

	var dialogResult = myDialog.Run();

    var scanMode = modes[0];
	if(dialogResult.ErrorCode == 0)
	{
		scanMode = modes[dialogResult.scanMode];
	}
    
	return scanMode
}


/**
 * Function to display a dialog whose goal is to define the mission metadata
 * @returns {SMission} the mission
 */
function CreateMission()
{
	var myMission = new SMission();

	var myDialog = SDialog.New("BLK ARC mission planner: project definition");
    myDialog.SetHeader( "", CurrentScriptPath()+"\\BLKARCMissionPlanner.svg", 48);
    myDialog.AddTextField({
        id: 'missionName',
        name: 'Mission name',
        tooltip : "Give a name to your mission",
        value : 'Mission_',
        saveValue : false,
        readOnly: false,
        canBeEmpty : false});
    myDialog.AddTextField({
        id: 'fiducialUCS',
        name: 'UCS name',
        tooltip : "Give the UCS name which corresponds to the fiducial to use",
        value : 'Fiducial',
        saveValue : false,
        readOnly: false,
        canBeEmpty : false});
    myDialog.AddBoolean({
        id: "isDocking",
        name: "Docking station",
        tooltip: "Is the active UCS related to a docking station?",
        value: true,
        saveValue: false, 
        readOnly: false });
	var dialogResult = myDialog.Run();

	if(dialogResult.ErrorCode != 0)
		ErrorMessage("Operation canceled");

	myMission.MissionName = dialogResult.missionName;

	var matchingUCS = SMatrix.FromUCS(dialogResult.fiducialUCS);
	if(matchingUCS.length != 1)
	{
		ErrorMessage("Cannot find the appropriate UCS: " + matchingUCS.length + " UCS found");
	}

	var ucsMat = SMatrix.New();
	ucsMat.InitInverse(matchingUCS[0]);
	myMission.UCS = ucsMat;

	myMission.IsDockingStation = dialogResult.isDocking;
	if(myMission.IsDockingStation)
    {
        myMission.SetFiducialReturnPoint();
        myMission.SetRefPlane(myMission.FiducialReturnPoint.GetZ());
    }
    else
    {
        myMission.SetRefPlane(myMission.UCS.GetValue(2,3));
    }

	myMission.InitMissionFromDoc();

	return myMission;
}


//-------------Utilities------------

/**
 * Function to scale object to the current document unit coming from a document in meters
 * @param {SComp} iComp the SComp to scale
 * @returns {SComp} The scaled SComp
 */
function ScaleAnObject(iComp)
{
	var scaleFactor = 1 / scaleFactorToMeters;
	var scaleFactorMatrix = SMatrix.New();
	scaleFactorMatrix.InitScale(SPoint.New(0, 0, 0), scaleFactor, scaleFactor, scaleFactor);
	iComp.ApplyTransformation(scaleFactorMatrix);
	return iComp;
}


/**
 * Function to round numbers 
 * @param {number} iNumber The number to round
 * @param {number} iDigits The number of digits
 * @returns the round number
 */
function Round(iNumber, iDigits)
{
	var oNumber = Math.round(iNumber * Math.pow(10, iDigits)) / Math.pow(10, iDigits);
	return oNumber;
}


//-------------Others------------

/**
 * Function to export a mesh  in .GLB
 * @param {string} iFilePath The json filepath (re-used for the reference model)
 */
function ExportReferenceModel(iFilePath)
{
	var scaleFactorMatrix = SMatrix.New();
	scaleFactorMatrix.InitScale(SPoint.New(0, 0, 0), scaleFactorToMeters, scaleFactorToMeters, scaleFactorToMeters);

	while(SDialog.Question("Export a reference model in glb format (visible mesh required)?<br>-If yes: click the corresponding mesh","BLK ARC mission planner: Export a reference model"))
	{
		var isError = false;
		var waitPolyToExport = SPoly.FromClick();
		isError = (waitPolyToExport.ErrorCode != 0);
		if(isError == false)
		{
			var res = waitPolyToExport.Poly.Save(iFilePath, false, scaleFactorMatrix);
			if(res.ErrorCode == 0)
				break;
			else
			{
				isError = true;
			}
		}

		SDialog.Message("Invalid selection.",SDialog.EMessageSeverity.Error,"BLK ARC mission planner: Export a reference model");
	}
}


/**
 * Function to check if a given point is allowed according to go and no go zones
 * @param {SPoint} iPoint 
 * @param {SMultiline[]} iGoZoneTbl the go zone table or empty table
 * @param {SMultiline[]} iNoGoZoneTbl the no go zone table or empty table
 * @returns {boolean} true if allowed
 */
function IsWaypointAllowed(iPoint, iGoZoneTbl, iNoGoZoneTbl)
{
	var isAllowed = true;

	var onePointCloud = SCloud.New();
	onePointCloud.AddPoint(iPoint);

    for(var i=0;i<iGoZoneTbl.length;i++)//The table is used to allow this verification when there is no go Zone yet (that is to say when projecting and verifying the go zone)
	{
		var testGO = onePointCloud.Separate(iGoZoneTbl[i], SVector.New(0, 0, 1), null, null, SCloud.FILL_NONE);
		if(testGO.ErrorCode == 1)
		{
			isAllowed = false;
			break;
		}
	}

	if(isAllowed == true)
	{
		for(var i = 0; i < iNoGoZoneTbl.length; i++)
		{
			var testNOGO = onePointCloud.Separate(iNoGoZoneTbl[i], SVector.New(0, 0, 1), null, null, SCloud.FILL_NONE);
			if(testNOGO.ErrorCode == 2)
			{
				isAllowed = false;
				break;
			}
		}
	}
	return isAllowed;
}


//******************************************//
//										    //
//                Main Function				//
//										    //
//******************************************//
function Main2()
{
	// 1.
	var workflowStep = 1;
	print("Step" + workflowStep + ": Define the mission");
	var myMission = CreateMission();

//********************************************************************************//
//																				  //
//						 STEPS 2 AND 3 ARE FOR GO/NO_GO_ZONES 					  //
//																				  //
//********************************************************************************//

	//********************************************************************************//
	//																				  //
	//                				2. Create the GO zone 			                  //
	//																				  //
	//********************************************************************************//
	workflowStep++;
if (myMission.GoZone == undefined) 
{
    print("Step" + workflowStep + ": Create the GO zone");
    var errorMsg = "";

// working code
	workflowStep++;
	if(myMission.GoZone == undefined)
	{
		ValidateAStep(
			"Stay within", 
			"latitude and longitude values greater than ( Latitude = " + Math.round(ImageLong) + ") (Longitude = " + Math.round(ImageLat) + ")")
		print("Step" + workflowStep + ": Create the GO zone");
		var errorMsg = "";

		do
		{
            var goZoneValid=CreateZone(myMission, "BLK ARC mission planner: create the GO Zone", errorMsg, "Draw the GO Zone multiline", 0, 1, 0, true);
			if(goZoneValid.ErrorCode > 0)
			{
				errorMsg = "ERROR: " + goZoneValid.ErrorMsg;
				goZoneValid.Zone.RemoveFromDoc();
			}
			else
			{
				errorMsg = "";
			}
        }
        while(goZoneValid.ErrorCode>0);

		myMission.GoZone = goZoneValid.Zone;
	}
	else
	{
		print("Step" + workflowStep + ": GO zone already defined");
	}
}
	
	//********************************************************************************//
	//																				  //
	//             					  3. Create NO GO zones 						  //
	//																				  //
	//********************************************************************************//
	workflowStep++;
	if(myMission.NoGoZonesTbl.length == 0)
	{
		print("Step" + workflowStep + ": Create the NO GO zones");
	}
	else
	{
        print("Step"+workflowStep+": Create the NO GO zones ("+myMission.NoGoZonesTbl.length+" already defined)");
	}

	errorMsg = "";
	var count = 1 + myMission.NoGoZonesTbl.length;
	while(ValidateAStep(
		"Create NO GO Zones",
		"Do you want to add a NO GO Zone?(" + count + ")",
		"OK=Yes / CANCEL=No, go to waypoint definition"))
	{
		do
		{
			var noGoZoneValid = CreateZone(
				myMission,
				"BLK ARC mission planner: create the NO GO Zones",
				errorMsg,
				"Draw the NO GO Zone multiline(" + count + ")",
				1,
				0,
				0,
				false);
			if(noGoZoneValid.ErrorCode > 0)
			{
				errorMsg = "ERROR: " + noGoZoneValid.ErrorMsg;
				noGoZoneValid.Zone.RemoveFromDoc();
			}
			else
			{
				errorMsg = "";
			}
        }
        while(noGoZoneValid.ErrorCode>0);

		if(noGoZoneValid.Zone != undefined)
		{
			myMission.NoGoZonesTbl.push(noGoZoneValid.Zone);
			count++;
		}
	}

	//********************************************************************************//
	//																				  //
	//                				4. Add waypoints				            	  //
	//																				  //
	//********************************************************************************//
	workflowStep++;
	print("Step " + workflowStep + ": Add waypoints");
	errorMsg = "";
	count = 1 + myMission.WaypointsTbl.length;

	var allOK = true;
	var imageLat = Math.round(ImageLat);
	var imageLong = Math.round(ImageLong);
	var x = Math.round(initialXValue);
	var y = Math.round(initialYValue);
	var counter = Math.round(ImageLat);
	var multiplier = 1;
	var Ycount = 0;
	var initialYTrack = initialYValue;
	// var actions = AddActionToWaypointDlg(); // GET ACTION FOR ALL WAYPOINTS AT ONCE
	
	// Loop used for multiple executions. 
	for(multiplier; multiplier <= counter; multiplier++)
	{
		// First, move along the X-axis from initialXValue to ImageLong
		for (x = initialXValue; x <= imageLong; x += NewXrecall) 
		{
			print("X value: " + x)
			print("Y vlaue: " + y)
			var NewPointX = new SPoint(x, y, initialZValue); // z should remain as Zero

			//WayPoint Projection
			NewPointX = myMission.RefPlane.Proj3D(NewPointX).Point;

			//waypoint verification (NO_GO/GO_ZONES)
			var verified = IsWaypointAllowed(NewPointX, [myMission.GoZone], myMission.NoGoZonesTbl);
			if(verified)
			{
				NewPointX.SetName(myMission.MissionName + "_" + count);
				NewPointX = myMission.RefPlane.Proj3D(NewPointX).Point;

				// Creation Waypoint
				// var NewWayPoint1X = SWaypoint.CreateWayPoint(myMission, count, NewPointX, "1", "None");
				var NewWayPoint1X = SWaypoint.CreateWayPoint(myMission, count, NewPointX, "1", "Medium");
				// NewWayPoint1X.SetActions(actions); // setting action

				myMission.WaypointsTbl.push(NewWayPoint1X);
				myMission.UpdateDummyPath();
				count++; // Increment the count for each waypoint
			}
			// Sleep(250)
		}

		// Then, move along the Y-axis from initialYValue to 0.3 * ImageLat
		for (initialYValue = y + Ycount; y <= (0.3*multiplier) * imageLat; y += NewYrecall) // THIS IS PROBLEM LINE
		{
			print("Y value: " + y);
			var NewPointY = new SPoint(imageLong, y, initialZValue); // z should remain as Zero

			// WayPoint Projection
			NewPointY = myMission.RefPlane.Proj3D(NewPointY).Point;

			//waypoint verification (NO_GO/GO_ZONES)
			var verified = IsWaypointAllowed(NewPointY, [myMission.GoZone], myMission.NoGoZonesTbl);
			if(verified)
			{
				NewPointY.SetName(myMission.MissionName + "_" + count);

				//Waypoint creation
				// var NewWayPoint1Y = SWaypoint.CreateWayPoint(myMission, count, NewPointY, "1", "None");
				var NewWayPoint1Y = SWaypoint.CreateWayPoint(myMission, count, NewPointY, "1", "Medium");
				// NewWayPoint1Y.SetActions(actions); // setting action

				myMission.WaypointsTbl.push(NewWayPoint1Y);
				myMission.UpdateDummyPath();
				count++; // Increment the count for each waypoint
			}
			// Sleep(250)
		}

		Ycount = initialYValue + 2

		// Finally, move along the negative X-axis from ImageLong back to initialXValue
		for (x = imageLong; x >= initialXValue-1; x -= NewXrecall) 
		{
			print("X value: " + x);
			var NewPointX = new SPoint(x, (multiplier*0.3) * imageLat, initialZValue); // z should remain as Zero

			// WayPoint Projection
			NewPointX = myMission.RefPlane.Proj3D(NewPointX).Point;

			//waypoint verification (NO_GO/GO_ZONES)
			var verified = IsWaypointAllowed(NewPointX, [myMission.GoZone], myMission.NoGoZonesTbl);
			if(verified)
			{
				NewPointX.SetName(myMission.MissionName + "_" + count);

				//Waypoint creation
				// var NewWayPoint1X = SWaypoint.CreateWayPoint(myMission, count, NewPointX, "1", "None");
				var NewWayPoint1X = SWaypoint.CreateWayPoint(myMission, count, NewPointX, "1", "Medium");
				// NewWayPoint1X.SetActions(actions); // setting action

				myMission.WaypointsTbl.push(NewWayPoint1X);
				myMission.UpdateDummyPath();
				count++; // Increment the count for each waypoint
			}
			// Sleep(250)
		}
		print("counter: " + counter);

		// This will take you back to initial point 
		if(multiplier == counter)
		{
			initialXValue == initialXValue
			initialYValue == initialYTrack
			initialZValue == 0

			print("X value: " + x);
			var NewPointXYZ = new SPoint(initialXValue, initialYTrack, initialZValue); // z should remain as Zero

			// WayPoint Projection
			NewPointXYZ = myMission.RefPlane.Proj3D(NewPointXYZ).Point;

			//waypoint verification (NO_GO/GO_ZONES)
			var verified = IsWaypointAllowed(NewPointXYZ, [myMission.GoZone], myMission.NoGoZonesTbl);
			if(verified)
			{
				NewPointX.SetName(myMission.MissionName + "_" + count);

				//Waypoint creation
				var NewWayPoint1XYZ = SWaypoint.CreateWayPoint(myMission, count, NewPointXYZ, "1", "Medium");
				// NewWayPoint1XYZ.SetActions(actions); // setting action


				myMission.WaypointsTbl.push(NewWayPoint1XYZ);
				myMission.UpdateDummyPath();
				count++; // Increment the count for each waypoint
			}
		}
	}
	print("initialX: " + initialXValue)
    print("initialYtrack: " + initialYTrack)

	//********************************************************************************//
	//																				  //
	//                5. if docking station: return path waypoints	     			  //
	//																				  //
	//********************************************************************************//
	workflowStep++;
	print("Step" + workflowStep + ": add return waypoints");
	if(myMission.IsDockingStation)
	{
		errorMsg = "";
		count = 1 + myMission.WaypointsBackTbl.length;

		if(ValidateAStep(
			   "Add return to dock Waypoints",
			   "Click to define return Waypoint? (" + count + ") (Press ESC to stop)",
			   "Yes=Continue / No=go to change waypoints actions"))
		{
			var allOK = true;
			do
			{
				var pointRes = SPoint.FromClick();
                if(pointRes.ErrorCode == 0){ // point clicked by user
					var newPoint = pointRes.Point;

					//waypoint projection
					newPoint = myMission.RefPlane.Proj3D(newPoint).Point;

					//waypoint verification
					var verif = IsWaypointAllowed(newPoint, [myMission.GoZone], myMission.NoGoZonesTbl);
					if(verif)
					{
						newPoint.SetName(myMission.MissionName + "_" + count);

						//Waypoint label creation
						var newWayPoint2 = SWaypoint.CreateWayPoint(myMission, count, newPoint, "2", "None");
						// newWayPoint2.SetActions(actions); // setting action


						myMission.WaypointsBackTbl.push(newWayPoint2);
						myMission.UpdateDummyPath();

						count++;
					}
				}
				else // Escape or Enter -> stopping
				{
					allOK = false;
				}
            }
            while(allOK);

            //add or adjust the return point
			// if(myMission.WaypointDockingFinal == undefined && newPoint != undefined)
			// {
            //     if(newPoint.Distance(myMission.FiducialReturnPoint)<0.5) 
			// 	{
                
			// 		newWayPoint2.TransformWaypointIntoDockingWaypoint(myMission);
			// 	}
			// 	else
			// 	{
            //         var newWayPointDocking=SWaypoint.CreateWayPoint(myMission, 1, myMission.FiducialReturnPoint, "D", 'None');
			// 		myMission.WaypointDockingFinal = newWayPointDocking;
			// 	}
			// 	myMission.UpdateDummyPath();
			// }

		}
	}

	//********************************************************************************//
	//																				  //
	//          				     6. write the json								  //
	//																				  //
	//********************************************************************************//
	workflowStep++;
	print("Step" + workflowStep + ": Create the json");
	var duration = myMission.ComputeMissionDuration();
	var filename = myMission.ExportJson(duration.DurationValue);

	//********************************************************************************//
	//																				  //
	//              			  7. Export a 3D model								  //
	//																				  //
	//********************************************************************************//
	// workflowStep++;
	// print("Step" + workflowStep + ": Export a 3D model");
	// var filenameReferenceMeshTbl = filename.split("/");
	// filenameReferenceMeshTbl.pop();
	// var filenameReferenceMesh = filenameReferenceMeshTbl.join("/");
	// var filepath = filenameReferenceMesh;
	// filenameReferenceMesh = filenameReferenceMesh + "/" + myMission.MissionName + ".glb";
	// ExportReferenceModel(filenameReferenceMesh);

	//********************************************************************************//
	//																				  //
	//                			 8. Duration estimation 							  //
	//																				  //
	//********************************************************************************//
	workflowStep++;
	print("Step" + workflowStep + ": Duration estimation(" + duration.DurationString + ")");
	SDialog.Message(duration.DurationString,SDialog.EMessageSeverity.Info,"Mission duration");

	OpenUrl("file:///" + filepath);

} // Main2() close
Main2();

