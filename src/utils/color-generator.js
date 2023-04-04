import tinycolor from "tinycolor2";

export default function getColors() {
  const colorSeed = tinycolor.random();
  let colors;
  if (Math.random() > 0.5) {
    colors = tinycolor(colorSeed).monochromatic();
  } else {
    colors = tinycolor(colorSeed).analogous();
  }

  if (colors[1].getBrightness() > 120) {
    const x = colors[1].getBrightness() - 50;
    colors[1].darken(x * x * 0.0019);
  } else if (colors[1].getBrightness() < 20) {
    colors[1].brighten(10);
  }

  if (colors[2].getBrightness() > 120) {
    const x = colors[2].getBrightness() - 50;
    colors[2].darken(x * x * 0.0019 + 5);
  } else if (colors[2].getBrightness() < 20) {
    colors[2].brighten(10);
  }

  return colors.map((col) => {
    return parseInt(col.toHex(), 16);
  });
}
