let midiArrayRaw
let midiData
var i
var j
let timeSigNum //time signature denominator
let timeSigDen //time signature numerator
let clock //midi clock time
let tempo //tempo per quarter note in microseconds
let tempoMap = [] //store tempo and time data for midi with variable tempo
let numNotes //total number of note messages
let canvasWidth = 1920
let canvasHeight = 1080
let bufferVert = 20
let bufferHor = 80
let alignX = 20
let alignY = 20
let fontSize = 16
let titleTextSize = 30 //size of song title
let ppqn //parts per quarter note
let timeInBar //time for one bar to complete in seconds
let timeInBarMidi //msg time for one bar
let totalTimeMidi = 0 //time in ppqn summed up
let midiNotes = {} //dictionary of note pitches
let noteHeight = 0
//let noteMsgCount = 0
let timeInMidiSeconds = 0
let fps = 60
var notesDrawn = [] //array of note objects
let initW = 0 //for aesthetic loading bar width (does not affect visualizer function)
let fade = -10 //alpha value for fading in and out stuff
let fadeAmount //rate of fading
let moveX = -1.5*bufferHor //for bracket X position
let moveX2 = canvasWidth+1.5*bufferHor //for bracket X position
let percentage = 0 //percentage for completion rate
let actualTime = 0 //track actual time in seconds
let pitchRange = [] //track range of pitches used
let pitchMax //max pitch
let pitchMin //min pitch
let barsToDisplay = 2 //number of bars to display in visualizer, default is 1
let songDuration //total song duration in seconds
let songTitle = "A very very very very long title" //song title text
let startButton
let captureButton
let frameCountClicked = 0 //stores frame count when "start capture" button is clicked
let frameCountIsStored = 0 //check if frame count when "start capture" button is clicked has been stored
let titleInput
let frameInput
let checkFrameInput //check if user frame input is a valid integer
let deltaTimeFps = (1/fps)*1000; //custom deltaTime but fixed to fps, to prevent issues during capture due to very slow frame draw rate (only used in aesthetic functions, not in midi)

//Menu & formatting variables
let menuAlignX = 10
let menuFooterY = 1000 //stuff in the footer goes below this
let gif_createImg //for loading gif file
let noteColour = "black"
let bgColour = "#d1cdb7"

//User message variables
let isTypeZero  //set to true if midi is type 0 format, false if otherwise
let userMsgMidiType = "" //Msg to show user if midi type is correct or not
let userMsgFrame = "" //Msg to display if frame input is invalid

/////////////////CCAPTURE////////////////////////
let captureLength;
let capturer = new CCapture({
  format: "webm",
  frameRate: 60,
});
//////////////////////////////////////////////////

function handleMidi(file) {

  //text(`${file.type}/${file.subtype}`, 10, 70);
  
  if(file.subtype === 'mid') {
    
    const reader = new FileReader();
    reader.onload = function(e) {
      const arrayBuffer = new Uint8Array(e.target.result); 
      handleMidiArray(arrayBuffer);
    };
    reader.readAsArrayBuffer(file.file);
  }
}

function handleMidiArray(buffer) {
  midiArrayRaw = MidiParser.parse(buffer);   // raw MIDI bytes
     
  if(midiArrayRaw.formatType === 0){
    ppqn = midiArrayRaw.timeDivision;
    midiData = midiExtract(midiArrayRaw);
    midiProcess(midiData);
    isTypeZero = true;
    //print("File format is type 0");
  }else{
    isTypeZero = false;
    //print("File format is not Type 0");
  }
}

