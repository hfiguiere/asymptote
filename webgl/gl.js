// Render Bezier patches via subdivision with WebGL.

var gl;

var P=[]; // Array of patches
var M=[]; // Array of materials

var vMatrix = mat4.create();
var pMatrix; // pvMatrix is specified by the data generated by asy
var pMatrixInit;
var mMatrix=mat4.create();
var normMatrix=mat4.create();
var target;

class Material {
  constructor(diffuse, emissive, specular, shininess, metallic, fresnel0) {
    this.diffuse = diffuse;
    this.emissive = emissive;
    this.specular = specular;
    this.shininess = shininess;
    this.metallic = metallic;
    this.fresnel0 = fresnel0;
  }

  setUniform(program, stringLoc, index = null) {
    var getLoc;
    if (index === null) {
      getLoc =
        param => gl.getUniformLocation(program, stringLoc + "." + param);
    } else {
      getLoc =
        param => gl.getUniformLocation(program, stringLoc + "[" + index + "]." + param);
    }

    gl.uniform4fv(getLoc("diffuse"), new Float32Array(this.diffuse));
    gl.uniform4fv(getLoc("emissive"), new Float32Array(this.emissive));
    gl.uniform4fv(getLoc("specular"), new Float32Array(this.specular));

    gl.uniform1f(getLoc("shininess"), this.shininess);
    gl.uniform1f(getLoc("metallic"), this.metallic);
    gl.uniform1f(getLoc("fresnel0"), this.fresnel0);
  }
}

var enumPointLight = 1;
var enumDirectionalLight = 2;

class Light {
  constructor(type, lightColor, brightness, customParam) {
    this.type = type;
    this.lightColor = lightColor;
    this.brightness = brightness;
    this.customParam = customParam;
  }

  setUniform(program, stringLoc, index) {
    var getLoc =
        param => gl.getUniformLocation(program, stringLoc + "[" + index + "]." + param);

    gl.uniform1i(getLoc("type"), this.type);
    gl.uniform3fv(getLoc("color"), new Float32Array(this.lightColor));
    gl.uniform1f(getLoc("brightness"), this.brightness);
    gl.uniform4fv(getLoc("parameter"), new Float32Array(this.customParam));
  }
}

function initGL(canvas) {
  try {
    gl = canvas.getContext("webgl2");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  } catch (e) {}
  if (!gl) {
    alert("Could not initialize WebGL");
  }
}

function getShader(gl, id) {
  var shaderScript = document.getElementById(id);
  if (!shaderScript) {
    return null;
  }

  var str = `#version 300 es
  precision mediump float;
  const int nLights=${lights.length};
//  const int nMaterials=${M.length};
  `

  var k = shaderScript.firstChild;
  while (k) {
    if (k.nodeType == 3) {
      str += k.textContent;
    }
    k = k.nextSibling;
  }
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
  gl.shaderSource(shader, str);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

class DrawableObject {
  draw(forceremesh=false) {}
}

class AvertexStructure {
  addVertex() {}
  drawBuffer() {}
  clearBuffer() {}
}

class StdVertexStructure extends AvertexStructure {
  constructor() {
    super()

    this.vertices = [];
    this.materials = [];
    this.colors = [];
    this.normals = [];
    this.indices = [];
    this.nvertices = 0;

    this.fArrVertices = null;
    this.fArrColors = null;
    this.fArrNormals = null;
    this.iArrIndices=null;
    this.iArrMaterials=null;

    this.arraysInitialized=false;
    this.nvertices = 0;
  }

  addVertex(vertData) {
    vertData.position.forEach( coord => 
      this.vertices.push(coord)
    );
    vertData.normals.forEach( coord => 
      this.normals.push(coord)
    );

    this.colors.push(0.0);
    this.colors.push(0.0);
    this.colors.push(0.0);
    this.colors.push(1.0);
    
    this.materials.push(vertData.materialIndex);

    this.arraysInitialized=false;

    return this.nvertices++;
  }

  createArrays() {
    this.fArrVertices=new Float32Array(this.vertices);
    this.fArrColors=new Float32Array(this.colors);
    this.fArrNormals=new Float32Array(this.normals);
    this.iArrIndices=indexExt ? new Uint32Array(this.indices) : new Uint16Array(this.indices);
    this.iArrMaterials=new Int32Array(this.materials);

    this.arraysInitialized=true;
  }

  drawBuffer() {
    if (!this.arraysInitialized) {
      this.createArrays();
    }

    copyFloatBuffer(VertexBuffer,this.fArrVertices,shaderProgram.vertexPositionAttribute, this.nvertices);
    copyFloatBuffer(ColorBuffer,this.fArrColors,shaderProgram.vertexColorAttribute, this.nvertices);
    copyFloatBuffer(NormalBuffer,this.fArrNormals,shaderProgram.vertexNormalAttribute, this.nvertices);

    if (shaderProgram.vertexMaterialIndexAttribute !== -1) {
      gl.bindBuffer(gl.ARRAY_BUFFER, MaterialIndexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.iArrMaterials, gl.STATIC_DRAW);
      gl.vertexAttribIPointer(shaderProgram.vertexMaterialIndexAttribute,
      MaterialIndexBuffer.itemSize, gl.INT, false, 0, 0);
    }
    MaterialIndexBuffer.numItems = this.nvertices;

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,this.iArrIndices,gl.STATIC_DRAW);
    indexBuffer.numItems = this.indices.length;

    gl.drawElements(gl.TRIANGLES, indexBuffer.numItems,
                    indexExt ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, 0);
    }
    
  clearBuffer() {
    this.vertices=[];
    this.colors=[];
    this.normals=[];
    this.indices=[];
    this.materials=[];

    this.nvertices=0;

    this.fArrVertices=null;
    this.fArrColors=null;
    this.fArrNormals=null;
    this.iArrIndices=null;
    this.iArrMaterials=null;
    
    this.arraysInitialized=false;
  }
}

