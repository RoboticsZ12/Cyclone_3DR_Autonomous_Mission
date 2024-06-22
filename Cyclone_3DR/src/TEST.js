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

}

// Adding point to position after incrementation
function AddWaypoint(AddPt)
{

}

// Duration of wait time for spot at each point
function SpotWait(Duration)
{
    
}

// MAIN

// Ask user initial x, y, z (fiducial)
let InitialX = parseFloat(prompt("Select starting x coordinate (Type with decimal): "));
let InitialY = parseFloat(prompt("Select starting y coordinate (Type with decimal): "));
let InitialZ = parseFloat(prompt("Select starting z coordinate (Type with decimal): "));
InitialPt(InitialX, InitialY, InitialZ); // Call initial point function 


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
