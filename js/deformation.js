function deformation(options) {
  this.func = options.func;
  this.bounds = options.bounds;
  this.name = options.name;
  this.paint = options.paint;
  return this;
}

deformation.prototype = {

};

function ConvolutionDeformation(centerX, centerY, options) {
  this._convolutionFunc = options.convolutionFunc;
  this.bounds = options.bounds;
  this.name = options.name || "ConvolutionDeformation";
  this.paint = options.paint;
  this._centerX = centerX;
  this._centerY = centerY;
  return this;
};

ConvolutionDeformation.prototype.func = function(tx, ty) {
  var distanceSquared = Math.sqrt((tx-this._centerX)*(tx-this._centerX) + (ty-this._centerY)*(ty-this._centerY));
  return this._convolutionFunc(tx, ty, distanceSquared);
}

deformation.convolution = function deformation_convolution(centerX, centerY, impactSize, depth) {
  var _bounds = [centerX-impactSize*1.5, centerY-impactSize*1.5, centerX+impactSize*1.5, centerY+impactSize*1.5];
  var deform = new ConvolutionDeformation(centerX, centerY, {
    name: "ConvCrater",
    convolutionFunc: function(tx, ty, distance) {
      var v = (distance - impactSize) * (distance + impactSize) / (impactSize*impactSize) * depth;
      if (v < 0) {
        console.log(v);
      }
      return Math.min(v, 0);
    },
    bounds: function() {
      return _bounds;
    },
    paint: function(ctxt) {
      ctxt.beginPath();
      ctxt.arc(centerX, centerY, impactSize, 0, 2 * Math.PI, false);
      ctxt.fillStyle = "rgba(210,210,210,0.5)";
      ctxt.fill();
    }
  });
  return deform;
}

deformation.crater = function deformation_crater(centerX, centerY, impactSize, depth) {
  var _bounds = [centerX-impactSize*1.5, centerY-impactSize*1.5, centerX+impactSize*1.5, centerY+impactSize*1.5];
  var deform = new deformation({
    name: "Crater",
    func: function(tx, ty) {
      var v = Math.min(0,
        ((tx-centerX-impactSize)*(tx-centerX+impactSize)/(impactSize*impactSize)/2 +
         (ty-centerY-impactSize)*(ty-centerY+impactSize)/(impactSize*impactSize)/2) *
        depth);

      return v;
    },
    bounds: function() {
      return _bounds;
    },
    paint: function(ctxt) {
      ctxt.beginPath();
      ctxt.arc(centerX, centerY, impactSize, 0, 2 * Math.PI, false);
      ctxt.fill();
    }
  });
  return deform;
}
deformation.crater = deformation.convolution;
deformation.noise = function deformation_noise(period, intensity) {
  var _bounds = [0, 0, 1, 1];
  var deform = new deformation({
    name: "Noise",
    func: function(tx, ty) {
      return Math.sin((ty-Math.cos(tx))*period)*intensity;
    },
    bounds: function() {
      return _bounds;
    },
  });
  return deform;
}
