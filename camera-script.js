//Global Variables
const canvas =  document.getElementById("pose-canvas");
const ctx = canvas.getContext("2d");
const curveL = document.getElementById("curveL");
const ctx_curveL = curveL.getContext("2d");
const curveR = document.getElementById("curveR");
const ctx_curveR = curveR.getContext("2d");
const video = document.getElementById("pose-video");

const pose = new Pose({locateFile: (file) => {
    //return `assets/${file}`;
    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
}});

var flag = false, setflag = true;
var e = document.getElementById("dir");
var txt = e.value;
function change(){
    txt = e.value;
    ///console.log(txt);
}

var min = 0, sec = 0;
var param = [], tm1 = 0;

var bezier_points = [];

console.log(window.screen.availWidth)
console.log(window.screen.width)

const config ={
    ///video:{width:70, height:auto}
    video:{ width: 1680, height: 960, fps: 30}
    //video:{ width: 960, height: auto, fps: 30}  //540 height
    //video:{ width: 480, height: 640, fps: 30}
    //video:{ width: 280, height: 440, fps: 30}
};




function resetParam(button)
{
     
    min = 0;
    sec = 0;
    document.getElementById('time').innerHTML=min+":"+sec;
    flag = false;
    e.value = "No";
    bezier_points = [];
    console.log(bezier_points);
    window.location.reload();
}

function setParam(button)
{
    // To set the parameters.

    ///console.log(txt)

    if (flag)
    {
        flag = false;
        button.innerHTML= "Start"; 
    } 
    else 
    {
        if(txt === "No")
        {
            ///console.log("'select' check")
            alert("Please select a direction of walking");
        }
        else
        {
            flag = true;
            timer()
            button.innerHTML= "Stop"; 
        }
           
    }
}

function timer()
{
     // Timer Function, Starts when video starts playing-> This fn has changed.

     var time = setInterval(function(){

        if(!flag){
            clearInterval(time)
        }
        
    	document.getElementById('time').innerHTML=min+":"+sec;
        sec++;

        if(sec == 60)
        {
            sec=0;
            min++;
        }
        
    }, 1000);
}
/*
function toggleStrideLength(button){

// To toggle stride length button between Detect and pause
// Activates only when both right and left step length is in detect mode

    if (strideflag) {

        strideflag = false;
        button.innerHTML= "Detect"; 
    } 
    else {

            strideflag = true;
            button.innerHTML= "Pause"; 
    }
}*/

function distance(x1,y1,x2,y2){

    // calculate eucliedean distance between point(x1,y1) and (x2,y2)

    let a = x2-x1;
    let b = y2-y1;
    let result = Math.sqrt( a*a + b*b);

    return result;
}

function download_csv(){
    //define the heading for each row of the data
    var csv = 'time(in ms), frame_duration(in ms), time(in s), hsL, hsR, hipL.x, hipL.y, kneeL.x, kneeL.y, ankleL.x, ankleL.y, hipR.x, hipR.y, kneeR.x, kneeR.y, ankleR.x, ankleR.y, rk_ang, lk_ang, ra_ang, la_ang, hipR_ang, hipL_ang\n';
    
    //merge the data with CSV
    bezier_points.forEach(function(row) {
            csv += row.join(',');
            csv += "\n";
    });
 

   
    var hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
    hiddenElement.target = '_blank';
    
    //provide the name for the CSV file to be downloaded
    hiddenElement.download = 'gaitData.csv';
    hiddenElement.click();
}



