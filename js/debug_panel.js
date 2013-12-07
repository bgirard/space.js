function DebugPanel(container) {
  var self = this;
  this._div = document.createElement("div");
  this._div.className = "debug_panel";
  container.appendChild(this._div);

  this._seed = 100;

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
    innerHTML: "Seed: ",
    style: {
      width: "100px"
    },
    value: this._seed,
    parent: this._div,
  });

  // Generate
  this._seedInput = createElement("input", {
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
  });
  if (this._callback) {
    this._callback(planetoid);
  }
}
DebugPanel.prototype.generatedPlanetoidCallback = function(callback) {
  this._callback = callback;
}
