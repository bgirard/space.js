function DebugPanel(container) {
  var self = this;
  this._div = document.createElement("div");
  this._div.className = "debug_panel";
  container.appendChild(this._div);

  var seed = 100;
  var craters = 500;

  createElement("h3", {
    innerHTML: "<u><center>Planetoid</center></u>",
    parent: this._div,
  });

  // Seed
  createElement("span", {
    innerHTML: "Seed: ",
    parent: this._div,
  });
  this._seedInput = createElement("input", {
    style: {
      width: "100px"
    },
    value: seed,
    parent: this._div,
  });
  createElement("br", {});

  // Seed
  createElement("span", {
    innerHTML: "Craters: ",
    parent: this._div,
  });
  this._craterCount = createElement("input", {
    style: {
      width: "100px"
    },
    value: craters,
    parent: this._div,
  });
  createElement("br", {});

  // Generate
  this._generate = createElement("input", {
    type: "button",
    style: {
      position: "absolute",
      bottom: "10px",
      right: "10px",
    },
    value: "Generate",
    onclick: function() {
      self.generate();
    },
    parent: this._div,
  });
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
