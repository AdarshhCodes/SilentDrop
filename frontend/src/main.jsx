
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AppDataProvider } from "./context/AppDataContext";

ReactDOM.createRoot(document.getElementById("root")).render(
 
    <BrowserRouter>
    <AppDataProvider>
      <App />
      </AppDataProvider>
    </BrowserRouter>
);
