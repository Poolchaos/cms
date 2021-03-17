import {
  BrowserRouter as Router,
  Switch,
  Route,Link
} from "react-router-dom";

import Layout from './containers/layout/Layout';
import Home from "./components/Home";
import About from "./components/About";

import './styles/Globals.scss';
import './styles/Theme.scss';
import './App.scss';

function App() {
  return (
    <>
      <Router>
        <Layout>
          <Switch>
            <Route exact path="/" component={Home}></Route>
            <Route exact path="/services">
              {/* <Users /> */}
              services
            </Route>
            <Route exact path="/explore">
              {/* <Home /> */}
              explore
            </Route>
            <Route exact path="/about" component={About}></Route>
            <Route exact path="/contact">
              {/* <Home /> */}
              contact
            </Route>
          </Switch>
        </Layout>
      </Router>
    </>
  );
}

export default App;