class GeometryDrawable extends DrawableObject {

  /**
   * @param {*} materialIndex Index of Material
   * @param {*} vertexstructure Vertex Structure (Color, transparent, etc)
   */
  constructor(materialIndex, vertexstructure=StdVertexStructure) {
    super();
    this.rendered = false;
    this.materialIndex=materialIndex;
    this.vertexstructures=new vertexstructure();
  }
  
  clearBuffer() {
    this.vertexstructures.clearBuffer();
    this.rendered=false;
  }

  drawBuffer() {
    this.vertexstructures.drawBuffer();
  }

  render() {

  }

  draw(forceremesh=false) {
    if (forceremesh) {
      this.clearBuffer();
    }
    if (!this.rendered) {
      this.render();
    }

    this.drawBuffer()
  }

}

function copyFloatBuffer(buf, data, attrib, nverts) {
  if (attrib !== -1) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.vertexAttribPointer(attrib, buf.itemSize, gl.FLOAT, false, 0, 0);
    }
    buf.numItems=nverts;
}

var pixel=1.0; // Adaptive rendering constant.
var FillFactor=0.1;
var BezierFactor=0.4;
//var res=0.0005; // Temporary
var res=0.15; // Temporary
var res2=res*res;
var Epsilon=0.1*res;
var Fuzz2=1000*Number.EPSILON;
var Fuzz4=Fuzz2*Fuzz2;
var epsilon=Fuzz4*1.0; // FIXME

class BezierPatch extends GeometryDrawable {
  /**
   * Constructor for Bezier Patch
   * @param {*} controlpoints Array of 16 points for control points.
   * @param {*} materialIndex Index of Material
   */
  constructor(controlpoints, materialIndex, vertexstructure=StdVertexStructure) {
    super(materialIndex, vertexstructure);
    this.controlpoints=controlpoints;
  }

  addVertex(pos, color, normal) {
    return this.vertexstructures.addVertex({
      position: pos,
      color: color,
      normals: normal, 
      materialIndex: this.materialIndex
    });
  }

  pushIndices(ind) {
    this.vertexstructures.indices.push(ind);
  }

  render() {
    let p = this.controlpoints;

    var p0=p[0];
    var p3=p[3];
    var p12=p[12];
    var p15=p[15];

    epsilon=0;
    for(var i=1; i < 16; ++i)
      epsilon=Math.max(epsilon,
        abs2([p[i][0]-p0[0],p[i][1]-p0[1],p[i][2]-p0[2]]));
    epsilon *= Fuzz4;

    var n0=normal(p3,p[2],p[1],p0,p[4],p[8],p12);
    var n1=normal(p0,p[4],p[8],p12,p[13],p[14],p15);
    var n2=normal(p12,p[13],p[14],p15,p[11],p[7],p3);
    var n3=normal(p15,p[11],p[7],p3,p[2],p[1],p0);

    var c0=color(n0);
    var c1=color(n1);
    var c2=color(n2);
    var c3=color(n3);
    
    var i0=this.addVertex(p0,c0,n0);
    var i1=this.addVertex(p12,c1,n1);
    var i2=this.addVertex(p15,c2,n2);
    var i3=this.addVertex(p3,c3,n3);

    this.render_internal(p,i0,i1,i2,i3,p0,p12,p15,p3,false,false,false,false,
           c0,c1,c2,c3);

    this.rendered=true;
  }