function midiProcess(midiData) { 
  numLines = midiData.length; //get number of lines in midiData array
  j=0;
  
  //RESET song duration back to 0 every time a new file is chosen for upload
  let totalTimeSeconds = 0;
  songDuration = 0;
  totalTimeMidi = 0;
  midiNotes = [];
  tempoMap = [];
  numNotes = 0;
  
  //RESET max and min pitches to recalculate note heights on new file upload
  pitchRange = []
  
  //check midi data file for various parameters
  for(i=0; i < numLines; i+=1){
    if(match(midiData[i], "timeSig")!==null){
      getTimeSig(midiData[i]);
    }
    if(match(midiData[i], "clock")!==null){
      getClock(midiData[i]);
    }
    if(match(midiData[i], "tempo")!==null){
      getTempo(midiData[i],j);
      j+=1;
    }
    if(match(midiData[i], "note")!==null){
      numNotes += 1;
      msgSplit = split(midiData[i], " ");
      
      let midiTime = int(msgSplit[4]);
      let pitch = int(msgSplit[2]);
      pitchRange.push(pitch);
      
      totalTimeMidi += midiTime;
      totalTimeSeconds = getTimeSeconds(totalTimeMidi);
      //print("Total Time Secs: " + totalTimeSeconds);
      //print("Total Time ppqn: " + totalTimeMidi);
      
      dict = [];
      if(msgSplit[1]===str(1)){
        if(typeof(midiNotes[pitch])==="undefined"){ //check if array has been initialized or not
          dict.push({start: totalTimeSeconds});
          midiNotes[pitch] = dict;
          //print("check");
        }else{
          count = midiNotes[pitch].length;
          midiNotes[pitch][count] = {start: totalTimeSeconds};
        }
      }

      if(msgSplit[1]===str(0)){
        //count number of notes for current pitch
        count = midiNotes[pitch].length;
        midiNotes[pitch][count-1].end = totalTimeSeconds;
        midiNotes[pitch][count-1].pressed = 0;
        midiNotes[pitch][count-1].stopped = 0;
      }
    }
  }
  songDuration = totalTimeSeconds;
  tempo = tempoMap[0][0];
  timeInBarMidi = barsToDisplay*ppqn*timeSigNum*(4/timeSigDen);
  timeInBar = (timeInBarMidi/ppqn)*tempo/1000000;
  notesDrawn.push(new drawNote(0,0,0,0))
  //create blank note to avoid any read errors

  pitchMax = Math.max(...pitchRange);
  pitchMin = Math.min(...pitchRange);
}

//function to get time signature
function getTimeSig(msg){
  msgSplit = split(msg, " ")
  timeSigNum = msgSplit[1]
  timeSigDen = msgSplit[2]
}

//function to get midi clock time
function getClock(msg){
  msgSplit = split(msg, " ")
  clock = msgSplit[1]
}

//function to get tempo in microseconds
function getTempo(msg,j){
  msgSplit = split(msg, " ");
  totalTimeMidi += int(msgSplit[2]);
  tempoSet = [int(msgSplit[1]),totalTimeMidi]
  tempoMap[j] = tempoSet;
}

//function to convert time in ppqn from midi file to seconds
function getTimeSeconds(msgTime){
  let timeSeconds = 0;
  let count;
  let deltaPPQN = 0;
  let latestCount = 0 //latest tempo where current time > tempo marker time
  //note that tempo is 500000 microseconds per 1/4 note for 120 bpm
  if(tempoMap.length>1){
    //if tempo is variable (more than one tempo marker)
    for(count=0; count<tempoMap.length-1; count++){
      if(msgTime>=tempoMap[count+1][1]){ 
        //if current time in ppqn is greater than next tempo marker time
        deltaPPQN = tempoMap[count+1][1]-tempoMap[count][1];
        timeSeconds += (deltaPPQN/ppqn)*tempoMap[count][0]/1000000;
        latestCount = count;
        }
    }
    //calculate delta ppqn time between current time and most recent tempo marker 
    deltaPPQN = msgTime-tempoMap[latestCount+1][1];
    timeSeconds += (deltaPPQN/ppqn)*tempoMap[latestCount+1][0]/1000000;
    return(timeSeconds);
  }else if(tempoMap.length==1){
    //if tempo is not variable (i.e one constant tempo)
    timeSeconds = (msgTime/ppqn)*tempoMap[0][0]/1000000;
    return(timeSeconds);
  }
}

