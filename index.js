// PointLightedCube.js (c) 2012 matsuda and kanda
// Vertex shader program
var VSHADER_SOURCE =
  "attribute vec4 a_Position;\n" +
  //  'attribute vec4 a_Color;\n' + // Defined constant in main()
  "attribute vec4 a_Normal;\n" +
  "uniform mat4 u_MvpMatrix;\n" +
  "uniform mat4 u_ModelMatrix;\n" + // Model matrix
  "uniform mat4 u_NormalMatrix;\n" + // Transformation matrix of the normal
  "uniform vec3 u_LightColor;\n" + // Light color
  "uniform vec3 u_LightPosition;\n" + // Position of the light source
  "uniform vec3 u_AmbientLight;\n" + // Ambient light color
  "varying vec4 v_Color;\n" +
  "void main() {\n" +
  "  vec4 color = vec4(1.0, 1.0, 1.0, 1.0);\n" + // Sphere color
  "  gl_Position = u_MvpMatrix * a_Position;\n" +
  // Calculate a normal to be fit with a model matrix, and make it 1.0 in length
  "  vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n" +
  // Calculate world coordinate of vertex
  "  vec4 vertexPosition = u_ModelMatrix * a_Position;\n" +
  // Calculate the light direction and make it 1.0 in length
  "  vec3 lightDirection = normalize(u_LightPosition - vec3(vertexPosition));\n" +
  // The dot product of the light direction and the normal
  "  float nDotL = max(dot(lightDirection, normal), 0.0);\n" +
  // Calculate the color due to diffuse reflection
  "  vec3 diffuse = u_LightColor * color.rgb * nDotL;\n" +
  // Calculate the color due to ambient reflection
  "  vec3 ambient = u_AmbientLight * color.rgb;\n" +
  // Add the surface colors due to diffuse reflection and ambient reflection
  "  v_Color = vec4(diffuse + ambient, color.a);\n" +
  "}\n";

// Fragment shader program
var FSHADER_SOURCE =
  "#ifdef GL_ES\n" +
  "precision mediump float;\n" +
  "#endif\n" +
  "varying vec4 v_Color;\n" +
  "void main() {\n" +
  "  gl_FragColor = v_Color;\n" +
  "}\n";

var canvas;
var gl;
var Temp_Option = "Color";
var n;
// Khai báo biến Rotate:
var RotateX = 0, RotateY = 0, RotateZ = 0;
// khai báo biến hàm Tran:
var TranX = 0.0, TranY = 0.0, TranZ = 0.0;
// Khai báo biến hàm Scale:
var ScaleX = 0.0, ScaleY = 0.0, ScaleZ = 0.0;
// Khai báo biến tốc độ quay:
var ANGLE_STEP = 45;
var currentAngle = 0.0;

//Khai báo biến màu sắc ánh sáng
var R_Light = 1, G_Light = 1, B_Light = 1;
//khai báo biến vị trí điểm sáng
var X_PointLight = 5.0, Y_PointLight = 8.0, Z_PointLight = 7.0;
//Khai báo biến màu sác ánh sáng xung quanh
var R_Ambient = 0.2, G_Ambient = 0.2, B_Ambient = 0.2;
var Tx,Ty,Tz,Sx,Sy,Sz;

function LoadData() {
  // Color
//   r = +document.getElementById("r").value;
//   g = +document.getElementById("g").value;
//   b = +document.getElementById("b").value;

  // Rotate
  RotateX = document.getElementById("x-rotate").checked ? 1 : 0;
  RotateY = document.getElementById("y-rotate").checked ? 1 : 0;
  RotateZ = document.getElementById("z-rotate").checked ? 1 : 0;
  ANGLE_STEP = document.getElementById("speed").value;

  // Translate
  Tx = document.getElementById("x-translate").value;
  Ty = document.getElementById("y-translate").value;
  Tz = document.getElementById("z-translate").value;

  // Scale
  Sx = document.getElementById("x-scale").value;
  Sy = document.getElementById("y-scale").value;
  Sz = document.getElementById("z-scale").value;

  // //PointLight
  X_PointLight = document.getElementById("x-position").value;
  Y_PointLight = document.getElementById("y-position").value;
  Z_PointLight = document.getElementById("z-position").value;
  
}

function main() {
    
  // Retrieve <canvas> element
  canvas = document.getElementById("webgl");

  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log("Failed to get the rendering context for WebGL");
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log("Failed to intialize shaders.");
    return;
  }

  // Set the vertex coordinates, the color and the normal
  n = initVertexBuffers(gl);
  if (n < 0) {
    console.log("Failed to set the vertex information");
    return;
  }
  // Set the clear color and enable the depth test
  gl.clearColor(0, 0, 0, 1);
  gl.enable(gl.DEPTH_TEST);

  //   var modelMatrix = new Matrix4(); // Model matrix
  //   var mvpMatrix = new Matrix4(); // Model view projection matrix
  //   var normalMatrix = new Matrix4(); // Transformation matrix for normals

  var tick = function () {
    // Vẽ Hoạt Cảnh
    LoadData();

    var modelMatrix = new Matrix4(); // Model matrix
    var mvpMatrix = new Matrix4(); // Model view projection matrix
    var normalMatrix = new Matrix4(); // Transformation matrix for normals
    // Get the storage locations of uniform variables and so on
    // Lấy giá trị lưu trữ
    u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
    u_MvpMatrix = gl.getUniformLocation(gl.program, "u_MvpMatrix");
    u_NormalMatrix = gl.getUniformLocation(gl.program, "u_NormalMatrix");
    u_LightColor = gl.getUniformLocation(gl.program, "u_LightColor");
    u_LightPosition = gl.getUniformLocation(gl.program, "u_LightPosition");
    u_AmbientLight = gl.getUniformLocation(gl.program, "u_AmbientLight");
    if (!u_MvpMatrix || !u_NormalMatrix || !u_LightColor || !u_LightPosition || !u_AmbientLight ) {
      console.log("Failed to get the storage location");
      return;
    }

    // Set the light color (white)
    gl.uniform3f(u_LightColor, R_Light, G_Light, B_Light);
    // Set the light direction (in the world coordinate)
    gl.uniform3f(u_LightPosition, X_PointLight, Y_PointLight, Z_PointLight);
    // Set the ambient light
    gl.uniform3f(u_AmbientLight, R_Ambient, G_Ambient, B_Ambient);

    // Pass the model matrix to u_ModelMatrix
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // Cập nhật góc quay
    currentAngle = animate(currentAngle);

    ScaleSphere();

    TranslateSphere();
    // Hàm vẽ hoạt cảnh
    draw(mvpMatrix, modelMatrix, normalMatrix, u_NormalMatrix, u_MvpMatrix);

    // Yêu cần trình duyệt gọi tick
    requestAnimationFrame(tick, canvas);
  };
  tick();
}

