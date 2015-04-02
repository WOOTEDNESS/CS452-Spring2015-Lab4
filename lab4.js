/*
	Kevin John Hemstreet-Grimmer
	lab 4 april 2 2014
*/
var gl;
var program;
var points = [];
var normalsArray = [];
var axis = 0;//creates flexability for  axis choice;
var xAxis = 0;
var yAxis = 1;
var numVeritces = 36;
var modelView, proj;
var dir = 1.0;
var eye;
var flag = false;

//texture variables
var texVertArray = [];
var texture;

var texVertices = [
	vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
    ];

//lighitng variables
var lightPosition = vec4(1.0, 1.0, 1.0, 0.0 );
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 1.0, 1.0, 1.0);
var materialSpecular = vec4( 0.8, 0.8, 0.8, 1.0 );
var materialShininess = 500.0;
var ambientColor, diffuseColor, specularColor;

var theta = [0,0,0];
var thetaLoc;

var vertices = [
    vec4( -0.5, -0.5,  0.5, 1.0 ),//0
    vec4( -0.0,  0.5,  0.0, 1.0 ),//1
    vec4( 0.0,  0.5,  0.0, 1.0 ),//2
    vec4( 0.5, -0.5,  0.5, 1.0 ),//3
    vec4( -0.5, -0.5, -0.5, 1.0 ),//4
    vec4( -0.0,  0.5, -0.0, 1.0 ),//5
    vec4( 0.0,  0.5, -0.0, 1.0 ),//6
    vec4( 0.5, -0.5, -0.5, 1.0 )//7
];

window.onload = function init()
{
	var canvas = document.getElementById( "gl-canvas" );
	gl = WebGLUtils.setupWebGL( canvas );
	if ( !gl ) { alert( "WebGL isn't available" ); }
	//
	// Configure WebGL
	//
	gl.viewport( 0, 0, canvas.width, canvas.height );
	gl.clearColor( 0.7, 0.7, 0.7, 1.0 );
	gl.enable(gl.DEPTH_TEST);
	// Load shaders and initialize attribute buffers
	program = initShaders( gl, "vertex-shader", "fragment-shader" );
	gl.useProgram(program);
	
	colorShape();


	//eye and proj
	eye = vec3(5.0,5.0,0.0);// placement of the eye 
	proj = ortho(-1, 1, -1, 1, -100, 100);

	//
	// Load the data into the GPU
	//

	//normals vector buffer
	var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );
	//poistions buffer
	var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
	var vPosition = gl.getAttribLocation( program, "vPosition" );
	gl.vertexAttribPointer( vPosition, 4 , gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray(vPosition);

	//
	// Texture Buffers
	//
	var tBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
	gl.bufferData(gl.ARRAY_BUFFER,flatten(texVertArray), gl.STATIC_DRAW);
	var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
	gl.vertexAttribPointer(vTexCoord,2,gl.FLOAT,false,0,0);
	gl.enableVertexAttribArray(vTexCoord);
	//
	// Initalize Texture
    //
	var texImage = document.getElementById("img");

	createTexture(texImage);

	//lighting calcs
	ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);
    //lighting asscosiation
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct) );	
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition) );
    gl.uniform1f(gl.getUniformLocation(program, "shininess"),materialShininess);

    document.getElementById("button").onclick = function(){flag = !flag;};

	document.onkeydown = function(event) { HandleKeys(event);};

	gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct) );	
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition) );
    gl.uniform1f(gl.getUniformLocation(program, "shininess"),materialShininess);
    
	gl.uniformMatrix4fv( gl.getUniformLocation(program, "proj"),false,flatten(proj));

	render();
};
function createTexture(texImage) {
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, texImage);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
}


function colorShape()//mimics colorcube
{
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}

function quad(a, b, c, d) {
    //normals
    var t1 = subtract(vertices[b], vertices[a]);
    var t2 = subtract(vertices[c], vertices[b]);
    var normal = cross(t1, t2);
    var normal = vec3(normal);

    //push vertices
    points.push(vertices[a]);
    normalsArray.push(normal);
    texVertArray.push(texVertices[0]);

    points.push(vertices[b]);
    normalsArray.push(normal);
    texVertArray.push(texVertices[1]);

    points.push(vertices[c]);
    normalsArray.push(normal);
    texVertArray.push(texVertices[2]);

    points.push(vertices[a]);
    normalsArray.push(normal);
    texVertArray.push(texVertices[0]);

    points.push(vertices[c]);
    normalsArray.push(normal);
    texVertArray.push(texVertices[2]);

    points.push(vertices[d]);
    normalsArray.push(normal);
    texVertArray.push(texVertices[3]);
}


function HandleKeys(event) {
    if (event.keyCode == 37)//left arrow key
    {
        axis = yAxis;
        dir = 1;
        console.log("left arrow pressed")

    }
    else if (event.keyCode == 39)//right arrow key
    {
        axis = yAxis;
        dir = -1;
        console.log("right arrow pressed")

    }
    else if (event.keyCode == 38)//up arrow key
    {
        axis = xAxis;
        dir = 1;
        console.log("up arrow pressed")

    }
    else if (event.keyCode == 40)//down arrow key
    {
        axis = xAxis;
        dir = -1;
        console.log("down arrow pressed")

    }
}


function render()
{
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	//changes direction of rotation
	if(flag)
	{
		theta[axis] += 1.5 * dir;
	} 
	gl.uniform3fv(thetaLoc, theta);

	//rotationy stuff
	modelView = mat4();
	modelView = mult(modelView, rotate(theta[xAxis], [1,0,0]));
	modelView = mult(modelView, rotate(theta[yAxis], [0,1,0]));

	gl.uniformMatrix4fv(gl.getUniformLocation(program,"modelView"), false, flatten(modelView) );
	
	gl.drawArrays(gl.TRIANGLES, 0 ,numVeritces);

	requestAnimFrame(render);
}