//function to draw notes
function drawNote(x,y,h,pitch){
  this.x = x;
  this.y = y;
  this.h = h;
  this.w = 0;
  this.pitch = pitch;
  this.stopped = 0;
  
  this.display = function(){
    fill(noteColour);
    stroke(noteColour);
    rect(this.x, this.y, this.w, this.h, this.h/3);
  }
  
  this.notePitch = function(){
    return (this.pitch);
  }
  
  this.noteX = function(){
    return (this.x);
  }
  
  this.inputWidth = function(w){
    this.w = w;
  }
  
  this.stop = function(stopped){
    this.stopped = stopped;
  }
  
    this.isStopped = function(){
    return (this.stopped);
  }
}

//checks if playhead is in a new bar
function isNewBar(){
  //if current pos minus previous pos is a negative number, playhead is in new bar
  x = getPlayheadPos()-getPrevPlayheadPos();
  if(x<0){
    return(1); //return 1 for true
  }
  else{
    return(0); //return 0 for false
  }
}

//gets horizontal position of scrolling playhead (imaginary playhead)
function getPlayheadPos(){
  netWidth = canvasWidth-(bufferHor*2);
  currentTime = actualTime;
  
  ppqnPerBar = ppqn*timeSigNum*(4/timeSigDen);
  
  currentPos = (((getTimePPQN(currentTime)%ppqnPerBar)/ppqnPerBar)*netWidth)+bufferHor;
  //currentPos = (((currentTime%timeInBar)/timeInBar)*netWidth)+bufferHor;
  //fill(0);
  //rect(currentPos,canvasHeight-20,3,10,3);
  if(themeSel.value()=="nier"){
    drawCursor(currentPos,canvasHeight-50);
  }
  //playhead visual marker
  return (currentPos);
}

//gets horizontal position of scrolling playhead 1 frame behind (imaginary playhead)
function getPrevPlayheadPos(){
  netWidth = canvasWidth-(bufferHor*2);
  currentTime = actualTime-(deltaTime/1000);
  
  ppqnPerBar = ppqn*timeSigNum*(4/timeSigDen);
  
  currentPos = (((getTimePPQN(currentTime)%ppqnPerBar)/ppqnPerBar)*netWidth)+bufferHor;
  //timeInBarAdjusted = timeInBar + (1/fps);
  //currentPos = (((currentTime%timeInBar)/timeInBar)*netWidth)+bufferHor;
  
  return (currentPos);
}

//gets vertical position of note before drawing
function getNoteVertPos(notePitch){
  //midi pitch numbers are from 21 to 108
  totalNotes = pitchMax-pitchMin+1;
  noteSpacing = 2;
  bufferTop = 12*fontSize+alignY+10; //buffer to leave room for text
  bufferBtm = canvasHeight*0.085;
  
  noteHeight = (round((canvasHeight-bufferTop-bufferBtm)/totalNotes)-noteSpacing);
  
  //notePitch-pitchMin due to first midi note starting on pitchMin
  noteVertPos = canvasHeight-bufferBtm-(notePitch-pitchMin+noteSpacing)*noteHeight;
  
  if(noteHeight>12){
    noteHeight = 12;
  }
  
  return(noteVertPos);
}

//function to convert time from seconds to ppqn
function getTimePPQN(time){
  let timePPQN = 0;
  let latestCount = 0;
  let count;
  
  if(tempoMap.length>1){
    //if tempo is variable (more than one tempo marker)
    for(count=0; count<tempoMap.length; count++){
        if(time>=getTimeSeconds(tempoMap[count][1])){ 
          //if current time in seconds is greater than tempo marker time
          timePPQN = tempoMap[count][1];
          latestCount = count;
        }
    }
  }else{
    //if tempo is not variable (i.e one constant tempo)
    timePPQN = (time/(tempoMap[0][0]/1000000))*ppqn;
    return(timePPQN);
  }
  //calculate delta time in secs between current time and most recent tempo marker 
  timeSeconds = time-getTimeSeconds(tempoMap[latestCount][1]);
  timePPQN += (timeSeconds/(tempoMap[latestCount][0]/1000000))*ppqn;
  return(timePPQN);
}

function startIsClicked(){
  if(midiData){
    startButton.value("True");
  }else{}
}

function captureIsClicked(){
  if(midiData && (checkFrameInput == "Pass")){
    captureButton.value("True");
  }else{}
}