  render_internal(p,I0,I1,I2,I3,P0,P1,P2,P3,flat0,flat1,flat2,flat3,
                  C0,C1,C2,C3) {

    if(Distance(p) < res2) { // Patch is flat
      this.pushIndices(I0);
      this.pushIndices(I1);
      this.pushIndices(I2);
      
      this.pushIndices(I0);
      this.pushIndices(I2);
      this.pushIndices(I3);
      return;
    }

    var p0=p[0];
    var p3=p[3];
    var p12=p[12];
    var p15=p[15];

    var c0=new Split3(p0,p[1],p[2],p3);
    var c1=new Split3(p[4],p[5],p[6],p[7]);
    var c2=new Split3(p[8],p[9],p[10],p[11]);
    var c3=new Split3(p12,p[13],p[14],p15);

    var c4=new Split3(p0,p[4],p[8],p12);
    var c5=new Split3(c0.m0,c1.m0,c2.m0,c3.m0);
    var c6=new Split3(c0.m3,c1.m3,c2.m3,c3.m3);
    var c7=new Split3(c0.m5,c1.m5,c2.m5,c3.m5);
    var c8=new Split3(c0.m4,c1.m4,c2.m4,c3.m4);
    var c9=new Split3(c0.m2,c1.m2,c2.m2,c3.m2);
    var c10=new Split3(p3,p[7],p[11],p15);

    var s0=[p0,c0.m0,c0.m3,c0.m5,c4.m0,c5.m0,c6.m0,c7.m0,
            c4.m3,c5.m3,c6.m3,c7.m3,c4.m5,c5.m5,c6.m5,c7.m5];
    var s1=[c4.m5,c5.m5,c6.m5,c7.m5,c4.m4,c5.m4,c6.m4,c7.m4,
            c4.m2,c5.m2,c6.m2,c7.m2,p12,c3.m0,c3.m3,c3.m5];
    var s2=[c7.m5,c8.m5,c9.m5,c10.m5,c7.m4,c8.m4,c9.m4,c10.m4,
            c7.m2,c8.m2,c9.m2,c10.m2,c3.m5,c3.m4,c3.m2,p15];
    var s3=[c0.m5,c0.m4,c0.m2,p3,c7.m0,c8.m0,c9.m0,c10.m0,
            c7.m3,c8.m3,c9.m3,c10.m3,c7.m5,c8.m5,c9.m5,c10.m5];

    var m4=s0[15];

    var n0=normal(s0[0],s0[4],s0[8],s0[12],s0[13],s0[14],s0[15]);
    if(n0 == 0.0) {
      n0=normal(s0[0],s0[4],s0[8],s0[12],s0[11],s0[7],s0[3]);
      if(n0 == 0.0) n0=normal(s0[3],s0[2],s0[1],s0[0],s0[13],s0[14],s0[15]);
    }

    var n1=normal(s1[12],s1[13],s1[14],s1[15],s1[11],s1[7],s1[3]);
    if(n1 == 0.0) {
      n1=normal(s1[12],s1[13],s1[14],s1[15],s1[2],s1[1],s1[0]);
      if(n1 == 0.0) n1=normal(s1[0],s1[4],s1[8],s1[12],s1[11],s1[7],s1[3]);
    }

    var n2=normal(s2[15],s2[11],s2[7],s2[3],s2[2],s2[1],s2[0]);
    if(n2 == 0.0) {
      n2=normal(s2[15],s2[11],s2[7],s2[3],s2[4],s2[8],s2[12]);
      if(n2 == 0.0) n2=normal(s2[12],s2[13],s2[14],s2[15],s2[2],s2[1],s2[0]);
    }

    var n3=normal(s3[3],s3[2],s3[1],s3[0],s3[4],s3[8],s3[12]);
    if(n3 == 0.0) {
      n3=normal(s3[3],s3[2],s3[1],s3[0],s3[13],s3[14],s3[15]);
      if(n3 == 0.0) n3=normal(s3[15],s3[11],s3[7],s3[3],s3[4],s3[8],s3[12]);
    }

    var n4=normal(s2[3],s2[2],s2[1],m4,s2[4],s2[8],s2[12]);

    var m0,m1,m2,m3;

    // A kludge to remove subdivision cracks, only applied the first time
    // an edge is found to be flat before the rest of the subpatch is.
    if(flat0)
      m0=[0.5*(P0[0]+P1[0]),0.5*(P0[1]+P1[1]),0.5*(P0[2]+P1[2])];
    else {
      if((flat0=Distance1(p0,p[4],p[8],p12) < res2)) {
        var u=s0[12];
        var v=s2[3];
        var e=unit([u[0]-v[0],u[1]-v[1],u[2]-v[2]]);
        m0=[0.5*(P0[0]+P1[0])+Epsilon*e[0],0.5*(P0[1]+P1[1])+Epsilon*e[1],
            0.5*(P0[2]+P1[2])+Epsilon*e[2]];
      } else
        m0=s0[12];
    }

    if(flat1)
      m1=[0.5*(P1[0]+P2[0]),0.5*(P1[1]+P2[1]),0.5*(P1[2]+P2[2])];
    else {
      if((flat1=Distance1(p12,p[13],p[14],p15) < res2)) {
        var u=s1[15];
        var v=s3[0];
        var e=unit([u[0]-v[0],u[1]-v[1],u[2]-v[2]]);
        m1=[0.5*(P1[0]+P2[0])+Epsilon*e[0],0.5*(P1[1]+P2[1])+Epsilon*e[1],
            0.5*(P1[2]+P2[2])+Epsilon*e[2]];
      } else
        m1=s1[15];
    }

    if(flat2)
      m2=[0.5*(P2[0]+P3[0]),0.5*(P2[1]+P3[1]),0.5*(P2[2]+P3[2])];
    else {
      if((flat2=Distance1(p15,p[11],p[7],p3) < res2)) {
        var u=s2[3];
        var v=s0[12];
        var e=unit([u[0]-v[0],u[1]-v[1],u[2]-v[2]]);
        m2=[0.5*(P2[0]+P3[0])+Epsilon*e[0],0.5*(P2[1]+P3[1])+Epsilon*e[1],
            0.5*(P2[2]+P3[2])+Epsilon*e[2]];
      } else
        m2=s2[3];
    }

    if(flat3)
      m3=[0.5*(P3[0]+P0[0]),0.5*(P3[1]+P0[1]),0.5*(P3[2]+P0[2])];
    else {
      if((flat3=Distance1(p3,p[2],p[1],p0) < res2)) {
        var u=s3[0];
        var v=s1[15];
        var e=unit([u[0]-v[0],u[1]-v[1],u[2]-v[2]]);
        m3=[0.5*(P3[0]+P0[0])+Epsilon*e[0],
            0.5*(P3[1]+P0[1])+Epsilon*e[1],
            0.5*(P3[2]+P0[2])+Epsilon*e[2]];
      } else
        m3=s3[0];
    }

    {
      var c0=color(n0);
      var c1=color(n1);
      var c2=color(n2);
      var c3=color(n3);
      var c4=color(n4);


      var i0=this.addVertex(m0,c0,n0);
      var i1=this.addVertex(m1,c1,n1);
      var i2=this.addVertex(m2,c2,n2);
      var i3=this.addVertex(m3,c3,n3);
      var i4=this.addVertex(m4,c4,n4);

      this.render_internal(s0,I0,i0,i4,i3,P0,m0,m4,m3,flat0,false,false,flat3,
                           C0,c0,c4,c3);
      this.render_internal(s1,i0,I1,i1,i4,m0,P1,m1,m4,flat0,flat1,false,false,
                           c0,C1,c1,c4);
      this.render_internal(s2,i4,i1,I2,i2,m4,m1,P2,m2,false,flat1,flat2,false,
                           c4,c1,C2,c2);
      this.render_internal(s3,i3,i4,i2,I3,m3,m4,m2,P3,false,false,flat2,flat3,
                           c3,c4,c2,C3);
    }
  }
}

