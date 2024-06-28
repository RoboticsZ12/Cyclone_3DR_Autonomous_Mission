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

![image002](https://github.com/RoboticsZ12/Cyclone_3DR_Autonomous_Mission/assets/142946153/0f9ffb7d-51cf-4692-92b0-c339fdb770e2)

As of now, the compiler only generates its mission along the X-axis, then terminates the program. This could be due to the fact of missing logic within the made script.
The goal is to have the waypoint mission do either a zig zag of a waypoint mission, or have the mission generate a square on the image, then make it smaller in increments. 
this has not been implemented yet, however in the workings. As seen in the next image, it can be seen that the waypoint mission begins at the point of origin of the fiducial marker. 
This will serve as our reference (0,0,0) point on the point cloud data set. 

![image001](https://github.com/RoboticsZ12/Cyclone_3DR_Autonomous_Mission/assets/142946153/0c41bc82-530e-4789-bd3c-7afb256e26d2)

```THIS DOCUMENT IS UP TO DATE AS OF 6/28/2024.```
