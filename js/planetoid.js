window.baseLOD = 0.10;
window.minLOD = 1.885e-8;
var TEXTURE_SIZE = 512;
var PIXELS_PER_TILE = 16;

function Planetoid(deformations) {

  var self = this;

  function subdivide(vector, step) {
    //    x      y
    //  1.5e-7  1.9e-7
    //    1      0.2
    vector.applyMatrix4( new THREE.Matrix4().makeRotationX(-Math.PI/2) );
    var view = new THREE.Object3D();
    view.position = camera.position.clone();
    view.lookAt(0,0,0);
    var viewVector = view.position;
    if (window.baseLOD*viewVector.distanceTo(vector)+window.minLOD < step) {
      return true;
    } else {
      return false;
    }
  }

  self._textureToSurfaceMap = [];
  this.generateTexture = function generateTexture(deformations) {
    if (self._textureCanvas == null) {
      self._textureCanvas = document.createElement("canvas");
      self._textureCanvas.style.position = "absolute";
      self._textureCanvas.style.top = "5px";
      self._textureCanvas.style.left = "5px";
      self._textureCanvas.width = TEXTURE_SIZE;
      self._textureCanvas.height = TEXTURE_SIZE;
      //document.body.appendChild(self._textureCanvas);
    }
    var canvas = self._textureCanvas;
    var ctxt = canvas.getContext("2d");
    ctxt.fillStyle = "rgb(255,0,255)";
    ctxt.fillRect(0,0,1000,1000);

    window.seed = 0;
    var simplex = new SimplexNoise(random);
    var imgdata = ctxt.getImageData(0, 0, canvas.width, canvas.height);
    var pixels = imgdata.data;
    var t = (new Date()).getTime() / 2000;
    if (self._textureToSurfaceMap.length == 0) {
      for (var y = 0; y < canvas.height; y++) {
        for (var x = 0; x < canvas.width; x++) {
          var b = simplex.noise3D(x / 10, y / 10, t);
          pixels[(x + y * canvas.width) * 4 + 0] = 255;
          pixels[(x + y * canvas.width) * 4 + 1] = 245 + (255 - 245) * b;
          pixels[(x + y * canvas.width) * 4 + 2] = 170 + (255 - 170) * b;
          pixels[(x + y * canvas.width) * 4 + 3] = 255;
        }
      }
    } else {
      for (var i = 0; i < self._textureToSurfaceMap.length; i++) {
        var tileInfo = self._textureToSurfaceMap[i];
        var startX = Math.round(tileInfo.textureX);
        var endX = Math.round(tileInfo.textureX + tileInfo.textureS);
        var startY = Math.round(tileInfo.textureY);
        var endY = Math.round(tileInfo.textureY + tileInfo.textureS);
        for (var y = startY; y < endY; y++) {
          for (var x = startX; x < endX; x++) {
            if (startX >= canvas.width) continue;
            // NOTE: We use 1 pixel less on each side for filtering
            var tx = tileInfo.x + (x-startX-1) / (endX - 2 - startX) * (tileInfo.s);
            var ty = tileInfo.y + (y-startY-1) / (endY - 2 - startY) * (tileInfo.s);
            var b = simplex.noise3D(tx*1024*1024*1024, ty*1024*1024*1024, t);
            //b = Math.sin(tx*40)/0.5+0.5 + Math.cos(ty*40)/0.5+0.5;
            pixels[(x + y * canvas.width) * 4 + 0] = 255;
            pixels[(x + y * canvas.width) * 4 + 1] = 245 + (255 - 245) * b;
            pixels[(x + y * canvas.width) * 4 + 2] = 170 + (255 - 170) * b;
            pixels[(x + y * canvas.width) * 4 + 3] = 255;
            var DEBUG_BORDERS = false;
            if (DEBUG_BORDERS) {
              if (x == startX || y == startY || x == endX - 1 || y == endY - 1) {
                pixels[(x + y * canvas.width) * 4 + 0] = 0;
                pixels[(x + y * canvas.width) * 4 + 1] = 0;
                pixels[(x + y * canvas.width) * 4 + 2] = 0;
                pixels[(x + y * canvas.width) * 4 + 3] = 255;
              }
            }
          }
        }
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

  function idToTextureCoord(id) {
    id = id;
    var tileCountPerRow = Math.floor(TEXTURE_SIZE / PIXELS_PER_TILE);
    var row = Math.floor(id / tileCountPerRow);
    var col = id % tileCountPerRow;
    return [row, col];
  }

  function buildGeom() {
    var step = window.baseLOD;
    var planet = new THREE.Geometry();
    var points = {};
    var adjustablePoints = {};
    var nextTextureTile = 0;
    self._textureToSurfaceMap = [];
    for (var x = 0; x < 1 - 1e-10; x+=step) {
      for (var y = 0; y < 1 - 1e-10; y+=step) {
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
          //if (faceX > 0.5) return;
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

          var face1 = new THREE.Face3( start, start+1, start+2 );
          var face2 = new THREE.Face3( start+1, start+3, start+2 );
          planet.faces.push(face1);
          planet.faces.push(face2);
          if (window.DEBUG_BUILD) {
            var debugInfo = {
              tx: faceX,
              ty: faceY,
            };
            face1.debugInfo = debugInfo;
            face2.debugInfo = debugInfo;
          }

          var useTextureTile = true;
          if (useTextureTile) {
            var textureTile = nextTextureTile++;
            var textureMapCoord = idToTextureCoord(textureTile);
            self._textureToSurfaceMap.push({
              x: faceX,
              y: faceY,
              s: currStep,
              textureX: textureMapCoord[0] * PIXELS_PER_TILE,
              textureY: textureMapCoord[1] * PIXELS_PER_TILE,
              textureS: PIXELS_PER_TILE,
            });
            // Align to pixel centers
            var textureUVpixelCenterOffset = 1 / (TEXTURE_SIZE);
            var textureUVsize = 1 / (TEXTURE_SIZE / (PIXELS_PER_TILE));
            var textureUVx = textureMapCoord[0] * textureUVsize + textureUVpixelCenterOffset;
            var textureUVy = 1 - textureMapCoord[1] * textureUVsize - textureUVpixelCenterOffset;
            var textureUVlen = textureUVsize - 2*textureUVpixelCenterOffset
            planet.faceVertexUvs[0].push( [new THREE.Vector2(textureUVx, textureUVy), new THREE.Vector2(textureUVx + textureUVlen, textureUVy), new THREE.Vector2(textureUVx, textureUVy - textureUVlen)] );
            planet.faceVertexUvs[0].push( [new THREE.Vector2(textureUVx + textureUVlen, textureUVy), new THREE.Vector2(textureUVx + textureUVlen, textureUVy - textureUVlen), new THREE.Vector2(textureUVx, textureUVy - textureUVlen)] );
            //planet.faceVertexUvs[0].push( [new THREE.Vector2(textureUVx, textureUVy), new THREE.Vector2(textureUVx + textureUVs, textureUVy), new THREE.Vector2(textureUVx, textureUVy - textureUVs)] );
            //planet.faceVertexUvs[0].push( [new THREE.Vector2(textureUVx + textureUVs, textureUVy), new THREE.Vector2(textureUVx + textureUVs, textureUVy - textureUVs), new THREE.Vector2(textureUVx, textureUVy - textureUVs)] );
          } else {
            planet.faceVertexUvs[0].push( [new THREE.Vector2(faceX, faceY), new THREE.Vector2(faceX + currStep, faceY), new THREE.Vector2(faceX, faceY + currStep)] );
            planet.faceVertexUvs[0].push( [new THREE.Vector2(faceX + currStep, faceY), new THREE.Vector2(faceX + currStep, faceY + currStep), new THREE.Vector2(faceX, faceY + currStep)] );
          }
        }
        generateFace(x, y, step, deformations);
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

  var meshmaterials = [material, new THREE.MeshBasicMaterial( { color: 0x405040, wireframe: true, opacity: 0.8, transparent: true } )];
  mesh = THREE.SceneUtils.createMultiMaterialObject(geometry, meshmaterials);
  mesh.name = "Unamed planetoid";

  this._geom = geometry;
  this._material = material;
  this._mesh = mesh;
  this._buildGeom = buildGeom;
  this._meshmaterials = meshmaterials;
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

  this._mesh = THREE.SceneUtils.createMultiMaterialObject(this._geom, this._meshmaterials);
  scene.add(this._mesh);
};
