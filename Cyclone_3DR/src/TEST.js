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
function Spotwait(Duration)
{
    
}

// MAIN

// Ask user initial x, y, z (fiducial)
let InitialX = parseFloat(prompt("Select starting x coordinate (Type with decimal): "));
let InitialY = parseFloat(prompt("Select starting y coordinate (Type with decimal): "));
let InitialZ = parseFloat(prompt("Select starting z coordinate (Type with decimal): "));
InitialPt(); // Call initial point function 


let Long = parseFloat(prompt("Enter the Longitude of the station (Type with decimal): "));
let Lat = parseFloat(prompt("Enter the Latitude of the station (Type with decimal): "));
LongLat(); // Call Long/Lat function

let NumPts = parse(prompt("Enter number of waypoints for this mission: "));
NumWaypoints(); // Call Number of Waypoint function 

let IncrementX = parse(prompt("Enter incrementation in X: "));
let IncrementY = parse(prompt("Enter incrementation in Y: "));
let IncrementZ = parse(prompt("Enter incrementation in Z: "));
PointIncrementation(); // Call point of incrementation function

let AddPt = parseFloat(prompt("Select next waypoint mission"));
AddWaypoint(); // Call next waypoint function 

let Spotwait = parse(prompt("How long should spot wait between each point? (Seconds): "));
Spotwait(); // call spot robot wait function