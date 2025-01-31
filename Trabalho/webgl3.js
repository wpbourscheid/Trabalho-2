"use strict";

var vs_texture = `#version 300 es
in vec4 a_position;
in vec2 a_texcoord;
in vec3 a_normal;
in uint a_faceId;

uniform mat4 u_matrix;
uniform mat4 u_world;
uniform mat4 u_worldInverseTranspose;


uniform vec3 u_lightWorldPosition0;
uniform vec3 u_viewWorldPosition;
uniform vec3 u_lightWorldPosition1;
uniform vec3 u_lightWorldPosition2;

out vec3 v_normal;
out vec3 v_surfaceToLight0;
out vec3 v_surfaceToView0;
out vec3 v_surfaceToLight1;
out vec3 v_surfaceToView1;
out vec3 v_surfaceToLight2;
out vec3 v_surfaceToView2;
out vec2 v_texcoord;
flat out uint v_faceId;

void main() {
  
  v_faceId = a_faceId;
  v_texcoord = a_texcoord;
  gl_Position = u_matrix * a_position;
  v_normal = mat3(u_worldInverseTranspose) * (a_normal);
  vec3 surfaceWorldPosition = (u_world * a_position).xyz;
  v_surfaceToLight0 = u_lightWorldPosition0 - surfaceWorldPosition;
  v_surfaceToView0 = u_viewWorldPosition - surfaceWorldPosition;

  v_surfaceToLight1 = u_lightWorldPosition1 - surfaceWorldPosition;
  v_surfaceToView1 = u_viewWorldPosition - surfaceWorldPosition;

  v_surfaceToLight2 = u_lightWorldPosition2 - surfaceWorldPosition;
  v_surfaceToView2 = u_viewWorldPosition - surfaceWorldPosition;
}
`;

var fs_texture = `#version 300 es
precision highp float;
// Passed in from the vertex shader.

in vec2 v_texcoord;
in vec3 v_normal;
in vec3 v_surfaceToLight0;
in vec3 v_surfaceToView0;
in vec3 v_surfaceToLight1;
in vec3 v_surfaceToView1;
in vec3 v_surfaceToLight2;
in vec3 v_surfaceToView2;
flat in uint v_faceId;
// The texture.


uniform vec4 u_color;
uniform float u_shininess;

uniform vec3 u_lightColor0;
uniform vec3 u_specularColor0;

uniform vec3 u_lightColor1;
uniform vec3 u_specularColor1;

uniform vec3 u_lightColor2;
uniform vec3 u_specularColor2;

uniform sampler2D u_texture;

uniform mediump sampler2DArray u_diffuse;
uniform uint u_faceIndex[6];

out vec4 outColor;
void main() {
  vec3 normal = normalize(v_normal);
  vec3 surfaceToLightDirection0 = normalize(v_surfaceToLight0);
  vec3 surfaceToViewDirection0 = normalize(v_surfaceToView0);

  vec3 surfaceToLightDirection1 = normalize(v_surfaceToLight1);
  vec3 surfaceToViewDirection1 = normalize(v_surfaceToView1);

  vec3 surfaceToLightDirection2 = normalize(v_surfaceToLight2);
  vec3 surfaceToViewDirection2 = normalize(v_surfaceToView2); 

  vec3 halfVector0 = normalize(surfaceToLightDirection0 + surfaceToViewDirection0);
  float light0 = max(dot(v_normal, surfaceToLightDirection0),0.0); //força da luz

  vec3 halfVector1 = normalize(surfaceToLightDirection1 + surfaceToViewDirection1);
  float light1 = max(dot(v_normal, surfaceToLightDirection1),0.0);

  vec3 halfVector2 = normalize(surfaceToLightDirection2 + surfaceToViewDirection2);
  float light2 = max(dot(v_normal, surfaceToLightDirection2),0.0);

  float specular0 = 0.0;
  float specular1 = 0.0;
  float specular2 = 0.0;

  outColor = texture(u_diffuse, vec3(v_texcoord, u_faceIndex[v_faceId]));
  vec3 color0;
  vec3 color1;
  vec3 color2;
  vec3 spec0;
  vec3 spec1;
  vec3 spec2;

  specular0 = pow(dot(normal, halfVector0), u_shininess);
  specular1 = pow(dot(normal, halfVector1), u_shininess);
  specular2 = pow(dot(normal, halfVector2), u_shininess);

  if(light0>0.0){
  color0 = light0 * u_lightColor0;
  spec0 = specular0 * u_specularColor0;  
  }

  if(light1>0.0){
  color1 = light1 * u_lightColor1;
  spec1 = specular1 * u_specularColor1;
  }

  if(light2>0.0){
  color2 = light2 * u_lightColor2;
  spec2 = specular2 * u_specularColor2;
  }
  outColor.rgb *= (color0+color1+color2);
  outColor.rgb += spec0 + spec1 + spec2 ;
  
}
`;

const calculateNormal = (position, indices) => {
  let pontos = [];
  let faces = [];
  let resultado;
  let vetorA1 = [];
  let vetorA2 = [];
  let vetorB1 = [];
  let vetorB2 = [];
  let vetorA3 = [];
  let vetorB3 = [];
  let produto = [];
  let normal;

  for (let i = 0; i < position.length; i += 3) {
    pontos.push([position[i], position[i + 1], position[i + 2]]);
  }

  for (let i = 0; i < indices.length; i += 3) {
    faces.push([indices[i], indices[i + 1], indices[i + 2]]);
  }

  var normalUsadas = {};

  for (let i = 0, j = 0; i < position.length; i += 3, j++) {
    normalUsadas[j] = [];
  }

  normal = faces.map((item) => {
    // AB AC
    vetorA1 = [
      pontos[item[1]][0] - pontos[item[0]][0],
      pontos[item[1]][1] - pontos[item[0]][1],
      pontos[item[1]][2] - pontos[item[0]][2],
    ];
    vetorB1 = [
      pontos[item[2]][0] - pontos[item[0]][0],
      pontos[item[2]][1] - pontos[item[0]][1],
      pontos[item[2]][2] - pontos[item[0]][2],
    ];

    // BA BC
    vetorB2 = [
      pontos[item[0]][0] - pontos[item[1]][0],
      pontos[item[0]][1] - pontos[item[1]][1],
      pontos[item[0]][2] - pontos[item[1]][2],
    ];
    vetorA2 = [
      pontos[item[2]][0] - pontos[item[1]][0],
      pontos[item[2]][1] - pontos[item[1]][1],
      pontos[item[2]][2] - pontos[item[1]][2],
    ];

    // CA CB
    vetorA3 = [
      pontos[item[0]][0] - pontos[item[2]][0],
      pontos[item[0]][1] - pontos[item[2]][1],
      pontos[item[0]][2] - pontos[item[2]][2],
    ];
    vetorB3 = [
      pontos[item[1]][0] - pontos[item[2]][0],
      pontos[item[1]][1] - pontos[item[2]][1],
      pontos[item[1]][2] - pontos[item[2]][2],
    ];

    produto = [
      vetorA1[1] * vetorB1[2] - vetorB1[1] * vetorA1[2],
      vetorB1[0] * vetorA1[2] - vetorA1[0] * vetorB1[2],
      vetorA1[0] * vetorB1[1] - vetorB1[0] * vetorA1[1],

      vetorA2[1] * vetorB2[2] - vetorB2[1] * vetorA2[2],
      vetorB2[0] * vetorA2[2] - vetorA2[0] * vetorB2[2],
      vetorA2[0] * vetorB2[1] - vetorB2[0] * vetorA2[1],

      vetorA3[1] * vetorB3[2] - vetorB3[1] * vetorA3[2],
      vetorB3[0] * vetorA3[2] - vetorA3[0] * vetorB3[2],
      vetorA3[0] * vetorB3[1] - vetorB3[0] * vetorA3[1],
    ];

    let distancia = [];

    for (let i = 0, j = 0; i < produto.length; i += 3, j++) {
      distancia.push(
        Math.abs(
          Math.sqrt(
            produto[i] * produto[i] +
            produto[i + 1] * produto[i + 1] +
            produto[i + 2] * produto[i + 2]
          )
        )
      );

      produto[i] = produto[i] / distancia[j];
      produto[i + 1] = produto[i + 1] / distancia[j];
      produto[i + 2] = produto[i + 2] / distancia[j];
    }

    for (let i = 0, j = 0; i < produto.length; i += 3, j++) {
      if (normalUsadas[item[0]].length == 0) {
        normalUsadas[item[0]] = [produto[i], produto[i + 1], produto[i + 2]];
      } else {
        if (normalUsadas[item[1]].length == 0) {
          normalUsadas[item[1]] = [produto[i], produto[i + 1], produto[i + 2]];
        } else {
          normalUsadas[item[2]] = [produto[i], produto[i + 1], produto[i + 2]];
        }
      }
    }

    return produto;
  });

  let normaisTratadas = [];

  for (const item in normalUsadas) {
    for (let i = 0; i < normalUsadas[item].length; i++) {
      normaisTratadas.push(normalUsadas[item][i]);
    }
  }

  return normaisTratadas;
};

