import './Layout.scss';

import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';

const Layout = (props: any) => {
    return(
      <div id="layout" className="flex flex--direction-cols flex--justify-between">
        <Header/>
        <main className="flex--grow-1">{props.children}</main>
        <Footer/>
      </div>
    )
}

export default Layout;