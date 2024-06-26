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

// Open an existing 3DR file
    var myfileName = GetOpenFileName("Select the file to open", "3DR files (*.3dr)", "C://"); // Define the path and the name of your file
    if (myfileName.length == 0)
    {
        ErrorMessage("Operation canceled");
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
    
    // Retrieve the initial X, Y, Z values entered by the user
    var WayMission = dialogWaypoints.Waypoints;
    
    if(WayMission <= 0 || WayMission >= 5000)
    {
        var imessage = "Invalid Waypoint Value";
        ErrorMessage(imessage);
    }

// Incrementation of new XYZ
    var IncrementationXYZ = SDialog.New("Increment X,Y,Z");

    // Setting up user input window
    IncrementationXYZ.AddLength({id: 'X_length', name: "X Increment", value: 0, saveValue: true, readOnly: false});
    IncrementationXYZ.AddLength({id: 'Y_length', name: "Y Increment", value: 0, saveValue: true, readOnly: false});
    IncrementationXYZ.AddLength({id: 'Z_length', name: "Z Increment", value: 0, saveValue: true, readOnly: false});
    
    // User input recorded
    var dialogNewXYZ = IncrementationXYZ.Run();
    
    // Recalling user inputs
    var NewXrecall = dialogNewXYZ.X_length;
    var NewYrecall = dialogNewXYZ.Y_length;
    var NewZrecall = dialogNewXYZ.Z_length;
    
// Duration of wait time for spot at each point
    var SpotStop = SDialog.New("Spot Stop Time");

    // Setting up user input
    SpotStop.AddLength({id: 'Stop_Time', name: "Time At Stop", value: 0, saveValue: true, readOnly: false});

    // User input recorded
    var StopResult = SpotStop.Run();

    // Recalling user input
    var SpotStepValue = StopResult.Stop_Time;

    // Checking input value valid
    if(SpotStepValue <= 0 || SpotStepValue > 10)
    {
        var imessage = "Invalid Spot Wait Time";
        ErrorMessage(imessage);
    }  
    
    // Printing all Variables
    print("Chosen Reference Pts: " + initialXValue + " X, " + initialYValue + " Y, " + initialZValue + " Z");
    print("Chosen # Waypoint: " + WayMission);
    print("XYZ Incrementation Values: " + NewXrecall + " X, " + NewYrecall + " Y, " + NewZrecall + " Z");
    print("Set Wait Time: " + SpotStepValue);

    

// Defining lattitude and longitude of map
// function LongLat(Long, Lat)
// {
//     var LongLatLength = SDialog.New("Latitude/Longitude Assingment");      

//     // Input Field Here
//     LongLatLength.AddLength({id: 'Lat', name: "Latitidue Value", value: Lat, saveValue: true, readOnly: false});
//     LongLatLength.AddLength({id: 'Long', name: "Longitude Value", value: Long, saveValue: true, readOnly: false});

//     // User input
//     var dialogLongLat = LongLatLength.Run();

//     // Lat/Long value retrieval
//     var Latitudinal = dialogLongLat.Lat;
//     var Longitudinal = dialogLongLat.Long;

//     // Validate Lat value of substation
//     if (Latitudinal >= 90) 
//     {
//         throw new Error("Latitude value to large");
//     }
//     else if(Latitudinal < 0)
//     {
//         throw new Error("Latitude value to small");
//     }

//     // Validate Long value of substation
//     if(Longitudinal >= 90)
//     {
//         throw new Error("Longitude value to large");
//     }
//     else if(Longitudinal < 0)
//     {
//         throw new Error("Longtitude value to small");
//     }
// }

// Adding point to position after incrementation
// function AddWaypoint(AddPt)
// {
//     var CurrentPoint = SPoint.New(InitialX, InitialY, InitialZ);
//     if(CurrentPoint < Lat && CurrentPoint <= Long)
//     {
//         CurrentPoint = CurrentPoint.Add(SPoint.New(NumPts,0,0));
//     }
//     else if(CurrentPoint == Lat && CurrentPoint == Long)
//     {
//         CurrentPoint = CurrentPoint.Add(SPoint.New(0,NumPts,0));
//     }
//     else
//     {
//         ErrorMessage("Outside of Long and Lat boundry!");
//     }
// }
