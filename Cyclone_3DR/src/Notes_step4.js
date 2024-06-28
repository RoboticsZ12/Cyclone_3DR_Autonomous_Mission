// SCRIPT 3

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
// 5. When using a docking station, you can define return waypoints. Press Enter at the end. A waypoint will be added or moved next to the docking station.
// 6. Optionally, modify the waypoints actions.
// 7. Define the folder where to save the .json file. The name of the file will be named according to the name of the mission. This file contains instructions for the BLK ARC
// 8. Optionally, export a mesh in .GLB.
// 9. The duration of the mission is then showed in minutes with intervals every 30 seconds.
// in case of cancellation, check the corresponding mission folder and restart the script (Go, No Go zones and waypoints will be reused)
var initialXValue = 5;
var initialYValue = 5;
var initialZValue = 5;

var ImageLong = 10;
var ImageLat = 10;

var NewXrecall = 1;
var NewYrecall = 1;
var NewZrecall = 1;

var WayMission = 20;


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
    checkGoOrNoGo)
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

	if(dialogResult)
	{
		//draw the temp polylines
		var temp3DZone = SMultiline.New();
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
	var modes = ["None", "Low", "Medium", "High"];
    
    var myDialog = SDialog.New("Add actions to a waypoint");
    myDialog.AddChoices({
        id: "scanMode",
        name: "Add a static scan",
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


/**
 * Main Function
 */
function Main2()
{
	// 1.
	var workflowStep = 1;
	print("Step" + workflowStep + ": Define the mission");
	var myMission = CreateMission();

//********************************************************************************//
//************** CUTTING STEPS 2 AND 3 UNTIL 4 IS OPERATIONAL ********************//
//********************************************************************************//

	// //2. Create the GO zone (I do not think we need this right now)
	// workflowStep++;
	// if(myMission.GoZone == undefined)
	// {
	// 	print("Step" + workflowStep + ": Create the GO zone");
	// 	var errorMsg = "";

	// 	do
	// 	{
    //         var goZoneValid=CreateZone(myMission, "BLK ARC mission planner: create the GO Zone", errorMsg, "Draw the GO Zone multiline", 0, 1, 0, true);
	// 		if(goZoneValid.ErrorCode > 0)
	// 		{
	// 			errorMsg = "ERROR: " + goZoneValid.ErrorMsg;
	// 			goZoneValid.Zone.RemoveFromDoc();
	// 		}
	// 		else
	// 		{
	// 			errorMsg = "";
	// 		}
    //     }
    //     while(goZoneValid.ErrorCode>0);

	// 	myMission.GoZone = goZoneValid.Zone;
	// }
	// else
	// {
	// 	print("Step" + workflowStep + ": GO zone already defined");
	// }

	//// 3. Create NO GO zones (I do not think we need this right now)
	// workflowStep++;
	// if(myMission.NoGoZonesTbl.length == 0)
	// {
	// 	print("Step" + workflowStep + ": Create the NO GO zones");
	// }
	// else
	// {
    //     print("Step"+workflowStep+": Create the NO GO zones ("+myMission.NoGoZonesTbl.length+" already defined)");
	// }

	// errorMsg = "";
	// var count = 1 + myMission.NoGoZonesTbl.length;
	// while(ValidateAStep(
	// 	"Create NO GO Zones",
	// 	"Do you want to add a NO GO Zone?(" + count + ")",
	// 	"OK=Yes / CANCEL=No, go to waypoint definition"))
	// {
	// 	do
	// 	{
	// 		var noGoZoneValid = CreateZone(
	// 			myMission,
	// 			"BLK ARC mission planner: create the NO GO Zones",
	// 			errorMsg,
	// 			"Draw the NO GO Zone multiline(" + count + ")",
	// 			1,
	// 			0,
	// 			0,
	// 			false);
	// 		if(noGoZoneValid.ErrorCode > 0)
	// 		{
	// 			errorMsg = "ERROR: " + noGoZoneValid.ErrorMsg;
	// 			noGoZoneValid.Zone.RemoveFromDoc();
	// 		}
	// 		else
	// 		{
	// 			errorMsg = "";
	// 		}
    //     }
    //     while(noGoZoneValid.ErrorCode>0);

	// 	if(noGoZoneValid.Zone != undefined)
	// 	{
	// 		myMission.NoGoZonesTbl.push(noGoZoneValid.Zone);
	// 		count++;
	// 	}
	// }

	// 4. Add waypoints
	workflowStep++;
	print("Step" + workflowStep + ": Add waypoints");
	errorMsg = "";
	count = 1 + myMission.WaypointsTbl.length;

	if(ValidateAStep(
		   "Add Waypoints",
		   "Click to define Waypoint? (" + count + ") (Press ESC to stop)",
		   "Yes=Continue / No=go to 'return' waypoints definition"))
	{
		var allOK = true;

		
	//**RENOVATED BLOCK**//
	// WayMission = user input for # of waypoints wanted
	// initialXValue = user input for x fiducial point (same for Y and Z)
		// for(var x = initialXValue; x <= Longitude; x += NewXrecall)
		// 	{
		// 		for(var y = initialYValue; y <= Latitude; y += NewYrecall)
		// 			{
		// 				// for(var z = initialZValue; z <= Height; z += NewZrecall)
		// 				// 	{
		// 						var NewPoint = new SPoint(x,y,initialZValue); // z should remain as Zero

		// 						// WayPoint Projection
		// 						NewPoint = myMission.RefPlane.Proj3D(NewPoint).Point;

		// 						// Creation Waypoint
		// 						var NewWayPoint1 = SWaypoint.CreateWayPoint(myMission, count, NewPoint, "1", "None");

		// 						myMission.WaypointsTbl.push(NewWayPoint1);
		// 						myMission.UpdateDummyPath();
				
		// 						// count++;
		// 					// }
		// 			}
		// 			if (!allOK) 
		// 			{
		// 			break;
		// 			}
		// 	}


		//**RENOVATED BLOCK**//
		for(var x = initialXValue; x <= ImageLong; x += NewXrecall)
			{
				var NewPointX = new SPoint(x,initialYValue,initialZValue); // z should remain as Zero

				// WayPoint Projection
				NewPoint = myMission.RefPlane.Proj3D(NewPointX).Point;

				// Creation Waypoint
				var NewWayPoint1X = SWaypoint.CreateWayPoint(myMission, count, NewPointX, "1", "None");

				myMission.WaypointsTbl.push(NewWayPoint1X);
				myMission.UpdateDummyPath();
				
				if(x == ImageLong)
				{
					for(var y = initialYValue; y <= ImageLat; y += NewYrecall)
					{
						var NewPoint = new SPoint(x,y,initialZValue); // z should remain as Zero

						// WayPoint Projection
						NewPoint = myMission.RefPlane.Proj3D(NewPoint).Point;

						// Creation Waypoint
						var NewWayPoint1 = SWaypoint.CreateWayPoint(myMission, count, NewPoint, "1", "None");

						myMission.WaypointsTbl.push(NewWayPoint1);
						myMission.UpdateDummyPath();
					}
					if (!allOK) 
					{
						break;
					}
				}
		
			}
	}

//********************************************************************************//
//******************************** CYCLONE STEP 4 CODE ***************************//
//********************************************************************************//

		// do
		// {
		// 	var pointRes = SPoint.FromClick();
		// 	if(pointRes.ErrorCode == 0)
		// 	{ // point clicked by user
		// 		var newPoint = pointRes.Point;

		// 		//waypoint projection
		// 		newPoint = myMission.RefPlane.Proj3D(newPoint).Point;

		// 		//waypoint verification (Take out the check for now)
		// 		// var verified = IsWaypointAllowed(newPoint, [myMission.GoZone], myMission.NoGoZonesTbl);
		// 		// if(verified)
		// 		// {
		// 			newPoint.SetName(myMission.MissionName + "_" + count);

		// 			//Waypoint creation
		// 			var newWayPoint1 = SWaypoint.CreateWayPoint(myMission, count, newPoint, "1", "None");

		// 			myMission.WaypointsTbl.push(newWayPoint1);
		// 			myMission.UpdateDummyPath();

		// 			count++;
		// 		// }
		// 		// else
		// 		// {
		// 		// 	ErrorMessage("The point is not valid according to GO-NO GO Zones", false);
		// 		// }
		// 	}
		// 	else // Escape or Enter -> stopping
		// 	{
		// 		allOK = false;
		// 	}
        // }
        // while(allOK);
	// }

//********************************************************************************//
//********************* HAVE NOT MADE IT THIS FAR YET! ***************************//
//********************************************************************************//

	//// 5. if docking station: return path waypoints 
	// workflowStep++;
	// print("Step" + workflowStep + ": add return waypoints");
	// if(myMission.IsDockingStation)
	// {
	// 	errorMsg = "";
	// 	count = 1 + myMission.WaypointsBackTbl.length;

	// 	if(ValidateAStep(
	// 		   "Add return to dock Waypoints",
	// 		   "Click to define return Waypoint? (" + count + ") (Press ESC to stop)",
	// 		   "Yes=Continue / No=go to change waypoints actions"))
	// 	{
	// 		var allOK = true;
	// 		do
	// 		{
	// 			var pointRes = SPoint.FromClick();
    //             if(pointRes.ErrorCode == 0){ // point clicked by user
	// 				var newPoint = pointRes.Point;

	// 				//waypoint projection
	// 				newPoint = myMission.RefPlane.Proj3D(newPoint).Point;

	// 				//waypoint verification
	// 				// var verif = IsWaypointAllowed(newPoint, [myMission.GoZone], myMission.NoGoZonesTbl);
	// 				// if(verif)
	// 				// {
	// 					newPoint.SetName(myMission.MissionName + "_" + count);

	// 					//Waypoint label creation
	// 					var newWayPoint2 = SWaypoint.CreateWayPoint(myMission, count, newPoint, "2", "None");

	// 					myMission.WaypointsBackTbl.push(newWayPoint2);
	// 					myMission.UpdateDummyPath();

	// 					count++;
	// 				// }
	// 				// else
	// 				// {
	// 				// 	ErrorMessage("The point is not valid according to GO-NO GO Zones", false);
	// 				// }
	// 			}
	// 			else // Escape or Enter -> stopping
	// 			{
	// 				allOK = false;
	// 			}
    //         }
    //         while(allOK);

    //         //add or adjust the return point
	// 		if(myMission.WaypointDockingFinal == undefined && newPoint != undefined)
	// 		{
    //             if(newPoint.Distance(myMission.FiducialReturnPoint)<0.5) 
	// 			{
                
	// 				newWayPoint2.TransformWaypointIntoDockingWaypoint(myMission);
	// 			}
	// 			else
	// 			{
    //                 var newWayPointDocking=SWaypoint.CreateWayPoint(myMission, 1, myMission.FiducialReturnPoint, "D", 'None');
	// 				myMission.WaypointDockingFinal = newWayPointDocking;
	// 			}
	// 			myMission.UpdateDummyPath();
	// 		}

	// 	}
	// }

// 	// 6. change waypoints actions
// 	workflowStep++;
// 	print("Step" + workflowStep + ": Edit waypoints");
// 	if(ValidateAStep(
// 		   "Change waypoints actions",
// 		   "Do you want to update action in a waypoint (click the corresponding labels)?",
// 		   "Yes / No=go to json export"))
// 	{
// 		var allOK = true;
// 		do
// 		{
// 			var labelRes = SLabel.FromClick();
//             if(labelRes.ErrorCode == 0){ // label clicked by user
// 				if(labelRes.Label.GetPath().endsWith(myMission.GetWaypointsGroupPath())
// 				   || labelRes.Label.GetPath().endsWith(myMission.GetWaypointsReturnGroupPath()))
// 				{
//                     var actions = AddActionToWaypointDlg();

// 					var clickedWaypoint = SWaypoint.GetWaypointFromLabel(myMission, labelRes.Label);
// 					clickedWaypoint.SetActions(actions);
// 				}
//                 else{
// 					ErrorMessage("The clicked label is not in the current mission(or is the Docking waypoint).", false);
// 				}
// 			}
// 			else // Escape or Enter -> stopping
// 			{
// 				allOK = false;
// 			}
//         }
//         while(allOK);
// 	}

// 	// 7. write the json
// 	workflowStep++;
// 	print("Step" + workflowStep + ": Create the json");
// 	var duration = myMission.ComputeMissionDuration();
// 	var filename = myMission.ExportJson(duration.DurationValue);

// 	// 8. Export a 3D model
// 	workflowStep++;
// 	print("Step" + workflowStep + ": Export a 3D model");
// 	var filenameReferenceMeshTbl = filename.split("/");
// 	filenameReferenceMeshTbl.pop();
// 	var filenameReferenceMesh = filenameReferenceMeshTbl.join("/");
// 	var filepath = filenameReferenceMesh;
// 	filenameReferenceMesh = filenameReferenceMesh + "/" + myMission.MissionName + ".glb";
// 	ExportReferenceModel(filenameReferenceMesh);

// 	// 9. Duration estimation
// 	workflowStep++;
// 	print("Step" + workflowStep + ": Duration estimation(" + duration.DurationString + ")");
// 	SDialog.Message(duration.DurationString,SDialog.EMessageSeverity.Info,"Mission duration");

// 	OpenUrl("file:///" + filepath);
}

// 0.
Main2();
