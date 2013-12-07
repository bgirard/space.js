function Planetoid(deformations) {
  var step = 0.02;

  function subdivide(vector, step) {
    //    x      y
    //  1.5e-7  1.9e-7
    //    1      0.2
    vector.applyMatrix4( new THREE.Matrix4().makeRotationX(-Math.PI/2) );
    if (0.02*camera.position.distanceTo(vector)+1.885e-7 < step) {
      return true;
    } else {
      return false;
    }
  }

  function generateTexture() {

  }

  function buildGeom() {
    var planet = new THREE.Geometry();
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
            return new THREE.Vector3(circleX * mult,
                                     circleY * mult,
                                     circleZ * mult);
          }
          var subStep = currStep/2;
          if (subdivide(getVector(faceX + subStep, faceY + subStep), currStep)) {
            generateFace(faceX, faceY, subStep, deformations);
            generateFace(faceX+subStep, faceY, subStep, deformations);
            generateFace(faceX, faceY+subStep, subStep, deformations);
            generateFace(faceX+subStep, faceY+subStep, subStep, deformations);
            return;
          }
          planet.vertices.push(getVector(faceX           , faceY           ));
          planet.vertices.push(getVector(faceX + currStep, faceY           ));
          planet.vertices.push(getVector(faceX           , faceY + currStep));
          planet.vertices.push(getVector(faceX + currStep, faceY + currStep));
          planet.faces.push(new THREE.Face3( start, start+1, start+2 ));
          planet.faces.push(new THREE.Face3( start+1, start+3, start+2 ));
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
  var material    = new THREE.MeshNormalMaterial();
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

Planetoid.prototype.updateGeom = function(scene) {
  scene.remove(this._mesh);

  this._geom = this._buildGeom(); 
  this._mesh = new THREE.Mesh( this._geom, this._material );
  scene.add(this._mesh);
};
