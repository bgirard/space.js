function DebugPanel(container) {
  var self = this;
  this._div = document.createElement("div");
  this._div.className = "debug_panel";
  container.appendChild(this._div);


  function createPlanetoidSection(sectionParent) {
    var seed = 100;
    var craters = 0;

    createElement("h3", {
      innerHTML: "<u><center>Planetoid</center></u>",
      parent: sectionParent,
    });

    // Seed
    createElement("span", {
      innerHTML: "Seed: ",
      parent: sectionParent,
    });
    self._seedInput = createElement("input", {
      style: {
        width: "100px"
      },
      value: seed,
      parent: sectionParent,
    });
    createElement("br", {parent: sectionParent});

    // Seed
    createElement("span", {
      innerHTML: "Craters: ",
      parent: sectionParent,
    });
    self._craterCount = createElement("input", {
      style: {
        width: "100px"
      },
      value: craters,
      parent: sectionParent,
    });
    createElement("br", {parent: sectionParent});

    // Generate
    self._generate = createElement("input", {
      type: "button",
      style: {
        position: "absolute",
        right: "10px",
      },
      value: "Generate",
      onclick: function() {
        self.generate();
      },
      parent: sectionParent,
    });
  }

  function createLODSection(sectionParent) {
    createElement("h3", {
      innerHTML: "<u><center>Level of Details</center></u>",
      parent: sectionParent,
    });

    // Base
    createElement("span", {
      innerHTML: "Base: ",
      parent: sectionParent,
    });
    self._baseLOD = createElement("input", {
      style: {
        width: "100px"
      },
      value: window.baseLOD,
      parent: sectionParent,
    });
    createElement("br", {parent: sectionParent});

    // Min
    createElement("span", {
      innerHTML: "Min: ",
      parent: sectionParent,
    });
    self._minLOD = createElement("input", {
      style: {
        width: "100px"
      },
      value: window.minLOD,
      parent: sectionParent,
    });
    createElement("br", {parent: sectionParent});

    self._generate = createElement("input", {
      type: "button",
      value: "Update",
      style: {
        position: "absolute",
        right: "10px",
      },
      onclick: function() {
        window.baseLOD = parseFloat(self._baseLOD.value);
        window.minLOD = parseFloat(self._minLOD.value);
      },
      parent: sectionParent,
    });
    createElement("br", {parent: sectionParent});
  }
  function createCameraSection(sectionParent) {
    createElement("h3", {
      innerHTML: "<u><center>Camera</center></u>",
      parent: sectionParent,
    });

    createElement("span", {
      innerHTML: "Position: ",
      parent: sectionParent,
    });
    self._generate = createElement("input", {
      type: "button",
      value: "Surface",
      onclick: function() {
        cameraControls.reset();
        window.camera.position.set(0, 0, 1.01); 
        if (window.camera.refresh) {
          window.camera.refresh();
        }
      },
      parent: sectionParent,
    });
    self._generate = createElement("input", {
      type: "button",
      value: "Reset",
      onclick: function() {
        cameraControls.reset();
        window.camera.position.set(0, 0, 15); 
        if (window.camera.refresh) {
          window.camera.refresh();
        }
      },
      parent: sectionParent,
    });
  }

  function createMouseOverSection(sectionParent) {
    createElement("h3", {
      innerHTML: "<u><center>Mouse Over</center></u>",
      parent: sectionParent,
    });

    createElement("span", {
      innerHTML: "Object: ",
      parent: sectionParent,
    });
    self._mouseOverInfo = createElement("span", {
      parent: sectionParent,
    });
  }

  this._planetDiv = createElement("div", {parent: self._div});
  createPlanetoidSection(this._planetDiv);

  this._lodDiv = createElement("div", {parent: self._div});
  createLODSection(this._planetDiv);

  this._cameraDiv = createElement("div", {parent: self._div});
  createCameraSection(this._cameraDiv);

  this._mouseOverDiv = createElement("div", {parent: self._div});
  createMouseOverSection(this._mouseOverDiv);

  window.addEventListener('mousemove', function(e) {
    self.showActiveFaceInfo(e);
  }, false);


  return this;
}

DebugPanel.prototype.showActiveFaceInfo = function(e) {
  // http://soledadpenades.com/articles/three-js-tutorials/object-picking/
  var projector = new THREE.Projector();
  var raycaster = new THREE.Raycaster();
  var mouseVector = new THREE.Vector3();
  mouseVector.x = 2 * (e.clientX / document.getElementById("container").offsetWidth) - 1;
  mouseVector.y = 1 - 2 * ( e.clientY / document.getElementById("container").offsetHeight );
  mouseVector.z = 1;
  projector.unprojectVector( mouseVector, camera );
  raycaster.set( camera.position, mouseVector.sub( camera.position ).normalize() );
  var intersects = raycaster.intersectObjects( window.scene.children );
  if (intersects.length >= 1) {
    var intersect = intersects[0];
    var obj = intersect.object;
    this._mouseOverInfo.textContent = obj.name + "[" + obj.id + "]";
    this._mouseOverInfo.textContent += JSON.stringify(obj.geometry.faceVertexUvs[0][intersect.faceIndex]);
    if (intersect.face.debugInfo) {
      this._mouseOverInfo.textContent += JSON.stringify(intersect.face.debugInfo);
    }
    console.log(intersect.face);
  }
}

DebugPanel.prototype.generate = function(callback) {
  var planetoid = buildDefaultPlanetoid({
    seed: parseInt(this._seedInput.value),
    craters: parseInt(this._craterCount.value),
  });
  if (this._callback) {
    this._callback(planetoid);
  }
}
DebugPanel.prototype.generatedPlanetoidCallback = function(callback) {
  this._callback = callback;
}