function initVertexBuffers(gl) {
  // Create a sphere
  var SPHERE_DIV = 10;

  var i, ai, si, ci;
  var j, aj, sj, cj;
  var p1, p2;

  var positions = [];
  var indices = [];

  // Generate coordinates
  for (j = 0; j <= SPHERE_DIV; j++) {
    aj = (j * Math.PI) / SPHERE_DIV;
    sj = Math.sin(aj);
    cj = Math.cos(aj);
    for (i = 0; i <= SPHERE_DIV; i++) {
      ai = (i * 2 * Math.PI) / SPHERE_DIV;
      si = Math.sin(ai);
      ci = Math.cos(ai);

      positions.push(si * sj); // X
      positions.push(cj); // Y
      positions.push(ci * sj); // Z
    }
  }

  // Generate indices
  for (j = 0; j < SPHERE_DIV; j++) {
    for (i = 0; i < SPHERE_DIV; i++) {
      p1 = j * (SPHERE_DIV + 1) + i;
      p2 = p1 + (SPHERE_DIV + 1);

      indices.push(p1);
      indices.push(p2);
      indices.push(p1 + 1);

      indices.push(p1 + 1);
      indices.push(p2);
      indices.push(p2 + 1);
    }
  }

  // Write the vertex property to buffers (coordinates and normals)
  // Same data can be used for vertex and normal
  // In order to make it intelligible, another buffer is prepared separately
  if (
    !initArrayBuffer(gl, "a_Position", new Float32Array(positions), gl.FLOAT, 3)
  )
    return -1;
  if (
    !initArrayBuffer(gl, "a_Normal", new Float32Array(positions), gl.FLOAT, 3)
  )
    return -1;

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log("Failed to create the buffer object");
    return -1;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );

  return indices.length;
}

function initArrayBuffer(gl, attribute, data, type, num) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log("Failed to create the buffer object");
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log("Failed to get the storage location of " + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return true;
}

// Hàm vẽ các hoạt cảnh
function draw(mvpMatrix,modelMatrix,normalMatrix,u_NormalMatrix,u_MvpMatrix) {
    if(RotateX!=0 || RotateY!=0 || RotateZ!=0) 
      modelMatrix.rotate(currentAngle, RotateX, RotateY, RotateZ);
    modelMatrix.translate(TranX, TranY, TranZ);
    modelMatrix.scale(ScaleX, ScaleY, ScaleZ);
    mvpMatrix.setPerspective(45, canvas.width / canvas.height, 1, 100);
    mvpMatrix.lookAt(0, 0, 6, 0, 0, 0, 0, 1, 0);
    mvpMatrix.multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

    // Pass the rotation matrix to the vertex shader
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Draw the sphere
  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);
}

// Last time that this function was called
var g_last = Date.now();
function animate(angle) {
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  // Update the current rotation angle (adjusted by the elapsed time)
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle;
}

function TranslateSphere() {
  // Trục X
  TranX = parseFloat(TranX.toFixed(2));
  if(Tx == "") ;
  else if (Tx > TranX) TranX += 0.01;
  else if (Tx < TranX) TranX -= 0.01;

  // Trục Y
  TranY = parseFloat(TranY.toFixed(2));
  if (Ty == "") ;
  else if (Ty > TranY) TranY += 0.01;
  else if (Ty < TranY) TranY -= 0.01;
 

  // Trục Z
  TranZ = parseFloat(TranZ.toFixed(2));
  if(Tz == "") ;
  else if (Tz > TranZ) TranZ += 0.01;
  else if (Tz < TranZ) TranZ -= 0.01;
}

// Hàm co dãn:
function ScaleSphere() {
  // Trục X
  ScaleX = parseFloat(ScaleX.toFixed(2));
  if(Sx == "") ;
  else if (Sx > ScaleX) ScaleX += 0.01;
  else if (Sx < ScaleX) ScaleX -= 0.01;

  // Trục Y
  ScaleY = parseFloat(ScaleY.toFixed(2));
  if(Sy == "") ;
  else if (Sy > ScaleY) ScaleY += 0.01;
  else if (Sy < ScaleY) ScaleY -= 0.01;
  
  // Trục Z
  ScaleZ = parseFloat(ScaleZ.toFixed(2));
  if(Sz == "") ;
  else if (Sz > ScaleZ) ScaleZ += 0.01;
  else if (Sz < ScaleZ) ScaleZ -= 0.01;
 
}