function resetCamera() {
  mat4.identity(vMatrix);
  mat4.identity(normMatrix);

  pMatrix=new Float32Array(pMatrixInit);
  redraw=true;
}

var shaderProgram;

function initShaders() {
  var fragmentShader = getShader(gl, "shader-fs");
  var vertexShader = getShader(gl, "shader-vs");
  shaderProgram = gl.createProgram();

  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Could not initialize shaders");
  }
  gl.useProgram(shaderProgram);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
  shaderProgram.vertexMaterialIndexAttribute = gl.getAttribLocation(shaderProgram, "aVertexMaterialIndex");
  gl.enableVertexAttribArray(shaderProgram.vertexMaterialIndexAttribute);

  shaderProgram.pvMatrixUniform=gl.getUniformLocation(shaderProgram,"uPVMatrix");
  shaderProgram.normMatUniform=gl.getUniformLocation(shaderProgram, "uNormMatrix");

  // shaderProgram.nlightsUniform = gl.getUniformLocation(shaderProgram, "unLights");
  shaderProgram.useColorUniform = gl.getUniformLocation(shaderProgram, "useColor");

}

/* #pragma region Math Aux Functions */
// math aux functions 

class Split3 {
  constructor(z0, c0, c1, z1) {
    this.m0=new Array(3);
    this.m2=new Array(3);
    this.m3=new Array(3);
    this.m4=new Array(3);
    this.m5=new Array(3);
    for(var i=0; i < 3; ++i) {
      this.m0[i]=0.5*(z0[i]+c0[i]);
      var m1=0.5*(c0[i]+c1[i]);
      this.m2[i]=0.5*(c1[i]+z1[i]);
      this.m3[i]=0.5*(this.m0[i]+m1);
      this.m4[i]=0.5*(m1+this.m2[i]);
      this.m5[i]=0.5*(this.m3[i]+this.m4[i]);
    }
  }
}

