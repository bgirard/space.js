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

function toMetersStr(earthRadius) {
  var val = earthRadius/1.5e-7;
  if (val < 1000) {
    return (val).toFixed(0) + "m";
  } else {
    return (val/1000).toFixed(0) + "km";
  }
}