function showMidiTypeMsg(){
  //Error messages for midi file that is not Type 0
  push();
  noStroke();
  fill(209,205,183);
  rect(0, 185, 400, 25);
  
  if(isTypeZero == true){
    userMsgMidiType = "Ok!";
    fill('black');
  }else if(isTypeZero == false){
    userMsgMidiType = "Please use a midi file with Type 0 format";
    fill('red');
  }
    
  textFont("Helvetica");
  textSize(16);
  textStyle(NORMAL);
  text(`${userMsgMidiType}`, menuAlignX, 210);
  pop();
}

function showFrameMsg(){
  //Error messages for invalid frame capture inputs
  push();
  noStroke();
  fill(209,205,183);
  rect(0, 385, 600, 25);
  
  if(checkFrameInput == "Pass"){
    userMsgFrame = "Ok!";
  }else if(checkFrameInput == "Fail"){
    userMsgFrame = "Enter a valid number of frames to enable capture";
  }
  
  fill('black');
  textFont("Helvetica");
  textSize(16);
  textStyle(NORMAL);
  text(`${userMsgFrame}`, menuAlignX, 405);
  pop();
}

//Draw box with song info; only place this function AFTER midiProcess() is completed to get full song duration
function drawSongInfoBox(songBoxY){
  push();
  noStroke();
  fill('#454138');
  rect(menuAlignX, songBoxY, 400, 30);
  fill('#dcd8c0');
  rect(menuAlignX, songBoxY+30, 400, 80);
  
  fill('#bab5a1');
  textFont("Helvetica");
  textSize(18);
  textStyle(NORMAL);
  text("Capture Recommendations", menuAlignX+5, songBoxY+25);
  
  fill('black');
  textSize(16);
  text(`Approx. track length: ${round(songDuration,1)} s`, menuAlignX+5, songBoxY+50);
  text(`Frames in track: ${round(songDuration*fps)} frames`, menuAlignX+5, songBoxY+70);
  text(`Recommended frames to capture: ${round((songDuration+4)*fps)} frames`, menuAlignX+5, songBoxY+90);
  
  pop();
}

function drawInfoBox(infoBoxY, infoBoxH){
  push();
  headerHeight = 40;
  noStroke();
  fill('#454138');
  rect(menuAlignX, infoBoxY, canvasWidth-20, headerHeight);
  fill('#dcd8c0');
  rect(menuAlignX, infoBoxY+headerHeight, canvasWidth-20, infoBoxH);
  pop();
}

function drawSquares(squareX, squareY, squareAmt, squareSpacing){
  push();
  noStroke();
  fill('#454138');
  for(i=0; i<squareAmt; i+=1){
    square(squareX, squareY+(squareSpacing*i), 15);
  }
  pop();
}

function drawBorderOutline(borderX, borderY, borderW, borderH){
  push();
  noFill();
  strokeWeight(2);
  stroke('#747068');
  rect(borderX, borderY, borderW, borderH);
  pop();
}

function drawThemeSel(selX, selY, selSize){
  push();
  themeSel = createSelect();
  themeSel.position(selX, selY);
  themeSel.size(selSize);
  
  themeSel.style('font-family', 'Helvetica');
  themeSel.style('font-size', '18px');
  themeSel.style('background-color', '#dcd8c0');
  themeSel.option('Nier theme', 'nier');
  themeSel.option('White background with black notes', 'whitebg');
  themeSel.option('Custom background and note colours', 'custom');
  
  //default selected option
  themeSel.selected('Nier theme');
  pop();
}

//////////////////////////////CODE STARTS HERE///////////////////////////////////
function preload(){
  font = loadFont('assets/Inconsolata.otf');
  font2 = loadFont('assets/FOT-Rodin Pro L.otf');
  font3 = loadFont('assets/FOT-Rodin Pro DB.otf');
  font4 = loadFont('assets/Helvetica Light Regular.otf');
}

