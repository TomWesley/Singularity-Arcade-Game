//Visual sequence consisting of various changing colors and shapes for a music video
//Coder: Thomas Wesley 
//Last Edit 9/28/2018
//Title: Eyelids Sequence


///NOTES: Add different surfboards with different mass and allow people to change the color 
//Variable Declarations
Star[] stars = new Star[800];
Surfer[] Surfers = new Surfer[4];
BH[] OneBH = new BH[10];
Asteroid[] OneAsteroid = new Asteroid[15];
float speed;
//PImage img;
float s=0;
float w;
float theta;
float m;
float delay=0;
static final int LINE_C =200;
static final int LINE_O =360;
float numb=0;
float er=0;
float gen =0;
float open;
float fire;
float ball;

int ning = 0;
int xx = 0;
int yy = 0;
int zz = 0;
int colorr;

float pick;
//Control of Wave Fluctuation from bottom of screen
float fluct=0;
int spacing;
int radius;
int form=int(random(4,10));
int set=0;

PFont title;
float sinAngle = 0;
int sinOne=0;
float sinx = 0;
float siny = 0;
float prevx=0;
float prevy=0;
float baseSpeed =.01;

float mousex;
float mousey;
int GameOver=0;

float xGravity=0;
float yGravity=0;
float gConstant=190;
float ratio=0;
float ratiotwo=0;
float prevxx=0;
float prevyy=0;

//Asteroid variables
    float surfergravity=0;
    float Asteroidx =width/2;
    float Asteroidy=height/2;
    float initialAsteroid=0;
    float AsteroidDestroyed=0;
    
//Surfer/Player variables
    float Craftselectioncount;//Helps so a mouse click on the opening screen doesn't also select your craft
    float lifeCount=1;
    float distance=4;
    float surfRed;
    float surfBlue;
    float surfGreen;
    float surfType;
    float surfMass; //Make sure this goes into the gravity equation
    float levelTimer=0;
    
//Game Over Sequence    
    float craftLost=0;//counter to ensure the craft lost sequences are timed correctly before resetting
//Create bolt objects to use throughout the sequence
//Bolt[] bolts = new Bolt[150];
//Setup function to establis the frame color and size 