const normalSemIndice = () => {
  for (let i = 0; i < arrays_cube.position.length; i = i + 9) {
    // cross(B-A, C-A)
    // var i0 = arrays_cube.indices[i];
    // var i1 = arrays_cube.indices[i + 1];
    // var i2 = arrays_cube.indices[i + 2];

    var a = [
      arrays_cube.position[i],
      arrays_cube.position[i + 1],
      arrays_cube.position[i + 2],
    ];

    var b = [
      arrays_cube.position[i + 3],
      arrays_cube.position[i + 4],
      arrays_cube.position[i + 5],
    ];
    var c = [
      arrays_cube.position[i + 6],
      arrays_cube.position[i + 7],
      arrays_cube.position[i + 8],
    ];

    var x = crossProduct(
      [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
      [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
    );

    arrays_cube.normal[i] = x[0];
    arrays_cube.normal[i + 1] = x[1];
    arrays_cube.normal[i + 2] = x[2];


  }
};

const normalComIndice = () => {
  for (let i = 0; i < arrays_cube.indices.length; i = i + 3) {
    // cross(B-A, C-A)
    var i0 = arrays_cube.indices[i];
    var i1 = arrays_cube.indices[i + 1];
    var i2 = arrays_cube.indices[i + 2];

    var a = [
      arrays_cube.position[i0],
      arrays_cube.position[i1],
      arrays_cube.position[i2],
    ];

    var b = [
      arrays_cube.position[i0 + 1],
      arrays_cube.position[i1 + 1],
      arrays_cube.position[i2 + 1],
    ];
    var c = [
      arrays_cube.position[i0 + 2],
      arrays_cube.position[i1 + 2],
      arrays_cube.position[i2 + 2],
    ];

    var x = crossProduct(
      [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
      [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
    );

    var temp = somaNormal(
      [
        arrays_cube.normal[i0],
        arrays_cube.normal[i0 + 1],
        arrays_cube.normal[i0 + 2],
      ],
      x
    );
    arrays_cube.normal[i0] = temp[0];
    arrays_cube.normal[i0 + 1] = temp[1];
    arrays_cube.normal[i0 + 2] = temp[2];
    arrays_cube.normal[i1 * 3] = temp[0];
    arrays_cube.normal[i1 * 3 + 1] = temp[1];
    arrays_cube.normal[i1 * 3 + 2] = temp[2];
    arrays_cube.normal[i2 * 3] = temp[0];
    arrays_cube.normal[i2 * 3 + 1] = temp[1];
    arrays_cube.normal[i2 * 3 + 2] = temp[2];

  }
};

const calculateBarycentric = (length) => {
  const n = length / 9;
  const barycentric = [];
  for (let i = 0; i < n; i++) barycentric.push(1, 0, 0, 0, 1, 0, 0, 0, 1);
  return new Float32Array(barycentric);
};

const degToRad = (d) => (d * Math.PI) / 180;

const radToDeg = (r) => (r * 180) / Math.PI;

const calculaMeioDoTriangulo = (arr) => {
  const x = (arr[0] + arr[3] + arr[6]) / 3;
  const y = (arr[1] + arr[4] + arr[7]) / 3;
  const z = (arr[2] + arr[5] + arr[8]) / 3;

  return [x, y, z];
};

const crossProduct = (a, b) => {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
};

const somaNormal = (v, n) => {
  return [v[0] + n[0], v[1] + n[1], v[2] + n[2]];
};

const calculaMeioDoTrianguloIndices = (arr) => {

  // arr contem os indices dos vertices q formam o triangulo que quero adicionar um vertice no meio
  const x =
    (arrays_cube.position[arr[0] * 3] +
      arrays_cube.position[arr[1] * 3] +
      arrays_cube.position[arr[2] * 3]) /
    3;
  const y =
    (arrays_cube.position[arr[0] * 3 + 1] +
      arrays_cube.position[arr[1] * 3 + 1] +
      arrays_cube.position[arr[2] * 3 + 1]) /
    3;
  const z =
    (arrays_cube.position[arr[0] * 3 + 2] +
      arrays_cube.position[arr[1] * 3 + 2] +
      arrays_cube.position[arr[2] * 3 + 2]) /
    3;

  return [x, y, z];
};

var teste = 1;
var gui;
var qtd_triangulos = 0;
var config = {
  rotate: 0,
  x: 0,
  y: -5,
  z: 0,
  spin_x: 0,
  spin_y: 0,
  camera_x: 0,
  camera_y: 0,
  camera_z: 25,

  addCaixa: function () {
    addCaixa();
    gui.destroy();
    loadGUI(gl);
  },
  addPlayer: function () {
    addPlayer();
    gui.destroy();
    loadGUI(gl);
  },
  addInimigo: function () {
    addInimigo();
    gui.destroy();
    loadGUI(gl);
  },

  addFim: function () {
    addFim();
    gui.destroy();
    loadGUI(gl);
  },

  addShot: function () {
    addShot();
    gui.destroy();
    loadGUI(gl);
  },
  triangulo: 0,

  addTriangle: function () {
    addTriangle();
    gui.destroy();
    loadGUI(gl);

  },
  addPyramid: function () {

    addPyramid();
    gui.destroy();
    loadGUI(gl);
  },
  criarVertice: function () {


    var n = config.triangulo * 3;
    var inicio = arrays_cube.indices.slice(0, n);
    var temp = arrays_cube.indices.slice(n, n + 3);
    var resto = arrays_cube.indices.slice(
      n + 3,
      arrays_cube.indices.length
    );
    var b = calculaMeioDoTrianguloIndices(temp);
    var new_indice = arrays_cube.position.length / 3;

    arrays_cube.position = new Float32Array([
      ...arrays_cube.position,
      ...b,
    ]);

    var novotri = [
      temp[0],
      new_indice,
      temp[1],

      temp[1],
      new_indice,
      temp[2],

      temp[2],
      new_indice,
      temp[0],
    ];

    var final = new Uint16Array([...inicio, ...novotri, ...resto]);

    arrays_cube.indices = new Uint16Array([...final]);

    cubeBufferInfo = twgl.createBufferInfoFromArrays(gl, arrays_cube);

    objectsToDraw = [];
    objects = [];
    nodeInfosByName = {};
    scene = makeNode(objeto);

    gui.updateDisplay();
    //drawScene();
  },
  //time: 0.0,
  scalex: 1.0,
  scaley: 1.0,
  scalez: 1.0,
  target: 0,
  vx: 0,
  vy: 0,
  vz: 0,
  escolheObjeto: "cubo1",
  vertice: 0,
  luzIndex: 0,
  luzx: 0,
  luzy: 1,
  luzz: 0,
  shininess: 300.0,
  camera_1: false,
  camera_2: false,
  camera_3: false,
};

const checkColision2 = (obj, shot) => {

  if (
    (shot[0] < obj[0] + 1.5)
    && (shot[0] + 0.5 > obj[0] - 1.5)
    && (shot[1] < obj[1] + 2)
    && (1 + shot[1] > obj[1])
  ) {
    return true;
  } else {
    return false;
  }

}

const moveVertice = function () {
  var n = config.vertice;
  var mapVertices = mapAllVertices(
    arrays_cube.position,
    arrays_cube.indices
  );
  var temp = mapVertices[n];
  //console.log(temp);

  for (let index = 0; index < temp.length; index++) {
    arrays_cube.position[temp[index] * 3] = config.vx;
    arrays_cube.position[temp[index] * 3 + 1] = config.vy;
    arrays_cube.position[temp[index] * 3 + 2] = config.vz;
  }

  // arrays_pyramid.position[n] = config.vx;
  // arrays_pyramid.position[n + 1] = config.vy;
  // arrays_pyramid.position[n + 2] = config.vz;
  arrays_cube.normal = calculateNormal(
    arrays_cube.position,
    arrays_cube.indices
  );
  cubeBufferInfo = twgl.createBufferInfoFromArrays(gl, arrays_cube);

  objectsToDraw = [];
  objects = [];
  nodeInfosByName = {};
  scene = makeNode(objeto);
};

var folder_vertice;
var folder_camera;
var folder_matrix;
var folder_objeto;
var folder_luz;

const loadGUI = () => {
  gui = new dat.GUI();

  folder_vertice = gui.addFolder("Manipular vertices");
  folder_camera = gui.addFolder("Manipular cameras");
  folder_matrix = gui.addFolder("Manipular matrizes");
  folder_objeto = gui.addFolder("Manipula objetos")
  folder_luz = gui.addFolder("Manipular luzes");
  folder_vertice.open();
  folder_matrix.add(config, "rotate", 0, 360, 0.5).listen().onChange(function () {
    nodeInfosByName["origin"].trs.rotation[0] = degToRad(config.rotate);
  });

  folder_matrix.add(config, "x", -10, 10, 0.5);
  folder_matrix.add(config, "y", -10, 10, 0.5);
  folder_matrix.add(config, "z", -10, 10, 0.5);

  folder_matrix.add(config, "spin_x", -1000, 1000, 2);
  folder_matrix.add(config, "spin_y", -1000, 1000, 2);

  folder_matrix.add(config, "scalex", -10, 10, 0.1);
  folder_matrix.add(config, "scaley", -10, 10, 0.1);
  folder_matrix.add(config, "scalez", -10, 10, 0.1);


  folder_camera.add(config, "camera_x", -200, 200, 1);
  folder_camera.add(config, "camera_y", -200, 200, 1);
  folder_camera.add(config, "camera_z", -200, 200, 1);

  folder_vertice.add(config, "triangulo", 0, 20, 1);
  folder_vertice.add(config, "criarVertice");
  folder_objeto.add(config, "addTriangle");
  folder_objeto.add(config, "addCaixa");
  folder_objeto.add(config, "addPyramid");

  folder_objeto.add(config, "escolheObjeto", listaObjetos).onChange(function (value) {
    config.x = nodeInfosByName[value].trs.translation[0]
    config.y = nodeInfosByName[value].trs.translation[1]
    config.z = nodeInfosByName[value].trs.translation[2]
    config.scalex = nodeInfosByName[value].trs.scale[0]
    config.scaley = nodeInfosByName[value].trs.scale[1]
    config.scalez = nodeInfosByName[value].trs.scale[2]
    config.spinx = nodeInfosByName[value].trs.rotation[0]
    config.spiny = nodeInfosByName[value].trs.rotation[1]

  });

  folder_luz.add(config, "luzIndex", listOfLights).onChange(function () {
    config.luzx = arrayLuz[config.luzIndex].position.x;
    config.luzy = arrayLuz[config.luzIndex].position.y;
    config.luzz = arrayLuz[config.luzIndex].position.z;
    palette.corLuz = arrayLuz[config.luzIndex].color;
    palette.corSpec = arrayLuz[config.luzIndex].spec;

    gui.updateDisplay();
  });
  folder_luz.add(config, "luzx", -20, 20, 0.01).onChange(function () {
    arrayLuz[config.luzIndex].position.x = config.luzx;
    arrayLuz[config.luzIndex].position.y = config.luzy;
    arrayLuz[config.luzIndex].position.z = config.luzz;
  });
  folder_luz.add(config, "luzy", -20, 20, 0.01).onChange(function () {
    arrayLuz[config.luzIndex].position.x = config.luzx;
    arrayLuz[config.luzIndex].position.y = config.luzy;
    arrayLuz[config.luzIndex].position.z = config.luzz;
  });
  folder_luz.add(config, "luzz", -20, 200, 0.01).onChange(function () {
    arrayLuz[config.luzIndex].position.x = config.luzx;
    arrayLuz[config.luzIndex].position.y = config.luzy;
    arrayLuz[config.luzIndex].position.z = config.luzz;
  });
  folder_luz.add(config, "shininess", 0, 3000, 0.1);

  folder_luz.addColor(palette, "corLuz").onChange(function () {
    arrayLuz[config.luzIndex].color = palette.corLuz;
  });
  folder_luz.addColor(palette, "corCubo");
  folder_luz.addColor(palette, "corSpec").onChange(function () {
    arrayLuz[config.luzIndex].spec = palette.corSpec;
  });
  folder_camera.add(config, "target", -5, 5, 0.01);
  folder_vertice.add(config, "vertice").onChange(function () {
    const temp = arrays_cube.position.slice(
      config.vertice * 3,
      config.vertice * 3 + 3
    );

    config.vx = temp[0];
    config.vy = temp[1];
    config.vz = temp[2];

    gui.updateDisplay();
  });
  folder_vertice.add(config, "vx", -10, 10, 0.1).onChange(function () {
    moveVertice();
  });
  folder_vertice.add(config, "vy", -10, 10, 0.1).onChange(function () {
    moveVertice();
  });
  folder_vertice.add(config, "vz", -10, 10, 0.1).onChange(function () {
    moveVertice();
  });
  folder_camera
    .add(config, "camera_1")
    .listen()
    .onChange(function () {
      config.camera_2 = false;
      config.camera_3 = false;
    });
  folder_camera
    .add(config, "camera_2")
    .listen()
    .onChange(function () {
      config.camera_1 = false;
      config.camera_3 = false;
    });
  folder_camera
    .add(config, "camera_3")
    .listen()
    .onChange(function () {
      config.camera_1 = false;
      config.camera_2 = false;
    });
  //folder_vertice.add(config, "moverVertice");
};

var TRS = function () {
  this.translation = [0, 0, 0];
  this.rotation = [0, 0, 0];
  this.scale = [1, 1, 1];
};

TRS.prototype.getMatrix = function (dst) {
  dst = dst || new Float32Array(16);
  var t = this.translation;
  var r = this.rotation;
  var s = this.scale;

  // compute a matrix from translation, rotation, and scale
  m4.translation(t[0], t[1], t[2], dst);
  m4.xRotate(dst, r[0], dst);
  m4.yRotate(dst, r[1], dst);
  m4.zRotate(dst, r[2], dst);
  m4.scale(dst, s[0], s[1], s[2], dst);
  return dst;
};

var Node = function (source) {
  this.children = [];
  this.localMatrix = m4.identity();
  this.worldMatrix = m4.identity();
  this.source = source;
};

Node.prototype.setParent = function (parent) {
  // remove us from our parent
  if (this.parent) {
    var ndx = this.parent.children.indexOf(this);
    if (ndx >= 0) {
      this.parent.children.splice(ndx, 1);
    }
  }

  // Add us to our new parent
  if (parent) {
    parent.children.push(this);
  }
  this.parent = parent;
};

Node.prototype.updateWorldMatrix = function (matrix) {
  var source = this.source;
  if (source) {
    source.getMatrix(this.localMatrix);
  }

  if (matrix) {
    // a matrix was passed in so do the math
    m4.multiply(matrix, this.localMatrix, this.worldMatrix);
  } else {
    // no matrix was passed in so just copy.
    m4.copy(this.localMatrix, this.worldMatrix);
  }

  // now process all the children
  var worldMatrix = this.worldMatrix;
  this.children.forEach(function (child) {
    child.updateWorldMatrix(worldMatrix);
  });
};


var hitCounter = 0;
var gameOver = 0;

function addPyramid() {
  inMemory();
  numberOfObjects++;
  countC++;
  var novoObjeto = {
    name: `pyramid${countC}`,
    translation: [countC * 2, 0, 0],
    bufferInfo: pyramidBufferInfo,
    vao: pyramidVAO,
  }
  listaObjetos.push(novoObjeto.name);
  objeto.children.push(novoObjeto);

  objectsToDraw = [];
  objects = [];
  nodeInfosByName = {};
  scene = makeNode(objeto);
  addInMemoryObject();
  outMemory();
}

function addPlayer() {
  inMemory();
  numberOfObjects++;
  countC++;
  var novoObjeto = {
    name: `cubo${countC}`,
    translation: [0, 0, 0],
    textura: 'naveCim.jpg',
    bufferInfo: cubeBufferInfo,
    vao: cubeVAO
  }
  console.log(numberOfObjects);
  console.log(novoObjeto.name);
  listaObjetos.push(novoObjeto.name);
  objeto.children.push(novoObjeto);

  objectsToDraw = [];
  objects = [];
  nodeInfosByName = {};
  scene = makeNode(objeto);
  addInMemoryObject();
  outMemory();
}

function addShot() {
  inMemory();
  numberOfObjects++;
  //countC++;
  //var shotCounter=1;
  var novoObjeto = {
    name: `shot`,
    translation: [0, -5, 0],
    bufferInfo: shotBufferInfo,
    vao: shotVAO
  }
  console.log(numberOfObjects);
  console.log(novoObjeto.name);
  listaObjetos.push(novoObjeto.name);
  objeto.children.push(novoObjeto);


  objectsToDraw = [];
  objects = [];
  nodeInfosByName = {};
  scene = makeNode(objeto);
  addInMemoryObject();
  outMemory();
}

function addFim() {
  inMemory();
  numberOfObjects++;
  var novoObjeto = {
    name: `fim`,
    translation: [0, 14.5, 0],
    bufferInfo: triangleBufferInfo,
    vao: triangleVAO
  }
  console.log(novoObjeto);
  listaObjetos.push(novoObjeto.name);
  objeto.children.push(novoObjeto);

  objectsToDraw = [];
  objects = [];
  nodeInfosByName = {};
  scene = makeNode(objeto);
  addInMemoryObject();
  outMemory();
}

function addInimigo() {
  inMemory();
  numberOfObjects++;
  //countC++;
  countEnemy++;
  var novoObjeto = {
    name: `inimigo${countEnemy}`,
    translation: [countEnemy * 2.2 + -12, 10, 0],
    bufferInfo: cubeBufferInfo,
    vao: cubeVAO
  }

  console.log(novoObjeto.name);
  listaObjetos.push(novoObjeto.name);
  objeto.children.push(novoObjeto);

  objectsToDraw = [];
  objects = [];
  nodeInfosByName = {};
  scene = makeNode(objeto);
  addInMemoryObject();
  outMemory();
}

function addCaixa() {
  inMemory();
  numberOfObjects++;
  countC++;
  var novoObjeto = {
    name: `cubo${countC}`,
    translation: [countC * 2, 0, 0],
    bufferInfo: cubeBufferInfo,
    vao: cubeVAO
  }

  console.log(novoObjeto.name);
  listaObjetos.push(novoObjeto.name);
  objeto.children.push(novoObjeto);

  objectsToDraw = [];
  objects = [];
  nodeInfosByName = {};
  scene = makeNode(objeto);
  addInMemoryObject();
  outMemory();
}

function addTriangle() {
  inMemory();
  numberOfObjects++;
  countC++;
  var novoObjeto = {
    name: `triangle${countC}`,
    translation: [0, countC + 1, 0],
    bufferInfo: triangleBufferInfo,
    vao: triangleVAO
  }
  console.log(countC)
  console.log(novoObjeto);
  listaObjetos.push(novoObjeto.name);
  objeto.children.push(novoObjeto);

  objectsToDraw = [];
  objects = [];
  nodeInfosByName = {};
  scene = makeNode(objeto);
  addInMemoryObject();
  outMemory();
}

function makeNode(nodeDescription) {
  var trs = new TRS();
  var node = new Node(trs);
  nodeInfosByName[nodeDescription.name] = {
    trs: trs,
    node: node,
  };
  trs.translation = nodeDescription.translation || trs.translation;
  if (nodeDescription.draw !== false) {
    node.drawInfo = {
      uniforms: {
        u_colorOffset: [0.2, 0.2, 0.7, 0],
        u_colorMult: [0.4, 0.1, 0.4, 1],
        u_matrix: m4.identity(),
      },
      programInfo: programInfo,
      bufferInfo: nodeDescription.bufferInfo,
      vertexArray: nodeDescription.vao,
    };
    objectsToDraw.push(node.drawInfo);
    objects.push(node);
  }


  makeNodes(nodeDescription.children).forEach(function (child) {
    child.setParent(node);
  });
  return node;
}


function makeNodes(nodeDescriptions) {
  return nodeDescriptions ? nodeDescriptions.map(makeNode) : [];
}

function inMemory() {
  var ii;
  if (numberOfObjects > 0) {
    for (ii = 1; ii <= numberOfObjects; ii++) {
      inMemoryObjects[ii - 1].x = nodeInfosByName[ii].trs.translation[0];
      inMemoryObjects[ii - 1].y = nodeInfosByName[ii].trs.translation[1];
      inMemoryObjects[ii - 1].z = nodeInfosByName[ii].trs.translation[2];
      inMemoryObjects[ii - 1].spin_x = nodeInfosByName[ii].trs.rotation[0];
      inMemoryObjects[ii - 1].spin_y = nodeInfosByName[ii].trs.rotation[1]
      inMemoryObjects[ii - 1].scalex = nodeInfosByName[ii].trs.scale[0];
      inMemoryObjects[ii - 1].scaley = nodeInfosByName[ii].trs.scale[1];
      inMemoryObjects[ii - 1].scalez = nodeInfosByName[ii].trs.scale[2];
    }
  }

}

function outMemory() {
  var ii;
  if (numberOfObjects > 0)
    for (ii = 1; ii <= numberOfObjects; ii++) {
      nodeInfosByName[ii].trs.translation[0] = inMemoryObjects[ii - 1].x;
      nodeInfosByName[ii].trs.translation[1] = inMemoryObjects[ii - 1].y;
      nodeInfosByName[ii].trs.translation[2] = inMemoryObjects[ii - 1].z;
      nodeInfosByName[ii].trs.rotation[0] = inMemoryObjects[ii - 1].spin_x;
      nodeInfosByName[ii].trs.rotation[1] = inMemoryObjects[ii - 1].spin_y;
      nodeInfosByName[ii].trs.scale[0] = inMemoryObjects[ii - 1].scalex;
      nodeInfosByName[ii].trs.scale[1] = inMemoryObjects[ii - 1].scaley;
      nodeInfosByName[ii].trs.scale[2] = inMemoryObjects[ii - 1].scalez;
    }
}

function addInMemoryObject() {
  let anotherNewObj = {
    x: 0,
    y: 0,
    z: 0,
    spin_x: 0,
    spin_y: 0,
    scalex: 1,
    scaley: 1,
    scalez: 1
  }
  console.log(anotherNewObj)
  inMemoryObjects.push(anotherNewObj);
}

const mapAllVertices = (position, indices) => {
  let mapVertices = {};

  let pontos = [],
    faces = [];

  for (let i = 0; i < position.length; i += 3) {
    pontos.push([position[i], position[i + 1], position[i + 2]]);
  }

  for (let i = 0; i < indices.length; i += 3) {
    faces.push([indices[i], indices[i + 1], indices[i + 2]]);
  }

  let batata = {};

  for (let i = 0, j = 0; i < position.length; i += 3, j++) {
    mapVertices[j] = [j];
    batata[j] = [];
  }

  for (let index in mapVertices) {
    faces.map((item) => {
      item.map((vertice) => {
        if (compareArray(pontos[mapVertices[index]], pontos[vertice]))
          if (!alreadyExist(batata[index], vertice))
            batata[index].push(vertice);

        return batata;
      });
    });
  }

  return batata;
};

const compareArray = (array1, array2) =>
  array1[0] == array2[0] && array1[1] == array2[1] && array1[2] == array2[2];

const alreadyExist = (array, index) =>
  (exist = array.find((item) => item == index));

const convertToZeroOne = (old_value, old_min, old_max) => {
  return (old_value - old_min) / (old_max - old_min);
};

class Luz {
  constructor(position, color, spec, shine) {
    this.position = {
      x: position[0],
      y: position[1],
      z: position[2],
    };

    this.color = color;
    this.spec = spec;

    this.shine = shine;
  }
}

var listOfLights = [0, 1, 2];
var arrayLuz = [
  new Luz([4, 0, 0], [255, 255, 255], [255, 255, 255], 300),
  new Luz([-4, 0, 0], [255, 255, 255], [255, 255, 255], 300),
  new Luz([5, 4, 8], [255, 255, 255], [255, 255, 255], 300),
];
var inMemoryObjects = [];
var exist;
var numberOfObjects;
var uniformes;
let oldTime = 0;
var then;
var texturas;
var cubeVAO;
var triangleVAO;
var pyramidVAO;
var shotVAO;
var imagem;
var tex;
var cubeBufferInfo;
var triangleBufferInfo;
var pyramidBufferInfo;
var shotBufferInfo;
var listaObjetos = [];
var objectsToDraw = [];
var objects = [];
var nodeInfosByName = {};
var scene;
var objeto = {};
var countC = 0;
var countEnemy = 0;
var ii;
var parimpar;
var deslocamento;
var programInfo;
var arrays_cube;
var arrays_triangle;
var arrays_pyramid;
var arrays_shot;
var gl;
var aspect;
var projectionMatrix;
var cameraMatrix;
var viewMatrix;
var adjust;
var speed;
var c;
var fieldOfViewRadians;
var palette = {
  corLuz: [255, 255, 255], // RGB array
  corCubo: [255, 255, 255], // RGB array
  corSpec: [255, 255, 255], // RGB array
};
//CAMERA VARIABLES
var cameraPosition;
var target;
var up;

var expSound = new Audio("explo.mp3");
expSound.muted = false;
expSound.volume = 0.33;

var shotSound = new Audio("piupiu.mp3");
shotSound.muted = false;
shotSound.volume = 0.35;

var perdeuSound = new Audio("quebost.mp3");
perdeuSound.muted = false;
perdeuSound.volume = 0.35;

var gnhouSound = new Audio("gnhou.mp3");
gnhouSound.muted = false;
gnhouSound.volume = 0.35;

function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.querySelector("#canvas");
  gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }
  
  then = 0;
  // Tell the twgl to match position with a_position, n
  // normal with a_normal etc..
  twgl.setAttributePrefix("a_");
  //cubeBufferInfo = flattenedPrimitives.createCubeBufferInfo(gl, 1);




  arrays_triangle = {
    position: new Float32Array([
      -10, 0, 0,
      10, 0, 0,
      0, 5, 0
    ]),
    indices: new Uint16Array([
      0, 1, 2
    ]),
  };

  arrays_pyramid = {
    normal: new Float32Array([
      0, 0, 1,

      1, 0, 0,

      0, 0, -1,

      -1, 0, 0,

      0, -1, 0,

      //-1, 1, -1,
    ]),
    indices: new Uint16Array([
      //0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 8, 4, 1, 8, 5, 2,
      0, 1, 2,

      0, 3, 2,

      0, 4, 3,

      0, 4, 1,

      4, 1, 2,

      3, 4, 2,
    ]),
  }



  arrays_shot = {
    position: new Float32Array([
      0.25, -0.25, 0.25, 0.25, 0.25, 0.25, -0.25, 0.25, 0.25,
      0.25, -0.25, 0.25, -0.25, 0.25, 0.25, -0.25, -0.25, 0.25,

      -0.25, -0.25, 0.25, -0.25, 0.25, 0.25, -0.25, 0.25, -0.25,
      -0.25, -0.25, 0.25, -0.25, 0.25, -0.25, -0.25, -0.25, -0.25,

      -0.25, -0.25, -0.25, -0.25, 0.25, -0.25, 0.25, 0.25, -0.25,
      -0.25, -0.25, -0.25, 0.25, 0.25, -0.25, 0.25, -0.25, -0.25,

      0.25, -0.25, -0.25, 0.25, 0.25, -0.25, 0.25, 0.25, 0.25,
      0.25, -0.25, -0.25, 0.25, 0.25, 0.25, 0.25, -0.25, 0.25,



      0.25, 0.25, 0.25, 0.25, 0.25, -0.25, -0.25, 0.25, -0.25,
      0.25, 0.25, 0.25, -0.25, 0.25, -0.25, -0.25, 0.25, 0.25,

      0.25, -0.25, -0.25, 0.25, -0.25, 0.25, -0.25, -0.25, 0.25,
      0.25, -0.25, -0.25, -0.25, -0.25, 0.25, -0.25, -0.25, -0.25
    ]),

    indices: new Uint16Array([
      0, 1, 2,
      3, 4, 5,
      6, 7, 8,
      9, 10, 11,
      12, 13, 14,
      15, 16, 17,
      18, 19, 20,
      21, 22, 23,
      24, 25, 26, 27,
      28, 29, 30, 31,
      32, 33, 34, 35
    ]),
    texcoord: [1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1],

  }

  arrays_cube = {
    // vertex positions for a cube
    position: new Float32Array([
      1, 1, -1, //0
      1, 1, 1, //1
      1, -1, 1, //2
      1, -1, -1, //3
      -1, 1, 1, //4
      -1, 1, -1, //5
      -1, -1, -1,//6
      -1, -1, 1, //7

      -1, 1, 1, //8
      1, 1, 1, //9
      1, 1, -1, //10
      -1, 1, -1, //11

      -1, -1, -1,//12
      1, -1, -1,//13
      1, -1, 1, //14
      -1, -1, 1,//15
      1, 1, 1,//16
      -1, 1, 1,//17
      -1, -1, 1,//18
      1, -1, 1, //19
      -1, 1, -1, //20
      1, 1, -1, //21
      1, -1, -1,//22
      -1, -1, -1,//23
    ]),
    // vertex normals for a cube
    normal: new Float32Array([
      1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
      0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
      -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
      0, 0, -1,
    ]),
    texcoord: [1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1],
    faceId: { numComponents: 1, data: new Uint8Array([0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6]), },
    indices: new Uint16Array([
      0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12,
      14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23,
    ]),
    barycentric: [],
  };
  arrays_cube.barycentric = calculateBarycentric(
    arrays_cube.position.length
  );

  arrays_cube.normal = calculateNormal(
    arrays_cube.position,
    arrays_cube.indices
  );

  triangleBufferInfo = twgl.createBufferInfoFromArrays(gl, arrays_triangle);
  cubeBufferInfo = twgl.createBufferInfoFromArrays(gl, arrays_cube);
  pyramidBufferInfo = twgl.createBufferInfoFromArrays(gl, arrays_pyramid);
  shotBufferInfo = twgl.createBufferInfoFromArrays(gl, arrays_shot);
  // setup GLSL program

  programInfo = twgl.createProgramInfo(gl, [vs_texture, fs_texture]);

  cubeVAO = twgl.createVAOFromBufferInfo(gl, programInfo, cubeBufferInfo);
  triangleVAO = twgl.createVAOFromBufferInfo(gl, programInfo, triangleBufferInfo);
  pyramidVAO = twgl.createVAOFromBufferInfo(gl, programInfo, pyramidBufferInfo);
  shotVAO = twgl.createVAOFromBufferInfo(gl, programInfo, shotBufferInfo);

  texturas = ["pedra.jpeg", "pedra_obito.jpeg", "naveCima.jpg"]

  tex = twgl.createTexture(gl, {
    target: gl.TEXTURE_2D_ARRAY,
    src: texturas,
  });


  uniformes = {
    u_diffuse: tex,
    u_faceIndex: [0, 1, 2, 3, 4, 5],
  }

  function degToRad(d) {
    return (d * Math.PI) / 180;
  }

  fieldOfViewRadians = degToRad(60);

  objectsToDraw = [];
  objects = [];
  nodeInfosByName = {};

  // Let's make all the nodes
  objeto = {
    name: "origin",
    draw: false,
    translation: [0, 0, 0],
    children: [],
  };

  scene = makeNode(objeto);
  objects.forEach(function (object) {
    object.drawInfo.uniforms.u_lightWorldPosition0 = [
      arrayLuz[0].position.x,
      arrayLuz[0].position.y,
      arrayLuz[0].position.z,
    ];
    object.drawInfo.uniforms.u_lightWorldPosition1 = [
      arrayLuz[1].position.x,
      arrayLuz[1].position.y,
      arrayLuz[1].position.z,
    ];
    object.drawInfo.uniforms.u_lightWorldPosition2 = [
      arrayLuz[2].position.x,
      arrayLuz[2].position.y,
      arrayLuz[2].position.z,
    ];

    object.drawInfo.uniforms.u_lightColor0 = [
      convertToZeroOne(arrayLuz[0].color[0], 0, 255),
      convertToZeroOne(arrayLuz[0].color[1], 0, 255),
      convertToZeroOne(arrayLuz[0].color[2], 0, 255),
    ];
    object.drawInfo.uniforms.u_lightColor1 = [
      convertToZeroOne(arrayLuz[1].color[0], 0, 255),
      convertToZeroOne(arrayLuz[1].color[1], 0, 255),
      convertToZeroOne(arrayLuz[1].color[2], 0, 255),
    ];
    object.drawInfo.uniforms.u_lightColor2 = [
      convertToZeroOne(arrayLuz[2].color[0], 0, 255),
      convertToZeroOne(arrayLuz[2].color[1], 0, 255),
      convertToZeroOne(arrayLuz[2].color[2], 0, 255),
    ];

    object.drawInfo.uniforms.u_color = [
      convertToZeroOne(palette["corCubo"][0], 0, 255),
      convertToZeroOne(palette["corCubo"][1], 0, 255),
      convertToZeroOne(palette["corCubo"][2], 0, 255),
      1,
    ];

    object.drawInfo.uniforms.u_specularColor0 = [
      convertToZeroOne(arrayLuz[0].spec[0], 0, 255),
      convertToZeroOne(arrayLuz[0].spec[1], 0, 255),
      convertToZeroOne(arrayLuz[0].spec[2], 0, 255),
    ];
    object.drawInfo.uniforms.u_specularColor1 = [
      convertToZeroOne(arrayLuz[1].spec[0], 0, 255),
      convertToZeroOne(arrayLuz[1].spec[1], 0, 255),
      convertToZeroOne(arrayLuz[1].spec[2], 0, 255),
    ];
    object.drawInfo.uniforms.u_specularColor2 = [
      convertToZeroOne(arrayLuz[2].spec[0], 0, 255),
      convertToZeroOne(arrayLuz[2].spec[1], 0, 255),
      convertToZeroOne(arrayLuz[2].spec[2], 0, 255),
    ];
  });
  cameraPosition = [config.camera_x, config.camera_y, config.camera_z];
  addPlayer();
  addFim();
  var cont;
  for (cont = 0; cont < 9; cont++) {
    addInimigo();
  }
  addShot();
  console.log(numberOfObjects);
  //addCaixa();
  loadGUI(gl);
  console.log(isNaN(numberOfObjects));
  console.log("Numero de objetos:", numberOfObjects);
  requestAnimationFrame(drawScene);
  alert("Para movimentar o persongem, use o menu->Manipular Matrizes->x!\n");
  // Draw the scene.
}
function drawScene(time) {
  time *= 0.001;
  teste = time;
  config.time = config.time;
  twgl.resizeCanvasToDisplaySize(gl.canvas);

  // Tell WebGL how to convert from clip space to pixels
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  if ((oldTime | 0) < (time | 0)) {
    uniformes.u_faceIndex[0] = 2;
    uniformes.u_faceIndex[1] = 2;
    uniformes.u_faceIndex[2] = 2;
    uniformes.u_faceIndex[3] = 2;
    uniformes.u_faceIndex[4] = 2;
    uniformes.u_faceIndex[5] = 2;
    uniformes.u_faceIndex[6] = 2;
    //uniformes.u_faceIndex[randInt(6)] = randInt(texturas.length);
  }
  oldTime = time;

  //gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  // Compute the projection matrix
  var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 200);

  var deltaTime = time - then;
  then = time;
  var adjustSide;
  var adjustTop;
  var speed = 1.8;
  var c = time * speed;

  adjustSide = Math.sin(c);
  adjustTop = Math.cos(c);
  //tempoAcumulado+=deltaTime;

  // Compute the camera's matrix using look at.
  //cameraPosition = [config.camera_x, config.camera_y, config.camera_z];
  if (!config.camera_1 && !config.camera_2 && !config.camera_3) {
    if (cameraPosition[0] > config.camera_x) cameraPosition[0] -= 1;
    if (cameraPosition[0] < config.camera_x) cameraPosition[0] += 1;

    if (cameraPosition[1] > config.camera_y) cameraPosition[1] -= 1;
    if (cameraPosition[1] < config.camera_y) cameraPosition[1] += 1;

    if (cameraPosition[2] > config.camera_z) cameraPosition[2] -= 1;
    if (cameraPosition[2] < config.camera_z) cameraPosition[2] += 1;
  } else if (config.camera_1) {
    if (cameraPosition[0] > 4) cameraPosition[0] -= 0.5;
    if (cameraPosition[0] < 4) cameraPosition[0] += 0.5;

    if (cameraPosition[1] > 4) cameraPosition[1] -= 0.5;
    if (cameraPosition[1] < 4) cameraPosition[1] += 0.5;

    if (cameraPosition[2] > 10) cameraPosition[2] -= 0.5;
    if (cameraPosition[2] < 10) cameraPosition[2] += 0.5;
  } else if (config.camera_2) {
    if (cameraPosition[0] > 10) cameraPosition[0] -= 0.5;
    if (cameraPosition[0] < 10) cameraPosition[0] += 0.5;

    if (cameraPosition[1] > 10) cameraPosition[1] -= 0.5;
    if (cameraPosition[1] < 10) cameraPosition[1] += 0.5;

    if (cameraPosition[2] > 13) cameraPosition[2] -= 0.5;
    if (cameraPosition[2] < 13) cameraPosition[2] += 0.5;
  } else if (config.camera_3) {
    if (cameraPosition[0] > -2) cameraPosition[0] -= 0.5;
    if (cameraPosition[0] < -2) cameraPosition[0] += 0.5;

    if (cameraPosition[1] > -2) cameraPosition[1] -= 0.5;
    if (cameraPosition[1] < -2) cameraPosition[1] += 0.5;

    if (cameraPosition[2] > 5) cameraPosition[2] -= 0.5;
    if (cameraPosition[2] < 5) cameraPosition[2] += 0.5;
  }

  target = [config.target, 0, 0];
  up = [0, 1, 0];
  var cameraMatrix = m4.lookAt(cameraPosition, target, up);

  // Make a view matrix from the camera matrix.
  var viewMatrix = m4.inverse(cameraMatrix);

  var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

  var modifier = 0.5;

  const bodyElement = document.querySelector("body");


  //var fRotationRadians = degToRad(uiObj.rotation.y);
  bodyElement.addEventListener("keydown", gameAction, false);
  //bodyElement.addEventListener("keypress", cFunction , false );

  function gameAction(event) {

    // gameStart=1;
    switch (event.key) {
      case 'a': nodeInfosByName['cubo1'].trs.translation[0] -= modifier;
        break;
      case 'A': nodeInfosByName['cubo1'].trs.translation[0] -= modifier;
        break;
      case '4': nodeInfosByName['cubo1'].trs.translation[0] -= modifier;
        break;
      case 'd': nodeInfosByName['cubo1'].trs.translation[0] += modifier;
        break;
      case 'D': nodeInfosByName['cubo1'].trs.translation[0] += modifier;
        break;
      case '6': nodeInfosByName['cubo1'].trs.translation[0] += modifier;
        break;
      case 'c': config.camera_3 = true;
        break;
    }
  }

  //alert('keydown event\n\n' + 'key: ' + keyName);
  //});

  /*
    const bodyElement = document.querySelector("body");
    bodyElement.addEventListener("keydown", gameAction);
    function gameAction(){
      const key=event.key;
      switch (key) {
        case 'k': 
        nodeInfosByName['cubo1'].trs.translation[0] -= modifier;
        break;
        case 'ç':
          nodeInfosByName['cubo1'].trs.translation[0] += modifier;
          break;
      }
    }
    */

  if (nodeInfosByName[`shot`] != null) {
    nodeInfosByName[`shot`].trs.translation[1] += deltaTime * speed * 4.9;
    nodeInfosByName[`shot`].trs.rotation[1] += deltaTime * speed * 1.3;
    nodeInfosByName[`shot`].trs.rotation[2] -= deltaTime * speed * 0.5;

    //Fazer a luz acompanhar o tiro
    arrayLuz[0].position.x = nodeInfosByName[`shot`].trs.translation[0];
    arrayLuz[0].position.y = nodeInfosByName[`shot`].trs.translation[1] + 1;
    arrayLuz[0].position.z = nodeInfosByName[`shot`].trs.translation[2];
    //console.log(nodeInfosByName[`shot${i}`].trs.translation[1]);

    //se tiro acerta
    for (ii = 1; ii <= countEnemy; ii++) {

      if ((nodeInfosByName[`shot`] != null)
        && (nodeInfosByName[`inimigo${ii}`] != null)
        && (checkColision2(nodeInfosByName[`inimigo${ii}`].trs.translation, nodeInfosByName[`shot`].trs.translation))) {
        nodeInfosByName[`inimigo${ii}`].trs.translation[1] = 990;
        nodeInfosByName[`shot`].trs.translation[1] = nodeInfosByName[`cubo1`].trs.translation[1];
        expSound.play();
        shotSound.play();
        hitCounter++;
        if (hitCounter >= countEnemy) {
          gnhouSound.play();
          alert("Todos os inimigos abatidos!\n");
          config.camera_2 = true;
          break;
        }
      }

    }
    //tiro volta
    if ((nodeInfosByName[`shot`] != null)
      && (nodeInfosByName[`fim`] != null)
      && (nodeInfosByName[`shot`].trs.translation[1] > 14)) {

      nodeInfosByName[`shot`].trs.translation[0] = nodeInfosByName['cubo1'].trs.translation[0];
      shotSound.play();
      nodeInfosByName[`shot`].trs.translation[1] = nodeInfosByName['cubo1'].trs.translation[1];
      nodeInfosByName[`shot`].trs.translation[2] = nodeInfosByName['cubo1'].trs.translation[2];

    }

    for (ii = 1; ii <= countEnemy; ii++) {
      nodeInfosByName[`inimigo${ii}`].trs.translation[0] += adjustSide * 0.1;
      nodeInfosByName[`inimigo${ii}`].trs.translation[1] -= deltaTime * 0.4

      if (checkColision2(nodeInfosByName[`inimigo${ii}`].trs.translation, nodeInfosByName[`cubo1`].trs.translation) || nodeInfosByName[`inimigo${ii}`].trs.translation[1] <= -5) {
        perdeuSound.play();
        alert("Perdeu!\n");
        break;
      }

    }
  }


  adjust;
  speed = 3;
  c = time * speed;

  adjust = degToRad(time * config.spin_x);
  nodeInfosByName[config.escolheObjeto].trs.rotation[0] = adjust;
  adjust = degToRad(time * config.spin_y);
  nodeInfosByName[config.escolheObjeto].trs.rotation[1] = adjust;
  nodeInfosByName[config.escolheObjeto].trs.translation = [config.x, config.y, config.z];
  nodeInfosByName[config.escolheObjeto].trs.scale = [config.scalex, config.scaley, config.scalez];

  //nodeInfosByName["origin"].trs.rotation[0] = degToRad(config.rotate);
  // Update all world matrices in the scene graph
  scene.updateWorldMatrix();

  // Compute all the matrices for rendering
  objects.forEach(function (object) {
    object.drawInfo.uniforms.u_matrix = m4.multiply(
      viewProjectionMatrix,
      object.worldMatrix
    );
    object.drawInfo.uniforms.u_lightWorldPosition0 = [
      arrayLuz[0].position.x,
      arrayLuz[0].position.y,
      arrayLuz[0].position.z,
    ];
    object.drawInfo.uniforms.u_lightWorldPosition1 = [
      arrayLuz[1].position.x,
      arrayLuz[1].position.y,
      arrayLuz[1].position.z,
    ];
    object.drawInfo.uniforms.u_lightWorldPosition2 = [
      arrayLuz[2].position.x,
      arrayLuz[2].position.y,
      arrayLuz[2].position.z,
    ];

    object.drawInfo.uniforms.u_lightColor0 = [
      convertToZeroOne(arrayLuz[0].color[0], 0, 255),
      convertToZeroOne(arrayLuz[0].color[1], 0, 255),
      convertToZeroOne(arrayLuz[0].color[2], 0, 255),
    ];
    object.drawInfo.uniforms.u_lightColor1 = [
      convertToZeroOne(arrayLuz[1].color[0], 0, 255),
      convertToZeroOne(arrayLuz[1].color[1], 0, 255),
      convertToZeroOne(arrayLuz[1].color[2], 0, 255),
    ];
    object.drawInfo.uniforms.u_lightColor2 = [
      convertToZeroOne(arrayLuz[2].color[0], 0, 255),
      convertToZeroOne(arrayLuz[2].color[1], 0, 255),
      convertToZeroOne(arrayLuz[2].color[2], 0, 255),
    ];

    object.drawInfo.uniforms.u_color = [
      convertToZeroOne(palette["corCubo"][0], 0, 255),
      convertToZeroOne(palette["corCubo"][1], 0, 255),
      convertToZeroOne(palette["corCubo"][2], 0, 255),
      1,
    ];

    object.drawInfo.uniforms.u_specularColor0 = [
      convertToZeroOne(arrayLuz[0].spec[0], 0, 255),
      convertToZeroOne(arrayLuz[0].spec[1], 0, 255),
      convertToZeroOne(arrayLuz[0].spec[2], 0, 255),
    ];
    object.drawInfo.uniforms.u_specularColor1 = [
      convertToZeroOne(arrayLuz[1].spec[0], 0, 255),
      convertToZeroOne(arrayLuz[1].spec[1], 0, 255),
      convertToZeroOne(arrayLuz[1].spec[2], 0, 255),
    ];
    object.drawInfo.uniforms.u_specularColor2 = [
      convertToZeroOne(arrayLuz[2].spec[0], 0, 255),
      convertToZeroOne(arrayLuz[2].spec[1], 0, 255),
      convertToZeroOne(arrayLuz[2].spec[2], 0, 255),
    ];

    object.drawInfo.uniforms.u_color = [
      convertToZeroOne(palette["corCubo"][0], 0, 255),
      convertToZeroOne(palette["corCubo"][1], 0, 255),
      convertToZeroOne(palette["corCubo"][2], 0, 255),
      1,
    ];
    object.drawInfo.uniforms.u_world = object.worldMatrix;

    object.drawInfo.uniforms.u_worldInverseTranspose = m4.transpose(
      m4.inverse(object.worldMatrix)
    );

    object.drawInfo.uniforms.u_viewWorldPosition = cameraPosition;

    object.drawInfo.uniforms.u_shininess = config.shininess;
  });

  // ------ Draw the objects --------
  gl.useProgram(programInfo.program);
  twgl.setBuffersAndAttributes(gl, programInfo, cubeBufferInfo);
  twgl.setUniforms(programInfo, uniformes);
  //twgl.drawBufferInfo(gl, cubeBufferInfo); //comentar para adicionar outros objetos
  twgl.drawObjectList(gl, objectsToDraw);

  requestAnimationFrame(drawScene);
}

function randInt(min, max) {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  return Math.random() * (max - min) + min | 0;
}
main();