function unit(v) {
  var norm=Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]);
  norm=(norm != 0) ? 1 / norm : 1;
  return [v[0]*norm,v[1]*norm,v[2]*norm];
}
function abs2(v) {
  return v[0]*v[0]+v[1]*v[1]+v[2]*v[2];
}

function dot(u,v) {
  return u[0]*v[0]+u[1]*v[1]+u[2]*v[2];
}

function cross(u, v) {
  return [u[1]*v[2]-u[2]*v[1],
          u[2]*v[0]-u[0]*v[2],
          u[0]*v[1]-u[1]*v[0]
         ];
}

/**
 * @Return perpendicular distance squared of a point z from the plane
 * through u with unit normal n.
 */
function Distance2(z,u,n) {
  var d=dot([z[0]-u[0],z[1]-u[1],z[2]-u[2]],n);
  return d*d;
}

function normal(left3, left2, left1, middle, right1, right2, right3) {
  var u0=right1[0]-middle[0];
  var v0=left1[0]-middle[0];
  var u1=right1[1]-middle[1];
  var v1=left1[1]-middle[1];
  var u2=right1[2]-middle[2];
  var v2=left1[2]-middle[2];
  var n=[
    u1*v2-u2*v1,
    u2*v0-u0*v2,
    u0*v1-u1*v0
  ];
  if(abs2(n) > epsilon)
    return unit(n);

  var lp=[v0,v1,v2];
  var rp=[u0,u1,u2];
  var lpp=[middle[0]+left2[0]-2*left1[0],
           middle[1]+left2[1]-2*left1[1],
           middle[2]+left2[2]-2*left1[2]
          ];
  var rpp=[middle[0]+right2[0]-2*right1[0],
           middle[1]+right2[1]-2*right1[1],
           middle[2]+right2[2]-2*right1[2]
          ];
  var a=cross(rpp,lp);
  var b=cross(rp,lpp);
  n=[a[0]+b[0],
     a[1]+b[1],
     a[2]+b[2]
    ];
  if(abs2(n) > epsilon)
    return unit(n);

  var lppp=[left3[0]-middle[0]+3*(left1[0]-left2[0]),
            left3[1]-middle[1]+3*(left1[1]-left2[1]),
            left3[2]-middle[2]+3*(left1[2]-left2[2])
           ];
  var rppp=[right3[0]-middle[0]+3*(right1[0]-right2[0]),
            right3[1]-middle[1]+3*(right1[1]-right2[1]),
            right3[2]-middle[2]+3*(right1[2]-right2[2])
           ];
  a=cross(rpp,lpp);
  b=cross(rp,lppp);
  var c=cross(rppp,lp);
  var d=cross(rppp,lpp);
  var e=cross(rpp,lppp);
  var f=cross(rppp,lppp);
  return unit([9*a[0]+3*(b[0]+c[0]+d[0]+e[0])+f[0],
               9*a[1]+3*(b[1]+c[1]+d[1]+e[1])+f[1],
               9*a[2]+3*(b[2]+c[2]+d[2]+e[2])+f[2]
              ]);
}