void setup() {
  //The initial background is black
  background(0);
  //Size the frame in HD proportions
 // size(1280,720);
  fullScreen();
  //Create an array of stars to be utilized in the draw phase
  for (int i = 0; i < stars.length; i++) {
    stars[i] = new Star(); 
  }
  for (int i = 0; i < OneBH.length; i++) {
    OneBH[i] = new BH(10); 
  }
  for (int i = 0; i < OneAsteroid.length; i++) {
    OneAsteroid[i] = new Asteroid(15); 
  }
  for (int i = 0; i < Surfers.length; i++) {
    Surfers[i] = new Surfer();
  }
}
//The draw function runs through the actions contained in a loop
void draw() {
  cursor(CROSS);
  delay=delay+1;
  if(GameOver==0){
   
  if(sinOne==0){
  background(0);
  title = createFont("volt.ttf", 32);
  textFont(title);
  translate(width/2,height/2);
  for (int i = 0; i < stars.length; i++) {
    //Update the location of each star in the array
    stars[i].update();
    //Pass in the color and opacity values for the stars in the array
    stars[i].show(255,255,255,255);
  }
  translate(-width/2,-height/2);
  lifeCount=3; //Reset the number of lives each time the game is restarted\
  
  
  textSize(height/4.5);
  if(delay<255){
  fill(255,240,0,255-(255-delay));
  }
  else{fill(255,240,0,255);}
  text("SINGULARITY",width/13.3,height/2);
  if(delay>280){
    textSize(height/14);
  
    text("Press Any Key To Begin",width/4.17,height-height/4);
  }
  if(delay>30){
    if(keyPressed || mousePressed){
   sinOne=2; 
   Craftselectioncount=5;
  }
  }
  
  speed = map(10+delay/200, 0, width, 0, 50); 
  
  prevx=width/15;
  prevy=height/2;
  //Surfers[0] = new Surfer();
  }
  else if(sinOne==2){
    background(0);
    translate(width/2,height/2);
    rotate(PI*delay/900);
    for (int i = 0; i < stars.length; i++) {
    stars[i].show(255,255,255,255);
   }
   rotate(-PI*delay/900);
   translate(-width/2,-height/2);
    textSize(height/8.5);
    fill(255,240,0,255);
    text("Select A Surfer",width/5,height/6);
    stroke(255,240,0,255);
    line(width/7,height/5.5,width-width/7,height/5.5);
    //Display the surfers here
    stroke(255,255);
    fill(255,150);
    if(mouseY<height && mouseY>height-2*height/10){
      quad(0,height-2*height/10,0,height,width,height,width,height-2*height/10);
    }
    if(mouseY<height-2*height/10 && mouseY>height-4*height/10){
      quad(0,height-2*height/10,0,height-4*height/10,width,height-4*height/10,width,height-2*height/10);
    }
    if(mouseY<height-4*height/10 && mouseY>height-6*height/10){
      quad(0,height-4*height/10,0,height-6*height/10,width,height-6*height/10,width,height-4*height/10);
    }
    if(mouseY<height-6*height/10 && mouseY>height-8*height/10){
      quad(0,height-6*height/10,0,height-8*height/10,width,height-8*height/10,width,height-6*height/10);
    }
    textSize(height/14.5);
    fill(255,255,255,255);
    text("Superbug",width/4,height-1*height/13);
    text("Psych Bike",width/4,height-3.6*height/13);
    text("The Compiler",width/4,height-6.2*height/13);
    text("Tron",width/4,height-8.8*height/13);
    textSize(height/19.5);
    text("Speed",width-width/3.5,height-1.5*height/13);text("Mass",width-width/3.5,height-0.7*height/13);
    translate(0,-(height/13)*2.6);
    text("Speed",width-width/3.5,height-1.5*height/13);text("Mass",width-width/3.5,height-0.7*height/13);
    translate(0,(height/13)*2.6);
    translate(0,-(height/13)*2.6*2);
    text("Speed",width-width/3.5,height-1.5*height/13);text("Mass",width-width/3.5,height-0.7*height/13);
    translate(0,(height/13)*2.6*2);
    translate(0,-(height/13)*2.6*3);
    text("Speed",width-width/3.5,height-1.5*height/13);text("Mass",width-width/3.5,height-0.7*height/13);
    translate(0,(height/13)*2.6*3);
    //Yellow Player Stats
    rectangle(width-width/6,height-0.915*height/13,height/60,height/30,255,240,0,255);
    rectangle(width-width/6.5,height-0.915*height/13,height/60,height/30,255,240,0,255);
    rectangle(width-width/6.5+abs(width/6.5-width/6),height-0.915*height/13,height/60,height/30,255,240,0,255);
    rectangle(width-width/6.5+2*abs(width/6.5-width/6),height-0.915*height/13,height/60,height/30,255,240,0,255);   
    rectangle(width-width/6,height-1.715*height/13,height/60,height/30,255,240,0,255);
    rectangle(width-width/6.5,height-1.715*height/13,height/60,height/30,255,240,0,255);
    rectangle(width-width/6.5+abs(width/6.5-width/6),height-1.715*height/13,height/60,height/30,255,240,0,255);    
    //Pink Player Stats
    rectangle(width-width/6,height-3.505*height/13,height/60,height/30,255,174,204,255);    
    rectangle(width-width/6,height-3.505*height/13-abs(1.715*height/13-0.915*height/13),height/60,height/30,255,174,204,255);
    rectangle(width-width/6.5,height-3.505*height/13-abs(1.715*height/13-0.915*height/13),height/60,height/30,255,174,204,255);
    rectangle(width-width/6.5+abs(width/6.5-width/6),height-3.505*height/13-abs(1.715*height/13-0.915*height/13),height/60,height/30,255,174,204,255);
    rectangle(width-width/6.5+2*abs(width/6.5-width/6),height-3.505*height/13-abs(1.715*height/13-0.915*height/13),height/60,height/30,255,174,204,255);    
    //Green Player Stats
    translate(0,-(height/13)*2.6);
    rectangle(width-width/6,height-3.505*height/13,height/60,height/30,80,230,130,255);    
    rectangle(width-width/6+abs(width/6.5-width/6),height-3.505*height/13,height/60,height/30,80,230,130,255);  
    rectangle(width-width/6+2*abs(width/6.5-width/6),height-3.505*height/13,height/60,height/30,80,230,130,255); 
    rectangle(width-width/6+3*abs(width/6.5-width/6),height-3.505*height/13,height/60,height/30,80,230,130,255); 
    rectangle(width-width/6+4*abs(width/6.5-width/6),height-3.505*height/13,height/60,height/30,80,230,130,255); 
    rectangle(width-width/6,height-3.505*height/13-abs(1.715*height/13-0.915*height/13),height/60,height/30,80,230,130,255);
    rectangle(width-width/6.5,height-3.505*height/13-abs(1.715*height/13-0.915*height/13),height/60,height/30,80,230,130,255);
    rectangle(width-width/6.5+abs(width/6.5-width/6),height-3.505*height/13-abs(1.715*height/13-0.915*height/13),height/60,height/30,80,230,130,255);
    rectangle(width-width/6.5+2*abs(width/6.5-width/6),height-3.505*height/13-abs(1.715*height/13-0.915*height/13),height/60,height/30,80,230,130,255); 
    rectangle(width-width/6.5+3*abs(width/6.5-width/6),height-3.505*height/13-abs(1.715*height/13-0.915*height/13),height/60,height/30,80,230,130,255);
    translate(0,(height/13)*2.6);
    //Blue Player Stats
    translate(0,-(height/13)*2.6*2);
    rectangle(width-width/6,height-3.505*height/13,height/60,height/30,100,14,237,255); 
    rectangle(width-width/6+abs(width/6.5-width/6),height-3.505*height/13,height/60,height/30,100,14,237,255);  
    rectangle(width-width/6+2*abs(width/6.5-width/6),height-3.505*height/13,height/60,height/30,100,14,237,255); 
    rectangle(width-width/6,height-3.505*height/13-abs(1.715*height/13-0.915*height/13),height/60,height/30,100,14,237,255);
 
    translate(0,(height/13)*2.6*2);
    Surfers[0].render(width/8,height-height/10,10,0,255,255,255); 
    Surfers[1].render(width/8,height-3*height/10,10,1,255,255,255); 
    Surfers[2].render(width/8,height-5*height/10,10,2,255,255,255); 
    Surfers[3].render(width/8,height-7*height/10,10,3,255,255,255); 
    
    //Display stats for each of the vehicles. Speed and Mass 
    if(Craftselectioncount<0){
    if(mousePressed){
      if((mouseY<height && mouseY>height-2*height/10)){
        //SuperBug
        surfMass=2.6;
        distance=7;
        sinOne=4;
        surfType=0;
      }
      else if((mouseY<height-2*height/10 && mouseY>height-4*height/10)){
        //Psych Bike
        surfMass=1.4;
        distance=8;
        sinOne=4;
        surfType=1;
      }
      else if((mouseY<height-4*height/10 && mouseY>height-6*height/10)){
        //The Compiler
        surfMass=3;
        distance=9;
        sinOne=4;
        surfType=2;
      }
      else if((mouseY<height-6*height/10 && mouseY>height-8*height/10)){
        //Tron
        surfMass=2.2;
        distance=5;
        sinOne=4;
        surfType=3;
      }
    }
    }
    if(Craftselectioncount!=-5){
    Craftselectioncount=Craftselectioncount-1;
    } 
  }
  else if(sinOne>=4){
    if(sinOne==4){
   prevx=width/15;
  prevy=height/2;
  levelTimer=0;
  initialAsteroid=0;
    }
    sinOne=5;
   background(0,0,0,255); 
   translate(width/2,height/2);
   for (int i = 0; i < stars.length; i++) {
    stars[i].show(255,255,255,255);
   }
   translate(-width/2,-height/2);
   //Level 1   
   //Galaxy Start
   if(delay%5!=0){
   fill(255,255,255,255);
   noStroke();
   scale(1.8);
   translate(-30,-height/4.3);
   quad(width/15+height/100,height/2+height/100,width/15+height/100,height/2-height/100,width/15-height/100,height/2-height/100,width/15-height/100,height/2+height/100);
   fill(255,255,255,235);
   quad(width/15+height/75,height/2+height/75,width/15+height/75,height/2-height/75,width/15-height/75,height/2-height/75,width/15-height/75,height/2+height/75);
   float galaxSize=width/450;     
   for(float j = 350;j>6;j=j-.5)
   {   
   sinx=(j*.15)*cos(radians(sinAngle+j*15))+width/15;
   siny=(j*.05)*sin(radians(sinAngle+j*15))+height/2;
   siny=siny+(sinx-width/15)*.25;
   noStroke();
   fill(255,174,206,105);
   quad(sinx+(galaxSize),siny+galaxSize,sinx+galaxSize,siny-galaxSize,sinx-galaxSize,siny-galaxSize,sinx-galaxSize,siny+galaxSize);
   fill(255,210,30,105);
   sinx=(j*.15)*cos(radians(sinAngle+j*15+90))+width/15;
   siny=(j*.05)*sin(radians(sinAngle+j*15+90))+height/2;
   siny=siny+(sinx-width/15)*.25;
   quad(sinx+galaxSize,siny+galaxSize,sinx+galaxSize,siny-galaxSize,sinx-galaxSize,siny-galaxSize,sinx-galaxSize,siny+galaxSize);
   noStroke();
   sinx=(j*.15)*cos(radians(sinAngle+j*15+180))+width/15;
   siny=(j*.05)*sin(radians(sinAngle+j*15+180))+height/2;
   siny=siny+(sinx-width/15)*.25;
   noStroke();
   fill(255,240,100,105);
   quad(sinx+(galaxSize),siny+galaxSize,sinx+galaxSize,siny-galaxSize,sinx-galaxSize,siny-galaxSize,sinx-galaxSize,siny+galaxSize);
   fill(255,255,255,105);
   sinx=(j*.15)*cos(radians(sinAngle+j*15+270))+width/15;
   siny=(j*.05)*sin(radians(sinAngle+j*15+270))+height/2;
   siny=siny+(sinx-width/15)*.25;
   quad(sinx+galaxSize,siny+galaxSize,sinx+galaxSize,siny-galaxSize,sinx-galaxSize,siny-galaxSize,sinx-galaxSize,siny+galaxSize);
   noStroke(); 
   
   }
   
   translate(30,height/4.3);
   scale((1/1.8));
   } 
     //Black Holes/Asteroids Level One
    float Asteroiddistance;
    float Asteroidmass=30;
    float AsteroidInitialSpeed=21;
    float BHdistance;
    float BHx =width/5;
    float BHy=height/2-height/4;
    float gforce;
    float BHmass=0;
    float xGravityAsteroid= 0;
    float yGravityAsteroid= 0;
    xGravity=0;
    yGravity=0;
    float denom;    
    surfergravity = 0; //Do the surfers relation to the black holes only once
    for (int j = 0; j < OneAsteroid.length; j++) { 
      if(initialAsteroid==0){
        Asteroidy=int(random(0,height));
        Asteroidx=width*1.05-j*4;
        OneAsteroid[j].priorx=-AsteroidInitialSpeed+j;
        OneAsteroid[j].priory=0;
      }
      else{
      Asteroidx=OneAsteroid[j].xx;
      Asteroidy=OneAsteroid[j].yy;
      }
    Asteroidmass=5+j%3;
    xGravityAsteroid=0;
    yGravityAsteroid=0;
    for (int i = 0; i < OneBH.length; i++) {    
    BHmass=90+(i*20)%150;
    //Calculate the surfer's gravity & corresponding motion only once when this loop is run against all of the asteroids
    if(surfergravity==0){
      if((abs(BHx-prevx)<(BHmass/4))&&(abs(BHy-prevy)<(BHmass/4))){
        GameOver=1;      
      }       
    OneBH[i].render(BHmass,BHx,BHy,255);
    BHdistance=sqrt((BHx-prevx)*(BHx-prevx)+(BHy-prevy)*(BHy-prevy));
    //insert the surfer mass and BH mass into the equation
    gforce= (surfMass*gConstant*BHmass)/(BHdistance*BHdistance+1);
    denom=abs(prevx-BHx)+abs(prevy-BHy);
    ratio = (BHx-prevx)/denom;
    ratiotwo = (BHy-prevy)/denom;
    xGravity = xGravity + ratio*gforce;
    yGravity = yGravity + ratiotwo*gforce;
    if(i==0){
    BHy=height/2+height/5;
    }
    else if(i%2==0){
      BHy=BHy-i*75;
    }
    else{
      BHy=BHy+i*20*sqrt(i);
    } 
   
    BHx =BHx + width/12-i;
    
   }
   else{
   BHx=OneBH[i].xx;
   BHy=OneBH[i].yy;
   }
   if((abs(Asteroidx-BHx)<(BHmass/4))&&(abs(BHy-Asteroidy)<BHmass/4)){
      AsteroidDestroyed=1;
    }
    
    Asteroiddistance=sqrt((BHx-Asteroidx)*(BHx-Asteroidx)+(BHy-Asteroidy)*(BHy-Asteroidy));
    gforce= (.01*Asteroidmass*gConstant*BHmass)/(Asteroiddistance*Asteroiddistance+1);
    denom=abs(Asteroidx-BHx)+abs(Asteroidy-BHy);
    ratio = (BHx-Asteroidx)/denom;
    ratiotwo = (BHy-Asteroidy)/denom;
    xGravityAsteroid = xGravityAsteroid + ratio*gforce;
    yGravityAsteroid = yGravityAsteroid + ratiotwo*gforce; 
    
    }
    if(AsteroidDestroyed==1 || Asteroidx+xGravityAsteroid+OneAsteroid[j].priorx<0 || Asteroidx+xGravityAsteroid+OneAsteroid[j].priorx>width*1.2 ||Asteroidy+yGravityAsteroid+OneAsteroid[j].priory<0|| Asteroidy+yGravityAsteroid+OneAsteroid[j].priory>height){
      AsteroidDestroyed=0; 
      OneAsteroid[j].priorx=-int(random(5,21));
       OneAsteroid[j].priory=0;
       Asteroidx=width*1.1;
       Asteroidy=random(height/6,5*height/6);
        OneAsteroid[j].render(Asteroidmass,Asteroidx+OneAsteroid[j].priorx,Asteroidy+OneAsteroid[j].priory,Asteroidx,Asteroidy,1,1);

    }else{
  OneAsteroid[j].render(Asteroidmass,Asteroidx+xGravityAsteroid+OneAsteroid[j].priorx,Asteroidy+yGravityAsteroid+OneAsteroid[j].priory,Asteroidx,Asteroidy,1,1);
    }
  OneAsteroid[j].priorx=((Asteroidx+xGravityAsteroid+OneAsteroid[j].priorx)-Asteroidx)*.99;
  OneAsteroid[j].priory=((Asteroidy+yGravityAsteroid+OneAsteroid[j].priory)-Asteroidy)*.99;
  if((abs(prevx-Asteroidx)<(Asteroidmass*2.5))&&(abs(Asteroidy-prevy)<(Asteroidmass*2.5))){
      GameOver=1;      
    }
    surfergravity=surfergravity+1; 
  }
  initialAsteroid=1;
//Finish Line Wormhole

stroke(255,240,0,45);
noFill();
strokeWeight(10);
ellipse(width,height/2,height/20,height/8);
ellipse(49*width/50,height/2,height/20,height/7);
ellipse(48*width/50,height/2,height/20,height/6);
ellipse(47*width/50,height/2,height/20,height/5);

stroke(255,240,0,125);
noFill();
strokeWeight(3);
ellipse(width,height/2,height/20,height/8);
ellipse(49*width/50,height/2,height/20,height/7);
ellipse(48*width/50,height/2,height/20,height/6);
ellipse(47*width/50,height/2,height/20,height/5);

stroke(255,255);
noFill();
strokeWeight(1);
ellipse(width,height/2,height/20,height/8);
ellipse(49*width/50,height/2,height/20,height/7);
ellipse(48*width/50,height/2,height/20,height/6);
ellipse(47*width/50,height/2,height/20,height/5);

if(47*width/50<prevx && prevy<(height/2+height/10) && prevy>(height/2-height/10)){
  textSize(height/4.5);
  text("Level Complete",width/9,height/2.5);
}
  
  //Surfer
    float mousex=mouseX;
    float mousey=mouseY;  
    float xsurf=mousex-prevx;
    float ysurf=mousey-prevy;
    levelTimer=levelTimer+1;
    if(levelTimer>55){
    ratio = xsurf/(abs(xsurf)+abs(ysurf));
    ratiotwo = ysurf/(abs(xsurf)+abs(ysurf));
    xsurf=ratio*distance;
    ysurf=ratiotwo*distance;
    
    }
    else{
      fill(255,240,0,255);
      textSize(height/7.5);
      String myText="Lives: "+lifeCount;
      text("Engage Thrusters!",width/9,height/3.5);
      fill(255,0,0,255);
      text(myText,width/3.5,height/1.8);
      xsurf=0;
    ysurf=0;
    xGravity=0;
    yGravity=0;
    prevx=width/15;
    prevy=height/2;
    }   
    if(((abs(mousex-prevx)+abs(prevxx))<6.5)&&((abs(mousey-prevy)+abs(prevyy))<6.5)){
      Surfers[int(surfType)].render(int(prevx),int(prevy),10,surfType,surfRed,surfBlue,surfGreen);  
    }
    else{
      Surfers[int(surfType)].render(int(prevx+xsurf+xGravity+prevxx),int(prevy+ysurf+yGravity+prevyy),10,surfType,surfRed,surfBlue,surfGreen);
      prevx=prevx+xsurf+xGravity+prevxx;
      prevy=prevy+ysurf+yGravity+prevyy;
      prevxx=xsurf+xGravity;
      prevyy=ysurf+yGravity;
    }     
  } 
  craftLost=0;
} 
  //What happens after being eaten by a black hole or destroyed by an asteroid, have different sequences that occur
   else{
   if(lifeCount>0){ //background(0);
    textSize(height/4.5);
    fill(255,0,0,255);
  text("Craft Lost",width/9,height/2.5);
  if(craftLost>50){
  lifeCount=lifeCount-1;
  if(lifeCount>0){
  sinOne=4;
  GameOver=0;
  }
  }
  craftLost=craftLost+1;
  
   }
  //If the lifeCount is at 0, then begin the Game Over sequence where any key or mouse press will return to the home screen
  if(lifeCount==0){
    delay=delay+1;
    if(delay%5==0){
    background(255,240,0,255);
    }
    else if(delay%4==0){
      background(224,255,250,255);
    }
    else if(delay%3==0){
      background(180,200,255,255);
    }
    else{
      background(100,255,120,255);
    }
    fill(255,255,255,255);
    text("Game Over",width/9,3*height/4);
    translate(width/2,height/3);
    for(float i = 0;i<LINE_C;i=i+.2){
      fill(0);
    
      stroke(0);
      point(x(i+delay),y(i+delay));point(z(i+delay),w(i+delay));
    }
    translate(-width/2,-height/3);
  if(keyPressed || mousePressed){
    GameOver=0;
    sinOne=0;
    delay=0;
  }
  }
}
  
}




