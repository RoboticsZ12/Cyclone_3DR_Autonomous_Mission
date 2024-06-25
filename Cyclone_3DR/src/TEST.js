//******************************//
//**POSSIBLE EXAMPLE FUNCTIONS**//
//******************************//

// Define the initila x,y,z reference point (Fiducial)
function InitialPt(InitialX, InitialY, InitialZ) {
    // Create the dialog for Initial X, Y, Z Values
    var XYZ = SDialog.New("Initial X,Y,Z Values");

    // Add input fields for X, Y, Z with initial values
    XYZ.AddLength({id: 'X', name: "Initial X Pos", value: InitialX, saveValue: true, readOnly: false});
    XYZ.AddLength({id: 'Y', name: "Initial Y Pos", value: InitialY, saveValue: true, readOnly: false});
    XYZ.AddLength({id: 'Z', name: "Initial Z Pos", value: InitialZ, saveValue: true, readOnly: false});

    // Run the dialog to get user inputs
    var dialogInitialXYZ = XYZ.Run();

    // Retrieve the initial X, Y, Z values entered by the user
    var initialXValue = dialogInitialXYZ.X;
    var initialYValue = dialogInitialXYZ.Y;
    var initialZValue = dialogInitialXYZ.Z;

    // Validate the initial X value 
    if (initialXValue >= 90 || initialYValue < 0) 
    {
        throw new Error("INVALID");
    }

    // Validate the initial Y value 
    if (initialYValue >= 90 || initialYValue < 0) 
    {
        throw new Error("INVALID");
    }

    // Validate the initial Z value 
    if (initialZValue < 0) 
    {
        throw new Error("INVALID");
    }

    // // Output the initial X, Y, Z values
    // console.log("Initial X Value:", initialXValue);
    // console.log("Initial Y Value:", initialYValue);
    // console.log("Initial Z Value:", initialZValue);

    // // Return the initial X value
    // return initialXValue;
}

// Defining lattitude and longitude of map
function LongLat(Long, Lat)
{
    var LongLatLength = SDialog.New("Latitude/Longitude Assingment");      

    // Input Field Here
    LongLatLength.AddLength({id: 'Lat', name: "Latitidue Value", value: Lat, saveValue: true, readOnly: false});
    LongLatLength.AddLength({id: 'Long', name: "Longitude Value", value: Long, saveValue: true, readOnly: false});

    // User input
    var dialogLongLat = LongLatLength.Run();

    // Lat/Long value retrieval
    var Latitudinal = dialogLongLat.Lat;
    var Longitudinal = dialogLongLat.Long;

    // Validate Lat value of substation
    if (Latitudinal >= 90) 
    {
        throw new Error("Latitude value to large");
    }
    else if(Latitudinal < 0)
    {
        throw new Error("Latitude value to small");
    }

    // Validate Long value of substation
    if(Longitudinal >= 90)
    {
        throw new Error("Longitude value to large");
    }
    else if(Longitudinal < 0)
    {
        throw new Error("Longtitude value to small");
    }
}

// Define number of waypoints wanted
function NumWaypoints(NumPts)
{
    var WantedWaypoints = SDialog.New("Number Waypoint Mission Points");    
    WantedWaypoints.AddLength({id: 'Waypoints', name: "# Waypoints", value: NumPts, saveValue: true, readOnly: false});
    
    // User input
    var dialogWaypoints = WantedWaypoints.Run();

    // Retrieve the initial X, Y, Z values entered by the user
    var WayMission = dialogWaypoints.Waypoints;

    if(WayMission <= 0 || WayMission >= 5000)
    {
        throw new Error("INVALID AMOUNT OF POINTS");
    }
}

// Define distance from one waypoint to the next 
function PointIncrementation(IncrementX, IncrementY, IncrementZ)
{
    var IncrementationXYZ = SDialog.New("Increment X,Y,Z");

    // Setting up user input window
    IncrementationXYZ.AddLength({id: 'X_length', name: "X Increment", value: IncrementX, saveValue: true, readOnly: false});
    IncrementationXYZ.AddLength({id: 'Y_length', name: "Y Increment", value: IncrementY, saveValue: true, readOnly: false});
    IncrementationXYZ.AddLength({id: 'Z_length', name: "Z Increment", value: IncrementZ, saveValue: true, readOnly: false});

    // User input recorded
    var dialogNewXYZ = IncrementationXYZ.Run();

    // Recalling user inputs
    var NewXrecall = dialogNewXYZ.X_length;
    var NewYrecall = dialogNewXYZ.Y_length;
    var NewZrecall = dialogNewXYZ.Z_length;

    // if(NewXrecall > Longitudinal || NewXrecall > Latitudinal)
    // {
    //     throw new Error("Please stay within Long and Lat bounds");
    // }
    // else if(NewYrecall > Longitudinal || NewYrecall > Latitudinal)
    // {
    //     throw new Error("Please stay within Long and Lat bounds");
    // }
    // else if(NewZrecall > Longitudinal || NewZrecall > Latitudinal)
    // {
    //     throw new Error("Please stay within Long and Lat bounds");
    // }
}

// Adding point to position after incrementation
function AddWaypoint(AddPt)
{
    var CurrentPoint = SPoint.New(InitialX, InitialY, InitialZ);
    if(CurrentPoint < Lat && CurrentPoint <= Long)
    {
        CurrentPoint = CurrentPoint.Add(SPoint.New(NumPts,0,0));
    }
    else if(CurrentPoint == Lat && CurrentPoint == Long)
    {
        CurrentPoint = CurrentPoint.Add(SPoint.New(0,NumPts,0));
    }
    else
    {
        ErrorMessage("Outside of Long and Lat boundry!");
    }

}

// Duration of wait time for spot at each point
function SpotWait(Duration)
{
    var SpotStop = SDialog.New("Spot Stop Time");

    // Setting up user input
    SpotStop.AddLength({id: 'Stop_Time', name: "Time At Stop", value: Duration, saveValue: true, readOnly: false});
   
    // User input recorded
    var StopResult = SpotStop.Run();

    // Recalling user input
    var SpotStepValue = StopResult.Stop_Time;

    // Checking input value valid
    if(SpotStepValue <= 0 || SpotStepValue > 10)
    {
        throw new Error("Please choose a resonable stopping value");
    }
}

// Error Message Function
function ErrorMessage(iMessage) 
{
    SDialog.Message(iMessage,SDialog.EMessageSeverity.Error,"Error");
    throw new Error(iMessage);
}

// MAIN
InitialPt(1,1,1);

LongLat(0,0);

PointIncrementation(1,1,1);

NumWaypoints(1);

SpotWait(1);