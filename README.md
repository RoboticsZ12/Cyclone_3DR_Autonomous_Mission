# Cyclone_3DR_Autonomous_Mission
This repository represents the senior design of Southern Illinois University Edwardsville, SIUE, Mechatronics/Robotics engineering program. The contributors are as follows:

1) Zechariah Georgian (Repo Owner)
2) Jackson Zawitkowski
3) Chen Chen
4) Keagan Zhou
5) Antonio Alvarez
6) Alexancder Karnezis

# Project Description 
Our senior design project consists of designing and implementing a payload for the Boston Dynamics Spot robot dog. 
Our efforts are being supported by both our professor, Mingshoa Zhang and our sponsors at Ameren. 

Ameren has designated us with, as stated previously, creating a payload for the Boston Dynamics robot spot. Our goal is to aid in the measuring of step volatge at Ameren substations. 
Due to the high voltage ratings on Ameren substations, Ameren has requested we create a payload that will be able to read these measurements autonomously, then create a heat map with these readings. 

This task will require our team to generate a design that will enable precise voltage step readings, have precise location of where spot is, and take time stamps of when these measurements are taken. 

Due to spot being a closed loop system, our team must sovle the issue of creating two seperate closed loop systems that will have the ability of running in unison. With the aid of Leica BLK ARC and Spot core technology, we will be able to construct a payload consisting of solenoid foot actuation, Jetson Nano controller acquisition, and multimeter BLE logging communication capabilitites. 

```THIS DOCUMENT IS UP TO DATE AS OF 6/22/2024.```

## Program Progress Updates
The following repository has now been updated with new JavaScript code for Cyclone 3DR. The updated JavaScript file coded by, ZG, can by found by clicking the link below. 
[Click to view JS](Cyclone_3DR/src/TEST.js)

It can also be found within the same directory above, an example code given by Leica Cyclone 3DR. This script enables the user to create a waypoint mission utilizing a mouse and keyboard to assign waypoints to a point cloud image. This script can be found using the below link. 
[Leica Provided Code HERE](Cyclone_3DR/src/Cyclone_Mission_script.js)

```THIS DOCUMENT IS UP TO DATE AS OF 6/24/2024.```

Two seperate branches have now been made. Branch two, which is named TEST2, so far utilizes two functions. The first function is the error message function and the second function is used to call the 3DR file from your own file system. The rest of the code represents the body of the code and is used to execute the variables for the main code. 

```THIS DOCUMENT IS UP TO DATE AS OF 6/26/2024.```

The autonomous waypoint mission is now operational. As seen in the below images, it can clearly be seen the waypoint mission being constructed at the center point of 
the designated fiducial image. Currently, the mission will prompt the user to input the longitude and latitude of the point cloud image.
Once done, the script will ask the desired distance beteween the waypoints. Once these parameters are recieved, the compiler will generate a waypoint mission that 
will stay within the bounds of the longitude and latitude previously described. 