//Class Documentation
 
class Star {
  float x; float y; float z;float pz;
  Star() {
    // I place values in the variables
    x = random(-width/2, width/2);
    // note: height and width are the same: the canvas is a square.
    y = random(-height/2, height/2);
    // note: the z value can't exceed the width/2 (and height/2) value,
    // beacuse I'll use "z" as divisor of the "x" and "y",
    // whose values are also between "0" and "width/2".
    z = random(width/2);
    // I set the previous position of "z" in the same position of "z",
    // which it's like to say that the stars are not moving during the first frame.
    pz = z;
  }
  void update() {
    z = z - speed;
    if (z < 1) {
      z = width/2;
      x = random(-width/2, width/2);
      y = random(-height/2, height/2);
      pz = z;
    }
  }
  void show(float uno, float dos, float tres, float quatro) {
    fill(uno,dos,tres,quatro);
    noStroke();
    float sx = map(x / z, 0, 1, 0, width/2);
    float sy = map(y / z, 0, 1, 0, height/2);;
    // I use the z value to increase the star size between a range from 0 to 16.
    float r = map(z, 0, width/2, 3, 0);
    ellipse(sx, sy, r-.8, r-.8);
    // Here i use the "pz" valute to get the previous position of the stars,
    // so I can draw a line from the previous position to the new (current) one.
    float px = map(x / pz, 0, 1, 0, width/2);
    float py = map(y / pz, 0, 1, 0, height/2);
    // Placing here this line of code, I'm sure the "pz" value are updated after the
    // coordinates are already calculated; in this way the "pz" value is always equals
    // to the "z" value of the previous frame.
    pz = z;
    stroke(uno,dos,tres,quatro);
    strokeWeight(1);
    line(px, py, sx, sy);
  }
}
class Surfer {
  float pz;
  Surfer() {  
   
  }
  void update() { 
   
    }
    void render(float x, float y, float len, float quatro, float red, float blue, float green) {
      //Color parameters are not yet utilized
      noStroke();
    if(quatro==0){
      //Superbug
      len=4;
    fill(255,240,0,255);
    
    square(x-len,y+3*len,len);
    square(x+len,y+3*len,len);
    square(x,y+3*len,len);
    square(x-len*2,y+6*len,len);
    square(x+len*2,y+6*len,len);
    
    square(x+len*2,y+len,len);
    square(x+len*2,y,len);
    square(x+len*2,y-len,len);
    square(x+len*2,y-len*2,len);
    square(x+len*3,y-len*3,len);
    square(x+len*3,y-len*4,len);
    square(x+len*4,y-len*4,len);
    square(x+len*4,y-len*5,len);
    square(x+len*5,y-len*5,len);
    square(x+len*3,y+len,len);
    
    square(x-len*2,y+len,len);
    square(x-len*2,y,len);
    square(x-len*2,y-len,len);
    square(x-len*2,y-len*2,len);
    square(x-len*3,y-len*3,len);
    square(x-len*3,y-len*4,len);
    square(x-len*4,y-len*4,len);
    square(x-len*4,y-len*5,len);
    square(x-len*5,y-len*5,len);
    square(x-len*3,y+len,len);
    
    square(x-len*5,y+len,len);
    square(x-len*5,y+len*2,len);
    square(x+len*5,y+len,len);
    square(x+len*5,y+len*2,len);
    fill(255,0,0,255);
    square(x-len,y,len*3);
    square(x,y+4*len,len);
    square(x,y+4*len,len);
    square(x+len,y+4*len,len);
    square(x-len,y+4*len,len);
    square(x+len,y+5*len,len);
    square(x,y+5*len,len);
    square(x-len,y+5*len,len);
    
    square(x+4*len,y,len);
    square(x+4*len,y+len,len);
    square(x-4*len,y,len);
    square(x-4*len,y+len,len);
    
    square(x+6*len,y+len*3,len);
    square(x+6*len,y+len*2,len);
    square(x-6*len,y+len*3,len);
    square(x-6*len,y+len*2,len);
    square(x-5*len,y+len*4,len);
    square(x+5*len,y+len*4,len);
    }
    else if(quatro==1){
      //Psych Bike
     noStroke();
      fill(255,174,204,255);
      //quad(x-len,y-len,x+len,y-len,x+len,y+len,x-len,y+len);
      len=4;
      square(x,y,len);
      square(x+len,y,len);
      square(x+len*2,y,len);
      square(x+len*2,y+len,len);
      square(x+len*2,y-len,len);
      square(x+len*2,y-len*2,len);
      square(x+len,y-len*2,len);
      square(x,y-len*2,len);
      square(x-len,y,len);
      square(x-len*2,y,len);
      square(x-len*2,y+len,len);
      square(x-len*2,y-len,len);
      square(x-len*2,y-len*2,len);
      square(x-len,y-len*2,len);
      square(x,y-len*2,len);      
      square(x,y+len*2,len);
      square(x-len,y+len*2,len);
      square(x+len,y+len*2,len);
      square(x-len*2,y+len*3,len);
      square(x+len*2,y+len*3,len);
      square(x-len*3,y+len*3,len);
      square(x+len*3,y+len*3,len);
      square(x-len*4,y+len*4,len);
      square(x+len*4,y+len*4,len);      
      square(x-len*3,y-len*2,len);
      square(x+len*3,y-len*2,len);
      square(x-len*4,y-len*2,len);
      square(x+len*4,y-len*2,len);
      square(x-len*5,y-len*2,len);
      square(x+len*5,y-len*2,len);
      square(x-len*5,y-len*3,len);
      square(x+len*5,y-len*3,len);
      square(x-len*5,y-len,len);
      square(x+len*5,y-len,len);
      fill(198,220,255,255);
      square(x,y+len,len);
      square(x-len,y+len,len);
      square(x+len,y+len,len);
      square(x,y+len*3,len);
      square(x-len,y+len*3,len);
      square(x+len,y+len*3,len);
      square(x,y+len*4,len);
      square(x-len*5,y,len);
      square(x+len*5,y,len);
      square(x-len*4,y,len);
      square(x+len*4,y,len);
      square(x-len*5,y-len*4,len);
      square(x+len*5,y-len*4,len);
      square(x-len*4,y-len*4,len);
      square(x+len*4,y-len*4,len);
    }
   else if(quatro==2){
     //The Compiler
      len=4;
      noStroke();
      fill(80,230,130,255);
      square(x,y,len);
      square(x,y-len,len);
      square(x,y-len*2,len);
      square(x,y-len*3,len);
      square(x,y-len*4,len);
      square(x,y+len,len);
      square(x,y+len*2,len);
      square(x,y+len*3,len);
      square(x,y+len*4,len);
      square(x,y+len*5,len);
      
      square(x-len,y,len);
      square(x-len,y-len,len);
      square(x-len,y-len*2,len);
      square(x-len,y-len*3,len);
      square(x-len,y+len,len);
      square(x-len,y+len*2,len);
      square(x-len,y+len*3,len);
      square(x-len,y+len*4,len);
      
      square(x+len,y,len);
      square(x+len,y-len,len);
      square(x+len,y-len*2,len);
      square(x+len,y-len*3,len);
      square(x+len,y+len,len);
      square(x+len,y+len*2,len);
      square(x+len,y+len*3,len);
      square(x+len,y+len*4,len);
      
      square(x+len*2,y,len);
      square(x+len*2,y-len,len);
      square(x+len*2,y+len,len);
      square(x+len*2,y+len*2,len);
      square(x-len*2,y,len);
      square(x-len*2,y-len,len);
      square(x-len*2,y+len,len);
      square(x-len*2,y+len*2,len);
            
      square(x+len*3,y,len);
      square(x+len*3,y+len,len);
      square(x+len*3,y+len*2,len);
      square(x-len*3,y,len);
      square(x-len*3,y+len,len);
      square(x-len*3,y+len*2,len);
      
      square(x-len*5,y,len);
      square(x-len*5,y+len,len);
      square(x+len*5,y,len);
      square(x+len*5,y+len,len);
      square(x-len*6,y,len);
      square(x-len*6,y+len,len);
      square(x+len*6,y,len);
      square(x+len*6,y+len,len);
      
      
      fill(139,0,139,255);
      square(x-len*3,y-len,len);
      square(x+len*3,y-len,len);
      square(x+len*4,y,len);
      square(x+len*4,y+len,len);
      square(x+len*4,y+len*2,len);
      square(x-len*4,y,len);
      square(x-len*4,y+len,len);
      square(x-len*4,y+len*2,len);
      
      square(x-len*7,y,len);
      square(x-len*7,y+len,len);
      square(x+len*7,y,len);
      square(x+len*7,y+len,len);
      
      square(x-len*7,y+len*2,len);
      square(x-len*7,y+len*3,len);
      square(x+len*7,y+len*2,len);
      square(x+len*7,y+len*3,len);      
      square(x-len*7,y-len,len);
      square(x-len*7,y-len*2,len);
      square(x+len*7,y-len,len);
      square(x+len*7,y-len*2,len);
      
      square(x-len*8,y,len);
      square(x-len*8,y+len,len);
      square(x+len*8,y,len);
      square(x+len*8,y+len,len);
      
      square(x-len*8,y+len*2,len);
      square(x-len*8,y-len*3,len);
      square(x+len*8,y+len*2,len);
      square(x+len*8,y-len*3,len);      
      square(x-len*8,y-len,len);
      square(x-len*8,y-len*2,len);
      square(x+len*8,y-len,len);
      square(x+len*8,y-len*2,len);
      
      square(x-len*2,y-len*4,len);
      square(x+len*2,y-len*4,len);
      square(x-len*3,y-len*4,len);
      square(x+len*3,y-len*4,len);
      
       square(x-len*3,y-len*5,len);
      square(x+len*3,y-len*5,len);
      square(x-len*4,y-len*5,len);
      square(x+len*4,y-len*5,len);
      square(x-len*5,y-len*5,len);
      square(x+len*5,y-len*5,len);
      
   }
   else{
      stroke(255);
      fill(170,190,255,255);
      triangle(x,y,x-len,y+len,x+len,y+len);
      triangle(x,y,x-len,y-len,x+len,y-len);
   }
  }
}