function setup(){
  createCanvas(canvasWidth, 2700);
  colorMode(RGB,255);
  background(209,205,183);
  
  textFont(font2);
  textSize(70);
  textStyle(NORMAL);
  textAlign(LEFT,BOTTOM);
  text('Midi Visualizer', 0, 75);
  
  textSize(50);
  text('(with a Nier Aesthetic)', 480, 75);
  
  textSize(18);
  text('created using p5js by futsuun', 1000, 75);
  
  drawBorder(90);
  
  // Create a file input and place it at the top left
  textFont(font2);
  textSize(20);
  text('Select MIDI file (check requirements below)', menuAlignX, 150);
  input = createFileInput(handleMidi);
  input.position(menuAlignX, 160);
  input.style('font-family', 'Helvetica');
  
  text('Enter song title', menuAlignX, 250);
  titleInput = createInput("A very awesome song title");
  titleInput.position(menuAlignX, 260);
  titleInput.style('font-family', 'Helvetica');
  titleInput.style('color', 'grey');
  titleInput.style("width", "300px");
  
  text('Input number of frames to capture (you may ignore this for previewing)', menuAlignX, 350);
  frameInput = createInput("Enter number of frames");
  frameInput.position(menuAlignX, 360);
  frameInput.style('font-family', 'Helvetica');
  frameInput.style('color', 'grey');
  frameInput.style("width", "300px");

  //create button which starts visualizer preview
  startButton = createButton("Click to Preview", "False");
  startButton.position(menuAlignX,820);
  startButton.style('font-family', 'Helvetica');
  startButton.style('font-size', '18px');
  startButton.style('letter-spacing', '0.05rem');
  startButton.style('color', '#454138');
  //startButton.style('background-color', '#dcd8c0');
  startButton.style('width', '340px');
  startButton.style('height', '30px');
  startButton.mousePressed(startIsClicked);
  
  //create button which starts CCapture
  captureButton = createButton("Start Capture", "False");
  captureButton.position(menuAlignX,860);
  captureButton.style('font-family', 'Helvetica');
  captureButton.style('font-size', '18px');
  captureButton.style('letter-spacing', '0.05rem');
  captureButton.style('color', '#454138');
  //captureButton.style('background-color', '#dcd8c0');
  captureButton.style('width', '340px');
  captureButton.style('height', '30px');
  captureButton.mousePressed(captureIsClicked);
  
  //theme selection
  textFont("Helvetica");
  textSize(20)
  text("Theme Selection", menuAlignX+20, 600);
  strokeWeight(1);
  stroke('#454138');
  line(menuAlignX, 570, 400, 570);
  line(menuAlignX, 610, 400, 610);
  drawThemeSel(menuAlignX, 620, 350);
  
  strokeWeight(0);
  text("Select Background Colour", menuAlignX, 690);
  text("(Select Custom Theme to enable)", menuAlignX+370, 690);
  bgPicker = createColorPicker('white');
  bgPicker.position(menuAlignX+300, 665);
  
  text("Select Note Colour", menuAlignX, 740);
  text("(Select Custom Theme to enable)", menuAlignX+370, 740);
  notePicker = createColorPicker('black');
  notePicker.position(menuAlignX+300, 715);
  
  text("Hide track info at top left", menuAlignX, 790);
  hideInfoBox = createCheckbox();
  hideInfoBox.style("transform", "scale(1.75)");
  hideInfoBox.position(menuAlignX+310, 770);
  
  //info for user
  strokeWeight(1);
  line(menuAlignX, menuFooterY+40, canvasWidth-10, menuFooterY+40);
  fill('#454138');
  square(menuAlignX+40, menuFooterY+55, 30);
  para1 = createP('USEFUL INFORMATION');
  para1.style('font-size', '32px', 'color', '#454138');
  para1.style('font-family', 'Helvetica');
  para1.style('letter-spacing', '0.1rem');
  para1.position (menuAlignX+80, menuFooterY+20);
  line(menuAlignX, menuFooterY+100, canvasWidth-10, menuFooterY+100);
  
  drawInfoBox(menuFooterY+120, 220);
  drawInfoBox(menuFooterY+400, 70);
  drawInfoBox(menuFooterY+530, 400);
  drawInfoBox(menuFooterY+990, 260);
  drawInfoBox(menuFooterY+1310, 260);
  
  fill('#bab5a1');
  textFont("Helvetica");
  textSize(20);
  textStyle(NORMAL);
  text("MIDI File Requirements", menuAlignX+10, menuFooterY+150);
  text("Output Format", menuAlignX+10, menuFooterY+430);
  text("Using the Visualizer", menuAlignX+10, menuFooterY+560);
  text("Credits", menuAlignX+10, menuFooterY+1020);
  text("Comments", menuAlignX+10, menuFooterY+1340);
  
  fill('#454138');
  textSize(20);
  strokeWeight(0);
  textLeading(20);
  
  text(`MIDI file MUST be a Type 0 Midi File (all tracks merged into a single MIDI track)\n
PPQN (parts per quarter note) must be set to 960\n
Tempo changes are okay, but do note that EXCESSIVE tempo changes will cause the visualizer FPS to drop drastically\n
Visualizer is unable to handle changes in time signature during the track (it will only take the first time signature it sees and ignore the rest);
it may still work to some degree but try at your own risk!`, menuAlignX+40, menuFooterY+345);
  
  text(`Output: .webm format, 1920 x 1080, 60fps`, menuAlignX+40, menuFooterY+480);
  
  text(`Click on "Choose File" to upload a MIDI file (see MIDI File Requirements)\n
Click on "Click to Preview" to preview, or enter the number of desired frames and click "Start Capture" to capture visualizer output\n
Only the visualizer output will be captured, so you will have to sync the output (.webm file) with your audio track in a video editor\n
It is recommended to include one or more bars of empty space at the beginning of the midi track to avoid any abrupt starts\n
It is recommended to include an extra 3-4 seconds of capture after the track ends for some buffer\n
Frames in track are calculated by (song length) x (FPS)\n
There is no back button after starting the preview, so please refresh the page to go back to the main section again for capturing\n
Ensure that the visualizer window is the ACTIVE WINDOW during capturing, or capture MAY GET PAUSED\n
If you have another way of capturing the visualizer output on your own, eg. screen capture, please feel free!`, menuAlignX+40, menuFooterY+930);
  
  text(`Created using p5js\n
Canvas captured using CCapture.js\n
Midi parsed using MidiParser.js\n
Fonts used (Inconsolata, FOT-Rodin Pro L, Helvetica)\n
YoRHa CSS page by metakirby5 (for referencing)\n
Special thanks to jteosw for reviewing my horrible code
`, menuAlignX+40, menuFooterY+1290);
  
  text(`I am not a coder or developer by trade, but I originally made this because I wanted a visualizer; hopefully this might be useful for someone else out there too...\n
I may not continue work on this (as it was kind of a one-time thing for me), but for any feedback, general comments, or anything else related, you can drop an email at futsuup@gmail.com\n
Some of my other links:`, menuAlignX+10, menuFooterY+1460)
  
  drawSquares(menuAlignX+15, menuFooterY+185, 4, 40);
  drawSquares(menuAlignX+15, menuFooterY+460, 1, 0);
  drawSquares(menuAlignX+15, menuFooterY+590, 9, 40);
  drawSquares(menuAlignX+15, menuFooterY+1050, 6, 40);
  
  linkCCapture = createA('https://github.com/spite/ccapture.js/','https://github.com/spite/ccapture.js/');
  linkCCapture.position(menuAlignX+360, menuFooterY+1092);
  linkCCapture.style('font-family', 'Helvetica');
  
  linkMidiParser = createA('https://www.npmjs.com/package/midi-parser-js','https://www.npmjs.com/package/midi-parser-js');
  linkMidiParser.position(menuAlignX+335, menuFooterY+1132);
  linkMidiParser.style('font-family', 'Helvetica');
  
  linkYorha = createA('https://metakirby5.github.io/yorha/','https://metakirby5.github.io/yorha/');
  linkYorha.position(menuAlignX+490, menuFooterY+1212);
  linkYorha.style('font-family', 'Helvetica');
  
  linkTwitter = createA('https://x.com/futsuunohito2','Twitter');
  linkTwitter.position(menuAlignX+10, menuFooterY+1472);
  linkTwitter.style('font-family', 'Helvetica');
  linkTwitter.style('font-size', '18px');
  linkTwitter.style('letter-spacing', '0.05rem');
  
  linkCarrd = createA('https://futsuunohito.crd.co/', 'Carrd site');
  linkCarrd.position(menuAlignX+10, menuFooterY+1512);
  linkCarrd.style('font-family', 'Helvetica');
  linkCarrd.style('font-size', '18px');
  linkCarrd.style('letter-spacing', '0.05rem');
  
  gif_createImg = createImg("visualizer_gif_preview.gif",'');
  gif_createImg2 = createImg("visualizer_gif_custom_preview_360p.gif", '');
  
}