async function main()
{
    // Main function
    // Initialize required variables, load model, etc.
    const download = document.getElementById("dow");
    const setBttn = document.getElementById("bttn3");
    const resetBttn = document.getElementById("bttn4");

    setBttn.onclick = function(){
        setParam(setBttn)
    }

    resetBttn.onclick = function(){
        resetParam(setBttn)
    }

    download.onclick = function(){
        download_csv()
    }

    pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: true,
        smoothSegmentation: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

    pose.onResults(onResults);
    
    //video.src ="http://192.168.43.82:4747/"       //  IP web cam

    //video.playbackRate = 0.2;                // video File
    video.width = config.video.width;
    video.height= config.video.height;

    canvas.width = config.video.width;
    canvas.height = config.video.height;

    //for graph
    curveL.width = config.video.width;
    curveL.height = config.video.height;

    curveR.width = config.video.width;
    curveR.height = config.video.height;

    video.onloadedmetadata = function(e) {
        video.play();
    };


    //Text in canvas
    ctx_curveL.font = "50px Comic Sans MS";
    ctx_curveL.fillStyle = "red";
    ctx_curveL.fillText("Left Leg", 400, 50);

    
    ctx_curveR.font = "50px Comic Sans MS";
    ctx_curveR.fillStyle = "red";
    ctx_curveR.fillText("Right Leg", 400, 50);

    video.addEventListener("play",computeFrame);
}


function calculateAngle(x1,y1,x2,y2,x3,y3){  //Previously calculateHipAngle()
    //  Formula:   a^2 + b^2 - 2abCos(C) = c^2

    let a_sq = ((x2-x1)*(x2-x1)) + ((y2-y1)*(y2-y1));
    let b_sq = ((x3-x2)*(x3-x2)) + ((y3-y2)*(y3-y2));
    let c_sq = ((x3-x1)*(x3-x1)) + ((y3-y1)*(y3-y1));

    let value= (a_sq + b_sq - c_sq)/(2* Math.sqrt(a_sq)* Math.sqrt(b_sq) )
    let angle_rad = Math.acos(value)
    let angle = angle_rad *(180.0 / Math.PI)

    return angle // May be changed to (180 - angle)
}


