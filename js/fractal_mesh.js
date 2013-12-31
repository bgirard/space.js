window.baseLOD = 0.04;
window.minLOD = 1.885e-8;
var SUBDIVIDE_DISTANCE_FACTOR = 10;
var SUBDIVIDE_FACTOR = 8;
var SUBDIVIDE_ANGLE_FACTOR = 8;
var TEXTURE_SIZE = 512;
var PIXELS_PER_TILE = 16;
function FractalMesh(getVector, deformations, options) {

  var self = this;
  options = options || {};
  self._options = options;
  self._isSubFractalMesh = options.isSubFractalMesh || false;
  self._startX = options.startX || 0;
  self._startY = options.startY || 0;
  self._endX = options.endX || 1;
  self._endY = options.endY || 1;
  self._step = options.step || window.baseLOD;
  self._color = options.color || "rgb(180,180,180)";
  self._deformations = deformations || [];

  // Default to sphere body
  self._getVector = options.getVector || function getVector(tx, ty, deformation) {
    // First build the vertice for (tx, ty)
    var circleX = Math.sin(tx*2*Math.PI)*Math.sin(ty*Math.PI);
    var circleY = Math.cos(tx*2*Math.PI)*Math.sin(ty*Math.PI);
    var circleZ = Math.sqrt(-(circleX*circleX+circleY*circleY-1));
    // We also want the negative solution for sqrt()
    if (ty >= 0.5) {
      circleZ = -circleZ;
    }
    // Multiply the vector by a deformation
    var mult = Math.EARTH_RADIUS * deformation;
    // And we're done
    var v = new THREE.Vector3(circleX * mult,
                              circleY * mult,
                              circleZ * mult);
    //insertPoint(self._points, tx, ty, v);
    return v;
  }

  this._mesh = self._buildMesh();
  return this;
};

FractalMesh.prototype._updateBottomRightConstraint = function() {
  return;
  var self = this;
  self._rightConstraint = [];
  var x = self._parts.length-1;
  for (var y = 0; y < self._parts[x].length; y++) {
    if (self._parts[x][y].face1.subdivided) {
      var submeshConstraint = self._parts[x][y].face1.subFractalMesh._rightConstraint;
      self._rightConstraint = self._rightConstraint.concat(submeshConstraint);
    } else {
      self._rightConstraint.push(self._parts[x][y]);
    }
  }
}

FractalMesh.prototype._getDeformation = function(deformations, tx, ty) {
  var totalDeforms = 0;
  for (var i = 0 ; i < deformations.length; i++) {
    // Sample at x-1,x,x+1 to avoid seems between tx=1 and tx=0
    totalDeforms += deformations[i].func(tx, ty);
    if (tx < 0.2) {
      totalDeforms += deformations[i].func(tx + 1, ty);
    }
    if (tx > 0.8) {
      totalDeforms += deformations[i].func(tx - 1, ty);
    }
  }
  // Apply gaussian at the pools to wrap neatly there
  return 1+totalDeforms;//*gaussian(ty);
}

FractalMesh.prototype._updateLeftConstraint = function(leftConstraint) {
  return;
  var self = this;
  this._currLeftConstraint = leftConstraint;
  var x = self._parts.length-1;
  for (var y = 0; y < self._parts[x].length; y++) {
    if (self._parts[x][y].face1.subdivided) {
      self._parts[x][y].face1.subFractalMesh._updateLeftConstraint(leftConstraint);
    } else {
    }
  }
}

