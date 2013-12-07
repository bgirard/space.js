function DebugPanel(container) {
  var self = this;
  this._div = document.createElement("div");
  this._div.className = "debug_panel";
  container.appendChild(this._div);


  function createPlanetoidSection(sectionParent) {
    var seed = 100;
    var craters = 500;

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

  this._planetDiv = createElement("div", {parent: self._div});
  createPlanetoidSection(this._planetDiv);

  this._lodDiv = createElement("div", {parent: self._div});
  createLODSection(this._planetDiv);

  this._cameraDiv = createElement("div", {parent: self._div});
  createCameraSection(this._cameraDiv);

  return this;
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
