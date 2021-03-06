//Copyright © 2019 TomWesley
//SINGULARITY: This original novelty arcade game allows users pilot a Spacecraft which surfs on the gravitational waves of black holes to explore various galaxies. 
//Coder: Thomas Wesley 
//Last Edit 1/1/2020
//Notes - Add some aliens in the top left corner that shoots every 3 seconds, on levels 9 & ten Singularity: Add an extra life(Green diamond in a spot on level 5). More Levels In General. And, the Victory Screen!
//Current Level Count - 5

//Variable Declarations - Need Cleaned Up
Star[] stars = new Star[800];
Surfer[] Surfers = new Surfer[4];
BH[] OneBH = new BH[10];
Asteroid[] OneAsteroid = new Asteroid[17];
//Control the star speed
float speed;
//Victory Sequence
float wave=35;
float phase;
float meh;
float osx;
float osy;
float flareon =140;
float jolteon =0;
float s=0;
float w;
float theta;
float m;

float delay=0;
static final int LINE_C =200;
static final int LINE_O =360;
float gen =0;

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
float LevelChangeCount=0;
float LevelChangeTrigger=0;
float noText=0;
float levelStart=0;

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
    float extraLife=1;
    float displayExtraLife=0;
    float distance=4;
    float surfRed;
    float surfBlue;
    float surfGreen;
    float surfType;
    float surfMass; //Make sure this goes into the gravity equation
    float levelTimer=0;
    float level=1;
    float victory=0;
    float turnoff=0;
//Game Over Sequence    
    float craftLost=0;//counter to ensure the craft lost sequences are timed correctly before resetting

void setup() {
  //The initial background is black
  background(0);
  //Size the frame to the fullscreen of where it is being deployed
  fullScreen();
  //Create arrays of the class objects to be utilized in the draw phase
  for (int i = 0; i < stars.length; i++) {
    stars[i] = new Star(); 
  }
  for (int i = 0; i < OneBH.length; i++) {
    OneBH[i] = new BH(10); 
  }
  for (int i = 0; i < OneAsteroid.length; i++) {
    OneAsteroid[i] = new Asteroid(18); 
  }
  for (int i = 0; i < Surfers.length; i++) {
    Surfers[i] = new Surfer();
  }
}