![image001](https://github.com/RoboticsZ12/Cyclone_3DR_Autonomous_Mission/assets/142946153/0c41bc82-530e-4789-bd3c-7afb256e26d2)

As of now, the compiler only generates its mission along the X-axis, then terminates the program. This could be due to the fact of missing logic within the made script.
The goal is to have the waypoint mission do either a zig zag of a waypoint mission, or have the mission generate a square on the image, then make it smaller in increments. 
this has not been implemented yet, however is in the workings. As seen in the next image, it can be seen that the waypoint mission begins at the point of origin of the fiducial marker. 
This will serve as our reference (0,0,0) point on the point cloud data set. 

![image002](https://github.com/RoboticsZ12/Cyclone_3DR_Autonomous_Mission/assets/142946153/0f9ffb7d-51cf-4692-92b0-c339fdb770e2)

```THIS DOCUMENT IS UP TO DATE AS OF 6/28/2024.```

The updates done since previous update is generating a mission that can cycle through multiple missions depending on the Longitude and Latitude values. These values determine how far the mission is able to protrude in the vertical and horizontal directions. There is also a counter variable incorporated into the program to determine how many times the program will generate a rectangle. The image seen below is the result of a "counter" value of 10. 

Later renovations of the script will have the ability to take the user inputs for the latitude and longitude, then generate the required "counter" variable that would be able to fit within the latitude and longitude parameters set by the user. 

![image](https://github.com/RoboticsZ12/Cyclone_3DR_Autonomous_Mission/assets/142946153/2071d4cb-d47b-4692-bb15-b5c6a24d502d)

```THIS DOCUMENT IS UP TO DATE AS OF 6/29/2024. (FINAL UPDATE OF SENIOR DESIGN 1)```

The updates on the VScode copy has not been pushed to the main Github repository yet. Currently the new task is to incorporate the "GO/NO GO ZONES". These zones will be defined by the user and will enable the automated waypoint generation to avoid obstacles on the substations such as transformors. Currently, the zones operate as intended, but the automated waypoint generation stops entirely instead of finding a new avenue for waypoints. 

This solution is currently being addressed and will be the main focus for this semesters project to perfect for our sponsors. 

```THIS DOCUMENT IS UP TO DATE AS OF 8/19/2024. (START OF SENIOR DESIGN 2)```

The updates have now been fully pushed to this GitHub for fixes to the waypoint generation. Before, the auto generation was creating waypoints on top of each other causing there to be quadruple the amount of points needed for the mission. The issue arose from vthe "for()" loop within the Y-axis point generation. The condition that was taken from user was flipped causing the generation to loop the same Y-axis values multiple times. 

Another issue that was resolved was generation of waypoints outside the boundry of the point cloud given. This basically meant that the Spot would attempt to go to a point outside the boundry of the substation. To fix this, bounding boxes called "GO_Zones" and "NO_GO_ZONES" were added to ensure that the point generation does not exceed the boundry made by the user. 

In the image below, you will be able to see the fixed waypoint generation along with two boudning boxes, green and red. The green represent the "GO_ZONES" and the red represents the "NO_GO_ZONES". You will also notice that there are no waypoints within the red box. Spot have on board cameras allowing the robot to navigate around these "NO_GO_ZONES" to the next waypoint vs going through the zone. 

The final fix needed will be fixing the incrementation of the mission. It can be seen that the rectangles change in size upon each round of the mission generation. This is possibly due to the multiplier defined within the program, but this is currently being addressed. 

![image](https://github.com/user-attachments/assets/cbcc0356-4864-4797-8413-3c6ad1277a2a)

```THIS DOCUMENT IS UP TO DATE AS OF 8/27/2024.```
The updates provided below will be the final MAJOR updates to this program. I have now added a docking station method to the program, along with a time duration for the provided run. Once the code is finished compiling, the compiler will generate how long the mission will take to generate. Keep in mind, this is with a Spot velocity of .5m/s. The changes can be seen below. 

The first image represents the user defining where to place the docking station for Spot. Once placed, the program will also generate a fiducial with the docking station as the real life scenario requires. 

![image](https://github.com/user-attachments/assets/e145d257-6111-43a2-895f-fe0c77c0df1a)

![image](https://github.com/user-attachments/assets/e6ecf2bc-db10-4d6c-85b3-0100e5e6439f)

The image provided below shows the message that is displayed at the end of the program that will inform the user how long their mission will take. This is an estimate, but will be able to give the user insight to approxamately how long they should expect their mission to last. 

![image](https://github.com/user-attachments/assets/93c69adf-ac32-496a-b704-79c2c5e2a7ea)

The final image shows the .json file that is extracted when the program finishes. This file is what will be exported to Spot as a G code guide for the waypoint mission. It can also be seen that each waypoint is seen to have an "action". These actions are present for each point and represent how long Spot should stop at each waypoint in seconds. For our cases, it is currently hard coded to stop at each waypoint for 30s. This is an aspect that I would like to incorporate as a user input, but for the time being these values will reamain hard coded. 

![image](https://github.com/user-attachments/assets/95c4d67b-dc87-4059-9bf3-4b8a8bb602a1)

The program is currently up to its best state. Most unwanted code and comments have been removed, and the code has been reformatted in a professional manner. Any updates to the program will be minor adjustments unless testing with Spot returns with a faulty program. 

```THIS DOCUMENT IS UP TO DATE AS OF 9/08/2024.```
