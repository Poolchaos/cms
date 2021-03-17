import './Footer.scss';

const Footer = () => {
  return(
    <>
      <div id="footer">
        <div className="nav nav--wide flex flex--direction-rows flex--justify-around">
          <a
            href="https://www.termsfeed.com/live/62e38a2e-09d0-489f-9c9a-dd4077fbd722"
            rel="noreferrer"
            target="_blank"
          >
            Terms and Conditions
          </a>
          <div className="divider">&#9830;</div>
          <span>Copyright © 2021 <span>Flaapworks</span>. All Rights Reserved</span>
          <div className="divider">&#9830;</div>
          <a
            href="https://www.privacypolicies.com/live/26abdabd-88b3-4191-a0ef-763262d8ebdb"
            rel="noreferrer"
            target="_blank"
          >
            Privacy Policy
          </a>
        </div>

        <div className="nav nav--thin flex flex--direction-cols">
          <a
            href="https://www.termsfeed.com/live/62e38a2e-09d0-489f-9c9a-dd4077fbd722"
            rel="noreferrer"
            target="_blank"
          >
            Terms and Conditions
          </a>
          <a
            href="https://www.privacypolicies.com/live/26abdabd-88b3-4191-a0ef-763262d8ebdb"
            rel="noreferrer"
            target="_blank"
          >
            Privacy Policy
          </a>
          <img alt="Flaapworks" className="logo" src="../assets/images/logo-150.png" />
          <span>Copyright © 2021 <span>Flaapworks</span>. All Rights Reserved</span>
        </div>
      </div>
    </>
  )
}

export default Footer;