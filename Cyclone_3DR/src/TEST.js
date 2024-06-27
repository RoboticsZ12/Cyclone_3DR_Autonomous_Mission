//******************************//
//**POSSIBLE EXAMPLE FUNCTIONS**//
//******************************//

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
// MAIN
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

		do
		{
			var pointRes = SPoint.FromClick();
			if(pointRes.ErrorCode == 0)
			{ // point clicked by user
				var newPoint = pointRes.Point;

				//waypoint projection
				newPoint = myMission.RefPlane.Proj3D(newPoint).Point;

				//waypoint verification
				var verified = IsWaypointAllowed(newPoint, [myMission.GoZone], myMission.NoGoZonesTbl);
				if(verified)
				{
					newPoint.SetName(myMission.MissionName + "_" + count);

					//Waypoint creation
					var newWayPoint1 = SWaypoint.CreateWayPoint(myMission, count, newPoint, "1", "None");

					myMission.WaypointsTbl.push(newWayPoint1);
					myMission.UpdateDummyPath();

					count++;
				}
				else
				{
					ErrorMessage("The point is not valid according to GO-NO GO Zones", false);
				}
			}
			else // Escape or Enter -> stopping
			{
				allOK = false;
			}
        }
        while(allOK);
	}



// Open an existing 3DR file
    var myfileName = GetOpenFileName("Select the file to open", "3DR files (*.3dr)", "C://"); // Define the path and the name of your file
    if (myfileName.length == 0)
    {
        ErrorMessage("Operation cancelcyed");
    }

    openMyproject(myfileName);

// Create the dialog for Initial X, Y, Z Values
    var XYZ = SDialog.New("Initial X,Y,Z Values");

    // Add input fields for X, Y, Z with initial values
    XYZ.AddLength({id: 'X', name: "Initial X Pos", value: 0, saveValue: true, readOnly: false});
    XYZ.AddLength({id: 'Y', name: "Initial Y Pos", value: 0, saveValue: true, readOnly: false});
    XYZ.AddLength({id: 'Z', name: "Initial Z Pos", value: 0, saveValue: true, readOnly: false});

    // Run the dialog to get user inputs
    var dialogInitialXYZ = XYZ.Run();

    // Check if "Cancel" button is pressed
    if (dialogInitialXYZ.ErrorCode == 1) 
    {
        var imessage = "User Has Terminated Sequence";
        ErrorMessage(imessage);
    }
    else
    {
        // Retrieve the initial X, Y, Z values entered by the user
        var initialXValue = dialogInitialXYZ.X;
        var initialYValue = dialogInitialXYZ.Y;
        var initialZValue = dialogInitialXYZ.Z;

        // Validate the initial X value 
        if (initialXValue >= 90 || initialYValue < 0) 
        {
            var imessage = "Invalid X or Y Value";
            ErrorMessage(imessage);
        }

        // Validate the initial Y value 
        if (initialYValue >= 90 || initialYValue < 0) 
        {
            var imessage = "Invalid X or Y Value";
            ErrorMessage(imessage);
        }

        // Validate the initial Z value 
        if (initialZValue < 0) 
        {
            var imessage = "Invalid Z Value";
            ErrorMessage(imessage);
        }
    }   

// Number of Waypoints
    var WantedWaypoints = SDialog.New("Number Waypoint Mission Points");
    
    // Run the dialog to get user inputs
    WantedWaypoints.AddLength({id: 'Waypoints', name: "# Waypoints", value: 0, saveValue: true, readOnly: false});
        
    // User input
    var dialogWaypoints = WantedWaypoints.Run();

    // Check if "Cancel" button is pressed
    if (dialogWaypoints.ErrorCode == 1) 
    {
        var imessage = "User Has Terminated Sequence";
        ErrorMessage(imessage);
    }
    else
    {
        // Retrieve the initial X, Y, Z values entered by the user
        var WayMission = dialogWaypoints.Waypoints;
        
        if(WayMission <= 0 || WayMission >= 5000)
        {
            var imessage = "Invalid Waypoint Value";
            ErrorMessage(imessage);
        }
    }