FractalMesh.prototype._checkSubdivide = function() {
  // Iterate over every other face because each triangle pair is a quad
  var camVector = camera.position.clone();
  var changed = false;
  //camVector.applyMatrix4( matrix );
  for (var x = 0; x < this._parts.length; x++) {
    for (var y = 0; y < this._parts[x].length; y++) {
      var part = this._parts[x][y];
      var face = part.face1;
      // For now we use the top left to avoid object allocation
      var faceCenter = this._geom.vertices[face.center];
      var distanceToCam = faceCenter.distanceTo(camVector);
      var angleToCam = faceCenter.angleTo(camVector);
      var partChanged = false;
      if (distanceToCam < face.subdivideDistance &&
        Math.abs(angleToCam) < Math.abs(face.subdivideAngle)) {
        if (!face.subdivided) {
          this._subdivideFace(part.face1, part.face2);
          partChanged = true;
        }
        partChanged |= face.subFractalMesh._checkSubdivide();
      } else if (face.subdivided) {
        this._mergeFace(part.face1, part.face2);
        partChanged = true;
      }
      if (partChanged) {
        changed = true;
        // If we changed this part we need to update the right and bottom part
        if (x + 1 < this._parts.length && this._parts[x+1][y].face1.subdivided) {
          this._parts[x+1][y].face1.subFractalMesh._updateLeftConstraint(this._rightConstraint, this._bottomConstraint);
        } else if (y + 1 < this._parts[x].length && this._parts[x][y+1].face1.subdivided) {
          this._parts[x][y+1].face1.subFractalMesh._updateLeftConstraint(this._rightConstraint, this._bottomConstraint);
        }
      }
    }
  }
  return changed;
}

FractalMesh.prototype._subdivideFace = function(face1, face2) {
  var self = this;
  if (!face1.subdivided) {
    face1.olda = face1.a;
    face1.oldb = face1.b;
    face1.oldc = face1.c;
    face2.olda = face2.a;
    face2.oldb = face2.b;
    face2.oldc = face2.c;
  }
  face1.a = 0;
  face1.b = 0;
  face1.c = 0;
  face2.a = 0;
  face2.b = 0;
  face2.c = 0;
  face1.subdivided = true;
  this._geom.verticesNeedUpdate = true;

  face1.subFractalMesh = face1.subdivideFractalMesh();
  this._mesh.add(face1.subFractalMesh.getMesh());

  this._updateBottomRightConstraint();
}

FractalMesh.prototype._mergeFace = function(face1, face2) {
  var self = this;
  face1.a = face1.olda;
  face1.b = face1.oldb;
  face1.c = face1.oldc;
  face2.a = face2.olda;
  face2.b = face2.oldb;
  face2.c = face2.oldc;
  face1.subdivided = false;
  this._geom.verticesNeedUpdate = true;
  this._mesh.remove(face1.subFractalMesh.getMesh());
  face1.subFractalMesh = null;

  this._updateBottomRightConstraint();
}

FractalMesh.prototype._buildMesh = function() {
  var self = this;
  this._geom = this._buildGeom();
  //var material = new THREE.MeshPhongMaterial({ map: generateTexture()});
  //var material = new THREE.MeshPhongMaterial({ map: generateTexture()});
  var USE_NORMAL = false;
  if (USE_NORMAL) {
    var material    = new THREE.MeshNormalMaterial();
  } else {
    var material  = new THREE.MeshPhongMaterial();
    material.map   = this._generateTexture();
  }

  var meshmaterials = [material];
  //meshmaterials.push(new THREE.MeshBasicMaterial( { color: 0x405040, wireframe: true, opacity: 0.8, transparent: true } ));
  mesh = THREE.SceneUtils.createMultiMaterialObject(this._geom, meshmaterials);
  mesh.matrixAutoUpdate = false;
  mesh.name = "Unamed FractalMesh";
  mesh.ticks = mesh.ticks || [];
  mesh.ticks.push(function() {
    self._checkSubdivide();
  });
  this._material = material;
  this._meshmaterials = meshmaterials;
  return mesh;
}

