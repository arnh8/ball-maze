export function bar() {
  const top = document.createElement("div");
  top.id = "bar";

  const left = document.createElement("div");
  left.innerText = "Controls: ";
  left.id = "left";
  left.classList.add("info");

  const controls_wasd = document.createElement("p");
  controls_wasd.innerText = "- WASD to tilt the maze";
  const controls_u = document.createElement("p");
  controls_u.innerText = "- U to toggle camera perspective";
  const controls_x = document.createElement("p");
  controls_x.innerText = "- X to toggle debug meshes";
  const controls_click = document.createElement("p");
  controls_click.innerText = "- Click and drag to move the camera";
  const controls_scroll = document.createElement("p");
  controls_scroll.innerText = "- Scroll to zoom in and out";
  const controls_refresh = document.createElement("p");
  controls_refresh.innerText = "- Refresh to randomize colors";

  left.appendChild(controls_wasd);
  left.appendChild(controls_u);
  left.appendChild(controls_x);

  const button = document.createElement("button");

  const right = document.createElement("div");
  right.id = "right";

  right.classList.add("info");

  const githubLink = document.createElement("a");
  githubLink.href = "https://github.com/arnh8/ball-maze";
  githubLink.innerText = "github.com/arnh8/ball-maze";
  right.appendChild(controls_click);
  right.appendChild(controls_scroll);
  right.appendChild(controls_refresh);
  right.appendChild(githubLink);

  top.appendChild(button);

  const wrapper = document.createElement("div");
  wrapper.classList.add("wrapper", "shown");
  wrapper.appendChild(left);
  wrapper.appendChild(right);
  top.appendChild(wrapper);

  button.addEventListener("click", () => {
    button.classList.toggle("on");
    wrapper.classList.toggle("hidden");
    wrapper.classList.toggle("shown");
  });

  return top;
}
