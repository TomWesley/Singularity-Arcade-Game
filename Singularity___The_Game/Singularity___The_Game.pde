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
PImage img;
float s=0;
float w;
float time;
float osx;
float osy;
float theta;
float size =0;
float sizer=0;
float rando;
float m;
float phase;
float phasee;
float delay=0;
float flareon=0;
float jolteon=0;
float varry =1;
float varryable =1;
int doors=0;
int check =0;
float setoff=0;
static final int LINE_C =100;
static final int LINE_O =360;
float numb=0;
float er=0;
float umbreon=0;
float gen =0;
float open;
float fire;
float ball;
float checkpoint=0;
float meh;
int diag=0;
float corners=0;
int wave=int(random(10,20));
int lightning = 15;
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
float distance=2.8;
float mousex;
float mousey;
int GameOver=0;

float xGravity=0;
float yGravity=0;
float gConstant=180;
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
    
//Surfer variables
    float surfRed;
    float surfBlue;
    float surfGreen;
    float surfType;
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
  for(int i=20;i>0;i=i-1){
    fill(255,255,255,255-i*16);
    textSize(height/(4.5+i/16));
    text("SINGULARITY",(width/13)+i/3,(height/2)-i*1.5);
  }
  textSize(height/4.5);
  fill(255,240,0,255);
  text("SINGULARITY",width/13,height/2);
  if(delay>30){
    textSize(height/10.5);
    text("Press Any Key To Begin",width/6,height-height/4);
    if(keyPressed){
   sinOne=2; 
  }
  }
  
  speed = map(10+delay/200, 0, width, 0, 50); 
  
  prevx=width/15;
  prevy=height/2;
  //Surfers[0] = new Surfer();
  }
  else if(sinOne==2){
    background(0);
    for (int i = 0; i < stars.length; i++) {
    stars[i].show(255,255,255,255);
   }
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
    text("Tripod Trekker",width/4,height-height/10);
    text("Psych Bike",width/4,height-3*height/10);
    text("The Compiler",width/4,height-5*height/10);
    text("Entangled Species",width/4,height-7*height/10);
    Surfers[0].render(width/8,height-height/10,10,0,255,255,255); 
    Surfers[1].render(width/8,height-3*height/10,10,1,255,255,255); 
    Surfers[2].render(width/8,height-5*height/10,10,2,255,255,255); 
    Surfers[3].render(width/8,height-7*height/10,10,3,255,255,255); 
    //Display stats for each of the vehicles. Speed and Mass 
    if(mousePressed){
      if((mouseY<height && mouseY>height-2*height/10)){
        //maybe use mousepressed location so people can play with a wireless mouse
        sinOne=4;
        surfType=0;
      }
      else if((mouseY<height-2*height/10 && mouseY>height-4*height/10)){
        sinOne=4;
        surfType=1;
      }
      else if((mouseY<height-4*height/10 && mouseY>height-6*height/10)){
        sinOne=4;
        surfType=2;
      }
      else if((mouseY<height-6*height/10 && mouseY>height-8*height/10)){
        sinOne=4;
        surfType=3;
      }
    }
   // Surfers[0].render(width/8,3*height/10,10,0);  
   
  }
  else if(sinOne==3){
    //Color selection happens here
    text("Color Selection",width/6,height-height/4);    
    text("Photovoltaic",width/3,height-height/10);
    text("Gamma-Ray Burst",width/3,height-3*height/10);
    text("Cosmic ",width/3,height-5*height/10); //Midnight Blue
    text("Pulsar",width/3,height-7*height/10); //WhitishBlue
  }
  else{
    
   background(0,0,0,255); 
   translate(width/2,height/2);
   for (int i = 0; i < stars.length; i++) {
    stars[i].show(255,255,255,255);
   }
   translate(-width/2,-height/2);
   //Level 1   
   //Galaxy Start
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
   sinx=sinx*cos(radians(j));
   sinx=(j*.15)*cos(radians(sinAngle+j*15+270))+width/15;
   siny=(j*.05)*sin(radians(sinAngle+j*15+270))+height/2;
   siny=siny+(sinx-width/15)*.25;
   quad(sinx+galaxSize,siny+galaxSize,sinx+galaxSize,siny-galaxSize,sinx-galaxSize,siny-galaxSize,sinx-galaxSize,siny+galaxSize);
   noStroke(); 
   }
   translate(30,height/4.3);
   scale((1/1.8));
     
     //Black Holes/Asteroids Level One
    float Asteroiddistance;
    float Asteroidmass=30;
    float AsteroidInitialSpeed=21;
    float BHdistance;
    float BHx =width/5;
    float BHy=height/2;
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
   // if(surfergravity==0)
    Asteroidmass=5;
    xGravityAsteroid=0;
    yGravityAsteroid=0;
    for (int i = 0; i < OneBH.length; i++) {    
   BHmass=40+(i*50)%200;
   if(surfergravity==0){
    if((abs(BHx-prevx)<(BHmass/4))&&(abs(BHy-prevy)<(BHmass/4))){
      GameOver=1;      
    }   
    
    OneBH[i].render(BHmass,BHx,BHy,255);
    BHdistance=sqrt((BHx-prevx)*(BHx-prevx)+(BHy-prevy)*(BHy-prevy));
    gforce= (1.2*gConstant*BHmass)/(BHdistance*BHdistance+1);
    denom=abs(prevx-BHx)+abs(prevy-BHy);
    ratio = (BHx-prevx)/denom;
    ratiotwo = (BHy-prevy)/denom;
    xGravity = xGravity + ratio*gforce;
    yGravity = yGravity + ratiotwo*gforce;
    if(i%2==0){
    BHy=BHy-i*88;
    }
    else{
      BHy=BHy+i*87;
    } 
    BHx =BHx + 110-i;
   }
   else{
   BHx=OneBH[i].xx;
   BHy=OneBH[i].yy;
   }
   if((abs(Asteroidx-BHx)<(BHmass/4))&&(abs(BHy-Asteroidy)<BHmass/4)){
      AsteroidDestroyed=1;
    }
    
    Asteroiddistance=sqrt((BHx-Asteroidx)*(BHx-Asteroidx)+(BHy-Asteroidy)*(BHy-Asteroidy));
    gforce= (.09*gConstant*BHmass)/(Asteroiddistance*Asteroiddistance+1);
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
  if((abs(prevx-Asteroidx)<(Asteroidmass*2))&&(abs(Asteroidy-prevy)<(Asteroidmass*2))){
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
    ratio = xsurf/(abs(xsurf)+abs(ysurf));
    ratiotwo = ysurf/(abs(xsurf)+abs(ysurf));
    xsurf=ratio*distance;
    ysurf=ratiotwo*distance;
   
    if(((abs(mousex-prevx)+abs(prevxx))<3.5)&&((abs(mousey-prevy)+abs(prevyy))<3.5)){
      Surfers[0].render(prevx,prevy,10,surfType,surfRed,surfBlue,surfGreen);  
    //  prevx=prevx;      
    }
    else{
    Surfers[0].render(prevx+xsurf+xGravity+prevxx,prevy+ysurf+yGravity+prevyy,10,surfType,surfRed,surfBlue,surfGreen);
      prevx=prevx+xsurf+xGravity+prevxx;
    prevy=prevy+ysurf+yGravity+prevyy;
    prevxx=xsurf+xGravity;
    prevyy=ysurf+yGravity;
    }
     
  } 
} 
  //What happens after being eaten by a black hole or destroyed by an asteroid, have different sequences that occur
   else{
    //background(0);
    textSize(height/4.5);
    fill(255,250,0,255);
  text("Craft Lost",width/9,height/2.5);
  if(keyPressed){
    GameOver=0;
    sinOne=0;
    delay=0;
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
    pz = 7;
  }
  void update() { 
      pz = 6;
    }
    void render(float x, float y, float len, float quatro, float red, float blue, float green) {
      //Three color tints, A yellow, pink, and midnight blue
    if(quatro==0){
    fill(255,240,130,255);
    noStroke();
    stroke(255);
    triangle(x-len,y+len,x,y-len,x+len,y+len);
    line(x-len*2,y+len*2,x-len,y+len);
    line(x,y-len*2,x,y-len);
    line(x+len,y+len,x+len*2,y+len*2);
    noFill();
    stroke(255,240,130,255);
    triangle(x+len*2,y+len*2,x,y-len*2,x-len*2,y+len*2);   
    }
    else if(quatro==1){
      stroke(255);
      fill(255,174,204,255);
      quad(x-len,y-len,x+len,y-len,x+len,y+len,x-len,y+len);
    }
   else if(quatro==2){
      stroke(255);
      fill(50,50,200,255);
      ellipse(x,y,len*2,len*2);
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
    fill(255,9);
    ellipse(x,y,radius*1.22,radius*1.2);
    fill(255,10);
    ellipse(x,y,radius*1.17,radius*1.17);
    fill(255,11);
    ellipse(x,y,radius*1.14,radius*1.14);
    fill(255,12);
    ellipse(x,y,radius*1.11,radius*1.11);
    fill(255,13);
    ellipse(x,y,radius*1.08,radius*1.08);
    fill(255,14);
    ellipse(x,y,radius*1.05,radius*1.05);
    fill(255,15);
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