FractalMesh.prototype._buildGeom = function() {
  var self = this;
  self._points = {};
  var step = self._step;

  self._partsCount = 0;
  for (var x = self._startX; x < self._endX - 1e-10; x+=step) {
    for (var y = self._startY; y < self._endY - 1e-10; y+=step) {
      self._partsCount++;
    }
  }

  self._textureWidth = idToTextureCoord(self._partsCount)[0] * PIXELS_PER_TILE + PIXELS_PER_TILE;
  self._textureHeight = TEXTURE_SIZE;
  function avgVector(v1, v2) {
    return new THREE.Vector3((v1.x + v2.x)/2,
                             (v1.y + v2.y)/2,
                             (v1.z + v2.z)/2);
  }

  function idToTextureCoord(id) {
    var tileCountPerRow = Math.floor(TEXTURE_SIZE / PIXELS_PER_TILE);
    var row = Math.floor(id / tileCountPerRow);
    var col = id % tileCountPerRow;
    return [row, col];
  }

  function generatePart(geom, adjustablePoints, faceX, faceY, currStep, deformations) {
    var start = geom.vertices.length;
    var newDeforms = [];
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
    var p1 = self._getVector(faceX, faceY, self._getDeformation(self._deformations, faceX, faceY));
    var p2 = self._getVector(faceX + currStep, faceY, self._getDeformation(self._deformations, faceX + currStep, faceY));
    var p3 = self._getVector(faceX, faceY + currStep, self._getDeformation(self._deformations, faceX, faceY + currStep));
    var p4 = self._getVector(faceX + currStep, faceY + currStep, self._getDeformation(self._deformations, faceX + currStep, faceY + currStep));
    var p5 = avgVector(p2, p3);

    geom.vertices.push(p1);
    geom.vertices.push(p2);
    geom.vertices.push(p3);
    geom.vertices.push(p4);
    // This point isn't in the 3D mesh but is used for subidividing.
    // This point will be modified along side the other verticles
    // when applyMatrix is called.
    geom.vertices.push(p5);

    var face1 = new THREE.Face3( start, start+1, start+2 );
    var face2 = new THREE.Face3( start+1, start+3, start+2 );
    geom.faces.push(face1);
    geom.faces.push(face2);

    var subdivideFace = face1;
    subdivideFace.center = start+4;
    subdivideFace.subdivideDistance = p2.distanceTo(p3) * SUBDIVIDE_DISTANCE_FACTOR;
    subdivideFace.subdivideAngle = p5.angleTo(p2) * SUBDIVIDE_ANGLE_FACTOR;
    subdivideFace.subdivideFractalMesh = function() {
      return new FractalMesh(self._getVector, newDeforms, {
        startX: faceX,
        startY: faceY,
        endX: faceX + step,  
        endY: faceY + step,  
        step: step / SUBDIVIDE_FACTOR,
        isSubFractalMesh: true,
        color: self._color,
      });
    }
    if (window.DEBUG_BUILD) {
      var debugInfo = {
        tx: faceX,
        ty: faceY,
      };
      face1.debugInfo = debugInfo;
      face2.debugInfo = debugInfo;
    }

    var textureTile = self._nextTextureTile++;
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
    var textureUVpixelCenterOffsetW = 0 / (TEXTURE_SIZE);
    var textureUVpixelCenterOffsetH = 0 / (TEXTURE_SIZE);
    var textureUVsizeW = 1 / (self._textureWidth / (PIXELS_PER_TILE));
    var textureUVsizeH = 1 / (self._textureHeight / (PIXELS_PER_TILE));
    var textureUVx = textureMapCoord[0] * textureUVsizeW + textureUVpixelCenterOffsetW;
    var textureUVy = 1 - textureMapCoord[1] * textureUVsizeH - textureUVpixelCenterOffsetH;
    var textureUVlenW = textureUVsizeW - 2*textureUVpixelCenterOffsetW;
    var textureUVlenH = textureUVsizeH - 2*textureUVpixelCenterOffsetH;
    geom.faceVertexUvs[0].push( [new THREE.Vector2(textureUVx, textureUVy), new THREE.Vector2(textureUVx + textureUVlenW, textureUVy), new THREE.Vector2(textureUVx, textureUVy - textureUVlenH)] );
    geom.faceVertexUvs[0].push( [new THREE.Vector2(textureUVx + textureUVlenW, textureUVy), new THREE.Vector2(textureUVx + textureUVlenW, textureUVy - textureUVlenH), new THREE.Vector2(textureUVx, textureUVy - textureUVlenH)] );

    var part = {
      face1: face1,
      face2: face2,
    };

    return part;
  }
  var geom = new THREE.Geometry();
  var adjustablePoints = {};
  self._nextTextureTile = 0;
  self._textureToSurfaceMap = [];
  self._parts = [];
  for (var x = self._startX; x < self._endX - 1e-10; x+=step) {
    self._parts.push([]);
    var currColumn = self._parts[self._parts.length-1];
    for (var y = self._startY; y < self._endY - 1e-10; y+=step) {
      var part = generatePart(geom, adjustablePoints, x, y, step, self._deformations);
      currColumn.push(part);
    }
  }
  geom.applyMatrix( new THREE.Matrix4().makeRotationX(-Math.PI/2) );
  geom.computeFaceNormals();
  return geom;
}