function onResults(results)
{
    // draw image frame,skeleton points
    // calculate right & left joint angles and display it

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    //console.log(results)


    if(results.poseLandmarks)
    {

        results_cpy=results;
        ////console.log(results.poseLandmarks)
        let eyeL = results.poseLandmarks[2]
        let eyeR = results.poseLandmarks[5]
        let shoulderL = results.poseLandmarks[11]
        let shoulderR = results.poseLandmarks[12]
        let hipL = results.poseLandmarks[23]
        let hipR = results.poseLandmarks[24]
        let kneeL = results.poseLandmarks[25]
        let kneeR = results.poseLandmarks[26]
        let ankleL = results.poseLandmarks[27]
        let ankleR = results.poseLandmarks[28]
        let heelL = results.poseLandmarks[29]
        let heelR = results.poseLandmarks[30]
        let foot_indexR = results.poseLandmarks[32];
        let foot_indexL = results.poseLandmarks[31];



        if(txt === "LR"){
            hsL = heelL.x - hipL.x;
            hsR = heelR.x - hipR.x;
        }
        if( txt === "RL"){
            hsL = hipL.x - heelL.x;
            hsR = hipR.x - heelR.x;
        }

        
            if(flag)
            {
                    //Storing values in csv for Bezier curves
                    var tm = new Date();
                        

                    var data = [];
                    data.push(tm.getMilliseconds());
                    data.push(tm.getMilliseconds() - tm1);
                    data.push(tm.getSeconds());
                    data.push(hsL*video.width);  
                    data.push(hsR*video.width);

                    //Storing values in csv for Bezier curves
                    data.push(hipL.x*video.width)
                    data.push(hipL.y*video.height)
                    data.push(kneeL.x*video.width)
                    data.push(kneeL.y*video.height)
                    data.push(ankleL.x*video.width)
                    data.push(ankleL.y*video.height)

                    data.push(hipR.x*video.width)
                    data.push(hipR.y*video.height)
                    data.push(kneeR.x*video.width)
                    data.push(kneeR.y*video.height)
                    data.push(ankleR.x*video.width)
                    data.push(ankleR.y*video.height)
        

                    
                    //Left leg bezier curves
                    ctx_curveL.beginPath();
                    ctx_curveL.moveTo(hipL.x*video.width, hipL.y*video.height );
                    ctx_curveL.quadraticCurveTo(kneeL.x*video.width, kneeL.y*video.height, ankleL.x*video.width, ankleL.y*video.height);
                    ctx_curveL.stroke();

                
                    //Right leg Bezier curves
                    ctx_curveR.beginPath();
                    ctx_curveR.moveTo(hipR.x*video.width, hipR.y*video.height );
                    ctx_curveR.quadraticCurveTo(kneeR.x*video.width, kneeR.y*video.height, ankleR.x*video.width, ankleR.y*video.height);
                    ctx_curveR.stroke();


                    //Right Knee Angle  & Left Knee Angle 
                    let rk_val = (180 -  calculateAngle(hipR.x, hipR.y, kneeR.x, kneeR.y, ankleR.x, ankleR.y)).toFixed(2)
                    let lk_val = (180 -  calculateAngle(hipL.x, hipL.y, kneeL.x, kneeL.y, ankleL.x, ankleL.y)).toFixed(2)
                    document.getElementById("k-angle-R").innerHTML = rk_val;
                    document.getElementById("k-angle-L").innerHTML = lk_val;

                    // Right Ankle Angle &  Left Ankle Angle  //ra_val - 90 should be there
                    let ra_val = (calculateAngle(kneeR.x, kneeR.y, ankleR.x, ankleR.y,foot_indexR.x, foot_indexR.y) - 90).toFixed(2);
                    let la_val = (calculateAngle(kneeL.x, kneeL.y, ankleL.x, ankleL.y,foot_indexL.x, foot_indexL.y) - 90).toFixed(2);
                    document.getElementById("ank-angle-R").innerHTML = ra_val;
                    document.getElementById("ank-angle-L").innerHTML = la_val;

                    // Hip Angle
                    let hipR_val = (180 - calculateAngle(shoulderR.x, shoulderR.y, hipR.x, hipR.y, kneeR.x, kneeR.y)).toFixed(2)
                    let hipL_val = (180 - calculateAngle(shoulderL.x, shoulderL.y, hipL.x, hipL.y, kneeL.x, kneeL.y)).toFixed(2)
                    document.getElementById("hip-angle-R").innerHTML = (180 - calculateAngle(shoulderR.x, shoulderR.y, hipR.x, hipR.y, kneeR.x, kneeR.y)).toFixed(2)
                    document.getElementById("hip-angle-L").innerHTML = (180 - calculateAngle(shoulderL.x, shoulderL.y, hipL.x, hipL.y, kneeL.x, kneeL.y)).toFixed(2)
                    
                    //Storing joint angles in csv file
                    data.push(rk_val);
                    data.push(lk_val);
                    data.push(ra_val);
                    data.push(la_val);
                    data.push(hipR_val);
                    data.push(hipL_val);

                    tm1 = tm.getMilliseconds();
                    bezier_points.push(data);
                }

        }

    drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS,{color: '#00FF00', lineWidth: 4});
    drawLandmarks(ctx, results.poseLandmarks,{color: '#FF0000', lineWidth: 1});


}


async function computeFrame()
{
    
    await pose.send({image: video});
    //requestAnimationFrame(computeFrame);
    setTimeout(computeFrame, 1000 / 10);
}


async function init_camera_canvas()
{
    const constraints ={
        audio: false,
        video:{
        width: config.video.width,           
        height: config.video.height,
        facingMode: 'environment',
        frameRate: { max: config.video.fps }
        }
    };
    
    video.width = config.video.width;     
    video.height= config.video.height;

    canvas.width = config.video.width;
    canvas.height = config.video.height;
    console.log("Canvas initialized");

    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
        video.srcObject = stream;
        main();
    });

}

document.addEventListener("DOMContentLoaded",function(){
    init_camera_canvas();
});