/**
 * @Return the maximum distance squared of points c0 and c1 from 
 * the respective internal control points of z0--z1.
*/
function Straightness(z0,c0,c1,z1)
{
  var third=1.0/3.0;
  var v=[third*(z1[0]-z0[0]),third*(z1[1]-z0[1]),third*(z1[2]-z0[2])];
  return Math.max(abs2([c0[0]-v[0]-z0[0],c0[1]-v[1]-z0[1],c0[2]-v[2]-z0[2]]),
    abs2([z1[0]-v[0]-c1[0],z1[1]-v[1]-c1[1],z1[2]-v[2]-c1[2]]));
}

/**
 * @Return the maximum perpendicular distance squared of points c0 and c1
 * from z0--z1
*/
function Distance1(z0, c0, c1, z1) {
  var Z0=[c0[0]-z0[0],c0[1]-z0[1],c0[2]-z0[2]];
  var Q=unit([z1[0]-z0[0],z1[1]-z0[1],z1[2]-z0[2]]);
  var Z1=[c1[0]-z0[0],c1[1]-z0[1],c1[2]-z0[2]];
  var p0=dot(Z0,Q);
  var p1=dot(Z1,Q);
  return Math.max(abs2([Z0[0]-p0*Q[0],Z0[1]-p0*Q[1],Z0[2]-p0*Q[2]]),
    abs2([Z1[0]-p1*Q[0],Z1[1]-p1*Q[1],Z1[2]-p1*Q[2]]));
}

function Distance(p) {
  var p0=p[0];
  var p3=p[3];
  var p12=p[12];
  var p15=p[15];

  // Check the flatness of the quad.
  var d=Distance2(p15,p0,normal(p3,p[2],p[1],p0,p[4],p[8],p12));
  
  // Determine how straight the edges are.
  d=Math.max(d,Straightness(p0,p[1],p[2],p3));
  d=Math.max(d,Straightness(p0,p[4],p[8],p12));
  d=Math.max(d,Straightness(p3,p[7],p[11],p15));
  d=Math.max(d,Straightness(p12,p[13],p[14],p15));
  
  // Determine how straight the interior control curves are.
  d=Math.max(d,Straightness(p[4],p[5],p[6],p[7]));
  d=Math.max(d,Straightness(p[8],p[9],p[10],p[11]));
  d=Math.max(d,Straightness(p[1],p[5],p[9],p[13]));
  return Math.max(d,Straightness(p[2],p[6],p[10],p[14]));
}
/* #pragma endregion */

/**
 * Performs a change of basis
 * @param {*} out Out Matrix
 * @param {*} conjMatrix Conjugate Matrix
 * @param {*} mat Matrix
 * 
 * @Return the matrix (conjMatrix) * mat * (conjMatrix)^{-1} 
 */
function mat4COB(out,conjMatrix,mat) {
  var cjMatInv=mat4.create();
  mat4.invert(cjMatInv,conjMatrix);

  mat4.multiply(out,mat,cjMatInv);
  mat4.multiply(out,conjMatrix,out);

  return out;
}

function getTargetOrigMat() {
  var translMat=mat4.create();
  mat4.fromTranslation(translMat,[0,0,target])
  return translMat;
}

function COBTarget(out, mat) {
  return mat4COB(out, getTargetOrigMat(), mat);
}

function inversedual(out,mat) {
  mat4.invert(out,mat);
  mat4.transpose(out,out);
  return out;
}