class BH {
  float gravity;
  float radius;
  float xx;
  float yy;
  BH(float constant) {  
  gravity = constant;
  }
  void applyForce() {      
    }
  void render(float mass, float x, float y, float quatro) {
    radius =mass/2;
    xx= x;
    yy=y;
    noStroke();
    fill(255,10);
    ellipse(x,y,radius*1.22,radius*1.2);
    fill(255,11);
    ellipse(x,y,radius*1.17,radius*1.17);
    fill(255,12);
    ellipse(x,y,radius*1.14,radius*1.14);
    fill(255,13);
    ellipse(x,y,radius*1.11,radius*1.11);
    fill(255,14);
    ellipse(x,y,radius*1.08,radius*1.08);
    fill(255,15);
    ellipse(x,y,radius*1.05,radius*1.05);
    fill(255,16);
    ellipse(x,y,radius*1.03,radius*1.03);
    strokeWeight(0.5);
    stroke(255);
    fill(0);
    noStroke();
    quad(x+radius*.2/2,y+radius/2,x-radius*.2/2,y+radius/2,x-radius*.2/2,y-radius/2,x+radius*.2/2,y-radius/2);
    quad(x+radius*.35/2,y+radius*.95/2,x-radius*.35/2,y+radius*.95/2,x-radius*.35/2,y-radius*.95/2,x+radius*.35/2,y-radius*.95/2);
    quad(x+radius*.5/2,y+radius*.89/2,x-radius*.5/2,y+radius*.89/2,x-radius*.5/2,y-radius*.89/2,x+radius*.5/2,y-radius*.89/2);
    quad(x+radius*.6/2,y+radius*.82/2,x-radius*.6/2,y+radius*.82/2,x-radius*.6/2,y-radius*.82/2,x+radius*.6/2,y-radius*.82/2);
    quad(x+radius*.71/2,y+radius*.71/2,x-radius*.71/2,y+radius*.71/2,x-radius*.71/2,y-radius*.71/2,x+radius*.71/2,y-radius*.71/2);
    quad(x+radius*.82/2,y+radius*.6/2,x-radius*.82/2,y+radius*.6/2,x-radius*.82/2,y-radius*.6/2,x+radius*.82/2,y-radius*.6/2);
    quad(x+radius*.89/2,y+radius*.5/2,x-radius*.89/2,y+radius*.5/2,x-radius*.89/2,y-radius*.5/2,x+radius*.89/2,y-radius*.5/2);
    quad(x+radius*.95/2,y+radius*.35/2,x-radius*.95/2,y+radius*.35/2,x-radius*.95/2,y-radius*.35/2,x+radius*.95/2,y-radius*.35/2);
    quad(x+radius*1/2,y+radius*.2/2,x-radius*1/2,y+radius*.2/2,x-radius*1/2,y-radius*.2/2,x+radius*1/2,y-radius*.2/2); 
  }
}
class Asteroid {
  float gravity;
  float radius;
  float xx;
  float yy;
  float priorx;
  float priory;
  float secondpriorx;
  float secondpriory;
  float tailLength=19;
  float ratio;
  float ratioy;
  Asteroid(float constant) {  
  gravity = constant;
  }
  void applyForce() {      
    }
  void render(float mass, float x, float y, float prevx, float prevy, float prevxx,float prevyy) {
    //Make sure the asteroids have a lot less mass so they don't fall in as easily
    xx=x;
    yy=y;
    radius =mass/2;
    noStroke();
    fill(255,0,0,28);
    ratio = (prevx-secondpriorx)/(abs(prevx-secondpriorx)+abs(prevy-secondpriory));
    ratioy = (prevy-secondpriory)/(abs(prevx-secondpriorx)+abs(prevy-secondpriory));
   ellipse(prevx-tailLength*ratio*-.2,prevy-tailLength*ratioy*-.2,radius*6,radius*6);
    ellipse(prevx-tailLength*ratio*0,prevy-tailLength*ratioy*0,radius*5.8,radius*5.8);
    fill(255,0,0,24);
    ellipse(prevx-tailLength*ratio*.2,prevy-tailLength*ratioy*.2,radius*5.6,radius*5.6);
    ellipse(prevx-tailLength*ratio*.4,prevy-tailLength*ratioy*.4,radius*5.4,radius*5.4);
    fill(255,0,0,20);
    ellipse(prevx-tailLength*ratio*.6,prevy-tailLength*ratioy*.6,radius*5.2,radius*5.2);
    ellipse(prevx-tailLength*ratio*.8,prevy-tailLength*ratioy*.8,radius*5.0,radius*5.0);
    fill(255,0,0,16);
    ellipse(prevx-tailLength*ratio*1,prevy-tailLength*ratioy*1,radius*4.8,radius*4.8);
    ellipse(prevx-tailLength*ratio*1.2,prevy-tailLength*ratioy*1.2,radius*4.6,radius*4.6);
    fill(255,0,0,12);
    ellipse(prevx-tailLength*ratio*1.4,prevy-tailLength*ratioy*1.4,radius*4.4,radius*4.4);
    ellipse(prevx-tailLength*ratio*1.6,prevy-tailLength*ratioy*1.6,radius*4.2,radius*4.2);
    fill(255,0,0,8);
    ellipse(prevx-tailLength*ratio*1.8,prevy-tailLength*ratioy*1.8,radius*4.0,radius*4.0);

    strokeWeight(0.1);
    stroke(255);
    fill(255,0,0,255);
    stroke(255,255);
    quad(x+radius*2,y+radius,x+radius*2,y-radius,x-radius*2,y-radius,x-radius*2,y+radius);
    quad(x+radius,y-radius*2,x+radius,y+radius*2, x-radius,y+radius*2,x-radius,y-radius*2);    
    quad(x+radius*1.5,y-radius*1.5,x-radius*1.5,y-radius*1.5, x-radius*1.5,y+radius*1.5,x+radius*1.5,y+radius*1.5); 
    stroke(255,0,0,255);
    secondpriorx=prevx;
  secondpriory=prevy;;
    
  }
}

void rectangle(float x, float y, float w, float h, float r, float g, float b, float o){
  noStroke();
  strokeWeight(0.1);
  stroke(255,255);
  fill(r,g,b,o);
quad(x-w/2,y-h/2,x-w/2,y+h/2,x+w/2,y+h/2,x+w/2,y-h/2); 
}



//Parametric Equations

float x(float t){
    return cos(sqrt(t))*PI*25/(sin(t)+2);
  
}
float y(float t){
    return sin(sqrt(t))*PI*25/(cos(t)+2);
  
}
float z(float t){
    return cos(t*t)*160-sin(t);
  
}
float w(float t){
    return sin(t*t)*150+cos(t*sin(t));
  
}
