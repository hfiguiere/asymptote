size(9cm,10cm,IgnoreAspect);

pair d=(1,0.25);
real s=1.6d.x;
real y=0.6;
defaultfontsize(8);

picture box(string s, pair z=(0,0)) {
  picture pic=new picture;
  draw(pic,box(-d/2,d/2));
  label(pic,s,(0,0));
  return shift(z)*pic;
}

label("Birds",(0,y));
picture removed=box("Removed ($R_B$)");
picture infectious=box("Infectious ($I_B$)",(0,-1.5));
picture susceptible=box("Susceptible ($S_B$)",(0,-3));

add(removed);
add(infectious);
add(susceptible);

label("Mosquitoes",(s,y));
picture larval=box("Larval ($L_M$)",(s,0));
picture susceptibleM=box("Susceptible ($S_M$)",(s,-1));
picture exposed=box("Exposed ($E_M$)",(s,-2));
picture infectiousM=box("Infectious ($I_M$)",(s,-3));

add(larval);
add(susceptibleM);
add(exposed);
add(infectiousM);

path ls=point(larval,S)--point(susceptibleM,N);
path se=point(susceptibleM,S)--point(exposed,N);
path ei=point(exposed,S)--point(infectiousM,N);
path si=point(susceptible,N)--point(infectious,S);

draw(minipage("\flushright{recovery rate ($g$) \& death rate from virus
($\mu_V$)}",40pt),point(infectious,N)--point(removed,S),LeftSide,Arrow);

draw(si,LeftSide,Arrow);

draw(minipage("\flushright{maturation rate ($m$)}",50pt),ls,RightSide,
Arrow);
draw(minipage("\flushright{viral incubation rate ($k$)}",40pt),ei,
RightSide,Arrow);

path ise=point(infectious,E)--point(se,0.5);
  
draw("$(ac)$",ise,LeftSide,dashed,Arrow);
label(minipage("\flushleft{biting rate $\times$ transmission
probability}",50pt),point(infectious,SE),dir(-60)+S);

path isi=point(infectiousM,W)--point(si,2.0/3);

draw("$(ab)$",isi,LeftSide,dashed,Arrow);
draw(se,LeftSide,Arrow);
      
real t=2.0;
draw("$\beta_M$",
     point(susceptibleM,E){right}..tension t..{left}point(larval,E),
     2*(S+SE),red,Arrow(Fill,0.5));
draw(minipage("\flushleft{birth rate ($\beta_M$)}",20pt),
     point(exposed,E){right}..tension t..{left}point(larval,E),2SW,red,
     Arrow(Fill,0.5));
draw("$\beta_M$",
     point(infectiousM,E){right}..tension t..{left}point(larval,E),2SW,
     red,Arrow(Fill,0.5));

path arrow=(0,0)--0.75cm*dir(35);
drawabout(point(larval,NNE),
	  minipage("\flushleft{larval death rate ($\mu_L$)}",45pt),
	  arrow,1,blue,Arrow);
drawabout(point(susceptibleM,NNE),
          minipage("\flushleft{adult death rate ($\mu_A$)}",20pt),
	  arrow,1,N,blue,Arrow);
drawabout(point(exposed,NNE),"$\mu_A$",arrow,1,blue,Arrow);
drawabout(point(infectiousM,NNE),"$\mu_A$",arrow,1,blue,Arrow);

shipout();
