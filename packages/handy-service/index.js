const path = require("path");
const fs = require("fs-extra");
const { extendPkgJson } = require("handy-utils-shared");
const demoAppPath = process.env.NODE_ENV !== "DEV"
  ? path.join(__dirname, "../", "handy-demo-app")
  : path.join(__dirname, "node_modules", "handy-demo-app");
const demoAppTsPath = process.env.NODE_ENV !== "DEV"
  ? path.join(__dirname, "../", "handy-demo-app-ts")
  : path.join(__dirname, "node_modules", "handy-demo-app-ts");
const demoExclude = {
  normal: [
    "src/stores",
    "src/pages/index",
    "src/pages/mobx",
    "src/modules/mobxGitSearch"
  ],
  mobx: ["src/pages/index", "src/pages/normal", "src/modules/normalGitSearch"]
};

// state management  deps
const stateManageDependencies = {
  mobx: {
    mobx: "^5.5.0",
    "mobx-react": "^5.2.8"
  }
};

const typescriptDeps = {
  "@types/react": "^16.4.18",
  "@types/react-dom": "^16.0.9",
  "@types/react-router-dom": "^4.3.1"
};

module.exports = async (appDir, answers) => {
  const { state = "normal" } = answers;
  const useTypescript = answers.features.includes("typescript");
  const ignoreContent = [
    "idea/",
    ".vscode/",
    "node_modules",
    "build/",
    ".DS_Store"
  ].join("\n");

  ["public", "src"].forEach(x => {
    fs.copySync(
      path.join(useTypescript ? demoAppTsPath : demoAppPath, x),
      path.join(appDir, x)
    );
  });

  fs.writeFileSync(path.join(appDir, ".gitignore"), ignoreContent);

  demoExclude[state].forEach(p => {
    fs.removeSync(path.join(appDir, p));
  });
  fs.moveSync(
    path.join(appDir, "src/pages", state),
    path.join(appDir, "/src/pages/index")
  );

  // remove not required  route
  const routePath = path.join(
    appDir,
    "/src/pages/index",
    useTypescript ? "routes.ts" : "routes.js"
  );
  let routeContent = fs.readFileSync(routePath, { encoding: "utf8" });
  routeContent = routeContent.replace(
    /\/\/\s+@remove-before-createApp[^@]+@remove-end-createApp/g,
    ""
  );
  fs.writeFileSync(routePath, routeContent);

  extendPkgJson(appDir)(pkg => {
    const appDeps = Object.assign(
      pkg.dependencies,
      {
        react: "^16.5.2",
        "react-dom": "^16.5.2",
        "react-router-dom": "^4.3.1",
        "whatwg-fetch": "^3.0.0"
      },
      stateManageDependencies[state] || {},
      useTypescript ? typescriptDeps : {}
    );
    pkg.dependencies = appDeps;
    return pkg;
  });
};