//The draw function runs through the actions contained in a loop
void draw() {
  cursor(CROSS); //Possibly insert a custom cursor eventually
  delay=delay+1;
  if(GameOver==0){
    cursor(CROSS); 
    if(sinOne==0){
      //Title Screen when sinOne =0
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
      lifeCount=3; //Reset the number of lives each time the game is restarted
      level=7; //Reset the game to level 1(Change for debugging)
      textSize((width)/7.2);
      if(delay<255){
        fill(255,240,0,255-(255-delay));
      }
      else{
        fill(255,240,0,255);
      }
      text("SINGULARITY",width/13.3,height/2);
      if(delay>250){
        textSize((width)/23.5);
        text("Press Any Key To Begin",width/4,height-height/4);
      }
      if(delay>30){ //Delay the ability to exit the selection screen so the previous click does not trigger it accidentally
        if(keyPressed || mousePressed){
          sinOne=2;
          Craftselectioncount=15;
          extraLife=1;
        }
      }
      if((10+delay/220)<10000){
        speed = map(10+delay/220, 0, width, 0, 50); //The stars speed will increase over time
      }
      else{
        speed = map(10000, 0, width, 0, 50);
      }
      prevx=width/13;
      prevy=height/2.1;
    }
    else if(sinOne==2){
      turnoff=0;
      //Surfer Selection Page when sinOne=2
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
      line(width/7,height/5.5,width-width/7,height/5.5); //Underline
      //Display the surfer sprites and stats here
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
      text("Voidwalker",width/4,height-8.8*height/13);
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
      //Superbug Stats
      rectangle(width-width/6,height-0.915*height/13,height/60,height/30,255,240,0,255);
      rectangle(width-width/6.5,height-0.915*height/13,height/60,height/30,255,240,0,255);
      rectangle(width-width/6.5+abs(width/6.5-width/6),height-0.915*height/13,height/60,height/30,255,240,0,255);
      rectangle(width-width/6.5+2*abs(width/6.5-width/6),height-0.915*height/13,height/60,height/30,255,240,0,255);   
      rectangle(width-width/6,height-1.715*height/13,height/60,height/30,255,240,0,255);
      rectangle(width-width/6.5,height-1.715*height/13,height/60,height/30,255,240,0,255);
      rectangle(width-width/6.5+abs(width/6.5-width/6),height-1.715*height/13,height/60,height/30,255,240,0,255);    
      //Psych Bike Stats
      rectangle(width-width/6,height-3.505*height/13,height/60,height/30,255,174,204,255);    
      rectangle(width-width/6,height-3.505*height/13-abs(1.715*height/13-0.915*height/13),height/60,height/30,255,174,204,255);
      rectangle(width-width/6.5,height-3.505*height/13-abs(1.715*height/13-0.915*height/13),height/60,height/30,255,174,204,255);
      rectangle(width-width/6.5+abs(width/6.5-width/6),height-3.505*height/13-abs(1.715*height/13-0.915*height/13),height/60,height/30,255,174,204,255);
      rectangle(width-width/6.5+2*abs(width/6.5-width/6),height-3.505*height/13-abs(1.715*height/13-0.915*height/13),height/60,height/30,255,174,204,255);    
      //Compiler Stats
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
      //VoidWalker Stats
      translate(0,-(height/13)*2.6*2);
      rectangle(width-width/6,height-3.505*height/13,height/60,height/30,100,14,237,255); 
      rectangle(width-width/6+abs(width/6.5-width/6),height-3.505*height/13,height/60,height/30,100,14,237,255);  
      rectangle(width-width/6+2*abs(width/6.5-width/6),height-3.505*height/13,height/60,height/30,100,14,237,255); 
      rectangle(width-width/6,height-3.505*height/13-abs(1.715*height/13-0.915*height/13),height/60,height/30,100,14,237,255);
      //Render the Sprites
      translate(0,(height/13)*2.6*2);
      Surfers[0].render(width/8,height-height/10,10,0,255,255,255); 
      Surfers[1].render(width/8,height-3*height/10,10,1,255,255,255); 
      Surfers[2].render(width/8,height-5*height/10,10,2,255,255,255); 
      Surfers[3].render(width/8,height-7*height/10,10,3,255,255,255); 
      if(Craftselectioncount<0){
        if(mousePressed){
          if((mouseY<height && mouseY>height-2*height/10)){
            //SuperBug
            surfMass=2.9;
            distance=9.5;
            sinOne=4;
            surfType=0;
          }
          else if((mouseY<height-2*height/10 && mouseY>height-4*height/10)){
            //Psych Bike
            surfMass=2.3;
            distance=10.25;
            sinOne=4;
            surfType=1;
          }
          else if((mouseY<height-4*height/10 && mouseY>height-6*height/10)){
            //The Compiler
            surfMass=3.1;
            distance=11;
            sinOne=4;
            surfType=2;
          }
          else if((mouseY<height-6*height/10 && mouseY>height-8*height/10)){
            //Voidwalker
            surfMass=2.7;
            distance=8;
            sinOne=4;
            surfType=3;
          }
        }
      }
      if(Craftselectioncount!=-5){ //Use this to prevent an immediate selection by not accepting clicks in the first moments after entering the Surfer Selection Page
        Craftselectioncount=Craftselectioncount-1;
      }
    }
    else if(sinOne>=4){
      if(sinOne==4){
        prevx=width/13;
        prevy=height/2.1;
        levelTimer=0;
        initialAsteroid=0;
        noText=0;
        levelStart=0;
      }

      if((keyPressed || mousePressed)&& turnoff>10){
      sinOne=5;
      levelStart=1;
      noText=1;
      }
      if(turnoff<11){
      turnoff=turnoff+1;
      }
      background(0,0,0,255); 
      translate(width/2,height/2);
      for (int i = 0; i < stars.length; i++) {
        stars[i].show(255,255,255,255);
      }
      translate(-width/2,-height/2);
      textSize(height/7.5);
      
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
        for(float j = 350;j>6;j=j-.5){   
          sinx=(j*.15)*cos(radians(sinAngle+j*15))+width/15;
          siny=(j*.05)*sin(radians(sinAngle+j*15))+height/2;
          siny=siny+(sinx-width/15)*.25;
          noStroke();
          fill(255,174,206,105);
          quad(sinx+(galaxSize),siny+galaxSize,sinx+galaxSize,siny-galaxSize,sinx-galaxSize,siny-galaxSize,sinx-galaxSize,siny+galaxSize);
          fill(255,0,128,105);
          sinx=(j*.15)*cos(radians(sinAngle+j*15+90))+width/15;
          siny=(j*.05)*sin(radians(sinAngle+j*15+90))+height/2;
          siny=siny+(sinx-width/15)*.25;
          quad(sinx+galaxSize,siny+galaxSize,sinx+galaxSize,siny-galaxSize,sinx-galaxSize,siny-galaxSize,sinx-galaxSize,siny+galaxSize);
          sinx=(j*.15)*cos(radians(sinAngle+j*15+180))+width/15;
          siny=(j*.05)*sin(radians(sinAngle+j*15+180))+height/2;
          siny=siny+(sinx-width/15)*.25;
          fill(255,0,128,105);
          quad(sinx+(galaxSize),siny+galaxSize,sinx+galaxSize,siny-galaxSize,sinx-galaxSize,siny-galaxSize,sinx-galaxSize,siny+galaxSize);
          fill(255,255,255,105);
          sinx=(j*.15)*cos(radians(sinAngle+j*15+270))+width/15;
          siny=(j*.05)*sin(radians(sinAngle+j*15+270))+height/2;
          siny=siny+(sinx-width/15)*.25;
          quad(sinx+galaxSize,siny+galaxSize,sinx+galaxSize,siny-galaxSize,sinx-galaxSize,siny-galaxSize,sinx-galaxSize,siny+galaxSize);
        }   
        translate(30,height/4.3);
        scale((1/1.8));
      }
      //Black Holes/Asteroids 
      float Asteroiddistance;
      float Asteroidmass=30;
      float AsteroidInitialSpeed=12;
      float BHdistance;
      float BHx =width/6;
      float BHy=height/6;
      float gforce;
      float BHmass=0;
      float xGravityAsteroid= 0;
      float yGravityAsteroid= 0;
      float denom; 
      xGravity=0;
      yGravity=0;
      
      surfergravity = 0; //Do the surfers relation to the black holes only once
      for (int j = 0; j < OneAsteroid.length; j++) {
        AsteroidDestroyed=0;
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
//Cleanup Point
    Asteroidmass=4+j%4; // Control the variety of asteroid sizes
    xGravityAsteroid=0; //The gravity acting on the asteroids
    yGravityAsteroid=0; //
    for (int i = 0; i < OneBH.length; i++) {
      //Black Hole Masses and Locations Depending on the Level
      if(level==1){
        if(i==0){
          BHmass=350;
          BHx=width/2;
          BHy=height/2;
        }
        else if(i==1){
          BHmass=100;
          BHx=(8)*width/12;
          BHy=height-height/9;
        }
        else if(i==2){
          BHmass=100;
          BHx=(8)*width/12;
          BHy=height/9;
        }
        else{
          BHmass=1;
          BHx=-width;
          BHy=height/2;
        }
      }
      if(level==2){
        BHx =BHx + width/13;
        BHmass=100+(i*20)%150;
        if(i==0){
          BHy=height/2-height/5;
        }
        else if(i%2==0){
          BHy=BHy-2*180-i%40;
        }
        else{
          BHy=BHy+95*4+30*cos(radians(i));
        } 
      }
      else if(level==3){
        if(i==2){
          BHmass=500;
        }
        else{
          BHmass=140+(i*30)%160;
        }
        if(i==0){
          BHx=width/2+width/12;
          BHy=height/12;
        }
        if(i==1){
          BHx=width/2+width/9;
          BHy=height-height/12;
        }
        if(i==2){
          BHx=width/2;
          BHy=height/2;
        }
        if(i==3){
          BHx=width/2+width/3.9;
          BHy=height/1.85;
        }
        if(i==4){
          BHx=width-width/50;
          BHy=height;
        }
        if(i==5){
          BHx=width-width/40;
          BHy=0;
        }
        if(i==6){
          BHx=width/70;
          BHy=height/1.5;
        }
        if(i==7){
          BHx=width/4;
          BHy=height/8;
        }
        if(i==8){
          BHx=width/4;
          BHy=height-height/5;
        }
        if(i==9){
          BHx=width/12;
          BHy=height/90;
        }      
      }
      else if(level==4){
        if(i==0){
          BHx=170*cos(radians(delay))+width/2;
          BHy=240*sin(radians(delay))+height/2; 
          BHmass=350;
        }
        else if(i==1){
          BHx=170*cos(radians(delay-180))+width/2;
          BHy=240*sin(radians(delay-180))+height/2; 
          BHmass=250;
        }
        else{
          BHmass=210;
        }
        if(i>1){
          BHx=-200;
          BHy=i*width/10;
        } 
      }
      else if(level==5){
        if(i==0){
          BHmass=250;
          BHx=width/2.8;
          BHy=height/2;
        }
        else if(i==1){
          BHmass=120;
          BHx=width/2;
          BHy=height-height/2.8;
        }
        else if(i==2){
          BHmass=120;
          BHx=width/2;
          BHy=height/2.8;
        }
        else if(i==3){
          BHmass=80;
          BHx=width/10;
          BHy=height-height/8;
        }
        else if(i==4){
          BHmass=80;
          BHx=width-width/9;
          BHy=height/10;
        }
        else if(i==5){
          BHmass=80;
          BHx=width/3;
          BHy=height/7;
        }
        else{
          BHmass=40+i*20;
          BHx=width/3+(i-6)*width/6;
          BHy=height*.9-(i-6)*height/13;
        }
      }
      else if(level==6){
        if(i%2==0 ){
          BHmass=200+i*20;
          BHx=400*tan(radians(delay+i*72))*cos(radians(delay+i*72))+width/1.5;
          BHy=600*cos(radians(delay+i*72))*sin(radians(delay+i*72))+height/2;  
        }
        else{
          BHx=-200;
          BHy=i*width/10;
          BHmass=10;
        }
      }
      else if(level==7){
        BHmass=180+int(log(i%5))*100;
        BHx=width/11+i*width/13;
        if(i%2==0){
          BHy=sqrt(i)*height/8.5;
        }
        else{
          BHy=height-sqrt(i)*height/8.7;
        }
      }
    //Calculate the surfer's gravity & corresponding motion only once when this loop is run against all of the asteroids
    if(surfergravity==0){
      if((abs(BHx-prevx)<(BHmass/4))&&(abs(BHy-prevy)<(BHmass/4))){
        GameOver=1;      
      }       
    OneBH[i].render(BHmass,BHx,BHy,255);
    BHdistance=sqrt((BHx-prevx)*(BHx-prevx)+(BHy-prevy)*(BHy-prevy));
    //insert the surfer mass and BH mass into the equation
    gforce= (surfMass*gConstant*(BHmass*.8+BHmass*BHmass*.0011))/(BHdistance*BHdistance+1);
    denom=abs(prevx-BHx)+abs(prevy-BHy);
    ratio = (BHx-prevx)/denom;
    ratiotwo = (BHy-prevy)/denom;
    xGravity = xGravity + ratio*gforce;
    yGravity = yGravity + ratiotwo*gforce;
    } 
   else{
   BHx=OneBH[i].xx;
   BHy=OneBH[i].yy;
   }
   
   if((abs(Asteroidx-BHx)<(BHmass/4)) && (abs(Asteroidy-BHy)<BHmass/4)){
      AsteroidDestroyed=1;
    }

    Asteroiddistance=sqrt((BHx-Asteroidx)*(BHx-Asteroidx)+(BHy-Asteroidy)*(BHy-Asteroidy));
    gforce= (.015*Asteroidmass*gConstant*BHmass)/(Asteroiddistance*Asteroiddistance+1);
    denom=abs(Asteroidx-BHx)+abs(Asteroidy-BHy);
    ratio = (BHx-Asteroidx)/denom;
    ratiotwo = (BHy-Asteroidy)/denom;
    xGravityAsteroid = xGravityAsteroid + ratio*gforce;
    yGravityAsteroid = yGravityAsteroid + ratiotwo*gforce;     
    }
   //if(AsteroidDestroyed==1 || (Asteroidx+xGravityAsteroid+OneAsteroid[j].priorx) < 0 || (Asteroidx+xGravityAsteroid+OneAsteroid[j].priorx) > width*1.2 || (Asteroidy+yGravityAsteroid+OneAsteroid[j].priory) < 0|| (Asteroidy+yGravityAsteroid+OneAsteroid[j].priory) > height){
   if(AsteroidDestroyed==1 || (Asteroidx) < 0 || (Asteroidx) > width*1.2 || (Asteroidy) < 0|| (Asteroidy) > height){
      AsteroidDestroyed=0; 
      if(level==1){
      OneAsteroid[j].priorx=-int(random(3,6));
      }
      if(level==2){
      OneAsteroid[j].priorx=-int(random(6,12));
      }
      else if(level==3){
        OneAsteroid[j].priorx=-int(random(8,15));
      }
      else if(level==4){
        OneAsteroid[j].priorx=-int(random(14,21));
      }
      else if(level==5){
        OneAsteroid[j].priorx=-int(25);
      }
      else if(level==6){
        OneAsteroid[j].priorx=-int(random(23,35));
      }
      else if(level==7){
        OneAsteroid[j].priorx=-int(random(30,40));
      }
       OneAsteroid[j].priory=0;
       Asteroidx=width*1.1;
       Asteroidy=random(height/100,99*height/100);
       if(Asteroidy>(height/2-(height/11)) && Asteroidy<(height/2+(height/11)) && level!=7){
         if(delay%2==0){
           Asteroidy=random(0,2*height/6);
         }
         else{
           Asteroidy=random(4*height/6,height);
         }       
       }
        OneAsteroid[j].render(Asteroidmass,Asteroidx+OneAsteroid[j].priorx,Asteroidy+OneAsteroid[j].priory,Asteroidx,Asteroidy,1,1);
      
    }
    else{
      OneAsteroid[j].render(Asteroidmass,Asteroidx+xGravityAsteroid+OneAsteroid[j].priorx,Asteroidy+yGravityAsteroid+OneAsteroid[j].priory,Asteroidx,Asteroidy,1,1);
    }
    OneAsteroid[j].priorx=((Asteroidx+xGravityAsteroid+OneAsteroid[j].priorx)-Asteroidx)*.99;
    OneAsteroid[j].priory=((Asteroidy+yGravityAsteroid+OneAsteroid[j].priory)-Asteroidy)*.99;
    if((abs(prevx-Asteroidx)<(Asteroidmass*2.5))&&(abs(Asteroidy-prevy)<(Asteroidmass*2.5))){
      GameOver=1;
    }
    if(surfergravity==0){
      surfergravity=surfergravity+1; 
    }
  }
  initialAsteroid=1;
//Finish Line Wormhole - Make this into Quads at some point and maybe a class
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


//The trigger for beating the level, indicate the level completion and have brief break
if(LevelChangeTrigger==0 && GameOver==0 && 46*width/50<prevx && prevy<(height/2+height/10) && prevy>(height/2-height/10)){
  LevelChangeCount=0;
  LevelChangeTrigger=1;
}
if(LevelChangeTrigger==1){
  GameOver=0;
  textSize(height/6.3);
  fill(255,240,0,255);  
  if(LevelChangeCount<50){
    text("Level Complete",width/9,height/2.8);
    noStroke();
    fill(150,250,180,35);
    quad(0,0,width,0,width,height,0,height);
  } 
  else{
  LevelChangeTrigger=0;
  sinOne=4;
  level=level+1;
  //Change the next value here to reflect the final level which will trigger the victory sequence
  if(level==8){ //Add a spiral black hole level
    GameOver=2;
  } 
}
LevelChangeCount=LevelChangeCount+1;
}
//Extra Life Section(Only on level 5)
  if(level==5){
    if(extraLife==1){
    float len=4;
    extraLife(len);
    }
    
    if(prevx<(width/2+39) && prevx>(width/2-35) && prevy<(height/2+39) && prevy>(height/2-35) && extraLife==1){
      lifeCount=lifeCount+1;
      extraLife=0; 
      displayExtraLife=25;
      
    }
    if(displayExtraLife>0){
      fill(120,255,140,255);
      textSize(height/7.5);
      text("Extra Life +", width/4.2,height/3.5);
      displayExtraLife=displayExtraLife-1;
    }
  }
  
  //Surfer
    float mousex=mouseX;
    float mousey=mouseY;  
    float xsurf=mousex-prevx;
    float ysurf=mousey-prevy;
    levelTimer=levelTimer+1;
    if(levelTimer>45){
    ratio = xsurf/(abs(xsurf)+abs(ysurf));
    ratiotwo = ysurf/(abs(xsurf)+abs(ysurf));
    xsurf=ratio*distance;
    ysurf=ratiotwo*distance;
    
    }
    else{
      if(levelStart==0){
        fill(255,240,0,255);
        text("PRESS ANY KEY",width/4.8,height/3.5);   
        String thisText="Lives: "+lifeCount;
        fill(255,0,0,255);
        text(thisText,width/3.2,height/1.8);
      }
      if(noText==1){
      fill(255,240,0,255);
      textSize(height/7.5);
      String myText="Lives: "+lifeCount;
      text("Engage Thrusters!",width/9,height/3.5);
      fill(255,0,0,255);
      text(myText,width/3.2,height/1.8);
      }
      xsurf=0;
    ysurf=0;
    xGravity=0;
    yGravity=0;
    prevx=width/13;
    prevy=height/2.1;
    GameOver=0;
    }   
    if(((abs(mousex-prevx)+abs(prevxx))<10.5)&&((abs(mousey-prevy)+abs(prevyy))<10.5)){
      Surfers[int(surfType)].render(int(prevx),int(prevy),10,surfType,surfRed,surfBlue,surfGreen);  
    }
    else{
      Surfers[int(surfType)].render(int(prevx+xsurf+xGravity+prevxx),int(prevy+ysurf+yGravity+prevyy),10,surfType,surfRed,surfBlue,surfGreen);
      prevx=prevx+xsurf+xGravity+prevxx;
      prevy=prevy+ysurf+yGravity+prevyy;
      prevxx=xsurf+xGravity;
      prevyy=ysurf+yGravity;
    }  
    //Display what level it is
  fill(255,240,0,255);
  textSize(height/20);
  text(int(level),width/40,height/20);
  } 
  craftLost=0;  
} 
  //What happens after being eaten by a black hole or destroyed by an asteroid, have different sequences that occur
   else if(GameOver==1){
     if(lifeCount>0){
     textSize(height/4.5);
     fill(255,0,0,255);
     text("Craft Lost",width/9,height/2.5);
     noStroke();
     if(craftLost<10){
    fill(240,140,255,7);
    quad(0,0,width,0,width,height,0,height);
     }
     if(craftLost>105){
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
    delay=delay+1;/*
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
    }*/
    if(delay%4==0){
      background(255,240,0,255);
    }
    else if(delay%3==0){
      background(255,40,40,255);
    }
    else{
      background(255,255);
    }
    //background(255-(tan(radians(delay*delay))),240-32*cos(radians(delay*2)),0+30*sin(PI*radians(delay)),255);
    fill(255,255,255,255);
    text("Game Over",width/8.7,3*height/4);
    //print(level-1);//Output the level and save to database(figure that out)
    translate(width/2,height/3);
    for(float i = 0;i<LINE_C;i=i+.2){
      fill(0);   
      stroke(0);
      point(x(i+delay),y(i+delay));
      point(z(i+delay),w(i+delay));
    }
    translate(-width/2,-height/3);
  if(keyPressed || mousePressed){
    GameOver=0;
    sinOne=0;
    delay=0;
  }
  }
   }
   //Set Gameover to 2 in order to reach the victory sequence, do this after the level reaches one over the total number
   else{
     background(0);
     translate(width/2, height/2);
     rotate(PI*delay*.001);
     for (int i = 0; i < stars.length; i++) {
    stars[i].show(255,255,255,255);
   }
   rotate(-PI*delay*.001);
    if(mousePressed || keyPressed){
      GameOver=0;
      sinOne=0;
      delay=0;
    }            
    flareon=300*cos(radians(delay/2));
    wave=wave+.0001;
    for (float i = 0; i < LINE_O; i = i +.1){
         //wave=35;
         theta = i*(360/LINE_O);
         phase=((PI)/LINE_O);
         meh = ((flareon*.5))*sin(wave*theta+phase)*cos(phase);
         osx=(meh+flareon+140)*tan(theta);
         osy=(meh+flareon+140)*sin(theta);
         strokeWeight(0.1);        
         strokeWeight(1);
         stroke(255,240,0,1);
         strokeWeight(15);
         point(osx,osy);
         stroke(255,240,0,2);
         strokeWeight(12);
         point(osx,osy);
         stroke(255,240,0,3);
         strokeWeight(9);
         point(osx,osy);
         stroke(255,240,0,4);
         strokeWeight(6);
         point(osx,osy);
         stroke(255,240,0,5);
         strokeWeight(3);
         point(osx,osy);
         stroke(255,240,0,255);
         strokeWeight(1.5);
         point(osx,osy);
         
       }
      translate(-width/2, -height/2); 
      fill(255,240,0,255);
    textSize(height/5);
    text("Victory",width/4,height/4);
    //print(level-1); //Output the level and save to database(figure that out)
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
      
      
      fill(1,100,87,255);
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
     len=4;
     //VoidWalker
      stroke(255);
      fill(100,14,237,255);
      noStroke();
      square(x,y,len);
      square(x,y-len,len);
      square(x,y-len*2,len);
      square(x,y-len*3,len);
      square(x,y-len*4,len);
      square(x,y-len*5,len);
      square(x,y+len,len);
      square(x,y+len*2,len);
      square(x,y+len*3,len);
      square(x,y+len*4,len);
      square(x,y+len*5,len);
      square(x,y+len*6,len);
      square(x-len,y,len);
      square(x+len,y,len);
      square(x-len,y+len,len);
      square(x+len,y+len,len);
      
      square(x-len,y+len*4,len);
      square(x+len,y+len*4,len);
      square(x-len,y+len*5,len);
      square(x+len,y+len*5,len);
      square(x-len,y-len*3,len);
      square(x+len,y-len*3,len);
      square(x-len,y-len*4,len);
      square(x+len,y-len*4,len);
      
      square(x-len*3,y-len,len);
      square(x+len*3,y-len,len);
      square(x-len*4,y-len,len);
      square(x+len*4,y-len,len);
      square(x-len*5,y-len*2,len);
      square(x+len*5,y-len*2,len);
      square(x-len*6,y-len*3,len);
      square(x+len*6,y-len*3,len);
      square(x-len*6,y-len*2,len);
      square(x+len*6,y-len*2,len);
      square(x-len*6,y-len*1,len);
      square(x+len*6,y-len*1,len);
      square(x-len*6,y,len);
      square(x+len*6,y,len);
      square(x-len*6,y+len,len);
      square(x+len*6,y+len,len);
      
      square(x-len*7,y,len);
      square(x+len*7,y,len);
      square(x-len*7,y+len,len);
      square(x+len*7,y+len,len);
      square(x-len*7,y+len*2,len);
      square(x+len*7,y+len*2,len);
      square(x-len*7,y-len,len);
      square(x+len*7,y-len,len);
      square(x-len*7,y-len*2,len);
      square(x+len*7,y-len*2,len);
      square(x-len*7,y-len*3,len);
      square(x+len*7,y-len*3,len);
      square(x-len*7,y-len*4,len);
      square(x+len*7,y-len*4,len);
      fill(255,255,255,255);
      square(x+len,y-len,len);
      square(x-len,y-len,len);
      square(x+len*2,y,len);
      square(x-len*2,y,len);
      square(x+len*3,y+len,len);
      square(x-len*3,y+len,len);
      square(x+len*3,y+len*2,len);
      square(x-len*3,y+len*2,len);
      
      square(x+len,y-len*5,len);
      square(x-len,y-len*5,len);
      square(x+len*2,y-len*4,len);
      square(x-len*2,y-len*4,len);
      square(x+len*3,y-len*3,len);
      square(x-len*3,y-len*3,len);
      square(x+len*3,y-len*2,len);
      square(x-len*3,y-len*2,len);
      
      square(x+len,y+len*3,len);
      square(x-len,y+len*3,len);
      square(x+len*2,y+len*4,len);
      square(x-len*2,y+len*4,len);
      square(x+len*3,y+len*5,len);
      square(x-len*3,y+len*5,len);
      square(x+len*3,y+len*6,len);
      square(x-len*3,y+len*6,len);
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
    fill(255,17);
    ellipse(x,y,radius*1.03,radius*1.03);
    ellipse(x,y,radius*1.04,radius*1.04);
    ellipse(x,y,radius*1.05,radius*1.05);
    ellipse(x,y,radius*1.06,radius*1.06);
    ellipse(x,y,radius*1.07,radius*1.07);
    ellipse(x,y,radius*1.08,radius*1.08);
    ellipse(x,y,radius*1.09,radius*1.09);
    ellipse(x,y,radius*1.1,radius*1.1);
    ellipse(x,y,radius*1.11,radius*1.11);
    ellipse(x,y,radius*1.12,radius*1.12);
    ellipse(x,y,radius*1.13,radius*1.13);
    ellipse(x,y,radius*1.14,radius*1.14);
    ellipse(x,y,radius*1.15,radius*1.15);
    ellipse(x,y,radius*1.16,radius*1.16);
    strokeWeight(0.5);
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
    radius=mass/2;
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

void extraLife(float len){
  fill(210,255,220,4);
  noStroke();
  for(int i=25;i<65;i=i+1){
  ellipse(width/2+len/2,height/2+len*1.5,i,i);
  }
  noStroke();
    fill(255,255);
    square(width/2,height/2,len);
    square(width/2,height/2-len,len);
    square(width/2,height/2-len*2,len);
    
    square(width/2,height/2+len,len);
    square(width/2+len,height/2+len,len);
    square(width/2-len,height/2+len,len);
    
    square(width/2+len*2,height/2+len*2,len);
    square(width/2-len*2,height/2+len*2,len);
    square(width/2+len,height/2+len*2,len);
    square(width/2-len,height/2+len*2,len);
    square(width/2,height/2+len*2,len);
    
    square(width/2-len,height/2+len*4,len);
    fill(120,255,140,255);
    square(width/2,height/2-len*3,len);
    square(width/2+len,height/2-len*3,len);
    square(width/2+len*2,height/2-len*3,len);
    square(width/2-len,height/2-len*3,len);
    square(width/2-len*2,height/2-len*3,len);
    square(width/2-len,height/2-len*2,len);
    square(width/2+len,height/2-len*2,len);
    square(width/2-len,height/2-len,len);
    square(width/2+len,height/2-len,len);
    square(width/2-len,height/2,len);
    square(width/2+len,height/2,len);
    square(width/2-len*2,height/2,len);
    square(width/2+len*2,height/2,len);
     square(width/2-len*2,height/2+len,len);
    square(width/2+len*2,height/2+len,len);
    square(width/2-len*3,height/2+len,len);
    square(width/2+len*3,height/2+len,len);
    square(width/2-len*3,height/2+len*2,len);
    square(width/2+len*3,height/2+len*2,len);
    square(width/2-len*3,height/2+len*3,len);
    square(width/2+len*3,height/2+len*3,len);
    square(width/2-len*3,height/2+len*4,len);
    square(width/2+len*3,height/2+len*4,len);
    
    square(width/2-len*2,height/2+len*3,len);
    square(width/2+len*2,height/2+len*3,len);
    square(width/2-len*2,height/2+len*4,len);
    square(width/2+len*2,height/2+len*4,len);
    
    square(width/2-len,height/2+len*3,len);
    square(width/2+len,height/2+len*3,len);

    square(width/2+len,height/2+len*4,len);
    
    square(width/2,height/2+len*3,len);
    square(width/2,height/2+len*4,len);
    
    square(width/2-len*2,height/2+len*5,len);
    square(width/2+len*2,height/2+len*5,len);
    square(width/2-len,height/2+len*5,len);
    square(width/2+len,height/2+len*5,len);
    square(width/2,height/2+len*5,len);
        
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
