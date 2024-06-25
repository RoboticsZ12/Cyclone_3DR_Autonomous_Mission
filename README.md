# Cyclone_3DR_Autonomous_Mission
This repository represents the senior design of Southern Illinois University Edwardsville, SIUE, Mechatronics/Robotics engineering program. The contributors are as follows:

1) Zechariah Georgian (Repo Owner)
2) Jackson Zawitkowski
3) Chen Chen
4) Keagan Zhou
5) Antonio Alvarez
6) Alexancder Karnezis

## Project Description 
Our senior design project consists of designing and implementing a payload for the Boston Dynamics Spot robot dog. 
Our efforts are being supported by both our professor, Mingshoa Zhang and our sponsors at Ameren. 

Ameren has designated us with, as stated previously, creating a payload for the Boston Dynamics robot spot. Our goal is to aid in the measuring of step volatge at Ameren substations. 
Due to the high voltage ratings on Ameren substations, Ameren has requested we create a payload that will be able to read these measurements autonomously, then create a heat map with these readings. 

This task will require our team to generate a design that will enable precise voltage step readings, have precise location of where spot is, and take time stamps of when these measurements are taken. 

Due to spot being a closed loop system, our team must sovle the issue of creating two seperate closed loop systems that will have the ability of running in unison. With the aid of Leica BLK ARC and Spot core technology, we will be able to construct a payload consisting of solenoid foot actuation, Jetson Nano controller acquisition, and multimeter BLE logging communication capabilitites. 

This document is up to date as of 6/22/2024. 

The following repository has now been updated with new JavaScript code for Cyclone 3DR. The updated JavaScript file coded by, ZG, can by found by clicking the link below. 
[Click me to download](Cyclone_3DR/src/TEST.js)
