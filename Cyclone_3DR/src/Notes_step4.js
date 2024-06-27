// 4. Add waypoints
workflowStep++;
print("Step" + workflowStep + ": Add waypoints");
errorMsg = "";
count = 1 + myMission.WaypointsTbl.length;  // myMission = SMission class, WaypointsTbl = empty array for points, .length = returns number of elements within the array

if(ValidateAStep( 
       "Add Waypoints",
       "Click to define Waypoint? (" + count + ") (Press ESC to stop)",
       "Yes=Continue / No=go to 'return' waypoints definition"))
{
    var allOK = true;

    do
    {
        var pointRes = SPoint.FromClick();  // SPoint.FromClick = class for user click
        if(pointRes.ErrorCode == 0)
        { // point clicked by user
            var newPoint = pointRes.Point;  // pointRes = SPoint.FromClick() class

            //waypoint projection
            newPoint = myMission.RefPlane.Proj3D(newPoint).Point; // myMission = SMission class, RefPlane = reference plane (199) setting, newPoint = Point.Point

            //waypoint verification
            // var verified = IsWaypointAllowed(newPoint, [myMission.GoZone], myMission.NoGoZonesTbl);
            // if(verified)
            // {
                newPoint.SetName(myMission.MissionName + "_" + count);

                //Waypoint creation
                var newWayPoint1 = SWaypoint.CreateWayPoint(myMission, count, newPoint, "1", "None");

                myMission.WaypointsTbl.push(newWayPoint1);
                myMission.UpdateDummyPath();

                count++;
            // }
            // else
            // {
            //     ErrorMessage("The point is not valid according to GO-NO GO Zones", false);
            // }
        }
        else // Escape or Enter -> stopping
        {
            allOK = false;
        }
    }
    while(allOK);
}










// autowaypoint
// 4. Add waypoints
workflowStep++;
print("Step" + workflowStep + ": Add waypoints");
errorMsg = "";
count = 1 + myMission.WaypointsTbl.length;

if (ValidateAStep(
        "Add Waypoints",
        "Automatically defining waypoints",
        "Yes=Continue / No=go to 'return' waypoints definition")) {

    // Define the area for waypoint generation (example coordinates)
    var startX = 0;
    var startY = 0;
    var endX = 100;
    var endY = 100;
    var distanceBetweenPoints = 10; // distance between waypoints

    var allOK = true;

    for (var x = startX; x <= endX; x += distanceBetweenPoints) {
        for (var y = startY; y <= endY; y += distanceBetweenPoints) {
            var newPoint = new SPoint(x, y, 0); // assuming a flat plane with z=0

            // Waypoint projection
            newPoint = myMission.RefPlane.Proj3D(newPoint).Point;

            // Waypoint verification
            var verified = IsWaypointAllowed(newPoint, [myMission.GoZone], myMission.NoGoZonesTbl);
            if (verified) {
                newPoint.SetName(myMission.MissionName + "_" + count);

                // Waypoint creation
                var newWayPoint1 = SWaypoint.CreateWayPoint(myMission, count, newPoint, "1", "None");

                myMission.WaypointsTbl.push(newWayPoint1);
                myMission.UpdateDummyPath();

                count++;
            } else {
                ErrorMessage("The point is not valid according to GO-NO GO Zones", false);
                allOK = false;
                break;
            }
        }
        if (!allOK) {
            break;
        }
    }
}