function setUniforms() {
  var msMatrix = mat4.create();
  COBTarget(msMatrix, mMatrix);

  var pvmMatrix=mat4.create();
  mat4.multiply(pvmMatrix,pMatrix,vMatrix);
  mat4.multiply(pvmMatrix,pvmMatrix,msMatrix);

  var mNormMatrix=mat4.create();
  inversedual(mat4,mMatrix);

  var vmNormMatrix=mat4.create();
  mat4.multiply(vmNormMatrix,normMatrix,mNormMatrix)

  gl.uniformMatrix4fv(shaderProgram.pvMatrixUniform,false,pvmMatrix);
  gl.uniformMatrix4fv(shaderProgram.normMatUniform,false,vmNormMatrix);
  
  for (let i=0; i < M.length; ++i) {
    M[i].setUniform(shaderProgram, "objMaterial", i);
  }

  for (let i=0; i<lights.length; ++i) {
    lights[i].setUniform(shaderProgram, "objLights", i);
  }
  // for now, if we simulate headlamp. Can also specify custom lights later on...
  gl.uniform1i(shaderProgram.useColorUniform, 0);

}

/* Buffers */
var VertexBuffer;
var ColorBuffer;
var NormalBuffer;

var pMatrix = mat4.create();
var mMatrix = mat4.create();

var redraw = true;
var remesh=true;
var mouseDownOrTouchActive = false;
var lastMouseX = null;
var lastMouseY = null;
var touchID = null;

function handleMouseDown(event) {
  mouseDownOrTouchActive = true;
  lastMouseX = event.clientX;
  lastMouseY = event.clientY;
}

function handleTouchStart(evt) {
  evt.preventDefault();
  var touches = evt.targetTouches;

  if (touches.length == 1 && !mouseDownOrTouchActive) {
    touchId = touches[0].identifier;
    lastMouseX = touches[0].pageX,
    lastMouseY = touches[0].pageY;
  }
}

function handleMouseUpOrTouchEnd(event) {
  mouseDownOrTouchActive = false;
}

var canvasWidth;
var canvasHeight;

function rotateScene (lastX, lastY, rawX, rawY) {
    let [angle, axis] = arcballLib.arcball([lastX, -lastY], [rawX, -rawY]);

    if (isNaN(angle) || isNaN(axis[0]) ||
      isNaN(axis[1]) || isNaN(axis[2])) {
      console.error("Angle or axis NaN!");
      return;
    }

    var rotMat = mat4.create();
    mat4.fromRotation(rotMat, angle, axis);
    COBTarget(rotMat,rotMat);

    mat4.multiply(vMatrix, rotMat, vMatrix);
    inversedual(rotMat, rotMat);

    mat4.multiply(normMatrix, rotMat, normMatrix);
}

function translateScene(lastX, lastY, rawX, rawY) {
    let halfCanvWidth = canvasWidth / 2;
    let halfCanvHeight = canvasHeight / 2;
    let xTransl = (rawX - lastX);
    let yTransl = (rawY - lastY);
    let translMat = mat4.create();
    mat4.fromTranslation(translMat, [xTransl * halfCanvWidth, -yTransl * halfCanvHeight, 0]);
    mat4.multiply(pMatrix, pMatrix, translMat);
}

function zoomScene(lastX, lastY, rawX, rawY) {
  let zoomFactor = 2 ** (lastY-rawY);
  zoom(zoomFactor);

  remesh=true;
}

function zoom(zoomFactor) {
  var zoomMat = mat4.create();
  mat4.scale(zoomMat, zoomMat, [zoomFactor, zoomFactor, zoomFactor]);
  COBTarget(zoomMat,zoomMat);

  mat4.multiply(vMatrix, zoomMat, vMatrix);
  inversedual(zoomMat,zoomMat);
  mat4.multiply(normMatrix, zoomMat, normMatrix);
}

// mode:
var DRAGMODE_ROTATE = 1;
var DRAGMODE_TRANSLATE = 2;
var DRAGMODE_ZOOM = 3;
function processDrag(newX, newY, mode, touch=false) {
  let dragFunc;
  switch (mode) {
    case DRAGMODE_ROTATE:
      dragFunc=rotateScene;
      break;
    case DRAGMODE_TRANSLATE:
      dragFunc=translateScene;
      break;
    case DRAGMODE_ZOOM:
      dragFunc=zoomScene;
      break;
    default:
      rotateFunc = (_a, _b, _c, _d) => {};
      break;
  }

  let halfCanvWidth = canvasWidth / 2;
  let halfCanvHeight = canvasHeight / 2;

  let lastX = (lastMouseX - halfCanvWidth) / halfCanvWidth;
  let lastY = (lastMouseY - halfCanvHeight) / halfCanvHeight;
  let rawX = (newX - halfCanvWidth) / halfCanvWidth;
  let rawY = (newY - halfCanvHeight) / halfCanvHeight;

  dragFunc(lastX, lastY, rawX, rawY);

  lastMouseX = newX;
  lastMouseY = newY;
  redraw = true;
}

