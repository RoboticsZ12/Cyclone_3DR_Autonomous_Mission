//******************************//
//**POSSIBLE EXAMPLE FUNCTIONS**//
//******************************//

// Define the initila x,y,z reference point (Fiducial)
function InitialPt(InitialX, InitialY, InitialZ)
{
// Initial X
    var XYZ = SDialog.New("Initial X,Y,Z Values");    
    XYZ.AddLength({id: 'X', name: "Initial X Pos", value: 0, saveValue: true, readOnly: false});
    
    var iVectoriniitialX = SVector.New(0, 0, 1);

// Initial Y
    XYZ.AddLength({id: 'Y', name: "Initial Y Pos", value: 0, saveValue: true, readOnly: false});
    
    var iVectorinitialY = SVector.New(0, 0, 1);

// Initial Z
    XYZ.AddLength({id: 'Z', name: "Initial Z Pos", value: 0, saveValue: true, readOnly: false});
    
    var iVectorX = SVector.New(0, 0, 1);

    var dialogInitialXYZ = XYZ.Run();
}

// Defining lattitude and longitude of map
function LongLat(Long, Lat)
{
// Latitude
    var LongLatLength = SDialog.New("Latitude Assingment");      
    LongLatLength.AddLength({id: 'Lat', name: "Latitidue Value", value: 0, saveValue: true, readOnly: false});
    
    var iVectorLat = SVector.New(0, 0, 1);

// Longitude
    LongLatLength.AddLength({id: 'Long', name: "Longitude Value", value: 0, saveValue: true, readOnly: false});
    
    var iVectorLongLength = SVector.New(0, 0, 1);

    var dialogLongLat = LongLatLength.Run();
}

// Define number of waypoints wanted
function NumWaypoints(NumPts)
{
    var WantedWaypoints = SDialog.New("Number Waypoint Mission Points");    
    WantedWaypoints.AddLength({id: 'Waypoints', name: "# Waypoints", value: 0, saveValue: true, readOnly: false});
    
    var iVectorWaypoint = SVector.New(0, 0, 1);
}

// Define distance from one waypoint to the next 
function PointIncrementation(IncrementX, IncrementY, IncrementZ)
{
// X Direction
    var IncrementationXYZ = SDialog.New("Increment X,Y,Z");
    IncrementationXYZ.AddLength({id: 'X length', name: "X Increment", value: 0, saveValue: true, readOnly: false});
    
    var iVectorX = SVector.New(0, 0, 2); // Set X Position

// Y Drection 
    IncrementationXYZ.AddLength({id: 'Y length', name: "Y Increment", value: 0, saveValue: true, readOnly: false});
    
    var iVectorY = SVector.New(0, 0, 3); // Set Y Position

// Z Direction
    IncrementationXYZ.AddLength({id: 'Z length', name: "Z Increment", value: 0, saveValue: true, readOnly: false});

    var iVectorZ = SVector.New(0, 0, 4); // Set Z Position 

    var dialogXYZ = IncrementationXYZ.Run();
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

// Error Message Function
function ErrorMessage(iMessage) 
{
    SDialog.Message(iMessage,SDialog.EMessageSeverity.Error,"Error");
    throw new Error(iMessage);
}

// MAIN
InitialPt();

LongLat();

PointIncrementation();

NumWaypoints();

SpotWait();