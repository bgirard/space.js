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
      },
      parent: sectionParent,
    });
    self._generate = createElement("input", {
      type: "button",
      value: "Reset",
      onclick: function() {
        cameraControls.reset();
        window.camera.position.set(0, 0, 15); 
      },
      parent: sectionParent,
    });
  }

  this._planetDiv = createElement("div", {parent: self._div});
  createPlanetoidSection(this._planetDiv);

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