FractalMesh.prototype.getMesh = function() {
  return this._mesh;
}

FractalMesh.prototype.add = function(scene) {
  scene.add(this._mesh);
};

FractalMesh.prototype._generateTexture = function() {
  var self = this;
  if (self._textureCanvas == null) {
    self._textureCanvas = document.createElement("canvas");
    self._textureCanvas.style.position = "absolute";
    self._textureCanvas.style.top = "5px";
    self._textureCanvas.style.left = "5px";
    self._textureCanvas.width = self._textureWidth;
    self._textureCanvas.height = self._textureHeight;
    var SHOW_CANVAS = false;
    if (SHOW_CANVAS) {
      self._textureCanvas.style.width = self._textureWidth/2 +"px";
      self._textureCanvas.style.height = self._textureHeight/2 + "px";
      document.body.appendChild(self._textureCanvas);
    }
  }
  var canvas = self._textureCanvas;
  var ctxt = canvas.getContext("2d");
  ctxt.fillStyle = this._color;
  ctxt.fillRect(0,0,self._textureWidth,self._textureHeight);
  // If we draw something without a color lets draw in pink

  for (var i = 0; i < self._textureToSurfaceMap.length; i++) {
    var tileInfo = self._textureToSurfaceMap[i];
    var startX = Math.round(tileInfo.textureX);
    var lenX = Math.round(tileInfo.textureS);
    var startY = Math.round(tileInfo.textureY);
    var lenY = Math.round(tileInfo.textureS);

    // Build tile clip
    ctxt.save();
    ctxt.beginPath();
    ctxt.rect(startX, startY, lenX, lenY);
    ctxt.clip();
    ctxt.fillStyle = this._color;
    if (tileInfo.x == 0.6 && tileInfo.y == 0.6) {
    }
    ctxt.fillRect(0,0,self._textureWidth,self._textureHeight);

    ctxt.translate(startX, startY);
    ctxt.scale(lenX / tileInfo.s, lenY / tileInfo.s);
    ctxt.translate(-tileInfo.x, -tileInfo.y);
    ctxt.fillStyle = "rgb(255,0,255)";
    if (tileInfo.x == 0.6 && tileInfo.y == 0.6) {
      ctxt.fillStyle = "green";
      ctxt.fillRect(tileInfo.x, tileInfo.y, tileInfo.s, tileInfo.s);
    }
    for (var j = 0; j < self._deformations.length; j++) {
    //for (var j = 0; j < 1; j++) {
      var deformation = self._deformations[j];
      if (deformation.paint) {
        deformation.paint(ctxt);
      }
    }

    ctxt.restore();
    if (tileInfo.x == 0.6 && tileInfo.y == 0.6) {
      ctxt.fillStyle = "rgb(0,0,0)";
      //ctxt.strokeRect(startX+1, startY+1, lenX-2, lenY-2);
      ctxt.strokeRect(startX+1 + 0.5, startY+1 + 0.5, lenX-2 -1, lenY-2-1);
    }
  }

  self._texture = new THREE.Texture(self._textureCanvas);
  self._texture.needsUpdate = true;
  self._texture.magFilter = THREE.NearestFilter;
  self._texture.minFilter = THREE.NearestFilter;
  return self._texture;
};

FractalMesh.prototype.updateGeom = function(scene) {
};


