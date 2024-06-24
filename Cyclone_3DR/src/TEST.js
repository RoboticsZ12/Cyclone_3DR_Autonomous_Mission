//******************************//
//**POSSIBLE EXAMPLE FUNCTIONS**//
//******************************//

// Define the initila x,y,z reference point (Fiducial)
function InitialPt(InitialX, InitialY, InitialZ)
{

}

// Defining lattitude and longitude of map
function LongLat(Long, Lat)
{

}

// Define number of waypoints wanted
function NumWaypoints(NumPts)
{

}

// Define distance from one waypoint to the next (EX: InitialX+1)
// Will need to know what units Cyclone use for "+1"
function PointIncrementation(IncrementX, IncrementY, IncrementZ)
{
// X Direction
    var IncrementationX = SDialog.New("Increment X");
    IncrementationX.AddLength({id: 'X length', name: "X Increment", value: 0, saveValue: true, readOnly: false});
    
    var iVectorX = SVector.New(0, 0, 2); // Set X Position

// Y Drection 
    var IncrementationY = SDialog.New("IncrementY");
    IncrementationY.AddLength({id: 'Y length', name: "Y Increment", value: 0, saveValue: true, readOnly: false});
    
    var iVectorY = SVector.New(0, 0, 3); // Set Y Position

// Z Direction
    var IncrementationZ = SDialog.New("IncrementZ");
    IncrementationZ.AddLength({id: 'Z length', name: "Z Increment", value: 0, saveValue: true, readOnly: false});
   
    // var dialogX = IncrementationX.Run();
    // var dialogY = IncrementationY.Run();
    // var dialogZ = IncrementationZ.Run();

    var iVectorZ = SVector.New(0, 0, 4); // Set Z Position 

    var dialogX = IncrementationX.Run();
    var dialogY = IncrementationY.Run();
    var dialogZ = IncrementationZ.Run();
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
    SpotStop.AddLength({id: 'Stop Time', name: "Time At Stop", value: 0, saveValue: true, readOnly: false});
    var StopResult = SpotStop.Run();
    var iVectorStep = SVector.New(0, 0, 1); 
}

// MAIN
let Duration = 1;
SpotWait(Duration);

PointIncrementation(1,1,1);

// Ask user initial x, y, z (fiducial)
// let InitialX = parseFloat(print("Select starting x coordinate (Type with decimal): "));
// let InitialY = parseFloat(print("Select starting y coordinate (Type with decimal): "));
// let InitialZ = parseFloat(print("Select starting z coordinate (Type with decimal): "));
// InitialPt(InitialX, InitialY, InitialZ); // Call initial point function 


// let Long = parseFloat(print("Enter the Longitude of the station (Type with decimal): "));
// let Lat = parseFloat(print("Enter the Latitude of the station (Type with decimal): "));
// LongLat(Long, Lat); // Call Long/Lat function

// let NumPts = parseInt(print("Enter number of waypoints for this mission: "));
// NumWaypoints(NumPts); // Call Number of Waypoint function 

// let IncrementX = parseInt(print("Enter incrementation in X: "));
// let IncrementY = parseInt(print("Enter incrementation in Y: "));
// let IncrementZ = parseInt(print("Enter incrementation in Z: "));
// PointIncrementation(IncrementX, IncrementY, IncrementZ); // Call point of incrementation function

// let AddPt = parseFloat(print("Select next waypoint mission"));
// AddWaypoint(AddPt); // Call next waypoint function 

// let Duration = parseInt(print("How long should spot wait between each point? (Seconds): "));
// SpotWait(Duration); // call spot robot wait function

// print("Your chosen values are respectively listed: ");
// print("Initial X: " + InitialX + "\nInitial Y: " + InitialY + "\nInitial Z: " + InitialZ
//     + "\nLongitude: " + Long + "\nLatitude: " + Lat + "\nNumber of Points: " + NumPts 
//     + "\nIncrement X: " + IncrementX + "\nIncrement Y" + IncrementY + "\nIncrement Z" + IncrementZ
//     + "\nSpot wait time: " + Duration); 
