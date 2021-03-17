
import { Link } from "react-router-dom";

import './Header.scss';

const Header = () => {
  return (
    <div id="header">
      <div className="nav nav--wide flex flex--justify-around">
        <Link to="/services">Services</Link>
        <div className="divider">&#9830;</div>
        <Link to="/explore">Explore</Link>
        <div className="font--medium pad--all-10">
          <Link to="/">Flaapworks</Link>
        </div>
        <Link to="/about">About</Link>
        <div className="divider">&#9830;</div>
        <Link to="/contact">Get In Touch</Link>
        
      </div>

      <div className="nav nav--thin flex flex--justify-between">
        <div className="font--medium pad--all-10 identity flex">
          <img alt="Flaapworks" className="logo" src="../assets/images/logo-150.png"/>
          <span className="flex--position-center-v">Flaapworks</span>
        </div>
        {/* click below */}
        <div className="burger mar--all-10">
          <div className="burger--handle hoverable">&#9776;</div>
          <div
            className="burger--items flex flex--direction-cols"
            // v-bind:className="{ active: active }"
          >
              <ul>
                <li>
                  <button>Flaapworks</button>
                </li>
                <li>
                  <button>Services</button>
                </li>
                <li>
                  <button>Explore</button>
                </li>
                <li>
                  <button>About</button>
                </li>
                <li>
                  <button>Get In Touch</button>
                </li>
              </ul>
            {/* <router-link to="/">Flaapworks</router-link>
            <router-link to="/services">Services</router-link>
            <router-link to="/explore">Explore</router-link>
            <router-link to="/about">About</router-link>
            <router-link to="/contact">Get In Touch</router-link> */}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header;