function draw(){
  songTitle = titleInput.value();
  
  if(startButton.value() != "True" && captureButton.value() != "True"){
    //check if user inputs a valid frame number
    if(int(frameInput.value() > 0) || isNaN(int(frameInput.value()) == false)){
      captureLength = int(frameInput.value());
      checkFrameInput = "Pass";
    }else{
      checkFrameInput = "Fail";
    }

    //disable capture button if input is invalid OR no midi file loaded
    if(midiData && (checkFrameInput === "Pass")){
      captureButton.removeAttribute('disabled');
    }else{
      captureButton.attribute('disabled', '');
    }

    //disable colour picker if custom theme is not selected
    if(themeSel.value() === 'custom'){
      bgPicker.removeAttribute('disabled');
      notePicker.removeAttribute('disabled');
    }else{
      bgPicker.attribute('disabled', '');
      notePicker.attribute('disabled', '');
    }

    //disable preview button if no midi file loaded
    if(midiData){
      startButton.removeAttribute('disabled');
    }else{
      startButton.attribute('disabled', '');
    }
    
    showMidiTypeMsg();
    showFrameMsg();
    drawSongInfoBox(430);
    drawBorderOutline(790, 150, 820, 470);
    gif_createImg.position(800, 160);
    drawBorderOutline(790, 630, 642, 362);
    gif_createImg2.position(791, 631);
  }

  //Check if midiData is loaded & start button is clicked
  if (midiData && (startButton.value() === "True"||captureButton.value() === "True")){
    input.hide();
    startButton.hide();
    captureButton.hide();
    titleInput.hide();
    frameInput.hide();
    para1.hide();
    linkCCapture.hide();
    linkMidiParser.hide();
    linkYorha.hide();
    linkTwitter.hide();
    linkCarrd.hide();
    gif_createImg.hide();
    gif_createImg2.hide()
    bgPicker.hide();
    notePicker.hide();
    themeSel.hide();
    hideInfoBox.hide();
    
    //change background & note color based on theme selected
    if(themeSel.value()=="whitebg"){
      bgColour = "white";
      noteColour = "black";
    }else if(themeSel.value()=="custom"){
      bgColour = bgPicker.color()
      noteColour = notePicker.color();
    }else{
      bgColour = '#d1cdb7';
      noteColour = "black";
    }
    
    createCanvas(canvasWidth, canvasHeight);
    background(bgColour);
    textFont(font);
    
    //frameCount keeps running at menu page, so frame count on click has to be stored
    if(frameCountIsStored === 0){
      frameCountClicked = frameCount;
      frameCountIsStored = 1;
    }
       
    //////CCAPTURE//////
    if(captureButton.value() === "True" && frameCount == (1+frameCountClicked)){
      capturer.start();}

    frameRate(fps); //60 frames per second  
    frameRateSeconds = 1/fps; //time for one frame to draw
    actualTime += deltaTime/1000;
    
    textSize(fontSize);
    textStyle(NORMAL);
    fill('black');
    strokeWeight(0);
    
    if(hideInfoBox.checked()==false){
      text(`Time Signature ${timeSigNum}/${timeSigDen}`, alignX, alignY);
      text(`Clock ${clock}`, alignX, fontSize+alignY);
      text(`Tempo ${tempo}`, alignX, 2*fontSize+alignY);
      text(`PPQN ${ppqn}`, alignX, 3*fontSize+alignY);
      text(`BPM ${round(60000000/tempo)}`, alignX, 4*fontSize+alignY);
      text(`Frame Count ${frameCount-frameCountClicked}`, alignX, 5*fontSize+alignY);
      //text(`Time ${round(frameCount*frameRateSeconds,2)}`, alignX, 6*fontSize+alignY);
      text(`Time ${round(actualTime,2)}`, alignX, 6*fontSize+alignY);
      //text(`Delta ${round(actualTime-(frameCount*frameRateSeconds),2)}`, alignX*15, 6*fontSize+alignY);  
    }
    
    if(themeSel.value()=="nier"){
      bgLines();
      drawInit(alignX, 7*fontSize+alignY);
      drawProgBar();
      drawBorder(10*fontSize+alignY);
      drawBorder(canvasHeight*0.92);
      drawSignalBars((canvasWidth*0.54),canvasHeight*0.04);
      drawBracket(alignX,12*fontSize+alignY);
    }

    let notePitch; //note pitch integer value
    let noteIsOn; //value of 0 for off, 1 for on

    if(isNewBar()===1){
      //print("new bar")

      notesDrawn.splice(0,notesDrawn.length);
      notesDrawn.push(new drawNote(0,0,0,0)); //create blank note to avoid errors

      for(let pitch in midiNotes){
        notes = midiNotes[pitch];
        for(let note of notes){
          note.pressed = 0;
          //print (note.pressed)
        }
      }
    }
  
    let x=0;
    let y=0;
    let w=0;
  
    //Tempo control
    for(i=0; i<tempoMap.length; i++){
      if(i+1<tempoMap.length){
        if(actualTime<getTimeSeconds(tempoMap[i+1][1]) && actualTime>=getTimeSeconds(tempoMap[i][1])){
          timeInBar = (timeInBarMidi/ppqn)*tempoMap[i][0]/1000000;
          tempo = tempoMap[i][0];
        }
      }
    }
  
    if(actualTime>=getTimeSeconds(tempoMap[tempoMap.length-1][1])){
      tempo = tempoMap[tempoMap.length-1][0];
      timeInBar = (timeInBarMidi/ppqn)*tempo/1000000;
    }
  
    x = getPlayheadPos();
  
    for(let pitch in midiNotes){
      notes = midiNotes[pitch];
      for(let note of notes){
        //if note has not been pressed yet, create note object
        if(note.start<=actualTime && note.end>=actualTime && note.pressed==0){
          y = getNoteVertPos(pitch);
          notesDrawn.push(new drawNote(x,y,noteHeight,pitch));
          note.pressed = 1;
          }
        //if note has been pressed, then...
        if(note.start<=actualTime && note.end>=actualTime && note.pressed==1){
          let latestNote = 0 //store array index of latest note object with specified pitch
          for(j=0; j<notesDrawn.length; j++){
            if(notesDrawn[j].notePitch()==pitch){
              latestNote = j;
            }
          }
          //search through notes inside pitch array
          for(j=0; j<notesDrawn.length; j++){
            if(notesDrawn[j].isStopped()==1){
              //do nothing if note object has been stopped
            }else if(notesDrawn[j].notePitch()==pitch && notesDrawn[j].isStopped()==0 && j<latestNote){
              notesDrawn[j].stop(1); //stop all existing notes before latest note
            }else if(notesDrawn[j].notePitch()==pitch && notesDrawn[j].isStopped()==0 && j==latestNote){
              w = x - notesDrawn[j].noteX();
              notesDrawn[j].inputWidth(w); //increase width to draw latest note
            }
          }
          for(j=0; j<notesDrawn.length; j++){
            if(notesDrawn[j].notePitch() == notesDrawn[latestNote].notePitch() && j<latestNote){
              notesDrawn[j].stop(1);
            }
          }
        }
      }
    }
  
    //draw all note objects
    for(j=0; j<notesDrawn.length; j++){
      notesDrawn[j].display();
    }
  
    ////////CCAPTURE////////
    if(captureButton.value() === "True"){
      if (frameCount < (captureLength+frameCountClicked)){
        capturer.capture(canvas);
      } else if (frameCount === (captureLength+frameCountClicked)){
        capturer.save();
        capturer.stop();
      }
    }
  }
}