function handleKey(key) {
  var keycode = key.key;
  var rotate = true;
  var axis = [0, 0, 1];
  switch (keycode) {
  case "w":
    axis = [-1, 0, 0];
    break;
  case "d":
    axis = [0, 1, 0];
    break;
  case "a":
    axis = [0, -1, 0];
    break;
  case "s":
    axis = [1, 0, 0];
    break;
  case "h":
    resetCamera();
    break;
  default:
    rotate = false;
    break;
  }

  if (rotate) {
    mat4.rotate(rotationMatrix, rotationMatrix, 0.1, axis);
    redraw = true;
  }
}

function handleMouseWheel(event) {
  let zoomFactor = event.deltaY / 120;
  zoom(2 ** -zoomFactor);

  remesh=true;
  redraw = true;
}

function handleMouseMove(event) {
  if (!mouseDownOrTouchActive) {
    return;
  }

  var newX = event.clientX;
  var newY = event.clientY;

  let mode;
  if (event.getModifierState("Alt")) {
    mode = DRAGMODE_TRANSLATE;
  } else if (event.getModifierState("Shift")) {
    mode = DRAGMODE_ZOOM;
  } else {
    mode = DRAGMODE_ROTATE;
  }

  processDrag(newX, newY, mode, false);
}

function handleTouchMove(evt) {
  evt.preventDefault();
  var touches = evt.targetTouches;

  if (touches.length == 1 && touchId == touches[0].identifier) {
    var newX = touches[0].pageX;
    var newY = touches[0].pageY;
    processDrag(newX, newY, DRAGMODE_ROTATE, true);
  }
}

// Prepare canvas for drawing
function sceneSetup() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

var indexExt;

// Create buffer data for the patch and its subdivisions to be pushed to the graphics card
//Takes as an argument the array of vertices that define the patch to be drawn 
// Using the vertex position buffer of the above function,draw patch.
function setBuffer() {
  VertexBuffer = gl.createBuffer();
  VertexBuffer.itemSize = 3;

  ColorBuffer = gl.createBuffer();
  ColorBuffer.itemSize = 4;

  NormalBuffer = gl.createBuffer();
  NormalBuffer.itemSize = 3;

  MaterialIndexBuffer = gl.createBuffer();
  MaterialIndexBuffer.itemSize = 1;

  indexBuffer = gl.createBuffer();
  indexBuffer.itemSize = 1;

  setUniforms();
  indexExt = gl.getExtension("OES_element_index_uint");
}

// Return color associated with unit normal vector n.
function color(n) {
  return [0,0,0,1];
}

function draw() {
  sceneSetup();
  setBuffer();

  P.forEach(p => p.draw(remesh));

  remesh=false;
}

var forceredraw = false;
var lasttime;
var newtime;

function tick() {
  requestAnimationFrame(tick);
  lasttime = newtime;
  newtime = performance.now();
  // invariant: every time this loop is called, lasttime stores the
  // last time processloop was called. 
  processloop(newtime - lasttime);
  draw();
}

function tickNoRedraw() {
  requestAnimationFrame(tickNoRedraw);
  if (redraw) {
    draw();
    redraw = false;
  }
}

function webGLStart() {
  var canvas = document.getElementById("Asymptote");

  canvas.width=canvasWidth;
  canvas.height=canvasHeight;

  initGL(canvas);
  initShaders();
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.DEPTH_TEST);

  canvas.onmousedown = handleMouseDown;
  document.onmouseup = handleMouseUpOrTouchEnd;
  document.onmousemove = handleMouseMove;
  canvas.onkeydown = handleKey;
  document.onwheel = handleMouseWheel;

  canvas.addEventListener("touchstart", handleTouchStart, false);
  canvas.addEventListener("touchend", handleMouseUpOrTouchEnd, false);
  canvas.addEventListener("touchcancel", handleMouseUpOrTouchEnd, false);
  canvas.addEventListener("touchleave", handleMouseUpOrTouchEnd, false);
  canvas.addEventListener("touchmove", handleTouchMove, false);

  newtime = performance.now();

  pMatrixInit=new Float32Array(pMatrix);

  if (forceredraw) {
    tick();
  } else {
    tickNoRedraw();
  }
}