// Incrementation of new XYZ
    var IncrementationXYZ = SDialog.New("Increment X,Y,Z");

    // Setting up user input window
    IncrementationXYZ.AddLength({id: 'X_length', name: "X Increment", value: 0, saveValue: true, readOnly: false});
    IncrementationXYZ.AddLength({id: 'Y_length', name: "Y Increment", value: 0, saveValue: true, readOnly: false});
    IncrementationXYZ.AddLength({id: 'Z_length', name: "Z Increment", value: 0, saveValue: true, readOnly: false});
    
    // User input recorded
    var dialogNewXYZ = IncrementationXYZ.Run();

    // Check if "Cancel" button is pressed
    if (dialogNewXYZ.ErrorCode == 1) 
    {
        var imessage = "User Has Terminated Sequence";
        ErrorMessage(imessage);
    }
    else
    {
        // Recalling user inputs
        var NewXrecall = dialogNewXYZ.X_length;
        var NewYrecall = dialogNewXYZ.Y_length;
        var NewZrecall = dialogNewXYZ.Z_length;
    }

// Duration of wait time for spot at each point
    var SpotStop = SDialog.New("Spot Stop Time");

    // Setting up user input
    SpotStop.AddLength({id: 'Stop_Time', name: "Time At Stop", value: 0, saveValue: true, readOnly: false});

    // User input recorded
    var StopResult = SpotStop.Run();

    // Check if "Cancel" button is pressed
    if (StopResult.ErrorCode == 1) 
    {
        var imessage = "User Has Terminated Sequence";
        ErrorMessage(imessage);
    }
    else
    {
        // Recalling user input
        var SpotStepValue = StopResult.Stop_Time;
    
        // Checking input value valid
        if(SpotStepValue <= 0 || SpotStepValue > 10)
        {
            var imessage = "Invalid Spot Wait Time";
            ErrorMessage(imessage);
        }  
    }
    
    // Printing all Variables
    print("Chosen Reference Pts: " + initialXValue + " X, " + initialYValue + " Y, " + initialZValue + " Z");
    print("Chosen # Waypoint: " + WayMission);
    print("XYZ Incrementation Values: " + NewXrecall + " X, " + NewYrecall + " Y, " + NewZrecall + " Z");
    print("Set Wait Time: " + SpotStepValue);



// 	// 4. Add waypoints
// var workflowStep = 1;
// workflowStep++;
// print("Step" + workflowStep + ": Add waypoints");
// errorMsg = "";
// count = 1 + myMission.WaypointsTbl.length;

// if (ValidateAStep(
//         "Add Waypoints",
//         "Automatically defining waypoints",
//         "Yes=Continue / No=go to 'return' waypoints definition")) {

//     // Define the area for waypoint generation (example coordinates)
//     var startX = 0;
//     var startY = 0;
//     var endX = 100;
//     var endY = 100;
//     var distanceBetweenPoints = 10; // distance between waypoints

//     var allOK = true;

//     for (var x = startX; x <= endX; x += distanceBetweenPoints) {
//         for (var y = startY; y <= endY; y += distanceBetweenPoints) {
//             var newPoint = new SPoint(x, y, 0); // assuming a flat plane with z=0

//             // Waypoint projection
//             newPoint = myMission.RefPlane.Proj3D(newPoint).Point;

//             // Waypoint verification
//             var verified = IsWaypointAllowed(newPoint, [myMission.GoZone], myMission.NoGoZonesTbl);
//             if (verified) {
//                 newPoint.SetName(myMission.MissionName + "_" + count);

//                 // Waypoint creation
//                 var newWayPoint1 = SWaypoint.CreateWayPoint(myMission, count, newPoint, "1", "None");

//                 myMission.WaypointsTbl.push(newWayPoint1);
//                 myMission.UpdateDummyPath();

//                 count++;
//             } else {
//                 ErrorMessage("The point is not valid according to GO-NO GO Zones", false);
//                 allOK = false;
//                 break;
//             }
//         }
//         if (!allOK) {
//             break;
//         }
//     }
// }

