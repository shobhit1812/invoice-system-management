import { createBrowserRouter } from "react-router-dom";
import Home from "./pages/Home";
import Edit from "./pages/Edit";
import Summary from "./pages/Summary";

const App = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/edit/:id",
    element: <Edit />,
  },
  {
    path: "/summary",
    element: <Summary />,
  },
]);

export default App;
