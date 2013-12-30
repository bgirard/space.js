function createElement(name, props) {
  var el = document.createElement(name);

  for (var key in props) {
    if (key === "style") {
      for (var styleName in props.style) {
        el.style[styleName] = props.style[styleName];
      }   
    } else if (key === "parent") {
      props[key].appendChild(el);
    } else {
      el[key] = props[key];
    }   
  }   

  return el; 
}

function toMetersStr(meters) {
  var val = meters;
  if (val < 1) {
    return (val*100).toFixed(1) + "cm";
  } else if (val < 1000) {
    return (val).toFixed(1) + "m";
  } else {
    return (val/1000).toFixed(1) + "km";
  }
}

Math.EARTH_RADIUS = 6371;

