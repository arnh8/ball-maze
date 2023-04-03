export function bar() {
  const top = document.createElement("div");
  top.id = "bar";

  const left = document.createElement("div");
  left.innerText =
    "Use WASD to tilt the maze! Refreshing generates a new maze with different colors.";
  left.id = "left";
  left.classList.add("shown", "info");

  const button = document.createElement("button");
  button.innerHTML = "!";
  button.addEventListener("click", () => {
    button.classList.toggle("on");
    right.classList.toggle("shown");
    right.classList.toggle("hidden");
    left.classList.toggle("shown");
    left.classList.toggle("hidden");
  });

  const right = document.createElement("div");
  right.id = "right";
  right.innerText = "Click and drag to move the camera, scroll to zoom. ";
  right.classList.add("shown", "info");

  const githubLink = document.createElement("a");
  githubLink.href = "https://github.com/arnh8/ball-maze";
  githubLink.innerText = "github.com/arnh8/ball-maze";
  right.appendChild(githubLink);

  top.appendChild(left);
  top.appendChild(button);
  top.appendChild(right);

  return top;
}
