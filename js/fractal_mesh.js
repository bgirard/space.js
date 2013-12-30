function FractalMesh(getVector, deformations, options) {

  var self = this;
  options = options || {};
  self._options = options;
  self._startX = options.startX || 0;
  self._startY = options.startY || 0;
  self._endX = options.endX || 1;
  self._endY = options.endY || 1;
  self._step = options.step || window.baseLOD;
  self._deformations = deformations;

  // Default to sphere body
  self._getVector = getVector || function getVector(tx, ty) {
    // First build the vertice for (tx, ty)
    var circleX = Math.sin(tx*2*Math.PI)*Math.sin(ty*Math.PI);
    var circleY = Math.cos(tx*2*Math.PI)*Math.sin(ty*Math.PI);
    var circleZ = Math.sqrt(-(circleX*circleX+circleY*circleY-1));
    // We also want the negative solution for sqrt()
    if (ty >= 0.5) {
      circleZ = -circleZ;
    }
    // Multiply the vector by a deformation
    var mult = 1;//getDeformation(deformations, tx, ty);
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

FractalMesh.prototype._checkSubdivide = function() {
  // Iterate over every other face because each triangle pair is a quad
  var camVector = camera.position.clone();
  //camVector.applyMatrix4( matrix );
  for (var i = 0; i < this._geom.faces.length; i+=2) {
    var face = this._geom.faces[i];
    // For now we use the top left to avoid object allocation
    var faceCenter = this._geom.vertices[face.center];
    var distanceToCam = faceCenter.distanceTo(camVector);
    if (distanceToCam < face.subdivideDistance) {
      if (!face.subdivided) {
        this._subdivideFace(face, this._geom.faces[i+1]);
      }
    } else if (face.subdivided) {
      this._mergeFace(face, this._geom.faces[i+1]);
    }
  }
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
}

FractalMesh.prototype._buildMesh = function() {
  var self = this;
  this._geom = this._buildGeom();
  //var material = new THREE.MeshPhongMaterial({ map: generateTexture()});
  //var material = new THREE.MeshPhongMaterial({ map: generateTexture()});
  var material  = new THREE.MeshBasicMaterial();
  //material.map   = THREE.ImageUtils.loadTexture("images/sunmap.jpg");
  //material.map   = this.generateTexture(); //THREE.ImageUtils.loadTexture("images/sunmap.jpg");
  //material.map   = this.generateTexture(); //THREE.ImageUtils.loadTexture("images/sunmap.jpg");
  var material    = new THREE.MeshNormalMaterial();

  var meshmaterials = [material];
  meshmaterials.push(new THREE.MeshBasicMaterial( { color: 0x405040, wireframe: true, opacity: 0.8, transparent: true } ));
  mesh = THREE.SceneUtils.createMultiMaterialObject(this._geom, meshmaterials);
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

  function avgVector(v1, v2) {
    return new THREE.Vector3((v1.x + v2.x)/2,
                             (v1.y + v2.y)/2,
                             (v1.z + v2.z)/2);
  }

  function idToTextureCoord(id) {
    id = id;
    var tileCountPerRow = Math.floor(TEXTURE_SIZE / PIXELS_PER_TILE);
    var row = Math.floor(id / tileCountPerRow);
    var col = id % tileCountPerRow;
    return [row, col];
  }

  function generateFace(geom, adjustablePoints, faceX, faceY, currStep, deformations) {
    var start = geom.vertices.length;
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
    var p1 = self._getVector(faceX, faceY);
    var p2 = self._getVector(faceX + currStep, faceY);
    var p3 = self._getVector(faceX, faceY + currStep);
    var p4 = self._getVector(faceX + currStep, faceY + currStep);

    geom.vertices.push(p1);
    geom.vertices.push(p2);
    geom.vertices.push(p3);
    geom.vertices.push(p4);

    var face1 = new THREE.Face3( start, start+1, start+2 );
    var face2 = new THREE.Face3( start+1, start+3, start+2 );
    geom.faces.push(face1);
    geom.faces.push(face2);

    var subdivideFace = face1;
    subdivideFace.center = face1.a;
    subdivideFace.subdivideDistance = p2.distanceTo(p3) * 2;
    subdivideFace.subdivideFractalMesh = function() {
      return new FractalMesh(self._getVector, self._deformations, {
        startX: faceX,
        startY: faceY,
        endX: faceX + step,  
        endY: faceY + step,  
        step: step / 2,
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

    var useTextureTile = true;
    if (useTextureTile) {
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
      var textureUVsize = 1 / (TEXTURE_SIZE / (PIXELS_PER_TILE));
      var textureUVx = textureMapCoord[0] * textureUVsize + textureUVpixelCenterOffset;
      var textureUVy = 1 - textureMapCoord[1] * textureUVsize - textureUVpixelCenterOffset;
      var textureUVlen = textureUVsize - 2*textureUVpixelCenterOffset
      geom.faceVertexUvs[0].push( [new THREE.Vector2(textureUVx, textureUVy), new THREE.Vector2(textureUVx + textureUVlen, textureUVy), new THREE.Vector2(textureUVx, textureUVy - textureUVlen)] );
      geom.faceVertexUvs[0].push( [new THREE.Vector2(textureUVx + textureUVlen, textureUVy), new THREE.Vector2(textureUVx + textureUVlen, textureUVy - textureUVlen), new THREE.Vector2(textureUVx, textureUVy - textureUVlen)] );
    } else {
      geom.faceVertexUvs[0].push( [new THREE.Vector2(faceX, faceY), new THREE.Vector2(faceX + currStep, faceY), new THREE.Vector2(faceX, faceY + currStep)] );
      geom.faceVertexUvs[0].push( [new THREE.Vector2(faceX + currStep, faceY), new THREE.Vector2(faceX + currStep, faceY + currStep), new THREE.Vector2(faceX, faceY + currStep)] );
    }
  }
  var step = self._step;
  var geom = new THREE.Geometry();
  var adjustablePoints = {};
  self._nextTextureTile = 0;
  self._textureToSurfaceMap = [];
  for (var x = self._startX; x < self._endX - 1e-10; x+=step) {
    for (var y = self._startY; y < self._endY - 1e-10; y+=step) {
      generateFace(geom, adjustablePoints, x, y, step, self._deformations);
    }
  }
  geom.applyMatrix( new THREE.Matrix4().makeRotationX(-Math.PI/2) );
  geom.computeFaceNormals();
  document.title = geom.vertices.length + " Zoom: " + toMetersStr(camera.position.z-1);
  return geom;
}

FractalMesh.prototype.getMesh = function() {
  return this._mesh;
}

FractalMesh.prototype.add = function(scene) {
  scene.add(this._mesh);
};

FractalMesh.prototype.updateTexture = function(scene) {
};

FractalMesh.prototype.updateGeom = function(scene) {
};


