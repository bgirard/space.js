window.baseLOD = 0.02;
window.minLOD = 1.885e-7;

function Planetoid(deformations) {

  var self = this;

  function subdivide(vector, step) {
    //    x      y
    //  1.5e-7  1.9e-7
    //    1      0.2
    vector.applyMatrix4( new THREE.Matrix4().makeRotationX(-Math.PI/2) );
    var viewVector = camera.position.clone();
    viewVector.z = 1;
    if (window.baseLOD*viewVector.distanceTo(vector)+window.minLOD < step) {
      return true;
    } else {
      return false;
    }
  }

  this.generateTexture = function generateTexture(deformations) {
    if (self._textureCanvas == null) {
      self._textureCanvas = document.createElement("canvas");
      self._textureCanvas.style.position = "absolute";
      self._textureCanvas.style.top = "0px";
      self._textureCanvas.width = 1024;
      self._textureCanvas.height = 1024;
    }
    var canvas = self._textureCanvas;
    var ctxt = canvas.getContext("2d");
    ctxt.fillStyle = "rgb(255,245,170)";
    //ctxt.fillRect(0,0,1500,1000);

    window.seed = 0;
    var simplex = new SimplexNoise(random);
    var imgdata = ctxt.getImageData(0, 0, canvas.width, canvas.height);
    var pixels = imgdata.data;
    var t = (new Date()).getTime() / 2000;
    for (var y = 0; y < canvas.height; y++) {
      for (var x = 0; x < canvas.width; x++) {
        var b = simplex.noise3D(x / 10, y / 10, t);
        pixels[(x + y * canvas.width) * 4 + 0] = 255;
        pixels[(x + y * canvas.width) * 4 + 1] = 245 + (255 - 245) * b;
        pixels[(x + y * canvas.width) * 4 + 2] = 170 + (255 - 170) * b;
        pixels[(x + y * canvas.width) * 4 + 3] = 255;
      }
    }
    ctxt.putImageData(imgdata, 0, 0);

    self._texture = new THREE.Texture(self._textureCanvas);
    self._texture.needsUpdate = true;
    return self._texture;
  }

  function interpolateExact(pointsLookup, getVector, tx, ty) {
    // Either we match a point exactly
    var exactPoint = lookup(pointsLookup, tx, ty);
    if (exactPoint) {
      return exactPoint;
    }
    return getVector(tx, ty);
  }

  function avgVector(v1, v2) {
    return new THREE.Vector3((v1.x + v2.x)/2,
                             (v1.y + v2.y)/2,
                             (v1.z + v2.z)/2);
  }

  function interpolate(pointsLookup, getVector, tx, ty, stepX, stepY) {
    // Either we match a point exactly
    var exactPoint = lookup(pointsLookup, tx, ty);
    if (exactPoint) {
      return exactPoint;
    }
    // Or we are a subdivision of the nearby face. Then we average out the nearby face
    var p1 = interpolateExact(pointsLookup, getVector, tx - stepX, ty - stepY);
    var p2 = interpolateExact(pointsLookup, getVector, tx + stepX, ty + stepY);
    var newP = avgVector(p1, p2);
    insertPoint(pointsLookup, tx, ty, newP);
    return newP;
  }

  function interpolateOnX(pointsLookup, getVector, tx, ty, step) {
    return interpolate(pointsLookup, getVector, tx, ty, step, 0);
  }

  function interpolateOnY(pointsLookup, getVector, tx, ty, step) {
    return interpolate(pointsLookup, getVector, tx, ty, 0, step);
  }

  function lookup(pointsLookup, tx, ty) {
    tx = tx.toPrecision(10);
    ty = ty.toPrecision(10);
    if (pointsLookup[tx] != null && pointsLookup[tx][ty] != null) {
      return pointsLookup[tx][ty].clone();
    }
    return null;
  }

  function insertPoint(pointsLookup, tx, ty, point) {
    tx = tx.toPrecision(10);
    ty = ty.toPrecision(10);
    if (pointsLookup[tx] == null) {
      pointsLookup[tx] = {};
    }
    pointsLookup[tx][ty] = point.clone();
  }

  function addAdjustablePoint(adjustablePoints, tx, ty, point) {
    tx = tx.toPrecision(10);
    ty = ty.toPrecision(10);
    if (adjustablePoints[tx] == null) {
      adjustablePoints[tx] = {};
    }
    if (adjustablePoints[tx][ty] == null) {
      adjustablePoints[tx][ty] = []
    }
    adjustablePoints[tx][ty].push(point);
  }

  function adjustPoint(adjustablePoints, tx, ty, p1, p2) {
    tx = tx.toPrecision(10);
    ty = ty.toPrecision(10);
    if (adjustablePoints[tx] == null || adjustablePoints[tx][ty] == null) {
      return false;
    }
    var pointArray = adjustablePoints[tx][ty];
    var point = avgVector(p1, p2);
    for (var i = 0; i < pointArray.length; i++) {
      pointArray[i].set(point.x, point.y, point.z);
    }
    return true;
  }

  function buildGeom() {
    var step = window.baseLOD;
    var planet = new THREE.Geometry();
    var points = {};
    var adjustablePoints = {};
    for (var x = 0; x < 1; x+=step) {
      for (var y = 0; y < 1; y+=step) {
        function generateFace(faceX, faceY, currStep, deformations) {
          var start = planet.vertices.length;
          var newDeforms = null;
          for (var i = 0; i < deformations.length; i++) {
            var bounds = deformations[i].bounds();
            if (bounds[0] > faceX + currStep ||
                bounds[2] < faceX ||
                bounds[1] > faceY + currStep ||
                bounds[3] < faceY) {
              if (newDeforms == null) {
                newDeforms = deformations.slice(0, i);
              }
            } else if (newDeforms) {
              newDeforms.push(deformations[i]);
            }
          }
          if (newDeforms) {
            deformations = newDeforms;
          }
          function getDeformation(deformations, tx, ty) {
            var totalDeforms = 0;
            for (var i = 0 ; i < deformations.length; i++) {
              var f = deformations[i].func;
              // Sample at x-1,x,x+1 to avoid seems between tx=1 and tx=0
              totalDeforms += f(tx, ty);
              if (tx < 0.2) {
                totalDeforms += f(tx + 1, ty);
              }
              if (tx > 0.8) {
                totalDeforms += f(tx - 1, ty);
              }
            }
            // Apply gaussian at the pools to wrap neatly there
            return 1+totalDeforms;//*gaussian(ty);
          }
          function getVector(tx, ty) {
            // First build the vertice for (tx, ty)
            var circleX = Math.sin(tx*2*Math.PI)*Math.sin(ty*Math.PI);
            var circleY = Math.cos(tx*2*Math.PI)*Math.sin(ty*Math.PI);
            var circleZ = Math.sqrt(-(circleX*circleX+circleY*circleY-1));
            // We also want the negative solution for sqrt()
            if (ty >= 0.5) {
              circleZ = -circleZ;
            }
            // Multiply the vector by a deformation
            var mult = getDeformation(deformations, tx, ty);
            // And we're done
            var v = new THREE.Vector3(circleX * mult,
                                      circleY * mult,
                                      circleZ * mult);
            insertPoint(points, tx, ty, v);
            return v;
          }
          var subStep = currStep*0.5;
          if (subdivide(getVector(faceX + subStep, faceY + subStep), currStep)) {
            generateFace(faceX, faceY, subStep, deformations);
            generateFace(faceX+subStep, faceY, subStep, deformations);
            generateFace(faceX, faceY+subStep, subStep, deformations);
            generateFace(faceX+subStep, faceY+subStep, subStep, deformations);
            return;
          }

          var p1 = interpolateExact(points, getVector, faceX, faceY);
          var p2 = interpolateOnX(points, getVector, faceX + currStep, faceY, currStep);
          var p3 = interpolateOnY(points, getVector, faceX, faceY + currStep, currStep);
          var p4 = getVector(faceX + currStep, faceY + currStep);

          adjustPoint(adjustablePoints, faceX, faceY + subStep, p1, p3);
          adjustPoint(adjustablePoints, faceX + subStep, faceY, p1, p2);

          planet.vertices.push(p1);
          planet.vertices.push(p2);
          planet.vertices.push(p3);
          planet.vertices.push(p4);

          addAdjustablePoint(adjustablePoints, faceX + currStep, faceY, p2);
          addAdjustablePoint(adjustablePoints, faceX, faceY + currStep, p3);
          addAdjustablePoint(adjustablePoints, faceX + currStep, faceY + currStep, p4);

          planet.faces.push(new THREE.Face3( start, start+1, start+2 ));
          planet.faceVertexUvs[0].push( [new THREE.Vector2(faceX, faceY), new THREE.Vector2(faceX + currStep, faceY), new THREE.Vector2(faceX, faceY + currStep)] );
          planet.faces.push(new THREE.Face3( start+1, start+3, start+2 ));
          planet.faceVertexUvs[0].push( [new THREE.Vector2(faceX + currStep, faceY), new THREE.Vector2(faceX + currStep, faceY + currStep), new THREE.Vector2(faceX, faceY + currStep)] );
        }
        var subStep = step;
        for (var subX = 0; subX < step; subX+=subStep) {
          for (var subY = 0; subY < step; subY+=subStep) {
            generateFace(x + subX, y + subY, subStep, deformations);
          }
        }
      }
    }
    planet.applyMatrix( new THREE.Matrix4().makeRotationX(-Math.PI/2) );
    planet.computeFaceNormals();
    document.title = planet.vertices.length + " Zoom: " + toMetersStr(camera.position.z-1);
    return planet;
  }
  
  var planet = buildGeom();
  var geometry = planet;//   = new THREE.TorusGeometry( 1, 0.42 );
  //var material    = new THREE.MeshNormalMaterial();
  //var material = new THREE.MeshPhongMaterial({ map: generateTexture()});
  //var material = new THREE.MeshPhongMaterial({ map: generateTexture()});
  var material  = new THREE.MeshBasicMaterial();
  material.map   = THREE.ImageUtils.loadTexture("images/sunmap.jpg");
  material.map   = this.generateTexture(); //THREE.ImageUtils.loadTexture("images/sunmap.jpg");
  var mesh    = new THREE.Mesh( geometry, material );

  this._geom = geometry;
  this._material = material;
  this._mesh = mesh;
  this._buildGeom = buildGeom;
  return this;
};

Planetoid.prototype.getMesh = function() {
  return this._mesh;
};

Planetoid.prototype.add = function(scene) {
  scene.add(this._mesh);
};

Planetoid.prototype.remove = function(scene) {
  scene.remove(this._mesh);
};

Planetoid.prototype.updateTexture = function(scene) {
  this._material.map = this.generateTexture();
};

Planetoid.prototype.updateGeom = function(scene) {
  scene.remove(this._mesh);

  this._geom = this._buildGeom(); 
  this._material.map = this.generateTexture();
  this._mesh = new THREE.Mesh( this._geom, this._material );
  scene.add(this._mesh);
};
