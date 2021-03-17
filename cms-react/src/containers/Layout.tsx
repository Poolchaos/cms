import React from 'react';

const Layout =({children}) =>{
    return(
      <div id="layout--template">
        <Header/>
        <main>{children}</main>
        <Footer/>
      </div>
    )
}

export default Layout;