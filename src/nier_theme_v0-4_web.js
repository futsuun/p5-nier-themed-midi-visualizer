//function to draw "playing" bar at top left (not important for visualizer function)
function drawInit(x,y){
  posX = x;
  posY = y;
  
  noStroke();
  colorMode(RGB,255);
  fill(186,181,161);
  rect(x,y,200,20);
  
  if(frameCount-frameCountClicked+120>(timeInBarMidi/ppqn)*(tempo/1000000)*fps){
    deltaX = deltaTimeFps*0.4
    initW += deltaX;
    if(initW>200){
      initW = 200;
    }
    colorMode(RGB,255);
    fill(69,65,56);
    rect(x,y,initW,20);
    
    textFont(font);
    fill(209,205,183);
    textSize(16);
    text("Playing", x+65, y+15);
  }
  else{
    textFont(font);
    fill(69,65,56);
    textSize(16);
    text("Initialize . . .", x+50, y+15);
  }
}

//draws progress bar
function drawProgBar(){
  w = canvasWidth*0.3;
  x = (canvasWidth-w)*0.86;
  y = canvasHeight*0.07;
  h = 3;
  
  noStroke();
  colorMode(RGB,255);
  fill(186,181,161);
  rect(x,y,w,h);
  
  textFont(font);
  fill(69,65,56);
  textSize(10);
  percentage = round((actualTime/songDuration)*100,2);
  if(percentage>100){
    percentage = 100;
  }
  text(percentage + "%", x+w+5, y+h);
  text("Completion Rate",x,y-2*h);
  
  textSize(titleTextSize);
  text(songTitle,x,y-26);
  
  noStroke();
  colorMode(RGB,255);
  fill(69,65,56);
  rect(x,y,w*percentage/100,h);
  //rect(x-1+w*percentage/100,y+h+1,2,5);
  drawCursor(x-1+w*percentage/100,y+h+5);
}

//draws progress bar cursor
function drawCursor(x,y){
  push();
  noStroke();
  fill("#454138");
  
  r=5;
  h1=18;
  h2=5;
  
  beginShape();
  vertex(x,y);//top of cursor
  vertex(x-r,y+h1);
  vertex(x,y+h1+h2);
  vertex(x+r,y+h1);
  endShape(CLOSE);
  
  s=2.5;
  r2=r+2;
  square(x-(s/2)-r2,y,s);
  square(x-(s/2)+r2,y,s);
  
  fill("#bab5a1");
  square(x-(s/2),y+h1-1,s);
  pop();
}

//draw border
function drawBorder(y){
  push();
  stroke("#454138");
  strokeWeight(2);
  line(0,y,canvasWidth,y);
  
  spacing = 50;
  numSpacing = floor((canvasWidth-(alignX*2))/spacing);

  w = 6;
  h = 3;
  x = ((canvasWidth-(spacing*(numSpacing-1)))/2)-(w/2); //ensure pattern is centered
  r = 1.5;//rectangle round radius
  yCirc = y+18 //y pos for center circle
  yCirc2 =yCirc-8 //y pos for adjacent circles
  circDia = 2.5; //circle diameter

  for(i=0; i<numSpacing; i++){
    fill("black");
    rect(x,y,w,h,0,0,r,r);
    x+=spacing;
    
    if(i<numSpacing-1){
      xCirc = x-(spacing/2)+(w/2);//center alignment for center dot
      circle(xCirc,yCirc,circDia);
      circle(xCirc-w,yCirc2,circDia);
      circle(xCirc+w,yCirc2,circDia);
    }
  }
  pop();
}

//draw diagonal lines
function drawDiag(x1,y1,x2,grad){
  push();
  stroke("#BAB5A17F");
  strokeWeight(2);
  y2=(x2-x1)*grad;
  line(x1,y1,x2,y2);
  pop();
}

//draw background lines
function bgLines(){
  push();
  stroke("#BAB5A17F");
  strokeWeight(2);
  x = canvasWidth*0.45;
  x2 = canvasWidth-x;
  deltaX = canvasWidth*0.08
  grad = canvasHeight/(canvasWidth-x);
  line(x,0,canvasWidth,canvasHeight);
  
  drawDiag(x,0,canvasWidth,grad);
  drawDiag(x+deltaX,0,canvasWidth-deltaX,grad);
  drawDiag(x-deltaX,0,canvasWidth-2*deltaX,grad);
  
  noFill()
  circle(canvasWidth+deltaX,canvasHeight-deltaX,canvasHeight+deltaX);
  circle(canvasWidth-deltaX,canvasHeight+deltaX,canvasHeight+deltaX);
  
  pop();
}

//draw brackets
function drawBracket(x,y){
  push();
  stroke("#2E2B26");
  strokeWeight(1);
  
  cornerX = x;
  cornerY = y;
  bracketHeight = cornerY+canvasHeight*0.5;
  bracketWidth = canvasWidth*0.01;
  speed = 0.1;

  //start value for moveX is definited at beginning of code
  if(moveX<x && percentage<100){
    moveX += speed*deltaTimeFps;
  }
  if(moveX2>canvasWidth-x && percentage<100){
    moveX2 -= speed*deltaTimeFps;
  }
  if(percentage>=100){
    moveX2 += speed*deltaTimeFps;
    moveX -= speed*deltaTimeFps;
  }
  
  e1 = moveX+bracketWidth;
  e2 = cornerY+bracketHeight;
  e12 = moveX2-bracketWidth;
  
  line(moveX,cornerY,e1,cornerY);
  line(moveX,cornerY,moveX,e2);
  line(moveX,e2,e1,e2);
  
  line(moveX2,cornerY,e12,cornerY);
  line(moveX2,cornerY,moveX2,e2);
  line(moveX2,e2,e12,e2);
  pop();
}

function drawSignalBars(x,y){
  push();
  textFont(font);
  if (fade<0) fadeAmount=3; 
  if (fade>255) fadeAmount=-6;
   
  fill(69,65,56,fade);
  textSize(titleTextSize);
  //textStyle(BOLD);
  var titleLength = textWidth(songTitle)+titleTextSize;
  
  stroke(69,65,56,fade);
  strokeWeight(1);
  noFill();
  circleX = x+135+titleLength
  circle(circleX,y-5,45);
  
  noStroke();
  fill(69,65,56,fade);
  rect(circleX-11,y-2,4,7);
  rect(circleX-3,y-9,4,14);
  rect(circleX+6,y-16,4,21);
  fade += fadeAmount;
  pop();
}
