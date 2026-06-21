import { render } from "ink";
import { App } from "./app";

// render() mounts the React tree to the terminal, like ReactDOM.render
// but for stdout. It returns handles (unmount, waitUntilExit, etc.).
render(<App />);
